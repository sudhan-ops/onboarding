import React, { useMemo } from 'react';
import { Check } from 'lucide-react';
import type { Step } from '../types/stepper';

interface StepperProps {
  steps: Step[];
  currentStepIndex: number;
  onStepClick: (index: number) => void;
  highestStepReached: number;
  isMobileOptimized?: boolean;
}

const Stepper: React.FC<StepperProps> = ({ steps, currentStepIndex, onStepClick, highestStepReached, isMobileOptimized = false }) => {
  const progressPercentage = currentStepIndex > 0
    ? (currentStepIndex / (steps.length - 1)) * 100
    : 0;

  // Calculate the margin to align the progress bar with the center of the first and last icons.
  // Each step's slot is 100% / num_steps wide. The margin is half of that.
  const itemSlotPercent = 100 / steps.length;
  const marginPercent = itemSlotPercent / 2;

  const visibleSteps = useMemo(() => {
    if (!isMobileOptimized) {
      return steps.map((_, index) => index);
    }
    
    const maxVisibleSteps = 3;
    if (steps.length <= maxVisibleSteps) {
      return steps.map((_, index) => index);
    }
    
    let startIndex = Math.max(0, currentStepIndex - 1);
    let endIndex = startIndex + maxVisibleSteps;
    
    if (endIndex > steps.length) {
      endIndex = steps.length;
      startIndex = Math.max(0, endIndex - maxVisibleSteps);
    }
    
    const visibleIndices: number[] = [];
    for (let i = startIndex; i < endIndex; i++) {
        visibleIndices.push(i);
    }
    return visibleIndices;

  }, [steps.length, currentStepIndex, isMobileOptimized]);

  return (
    <nav aria-label="Onboarding Progress" className="py-4">
      <div className="relative">
        {/* Container for progress bars, inset to align with icon centers */}
        <div
          className="absolute top-4 h-1"
          style={{ left: `${marginPercent}%`, right: `${marginPercent}%` }}
        >
          {/* Progress Bar Background */}
          <div className="w-full h-full bg-border rounded-full" />

          {/* Progress Bar Fill */}
          <div
            className="absolute top-0 left-0 h-full bg-accent rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <ol role="list" className="relative flex items-center">
          {steps.map((step, index) => {
            const isComplete = index < currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const canClick = index <= highestStepReached;
            const isVisibleOnMobile = visibleSteps.includes(index);

            const handleStepClick = () => {
              if (canClick) {
                onStepClick(index);
              }
            };

            return (
              // Use flex-1 to give each step an equal-width slot. The icon will be centered within this slot, ensuring even spacing.
              <li key={step.key} className="flex-1">
                <div
                  className={`relative flex flex-col items-center group transition-opacity duration-300 ${isMobileOptimized && !isVisibleOnMobile ? 'opacity-0 md:opacity-100 pointer-events-none md:pointer-events-auto' : 'opacity-100'}`}
                  aria-hidden={isMobileOptimized && !isVisibleOnMobile}
                >
                  <button
                    type="button"
                    onClick={handleStepClick}
                    disabled={!canClick}
                    className="flex flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-dark focus-visible:ring-offset-2 rounded-full disabled:cursor-not-allowed"
                    aria-current={isCurrent ? 'step' : undefined}
                    aria-label={`Step ${index + 1}: ${step.label}, Status: ${step.status}`}
                    title={step.label}
                  >
                    <div
                      className={`
                        relative flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 border-2 z-10
                        ${isComplete ? 'bg-accent border-accent text-white' : ''}
                        ${isCurrent ? 'bg-card border-accent text-accent scale-110' : ''}
                        ${!isComplete && !isCurrent ? 'bg-card border-border text-muted' : ''}
                        ${canClick ? 'group-hover:border-accent-dark' : ''}
                      `}
                    >
                      {isComplete ? <Check className="w-5 h-5" /> : React.createElement(step.icon, { className: 'w-5 h-5' })}
                    </div>
                  </button>
                  <span className={`
                        hidden sm:block absolute top-12 w-24 text-center text-xs transition-colors duration-300
                        ${isCurrent ? 'text-accent font-bold' : 'text-muted'}
                        ${canClick ? 'group-hover:text-primary-text' : ''}
                  `}>
                    {step.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
};

export default Stepper;