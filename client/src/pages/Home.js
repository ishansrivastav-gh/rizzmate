import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Heart, 
  MessageCircle, 
  Camera, 
  Mic, 
  Image, 
  Zap,
  Shield,
  Smartphone,
  Users,
  ArrowRight,
  CheckCircle
} from 'lucide-react';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: <MessageCircle className="h-8 w-8 text-primary-500" />,
      title: "Smart Text Analysis",
      description: "Get AI-powered responses to help you craft the perfect message"
    },
    {
      icon: <Camera className="h-8 w-8 text-primary-500" />,
      title: "Screenshot Analysis",
      description: "Upload screenshots and get contextual flirtatious responses"
    },
    {
      icon: <Image className="h-8 w-8 text-primary-500" />,
      description: "Image Understanding",
      description: "AI analyzes images to suggest perfect conversation starters"
    },
    {
      icon: <Mic className="h-8 w-8 text-primary-500" />,
      title: "Voice Processing",
      description: "Convert voice messages to text and get smart responses"
    }
  ];

  const plans = [
    {
      name: "Free",
      price: "₹0",
      period: "forever",
      features: [
        "50 messages per month",
        "10 image uploads",
        "5 minutes voice processing",
        "Basic AI responses"
      ],
      buttonText: "Get Started",
      buttonStyle: "btn-outline"
    },
    {
      name: "Pro",
      price: "₹200",
      period: "per month",
      features: [
        "500 messages per month",
        "100 image uploads",
        "60 minutes voice processing",
        "Advanced AI responses",
        "Priority support"
      ],
      buttonText: "Upgrade to Pro",
      buttonStyle: "btn-primary",
      popular: true
    },
    {
      name: "Premium",
      price: "₹500",
      period: "per month",
      features: [
        "Unlimited messages",
        "Unlimited image uploads",
        "Unlimited voice processing",
        "Premium AI responses",
        "Priority support",
        "Advanced analytics"
      ],
      buttonText: "Go Premium",
      buttonStyle: "btn-secondary"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <Heart className="h-16 w-16 text-primary-500 animate-bounce-gentle" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Master the Art of
              <span className="text-primary-500 block">Digital Flirting</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              RizzMate is your AI-powered wingman that helps you craft perfect responses, 
              analyze screenshots, and start conversations that actually work.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link to="/dashboard" className="btn-primary text-lg px-8 py-3">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn-primary text-lg px-8 py-3">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link to="/login" className="btn-outline text-lg px-8 py-3">
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Rizz
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our AI understands context, personality, and conversation flow to give you 
              the perfect responses every time.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
                <div className="flex justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How RizzMate Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to become a conversation master
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="bg-primary-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Create Your Profile
              </h3>
              <p className="text-gray-600">
                Tell us about the person you want to connect with - their personality, 
                relationship to you, and context.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Share Your Content
              </h3>
              <p className="text-gray-600">
                Upload text, images, screenshots, or voice messages. Our AI analyzes 
                everything to understand the context.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-500 text-white rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Get Perfect Responses
              </h3>
              <p className="text-gray-600">
                Receive AI-crafted responses that match the situation, personality, 
                and conversation style.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Start free and upgrade as you need more features
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <div key={index} className={`relative p-8 rounded-lg border-2 ${
                plan.popular 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-200 bg-white'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="text-4xl font-bold text-primary-500 mb-1">
                    {plan.price}
                  </div>
                  <p className="text-gray-600">
                    {plan.period}
                  </p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={isAuthenticated ? "/subscription" : "/register"}
                  className={`w-full ${plan.buttonStyle} text-center block`}
                >
                  {plan.buttonText}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Level Up Your Game?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already mastering the art of digital conversation
          </p>
          {!isAuthenticated && (
            <Link to="/register" className="bg-white text-primary-500 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg text-lg transition-colors duration-200 inline-flex items-center">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
