
import React from 'react';
import type { OnboardingData } from '../../types';

type SyncStatus = OnboardingData['portalSyncStatus'];

interface PortalSyncStatusChipProps {
  status: SyncStatus;
}

const PortalSyncStatusChip: React.FC<PortalSyncStatusChipProps> = ({ status }) => {
  if (!status) return <span className="text-xs text-muted">-</span>;

  const statusStyles: Record<NonNullable<SyncStatus>, string> = {
    pending_sync: 'bg-blue-100 text-blue-800',
    synced: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };

  const statusText = {
    pending_sync: 'Pending Sync',
    synced: 'Synced',
    failed: 'Failed',
  };

  return (
    <span
      className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${statusStyles[status]}`}
    >
      {statusText[status]}
    </span>
  );
};

export default PortalSyncStatusChip;
