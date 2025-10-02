
import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import * as ReactRouterDOM from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { Mail, MailCheck } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const validationSchema = yup.object({
    email: yup.string().email('Must be a valid email').required('Email is required'),
}).defined();

interface ForgotPasswordForm {
    email: string;
}

const ForgotPassword = () => {
    const { sendPasswordReset } = useAuthStore();
    const [error, setError] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const navigate = ReactRouterDOM.useNavigate();

    useEffect(() => {
        if (isSubmitted) {
            const timer = setTimeout(() => {
                navigate('/auth/login', { replace: true });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isSubmitted, navigate]);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordForm>({
        resolver: yupResolver(validationSchema),
    });

    const onSubmit: SubmitHandler<ForgotPasswordForm> = async (data) => {
        setError('');
        const { error: resetError } = await sendPasswordReset(data.email);
        if (resetError) {
            setError(resetError.message);
        } else {
            setIsSubmitted(true);
        }
    };

    if (isSubmitted) {
        return (
            <div className="text-center">
                <MailCheck className="mx-auto h-12 w-12 text-accent" />
                <h3 className="mt-4 text-lg font-semibold text-white">Check your email</h3>
                <p className="mt-2 text-sm text-gray-300">
                    We've sent password reset instructions to the email you provided. Redirecting to login...
                </p>
            </div>
        );
    }

    return (
        <div>
             <div className="text-center mb-8">
                 <h3 className="text-3xl font-bold text-white">Forgot Password?</h3>
                 <p className="text-sm text-gray-300 mt-1">No worries, we'll send you reset instructions.</p>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                 <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="Email Address"
                        registration={register('email')}
                        error={errors.email?.message}
                        className="pl-11 !bg-white/10 !text-white !border-white/20 placeholder:!text-gray-300"
                    />
                </div>
                
                {error && <p className="text-sm text-red-400 text-center">{error}</p>}

                <div>
                    <Button type="submit" className="w-full" isLoading={isSubmitting} size="lg">
                        Send Reset Link
                    </Button>
                </div>

                <div className="text-center">
                    <ReactRouterDOM.Link to="/auth/login" className="text-sm font-medium text-white/80 hover:text-white">
                        &larr; Back to Login
                    </ReactRouterDOM.Link>
                </div>
            </form>
        </div>
    );
};

export default ForgotPassword;
