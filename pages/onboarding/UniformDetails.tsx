
import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useOnboardingStore } from '../../store/onboardingStore';
import { api } from '../../services/api';
import type { SiteUniformDetailsConfig, MasterGentsUniforms, MasterLadiesUniforms, EmployeeUniformSelection } from '../../types';
import FormHeader from '../../components/onboarding/FormHeader';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import { Loader2, Shirt } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

interface OutletContext {
  onValidated: () => Promise<void>;
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
}

type FormData = {
    uniforms: {
        itemId: string;
        itemName: string;
        category: 'Pants' | 'Shirts';
        sizeId: string;
        quantity: number;
    }[];
};

const UniformDetails: React.FC = () => {
    const { onValidated, setToast } = useOutletContext<OutletContext>();
    const { user } = useAuthStore();
    const { data: onboardingData, updateUniforms } = useOnboardingStore();
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    const [isLoading, setIsLoading] = useState(true);
    const [configs, setConfigs] = useState<{
        details: Record<string, SiteUniformDetailsConfig>;
        gents: MasterGentsUniforms;
        ladies: MasterLadiesUniforms;
    } | null>(null);

    const { gender } = onboardingData.personal;
    const { organizationId, department, designation } = onboardingData.organization;
    const isMobileView = user?.role === 'field_officer' && isMobile;

    const { control, handleSubmit, reset } = useForm<FormData>();
    const { fields, replace } = useFieldArray({ control, name: "uniforms" });
    
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [details, gents, ladies] = await Promise.all([
                    api.getAllSiteUniformDetails(),
                    api.getMasterGentsUniforms(),
                    api.getMasterLadiesUniforms(),
                ]);
                setConfigs({ details, gents, ladies });
            } catch (error) {
                setToast({ message: 'Failed to load uniform configuration.', type: 'error' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [setToast]);

    const requiredItems = useMemo(() => {
        if (!configs || !organizationId || !department || !designation) return [];
        
        const siteConfig = configs.details[organizationId];
        if (!siteConfig) return [];

        const deptConfig = siteConfig.departments.find(d => d.department === department);
        if (!deptConfig) return [];

        const desigConfig = deptConfig.designations.find(d => d.designation === designation);
        return desigConfig?.items || [];
    }, [configs, organizationId, department, designation]);

    useEffect(() => {
        const itemsToRender = requiredItems.map(item => {
            const existing = onboardingData.uniforms.find(u => u.itemId === item.id);
            // FIX: Explicitly type the category to match the expected 'Pants' | 'Shirts' union type.
            const category: 'Pants' | 'Shirts' = item.name.toLowerCase().includes('pant') ? 'Pants' : 'Shirts';
            return {
                itemId: item.id,
                itemName: item.name,
                category: category,
                sizeId: existing?.sizeId || '',
                quantity: existing?.quantity || 1,
            };
        });
        replace(itemsToRender);
    }, [requiredItems, onboardingData.uniforms, replace]);


    const onSubmit = async (formData: FormData) => {
        // FIX: Corrected gender comparison from 'Ladies' to 'Female' to match type definition.
        const masterSizes = gender === 'Female' 
            ? [...(configs?.ladies.pants || []), ...(configs?.ladies.shirts || [])]
            : [...(configs?.gents.pants || []), ...(configs?.gents.shirts || [])];
            
        const selections: EmployeeUniformSelection[] = formData.uniforms
            .filter(u => u.sizeId && u.quantity > 0)
            .map(uniform => {
                const sizeInfo = masterSizes.find(s => s.id === uniform.sizeId);
                return {
                    itemId: uniform.itemId,
                    itemName: uniform.itemName,
                    sizeId: uniform.sizeId,
                    sizeLabel: sizeInfo?.size || '',
                    fit: sizeInfo?.fit || '',
                    quantity: uniform.quantity,
                };
            });

        updateUniforms(selections);
        await onValidated();
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;
    }

    if (!gender || requiredItems.length === 0) {
        const message = !gender 
            ? "Please select a gender in 'Personal Details' to view uniform options."
            : "No uniform requirements found for the selected site, department, and designation. You can proceed to the next step.";
        return (
            <form onSubmit={async (e) => { e.preventDefault(); await onValidated(); }} id="uniform-form">
                {!isMobileView && <FormHeader title="Uniform Details" subtitle="Provide uniform measurements for the employee." />}
                <div className="text-center p-8 bg-page rounded-lg">
                    <Shirt className="h-12 w-12 mx-auto text-muted" />
                    <p className="mt-4 text-muted">{message}</p>
                </div>
            </form>
        );
    }
    
    // FIX: Corrected gender comparison from 'Ladies' to 'Female' to match type definition.
    const masterSizes = gender === 'Female' ? configs?.ladies : configs?.gents;

    if (isMobileView) {
        return (
            <form onSubmit={handleSubmit(onSubmit)} id="uniform-form">
                <p className="text-sm text-gray-400 mb-6">Provide uniform measurements for the employee.</p>
                <div className="space-y-4">
                    {fields.map((field, index) => {
                        const sizeOptions = field.category === 'Pants' ? masterSizes?.pants : masterSizes?.shirts;
                        return (
                             <div key={field.id} className="p-4 border border-border rounded-xl space-y-4">
                                <h4 className="font-semibold text-primary-text">{field.itemName}</h4>
                                <Controller name={`uniforms.${index}.sizeId`} control={control} render={({ field: controllerField }) => (
                                    <select {...controllerField} className="fo-select fo-select-arrow">
                                        <option value="">-- Select Size --</option>
                                        {sizeOptions?.map(size => (
                                            <option key={size.id} value={size.id}>Size: {size.size} - {size.fit}</option>
                                        ))}
                                    </select>
                                )} />
                                 <Controller name={`uniforms.${index}.quantity`} control={control} render={({ field: controllerField }) => (
                                    <input type="number" min="1" {...controllerField} className="fo-input"/>
                                )} />
                            </div>
                        );
                    })}
                </div>
            </form>
        );
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} id="uniform-form">
            <FormHeader title="Uniform Details" subtitle="Provide uniform measurements for the employee." />
            <div className="space-y-6">
                {fields.map((field, index) => {
                    const sizeOptions = field.category === 'Pants' ? masterSizes?.pants : masterSizes?.shirts;
                    return (
                        <div key={field.id} className="p-4 border border-border rounded-xl bg-page/50">
                            <h4 className="font-semibold text-primary-text mb-2">{field.itemName}</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Controller
                                    name={`uniforms.${index}.sizeId`}
                                    control={control}
                                    rules={{ required: 'Please select a size' }}
                                    render={({ field: controllerField, fieldState }) => (
                                        <Select label="Size & Fit" error={fieldState.error?.message} {...controllerField}>
                                            <option value="">-- Select Size --</option>
                                            {sizeOptions?.map(size => (
                                                <option key={size.id} value={size.id}>
                                                    Size: {size.size} - {size.fit}
                                                </option>
                                            ))}
                                        </Select>
                                    )}
                                />
                                <Controller
                                    name={`uniforms.${index}.quantity`}
                                    control={control}
                                    rules={{ required: true, min: 1 }}
                                    render={({ field: controllerField }) => (
                                        <Input label="Quantity" type="number" min="1" {...controllerField} />
                                    )}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </form>
    );
};

export default UniformDetails;
