

import React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useOnboardingStore } from '../../store/onboardingStore';
// FIX: Corrected type import name
import type { UanDetails } from '../../types';
import Input from '../ui/Input';
import FormHeader from './FormHeader';

const UANDetailsForm: React.FC = () => {
    // FIX: Corrected store method name from updateUAN to updateUan
    const { data, updateUan } = useOnboardingStore();
    const { register, control } = useForm<UanDetails>({ defaultValues: data.uan });

    const hasPreviousPf = useWatch({ control, name: 'hasPreviousPf' });
    
    // Persist changes on blur/change
    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // FIX: Corrected store method name from updateUAN to updateUan
        updateUan({ hasPreviousPf: e.target.checked });
    };

    return (
        <form id="uan-form">
            <FormHeader title="UAN / PF Details" subtitle="Provide your Universal Account Number if you have one." />
            
            <div className="space-y-6">
                <div className="flex items-center">
                    <input
                        id="hasPreviousPf"
                        type="checkbox"
                        {...register('hasPreviousPf', { onChange: handleCheckboxChange })}
                        className="h-4 w-4 text-accent border-gray-300 rounded focus:ring-accent"
                    />
                    <label htmlFor="hasPreviousPf" className="ml-2 block text-sm text-text-secondary">Do you have a previous PF account or UAN?</label>
                </div>
                {hasPreviousPf && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <Input
                            label="UAN Number"
                            id="uanNumber"
                            // FIX: Corrected store method name from updateUAN to updateUan
                            onBlur={(e) => updateUan({ uanNumber: e.target.value })}
                            defaultValue={data.uan.uanNumber}
                        />
                         <Input
                            // FIX: Renamed label to align with type definition
                            label="PF Number"
                            // FIX: Renamed id to align with type definition
                            id="pfNumber"
                            // FIX: Corrected property and store method names
                            onBlur={(e) => updateUan({ pfNumber: e.target.value })}
                            defaultValue={data.uan.pfNumber}
                        />
                    </div>
                )}
            </div>
        </form>
    );
};

export default UANDetailsForm;