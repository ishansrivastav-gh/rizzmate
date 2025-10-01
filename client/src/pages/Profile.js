import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { profileAPI } from '../services/api';
import { 
  Plus, 
  Edit, 
  Trash2, 
  MessageCircle, 
  Calendar,
  TrendingUp,
  Users,
  Settings,
  ArrowRight,
  Heart
} from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [formData, setFormData] = useState({
    targetPerson: {
      name: '',
      personality: 'unknown',
      relationship: 'stranger',
      context: 'online',
      interests: [],
      age: '',
      occupation: '',
      location: '',
      notes: ''
    },
    conversationStyle: {
      tone: 'casual',
      approach: 'subtle',
      language: 'en'
    }
  });

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const response = await profileAPI.getProfiles();
      setProfiles(response.data.profiles);
    } catch (error) {
      console.error('Load profiles error:', error);
      toast.error('Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingProfile) {
        await profileAPI.updateProfile(editingProfile._id, formData);
        toast.success('Profile updated successfully');
      } else {
        await profileAPI.createProfile(formData);
        toast.success('Profile created successfully');
      }
      
      setShowCreateModal(false);
      setEditingProfile(null);
      resetForm();
      loadProfiles();
    } catch (error) {
      console.error('Save profile error:', error);
      toast.error('Failed to save profile');
    }
  };

  const handleEdit = (profile) => {
    setFormData({
      targetPerson: {
        name: profile.targetPerson?.name || '',
        personality: profile.targetPerson?.personality || 'unknown',
        relationship: profile.targetPerson?.relationship || 'stranger',
        context: profile.targetPerson?.context || 'online',
        interests: profile.targetPerson?.interests || [],
        age: profile.targetPerson?.age || '',
        occupation: profile.targetPerson?.occupation || '',
        location: profile.targetPerson?.location || '',
        notes: profile.targetPerson?.notes || ''
      },
      conversationStyle: {
        tone: profile.conversationStyle?.tone || 'casual',
        approach: profile.conversationStyle?.approach || 'subtle',
        language: profile.conversationStyle?.language || 'en'
      }
    });
    setEditingProfile(profile);
    setShowCreateModal(true);
  };

  const handleDelete = async (profileId) => {
    if (window.confirm('Are you sure you want to delete this profile?')) {
      try {
        await profileAPI.deleteProfile(profileId);
        toast.success('Profile deleted successfully');
        loadProfiles();
      } catch (error) {
        console.error('Delete profile error:', error);
        toast.error('Failed to delete profile');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      targetPerson: {
        name: '',
        personality: 'unknown',
        relationship: 'stranger',
        context: 'online',
        interests: [],
        age: '',
        occupation: '',
        location: '',
        notes: ''
      },
      conversationStyle: {
        tone: 'casual',
        approach: 'subtle',
        language: 'en'
      }
    });
  };

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const getPersonalityColor = (personality) => {
    switch (personality) {
      case 'introvert': return 'bg-blue-100 text-blue-800';
      case 'extrovert': return 'bg-green-100 text-green-800';
      case 'ambivert': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getToneColor = (tone) => {
    switch (tone) {
      case 'flirty': return 'bg-pink-100 text-pink-800';
      case 'romantic': return 'bg-red-100 text-red-800';
      case 'funny': return 'bg-yellow-100 text-yellow-800';
      case 'intellectual': return 'bg-indigo-100 text-indigo-800';
      case 'mysterious': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Profiles</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your conversation profiles and settings
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setEditingProfile(null);
              setShowCreateModal(true);
            }}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Profile</span>
          </button>
        </div>

        {/* Profiles Grid */}
        {profiles.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No profiles yet</h3>
            <p className="text-gray-500 mb-6">
              Create your first profile to start getting personalized AI responses
            </p>
            <button
              onClick={() => {
                resetForm();
                setEditingProfile(null);
                setShowCreateModal(true);
              }}
              className="btn-primary"
            >
              Create Your First Profile
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <div key={profile._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {profile.targetPerson?.name || 'Unnamed Profile'}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPersonalityColor(profile.targetPerson?.personality)}`}>
                        {profile.targetPerson?.personality}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getToneColor(profile.conversationStyle?.tone)}`}>
                        {profile.conversationStyle?.tone}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {profile.targetPerson?.relationship} • {profile.targetPerson?.context}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEdit(profile)}
                      className="p-2 text-gray-400 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(profile._id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    <span>{profile.conversationHistory.length} interactions</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Updated {new Date(profile.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <Link
                  to={`/chat/${profile._id}`}
                  className="btn-primary w-full flex items-center justify-center space-x-2"
                >
                  <span>Start Chatting</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Profile Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {editingProfile ? 'Edit Profile' : 'Create New Profile'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Target Person Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Target Person</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={formData.targetPerson.name}
                        onChange={(e) => handleInputChange('targetPerson', 'name', e.target.value)}
                        className="input-field"
                        placeholder="Enter their name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Age
                      </label>
                      <input
                        type="number"
                        value={formData.targetPerson.age}
                        onChange={(e) => handleInputChange('targetPerson', 'age', e.target.value)}
                        className="input-field"
                        placeholder="Enter their age"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Personality
                      </label>
                      <select
                        value={formData.targetPerson.personality}
                        onChange={(e) => handleInputChange('targetPerson', 'personality', e.target.value)}
                        className="input-field"
                      >
                        <option value="unknown">Unknown</option>
                        <option value="introvert">Introvert</option>
                        <option value="extrovert">Extrovert</option>
                        <option value="ambivert">Ambivert</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Relationship
                      </label>
                      <select
                        value={formData.targetPerson.relationship}
                        onChange={(e) => handleInputChange('targetPerson', 'relationship', e.target.value)}
                        className="input-field"
                      >
                        <option value="stranger">Stranger</option>
                        <option value="acquaintance">Acquaintance</option>
                        <option value="friend">Friend</option>
                        <option value="colleague">Colleague</option>
                        <option value="classmate">Classmate</option>
                        <option value="online">Online</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Context
                      </label>
                      <select
                        value={formData.targetPerson.context}
                        onChange={(e) => handleInputChange('targetPerson', 'context', e.target.value)}
                        className="input-field"
                      >
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                        <option value="college">College</option>
                        <option value="work">Work</option>
                        <option value="social">Social</option>
                        <option value="dating_app">Dating App</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Occupation
                      </label>
                      <input
                        type="text"
                        value={formData.targetPerson.occupation}
                        onChange={(e) => handleInputChange('targetPerson', 'occupation', e.target.value)}
                        className="input-field"
                        placeholder="Enter their occupation"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.targetPerson.notes}
                      onChange={(e) => handleInputChange('targetPerson', 'notes', e.target.value)}
                      className="input-field"
                      rows={3}
                      placeholder="Any additional notes about this person..."
                    />
                  </div>
                </div>

                {/* Conversation Style Section */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Conversation Style</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tone
                      </label>
                      <select
                        value={formData.conversationStyle.tone}
                        onChange={(e) => handleInputChange('conversationStyle', 'tone', e.target.value)}
                        className="input-field"
                      >
                        <option value="casual">Casual</option>
                        <option value="flirty">Flirty</option>
                        <option value="romantic">Romantic</option>
                        <option value="funny">Funny</option>
                        <option value="intellectual">Intellectual</option>
                        <option value="mysterious">Mysterious</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Approach
                      </label>
                      <select
                        value={formData.conversationStyle.approach}
                        onChange={(e) => handleInputChange('conversationStyle', 'approach', e.target.value)}
                        className="input-field"
                      >
                        <option value="direct">Direct</option>
                        <option value="subtle">Subtle</option>
                        <option value="playful">Playful</option>
                        <option value="sincere">Sincere</option>
                        <option value="teasing">Teasing</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingProfile(null);
                      resetForm();
                    }}
                    className="btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {editingProfile ? 'Update Profile' : 'Create Profile'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
