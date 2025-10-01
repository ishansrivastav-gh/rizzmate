import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscriptionAPI } from '../services/api';
import { 
  CheckCircle, 
  X, 
  CreditCard, 
  Zap,
  Crown,
  Star,
  ArrowRight,
  Loader
} from 'lucide-react';
import toast from 'react-hot-toast';

const Subscription = () => {
  const { user, refreshUser } = useAuth();
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [plansResponse, subscriptionResponse] = await Promise.all([
        subscriptionAPI.getPlans(),
        subscriptionAPI.getCurrentSubscription()
      ]);
      
      setPlans(plansResponse.data.plans);
      setCurrentSubscription(subscriptionResponse.data);
    } catch (error) {
      console.error('Load subscription data error:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan) => {
    if (plan === 'free') {
      toast.error('You are already on the free plan');
      return;
    }

    if (user?.subscription?.plan === plan) {
      toast.error('You are already on this plan');
      return;
    }

    setSelectedPlan(plan);
    setProcessing(true);

    try {
      const response = await subscriptionAPI.createPaymentIntent(plan);
      const { clientSecret } = response.data;

      // Initialize Stripe
      const stripe = window.Stripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
      
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: {
            // You would collect card details here
            // For demo purposes, we'll use a test card
          }
        }
      });

      if (error) {
        toast.error(error.message);
      } else if (paymentIntent.status === 'succeeded') {
        // Confirm payment on backend
        await subscriptionAPI.confirmPayment(paymentIntent.id);
        toast.success('Subscription upgraded successfully!');
        await refreshUser();
        await loadData();
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setProcessing(false);
      setSelectedPlan(null);
    }
  };

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel your subscription?')) {
      try {
        await subscriptionAPI.cancelSubscription();
        toast.success('Subscription cancelled successfully');
        await refreshUser();
        await loadData();
      } catch (error) {
        console.error('Cancel subscription error:', error);
        toast.error('Failed to cancel subscription');
      }
    }
  };

  const getPlanIcon = (planName) => {
    switch (planName.toLowerCase()) {
      case 'free': return <Star className="h-8 w-8 text-gray-500" />;
      case 'pro': return <Zap className="h-8 w-8 text-blue-500" />;
      case 'premium': return <Crown className="h-8 w-8 text-purple-500" />;
      default: return <Star className="h-8 w-8 text-gray-500" />;
    }
  };

  const getPlanColor = (planName) => {
    switch (planName.toLowerCase()) {
      case 'free': return 'border-gray-200';
      case 'pro': return 'border-blue-500 bg-blue-50';
      case 'premium': return 'border-purple-500 bg-purple-50';
      default: return 'border-gray-200';
    }
  };

  const getFeatureIcon = (feature) => {
    if (feature.includes('Unlimited') || feature.includes('∞')) {
      return <Zap className="h-4 w-4 text-green-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock the full potential of RizzMate with our premium features
          </p>
        </div>

        {/* Current Plan Status */}
        {currentSubscription && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Current Plan: {currentSubscription.subscription.plan.toUpperCase()}
                </h2>
                <p className="text-sm text-gray-500">
                  {currentSubscription.subscription.endDate 
                    ? `Expires on ${new Date(currentSubscription.subscription.endDate).toLocaleDateString()}`
                    : 'No expiration date'
                  }
                </p>
              </div>
              {currentSubscription.subscription.plan !== 'free' && (
                <button
                  onClick={handleCancel}
                  className="btn-outline text-red-600 border-red-600 hover:bg-red-50"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>
        )}

        {/* Usage Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Usage This Month</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">Messages</span>
                <span className="text-sm text-gray-900">
                  {user?.usage?.messagesThisMonth || 0} / {user?.subscription?.plan === 'free' ? '50' : user?.subscription?.plan === 'pro' ? '500' : '∞'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-500 h-2 rounded-full" 
                  style={{ 
                    width: `${Math.min(100, ((user?.usage?.messagesThisMonth || 0) / (user?.subscription?.plan === 'free' ? 50 : user?.subscription?.plan === 'pro' ? 500 : 1)) * 100)}%` 
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">Images</span>
                <span className="text-sm text-gray-900">
                  {user?.usage?.imagesThisMonth || 0} / {user?.subscription?.plan === 'free' ? '10' : user?.subscription?.plan === 'pro' ? '100' : '∞'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-secondary-500 h-2 rounded-full" 
                  style={{ 
                    width: `${Math.min(100, ((user?.usage?.imagesThisMonth || 0) / (user?.subscription?.plan === 'free' ? 10 : user?.subscription?.plan === 'pro' ? 100 : 1)) * 100)}%` 
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-500">Voice Minutes</span>
                <span className="text-sm text-gray-900">
                  {user?.usage?.voiceMinutesThisMonth || 0} / {user?.subscription?.plan === 'free' ? '5' : user?.subscription?.plan === 'pro' ? '60' : '∞'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ 
                    width: `${Math.min(100, ((user?.usage?.voiceMinutesThisMonth || 0) / (user?.subscription?.plan === 'free' ? 5 : user?.subscription?.plan === 'pro' ? 60 : 1)) * 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Object.entries(plans).map(([planKey, plan]) => (
            <div
              key={planKey}
              className={`relative rounded-lg border-2 p-8 ${
                getPlanColor(plan.name)
              } ${
                user?.subscription?.plan === planKey ? 'ring-2 ring-primary-500' : ''
              }`}
            >
              {user?.subscription?.plan === planKey && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Current Plan
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  {getPlanIcon(plan.name)}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="text-4xl font-bold text-primary-500 mb-1">
                  ₹{plan.price === 0 ? '0' : plan.price / 100}
                </div>
                <p className="text-gray-600">
                  {plan.price === 0 ? 'forever' : 'per month'}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {Object.entries(plan.features).map(([feature, value]) => (
                  <li key={feature} className="flex items-center">
                    {getFeatureIcon(`${feature}: ${value === -1 ? 'Unlimited' : value}`)}
                    <span className="ml-3 text-gray-600">
                      {feature.charAt(0).toUpperCase() + feature.slice(1)}: {value === -1 ? 'Unlimited' : value}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(planKey)}
                disabled={processing || user?.subscription?.plan === planKey}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                  user?.subscription?.plan === planKey
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : planKey === 'free'
                    ? 'btn-outline'
                    : planKey === 'pro'
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
              >
                {processing && selectedPlan === planKey ? (
                  <div className="flex items-center justify-center">
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </div>
                ) : user?.subscription?.plan === planKey ? (
                  'Current Plan'
                ) : planKey === 'free' ? (
                  'Downgrade to Free'
                ) : (
                  <div className="flex items-center justify-center">
                    Upgrade to {plan.name}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </div>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Features Comparison */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            Feature Comparison
          </h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Features
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Free
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pro
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Premium
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Messages per month
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    50
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    500
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    Unlimited
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Image uploads per month
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    10
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    100
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    Unlimited
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Voice processing minutes
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    5
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    60
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    Unlimited
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    AI response quality
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    Basic
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    Advanced
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    Premium
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Priority support
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    <X className="h-4 w-4 text-red-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Advanced analytics
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    <X className="h-4 w-4 text-red-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    <X className="h-4 w-4 text-red-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
