


import React from 'react';
// FIX: Added missing icon imports for organization and documents steps
// FIX: Added Shirt and Fingerprint icons for the uniform and biometrics steps.
import { User, MapPin, Users, GraduationCap, Banknote, FileText, HeartHandshake, ShieldCheck, Check, Building, FileUp, Shirt, Fingerprint } from 'lucide-react';
import type { OnboardingStep } from '../../types';

interface MultiStepIndicatorProps {
  steps: OnboardingStep[];
  currentStepIndex: number;
}

// FIX: Added missing icon for 'uniform' to the map to match the OnboardingStep type.
// FIX: Added missing icon for 'biometrics' to the map to match the OnboardingStep type.
const stepIcons: Record<OnboardingStep, React.ElementType> = {
  personal: User,
  address: MapPin,
  family: Users,
  education: GraduationCap,
  bank: Banknote,
  uan: FileText,
  esi: FileText,
  gmc: HeartHandshake,
  organization: Building,
  uniform: Shirt,
  documents: FileUp,
  biometrics: Fingerprint,
  review: ShieldCheck,
};

const MultiStepIndicator: React.FC<MultiStepIndicatorProps> = ({ steps, currentStepIndex }) => {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center">
        {steps.map((step, stepIdx) => (
          <li key={step} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
            {stepIdx < currentStepIndex ? (
              // Completed step
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-accent" />
                </div>
                <div className="relative w-8 h-8 flex items-center justify-center bg-accent rounded-full">
                  <Check className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
                <span className="block mt-2 text-xs text-center capitalize text-primary-text">{step}</span>
              </>
            ) : stepIdx === currentStepIndex ? (
              // Current step
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-border" />
                </div>
                <div className="relative w-8 h-8 flex items-center justify-center bg-card border-2 border-accent rounded-full">
                  {React.createElement(stepIcons[step], { className: "w-5 h-5 text-accent", "aria-hidden": true })}
                </div>
                 <span className="block mt-2 text-xs text-center capitalize font-bold text-accent">{step}</span>
              </>
            ) : (
              // Upcoming step
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-border" />
                </div>
                <div className="relative w-8 h-8 flex items-center justify-center bg-card border-2 border-border rounded-full">
                   {React.createElement(stepIcons[step], { className: "w-5 h-5 text-muted", "aria-hidden": true })}
                </div>
                <span className="block mt-2 text-xs text-center capitalize text-muted">{step}</span>
              </>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default MultiStepIndicator;