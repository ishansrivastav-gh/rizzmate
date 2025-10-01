import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { profileAPI } from '../services/api';
import { 
  Plus, 
  MessageCircle, 
  Users, 
  TrendingUp, 
  Heart,
  ArrowRight,
  Calendar,
  Clock,
  Zap
} from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProfiles: 0,
    totalMessages: 0,
    successRate: 0
  });

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const response = await profileAPI.getProfiles();
      setProfiles(response.data.profiles);
      
      // Calculate stats
      const totalProfiles = response.data.profiles.length;
      let totalMessages = 0;
      let successfulMessages = 0;
      
      response.data.profiles.forEach(profile => {
        totalMessages += profile.conversationHistory.length;
        successfulMessages += profile.conversationHistory.filter(h => h.success).length;
      });
      
      setStats({
        totalProfiles,
        totalMessages,
        successRate: totalMessages > 0 ? Math.round((successfulMessages / totalMessages) * 100) : 0
      });
    } catch (error) {
      console.error('Load profiles error:', error);
      toast.error('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'free': return 'text-gray-600';
      case 'pro': return 'text-blue-600';
      case 'premium': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getPlanBadge = (plan) => {
    switch (plan) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'pro': return 'bg-blue-100 text-blue-800';
      case 'premium': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome back, {user?.name}!
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Ready to level up your conversation game?
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPlanBadge(user?.subscription?.plan)}`}>
                  {user?.subscription?.plan?.toUpperCase()} Plan
                </span>
                <Link
                  to="/profile"
                  className="btn-primary flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Profile</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-primary-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Profiles</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalProfiles}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MessageCircle className="h-8 w-8 text-secondary-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Messages</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalMessages}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Success Rate</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.successRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Overview */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage This Month</h2>
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

        {/* Recent Profiles */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Your Profiles</h2>
            <Link
              to="/profile"
              className="btn-outline flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create New</span>
            </Link>
          </div>

          {profiles.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No profiles yet</h3>
              <p className="text-gray-500 mb-6">
                Create your first profile to start getting AI-powered conversation help
              </p>
              <Link
                to="/profile"
                className="btn-primary inline-flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Create Your First Profile</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.slice(0, 6).map((profile) => (
                <div key={profile._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {profile.targetPerson?.name || 'Unnamed Profile'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {profile.targetPerson?.personality} • {profile.targetPerson?.context}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        profile.conversationStyle?.tone === 'flirty' ? 'bg-pink-100 text-pink-800' :
                        profile.conversationStyle?.tone === 'romantic' ? 'bg-red-100 text-red-800' :
                        profile.conversationStyle?.tone === 'funny' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {profile.conversationStyle?.tone}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      <span>{profile.conversationHistory.length} interactions</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Updated {new Date(profile.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <Link
                    to={`/chat/${profile._id}`}
                    className="btn-primary w-full flex items-center justify-center space-x-2"
                  >
                    <Zap className="h-4 w-4" />
                    <span>Start Chatting</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}

          {profiles.length > 6 && (
            <div className="mt-6 text-center">
              <Link
                to="/profile"
                className="btn-outline"
              >
                View All Profiles
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                to="/profile"
                className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Plus className="h-5 w-5 text-primary-500 mr-3" />
                <span>Create New Profile</span>
              </Link>
              <Link
                to="/subscription"
                className="flex items-center p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <Zap className="h-5 w-5 text-secondary-500 mr-3" />
                <span>Upgrade Plan</span>
              </Link>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tips & Tricks</h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p>• Be specific about the person's personality for better responses</p>
              <p>• Upload screenshots of conversations for context-aware suggestions</p>
              <p>• Use voice messages for more natural conversation flow</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
