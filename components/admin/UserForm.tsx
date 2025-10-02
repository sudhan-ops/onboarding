
import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import type { User, UserRole, Organization } from '../../types';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { api } from '../../services/api';

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<User>) => void;
  initialData?: User | null;
  isSaving: boolean;
}

const validationSchema = yup.object({
  id: yup.string().required(),
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  role: yup.string<UserRole>().required('Role is required'),
  phone: yup.string().optional(),
  organizationId: yup.string().when('role', {
    is: 'site_manager' as UserRole,
    then: schema => schema.required('Site manager must be assigned to a site.'),
    otherwise: schema => schema.optional().nullable(),
  }),
  organizationName: yup.string().optional().nullable(),
  reportingManagerId: yup.string().optional(),
}).defined();

const UserForm: React.FC<UserFormProps> = ({ isOpen, onClose, onSave, initialData, isSaving }) => {
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<User>({
    // FIX: Provide explicit generic type to yupResolver to fix type inference issues.
    resolver: yupResolver<User>(validationSchema),
  });

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const isEditing = !!initialData;
  const role = watch('role');

  useEffect(() => {
    if (isOpen) {
      api.getOrganizations().then(setOrganizations);
      if (initialData) {
        reset(initialData);
      } else {
        reset({ id: `user_${Date.now()}`, name: '', email: '', role: 'field_officer' });
      }
    }
  }, [initialData, reset, isOpen]);
  
  const handleOrgChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const orgId = e.target.value;
      const org = organizations.find(o => o.id === orgId);
      setValue('organizationId', orgId);
      setValue('organizationName', org?.shortName || '');
  };

  const onSubmit: SubmitHandler<User> = (data) => {
    onSave(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-card rounded-xl shadow-card p-6 w-full max-w-lg m-4 animate-fade-in-scale">
        <form onSubmit={handleSubmit(onSubmit)}>
          <h3 className="text-lg font-bold text-primary-text mb-4">{isEditing ? 'Edit' : 'Add'} User</h3>
          <div className="space-y-4">
            <Input label="Full Name" id="name" registration={register('name')} error={errors.name?.message} />
            <Input label="Email" id="email" type="email" registration={register('email')} error={errors.email?.message} />
            <Select label="Role" id="role" registration={register('role')} error={errors.role?.message}>
                <option value="field_officer">Field Officer</option>
                <option value="site_manager">Site Manager</option>
                <option value="operation_manager">Operation Manager</option>
                <option value="hr">HR</option>
                <option value="admin">Admin</option>
                <option value="developer">Developer</option>
            </Select>
            {role === 'site_manager' && (
              <Select label="Assigned Site" id="organizationId" {...register('organizationId')} error={errors.organizationId?.message} onChange={handleOrgChange}>
                  <option value="">Select a Site</option>
                  {organizations.map(org => <option key={org.id} value={org.id}>{org.shortName}</option>)}
              </Select>
            )}
          </div>
          <div className="mt-6 flex justify-end space-x-3">
            <Button type="button" onClick={onClose} variant="secondary">Cancel</Button>
            <Button type="submit" isLoading={isSaving}>{isEditing ? 'Save Changes' : 'Create User'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserForm;
