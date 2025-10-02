
import React, { useState, useEffect } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import * as ReactRouterDOM from 'react-router-dom';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useOnboardingStore } from '../../store/onboardingStore';
import { useEnrollmentRulesStore } from '../../store/enrollmentRulesStore';
import type { PersonalDetails, UploadedFile } from '../../types';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import FormHeader from '../../components/onboarding/FormHeader';
import UploadDocument from '../../components/UploadDocument';
import DatePicker from '../../components/ui/DatePicker';
import { Type } from "@google/genai";
import { format } from 'date-fns';
import VerifiedInput from '../../components/ui/VerifiedInput';
import { api } from '../../services/api';
import Modal from '../../components/ui/Modal';
import { useAuthStore } from '../../store/authStore';

const formatNameToTitleCase = (value: string | undefined) => {
    if (!value) return '';
    return value.toLowerCase().replace(/\b(\w)/g, s => s.toUpperCase());
}

const nameValidation = yup.string().matches(/^[a-zA-Z\s.'-]*$/, 'Name can only contain letters, spaces, and apostrophes').transform(formatNameToTitleCase);

export const personalDetailsSchema = yup.object({
    employeeId: yup.string().required(),
    firstName: nameValidation.required('First name is required'),
    middleName: nameValidation.optional(),
    lastName: nameValidation.required('Last name is required'),
    preferredName: nameValidation.optional(),
    dob: yup.string().required('Date of birth is required')
        .test('not-in-future', 'Date of birth cannot be in the future', (value) => {
            if (!value) return true;
            return new Date(value.replace(/-/g, '/')) <= new Date();
        }),
    gender: yup.string<PersonalDetails['gender']>().oneOf(['Male', 'Female', 'Other', '']).required('Gender is required'),
    maritalStatus: yup.string<PersonalDetails['maritalStatus']>().oneOf(['Single', 'Married', 'Divorced', 'Widowed', '']).required('Marital status is required'),
    bloodGroup: yup.string<PersonalDetails['bloodGroup']>().oneOf(['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).required('Blood group is required'),
    mobile: yup.string().required('Mobile number is required').matches(/^[6-9][0-9]{9}$/, 'Must be a valid 10-digit Indian mobile number'),
    alternateMobile: yup.string()
        .required('Alternate mobile number is required')
        .matches(/^[6-9][0-9]{9}$/, 'Must be a valid 10-digit Indian mobile number')
        .notOneOf([yup.ref('mobile')], "Alternate number cannot be the same as the primary mobile number."),
    email: yup.string().email('Must be a valid email').required('Email is required'),
    idProofType: yup.string<'Aadhaar' | 'PAN' | 'Voter ID' | ''>().oneOf(['Aadhaar', 'PAN', 'Voter ID', '']).required('ID proof type is required'),
    idProofNumber: yup.string().required('ID proof number is required')
        .when('idProofType', {
            is: 'Aadhaar',
            then: schema => schema
                .transform(value => (value ? value.replace(/[-\s]/g, '') : value))
                .matches(/^[0-9]{12}$/, 'Aadhaar must be 12 digits.'),
            otherwise: schema => schema,
        })
        .when('idProofType', {
            is: 'PAN',
            then: schema => schema
                .transform(value => (value ? value.toUpperCase().replace(/[-\s]/g, '') : value))
                .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (e.g., ABCDE1234F).'),
            otherwise: schema => schema,
        })
        .when('idProofType', {
            is: 'Voter ID',
            then: schema => schema
                .transform(value => (value ? value.toUpperCase().replace(/[-\s]/g, '') : value))
                .matches(/^[A-Z]{3}[0-9]{7}$/, 'Invalid Voter ID format (e.g., ABC1234567).'),
            otherwise: schema => schema,
        }),
    emergencyContactName: nameValidation.required('Emergency contact name is required')
      .test('not-same-as-employee', 'Emergency contact name cannot be the same as the employee', function(value) {
          const { firstName, lastName } = this.parent;
          const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
          return value?.toLowerCase() !== fullName.toLowerCase();
      }),
    emergencyContactNumber: yup.string().required('Emergency contact number is required').matches(/^[6-9][0-9]{9}$/, 'Must be a valid 10-digit number')
      .notOneOf([yup.ref('mobile')], "Emergency contact number can't be same as employee's mobile."),
    relationship: yup.string<PersonalDetails['relationship']>().oneOf(['Spouse', 'Child', 'Father', 'Mother', 'Sibling', 'Other', '']).required('Relationship is required'),
    salary: yup.number().typeError('Salary must be a number').min(0, 'Salary cannot be negative').required('Monthly salary is required').nullable(),
    photo: yup.mixed<UploadedFile | null>().required("Profile photo is required.").nullable(),
    idProofFront: yup.mixed<UploadedFile | null>().required("ID proof (Front) is required.").nullable(),
    idProofBack: yup.mixed<UploadedFile | null>().when('idProofType', {
        is: (value: string) => value === 'Aadhaar' || value === 'Voter ID',
        then: schema => schema.required("Back side of ID proof is required.").nullable(),
        otherwise: schema => schema.optional().nullable(),
    }),
    verifiedStatus: yup.object().optional(),
}).defined();

interface OutletContext {
  onValidated: () => Promise<void>;
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
}

const PersonalDetails: React.FC = () => {
    const { onValidated, setToast } = ReactRouterDOM.useOutletContext<OutletContext>();
    const { user } = useAuthStore();
    const { allowSalaryEdit } = useEnrollmentRulesStore();
    const { data, updatePersonal, updateAddress, updateBank, setPersonalVerifiedStatus, setSalaryChangeRequest, addOrUpdateEmergencyContactAsFamilyMember } = useOnboardingStore();
    
    const [salaryModal, setSalaryModal] = useState<{ isOpen: boolean; data: PersonalDetails | null }>({ isOpen: false, data: null });

    const { register, handleSubmit, formState: { errors }, control, watch, setValue, reset } = useForm<PersonalDetails>({
        resolver: yupResolver<PersonalDetails>(personalDetailsSchema),
        defaultValues: data.personal,
    });

    useEffect(() => {
        // Sync form with global store data, which might have been pre-filled
        reset(data.personal);
    }, [data.personal, reset]);

    const idProofType = watch('idProofType');
    const personalData = watch();

    const onSubmit: SubmitHandler<PersonalDetails> = async (formData) => {
        const originalSalary = data.organization.defaultSalary;
        const newSalary = formData.salary;
        const fullName = [formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(' ');

        if (!data.bank.accountHolderName) {
            updateBank({ accountHolderName: fullName });
        }
        
        updatePersonal(formData);

        if (allowSalaryEdit && newSalary !== null && originalSalary !== null && newSalary !== originalSalary) {
            setSalaryModal({ isOpen: true, data: formData });
        } else {
            await onValidated();
        }
    };
    
    const handleConfirmSalaryChange = async () => {
        if (!salaryModal.data || !user) return;
        
        try {
            const request = await api.createSalaryChangeRequest(data, salaryModal.data.salary!, user.id);
            setSalaryChangeRequest(request);
            setToast({ message: 'Salary change request submitted for approval.', type: 'success' });
            await onValidated();
        } catch (error) {
            setToast({ message: 'Failed to create salary change request.', type: 'error' });
        } finally {
            setSalaryModal({ isOpen: false, data: null });
        }
    };

    const handleNameBlur = (fieldName: 'firstName' | 'middleName' | 'lastName' | 'preferredName' | 'emergencyContactName') => (event: React.FocusEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setValue(fieldName, formatNameToTitleCase(value), { shouldValidate: true });
    };

    const handleManualInput = (fieldsToUnverify: Array<keyof PersonalDetails['verifiedStatus']>) => {
        const statusUpdate: Partial<PersonalDetails['verifiedStatus']> = {};
        fieldsToUnverify.forEach(field => {
            statusUpdate[field] = false;
        });
        setPersonalVerifiedStatus(statusUpdate);
    };

    const handleOcrComplete = (extractedData: any) => {
        const personalUpdate: Partial<PersonalDetails> = {};
        let detailsUpdated = false;
        const newVerifiedStatus: Partial<PersonalDetails['verifiedStatus']> = {};
    
        if (extractedData.name) {
            const nameParts = extractedData.name.split(' ');
            const firstName = formatNameToTitleCase(nameParts.shift() || '');
            const lastName = formatNameToTitleCase(nameParts.pop() || '');
            const middleName = nameParts.join(' ');
            setValue('firstName', firstName, { shouldValidate: true });
            personalUpdate.firstName = firstName;
            setValue('preferredName', firstName, { shouldValidate: true });
            personalUpdate.preferredName = firstName;
            setValue('lastName', lastName, { shouldValidate: true });
            personalUpdate.lastName = lastName;
            if (middleName) {
                setValue('middleName', formatNameToTitleCase(middleName), { shouldValidate: true });
                personalUpdate.middleName = formatNameToTitleCase(middleName);
            }
            newVerifiedStatus.name = true;
            detailsUpdated = true;
        }
        if (extractedData.dob) {
            try {
                // Handle various date formats by replacing separators before parsing
                const date = new Date(extractedData.dob.replace(/[-./]/g, '/'));
                if (!isNaN(date.getTime())) {
                    const formattedDate = format(date, 'yyyy-MM-dd');
                    setValue('dob', formattedDate, { shouldValidate: true });
                    personalUpdate.dob = formattedDate;
                    newVerifiedStatus.dob = true;
                    detailsUpdated = true;
                }
            } catch (e) { console.error("Could not parse date from OCR", e); }
        }
        if (extractedData.gender) {
            let genderValue: PersonalDetails['gender'] = '';
            const extractedGenderLower = extractedData.gender.toLowerCase();
            if (extractedGenderLower.includes('male') || extractedGenderLower.includes('purush')) {
                genderValue = 'Male';
            } else if (extractedGenderLower.includes('female') || extractedGenderLower.includes('mahila')) {
                genderValue = 'Female';
            } else if (extractedGenderLower.includes('transgender')) {
                genderValue = 'Other';
            }
            if (genderValue) {
                setValue('gender', genderValue, { shouldValidate: true });
                personalUpdate.gender = genderValue;
                detailsUpdated = true;
            }
        }
        if (extractedData.aadhaarNumber) {
            const aadhaar = extractedData.aadhaarNumber.replace(/\s/g, '');
            setValue('idProofNumber', aadhaar, { shouldValidate: true });
            personalUpdate.idProofNumber = aadhaar;
            setValue('idProofType', 'Aadhaar', { shouldValidate: true });
            personalUpdate.idProofType = 'Aadhaar';
            newVerifiedStatus.idProofNumber = true;
            detailsUpdated = true;
        }
        if (extractedData.panNumber) {
            const pan = extractedData.panNumber.replace(/\s/g, '');
            setValue('idProofNumber', pan, { shouldValidate: true });
            personalUpdate.idProofNumber = pan;
            setValue('idProofType', 'PAN', { shouldValidate: true });
            personalUpdate.idProofType = 'PAN';
            newVerifiedStatus.idProofNumber = true;
            detailsUpdated = true;
        }
        if (extractedData.voterIdNumber) {
            const voterId = extractedData.voterIdNumber.replace(/\s/g, '').toUpperCase();
            setValue('idProofNumber', voterId, { shouldValidate: true });
            personalUpdate.idProofNumber = voterId;
            setValue('idProofType', 'Voter ID', { shouldValidate: true });
            personalUpdate.idProofType = 'Voter ID';
            newVerifiedStatus.idProofNumber = true;
            detailsUpdated = true;
        }
    
        if (Object.keys(personalUpdate).length > 0) {
            updatePersonal(personalUpdate);
        }

        let addressUpdated = false;
        if (extractedData.address) {
            const { line1, city, state, pincode } = extractedData.address;
            if (line1 && city && state && pincode) {
                const newAddress = {
                    line1, city, state, pincode: pincode.replace(/\s/g, ''), country: 'India',
                    verifiedStatus: { line1: true, city: true, state: true, pincode: true, country: true }
                };
                updateAddress({ present: newAddress, permanent: newAddress, sameAsPresent: true });
                addressUpdated = true;
            }
        }
    
        if (detailsUpdated || addressUpdated) {
            const message = [detailsUpdated && "Details", addressUpdated && "Address"]
                .filter(Boolean).join(" & ") + " auto-filled from document. Please review.";
            setToast({ message, type: 'success' });
        }
    
        setPersonalVerifiedStatus(newVerifiedStatus);
    };

    const handleProfileVerification = async (base64: string, mimeType: string) => {
        try {
            const result = await api.verifyHumanPhoto(base64, mimeType);
            return { success: result.isHuman, reason: result.reason };
        } catch (error: any) {
            return { success: false, reason: error.message || 'Verification failed.' };
        }
    };
    

    const idProofSchema = {
        type: Type.OBJECT,
        properties: {
            isAadhaar: { type: Type.BOOLEAN, description: "Set to true if the document is clearly an Aadhaar card, otherwise false." },
            name: { type: Type.STRING, description: "The person's full name as written on the card." },
            dob: { type: Type.STRING, description: "The person's date of birth in YYYY-MM-DD format." },
            gender: { type: Type.STRING, description: "The person's gender as 'Male', 'Female', or 'Transgender'." },
            aadhaarNumber: { type: Type.STRING, description: "The 12-digit Aadhaar number." },
            panNumber: { type: Type.STRING, description: "The 10-character PAN number." },
            voterIdNumber: { type: Type.STRING, description: "The Voter ID number, also known as EPIC number." },
            reason: { type: Type.STRING, description: "If isAadhaar is false, briefly explain why (e.g., 'Document is a PAN card')." },
            address: {
                type: Type.OBJECT,
                description: "The full address found on the card, parsed into components. Only extract for Aadhaar card.",
                properties: {
                    line1: { type: Type.STRING, description: "The address line(s) before the city, state, and pin. Include house number, street, locality, and post office. Exclude city, state, and pincode." },
                    city: { type: Type.STRING, description: "The city or district name." },
                    state: { type: Type.STRING, description: "The state name." },
                    pincode: { type: Type.STRING, description: "The 6-digit pin code." }
                }
            }
        },
    };

    return (
        <>
            <Modal
                isOpen={salaryModal.isOpen}
                onClose={() => setSalaryModal({ isOpen: false, data: null })}
                onConfirm={handleConfirmSalaryChange}
                title="Confirm Salary Change"
            >
                <p>You have changed the monthly salary from <strong>₹{data.organization.defaultSalary?.toLocaleString('en-IN')}</strong> to <strong>₹{salaryModal.data?.salary?.toLocaleString('en-IN')}</strong>.</p>
                <p className="mt-2">This change requires approval from management. A notification will be sent to the relevant approvers.</p>
                <p className="mt-2 font-semibold">Do you want to proceed with this request?</p>
            </Modal>
            <form onSubmit={handleSubmit(onSubmit)} id="personal-form">
                <FormHeader title="Personal Details" subtitle="Please provide your personal information as per your official documents." />
                
                <div className="space-y-8">
                    <div>
                        <h4 className="text-md font-semibold text-primary-text mb-4">Profile Photo</h4>
                        <Controller name="photo" control={control} render={({ field }) => (
                            <UploadDocument
                            label="Upload a Live Photo of the User"
                            file={field.value}
                            onFileChange={field.onChange}
                            allowedTypes={['image/jpeg', 'image/png']}
                            error={errors.photo?.message as string}
                            allowCapture={true}
                            onVerification={handleProfileVerification}
                            />
                        )}/>
                    </div>

                    <div className="pt-6 border-t border-border">
                        <h4 className="text-md font-semibold text-primary-text mb-4">Identification</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                            <div className="space-y-6">
                                <Select label="ID Proof Type" id="idProofType" error={errors.idProofType?.message} registration={register('idProofType')}>
                                    <option value="">Select Type</option>
                                    <option value="Aadhaar">Aadhaar</option>
                                    <option value="PAN">PAN Card</option>
                                    <option value="Voter ID">Voter ID Card</option>
                                </Select>
                                <VerifiedInput
                                    label="ID Proof Number"
                                    id="idProofNumber"
                                    hasValue={!!personalData.idProofNumber}
                                    isVerified={!!data.personal.verifiedStatus?.idProofNumber}
                                    onManualInput={() => handleManualInput(['idProofNumber'])}
                                    error={errors.idProofNumber?.message}
                                    registration={register('idProofNumber')}
                                    disabled={!idProofType}
                                    placeholder={
                                        idProofType === 'Aadhaar' ? 'xxxx xxxx xxxx' :
                                        idProofType === 'PAN' ? 'ABCDE1234F' :
                                        idProofType === 'Voter ID' ? 'ABC1234567' :
                                        'Select a proof type first'
                                    }
                                    maxLength={idProofType === 'Aadhaar' ? 14 : idProofType === 'Voter ID' ? 10 : 10}
                                />
                            </div>
                            <div className="space-y-4">
                                <Controller name="idProofFront" control={control} render={({ field }) => (
                                    <UploadDocument
                                        label={`Upload ${idProofType || 'ID'} (Front Side)`}
                                        file={field.value}
                                        onFileChange={field.onChange}
                                        error={errors.idProofFront?.message as string}
                                        onOcrComplete={handleOcrComplete}
                                        ocrSchema={idProofSchema}
                                        setToast={setToast}
                                        docType={idProofType || undefined}
                                    />
                                )}/>
                                {(idProofType === 'Aadhaar' || idProofType === 'Voter ID') && (
                                     <Controller name="idProofBack" control={control} render={({ field }) => (
                                        <UploadDocument
                                            label={`Upload ${idProofType} (Back Side)`}
                                            file={field.value}
                                            onFileChange={field.onChange}
                                            error={errors.idProofBack?.message as string}
                                            onOcrComplete={handleOcrComplete}
                                            ocrSchema={idProofSchema}
                                            setToast={setToast}
                                            docType={'Aadhaar'}
                                        />
                                    )}/>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border">
                        <h4 className="text-md font-semibold text-primary-text mb-4">Personal Information</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                            <VerifiedInput label="First Name" id="firstName" hasValue={!!personalData.firstName} isVerified={!!data.personal.verifiedStatus?.name} onManualInput={() => handleManualInput(['name'])} error={errors.firstName?.message} registration={register('firstName')} onBlur={handleNameBlur('firstName')} />
                            <Input label="Middle Name (Optional)" id="middleName" registration={register('middleName')} onBlur={handleNameBlur('middleName')} />
                            <VerifiedInput label="Last Name" id="lastName" hasValue={!!personalData.lastName} isVerified={!!data.personal.verifiedStatus?.name} onManualInput={() => handleManualInput(['name'])} error={errors.lastName?.message} registration={register('lastName')} onBlur={handleNameBlur('lastName')} />
                            <Input label="Preferred Name (Optional)" id="preferredName" registration={register('preferredName')} onBlur={handleNameBlur('preferredName')} />
                            <Controller name="dob" control={control} render={({ field }) => (
                            <DatePicker label="Date of Birth" id="dob" error={errors.dob?.message} value={field.value} onChange={field.onChange} maxDate={new Date()} />
                            )} />
                            <Select label="Gender" id="gender" error={errors.gender?.message} registration={register('gender')}>
                                <option value="">Select Gender</option><option>Male</option><option>Female</option><option>Other</option>
                            </Select>
                            <Select label="Marital Status" id="maritalStatus" error={errors.maritalStatus?.message} registration={register('maritalStatus')}>
                                <option value="">Select Status</option><option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option>
                            </Select>
                            <Select label="Blood Group" id="bloodGroup" error={errors.bloodGroup?.message} registration={register('bloodGroup')}>
                                <option value="">Select</option><option>A+</option><option>A-</option><option>B+</option><option>B-</option><option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
                            </Select>
                            <Input label="Mobile Number" id="mobile" type="tel" error={errors.mobile?.message} registration={register('mobile')} />
                            <Input label="Alternate Mobile Number" id="alternateMobile" type="tel" error={errors.alternateMobile?.message} registration={register('alternateMobile')} />
                            <Input label="Email Address" id="email" type="email" error={errors.email?.message} registration={register('email')} />
                            <Input
                                label="Monthly Salary (Gross)"
                                id="salary"
                                type="number"
                                error={errors.salary?.message}
                                registration={register('salary')}
                                readOnly={!allowSalaryEdit}
                                className={!allowSalaryEdit ? 'bg-page cursor-not-allowed' : ''}
                                title={!allowSalaryEdit ? 'Salary editing is disabled by an administrator.' : ''}
                            />
                        </div>
                    </div>
                    
                    <div className="pt-6 border-t border-border">
                        <h4 className="text-md font-semibold text-primary-text mb-4">Emergency Contact</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="sm:col-span-2">
                                <Input label="Contact Name" id="emergencyContactName" error={errors.emergencyContactName?.message} registration={register('emergencyContactName')} onBlur={handleNameBlur('emergencyContactName')} />
                            </div>
                            <Input label="Contact Number" id="emergencyContactNumber" type="tel" error={errors.emergencyContactNumber?.message} registration={register('emergencyContactNumber')} />
                            <Select label="Relationship" id="relationship" error={errors.relationship?.message} registration={register('relationship')}>
                                <option value="">Select Relationship</option>
                                <option>Spouse</option><option>Child</option><option>Father</option><option>Mother</option><option>Sibling</option><option>Other</option>
                            </Select>
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
};

export default PersonalDetails;
