const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Subscription plans
const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    currency: 'inr',
    features: {
      messages: 50,
      images: 10,
      voiceMinutes: 5
    }
  },
  pro: {
    name: 'Pro',
    price: 20000, // 200 INR in paise
    currency: 'inr',
    features: {
      messages: 500,
      images: 100,
      voiceMinutes: 60
    }
  },
  premium: {
    name: 'Premium',
    price: 50000, // 500 INR in paise
    currency: 'inr',
    features: {
      messages: -1, // unlimited
      images: -1, // unlimited
      voiceMinutes: -1 // unlimited
    }
  }
};

// Get available plans
router.get('/plans', (req, res) => {
  res.json({ plans: PLANS });
});

// Create payment intent for subscription
router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { plan } = req.body;

    if (!plan || !PLANS[plan]) {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }

    if (plan === 'free') {
      return res.status(400).json({ message: 'Free plan does not require payment' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create or get Stripe customer
    let customerId = user.subscription.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: {
          userId: user._id.toString()
        }
      });
      customerId = customer.id;
      user.subscription.stripeCustomerId = customerId;
      await user.save();
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: PLANS[plan].price,
      currency: PLANS[plan].currency,
      customer: customerId,
      metadata: {
        userId: user._id.toString(),
        plan: plan
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      plan: PLANS[plan]
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ message: 'Failed to create payment intent' });
  }
});

// Handle successful payment
router.post('/confirm-payment', auth, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ message: 'Payment intent ID is required' });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not successful' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const plan = paymentIntent.metadata.plan;

    // Update user subscription
    user.subscription.plan = plan;
    user.subscription.startDate = new Date();
    
    // Set end date (1 month from now)
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    user.subscription.endDate = endDate;

    // Reset usage for new subscription
    user.usage.messagesThisMonth = 0;
    user.usage.imagesThisMonth = 0;
    user.usage.voiceMinutesThisMonth = 0;
    user.usage.lastResetDate = new Date();

    await user.save();

    res.json({
      message: 'Subscription updated successfully',
      subscription: user.subscription
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Failed to confirm payment' });
  }
});

// Get current subscription
router.get('/current', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if subscription is expired
    if (user.subscription.endDate && new Date() > user.subscription.endDate) {
      user.subscription.plan = 'free';
      await user.save();
    }

    const plan = PLANS[user.subscription.plan];

    res.json({
      subscription: user.subscription,
      plan: plan,
      usage: user.usage
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ message: 'Failed to get subscription' });
  }
});

// Cancel subscription
router.post('/cancel', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Cancel Stripe subscription if exists
    if (user.subscription.stripeSubscriptionId) {
      await stripe.subscriptions.cancel(user.subscription.stripeSubscriptionId);
    }

    // Downgrade to free plan
    user.subscription.plan = 'free';
    user.subscription.endDate = null;
    user.subscription.stripeSubscriptionId = null;

    await user.save();

    res.json({
      message: 'Subscription cancelled successfully',
      subscription: user.subscription
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Failed to cancel subscription' });
  }
});

// Webhook for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      break;
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      console.log('Subscription cancelled:', subscription.id);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = router;
