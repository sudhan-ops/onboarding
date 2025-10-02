

import React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useOnboardingStore } from '../../store/onboardingStore';
// FIX: Corrected type import name
import type { EsiDetails } from '../../types';
import Input from '../ui/Input';
import FormHeader from './FormHeader';

const ESIDetailsForm: React.FC = () => {
    // FIX: Corrected store method name from updateESI to updateEsi
    const { data, updateEsi } = useOnboardingStore();
    const { register, control } = useForm<EsiDetails>({ defaultValues: data.esi });
    
    const hasEsi = useWatch({ control, name: 'hasEsi' });

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // FIX: Corrected store method name from updateESI to updateEsi
        updateEsi({ hasEsi: e.target.checked });
    };

    return (
        <form id="esi-form">
             <FormHeader title="ESI Details" subtitle="Provide your Employee's State Insurance number if applicable." />

            <div className="space-y-6">
                <div className="flex items-center">
                    <input
                        id="hasEsi"
                        type="checkbox"
                        {...register('hasEsi', { onChange: handleCheckboxChange })}
                        className="h-4 w-4 text-accent border-gray-300 rounded focus:ring-accent"
                    />
                    <label htmlFor="hasEsi" className="ml-2 block text-sm text-text-secondary">Are you covered under ESI?</label>
                </div>
                {hasEsi && (
                    <div className="max-w-sm">
                        <Input
                            label="ESI Number"
                            id="esiNumber"
                            // FIX: Corrected store method name from updateESI to updateEsi
                            onBlur={(e) => updateEsi({ esiNumber: e.target.value })}
                            defaultValue={data.esi.esiNumber}
                        />
                    </div>
                )}
            </div>
        </form>
    );
};

export default ESIDetailsForm;