

import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { useOnboardingStore } from '../../store/onboardingStore';
import type { OnboardingData, FamilyMember } from '../../types';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { Plus, Trash2 } from 'lucide-react';
import FormHeader from './FormHeader';

const FamilyDetailsForm: React.FC = () => {
  const { data, addFamilyMember, removeFamilyMember, updateFamilyMember } = useOnboardingStore();
  const { control, register } = useForm<OnboardingData>({ defaultValues: data });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'family'
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<number | null>(null);

  const handleAddMember = () => {
    addFamilyMember();
  };

  const handleRemoveClick = (index: number) => {
    setMemberToRemove(index);
    setIsModalOpen(true);
  };
  
  const handleConfirmRemove = () => {
    if (memberToRemove !== null) {
      const memberId = fields[memberToRemove].id;
      removeFamilyMember(memberId);
      // We don't call react-hook-form's remove, as zustand is the source of truth
      // and the component will re-render.
      setIsModalOpen(false);
      setMemberToRemove(null);
    }
  };


  return (
    <div>
      <Modal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmRemove}
        title="Confirm Deletion"
      >
        Are you sure you want to remove this family member? This action cannot be undone.
      </Modal>

      <FormHeader title="Family Details" subtitle="Please provide details of your family members." />

      <div className="space-y-6">
        {data.family.map((member, index) => (
          <div key={member.id} className="p-4 border border-border rounded-xl relative">
            <button
                type="button"
                onClick={() => handleRemoveClick(index)}
                className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-100 rounded-full"
            >
                <Trash2 className="h-4 w-4" />
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
               <Select
                  label="Relation"
                  id={`family.${index}.relation`}
                  defaultValue={member.relation}
                  onChange={(e) => updateFamilyMember(member.id, { relation: e.target.value as FamilyMember['relation'] })}
               >
                    <option value="">Select Relation</option>
                    <option>Spouse</option>
                    <option>Child</option>
                    <option>Father</option>
                    <option>Mother</option>
               </Select>
               <Input 
                  label="Name" 
                  id={`family.${index}.name`}
                  defaultValue={member.name}
                  onBlur={(e) => updateFamilyMember(member.id, { name: e.target.value })}
                />
               <Input 
                  label="Date of Birth"
                  id={`family.${index}.dob`}
                  type="date"
                  defaultValue={member.dob}
                  onChange={(e) => updateFamilyMember(member.id, { dob: e.target.value })}
                />
                <div className="flex items-end pb-2">
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id={`family.${index}.dependent`}
                            className="h-4 w-4 text-accent border-gray-300 rounded focus:ring-accent"
                            defaultChecked={member.dependent}
                            onChange={(e) => updateFamilyMember(member.id, { dependent: e.target.checked })}
                        />
                        <label htmlFor={`family.${index}.dependent`} className="ml-2 block text-sm text-muted">Dependent?</label>
                    </div>
                </div>
            </div>
          </div>
        ))}
      </div>
      
      <Button
        type="button"
        onClick={handleAddMember}
        variant="outline"
        className="mt-6"
      >
        <Plus className="mr-2 h-4 w-4" /> Add Family Member
      </Button>
    </div>
  );
};

export default FamilyDetailsForm;