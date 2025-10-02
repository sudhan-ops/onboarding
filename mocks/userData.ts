

import type { User } from '../types';

export const mockUsers: User[] = [
    { "id": "user_1", "name": "Adeline Master", "email": "admin@paradigmfms.com", "phone": "9876543210", "role": "admin" },
    { "id": "user_10", "name": "Harriet Reed", "email": "hr@paradigmfms.com", "phone": "9876543211", "role": "hr" },
    { "id": "user_2", "name": "Devon Loper", "email": "dev@paradigmfms.com", "phone": "9876543212", "role": "developer" },
    { "id": "user_3", "name": "Olivia Payne", "email": "ops@paradigmfms.com", "phone": "9876543213", "role": "operation_manager", "reportingManagerId": "user_1" },
    { "id": "user_4", "name": "Samuel Crisp", "email": "site_manager@paradigmfms.com", "phone": "9876543214", "role": "site_manager", "organizationId": "OSHE-1747053460308", "organizationName": "PPFMS GPA-(Accidental)", "reportingManagerId": "user_3" },
    { "id": "user_5", "name": "Frank Officer", "email": "field_officer@paradigmfms.com", "phone": "9876543215", "role": "field_officer", "reportingManagerId": "user_3", "photoUrl": undefined },
    { "id": "user_6", "name": "Grace Field", "email": "field_officer2@paradigmfms.com", "phone": "9876543216", "role": "field_officer", "reportingManagerId": "user_3", "photoUrl": undefined },
    { "id": "user_7", "name": "Laura Hill", "email": "laura.hill@example.com", "phone": "9876543217", "role": "site_manager", "organizationId": "ORG-FIN", "organizationName": "Quantum Financial" },
    { "id": "user_8", "name": "David Chen", "email": "david.chen@example.com", "phone": "9876543218", "role": "site_manager", "organizationId": "ORG-LOGI", "organizationName": "Swift Logistics" },
    { "id": "user_9", "name": "Henry Mills", "email": "henry.mills@example.com", "phone": "9876543219", "role": "field_officer", "photoUrl": undefined }
];
