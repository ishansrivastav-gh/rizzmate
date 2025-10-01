import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Heart } from 'lucide-react';

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        navigate('/login?error=oauth_failed');
        return;
      }

      if (token) {
        try {
          // Store the token
          localStorage.setItem('token', token);
          
          // Refresh user data
          await refreshUser();
          
          // Redirect to dashboard
          navigate('/dashboard');
        } catch (error) {
          console.error('Token handling error:', error);
          navigate('/login?error=token_failed');
        }
      } else {
        navigate('/login?error=no_token');
      }
    };

    handleCallback();
  }, [searchParams, navigate, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Heart className="h-16 w-16 text-primary-500 mx-auto mb-4 animate-bounce-gentle" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Completing your login...
        </h2>
        <p className="text-gray-600">
          Please wait while we set up your account.
        </p>
        <div className="mt-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
