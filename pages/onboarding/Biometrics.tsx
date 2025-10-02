import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useOnboardingStore } from '../../store/onboardingStore';
import FormHeader from '../../components/onboarding/FormHeader';
import UploadDocument from '../../components/UploadDocument';
import type { UploadedFile, Fingerprints } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';

const Biometrics: React.FC = () => {
    const { onValidated } = useOutletContext<{ onValidated: () => Promise<void> }>();
    const { data, updateBiometrics } = useOnboardingStore();
    const { user } = useAuthStore();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobileView = user?.role === 'field_officer' && isMobile;

    const handleSignatureUpload = (file: UploadedFile | null) => {
        updateBiometrics({ signatureImage: file });
    };

    const handleFingerprintUpload = (hand: keyof Fingerprints, file: UploadedFile | null) => {
        updateBiometrics({ fingerprints: { ...data.biometrics.fingerprints, [hand]: file } });
    };
    
    const handleFingerprintVerification = async (base64: string, mimeType: string): Promise<{ success: boolean; reason: string }> => {
        try {
            const result = await api.verifyFingerprintImage(base64, mimeType);
            if (!result.containsFingerprints) {
                return { success: false, reason: result.reason || 'Image does not appear to contain fingerprints. Please upload a clear scan.' };
            }
            return { success: true, reason: '' };
        } catch (error: any) {
            return { success: false, reason: error.message || 'AI verification failed.' };
        }
    };

    const onSubmit = async () => {
        await onValidated();
    };

    return (
        <form onSubmit={e => { e.preventDefault(); onSubmit(); }} id="biometrics-form">
            {!isMobileView && <FormHeader title="Biometrics" subtitle="Please provide fingerprint scans and an optional signature." />}
            
             <div className="space-y-8">
                {/* Fingerprints Section */}
                <div>
                    <h4 className={`text-lg font-semibold text-center mb-4 ${isMobileView ? 'text-white' : 'text-primary-text'}`}>Fingerprints</h4>
                    <p className={`text-center mb-4 ${isMobileView ? 'text-gray-400' : 'text-muted'}`}>Upload scans for all 10 fingerprints, one image per hand.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h5 className={`font-semibold text-center mb-2 ${isMobileView ? 'text-white' : 'text-primary-text'}`}>Left Hand</h5>
                            <UploadDocument 
                                label="Scan of 5 fingers"
                                file={data.biometrics.fingerprints.leftHand}
                                onFileChange={(file) => handleFingerprintUpload('leftHand', file)}
                                onVerification={handleFingerprintVerification}
                                allowCapture
                            />
                        </div>
                         <div>
                            <h5 className={`font-semibold text-center mb-2 ${isMobileView ? 'text-white' : 'text-primary-text'}`}>Right Hand</h5>
                            <UploadDocument 
                                label="Scan of 5 fingers"
                                file={data.biometrics.fingerprints.rightHand}
                                onFileChange={(file) => handleFingerprintUpload('rightHand', file)}
                                onVerification={handleFingerprintVerification}
                                allowCapture
                            />
                        </div>
                    </div>
                </div>

                <div className="my-8 border-t border-border"></div>

                {/* Signature Section */}
                <div>
                    <h4 className={`text-lg font-semibold text-center mb-4 ${isMobileView ? 'text-white' : 'text-primary-text'}`}>Signature (Optional)</h4>
                    <div className="max-w-md mx-auto">
                      <UploadDocument
                          label="Upload or capture a signature"
                          file={data.biometrics.signatureImage}
                          onFileChange={handleSignatureUpload}
                          allowCapture
                      />
                    </div>
                </div>
             </div>
        </form>
    );
};

export default Biometrics;