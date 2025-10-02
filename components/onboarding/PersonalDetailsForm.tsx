

import React from 'react';
// FIX: Remove unused 'watch' import
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useOnboardingStore } from '../../store/onboardingStore';
import type { PersonalDetails, UploadedFile } from '../../types';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { AvatarUpload } from './AvatarUpload';
import FormHeader from './FormHeader';

const validationSchema = yup.object({
    employeeId: yup.string().required(),
    firstName: yup.string().required('First name is required'),
    middleName: yup.string().optional(),
    // FIX: Corrected yup schema definition for lastName.
    lastName: yup.string().required('Last name is required'),
    preferredName: yup.string().optional(),
    dob: yup.string().required('Date of birth is required'),
    gender: yup.string<PersonalDetails['gender']>().oneOf(['Male', 'Female', 'Other', '']).required('Gender is required'),
    maritalStatus: yup.string<PersonalDetails['maritalStatus']>().oneOf(['Single', 'Married', 'Divorced', 'Widowed', '']).required('Marital status is required'),
    bloodGroup: yup.string<PersonalDetails['bloodGroup']>().oneOf(['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).required('Blood group is required'),
    mobile: yup.string().required('Mobile number is required').matches(/^[6-9][0-9]{9}$/, 'Must be a valid 10-digit Indian mobile number'),
    alternateMobile: yup.string().optional().nullable(),
    email: yup.string().email('Must be a valid email').required('Email is required'),
    idProofType: yup.string<'Aadhaar' | 'PAN' | ''>().oneOf(['Aadhaar', 'PAN', '']).optional(),
    idProofNumber: yup.string().optional(),
    photo: yup.mixed<UploadedFile | null>().optional().nullable(),
    idProof: yup.mixed<UploadedFile | null>().optional().nullable(),
    emergencyContactName: yup.string().required('Emergency contact name is required'),
    emergencyContactNumber: yup.string().required('Emergency contact number is required').matches(/^[6-9][0-9]{9}$/, 'Must be a valid 10-digit number'),
    relationship: yup.string<PersonalDetails['relationship']>().oneOf(['Spouse', 'Child', 'Father', 'Mother', 'Sibling', 'Other', '']).required('Relationship is required'),
    salary: yup.number().typeError('Salary must be a number').min(0).required('Salary is required').nullable(),
    verifiedStatus: yup.object().optional(),
}).defined();


interface PersonalDetailsFormProps {
    onValidated: () => void;
}

const PersonalDetailsForm: React.FC<PersonalDetailsFormProps> = ({ onValidated }) => {
    const { data, updatePersonal, addOrUpdateEmergencyContactAsFamilyMember } = useOnboardingStore();
    const { register, handleSubmit, formState: { errors }, control } = useForm<PersonalDetails>({
        resolver: yupResolver(validationSchema),
        defaultValues: data.personal,
    });

    const onSubmit: SubmitHandler<PersonalDetails> = (formData) => {
        updatePersonal(formData);
        addOrUpdateEmergencyContactAsFamilyMember();
        onValidated();
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} id="personal-form">
            <FormHeader title="Personal Details" subtitle="Please provide your personal information as per your official documents." />
            
            <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-shrink-0">
                     <Controller
                        name="photo"
                        control={control}
                        render={({ field }) => (
                            <AvatarUpload
                                file={field.value}
                                onFileChange={(file) => field.onChange(file)}
                             />
                        )}
                    />
                </div>

                <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="md:col-span-3">
                        <Input label="Employee ID" id="employeeId" registration={register('employeeId')} error={errors.employeeId?.message} readOnly className="bg-gray-100" />
                    </div>
                    <Input label="First Name" id="firstName" registration={register('firstName')} error={errors.firstName?.message} />
                    <Input label="Middle Name (Optional)" id="middleName" registration={register('middleName')} />
                    <Input label="Last Name" id="lastName" registration={register('lastName')} error={errors.lastName?.message} />
                    <Input label="Preferred Name (Optional)" id="preferredName" registration={register('preferredName')} />
                    <Input label="Date of Birth" id="dob" type="date" registration={register('dob')} error={errors.dob?.message} />
                    <Select label="Gender" id="gender" registration={register('gender')} error={errors.gender?.message}>
                        <option value="">Select Gender</option><option>Male</option><option>Female</option><option>Other</option>
                    </Select>
                    <Select label="Marital Status" id="maritalStatus" registration={register('maritalStatus')} error={errors.maritalStatus?.message}>
                        <option value="">Select Status</option><option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option>
                    </Select>
                    <Select label="Blood Group" id="bloodGroup" registration={register('bloodGroup')} error={errors.bloodGroup?.message}>
                        <option value="">Select</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
                    </Select>
                    <Input label="Mobile Number" id="mobile" type="tel" registration={register('mobile')} error={errors.mobile?.message} />
                    <Input label="Alternate Mobile (Optional)" id="alternateMobile" type="tel" registration={register('alternateMobile')} />
                    <Input label="Email Address" id="email" type="email" registration={register('email')} error={errors.email?.message} />
                    <Input label="Monthly Salary (Gross)" id="salary" type="number" registration={register('salary')} error={errors.salary?.message} />

                    <div className="md:col-span-3 pt-4 border-t">
                         <h4 className="text-md font-semibold text-primary-text mb-4">Emergency Contact</h4>
                         <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <Input label="Contact Name" id="emergencyContactName" registration={register('emergencyContactName')} error={errors.emergencyContactName?.message} />
                            <Input label="Contact Number" id="emergencyContactNumber" type="tel" registration={register('emergencyContactNumber')} error={errors.emergencyContactNumber?.message} />
                            <Select label="Relationship" id="relationship" registration={register('relationship')} error={errors.relationship?.message}>
                                <option value="">Select Relationship</option>
                                <option>Spouse</option><option>Child</option><option>Father</option><option>Mother</option><option>Sibling</option><option>Other</option>
                            </Select>
                         </div>
                    </div>
                </div>
            </div>
        </form>
    );
};

// FIX: Added default export to resolve module import error.
export default PersonalDetailsForm;
