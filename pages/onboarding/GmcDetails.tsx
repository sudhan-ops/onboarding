import React, { useMemo, useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import * as ReactRouterDOM from 'react-router-dom';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useOnboardingStore } from '../../store/onboardingStore';
import type { GmcDetails, UploadedFile, FamilyMember } from '../../types';
import FormHeader from '../../components/onboarding/FormHeader';
import Select from '../../components/ui/Select';
import UploadDocument from '../../components/UploadDocument';
import Checkbox from '../../components/ui/Checkbox';
import { useAuthStore } from '../../store/authStore';

const gmcDetailsSchema = yup.object({
    isOptedIn: yup.boolean().nullable().required('Please choose whether you want to avail Group Medical Cover.'),

    selectedSpouseId: yup.string().optional(),
    selectedChildIds: yup.array().of(yup.string().required()).optional(),

    gmcPolicyCopy: yup.mixed<UploadedFile | null>().when('isOptedIn', {
        is: false,
        then: schema => schema.nonNullable('Please upload GMC policy copy (PNG, JPG, PDF up to 5MB).'),
        otherwise: schema => schema.optional().nullable(),
    }),
    declarationAccepted: yup.boolean().when('isOptedIn', {
        is: false,
        then: schema => schema.oneOf([true], 'Please accept the declaration to proceed.'),
        otherwise: schema => schema.optional(),
    })
}).defined();


