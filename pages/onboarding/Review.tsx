import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import * as ReactRouterDOM from 'react-router-dom';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useSettingsStore } from '../../store/settingsStore';
import Button from '../../components/ui/Button';
import FormHeader from '../../components/onboarding/FormHeader';
import { Loader2, CheckCircle, XCircle, AlertTriangle, ShieldCheck, FileText } from 'lucide-react';
import { api } from '../../services/api';
// FIX: Imported EducationRecord to be used as an explicit type for the map callback parameter.
import type { VerificationResult, EducationRecord, UploadedFile } from '../../types';
import { useAuthStore } from '../../store/authStore';

const DetailItem: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-muted">{label}</dt>
        <dd className="mt-1 text-sm text-primary-text">{value || '-'}</dd>
    </div>
);

const DetailItemWithStatus: React.FC<{ label: string; value?: string | number | null; status: boolean | null; isVerifying: boolean }> = ({ label, value, status, isVerifying }) => (
    <div>
        <dt className="text-sm font-medium text-muted flex items-center">
            {label}
            {isVerifying && <Loader2 className="h-4 w-4 text-muted animate-spin ml-2" />}
            {!isVerifying && status === true && <span title="Verified from document" className="ml-2"><CheckCircle className="h-4 w-4 text-green-500" /></span>}
            {!isVerifying && status === false && <span title="Verification Failed" className="ml-2"><XCircle className="h-4 w-4 text-red-500" /></span>}
        </dt>
        <dd className="mt-1 text-sm text-primary-text">{value || '-'}</dd>
    </div>
);

const MobileDetailItem: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
    <div className="flex justify-between items-start py-2">
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-sm text-white font-medium text-right max-w-[60%]">{value || '-'}</span>
    </div>
);


