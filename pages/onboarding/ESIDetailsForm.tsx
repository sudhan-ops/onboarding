

import React, { useEffect } from 'react';
import { useForm, useWatch, Controller, SubmitHandler } from 'react-hook-form';
import * as ReactRouterDOM from 'react-router-dom';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useEnrollmentRulesStore } from '../../store/enrollmentRulesStore';
import type { EsiDetails, UploadedFile } from '../../types';
import Input from '../../components/ui/Input';
import FormHeader from '../../components/onboarding/FormHeader';
import DatePicker from '../../components/ui/DatePicker';
import { Info } from 'lucide-react';
import UploadDocument from '../../components/UploadDocument';
import VerifiedInput from '../../components/ui/VerifiedInput';
import { Type } from '@google/genai';

export const esiDetailsSchema = yup.object({
    hasEsi: yup.boolean().required(),
    esiNumber: yup.string().when('hasEsi', {
        is: true,
        then: (schema) => schema.required('ESI Number is required').matches(/^(\d{10}|\d{17})$/, 'ESI number must be 10 or 17 digits'),
        otherwise: (schema) => schema.optional().nullable(),
    }),
    esiRegistrationDate: yup.string().when('hasEsi', {
        is: true,
        then: (schema) => schema.required('Registration date is required')
            .test('not-in-future', 'Registration date cannot be in the future', (value) => {
                if(!value) return true;
                return new Date(value.replace(/-/g, '/')) <= new Date();
            }),
        otherwise: (schema) => schema.optional().nullable(),
    }),
    esicBranch: yup.string().when('hasEsi', {
        is: true,
        then: (schema) => schema.required('ESIC Branch is required'),
        otherwise: (schema) => schema.optional().nullable(),
    }),
    document: yup.mixed<UploadedFile | null>().optional().nullable(),
    verifiedStatus: yup.object().optional(),
});

interface OutletContext {
  onValidated: () => Promise<void>;
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
}

const EsiDetailsForm: React.FC = () => {
    const { onValidated, setToast } = ReactRouterDOM.useOutletContext<OutletContext>();
    const { data, updateEsi, setEsiVerifiedStatus } = useOnboardingStore();
    const { esiCtcThreshold, enableEsiRule } = useEnrollmentRulesStore();
    
    const { register, control, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<EsiDetails>({
        resolver: yupResolver<EsiDetails>(esiDetailsSchema),
        defaultValues: data.esi
    });
    
    const hasEsi = watch('hasEsi');
    const esiData = watch();

    const isEligibleForEsi = data.personal.salary != null && data.personal.salary <= esiCtcThreshold;

    useEffect(() => {
        if (!isEligibleForEsi) {
            if (data.esi.hasEsi) {
                updateEsi({ hasEsi: false });
                reset({ ...data.esi, hasEsi: false });
            }
        }
    }, [isEligibleForEsi, data.esi.hasEsi, updateEsi, reset]);
    

    const onSubmit: SubmitHandler<EsiDetails> = async (formData) => {
        updateEsi(formData);
        await onValidated();
    };
    
    const handleManualInput = () => {
        setEsiVerifiedStatus({ esiNumber: false });
    };

    const handleOcrComplete = (extractedData: any) => {
        if (extractedData.esiNumber) {
            const esi = extractedData.esiNumber.replace(/\D/g, '');
            if (esi.length === 10 || esi.length === 17) {
                setValue('esiNumber', esi, { shouldValidate: true });
                setEsiVerifiedStatus({ esiNumber: true });
                setToast({ message: 'ESI Number extracted successfully.', type: 'success' });
            }
        }
    };

    const esiSchema = {
        type: Type.OBJECT,
        properties: {
            esiNumber: { type: Type.STRING, description: "The 10 or 17-digit ESI number." },
        },
        required: ["esiNumber"],
    };

    if (!enableEsiRule) {
        return (
            <form onSubmit={async (e) => { e.preventDefault(); await onValidated(); }} id="esi-form">
                <FormHeader title="ESI Details" subtitle="Employee's State Insurance eligibility." />
                <div className="mt-4 flex items-center bg-blue-50 p-4 rounded-lg">
                    <Info className="h-5 w-5 text-blue-500 mr-3" />
                    <p className="text-sm text-blue-700">
                        ESI enrollment is currently disabled by company policy. This step is not applicable.
                    </p>
                </div>
            </form>
        );
    }


    if (!isEligibleForEsi) {
        return (
            <form onSubmit={async (e) => { e.preventDefault(); await onValidated(); }} id="esi-form">
                <FormHeader title="ESI Details" subtitle="Employee's State Insurance eligibility." />
                <div className="mt-4 flex items-center bg-blue-50 p-4 rounded-lg">
                    <Info className="h-5 w-5 text-blue-500 mr-3" />
                    <p className="text-sm text-blue-700">
                        Employee is not eligible for ESI as their gross salary is above the ₹{esiCtcThreshold.toLocaleString()} threshold.
                    </p>
                </div>
            </form>
        );
    }


    return (
        <form onSubmit={handleSubmit(onSubmit)} id="esi-form">
             <FormHeader title="ESI Details" subtitle="Provide your Employee's State Insurance number if applicable." />

            <div className="space-y-6">
                <div className="flex items-center">
                    <input id="hasEsi" type="checkbox" {...register('hasEsi')} className="h-4 w-4 text-accent" />
                    <label htmlFor="hasEsi" className="ml-2 block text-sm text-muted">Are you covered under ESI?</label>
                </div>
                {hasEsi && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in-down">
                        <div className="space-y-6">
                            <VerifiedInput
                                label="ESI Number"
                                id="esiNumber"
                                hasValue={!!esiData.esiNumber}
                                isVerified={!!data.esi.verifiedStatus?.esiNumber}
                                onManualInput={handleManualInput}
                                registration={register('esiNumber')}
                                error={errors.esiNumber?.message}
                            />
                            <Controller name="esiRegistrationDate" control={control} render={({ field }) => (
                               <DatePicker label="ESI Registration Date" id="esiRegistrationDate" error={errors.esiRegistrationDate?.message} value={field.value} onChange={field.onChange} maxDate={new Date()} />
                            )} />
                            <Input label="ESIC Branch" id="esicBranch" registration={register('esicBranch')} error={errors.esicBranch?.message}/>
                        </div>
                        <Controller name="document" control={control} render={({ field }) => (
                             <UploadDocument
                                label="Upload ESI Card"
                                file={field.value}
                                onFileChange={field.onChange}
                                onOcrComplete={handleOcrComplete}
                                ocrSchema={esiSchema}
                                setToast={setToast}
                            />
                        )}/>
                    </div>
                )}
            </div>
        </form>
    );
};

export default EsiDetailsForm;
