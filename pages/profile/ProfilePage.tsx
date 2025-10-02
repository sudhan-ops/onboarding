
import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuthStore } from '../../store/authStore';
import type { User, UploadedFile } from '../../types';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Toast from '../../components/ui/Toast';
import { api } from '../../services/api';
import { User as UserIcon, Loader2, ClipboardList, LogOut, LogIn, Crosshair } from 'lucide-react';
import { AvatarUpload } from '../../components/onboarding/AvatarUpload';
import { format } from 'date-fns';
import Modal from '../../components/ui/Modal';
import SlideToConfirm from '../../components/ui/SlideToConfirm';

// --- Profile Section ---
const profileValidationSchema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Must be a valid email').required('Email is required'),
  phone: yup.string().matches(/^[6-9][0-9]{9}$/, 'Must be a valid 10-digit Indian mobile number').optional().nullable(),
}).defined();

type ProfileFormData = Pick<User, 'name' | 'email' | 'phone'>;


// --- Main Component ---
const ProfilePage: React.FC = () => {
    const { user, updateUserProfile, isCheckedIn, isAttendanceLoading, toggleCheckInStatus, logout, lastCheckInTime, lastCheckOutTime } = useAuthStore();
    const navigate = ReactRouterDOM.useNavigate();
    const [isSaving, setIsSaving] = useState(false);
    const [isSubmittingAttendance, setIsSubmittingAttendance] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobileView = user?.role === 'field_officer' && isMobile;
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    // Profile form
    const { register, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors, isDirty } } = useForm<ProfileFormData>({
        // FIX: Provide explicit generic type to yupResolver to fix type inference issues.
        resolver: yupResolver<ProfileFormData>(profileValidationSchema),
        defaultValues: { name: user?.name || '', email: user?.email || '', phone: user?.phone || '' },
    });
    
    const handlePhotoChange = async (file: UploadedFile | null) => {
        if (!user) return;
        const originalPhotoUrl = user.photoUrl;

        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file.file);
            reader.onloadend = async () => {
                const base64String = reader.result as string;
                updateUserProfile({ photoUrl: base64String }); // Optimistic update
                try {
                    await api.updateUser(user.id, { photoUrl: base64String });
                    setToast({ message: 'Profile photo updated.', type: 'success' });
                } catch (e) {
                    setToast({ message: 'Failed to save photo.', type: 'error' });
                    updateUserProfile({ photoUrl: originalPhotoUrl }); // Revert on failure
                }
            };
        } else {
            updateUserProfile({ photoUrl: undefined }); // Optimistic update
            try {
                await api.updateUser(user.id, { photoUrl: undefined });
                setToast({ message: 'Profile photo removed.', type: 'success' });
            } catch (e) {
                setToast({ message: 'Failed to remove photo.', type: 'error' });
                updateUserProfile({ photoUrl: originalPhotoUrl }); // Revert on failure
            }
        }
    };

    const onProfileSubmit: SubmitHandler<ProfileFormData> = async (formData) => {
        if (!user) return;
        setIsSaving(true);
        try {
            const updatedUser = await api.updateUser(user.id, formData);
            updateUserProfile(updatedUser);
            setToast({ message: 'Profile updated successfully!', type: 'success' });
        } catch (error) {
            setToast({ message: 'Failed to update profile.', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleAttendanceAction = async () => {
        setIsSubmittingAttendance(true);
        const { success, message } = await toggleCheckInStatus();
        setToast({ message, type: success ? 'success' : 'error' });
        setIsSubmittingAttendance(false);
    };

    const handleLogoutClick = () => {
        setIsLogoutModalOpen(true);
    };

    const handleConfirmLogout = async () => {
        setIsLogoutModalOpen(false);
        await logout();
        navigate('/auth/login', { replace: true });
    };

    const formatTime = (isoString: string | null) => {
        if (!isoString) return '--:--';
        return format(new Date(isoString), 'hh:mm a');
    };

    if (!user) return <div>Loading user profile...</div>;
    
    const avatarFile: UploadedFile | null = user.photoUrl 
        ? { preview: user.photoUrl, name: 'Profile Photo', type: 'image/jpeg', size: 0, file: new File([], 'profile.jpg', { type: 'image/jpeg' }) } 
        : null;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
             <Modal
              isOpen={isLogoutModalOpen}
              onClose={() => setIsLogoutModalOpen(false)}
              onConfirm={handleConfirmLogout}
              title="Confirm Log Out"
            >
              Are you sure you want to log out?
            </Modal>
            
            <div className="bg-card p-6 sm:p-8 rounded-xl shadow-card">
                 <div className={`flex ${isMobileView ? 'flex-col items-center text-center' : 'flex-row items-center'} gap-6 mb-6`}>
                    <AvatarUpload 
                        file={avatarFile}
                        onFileChange={handlePhotoChange}
                    />
                    <div>
                        <h2 className="text-2xl font-bold text-primary-text">{user.name}</h2>
                        <p className="text-muted">{user.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border">
                    <h3 className="text-lg font-semibold text-primary-text mb-4">Profile Details</h3>
                    <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                        <Input label="Full Name" id="name" error={profileErrors.name?.message} registration={register('name')} />
                        <Input label="Email Address" id="email" type="email" error={profileErrors.email?.message} registration={register('email')} />
                        <Input label="Phone Number" id="phone" type="tel" error={profileErrors.phone?.message} registration={register('phone')} />
                        <div className="flex justify-end"><Button type="submit" isLoading={isSaving} disabled={!isDirty}>Save Changes</Button></div>
                    </form>
                </div>

                <div className="mt-8 pt-6 border-t border-border">
                    <h3 className="text-lg font-semibold text-primary-text mb-4">Attendance</h3>
                     {isAttendanceLoading ? (
                        <div className="flex items-center text-muted"><Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading status...</div>
                    ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <p>Your current status: 
                                <span className={`ml-2 font-bold px-2 py-1 rounded-full text-xs ${isCheckedIn ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{isCheckedIn ? 'Checked In' : 'Checked Out'}</span>
                            </p>
                             {!isMobileView && <Button onClick={handleAttendanceAction} isLoading={isSubmittingAttendance} variant={isCheckedIn ? 'danger' : 'primary'} size="md">{isCheckedIn ? 'Check Out' : 'Check In'}</Button>}
                        </div>
                    )}
                </div>
                
                {isMobileView && (
                     <div className="mt-8 pt-6 border-t border-border">
                        <h3 className="text-lg font-semibold text-primary-text mb-4">Work Hours Tracking</h3>
                        <div className="fo-attendance-card space-y-4">
                            <div className="flex justify-around">
                                <div className="text-center">
                                    <p className="fo-attendance-time">Last Check In</p>
                                    <p className="fo-attendance-time"><strong>{formatTime(lastCheckInTime)}</strong></p>
                                </div>
                                <div className="text-center">
                                    <p className="fo-attendance-time">Last Check Out</p>
                                    <p className="fo-attendance-time"><strong>{formatTime(lastCheckOutTime)}</strong></p>
                                </div>
                            </div>
                            
                            {isAttendanceLoading ? (
                                <div className="flex items-center justify-center text-muted h-[56px]">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            ) : isCheckedIn ? (
                                <SlideToConfirm
                                    onConfirm={handleAttendanceAction}
                                    isSubmitting={isSubmittingAttendance}
                                    text="Slide to Check Out"
                                    confirmText="Checking Out..."
                                    slideDirection="left"
                                    className="fo-slider--checkout"
                                />
                            ) : (
                                <SlideToConfirm
                                    onConfirm={handleAttendanceAction}
                                    isSubmitting={isSubmittingAttendance}
                                    text="Slide to Check In"
                                    confirmText="Checking In..."
                                    slideDirection="right"
                                    className="fo-slider--checkin"
                                />
                            )}
                        </div>
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-border">
                    <h3 className="text-lg font-semibold text-primary-text mb-4">Account Actions</h3>
                    {isMobileView ? (
                        <div className="space-y-4">
                            <button
                                onClick={() => navigate('/leaves/dashboard')} 
                                className="w-full flex items-center justify-center gap-2 fo-btn-secondary"
                            >
                                <Crosshair className="h-5 w-5" /> Tracker
                            </button>
                             <button
                                onClick={() => navigate('/onboarding/tasks')} 
                                className="w-full flex items-center justify-center gap-2 fo-btn-secondary"
                            >
                                <ClipboardList className="h-5 w-5" /> Tasks
                            </button>
                            <button
                                onClick={handleLogoutClick} 
                                className="w-full flex items-center justify-center gap-2 fo-btn-secondary !border-red-500/50 !text-red-300 hover:!bg-red-500/10"
                            >
                                <LogOut className="h-5 w-5" /> Log Out
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button 
                                onClick={() => navigate('/leaves/dashboard')} 
                                variant="outline"
                                className="w-full sm:w-auto justify-center"
                            >
                                <Crosshair className="mr-2 h-4 w-4" />
                                Tracker
                            </Button>
                            <Button 
                                onClick={() => navigate('/onboarding/tasks')} 
                                variant="outline"
                                className="w-full sm:w-auto justify-center"
                            >
                                <ClipboardList className="mr-2 h-4 w-4" />
                                Tasks
                            </Button>
                            <Button 
                                onClick={handleLogoutClick} 
                                variant="danger"
                                className="w-full sm:w-auto justify-center"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Log Out
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;