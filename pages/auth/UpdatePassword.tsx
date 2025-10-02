import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import * as ReactRouterDOM from 'react-router-dom';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { firebaseAuthService } from '../../services/supabase';
import { CheckCircle, Loader2 } from 'lucide-react';

const validationSchema = yup.object({
  password: yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Passwords must match').required('Please confirm your password'),
}).defined();

interface UpdatePasswordForm {
  password: string;
  confirmPassword: string;
}

const UpdatePassword = () => {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  const navigate = ReactRouterDOM.useNavigate();
  const location = ReactRouterDOM.useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('oobCode');

    if (!code) {
      setError('Invalid password reset link. Please request a new one.');
      setIsVerifying(false);
      return;
    }
    
    setOobCode(code);
    
    const verifyCode = async () => {
        const { email: verifiedEmail, error: verificationError } = await firebaseAuthService.auth.verifyResetCode(code);
        if (verificationError) {
            setError(verificationError.message || 'Invalid or expired password reset link.');
        } else {
            setEmail(verifiedEmail);
        }
        setIsVerifying(false);
    };

    verifyCode();
  }, [location.search]);


  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<UpdatePasswordForm>({
    resolver: yupResolver(validationSchema),
  });

  const onSubmit: SubmitHandler<UpdatePasswordForm> = async (data) => {
    if (!oobCode) {
        setError('Password reset code is missing.');
        return;
    }
    setError('');
    const { error: updateError } = await firebaseAuthService.auth.confirmNewPassword(oobCode, data.password);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/auth/login', { replace: true }), 2000);
    }
  };
  
  if (isVerifying) {
    return (
        <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" />
            <p className="mt-4 text-sm text-gray-300">Verifying reset link...</p>
        </div>
    );
  }

  if (success) {
    return (
      <div className="text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-accent" />
        <h3 className="mt-4 text-lg font-semibold text-white">Password Updated!</h3>
        <p className="mt-2 text-sm text-gray-300">
          Your password has been changed successfully. You will be redirected to the login page shortly.
        </p>
        <div className="mt-6">
          <ReactRouterDOM.Link to="/auth/login" className="font-medium text-white/80 hover:text-white">
            &larr; Back to Login Now
          </ReactRouterDOM.Link>
        </div>
      </div>
    );
  }

  if (error && !email) { // If verification failed
    return (
        <div className="text-center">
             <h3 className="text-3xl font-bold text-white">Invalid Link</h3>
             <p className="text-sm text-gray-300 mt-1">{error}</p>
             <div className="mt-6 flex flex-col gap-4">
                <ReactRouterDOM.Link to="/auth/forgot-password" className="font-medium text-white/80 hover:text-white">
                    Request a new link
                </ReactRouterDOM.Link>
                <div className="auth-separator">OR</div>
                <Button onClick={() => navigate('/auth/login')} className="w-full" size="lg">
                    Back to Sign In
                </Button>
            </div>
        </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h3 className="text-3xl font-bold text-white">Set a New Password</h3>
        <p className="text-sm text-gray-300 mt-1">Please enter your new password for <span className="font-semibold text-white">{email}</span>.</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Input
          id="password"
          type="password"
          placeholder="New Password"
          autoComplete="new-password"
          registration={register('password')}
          error={errors.password?.message}
           className="pl-4 !bg-white/10 !text-white !border-white/20 placeholder:!text-gray-300"
        />
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm New Password"
          autoComplete="new-password"
          registration={register('confirmPassword')}
          error={errors.confirmPassword?.message}
           className="pl-4 !bg-white/10 !text-white !border-white/20 placeholder:!text-gray-300"
        />
        {error && <p className="text-sm text-red-400 text-center">{error}</p>}
        <div>
          <Button type="submit" className="w-full" isLoading={isSubmitting} size="lg">
            Update Password
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UpdatePassword;