
import React, { useState, useEffect } from 'react';
// FIX: Corrected named imports from react-router-dom to resolve module export errors.
import * as ReactRouterDOM from 'react-router-dom';
import { useForm, useFieldArray, Controller, SubmitHandler, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useEnrollmentRulesStore } from '../../store/enrollmentRulesStore';
import type { FamilyMember, UploadedFile } from '../../types';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import DatePicker from '../../components/ui/DatePicker';
import { Plus, Trash2 } from 'lucide-react';
import FormHeader from '../../components/onboarding/FormHeader';
import UploadDocument from '../../components/UploadDocument';
import { Type } from '@google/genai';
import { format, differenceInYears } from 'date-fns';
import { useAuthStore } from '../../store/authStore';

const formatNameToTitleCase = (value: string | undefined) => {
    if (!value) return '';
    return value.toLowerCase().replace(/\b(\w)/g, s => s.toUpperCase());
};

const nameValidation = yup.string().matches(/^[a-zA-Z\s.'-]*$/, 'Name can only contain letters and spaces').transform(formatNameToTitleCase);

const getValidationSchema = (enforceFamilyValidation: boolean, employeePersonalDetails: any) => {
    const familyMemberSchema = yup.object({
      id: yup.string().required(),
      relation: yup.string<FamilyMember['relation']>().oneOf(['Spouse', 'Child', 'Father', 'Mother', '']).required('Relation is required'),
      name: nameValidation.required('Name is required'),
      dob: yup.string().required('Date of birth is required')
          .test('age-validation', 'Invalid age for the selected relation.', function (value) {
              if (!enforceFamilyValidation || !value || !employeePersonalDetails.dob) return true;
              
              const { relation } = this.parent;
              const employeeDob = new Date(employeePersonalDetails.dob.replace(/-/g, '/'));
              const memberDob = new Date(value.replace(/-/g, '/'));
              if (isNaN(employeeDob.getTime()) || isNaN(memberDob.getTime())) return true;
              const ageDiff = differenceInYears(employeeDob, memberDob);

              switch (relation) {
                  case 'Father':
                      if (ageDiff >= -15) return this.createError({ path: 'dob', message: "Father must be at least 15 years older than the employee." });
                      break;
                  case 'Mother':
                      if (ageDiff >= -15) return this.createError({ path: 'dob', message: "Mother must be at least 15 years older than the employee." });
                      break;
                  case 'Spouse':
                      if (Math.abs(ageDiff) > 15) return this.createError({ path: 'dob', message: "Spouse's age should be within a reasonable range of the employee's age." });
                      break;
                  case 'Child':
                      if (ageDiff <= 15) return this.createError({ path: 'dob', message: "Employee must be at least 15 years older than their child." });
                      break;
              }
              return true;
          }),
      gender: yup.string<FamilyMember['gender']>().oneOf(['Male', 'Female', 'Other', ''])
        .test('is-populated', 'Gender must be auto-detected from the ID proof.', function(value) {
            const { idProof } = this.parent;
            return idProof ? !!value : true;
        })
        .test('gender-validation', 'Invalid gender for the selected relation.', function(value) {
            if (!enforceFamilyValidation || !value) return true;
            
            const { relation } = this.parent;
            const employeeGender = employeePersonalDetails.gender;

            switch (relation) {
                case 'Father':
                    if (value !== 'Male') return this.createError({ message: "Father must be male. The uploaded ID shows a different gender." });
                    break;
                case 'Mother':
                    if (value !== 'Female') return this.createError({ message: "Mother must be female. The uploaded ID shows a different gender." });
                    break;
                case 'Spouse':
                    if (employeeGender && value === employeeGender) {
                        return this.createError({ message: "Spouse's gender must be different from the employee's." });
                    }
                    break;
            }
            return true;
        }),
      occupation: yup.string().optional(),
      dependent: yup.boolean().required(),
      idProof: yup.mixed<UploadedFile | null>().nonNullable("ID Proof is required for each family member").nullable(),
    }).defined();

    return yup.object({
      family: yup.array().of(familyMemberSchema)
        .test('unique-members', 'Duplicate family members are not allowed (same name and DOB).', function (family) {
            if (!enforceFamilyValidation || !family) return true;
            const seen = new Set();
            for (const member of family) {
                const key = `${member.name?.toLowerCase()}|${member.dob}`;
                if (seen.has(key)) {
                    return this.createError({ path: 'family', message: `Duplicate entry for ${member.name} with DOB ${member.dob}.` });
                }
                seen.add(key);
            }
            return true;
        })
        .when([], {
            is: () => enforceFamilyValidation,
            then: schema => schema.min(1, 'At least one family member must be added.'),
            otherwise: schema => schema.optional(),
        })
        .required()
    });
};


interface OutletContext {
  onValidated: () => Promise<void>;
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
}

const FamilyDetails: React.FC = () => {
  const { onValidated, setToast } = ReactRouterDOM.useOutletContext<OutletContext>();
  const { user } = useAuthStore();
  const { data, updateFamily, updateFamilyMember } = useOnboardingStore();
  const { enforceFamilyValidation } = useEnrollmentRulesStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const validationSchema = getValidationSchema(enforceFamilyValidation || false, data.personal);

  const { control, handleSubmit, formState: { errors }, setValue, reset, trigger, watch } = useForm<{ family: FamilyMember[] }>({
    resolver: yupResolver(validationSchema),
    defaultValues: { family: data.family },
    mode: 'onBlur',
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'family' });
  const familyMembers = watch('family');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<number | null>(null);
  const isMobileView = user?.role === 'field_officer' && isMobile;
  
  useEffect(() => {
    reset({ family: data.family });
  }, [data.family, reset]);
  
  const calculateAge = (dobString: string | undefined): string => {
    if (!dobString) return '';
    try {
        const age = differenceInYears(new Date(), new Date(dobString.replace(/-/g, '/')));
        return age >= 0 ? `${age}` : '';
    } catch (e) {
        return '';
    }
  };


  const handleAddMember = () => {
    append({ id: `fam_${Date.now()}`, relation: '', name: '', dob: '', gender: '', dependent: false, occupation: '', idProof: null });
  };

  const handleRemoveClick = (index: number) => {
    setMemberToRemove(index);
    setIsModalOpen(true);
  };
  
  const handleConfirmRemove = () => {
    if (memberToRemove !== null) {
      remove(memberToRemove);
      setIsModalOpen(false);
      setMemberToRemove(null);
    }
  };

  const onSubmit: SubmitHandler<{ family: FamilyMember[] }> = async (formData) => {
    updateFamily(formData.family);
    await onValidated();
  };
  
    const familyIdProofSchema = {
      type: Type.OBJECT,
      properties: {
          name: { type: Type.STRING, description: "The person's full name as written on the card." },
          dob: { type: Type.STRING, description: "YYYY-MM-DD format." },
          gender: { type: Type.STRING, description: "The person's gender as 'Male', 'Female', or 'Other/Transgender'." }
      },
      required: ["name", "dob", "gender"],
  };

  const handleOcrComplete = (index: number) => (extractedData: any) => {
      const memberId = fields[index].id;
      const update: Partial<FamilyMember> = {};
      let genderFromDoc: FamilyMember['gender'] = '';

      if (extractedData.gender) {
          const extractedGenderLower = extractedData.gender.toLowerCase();
          if (extractedGenderLower.includes('male') || extractedGenderLower.includes('purush')) {
              genderFromDoc = 'Male';
          } else if (extractedGenderLower.includes('female') || extractedGenderLower.includes('mahila')) {
              genderFromDoc = 'Female';
          } else if (extractedGenderLower.includes('transgender')) {
              genderFromDoc = 'Other';
          }
      }

      if (genderFromDoc) {
          setValue(`family.${index}.gender`, genderFromDoc, { shouldValidate: true });
          update.gender = genderFromDoc;
      }

      if (extractedData.name) {
          const formattedName = formatNameToTitleCase(extractedData.name);
          setValue(`family.${index}.name`, formattedName, { shouldValidate: true });
          update.name = formattedName;
      }
      if (extractedData.dob) {
          try {
              const date = new Date(extractedData.dob.replace(/[-./]/g, '/'));
              if (!isNaN(date.getTime())) {
                  const formattedDate = format(date, 'yyyy-MM-dd');
                  setValue(`family.${index}.dob`, formattedDate, { shouldValidate: true });
                  update.dob = formattedDate;
              }
          } catch(e) { console.error("Could not parse date from OCR for family member", e); }
      }
      
      if (Object.keys(update).length > 0) {
        updateFamilyMember(memberId, update);
        setToast({ message: `Details for family member auto-filled.`, type: 'success'});
      }
  };

  if (isMobileView) {
    return (
        <form onSubmit={handleSubmit(onSubmit)} id="family-form">
            <p className="text-sm text-gray-400 mb-6">Please provide details of your family members.</p>
            {errors.family?.message && <p className="mb-2 text-xs text-red-500">{errors.family.message}</p>}
            <div className="space-y-4">
                {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border border-border rounded-xl space-y-4">
                        <div className="relative">
                            <Controller name={`family.${index}.relation`} control={control} render={({ field, fieldState }) => (
                               <select {...field} className="fo-select fo-select-arrow pr-12">
                                 <option value="">Select Relation</option><option>Spouse</option><option>Child</option><option>Father</option><option>Mother</option>
                               </select>
                            )} />
                            <Button type="button" variant="icon" size="sm" onClick={() => handleRemoveClick(index)} className="!absolute top-1/2 -translate-y-1/2 right-10 p-1" aria-label={`Remove ${field.name}`}>
                                <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                        </div>
                        <Controller name={`family.${index}.name`} control={control} render={({ field }) => ( <input placeholder="Name" {...field} className="fo-input"/> )} />
                        <Controller name={`family.${index}.dob`} control={control} render={({ field }) => ( <input type="date" {...field} className="fo-input"/> )} />
                        <input placeholder="Age" value={calculateAge(familyMembers?.[index]?.dob)} readOnly className="fo-input bg-gray-700/50 cursor-not-allowed" />
                        <Controller name={`family.${index}.gender`} control={control} render={({ field }) => (
                            <input placeholder="Gender (from ID)" {...field} readOnly className="fo-input bg-gray-700/50 cursor-not-allowed" />
                        )} />
                        <Controller name={`family.${index}.idProof`} control={control} render={({ field, fieldState }) => ( <UploadDocument label="ID Proof (Mandatory)" file={field.value} onFileChange={field.onChange} error={fieldState.error?.message} allowCapture onOcrComplete={handleOcrComplete(index)} ocrSchema={familyIdProofSchema} setToast={setToast}/> )} />
                    </div>
                ))}
            </div>
             <button type="button" onClick={handleAddMember} className="mt-6 fo-btn-add-item">
                <Plus className="mr-2 h-4 w-4" />
                <span>Add Family Member</span>
            </button>
        </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} id="family-form">
      <Modal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmRemove}
        title="Confirm Deletion"
      >
        Are you sure you want to remove this family member? This action cannot be undone.
      </Modal>

      <FormHeader title="Family Details" subtitle="Please provide details of your family members." />
      {errors.family?.message && <p className="mb-4 text-sm text-red-600">{errors.family.message}</p>}

      <div className="space-y-6">
        {fields.map((field, index) => (
          <div key={field.id} className="p-4 border border-border rounded-xl relative">
            <button
                type="button"
                onClick={() => handleRemoveClick(index)}
                className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-100 rounded-full"
                aria-label={`Remove ${field.name}`}
            >
                <Trash2 className="h-4 w-4" />
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                    <Controller name={`family.${index}.relation`} control={control} render={({ field }) => ( <Select label="Relation" id={field.name} error={errors.family?.[index]?.relation?.message} {...field} onChange={(e) => { field.onChange(e); trigger(`family.${index}.gender`); }} > <option value="">Select</option><option>Spouse</option><option>Child</option><option>Father</option><option>Mother</option> </Select> )} />
                </div>
                <div className="lg:col-span-2">
                    <Controller name={`family.${index}.name`} control={control} render={({ field }) => ( <Input label="Name" id={field.name} error={errors.family?.[index]?.name?.message} {...field} /> )} />
                </div>
                
                <Controller name={`family.${index}.gender`} control={control} render={({ field }) => ( <Input label="Gender (from ID)" id={field.name} error={errors.family?.[index]?.gender?.message} {...field} readOnly className="bg-page cursor-not-allowed" placeholder="Upload ID to auto-fill" /> )} />
                <Controller name={`family.${index}.dob`} control={control} render={({ field }) => ( <DatePicker label="Date of Birth" id={field.name} error={errors.family?.[index]?.dob?.message} {...field} maxDate={new Date()} /> )} />

                <div>
                    <label htmlFor={`family.${index}.age`} className="block text-sm font-medium text-muted">Age</label>
                    <Input 
                        id={`family.${index}.age`} 
                        value={calculateAge(familyMembers?.[index]?.dob)}
                        readOnly
                        className="bg-page cursor-not-allowed mt-1"
                        placeholder="Auto-calculated"
                    />
                </div>
                
                <Controller name={`family.${index}.occupation`} control={control} render={({ field }) => ( <Input label="Occupation (Optional)" id={field.name} error={errors.family?.[index]?.occupation?.message} {...field} /> )} />
                
                <div className="flex items-end pb-2 sm:col-span-2 lg:col-span-4">
                  <Controller name={`family.${index}.dependent`} control={control} render={({ field: { value, ...restField } }) => (
                    <div className="flex items-center">
                        <input type="checkbox" id={restField.name} className="h-4 w-4 text-accent" checked={value} {...restField}/>
                        <label htmlFor={restField.name} className="ml-2 block text-sm text-muted">Dependent?</label>
                    </div>
                  )} />
                </div>
                
                <div className="sm:col-span-2 lg:col-span-4">
                  <Controller name={`family.${index}.idProof`} control={control} render={({ field, fieldState }) => (
                    <UploadDocument
                        label="ID Proof (Mandatory)"
                        file={field.value}
                        onFileChange={field.onChange}
                        onOcrComplete={handleOcrComplete(index)}
                        ocrSchema={familyIdProofSchema}
                        setToast={setToast}
                        error={fieldState.error?.message as string}
                    />
                  )} />
                </div>
            </div>
          </div>
        ))}
      </div>
      
      <Button type="button" onClick={handleAddMember} variant="outline" className="mt-6">
        <Plus className="mr-2 h-4 w-4" /> Add Family Member
      </Button>
    </form>
  );
};

export default FamilyDetails;
