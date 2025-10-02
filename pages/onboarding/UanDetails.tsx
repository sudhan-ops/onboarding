import React, { useEffect, useState } from 'react';
import { useForm, useWatch, SubmitHandler, Controller } from 'react-hook-form';
import * as ReactRouterDOM from 'react-router-dom';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useOnboardingStore } from '../../store/onboardingStore';
import type { UanDetails, UploadedFile } from '../../types';
import Input from '../../components/ui/Input';
import FormHeader from '../../components/onboarding/FormHeader';
import UploadDocument from '../../components/UploadDocument';
import VerifiedInput from '../../components/ui/VerifiedInput';
import { Type } from '@google/genai';
import { useAuthStore } from '../../store/authStore';

export const uanDetailsSchema = yup.object({
    hasPreviousPf: yup.boolean().required(),
    uanNumber: yup.string().when('hasPreviousPf', {
        is: true,
        then: (schema) => schema.required('UAN Number is required').matches(/^[0-9]{12}$/, 'UAN must be 12 digits'),
        otherwise: (schema) => schema.optional().nullable(),
    }),
    pfNumber: yup.string().when('hasPreviousPf', {
        is: true,
        then: (schema) => schema.optional().nullable(),
        otherwise: (schema) => schema.optional().nullable(),
    }),
    document: yup.mixed<UploadedFile | null>().optional().nullable(),
    salarySlip: yup.mixed<UploadedFile | null>().optional().nullable(),
    verifiedStatus: yup.object().optional(),
}).defined();

interface OutletContext {
  onValidated: () => Promise<void>;
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
}

const UanDetails: React.FC = () => {
    const { onValidated, setToast } = ReactRouterDOM.useOutletContext<OutletContext>();
    const { user } = useAuthStore();
    const { data, updateUan, setUanVerifiedStatus } = useOnboardingStore();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    const { register, control, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<UanDetails>({
        resolver: yupResolver<UanDetails>(uanDetailsSchema),
        defaultValues: data.uan
    });
    
    const isMobileView = user?.role === 'field_officer' && isMobile;
    
    useEffect(() => {
        // Sync form with global store data, which might have been pre-filled
        reset(data.uan);
    }, [data.uan, reset]);
    
    const hasPreviousPf = watch('hasPreviousPf');
    const uanData = watch();

    const onSubmit: SubmitHandler<UanDetails> = async (formData) => {
        updateUan(formData);
        await onValidated();
    };
    
    const handleManualInput = () => {
        setUanVerifiedStatus({ uanNumber: false });
    };

    const handleOcrComplete = (extractedData: any) => {
        if (extractedData.uanNumber) {
            const uan = extractedData.uanNumber.replace(/\D/g, '');
            if (uan.length === 12) {
                const uanUpdate: Partial<UanDetails> = {
                    uanNumber: uan,
                    hasPreviousPf: true,
                };
                setValue('uanNumber', uan, { shouldValidate: true });
                setValue('hasPreviousPf', true, { shouldValidate: true });
                updateUan(uanUpdate);
                setUanVerifiedStatus({ uanNumber: true });
                setToast({ message: 'UAN extracted successfully.', type: 'success' });
            }
        }
    };

    const uanSchema = {
        type: Type.OBJECT,
        properties: {
            uanNumber: { type: Type.STRING, description: "The 12-digit Universal Account Number (UAN)." },
        },
        required: ["uanNumber"],
    };
    
    if (isMobileView) {
        return (
            <form onSubmit={handleSubmit(onSubmit)} id="uan-form">
                <p className="text-sm text-gray-400 mb-6">Provide your Universal Account Number if you have one.</p>
                <div className="space-y-4">
                    <label className="flex items-center gap-3 p-4 bg-[#243524] rounded-lg border border-[#374151]">
                        <input type="checkbox" {...register('hasPreviousPf')} className="h-5 w-5 rounded text-accent focus:ring-accent bg-transparent border-[#9ca89c]" />
                        <span>Do you have a previous PF account or UAN?</span>
                    </label>
                    {hasPreviousPf && (
                        <div className="space-y-4 animate-fade-in-down">
                            <input placeholder="UAN Number" {...register('uanNumber')} className="fo-input"/>
                            <input placeholder="PF Number (Optional)" {...register('pfNumber')} className="fo-input"/>
                            <Controller name="document" control={control} render={({ field }) => (
                                <UploadDocument label="Upload Proof (Payslip, etc.)" file={field.value} onFileChange={field.onChange} allowCapture/>
                            )}/>
                        </div>
                    )}
                </div>
            </form>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} id="uan-form">
            <FormHeader title="UAN / PF Details" subtitle="Provide your Universal Account Number if you have one." />
            
            <div className="space-y-6">
                <div className="flex items-center">
                    <input
                        id="hasPreviousPf"
                        type="checkbox"
                        {...register('hasPreviousPf')}
                        className="h-4 w-4 text-accent border-gray-300 rounded focus:ring-accent"
                    />
                    <label htmlFor="hasPreviousPf" className="ml-2 block text-sm text-muted">Do you have a previous PF account or UAN?</label>
                </div>
                {data.uan.salarySlip && (
                    <div className="pt-4 border-t">
                        <h4 className="text-md font-semibold text-primary-text mb-2">Reference Salary Slip</h4>
                        <UploadDocument
                            label=""
                            file={data.uan.salarySlip}
                            onFileChange={() => {}} // Read-only
                        />
                    </div>
                )}
                {hasPreviousPf && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in-down">
                        <div className="space-y-6">
                           <VerifiedInput
                                label="UAN Number"
                                id="uanNumber"
                                hasValue={!!uanData.uanNumber}
                                isVerified={!!data.uan.verifiedStatus?.uanNumber}
                                onManualInput={handleManualInput}
                                registration={register('uanNumber')}
                                error={errors.uanNumber?.message}
                            />
                            <Input
                                label="PF Number (Optional)"
                                id="pfNumber"
                                registration={register('pfNumber')}
                                error={errors.pfNumber?.message}
                            />
                        </div>
                        <Controller name="document" control={control} render={({ field }) => (
                            <UploadDocument
                                label="Upload Proof (Payslip, etc.)"
                                file={field.value}
                                onFileChange={field.onChange}
                                onOcrComplete={handleOcrComplete}
                                ocrSchema={uanSchema}
                                setToast={setToast}
                            />
                        )}/>
                    </div>
                )}
            </div>
        </form>
    );
};

export default UanDetails;