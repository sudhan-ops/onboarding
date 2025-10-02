

import React from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useOnboardingStore } from '../../store/onboardingStore';
import type { BankDetails, UploadedFile } from '../../types';
import Input from '../ui/Input';
// FIX: Changed import to use the correct UploadDocument component.
import UploadDocument from '../UploadDocument';
import FormHeader from './FormHeader';

const validationSchema = yup.object({
    accountHolderName: yup.string().required('Account holder name is required'),
    accountNumber: yup.string().required('Account number is required').matches(/^[0-9]+$/, "Must be only digits"),
    confirmAccountNumber: yup.string()
        .oneOf([yup.ref('accountNumber')], 'Account numbers must match')
        .required('Please confirm your account number'),
    ifscCode: yup.string().required('IFSC code is required').matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format'),
    bankName: yup.string().required('Bank name is required'),
    branchName: yup.string().required('Branch name is required'),
    bankProof: yup.mixed<UploadedFile | null>().optional().nullable(),
}).defined();

interface BankDetailsFormProps {
    onValidated: () => void;
}

const BankDetailsForm: React.FC<BankDetailsFormProps> = ({ onValidated }) => {
    const { data, updateBank } = useOnboardingStore();
    const { register, handleSubmit, formState: { errors }, control } = useForm<BankDetails>({
        // FIX: Provide explicit generic type to yupResolver to fix type inference issues.
        resolver: yupResolver<BankDetails>(validationSchema),
        defaultValues: data.bank,
    });

    const onSubmit: SubmitHandler<BankDetails> = (formData) => {
        updateBank(formData);
        onValidated();
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} id="bank-form">
            <FormHeader title="Bank Details" subtitle="Your salary will be credited to this account." />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input label="Account Holder Name" id="accountHolderName" error={errors.accountHolderName?.message} registration={register('accountHolderName')} />
                <Input label="Bank Name" id="bankName" error={errors.bankName?.message} registration={register('bankName')} />
                <Input label="Account Number" id="accountNumber" error={errors.accountNumber?.message} registration={register('accountNumber')} />
                <Input label="Confirm Account Number" id="confirmAccountNumber" error={errors.confirmAccountNumber?.message} registration={register('confirmAccountNumber')} />
                <Input label="IFSC Code" id="ifscCode" error={errors.ifscCode?.message} registration={register('ifscCode')} />
                <Input label="Branch Name" id="branchName" error={errors.branchName?.message} registration={register('branchName')} />
                <div className="sm:col-span-2">
                    <Controller
                        name="bankProof"
                        control={control}
                        render={({ field }) => (
                            <UploadDocument
                                label="Upload Bank Proof (Cancelled Cheque/Passbook) (Optional)"
                                file={field.value}
                                onFileChange={(file) => field.onChange(file)}
                             />
                        )}
                    />
                </div>
            </div>
        </form>
    );
};

export default BankDetailsForm;