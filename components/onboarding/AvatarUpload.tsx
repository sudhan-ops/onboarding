import React from 'react';
import type { UploadedFile } from '../../types';
import { Edit, Trash2 } from 'lucide-react';
import { ProfilePlaceholder } from '../ui/ProfilePlaceholder';

interface AvatarUploadProps {
  file: UploadedFile | undefined | null;
  onFileChange: (file: UploadedFile | null) => void;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({ file, onFileChange }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      const fileData: UploadedFile = {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        preview: URL.createObjectURL(selectedFile),
        file: selectedFile,
      };
      onFileChange(fileData);
    }
  };

  const handleRemove = () => {
    if (file) {
      URL.revokeObjectURL(file.preview);
    }
    onFileChange(null);
  };

  const inputId = 'avatar-upload';

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative w-40 h-40 rounded-full bg-page flex items-center justify-center overflow-hidden border border-border">
        {file?.preview ? (
          <img src={file.preview} alt="Profile preview" className="w-full h-full object-cover" />
        ) : (
          <ProfilePlaceholder />
        )}
        {file && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-card/70 backdrop-blur-sm rounded-full text-red-600 hover:bg-red-100 transition-colors"
            aria-label="Remove photo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <label htmlFor={inputId} className="cursor-pointer inline-flex items-center justify-center font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 rounded-full bg-accent text-white hover:bg-accent-dark focus:ring-accent px-6 py-2 text-sm">
          <Edit className="w-4 h-4 mr-2" />
          {file ? 'Change' : 'Upload'}
          <input id={inputId} name={inputId} type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
        </label>
      </div>
    </div>
  );
};
