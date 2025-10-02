import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import * as ReactRouterDOM from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import type { User } from '../../types';
import { Mail, Lock, Phone } from 'lucide-react';
import { firebaseAuthService } from '../../services/supabase';
import type { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';


const emailValidationSchema = yup.object({
    email: yup.string().email('Must be a valid email').required('Email is required'),
    password: yup.string().required('Password is required'),
}).defined();
type EmailFormInputs = yup.InferType<typeof emailValidationSchema>;

const phoneValidationSchema = yup.object({
    phone: yup.string().required('Phone number is required').matches(/^[6-9][0-9]{9}$/, 'Must be a valid 10-digit Indian mobile number'),
}).defined();
type PhoneFormInputs = yup.InferType<typeof phoneValidationSchema>;

const otpValidationSchema = yup.object({
    otp: yup.string().required('OTP is required').matches(/^[0-9]{6}$/, 'Must be a 6-digit code'),
}).defined();
type OtpFormInputs = yup.InferType<typeof otpValidationSchema>;


const getHomeRoute = (user: User) => {
    switch (user.role) {
        case 'admin': return "/verification/dashboard";
        case 'hr': return "/hr/entities";
        case 'developer': return "/developer/api";
        case 'operation_manager': return "/operations/dashboard";
        case 'site_manager': return "/site/dashboard";
        case 'field_officer': return "/onboarding";
        default: return "/auth/login";
    }
};

const getFriendlyAuthError = (errorMessage: string): string => {
    if (errorMessage.includes('auth/invalid-credential') || errorMessage.includes('auth/wrong-password') || errorMessage.includes('auth/user-not-found')) {
        return 'Access Denied. Please contact your administrator to get access to this application.';
    }
    if (errorMessage.includes('auth/too-many-requests') || errorMessage.includes('auth/code-expired')) {
        return 'Access has been temporarily disabled due to too many requests. Please try again later or reset your password.';
    }
    if (errorMessage.includes('auth/popup-closed-by-user')) {
        return '';
    }
    if (errorMessage.includes('auth/invalid-phone-number')) {
        return 'The phone number you entered is invalid.';
    }
     if (errorMessage.includes('auth/invalid-verification-code')) {
        return 'The OTP you entered is invalid. Please try again.';
    }
    return 'An unexpected error occurred. Please try again.';
};


const Login: React.FC = () => {
    const { loginWithEmail, loginWithGoogle } = useAuthStore();
    const { otp: otpSettings } = useSettingsStore();
    const [error, setError] = useState('');
    const navigate = ReactRouterDOM.useNavigate();
    const [activeTab, setActiveTab] = useState<'email' | 'phone'>('email');

    // OTP State
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

    // Email form
    const { register: registerEmail, handleSubmit: handleEmailSubmit, formState: { errors: emailErrors, isSubmitting: isEmailSubmitting } } = useForm<EmailFormInputs>({
        resolver: yupResolver(emailValidationSchema),
    });

    // Phone form
    const { register: registerPhone, handleSubmit: handlePhoneSubmit, formState: { errors: phoneErrors, isSubmitting: isPhoneSubmitting } } = useForm<PhoneFormInputs>({
        resolver: yupResolver(phoneValidationSchema),
    });
    
    // OTP form
    const { register: registerOtp, handleSubmit: handleOtpSubmit, formState: { errors: otpErrors, isSubmitting: isOtpSubmitting } } = useForm<OtpFormInputs>({
        resolver: yupResolver(otpValidationSchema),
    });

    useEffect(() => {
        if (otpSettings.enabled && activeTab === 'phone' && !(window as any).recaptchaVerifier) {
            firebaseAuthService.auth.setupRecaptcha('recaptcha-container');
        }
    }, [otpSettings.enabled, activeTab]);

    const onEmailSubmit: SubmitHandler<EmailFormInputs> = async (data) => {
        setError('');
        const { error: authError, user } = await loginWithEmail(data.email, data.password);
        if (authError) {
            setError(getFriendlyAuthError(authError.message));
        } else if (user) {
            navigate(getHomeRoute(user), { replace: true });
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        const { error: authError, user } = await loginWithGoogle();
        if (authError) {
            const friendlyError = getFriendlyAuthError(authError.message);
            if (friendlyError) setError(friendlyError);
        } else if (user) {
            navigate(getHomeRoute(user), { replace: true });
        }
    };

    const handleSendOtp: SubmitHandler<PhoneFormInputs> = async (data) => {
        setError('');
        const appVerifier = (window as any).recaptchaVerifier;
        if (!appVerifier) {
            setError('reCAPTCHA not initialized. Please refresh.');
            return;
        }
        const formattedPhoneNumber = `+91${data.phone}`;
        const { confirmationResult: result, error: otpError } = await firebaseAuthService.auth.sendOtp(formattedPhoneNumber, appVerifier);

        if (otpError) {
            setError(getFriendlyAuthError(otpError.message));
        } else {
            setConfirmationResult(result);
            setIsOtpSent(true);
        }
    };
    
    const handleVerifyOtp: SubmitHandler<OtpFormInputs> = async (data) => {
        if (!confirmationResult) return;
        setError('');
        const { error: verifyError } = await firebaseAuthService.auth.verifyOtp(confirmationResult, data.otp);
        if (verifyError) {
            setError(getFriendlyAuthError(verifyError.message));
        }
        // Success is handled by the onAuthStateChanged listener in the authStore, which will redirect automatically.
    };

    return (
        <div className="space-y-6">
            {/* Invisible reCAPTCHA container */}
            <div id="recaptcha-container"></div>
            
            {otpSettings.enabled && (
                <div className="flex justify-center p-1 bg-white/10 rounded-full mb-6">
                    <button onClick={() => setActiveTab('email')} className={`px-4 py-2 rounded-full flex-1 transition-colors text-white ${activeTab === 'email' ? 'bg-white/20 opacity-100' : 'opacity-70'}`}>Email</button>
                    <button onClick={() => setActiveTab('phone')} className={`px-4 py-2 rounded-full flex-1 transition-colors text-white ${activeTab === 'phone' ? 'bg-white/20 opacity-100' : 'opacity-70'}`}>Phone</button>
                </div>
            )}
            
            {activeTab === 'email' ? (
                <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-6">
                     <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                        <Input id="email" type="email" autoComplete="email" placeholder="Email Address" registration={registerEmail('email')} error={emailErrors.email?.message} className="pl-11 !bg-white/10 !text-white !border-white/20 placeholder:!text-gray-300" />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                        <Input id="password" type="password" autoComplete="current-password" placeholder="Password" registration={registerEmail('password')} error={emailErrors.password?.message} className="pl-11 !bg-white/10 !text-white !border-white/20 placeholder:!text-gray-300" />
                    </div>
                    <div className="flex items-center justify-end"><ReactRouterDOM.Link to="/auth/forgot-password" className="text-sm font-medium text-white/80 hover:text-white">Forgot your password?</ReactRouterDOM.Link></div>
                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                    <Button type="submit" className="w-full" isLoading={isEmailSubmitting} size="lg">Sign in</Button>
                </form>
            ) : (
                isOtpSent ? (
                     <form onSubmit={handleOtpSubmit(handleVerifyOtp)} className="space-y-6">
                        <p className="text-sm text-center text-gray-300">Enter the 6-digit code sent to your phone.</p>
                        <div className="relative"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" /><Input id="otp" type="tel" placeholder="Enter OTP" registration={registerOtp('otp')} error={otpErrors.otp?.message} className="pl-11 !bg-white/10 !text-white" /></div>
                        {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                        <Button type="submit" className="w-full" isLoading={isOtpSubmitting} size="lg">Verify & Sign In</Button>
                        <button type="button" onClick={() => setIsOtpSent(false)} className="text-sm text-center w-full text-white/80 hover:text-white">Change phone number</button>
                    </form>
                ) : (
                     <form onSubmit={handlePhoneSubmit(handleSendOtp)} className="space-y-6">
                        <p className="text-sm text-center text-gray-300">Enter your phone number to receive a one-time password.</p>
                        <div className="relative"><Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" /><Input id="phone" type="tel" placeholder="10-digit Phone Number" registration={registerPhone('phone')} error={phoneErrors.phone?.message} className="pl-11 !bg-white/10 !text-white" /></div>
                        {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                        <Button type="submit" className="w-full" isLoading={isPhoneSubmitting} size="lg">Send OTP</Button>
                    </form>
                )
            )}
            
            <div className="auth-separator">OR</div>
            <button type="button" onClick={handleGoogleLogin} className="google-signin-btn">
                <svg viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.519-3.487-11.181-8.264l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,35.508,44,30.021,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
                Sign in with Google
            </button>
        </div>
    );
};
export default Login;