

import React, { useState } from 'react';
import { useOnboardingStore } from '../../store/onboardingStore';
import type { EducationRecord } from '../../types';
import Input from '../ui/Input';
import Button from '../ui/Button';
// FIX: Changed import to use the correct UploadDocument component.
import UploadDocument from '../UploadDocument';
import Modal from '../ui/Modal';
import { Plus, Trash2 } from 'lucide-react';
import FormHeader from './FormHeader';

const EducationDetailsForm: React.FC = () => {
    const { data, addEducationRecord, updateEducationRecord, removeEducationRecord } = useOnboardingStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [recordToRemove, setRecordToRemove] = useState<string | null>(null);

    const handleAddRecord = () => {
        addEducationRecord();
    };

    const handleRemoveClick = (id: string) => {
        setRecordToRemove(id);
        setIsModalOpen(true);
    };

    const handleConfirmRemove = () => {
        if (recordToRemove) {
            removeEducationRecord(recordToRemove);
            setIsModalOpen(false);
            setRecordToRemove(null);
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
              Are you sure you want to remove this education record? This action cannot be undone.
            </Modal>
            
            <FormHeader title="Education Details" subtitle="List your educational qualifications, starting with the most recent." />
            
            <div className="space-y-6">
                {data.education.map((record) => (
                    <div key={record.id} className="p-4 border border-border rounded-xl relative">
                        <button
                            type="button"
                            onClick={() => handleRemoveClick(record.id)}
                            className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-100 rounded-full"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <Input
                                label="Degree / Certificate"
                                id={`edu_degree_${record.id}`}
                                defaultValue={record.degree}
                                onBlur={(e) => updateEducationRecord(record.id, { degree: e.target.value })}
                            />
                            <Input
                                label="Institution / University"
                                id={`edu_institution_${record.id}`}
                                defaultValue={record.institution}
                                onBlur={(e) => updateEducationRecord(record.id, { institution: e.target.value })}
                            />
                            <Input
                                // FIX: Corrected property from yearOfCompletion to endYear
                                label="Year of Completion"
                                id={`edu_year_${record.id}`}
                                type="text"
                                maxLength={4}
                                defaultValue={record.endYear}
                                // FIX: Corrected property from yearOfCompletion to endYear
                                onBlur={(e) => updateEducationRecord(record.id, { endYear: e.target.value })}
                            />
                            <UploadDocument
                                label="Upload Certificate (Optional)"
                                file={record.document}
                                onFileChange={(file) => updateEducationRecord(record.id, { document: file })}
                             />
                        </div>
                    </div>
                ))}
            </div>

            <Button
                type="button"
                onClick={handleAddRecord}
                variant="outline"
                className="mt-6"
            >
                <Plus className="mr-2 h-4 w-4" /> Add Qualification
            </Button>
        </div>
    );
};

export default EducationDetailsForm;