const GmcDetails: React.FC = () => {
    const { onValidated } = ReactRouterDOM.useOutletContext<{ onValidated: () => Promise<void> }>();
    const { user } = useAuthStore();
    const { data: onboardingData, updateGmc } = useOnboardingStore();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const isMobileView = user?.role === 'field_officer' && isMobile;

    const { control, handleSubmit, formState: { errors }, watch, reset, setValue, getValues } = useForm<GmcDetails>({
        resolver: yupResolver(gmcDetailsSchema),
        defaultValues: onboardingData.gmc,
    });

    const isOptedIn = watch('isOptedIn');
    const selectedSpouseId = watch('selectedSpouseId');
    const selectedChildIds = watch('selectedChildIds') || [];

    const spouse = useMemo(() => onboardingData.family.find(m => m.relation === 'Spouse'), [onboardingData.family]);
    const children = useMemo(() => onboardingData.family.filter(m => m.relation === 'Child'), [onboardingData.family]);

    const dependents = useMemo(() => {
        const all = [];
        if (spouse) all.push(spouse);
        all.push(...children);
        return all;
    }, [spouse, children]);
    
    // This effect pre-selects all dependents if GMC is opted in and no selections have been made.
    useEffect(() => {
        if (onboardingData.gmc.isOptedIn === true) {
            const noDependentsSelected = !onboardingData.gmc.selectedSpouseId && (!onboardingData.gmc.selectedChildIds || onboardingData.gmc.selectedChildIds.length === 0);
            const dependentsAvailable = spouse || children.length > 0;

            if (noDependentsSelected && dependentsAvailable) {
                setValue('selectedSpouseId', spouse?.id || '', { shouldDirty: true });
                setValue('selectedChildIds', children.map(c => c.id), { shouldDirty: true });
            }
        }
    }, [onboardingData.gmc.isOptedIn, spouse, children, setValue, onboardingData.gmc.selectedSpouseId, onboardingData.gmc.selectedChildIds]);


    useEffect(() => {
        reset(onboardingData.gmc);
    }, [onboardingData.gmc, reset]);

    const onSubmit: SubmitHandler<GmcDetails> = async (formData) => {
        // Clear data from the other branch before saving
        const finalData = { ...formData };
        if (formData.isOptedIn) {
            finalData.gmcPolicyCopy = null;
            finalData.declarationAccepted = false;
        } else {
            finalData.selectedSpouseId = '';
            finalData.selectedChildIds = [];
        }
        updateGmc(finalData);
        await onValidated();
    };
    
    const handleDependentChange = (dependent: FamilyMember, isChecked: boolean) => {
        if (dependent.relation === 'Spouse') {
            setValue('selectedSpouseId', isChecked ? dependent.id : '', { shouldDirty: true });
        } else { // Child
            const currentChildIds = getValues('selectedChildIds') || [];
            const newChildIds = isChecked
                ? [...currentChildIds, dependent.id]
                : currentChildIds.filter(id => id !== dependent.id);
            setValue('selectedChildIds', newChildIds, { shouldDirty: true });
        }
    };
    
    if (isMobileView) {
        return (
             <form onSubmit={handleSubmit(onSubmit)} id="gmc-form">
                <p className="text-sm text-gray-400 mb-6">Please choose whether to enroll in the company's insurance plan.</p>
                <div className="space-y-4">
                    <p className="text-md font-semibold">Would you like to Avail Group Medical Cover?</p>
                    <Controller
                        name="isOptedIn"
                        control={control}
                        render={({ field }) => (
                            <div className="flex flex-col sm:flex-row gap-4">
                                <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer flex-1 ${field.value === true ? 'border-[#32cd32] bg-[#243524]' : 'border-[#374151]'}`}>
                                    <input type="radio" name={field.name} onBlur={field.onBlur} ref={field.ref} onChange={() => field.onChange(true)} checked={field.value === true} className="h-4 w-4 text-accent focus:ring-accent bg-transparent border-muted"/>
                                    <span className="ml-3 text-sm font-medium">Yes</span>
                                </label>
                                <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer flex-1 ${field.value === false ? 'border-[#32cd32] bg-[#243524]' : 'border-[#374151]'}`}>
                                    <input type="radio" name={field.name} onBlur={field.onBlur} ref={field.ref} onChange={() => field.onChange(false)} checked={field.value === false} className="h-4 w-4 text-accent focus:ring-accent bg-transparent border-muted"/>
                                    <span className="ml-3 text-sm font-medium">No</span>
                                </label>
                            </div>
                        )}
                    />

                    {isOptedIn === true && (
                        <div className="pt-4 space-y-4 animate-fade-in-down">
                            <label className="text-sm font-medium text-gray-400">Select Dependents</label>
                            {dependents.map(dep => {
                                const isChecked = dep.relation === 'Spouse' ? selectedSpouseId === dep.id : selectedChildIds.includes(dep.id);
                                return (
                                    <Checkbox
                                        key={dep.id}
                                        id={`dep-${dep.id}`}
                                        label={`${dep.name} (${dep.relation})`}
                                        checked={isChecked}
                                        onChange={(checked) => handleDependentChange(dep, checked)}
                                    />
                                );
                            })}
                        </div>
                    )}
                    {isOptedIn === false && (
                         <div className="pt-4 space-y-4 animate-fade-in-down">
                            <Controller name="gmcPolicyCopy" control={control} render={({ field, fieldState }) => (
                                <UploadDocument label="Upload GMC Policy Copy" file={field.value} onFileChange={field.onChange} error={fieldState.error?.message} allowCapture/>
                            )} />
                            <Controller name="declarationAccepted" control={control} render={({ field, fieldState }) => (
                                 <label className="flex items-center gap-3 p-4 bg-[#243524] rounded-lg border border-[#374151]">
                                    <input type="checkbox" checked={field.value ?? false} onChange={field.onChange} className="h-5 w-5 rounded text-accent focus:ring-accent bg-transparent border-[#9ca89c]" />
                                    <span>I declare I will not avail company GMC and the uploaded policy is valid.</span>
                                </label>
                            )} />
                         </div>
                    )}
                </div>
            </form>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} id="gmc-form">
            <FormHeader title="Group Medical Cover (GMC)" subtitle="Please choose whether to enroll in the company's insurance plan." />

            <div className="space-y-6">
                <div>
                    <label className="text-md font-semibold text-primary-text mb-2 block">Would you like to Avail Group Medical Cover?</label>
                    <Controller
                        name="isOptedIn"
                        control={control}
                        render={({ field }) => (
                            <div className="flex flex-col sm:flex-row gap-4">
                                <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer flex-1 ${field.value === true ? 'border-accent bg-accent-light' : 'border-border'}`}>
                                    <input type="radio" name={field.name} onBlur={field.onBlur} ref={field.ref} onChange={() => field.onChange(true)} checked={field.value === true} className="h-4 w-4 text-accent focus:ring-accent" />
                                    <span className="ml-3 text-sm font-medium">Yes</span>
                                </label>
                                <label className={`flex items-center p-4 rounded-lg border-2 cursor-pointer flex-1 ${field.value === false ? 'border-accent bg-accent-light' : 'border-border'}`}>
                                    <input type="radio" name={field.name} onBlur={field.onBlur} ref={field.ref} onChange={() => field.onChange(false)} checked={field.value === false} className="h-4 w-4 text-accent focus:ring-accent" />
                                    <span className="ml-3 text-sm font-medium">No</span>
                                </label>
                            </div>
                        )}
                    />
                    {errors.isOptedIn && <p className="mt-1 text-xs text-red-600">{errors.isOptedIn.message}</p>}
                </div>

                {isOptedIn === true && (
                    <div className="pt-4 border-t space-y-4 animate-fade-in-down">
                        <label className="text-md font-semibold text-primary-text mb-2 block">Select Dependents for Policy</label>
                        <p className="text-sm text-muted -mt-2 mb-2">Spouse and children are included by default. Uncheck any dependents you do not want to include.</p>

                        <div className="space-y-2 p-4 border rounded-lg bg-page">
                            {dependents.length > 0 ? (
                                dependents.map(dep => {
                                    const isChecked = dep.relation === 'Spouse'
                                        ? selectedSpouseId === dep.id
                                        : selectedChildIds.includes(dep.id);
                                    
                                    return (
                                        <Checkbox
                                            key={dep.id}
                                            id={`dep-${dep.id}`}
                                            label={`${dep.name} (${dep.relation})`}
                                            checked={isChecked}
                                            onChange={(checked) => handleDependentChange(dep, checked)}
                                        />
                                    );
                                })
                            ) : (
                                <p className="text-sm text-muted">No spouse or children added. Please add them in the "Family Details" section to include them in the policy.</p>
                            )}
                        </div>
                    </div>
                )}

                {isOptedIn === false && (
                    <div className="pt-4 border-t space-y-4 animate-fade-in-down">
                       <Controller
                            name="gmcPolicyCopy"
                            control={control}
                            render={({ field, fieldState }) => (
                                <UploadDocument
                                    label="Upload GMC Policy Copy"
                                    file={field.value}
                                    onFileChange={field.onChange}
                                    allowedTypes={['image/png', 'image/jpeg', 'application/pdf']}
                                    error={fieldState.error?.message}
                                />
                            )}
                       />

                       <Controller
                            name="declarationAccepted"
                            control={control}
                            render={({ field, fieldState }) => (
                                <div className="space-y-1">
                                    <Checkbox
                                        id="declarationAccepted"
                                        label="I declare that I will not avail company GMC and the uploaded policy is valid."
                                        checked={field.value ?? false}
                                        onChange={field.onChange}
                                    />
                                    {fieldState.error && <p className="text-xs text-red-600">{fieldState.error.message}</p>}
                                </div>
                            )}
                       />
                    </div>
                )}
            </div>
        </form>
    );
};

export default GmcDetails;
