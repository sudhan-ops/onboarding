
import React, { useState, useEffect } from 'react';
// FIX: Corrected named imports from react-router-dom to resolve module export errors.
import * as ReactRouterDOM from 'react-router-dom';
import Button from '../components/ui/Button';
import { useOnboardingStore } from '../store/onboardingStore';
import { FileSignature } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { ProfilePlaceholder } from '../components/ui/ProfilePlaceholder';

const OnboardingHome: React.FC = () => {
  const navigate = ReactRouterDOM.useNavigate();
  const { data, reset } = useOnboardingStore();
  const { user } = useAuthStore();
  const hasDraft = data.personal.firstName || data.personal.lastName;

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleStart = () => {
    reset(); // Start fresh
    navigate('/onboarding/select-organization');
  };

  const handleContinue = () => {
    navigate('/onboarding/add/personal');
  };
  
  const isMobileView = user?.role === 'field_officer' && isMobile;

  if (isMobileView && user) {
    return (
      <div className="h-full flex flex-col p-6 text-center relative">
        <header className="fo-home-header">
            <ReactRouterDOM.Link to="/profile" className="fo-home-profile-icon">
                <ProfilePlaceholder photoUrl={user.photoUrl} />
            </ReactRouterDOM.Link>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center">
            <div className="mb-12">
              <h1 className="text-3xl font-bold text-white mb-2">Welcome to Employee Onboarding</h1>
              <p className="text-gray-400">
                We need to collect some information to get you set up. This should only take a few minutes.
              </p>
            </div>
        </div>
        
        <footer className="flex flex-col gap-3">
            {hasDraft && (
                <Button onClick={handleContinue} className="w-full !py-3 fo-btn-secondary">
                    Continue Previous Application
                </Button>
            )}
            <Button onClick={handleStart} className="w-full !py-3 !text-lg fo-btn-primary">
                Start New Application
            </Button>
        </footer>
      </div>
    );
  }


  return (
    <div className="h-full flex items-center justify-center">
        <div className="bg-card p-8 rounded-xl shadow-card max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-accent-light p-4 rounded-full">
                <FileSignature className="h-12 w-12 text-accent-dark" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-primary-text mb-2">Welcome to Employee Onboarding</h2>
          <p className="text-muted mb-8 max-w-md mx-auto">
            We need to collect some information to get you set up. This should only take a few minutes.
          </p>
          
          <div className="mt-10 flex justify-center items-center gap-4 flex-wrap">
            {hasDraft && (
              <Button onClick={handleContinue} variant="secondary">
                Continue Draft
              </Button>
            )}
            <Button onClick={handleStart} variant="primary">
              {hasDraft ? 'Start Fresh' : 'Start New Application'}
            </Button>
          </div>
        </div>
    </div>
  );
};

export default OnboardingHome;