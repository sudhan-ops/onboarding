
import React, { useState, useEffect } from 'react';
// FIX: Switched from a namespace import to named imports for react-router-dom to resolve module export errors.
import * as ReactRouterDOM from 'react-router-dom';
import { useOnboardingStore } from '../store/onboardingStore';
import { useAuthStore } from '../store/authStore';
import MultiStepIndicator from '../components/onboarding/MultiStepIndicator';
import PersonalDetailsForm from '../components/onboarding/PersonalDetailsForm';
import AddressDetailsForm from '../components/onboarding/AddressDetailsForm';
import FamilyDetailsForm from '../components/onboarding/FamilyDetailsForm';
import EducationDetailsForm from '../components/onboarding/EducationDetailsForm';
import BankDetailsForm from '../components/onboarding/BankDetailsForm';
import UANDetailsForm from '../components/onboarding/UANDetailsForm';
import ESIDetailsForm from '../components/onboarding/ESIDetailsForm';
import GMCDetailsForm from '../components/onboarding/GMCDetailsForm';
import ReviewSubmit from '../components/onboarding/ReviewSubmit';
import Button from '../components/ui/Button';
import Toast from '../components/ui/Toast';
import { api } from '../services/api';
import type { OnboardingStep } from '../types';
import { Loader2 } from 'lucide-react';

const steps: OnboardingStep[] = ['personal', 'address', 'family', 'education', 'bank', 'uan', 'esi', 'gmc', 'review'];

const OnboardingForm: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const { data, reset, setData } = useOnboardingStore();
    const { user } = useAuthStore();
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const navigate = ReactRouterDOM.useNavigate();
    const [searchParams] = ReactRouterDOM.useSearchParams();

    useEffect(() => {
        const submissionId = searchParams.get('id');
        const fetchAndSetData = async (id: string) => {
            setIsLoadingData(true);
            try {
                const submissionData = await api.getOnboardingDataById(id);
                if (submissionData) {
                    setData(submissionData);
                } else {
                    setToast({ message: "Could not find submission data.", type: 'error' });
                    reset();
                }
            } catch (error) {
                console.error("Failed to fetch submission data", error);
                setToast({ message: "Failed to load submission data.", type: 'error' });
                reset();
            } finally {
                setIsLoadingData(false);
            }
        };

        if (submissionId) {
            fetchAndSetData(submissionId);
        } else {
            // For a new form, we rely on the draft loaded by the store.
            setIsLoadingData(false);
        }
    }, [searchParams, setData, reset]);
    
    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep + 1);
        }
    };
    
    const handleSaveDraft = async () => {
        setIsSaving(true);
        try {
            await api.saveDraft(data);
            setToast({ message: 'Draft saved successfully!', type: 'success' });
        } catch (error) {
            setToast({ message: 'Failed to save draft.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        
        try {
            const isEditing = !!data.id && !data.id.startsWith('draft_');

            if (isEditing) {
                await api.updateOnboarding(data);
                setToast({ message: 'Application updated successfully!', type: 'success' });
            } else {
                await api.submitOnboarding(data);
                setToast({ message: 'Application submitted successfully!', type: 'success' });
            }
            
            setTimeout(() => {
                reset();
                if (user?.role === 'site_manager') {
                    navigate('/site/dashboard');
                } else if (user?.role === 'admin') {
                    navigate('/admin/dashboard');
                } else {
                    navigate('/onboarding');
                }
            }, 2000);
        } catch (error) {
            setToast({ message: 'Failed to submit application.', type: 'error' });
            setIsSubmitting(false);
        }
    };
    
    const renderStep = () => {
        const stepName = steps[currentStep];
        switch (stepName) {
            case 'personal': return <PersonalDetailsForm onValidated={handleNext} />;
            case 'address': return <AddressDetailsForm onValidated={handleNext} />;
            case 'family': return <FamilyDetailsForm />;
            case 'education': return <EducationDetailsForm />;
            case 'bank': return <BankDetailsForm onValidated={handleNext} />;
            case 'uan': return <UANDetailsForm />;
            case 'esi': return <ESIDetailsForm />;
            case 'gmc': return <GMCDetailsForm onValidated={handleNext} />;
            case 'review': return <ReviewSubmit onSubmit={handleSubmit} isSubmitting={isSubmitting} />;
            default: return null;
        }
    };

    if (isLoadingData) {
        return (
            <div className="flex flex-col justify-center items-center h-96 text-muted">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Loading submission data...</p>
            </div>
        );
    }

    const isReviewStep = steps[currentStep] === 'review';
    const isDynamicListStep = ['family', 'education', 'uan', 'esi'].includes(steps[currentStep]);
    const isGmcStep = steps[currentStep] === 'gmc';
    const isGmcApplicable = data.personal.salary != null && data.personal.salary > 21000;

    return (
        <div className="max-w-6xl mx-auto">
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
            <MultiStepIndicator steps={steps} currentStepIndex={currentStep} />
            <div className="mt-8 bg-card p-6 sm:p-8 rounded-xl shadow-card">
                {renderStep()}
            </div>
            <div className="mt-8 flex justify-between items-center">
                <Button onClick={handleBack} disabled={currentStep === 0} variant="secondary">
                    Back
                </Button>
                <div className="flex gap-4">
                    {!isReviewStep && (
                        <Button onClick={handleSaveDraft} variant="outline" isLoading={isSaving} disabled={isSubmitting}>
                            Save Draft
                        </Button>
                    )}
                    {!isReviewStep && (
                       (isGmcStep && !isGmcApplicable) || isDynamicListStep ? 
                       <Button onClick={handleNext}>Next</Button> :
                       <Button type="submit" form={steps[currentStep] + '-form'}>Next</Button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OnboardingForm;