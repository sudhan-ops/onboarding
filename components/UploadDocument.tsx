import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { UploadedFile } from '../types';
import { UploadCloud, File as FileIcon, X, RefreshCw, Camera, Loader2, AlertTriangle, CheckCircle, Eye, Trash2, BadgeInfo, CreditCard, User as UserIcon, FileText } from 'lucide-react';
import { api } from '../services/api';
import Button from './ui/Button';
import CameraCaptureModal from './CameraCaptureModal';
import { useAuthStore } from '../store/authStore';
import ImagePreviewModal from './modals/ImagePreviewModal';

interface UploadDocumentProps {
  label: string;
  file: UploadedFile | undefined | null;
  onFileChange: (file: UploadedFile | null) => void;
  allowedTypes?: string[];
  error?: string;
  ocrSchema?: any;
  onOcrComplete?: (data: Record<string, any>) => void;
  setToast?: (toast: { message: string, type: 'success' | 'error' } | null) => void;
  allowCapture?: boolean;
  onVerification?: (base64: string, mimeType: string) => Promise<{ success: boolean; reason: string }>;
  docType?: 'Aadhaar' | 'PAN';
}

type VerificationStatus = 'idle' | 'verifying' | 'verified' | 'failed';


const UploadDocument: React.FC<UploadDocumentProps> = ({ 
    label,
    file,
    onFileChange,
    allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'],
    error,
    ocrSchema,
    onOcrComplete,
    setToast,
    allowCapture = false,
    onVerification,
    docType,
}) => {
    const { user } = useAuthStore();
    const isFieldOfficer = user?.role === 'field_officer';
    const [isMobileTheme, setIsMobileTheme] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
    const [verificationError, setVerificationError] = useState('');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    useEffect(() => {
        setIsMobileTheme(document.body.classList.contains('field-officer-dark-theme'));
    }, []);

    const captureGuidance = useMemo(() => {
        const lowerLabel = label.toLowerCase();
        if (lowerLabel.includes('photo')) return 'profile';
        if (['proof', 'document', 'card', 'slip', 'passbook', 'cheque', 'certificate'].some(keyword => lowerLabel.includes(keyword))) {
            return 'document';
        }
        return 'none';
    }, [label]);
    
    const handleFileSelect = useCallback(async (selectedFile: File) => {
        if (!allowedTypes.includes(selectedFile.type)) {
            setUploadError(`Invalid file type. Allowed: ${allowedTypes.join(', ')}.`);
            return;
        }
        if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
            setUploadError('File size must be less than 5MB.');
            return;
        }

        setUploadError('');
        setVerificationError('');
        setVerificationStatus('idle');
        const preview = URL.createObjectURL(selectedFile);
        let fileData: UploadedFile = {
            name: selectedFile.name, type: selectedFile.type, size: selectedFile.size,
            preview, file: selectedFile, progress: 0,
        };
        onFileChange(fileData); // Show file immediately

        setIsProcessing(true);
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onloadend = async () => {
             try {
                const base64String = (reader.result as string).split(',')[1];
                
                // Step 1: Human/Liveness Verification if applicable
                if (onVerification) {
                    setVerificationStatus('verifying');
                    const verificationResult = await onVerification(base64String, selectedFile.type);
                    if (!verificationResult.success) {
                        setVerificationStatus('failed');
                        setVerificationError(verificationResult.reason);
                        onFileChange(null); // Reject file
                        setIsProcessing(false);
                        return;
                    }
                    setVerificationStatus('verified');
                }

                // Step 2: OCR/Document Verification if applicable
                if (onOcrComplete && ocrSchema) {
                    setVerificationStatus('verifying');
                    const extractedData = await api.extractDataFromImage(base64String, selectedFile.type, ocrSchema, docType);

                    // Intelligent Document Check
                    if (docType === 'Aadhaar' && !extractedData.isAadhaar) {
                         setVerificationStatus('failed');
                         const reason = extractedData.reason || 'The uploaded document is not a valid Aadhaar card.';
                         setVerificationError(reason);
                         if(setToast) setToast({ message: reason, type: 'error' });
                         onFileChange(null);
                         setIsProcessing(false);
                         return;
                    }

                    onOcrComplete(extractedData);
                    setVerificationStatus('verified');
                }

                // Step 3: Finalize upload (mocked)
                const { url } = await api.uploadDocument(selectedFile);
                onFileChange({ ...fileData, progress: 100, url });

            } catch (err: any) {
                const errorMessage = err.message || 'An unexpected error occurred.';
                setUploadError(errorMessage);
                if (setToast) setToast({ message: errorMessage, type: 'error' });
                onFileChange(null);
            } finally {
                setIsProcessing(false);
            }
        };
    }, [allowedTypes, onFileChange, ocrSchema, onOcrComplete, setToast, onVerification, docType]);

    const handleCapture = useCallback(async (base64Image: string, mimeType: string) => {
        const blob = await (await fetch(`data:${mimeType};base64,${base64Image}`)).blob();
        const capturedFile = new File([blob], `capture-${Date.now()}.jpg`, { type: mimeType });
        handleFileSelect(capturedFile);
    }, [handleFileSelect]);

    const handleRemove = () => {
        if(file) URL.revokeObjectURL(file.preview);
        onFileChange(null);
        setVerificationStatus('idle');
        setVerificationError('');
        setUploadError('');
    };

    const inputId = `file-upload-${label.replace(/\s+/g, '-')}`;
    const displayError = error || uploadError || verificationError;
    
    const isBusy = isProcessing || verificationStatus === 'verifying';
    
    const uploadFileButtonClasses = isMobileTheme
        ? 'fo-btn-primary flex items-center justify-center gap-2'
        : 'cursor-pointer flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-full bg-accent text-white hover:bg-accent-dark transition-colors';
        
    const getPlaceholderIcon = (label: string): React.ElementType => {
        const lowerLabel = label.toLowerCase();
        if (['aadhaar', 'id proof', 'pan', 'card'].some(term => lowerLabel.includes(term))) {
            return BadgeInfo;
        }
        if (['bank', 'cheque', 'passbook'].some(term => lowerLabel.includes(term))) {
            return CreditCard;
        }
        if (['photo', 'profile'].some(term => lowerLabel.includes(term))) {
            return UserIcon;
        }
        return FileText;
    };

    const PlaceholderIcon = getPlaceholderIcon(label);

    return (
        <div className="w-full">
            <ImagePreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} imageUrl={file?.preview || ''} />
            {isCameraOpen && <CameraCaptureModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={handleCapture} captureGuidance={captureGuidance} />}

            <div 
                className={`
                    fo-upload-box flex flex-col items-center justify-center transition-all duration-300
                    w-full text-center
                    ${isFieldOfficer ? 'min-h-[200px]' : 'min-h-[240px]'}
                    ${file ? 'p-2 border-solid !bg-[#243524]' : 'p-6 border-dashed !bg-[#243524]'}
                    ${displayError ? '!border-red-500' : '!border-[#34d399]'}`
                }
            >
                {file ? (
                    <div className="w-full flex flex-col h-full">
                        <p className="text-sm font-medium text-gray-300 mb-2 flex-shrink-0">{label}</p>
                        <label htmlFor={inputId} className="flex-grow w-full rounded-md overflow-hidden cursor-pointer group relative bg-black/20 flex items-center justify-center min-h-[100px]">
                            {file.type.startsWith('image/') ? (
                                 <img src={file.preview} alt="preview" className="max-w-full max-h-full object-contain" />
                            ) : (
                                <div className="text-gray-400 p-2">
                                    <FileIcon className="h-10 w-10 mx-auto" />
                                    <span className="text-xs mt-1 block break-all">{file.name}</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                                <RefreshCw className="h-6 w-6 text-white" />
                            </div>
                        </label>
                        <div className="mt-2 flex items-center justify-center gap-2 flex-shrink-0">
                            {file.type.startsWith('image/') && (
                                 <button type="button" onClick={() => setIsPreviewOpen(true)} className="text-xs font-medium text-accent hover:underline flex items-center gap-1 p-1">
                                    <Eye className="h-3 w-3" /> View
                                </button>
                            )}
                            <button type="button" onClick={handleRemove} className="text-xs font-medium text-red-400 hover:underline flex items-center gap-1 p-1">
                                <Trash2 className="h-3 w-3" /> Remove
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <PlaceholderIcon className="h-10 w-10 text-gray-500 mb-2" />
                        <p className="font-semibold text-white mb-1">Upload Image</p>
                        <p className="text-xs text-gray-400 text-center mb-4 max-w-[90%]">
                           {label}
                        </p>
                        <div className={`flex flex-row items-center justify-center gap-4 w-full`}>
                            <label htmlFor={inputId} className={uploadFileButtonClasses}>
                               <UploadCloud className="h-4 w-4 mr-2" />
                               Upload
                            </label>
                             {(onOcrComplete || allowCapture) && (
                                 <Button type="button" variant={isMobileTheme ? 'outline' : 'secondary'} onClick={() => setIsCameraOpen(true)}>
                                    <Camera className="h-4 w-4 mr-2"/>
                                    Capture
                                 </Button>
                             )}
                        </div>
                    </>
                )}
            </div>
            
            <input id={inputId} type="file" className="sr-only" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} accept={allowedTypes.join(',')}/>
            
            <div className="text-center mt-1 min-h-[16px]">
                {isBusy && <div className="text-sm flex items-center justify-center gap-2 text-muted animate-pulse"><Loader2 className="h-4 w-4 animate-spin"/> Verifying...</div>}
                {displayError && <p className="text-xs text-red-500">{displayError}</p>}
            </div>
        </div>
    );
};

export default UploadDocument;