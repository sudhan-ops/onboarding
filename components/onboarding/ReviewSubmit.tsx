

import React from 'react';
import { useOnboardingStore } from '../../store/onboardingStore';
import Button from '../ui/Button';
import FormHeader from './FormHeader';

const DetailItem: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-muted">{label}</dt>
        <dd className="mt-1 text-sm text-primary-text">{value || '-'}</dd>
    </div>
);

const ReviewSubmit: React.FC<{ onSubmit: () => void; isSubmitting: boolean }> = ({ onSubmit, isSubmitting }) => {
    const { data } = useOnboardingStore();

    return (
        <div>
            <FormHeader title="Review & Submit" subtitle="Please review all your details carefully before submitting." />
            
            <div className="space-y-8">
                {/* Personal Details */}
                <section>
                    <h4 className="text-md font-semibold text-primary-text mb-4 border-b pb-2">Personal Details</h4>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6">
                        <DetailItem label="Full Name" value={`${data.personal.firstName} ${data.personal.lastName}`} />
                        <DetailItem label="Email" value={data.personal.email} />
                        <DetailItem label="Mobile" value={data.personal.mobile} />
                        <DetailItem label="Date of Birth" value={data.personal.dob} />
                        <DetailItem label="Gender" value={data.personal.gender} />
                        <DetailItem label="Marital Status" value={data.personal.maritalStatus} />
                    </dl>
                </section>

                {/* Address Details */}
                <section>
                    <h4 className="text-md font-semibold text-primary-text mb-4 border-b pb-2">Address Details</h4>
                     <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                        <div>
                             <dt className="text-sm font-medium text-muted">Present Address</dt>
                             <dd className="mt-1 text-sm text-primary-text">{`${data.address.present?.line1}, ${data.address.present?.city}, ${data.address.present?.state} - ${data.address.present?.pincode}`}</dd>
                        </div>
                        <div>
                             <dt className="text-sm font-medium text-muted">Permanent Address</dt>
                             <dd className="mt-1 text-sm text-primary-text">{data.address.sameAsPresent ? 'Same as present' : `${data.address.permanent?.line1}, ${data.address.permanent?.city}, ${data.address.permanent?.state} - ${data.address.permanent?.pincode}`}</dd>
                        </div>
                    </dl>
                </section>
                
                {/* Bank Details */}
                 <section>
                    <h4 className="text-md font-semibold text-primary-text mb-4 border-b pb-2">Bank Details</h4>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6">
                        <DetailItem label="Account Holder" value={data.bank.accountHolderName} />
                        <DetailItem label="Account Number" value={'*'.repeat(data.bank.accountNumber.length - 4) + data.bank.accountNumber.slice(-4)} />
                        <DetailItem label="IFSC Code" value={data.bank.ifscCode} />
                        <DetailItem label="Bank Name" value={data.bank.bankName} />
                    </dl>
                </section>

                {/* Documents */}
                <section>
                    <h4 className="text-md font-semibold text-primary-text mb-4 border-b pb-2">Uploaded Documents</h4>
                    <ul>
                        {data.personal.photo && <li className="text-sm text-primary-text">- Profile Photo: {data.personal.photo.name}</li>}
                        {/* FIX: Corrected property from cancelledCheque to bankProof */}
                        {data.bank.bankProof && <li className="text-sm text-primary-text">- Bank Proof: {data.bank.bankProof.name}</li>}
                        {data.education.map(e => e.document && <li key={e.id} className="text-sm text-primary-text">- {e.degree} Certificate: {e.document.name}</li>)}
                    </ul>
                </section>
            </div>
            
             <div className="mt-8 pt-6 border-t">
                <div className="flex items-start">
                    <div className="flex items-center h-5">
                        <input id="confirmation" name="confirmation" type="checkbox" required className="focus:ring-accent h-4 w-4 text-accent border-gray-300 rounded" />
                    </div>
                    <div className="ml-3 text-sm">
                        <label htmlFor="confirmation" className="font-medium text-gray-700">Declaration</label>
                        <p className="text-gray-500">I hereby declare that the information provided is true and correct to the best of my knowledge.</p>
                    </div>
                </div>
            </div>

            <div className="mt-8 text-right">
                <Button onClick={onSubmit} isLoading={isSubmitting}>
                    Submit Application
                </Button>
            </div>
        </div>
    );
};

export default ReviewSubmit;