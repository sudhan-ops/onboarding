

import React, { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useOnboardingStore } from '../../store/onboardingStore';
// FIX: Switched from useSettingsStore to useEnrollmentRulesStore to get correct GMC policy rules.
import { useEnrollmentRulesStore } from '../../store/enrollmentRulesStore';
import type { GmcDetails } from '../../types';
import Input from '../ui/Input';
import Select from '../ui/Select';
import FormHeader from './FormHeader';
import { Info } from 'lucide-react';

const validationSchema = yup.object({
    isOptedIn: yup.boolean().nullable().required('Please select an option'),
    optOutReason: yup.string().when('isOptedIn', {
        is: false,
        then: schema => schema.required('Reason for opting out is required'),
        otherwise: schema => schema.optional(),
    }),
    policyAmount: yup.string<GmcDetails['policyAmount']>().when('isOptedIn', {
        is: true,
        then: schema => schema.oneOf(['1L', '2L', '']).required('Policy amount is required'),
        otherwise: schema => schema.optional(),
    }),
    nomineeName: yup.string().when('isOptedIn', {
        is: true,
        then: schema => schema.required('Nominee name is required'),
        otherwise: schema => schema.optional(),
    }),
    nomineeRelation: yup.string<GmcDetails['nomineeRelation']>().when('isOptedIn', {
        is: true,
        then: schema => schema.oneOf(['Spouse', 'Child', 'Father', 'Mother', '']).required('Nominee relation is required'),
        otherwise: schema => schema.optional(),
    }),
    wantsToAddDependents: yup.boolean().optional(),
    // FIX: Add missing optional fields to align schema with GmcDetails type.
    selectedSpouseId: yup.string().optional(),
    selectedChild1Id: yup.string().optional(),
    selectedChild2Id: yup.string().optional(),
    declarationAccepted: yup.boolean().optional(),
    alternateInsuranceProvider: yup.string().optional(),
    alternateInsuranceStartDate: yup.string().optional(),
    alternateInsuranceEndDate: yup.string().optional(),
    alternateInsuranceCoverage: yup.string().optional(),
}).defined();


interface GMCDetailsFormProps {
    onValidated: () => void;
}

const GMCDetailsForm: React.FC<GMCDetailsFormProps> = ({ onValidated }) => {
    const { data, updateGmc } = useOnboardingStore();
    // FIX: Replaced useSettingsStore with useEnrollmentRulesStore to get correct policy data.
    const { salaryThreshold, defaultPolicySingle, defaultPolicyMarried } = useEnrollmentRulesStore();
    
    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<GmcDetails>({
        // FIX: Provide explicit generic type to yupResolver to fix type inference issues.
        resolver: yupResolver<GmcDetails>(validationSchema),
        defaultValues: data.gmc,
    });

    const isGmcApplicable = data.personal.salary != null && data.personal.salary > salaryThreshold;
    const maritalStatus = data.personal.maritalStatus;
    const policyAmount = watch('policyAmount');

    useEffect(() => {
        if (isGmcApplicable) {
            const currentPolicyInStore = data.gmc.policyAmount;
            
            const upgradedPolicy = defaultPolicySingle !== defaultPolicyMarried ? defaultPolicyMarried : '2L';
            
            const effectiveDefault = maritalStatus === 'Married' ? defaultPolicyMarried : defaultPolicySingle;

            if (maritalStatus !== 'Married' && currentPolicyInStore === upgradedPolicy) {
                setValue('policyAmount', upgradedPolicy);
                return;
            }

            if (currentPolicyInStore !== effectiveDefault) {
                setValue('policyAmount', effectiveDefault);
                updateGmc({ policyAmount: effectiveDefault });
            }
        } else {
            if (data.gmc.policyAmount !== '') {
                 setValue('policyAmount', '');
                 updateGmc({ policyAmount: '' });
            }
        }
    }, [isGmcApplicable, maritalStatus, data.gmc.policyAmount, setValue, updateGmc, defaultPolicySingle, defaultPolicyMarried]);

    const onSubmit: SubmitHandler<GmcDetails> = (formData) => {
        updateGmc(formData);
        onValidated();
    };
    
    if (!isGmcApplicable) {
        const thresholdText = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(salaryThreshold);
        return (
            <div>
                <FormHeader title="Group Medical Cover Details" subtitle="Nominate someone for your insurance policy." />
                <div className="mt-4 flex items-center bg-blue-50 p-4 rounded-lg">
                    <Info className="h-5 w-5 text-blue-500 mr-3" />
                    <p className="text-sm text-blue-700">Group Medical Cover is only applicable for employees with a monthly salary greater than {thresholdText}.</p>
                </div>
            </div>
        );
    }
    
    const marriedPolicyText = defaultPolicyMarried.replace('L', ' Lakh');

    return (
        <form onSubmit={handleSubmit(onSubmit)} id="gmc-form">
            <FormHeader title="Group Medical Cover Details" subtitle="Nominate someone for your insurance policy." />

            <div className="space-y-6">
                <div>
                    <h4 className="text-md font-semibold text-primary-text mb-2">Select Policy Amount</h4>
                     {maritalStatus === 'Married' && 
                        <p className="text-xs text-muted mb-2">As a married employee, you are automatically enrolled in the {marriedPolicyText} policy.</p>
                    }
                    <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg bg-page">
                        <label className={`flex-1 p-4 rounded-md border-2 cursor-pointer bg-card ${policyAmount === '1L' ? 'border-accent bg-accent-light' : ''}`}>
                             <input type="radio" {...register('policyAmount')} value="1L" className="sr-only" />
                             <span className="font-bold text-lg block text-primary-text">1 Lakh Policy</span>
                             <span className="text-sm text-muted">Base coverage for individuals.</span>
                        </label>
                         <label className={`flex-1 p-4 rounded-md border-2 cursor-pointer bg-card ${policyAmount === '2L' ? 'border-accent bg-accent-light' : ''}`}>
                             <input type="radio" {...register('policyAmount')} value="2L" className="sr-only" />
                             <span className="font-bold text-lg block text-primary-text">2 Lakh Policy</span>
                             <span className="text-sm text-muted">Enhanced coverage. Default for married employees.</span>
                        </label>
                    </div>
                    {errors.policyAmount && <p className="mt-1 text-xs text-red-600">{errors.policyAmount?.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Input label="Nominee Name" id="nomineeName" error={errors.nomineeName?.message} registration={register('nomineeName')} />
                    <Select label="Nominee Relation" id="nomineeRelation" error={errors.nomineeRelation?.message} registration={register('nomineeRelation')}>
                        <option value="">Select Relation</option>
                        <option>Spouse</option>
                        <option>Child</option>
                        <option>Father</option>
                        <option>Mother</option>
                    </Select>
                </div>
            </div>
        </form>
    );
};

export default GMCDetailsForm;