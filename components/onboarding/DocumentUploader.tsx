
import React, { useState, useCallback } from 'react';
import type { UploadedFile } from '../../types';
import { UploadCloud, File, X, RefreshCw } from 'lucide-react';

interface DocumentUploaderProps {
  label: string;
  file: UploadedFile | undefined | null;
  onFileChange: (file: UploadedFile | null) => void;
  allowedTypes?: string[];
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ 
    label,
    file,
    onFileChange,
    allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'] 
}) => {
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!allowedTypes.includes(selectedFile.type)) {
                setError(`Invalid file type. Please upload ${allowedTypes.join(', ')}.`);
                return;
            }
            if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
                 setError('File size must be less than 5MB.');
                return;
            }

            setError('');
            const fileData: UploadedFile = {
                name: selectedFile.name,
                type: selectedFile.type,
                size: selectedFile.size,
                preview: URL.createObjectURL(selectedFile),
                file: selectedFile,
                progress: 0,
            };
            onFileChange(fileData);
        }
    };
    
    return (
        <div>
            <label>{label}</label>
            <input type="file" onChange={handleFileChange} />
            {error && <p style={{color: 'red'}}>{error}</p>}
            {file && <p>Selected: {file.name}</p>}
        </div>
    );
};

export default DocumentUploader;
