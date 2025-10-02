// This file provides a wrapper around the Firebase Authentication service.
// The filename 'supabase.ts' is a misnomer from a previous version.
import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    updatePassword,
    signOut,
    onAuthStateChanged as fbOnAuthStateChanged,
    type User as FirebaseUser,
    verifyPasswordResetCode,
    confirmPasswordReset,
    GoogleAuthProvider,
    signInWithPopup,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    type ConfirmationResult
} from "firebase/auth";
import { auth } from "../config/firebase";

const signInWithEmail = async (email: string, password: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { user: userCredential.user, error: null };
    } catch (error: any) {
        return { user: null, error };
    }
};

const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        return { user: result.user, error: null };
    } catch (error: any) {
        return { user: null, error };
    }
};

const sendPasswordReset = async (email: string) => {
    try {
        // Firebase requires a URL for the password reset link.
        // The link will point to our app's update-password page.
        const actionCodeSettings = {
            url: window.location.origin + '/#/auth/update-password',
        };
        await sendPasswordResetEmail(auth, email, actionCodeSettings);
        return { error: null };
    } catch (error: any) {
        return { error };
    }
};

const updateUserPassword = async (password: string) => {
    if (!auth.currentUser) {
        return { error: { message: "No user is currently signed in. The password reset link may have expired." } };
    }
    try {
        await updatePassword(auth.currentUser, password);
        return { error: null };
    } catch (error: any) {
        return { error };
    }
};

const verifyResetCode = async (oobCode: string) => {
    try {
        const email = await verifyPasswordResetCode(auth, oobCode);
        return { email, error: null };
    } catch (error: any) {
        return { email: null, error };
    }
};

const confirmNewPassword = async (oobCode: string, newPassword: string) => {
    try {
        await confirmPasswordReset(auth, oobCode, newPassword);
        return { error: null };
    } catch (error: any) {
        return { error };
    }
};


const signOutUser = async () => {
    await signOut(auth);
};

const onAuthStateChanged = (callback: (user: FirebaseUser | null) => void) => {
    return fbOnAuthStateChanged(auth, callback);
};

const setupRecaptcha = (containerId: string) => {
    if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
            'size': 'invisible',
            'callback': (response: any) => {
                // reCAPTCHA solved, allow signInWithPhoneNumber.
            }
        });
    }
    return (window as any).recaptchaVerifier;
};

const sendOtp = async (phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<{ confirmationResult: ConfirmationResult | null; error: { message: string } | null; }> => {
    try {
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        return { confirmationResult, error: null };
    } catch (error: any) {
        if ((window as any).grecaptcha && appVerifier) {
            appVerifier.render().then(widgetId => {
                (window as any).grecaptcha.reset(widgetId);
            });
        }
        return { confirmationResult: null, error };
    }
};

const verifyOtp = async (confirmationResult: ConfirmationResult, code: string) => {
    try {
        const result = await confirmationResult.confirm(code);
        return { user: result.user, error: null };
    } catch (error: any) {
        return { user: null, error };
    }
};

// Renamed from 'supabase' for clarity
export const firebaseAuthService = {
    auth: {
        signInWithEmail,
        signInWithGoogle,
        sendPasswordReset,
        updateUserPassword,
        verifyResetCode,
        confirmNewPassword,
        signOut: signOutUser,
        onAuthStateChanged,
        setupRecaptcha,
        sendOtp,
        verifyOtp,
    }
};