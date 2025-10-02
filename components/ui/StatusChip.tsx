

import React, { useState, useEffect } from 'react';
import type { OnboardingData } from '../../types';

interface StatusChipProps {
  status: OnboardingData['status'];
}

const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  const [isMobileTheme, setIsMobileTheme] = useState(false);

  useEffect(() => {
    // This effect runs on the client-side, where document is available.
    setIsMobileTheme(document.body.classList.contains('field-officer-dark-theme'));
  }, []);

  const lightStyles: Record<OnboardingData['status'], string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    verified: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    draft: 'bg-gray-100 text-gray-800',
  };

  const darkStyles: Record<OnboardingData['status'], string> = {
    pending: 'bg-yellow-900/50 text-yellow-300 border border-yellow-500/50',
    verified: 'bg-green-900/50 text-green-300 border border-green-500/50',
    rejected: 'bg-red-900/50 text-red-300 border border-red-500/50',
    draft: 'bg-gray-700/50 text-gray-300 border border-gray-500/50',
  };

  const statusStyles = isMobileTheme ? darkStyles[status] : lightStyles[status];

  return (
    <span
      className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${statusStyles}`}
    >
      {status}
    </span>
  );
};

export default StatusChip;