const Review: React.FC = () => {
    const { onSubmit, isSubmitting } = ReactRouterDOM.useOutletContext<{ onSubmit: () => Promise<void>; isSubmitting: boolean }>();
    const { user } = useAuthStore();
    const { data } = useOnboardingStore();
    const { perfiosApi } = useSettingsStore();
    const navigate = ReactRouterDOM.useNavigate();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const isMobileView = user?.role === 'field_officer' && isMobile;

    const [verificationState, setVerificationState] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
    const [verificationResult, setVerificationResult] = useState<VerificationResult['verifiedFields'] | null>(null);
    const [verificationMessage, setVerificationMessage] = useState('');

    const handleVerification = async () => {
        setVerificationState('verifying');
        setVerificationResult(null);
        setVerificationMessage('');
        try {
            const dataToVerify = {
                name: `${data.personal.firstName} ${data.personal.lastName}`,
                dob: data.personal.dob,
                aadhaar: data.personal.idProofType === 'Aadhaar' ? data.personal.idProofNumber : null,
                pan: data.personal.idProofType === 'PAN' ? data.personal.idProofNumber : null,
                bank: {
                    accountNumber: data.bank.accountNumber,
                    ifsc: data.bank.ifscCode,
                },
                uan: data.uan.hasPreviousPf ? data.uan.uanNumber : null,
                esi: data.esi.hasEsi ? data.esi.esiNumber : null,
            };

            const result = await api.verifyDetailsWithPerfios(dataToVerify);
            setVerificationResult(result.verifiedFields);
            setVerificationMessage(result.message);
            setVerificationState(result.success ? 'success' : 'failed');
        } catch (error) {
            setVerificationState('failed');
            setVerificationMessage('An unexpected error occurred during verification.');
        }
    };

    const handleGenerateForms = () => {
        navigate(`/onboarding/pdf/${data.id || 'draft'}`);
    };

    const canSubmit = (verificationState === 'success' || !perfiosApi.enabled) && data.formsGenerated;
    
    if (isMobileView) {
        return (
             <form onSubmit={async (e) => { e.preventDefault(); await onSubmit(); }} id="review-form">
                <p className="text-sm text-gray-400 mb-6">Please review all your details carefully before submitting.</p>
                 <div className="space-y-6">
                    <section>
                        <h4 className="fo-section-title mb-2">Personal Details</h4>
                        <div className="divide-y divide-border">
                             <MobileDetailItem label="Full Name" value={`${data.personal.firstName} ${data.personal.lastName}`} />
                             <MobileDetailItem label="Email" value={data.personal.email} />
                             <MobileDetailItem label="Mobile" value={data.personal.mobile} />
                             <MobileDetailItem label="Date of Birth" value={data.personal.dob} />
                        </div>
                    </section>
                    <section>
                        <h4 className="fo-section-title mb-2">Organization Details</h4>
                        <div className="divide-y divide-border">
                             <MobileDetailItem label="Site" value={data.organization.organizationName} />
                             <MobileDetailItem label="Designation" value={data.organization.designation} />
                             <MobileDetailItem label="Department" value={data.organization.department} />
                        </div>
                    </section>
                    <section>
                        <h4 className="fo-section-title mb-2">Bank Details</h4>
                         <div className="divide-y divide-border">
                            <MobileDetailItem label="Account Holder" value={data.bank.accountHolderName} />
                            <MobileDetailItem label="Account Number" value={'*'.repeat(data.bank.accountNumber.length - 4) + data.bank.accountNumber.slice(-4)} />
                            <MobileDetailItem label="IFSC Code" value={data.bank.ifscCode} />
                         </div>
                    </section>
                     <section>
                        <h4 className="fo-section-title mb-2">Biometrics</h4>
                        {data.biometrics.signatureImage && (
                            <div className="mb-4">
                                <h5 className="fo-section-title mb-2 text-base">Signature</h5>
                                <img src={data.biometrics.signatureImage.preview} alt="Signature" className="h-24 bg-white border rounded-md mx-auto" />
                            </div>
                        )}
                        {Object.values(data.biometrics.fingerprints).some(f => f) && (
                            <div>
                                <h5 className="fo-section-title mb-2 text-base">Fingerprints</h5>
                                <p className="text-sm text-center text-gray-300">Fingerprints have been uploaded.</p>
                            </div>
                        )}
                        {!data.biometrics.signatureImage && !Object.values(data.biometrics.fingerprints).some(f => f) && (
                             <p className="text-sm text-center text-gray-400">No biometrics provided.</p>
                        )}
                    </section>
                 </div>
                 <div className="mt-8 pt-6 border-t border-border">
                     <label className="flex items-start gap-3">
                        <input id="confirmation" name="confirmation" type="checkbox" required className="h-5 w-5 rounded mt-0.5 text-accent focus:ring-accent bg-transparent border-[#9ca89c]" />
                        <div>
                            <span className="font-medium">Declaration</span>
                            <p className="text-sm text-gray-400">I hereby declare that the information provided is true and correct to the best of my knowledge.</p>
                        </div>
                    </label>
                </div>
            </form>
        );
    }

    return (
        <form onSubmit={async (e) => { e.preventDefault(); if (canSubmit) await onSubmit(); }} id="review-form">
            <FormHeader title="Review & Submit" subtitle="Please review all your details carefully. Some details require verification before submission." />
            
            <div className="space-y-8">
                <section>
                    <h4 className="text-md font-semibold text-primary-text mb-4 border-b pb-2">Personal Details</h4>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6">
                        <DetailItemWithStatus label="Full Name" value={`${data.personal.firstName} ${data.personal.lastName}`} status={verificationResult?.name} isVerifying={verificationState === 'verifying'} />
                        <DetailItemWithStatus label="Date of Birth" value={data.personal.dob} status={verificationResult?.dob} isVerifying={verificationState === 'verifying'} />
                        <DetailItem label="Mobile" value={data.personal.mobile} />
                        <DetailItem label="Email" value={data.personal.email} />
                        <DetailItem label="Gender" value={data.personal.gender} />
                        <DetailItem label="Marital Status" value={data.personal.maritalStatus} />
                    </dl>
                </section>

                <section>
                    <h4 className="text-md font-semibold text-primary-text mb-4 border-b pb-2">Organization Details</h4>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6">
                        <DetailItem label="Site / Client" value={data.organization.organizationName} />
                        <DetailItem label="Designation" value={data.organization.designation} />
                        <DetailItem label="Department" value={data.organization.department} />
                        <DetailItem label="Joining Date" value={data.organization.joiningDate} />
                        <DetailItem label="Work Type" value={data.organization.workType} />
                        <DetailItem label="Reporting Manager" value={data.organization.reportingManager} />
                    </dl>
                </section>
                
                <section>
                    <h4 className="text-md font-semibold text-primary-text mb-4 border-b pb-2">Family Details</h4>
                    {data.family.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {data.family.map(member => (
                                <div key={member.id} className="p-3 bg-page rounded-lg border border-border">
                                    <p className="font-semibold">{member.name}</p>
                                    <p className="text-sm text-muted">{member.relation} - DOB: {member.dob}</p>
                                </div>
                            ))}
                        </div>
                    ) : <p className="text-sm text-muted">No family members added.</p>}
                </section>
                
                 <section>
                    <h4 className="text-md font-semibold text-primary-text mb-4 border-b pb-2">Education Details</h4>
                    {data.education.length > 0 ? (
                        <div className="space-y-2">
                            {data.education.map((record: EducationRecord) => (
                                <div key={record.id} className="text-sm text-primary-text">- {record.degree} from {record.institution} ({record.endYear})</div>
                            ))}
                        </div>
                    ) : <p className="text-sm text-muted">No education records added.</p>}
                </section>

                <section>
                    <h4 className="text-md font-semibold text-primary-text mb-4 border-b pb-2">Bank Details</h4>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6">
                        <DetailItem label="Account Holder" value={data.bank.accountHolderName} />
                        <DetailItemWithStatus 
                            label="Account Number" 
                            value={'*'.repeat(Math.max(0, data.bank.accountNumber.length - 4)) + data.bank.accountNumber.slice(-4)} 
                            status={verificationResult?.bank} 
                            isVerifying={verificationState === 'verifying' && !!data.bank.accountNumber}
                        />
                        <DetailItem label="IFSC Code" value={data.bank.ifscCode} />
                        <DetailItem label="Bank Name" value={data.bank.bankName} />
                    </dl>
                </section>
                
                <section>
                    <h4 className="text-md font-semibold text-primary-text mb-4 border-b pb-2">Statutory Details</h4>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6">
                        <DetailItemWithStatus label={data.personal.idProofType || 'ID Proof'} value={data.personal.idProofNumber} status={verificationResult?.aadhaar} isVerifying={verificationState === 'verifying' && !!(data.personal.idProofType === 'Aadhaar' && data.personal.idProofNumber)} />
                        <DetailItemWithStatus label="UAN Number" value={data.uan.hasPreviousPf ? data.uan.uanNumber : 'Not Applicable'} status={verificationResult?.uan} isVerifying={verificationState === 'verifying' && !!(data.uan.hasPreviousPf && data.uan.uanNumber)} />
                        <DetailItemWithStatus label="ESI Number" value={data.esi.hasEsi ? data.esi.esiNumber : 'Not Applicable'} status={verificationResult?.esi} isVerifying={verificationState === 'verifying' && !!(data.esi.hasEsi && data.esi.esiNumber)} />
                    </dl>
                </section>
                
                 <section>
                    <h4 className="text-md font-semibold text-primary-text mb-4 border-b pb-2">Uniform Details</h4>
                    {data.uniforms.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1 text-sm text-primary-text">
                            {data.uniforms.map(item => (
                                <li key={item.itemId}>{item.quantity} x {item.itemName} (Size: {item.sizeLabel}, Fit: {item.fit})</li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-muted">No uniform items selected.</p>}
                </section>

                <section>
                    <h4 className="text-md font-semibold text-primary-text mb-4 border-b pb-2">Biometrics</h4>
                     <div className="space-y-4">
                        {(data.biometrics.fingerprints.leftHand || data.biometrics.fingerprints.rightHand) && (
                            <div>
                                <dt className="text-sm font-medium text-muted">Fingerprints</dt>
                                <dd className="mt-1">
                                    <ul className="list-disc list-inside space-y-1 text-sm text-primary-text">
                                        {data.biometrics.fingerprints.leftHand && <li>Left Hand: {data.biometrics.fingerprints.leftHand.name}</li>}
                                        {data.biometrics.fingerprints.rightHand && <li>Right Hand: {data.biometrics.fingerprints.rightHand.name}</li>}
                                    </ul>
                                </dd>
                            </div>
                        )}
                        {data.biometrics.signatureImage && (
                            <div>
                                <dt className="text-sm font-medium text-muted">Signature</dt>
                                <dd className="mt-1">
                                    <img src={data.biometrics.signatureImage.preview} alt="Signature" className="h-24 bg-white border rounded-md p-1" />
                                </dd>
                            </div>
                        )}
                        {!data.biometrics.signatureImage && !data.biometrics.fingerprints.leftHand && !data.biometrics.fingerprints.rightHand && (
                            <p className="text-sm text-muted">No biometrics provided.</p>
                        )}
                    </div>
                </section>
            </div>
            
            {perfiosApi.enabled && (
                <div className="mt-8 pt-6 border-t">
                    <div className="flex items-start">
                         <div className="flex-shrink-0"><ShieldCheck className="h-8 w-8 text-accent" /></div>
                         <div className="ml-4 flex-grow">
                             <h4 className="text-md font-semibold text-primary-text">Perfios Verification</h4>
                             <p className="text-sm text-muted mb-4">Before submitting, please verify your details via Perfios.</p>
                              {verificationState === 'idle' && <Button type="button" onClick={handleVerification}>Verify Details</Button>}
                              {verificationState === 'verifying' && <Button type="button" disabled isLoading>Verifying...</Button>}
                         </div>
                    </div>
                     {verificationState === 'failed' && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex">
                                <div className="flex-shrink-0"><AlertTriangle className="h-5 w-5 text-red-400" /></div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">Verification Failed</h3>
                                    <p className="text-sm text-red-700 mt-1">{verificationMessage}</p>
                                    <p className="text-sm text-red-700 mt-1">Please go back to the relevant section to correct the information, then retry verification.</p>
                                    <div className="mt-4"><Button type="button" onClick={handleVerification}>Retry Verification</Button></div>
                                </div>
                            </div>
                        </div>
                    )}
                     {verificationState === 'success' && (
                        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                            <p className="text-sm font-medium text-green-800">{verificationMessage} You can now proceed to generate the final forms.</p>
                        </div>
                    )}
                </div>
            )}
            
            <div className="mt-8 pt-6 border-t">
                 <div className="flex items-start">
                    <div className="flex-shrink-0"><FileText className="h-8 w-8 text-accent" /></div>
                    <div className="ml-4 flex-grow">
                        <h4 className="text-md font-semibold text-primary-text">Final Step: Generate Official Forms</h4>
                        <p className="text-sm text-muted mb-4">Please generate and review the pre-filled company forms before final submission. This is a mandatory step.</p>
                        {data.formsGenerated ? (
                             <div className="flex items-center gap-2 text-green-600 font-semibold">
                                <CheckCircle className="h-5 w-5" />
                                <span>Forms have been generated and reviewed.</span>
                            </div>
                        ) : (
                             <Button type="button" onClick={handleGenerateForms}>Generate & Preview Forms</Button>
                        )}
                    </div>
                </div>
            </div>

             <div className="mt-8 pt-6 border-t">
                <div className="flex items-start">
                    <div className="flex items-center h-5"><input id="confirmation" name="confirmation" type="checkbox" required className="h-4 w-4 text-accent" /></div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="confirmation" className="font-medium text-gray-700">Declaration</label>
                        <p className="text-gray-500">I hereby declare that the information provided is true and correct to the best of my knowledge.</p>
                    </div>
                </div>
            </div>

            <div className="mt-8 text-right">
                {!canSubmit && (<p className="text-sm text-red-600 mb-2 text-right">Please complete all verification and form generation steps before submitting.</p>)}
                <Button type="submit" isLoading={isSubmitting} disabled={!canSubmit}>Submit Application</Button>
            </div>
        </form>
    );
};

export default Review;