import type { OnboardingData, User, UserRole, Organization, EmailSettings, OrganizationGroup, AttendanceEvent, LeaveBalance, LeaveRequest, LeaveRequestStatus, ApprovalRecord, Task, Notification, Policy, Insurance, SiteConfiguration, Agreement, ManpowerDetail, BackOfficeIdSeries, SiteStaffDesignation, Asset, MasterToolsList, IssuedTool, MasterGentsUniforms, SiteGentsUniformConfig, MasterLadiesUniforms, SiteLadiesUniformConfig, SiteUniformDetailsConfig, InvoiceData, BillingRates, InvoiceLineItem, VerificationResult, UploadedFile, GentsPantsSize, GentsShirtSize, LadiesPantsSize, LadiesShirtSize, UniformRequest, SalaryChangeRequest } from '../types';
import { mockUsers } from '../mocks/userData';
import { useSettingsStore } from '../store/settingsStore';
// FIX: Removed invalid import for 'supabase' which is not exported from './supabase' and was unused in the file.
// FIX: Removed 'getEndOfMonth' from the date-fns import to resolve a module export error from the CDN.
import { differenceInCalendarDays, format, addDays, getDaysInMonth } from 'date-fns';
import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";
import { db } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';


// FIX: Added a local implementation of 'getEndOfMonth' to replace the incompatible imported version.
const getEndOfMonth = (date: Date): Date => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * A centralized error handler for Gemini API calls to manage rate limiting and quota issues.
 * @param error The error object caught from the API call.
 * @returns A user-friendly error message if it's a rate limit/quota error, otherwise null.
 */
const handleGeminiRateLimitError = (error: any): string | null => {
    // Check for common rate-limiting and quota exhaustion indicators in the error.
    const errorString = error.toString().toLowerCase();
    if (errorString.includes("429") || errorString.includes("resource_exhausted")) {
        if (errorString.includes("quota")) {
            return "Daily API quota exceeded. Please try again tomorrow.";
        }
        return "The AI service is currently busy. Please wait a moment and try again.";
    }
    return null; // Indicates it's not a rate limit error.
};


// --- MOCK API IMPLEMENTATION ---

let mockDatabase: { 
    submissions: OnboardingData[], 
    users: User[], 
    organizations: Organization[], 
    organizationStructure: OrganizationGroup[],
    siteConfigurations: SiteConfiguration[],
    attendanceEvents: AttendanceEvent[],
    leaveBalances: LeaveBalance[],
    leaveRequests: LeaveRequest[],
    approvalWorkflowSettings: { finalConfirmationRole: UserRole },
    tasks: Task[],
    notifications: Notification[],
    policies: Policy[],
    insurances: Insurance[],
    agreements: Agreement[],
    manpowerDetails: Record<string, ManpowerDetail[]>,
    backOfficeIdSeries: BackOfficeIdSeries[],
    siteStaffDesignations: SiteStaffDesignation[],
    siteAssets: Record<string, Asset[]>,
    toolsList: MasterToolsList,
    siteIssuedTools: Record<string, IssuedTool[]>,
    gentsUniforms: MasterGentsUniforms,
    siteGentsUniforms: Record<string, SiteGentsUniformConfig>,
    ladiesUniforms: MasterLadiesUniforms,
    siteLadiesUniforms: Record<string, SiteLadiesUniformConfig>,
    siteUniformDetails: Record<string, SiteUniformDetailsConfig>,
    billingRates: BillingRates,
    uniformRequests: UniformRequest[],
    salaryChangeRequests: SalaryChangeRequest[],
} | null = null;

const getMockDatabase = async () => {
    if (mockDatabase === null) {
        try {
            const [submissionsResponse, organizationsResponse, entityResponse, attendanceResponse, leaveResponse, tasksResponse, notificationsResponse, policiesResponse, insuranceResponse, agreementsResponse, manpowerResponse, siteStaffResponse, toolsListResponse, gentsUniformsResponse, ladiesUniformsResponse, billingRatesResponse, uniformRequestsResponse, salaryRequestsResponse] = await Promise.all([
                fetch('/mocks/sampleData.json'),
                fetch('/mocks/organizations.json'),
                fetch('/mocks/entityData.json'),
                fetch('/mocks/attendanceData.json'),
                fetch('/mocks/leaveData.json'),
                fetch('/mocks/tasks.json'),
                fetch('/mocks/notifications.json'),
                fetch('/mocks/policies.json'),
                fetch('/mocks/insurance.json'),
                fetch('/mocks/agreements.json'),
                fetch('/mocks/manpowerData.json'),
                fetch('/mocks/siteStaffDesignationData.json'),
                fetch('/mocks/toolsListData.json'),
                fetch('/mocks/gentsUniformData.json'),
                fetch('/mocks/ladiesUniformData.json'),
                fetch('/mocks/billingRates.json'),
                fetch('/mocks/uniformRequestData.json'),
                fetch('/mocks/salaryChangeRequestsData.json'),
            ]);
            
            if (!submissionsResponse.ok) throw new Error(`Failed to fetch mock data: ${submissionsResponse.statusText}`);
            if (!organizationsResponse.ok) throw new Error(`Failed to fetch mock organizations: ${organizationsResponse.statusText}`);
            if (!entityResponse.ok) throw new Error(`Failed to fetch mock entities: ${entityResponse.statusText}`);
            if (!attendanceResponse.ok) throw new Error(`Failed to fetch mock attendance data: ${attendanceResponse.statusText}`);
            if (!leaveResponse.ok) throw new Error(`Failed to fetch mock leave data: ${leaveResponse.statusText}`);
            if (!tasksResponse.ok) throw new Error(`Failed to fetch mock tasks: ${tasksResponse.statusText}`);
            if (!notificationsResponse.ok) throw new Error(`Failed to fetch mock notifications: ${notificationsResponse.statusText}`);
            if (!policiesResponse.ok) throw new Error(`Failed to fetch mock policies: ${policiesResponse.statusText}`);
            if (!insuranceResponse.ok) throw new Error(`Failed to fetch mock insurance: ${insuranceResponse.statusText}`);
            if (!agreementsResponse.ok) throw new Error(`Failed to fetch mock agreements: ${agreementsResponse.statusText}`);
            if (!manpowerResponse.ok) throw new Error(`Failed to fetch mock manpower data: ${manpowerResponse.statusText}`);
            if (!siteStaffResponse.ok) throw new Error(`Failed to fetch mock site staff designations: ${siteStaffResponse.statusText}`);
            if (!toolsListResponse.ok) throw new Error(`Failed to fetch mock tools list: ${toolsListResponse.statusText}`);
            if (!gentsUniformsResponse.ok) throw new Error(`Failed to fetch mock gents uniforms: ${gentsUniformsResponse.statusText}`);
            if (!ladiesUniformsResponse.ok) throw new Error(`Failed to fetch mock ladies uniforms: ${ladiesUniformsResponse.statusText}`);
            if (!billingRatesResponse.ok) throw new Error(`Failed to fetch billing rates: ${billingRatesResponse.statusText}`);
            if (!uniformRequestsResponse.ok) throw new Error(`Failed to fetch uniform requests: ${uniformRequestsResponse.statusText}`);
            if (!salaryRequestsResponse.ok) throw new Error(`Failed to fetch salary requests: ${salaryRequestsResponse.statusText}`);


            const submissionsData = await submissionsResponse.json();
            const organizationsData = await organizationsResponse.json();
            const entityData = await entityResponse.json();
            const attendanceData = await attendanceResponse.json();
            const leaveData = await leaveResponse.json();
            const tasksData = await tasksResponse.json();
            const notificationsData = await notificationsResponse.json();
            const policiesData = await policiesResponse.json();
            const insuranceData = await insuranceResponse.json();
            const agreementsData = await agreementsResponse.json();
            const manpowerData = await manpowerResponse.json();
            const siteStaffData = await siteStaffResponse.json();
            const toolsListData = await toolsListResponse.json();
            const gentsUniformsData = await gentsUniformsResponse.json();
            const ladiesUniformsData = await ladiesUniformsResponse.json();
            const billingRatesData = await billingRatesResponse.json();
            const uniformRequestsData = await uniformRequestsResponse.json();
            const salaryRequestsData = await salaryRequestsResponse.json();

            mockDatabase = { 
                submissions: submissionsData.submissions, 
                users: mockUsers, 
                organizations: organizationsData, 
                organizationStructure: entityData.groups || entityData,
                siteConfigurations: entityData.siteConfigurations || [],
                attendanceEvents: attendanceData.events,
                leaveBalances: leaveData.balances,
                leaveRequests: leaveData.requests,
                approvalWorkflowSettings: { finalConfirmationRole: 'hr' },
                tasks: tasksData.tasks,
                notifications: notificationsData.notifications,
                policies: policiesData,
                insurances: insuranceData,
                agreements: agreementsData,
                manpowerDetails: manpowerData,
                backOfficeIdSeries: entityData.backOfficeIdSeries || [],
                siteStaffDesignations: siteStaffData.designations || [],
                siteAssets: {
                    'SITE-AISSHWARYA': [
                        { id: 'asset_phone_1', type: 'Phone', brand: 'Apple', color: 'Black', condition: 'New', chargerStatus: 'With Charger', displayStatus: 'Without Damages', bodyStatus: 'Without Damages', imei: '123456789012345' },
                        { id: 'asset_laptop_1', type: 'Computer', computerType: 'Laptop', brand: 'Dell', condition: 'Used', bagStatus: 'With Bag', mouseStatus: 'With Mouse', chargerStatus: 'With Charger', displayStatus: 'Without Damages', bodyStatus: 'With Damages', serialNumber: 'XYZ-123', windowsKey: 'WIN-KEY', officeStatus: 'With Office', antivirusStatus: 'With Antivirus' }
                    ],
                    'ORG-FIN': [
                        { id: 'asset_phone_2', type: 'Phone', brand: 'Samsung', color: 'White', condition: 'Used', chargerStatus: 'Without Charger', displayStatus: 'With Damages', bodyStatus: 'Without Damages', imei: '987654321098765' }
                    ],
                    'SITE-TATA': [
                        { id: 'asset_vehicle_1', type: 'Vehicle', vehicleType: 'Two Wheeler', brand: 'Honda Activa', dlNumber: 'KA01AB1234', condition: 'New', kmsAtIssue: 10, vehicleNumber: 'KA01XY9876', chassisNumber: 'CHASSIS123', insuranceValidity: '2025-12-31', pollutionCertValidity: '2025-06-30', finesStatus: 'Nil' }
                    ]
                },
                toolsList: toolsListData,
                siteIssuedTools: {
                    'SITE-AISSHWARYA': [
                        { id: 'issued_tool_1', department: 'Electrical Tools', name: 'Mastech Clamp Meter', quantity: 2, receiverName: 'John Doe' },
                        { id: 'issued_tool_2', department: 'Plumbing Tools', name: 'Torch', quantity: 5, receiverName: 'John Doe' }
                    ],
                    'ORG-LOGI': [
                         { id: 'issued_tool_3', department: 'Security Tools', name: 'Flashlight', quantity: 10, receiverName: 'Jane Smith' }
                    ],
                    'SITE-TATA': [
                         { id: 'issued_tool_4', department: 'Garden Tools', name: 'Hedge Shear', quantity: 3, receiverName: 'Mike Ross' },
                         { id: 'issued_tool_5', department: 'Garden Tools', name: 'Rose Cutter', quantity: 5, receiverName: 'Mike Ross' },
                         { id: 'issued_tool_6', department: 'House keeping Tools', name: 'Wringer Trolly 20ltr', quantity: 2, receiverName: 'Sarah Connor' }
                    ]
                },
                gentsUniforms: gentsUniformsData,
                siteGentsUniforms: {
                    'SITE-AISSHWARYA': {
                        organizationId: 'SITE-AISSHWARYA',
                        departments: [
                            {
                                id: 'dept_sec_1', department: 'Security', designations: [
                                    { id: 'des_guard_1', designation: 'Security Guard', pantsQuantities: { 'gp_32_rf': 10, 'gp_34_rf': 15 }, shirtsQuantities: { 'gs_l_rf': 25 } }
                                ]
                            }
                        ]
                    }
                },
                ladiesUniforms: ladiesUniformsData,
                siteLadiesUniforms: {
                    'SITE-AISSHWARYA': {
                        organizationId: 'SITE-AISSHWARYA',
                        departments: [
                            {
                                id: 'ldept_hk_1', department: 'Housekeeping', designations: [
                                    { id: 'ldes_hk_1', designation: 'Housekeeper', pantsQuantities: { 'lp_30_rf': 20 }, shirtsQuantities: { 'ls_m_rf': 20 } }
                                ]
                            }
                        ]
                    }
                },
                siteUniformDetails: {
                  'SITE-TATA': {
                    organizationId: 'SITE-TATA',
                    departments: [
                      {
                        id: 'ud_dept_1',
                        department: 'MEP Department',
                        designations: [
                          {
                            id: 'ud_des_1',
                            designation: 'Multi Technician',
                            items: [
                              { id: 'i1', name: 'Gray Pant' },
                              { id: 'i2', name: 'Gray Full Sleeve Shirt' },
                              { id: 'i3', name: 'Safety Shoes' },
                              { id: 'i4', name: 'Cap' },
                              { id: 'i5', name: 'Socks' },
                            ],
                          },
                        ],
                      },
                       {
                        id: 'ud_dept_2',
                        department: 'HK Department',
                        designations: [
                          {
                            id: 'ud_des_2',
                            designation: 'Janitor (Female)',
                            items: [
                              { id: 'i6', name: 'Blue Pant' },
                              { id: 'i7', name: 'Blue Half Sleeve Shirt' },
                              { id: 'i8', name: 'Shoes' },
                              { id: 'i9', name: 'Cap' },
                              { id: 'i10', name: 'Socks' },
                              { id: 'i11', name: 'Hair Net' },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                   'SITE-AISSHWARYA': {
                    organizationId: 'SITE-AISSHWARYA',
                    departments: [
                      {
                        id: 'ud_dept_sec_1',
                        department: 'Security Department',
                        designations: [
                          {
                            id: 'ud_des_sec_1',
                            designation: 'Security Guard',
                            items: [
                              { id: 'sec1', name: 'Security Shirt' },
                              { id: 'sec2', name: 'Security Pant' },
                              { id: 'sec3', name: 'Cap' },
                              { id: 'sec4', name: 'Shoes' },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                },
                billingRates: billingRatesData,
                uniformRequests: uniformRequestsData,
                salaryChangeRequests: salaryRequestsData,
            };
        } catch (error) {
            console.error("Could not load mock database:", error);
            mockDatabase = { submissions: [], users: [], organizations: [], organizationStructure: [], siteConfigurations: [], attendanceEvents: [], leaveBalances: [], leaveRequests: [], approvalWorkflowSettings: { finalConfirmationRole: 'hr' }, tasks: [], notifications: [], policies: [], insurances: [], agreements: [], manpowerDetails: {}, backOfficeIdSeries: [], siteStaffDesignations: [], siteAssets: {}, toolsList: {}, siteIssuedTools: {}, gentsUniforms: { pants: [], shirts: [] }, siteGentsUniforms: {}, ladiesUniforms: { pants: [], shirts: [] }, siteLadiesUniforms: {}, siteUniformDetails: {}, billingRates: {}, uniformRequests: [], salaryChangeRequests: [] };
        }
    }
    return mockDatabase;
};

// FIX: Add the 'api' object and export it to resolve module import errors across the application.
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

type UserWithManager = User & { managerName?: string };

export const api = {
  // Onboarding
  async getOnboardingDataById(id: string): Promise<OnboardingData | undefined> {
    await delay(300);
    const db = await getMockDatabase();
    return db.submissions.find(s => s.id === id);
  },
  async getVerificationSubmissions(status?: string, organizationId?: string): Promise<OnboardingData[]> {
    await delay(500);
    const db = await getMockDatabase();
    let results = db.submissions.filter(s => s.status !== 'draft');
    if (status) {
        results = results.filter(s => s.status === status);
    }
    if (organizationId) {
        results = results.filter(s => s.organizationId === organizationId);
    }
    return results;
  },
  async saveDraft(data: OnboardingData): Promise<{ draftId: string }> {
    await delay(500);
    const db = await getMockDatabase();
    const index = db.submissions.findIndex(s => s.id === data.id);
    if (index > -1) {
        db.submissions[index] = data;
    } else {
        db.submissions.push(data);
    }
    return { draftId: data.id! };
  },
  async updateOnboarding(data: OnboardingData): Promise<OnboardingData> {
    await delay(500);
    const db = await getMockDatabase();
    const index = db.submissions.findIndex(s => s.id === data.id);
    if (index > -1) {
        db.submissions[index] = data;
        return db.submissions[index];
    }
    throw new Error("Submission not found for update.");
  },
  async submitOnboarding(data: OnboardingData): Promise<OnboardingData> {
    await delay(500);
    const db = await getMockDatabase();
    const newData = { ...data, status: 'pending' as const, id: `sub_${Date.now()}` };
    const index = db.submissions.findIndex(s => s.id === data.id);
    if (index > -1) {
        db.submissions[index] = newData;
    } else {
        db.submissions.push(newData);
    }
    return newData;
  },
  async verifySubmission(id: string): Promise<void> {
    await delay(300);
    const db = await getMockDatabase();
    const submission = db.submissions.find(s => s.id === id);
    if (submission) {
        submission.status = 'verified';
        submission.portalSyncStatus = 'pending_sync';
    }
  },
  async requestChanges(id: string, reason: string): Promise<void> {
    await delay(300);
    const db = await getMockDatabase();
    const submission = db.submissions.find(s => s.id === id);
    if (submission) {
        submission.status = 'rejected';
    }
    console.log(`Changes requested for ${id}: ${reason}`);
  },
  async syncPortals(id: string): Promise<{ status: 'synced' | 'failed' }> {
    await delay(2000);
    const db = await getMockDatabase();
    const submission = db.submissions.find(s => s.id === id);
    if (submission) {
        const success = Math.random() > 0.2;
        submission.portalSyncStatus = success ? 'synced' : 'failed';
        return { status: submission.portalSyncStatus };
    }
    return { status: 'failed' };
  },

  // Users & Orgs
  async getUsers(): Promise<User[]> {
    await delay(200);
    const db = await getMockDatabase();
    return db.users;
  },
  async getUsersWithManagers(): Promise<UserWithManager[]> {
    await delay(300);
    const db = await getMockDatabase();
    return db.users.map(u => ({
        ...u,
        managerName: db.users.find(m => m.id === u.reportingManagerId)?.name
    }));
  },
  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    await delay(300);
    const db = await getMockDatabase();
    const user = db.users.find(u => u.id === id);
    if (!user) throw new Error("User not found");
    Object.assign(user, updates);
    return user;
  },
  async createUser(user: User): Promise<User> {
    await delay(300);
    const db = await getMockDatabase();
    const newUser = { ...user, id: `user_${Date.now()}` };
    db.users.push(newUser);
    return newUser;
  },
  async deleteUser(id: string): Promise<void> {
    await delay(300);
    const db = await getMockDatabase();
    db.users = db.users.filter(u => u.id !== id);
  },
  async getFieldOfficers(): Promise<User[]> {
    await delay(200);
    const db = await getMockDatabase();
    return db.users.filter(u => u.role === 'field_officer');
  },
  async getOrganizations(): Promise<Organization[]> {
    await delay(200);
    const db = await getMockDatabase();
    return db.organizations;
  },
  async createAssignment(officerId: string, siteId: string, date: string): Promise<void> {
    await delay(400);
    console.log(`Mock Assignment: Officer ${officerId} to Site ${siteId} on ${date}`);
  },
  async getOrganizationStructure(): Promise<OrganizationGroup[]> {
    await delay(500);
    const db = await getMockDatabase();
    return db.organizationStructure;
  },
  async getSiteConfigurations(): Promise<SiteConfiguration[]> {
    await delay(300);
    const db = await getMockDatabase();
    return db.siteConfigurations;
  },
  async getManpowerDetails(siteId: string): Promise<ManpowerDetail[]> {
    await delay(400);
    const db = await getMockDatabase();
    return db.manpowerDetails[siteId] || [];
  },
  async updateManpowerDetails(siteId: string, details: ManpowerDetail[]): Promise<void> {
    await delay(400);
    const db = await getMockDatabase();
    db.manpowerDetails[siteId] = details;
  },
  async bulkUploadOrganizations(orgs: Organization[]): Promise<{ count: number }> {
    await delay(800);
    const db = await getMockDatabase();
    orgs.forEach(org => {
        const index = db.organizations.findIndex(o => o.id === org.id);
        if (index > -1) db.organizations[index] = org;
        else db.organizations.push(org);
    });
    return { count: orgs.length };
  },

  // Verification APIs
  async enhanceDocumentPhoto(base64Image: string, mimeType: string): Promise<string | null> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image-preview',
            contents: {
                parts: [
                    { inlineData: { data: base64Image, mimeType: mimeType } },
                    { text: "This is a photo of a document, possibly with flash glare, bad lighting, or at an angle. Enhance it for maximum readability and clarity for OCR. Remove glare, sharpen text, and correct perspective to be flat. Return only the improved image without any accompanying text." }
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE, Modality.TEXT],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        return null; // No image part in response
    } catch (error: any) {
        console.error("Gemini API error in enhanceDocumentPhoto:", error);
        const rateLimitMessage = handleGeminiRateLimitError(error);
        throw new Error(rateLimitMessage || "AI photo enhancement failed.");
    }
  },
  async verifyHumanPhoto(base64: string, mimeType: string): Promise<{ isHuman: boolean; reason: string }> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64 } },
                    { text: "Is there a real human in this photo? Do not mistake drawings, statues, or photos of screens for a real person. Provide a reason for your decision." }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isHuman: { type: Type.BOOLEAN },
                        reason: { type: Type.STRING }
                    },
                    required: ["isHuman", "reason"]
                }
            }
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);
        return result;
    } catch (error: any) {
        console.error("Gemini API error in verifyHumanPhoto:", error);
        const rateLimitMessage = handleGeminiRateLimitError(error);
        const reason = rateLimitMessage || "AI verification failed. Please try again or proceed with manual review.";
        return { isHuman: false, reason };
    }
  },
  async verifyLivePhoto(base64: string, mimeType: string): Promise<{ isLive: boolean; reason: string }> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64 } },
                    { text: "Analyze this photo for liveness. Is it a picture of a real person present at the time of capture, or is it a photo of another screen, a printed photograph, or a fake image? Look for screen reflections, moiré patterns, or other artifacts. Provide a reason." }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        isLive: { type: Type.BOOLEAN },
                        reason: { type: Type.STRING }
                    },
                    required: ["isLive", "reason"]
                }
            }
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);
        return result;
    } catch (error: any) {
        console.error("Gemini API error in verifyLivePhoto:", error);
        const rateLimitMessage = handleGeminiRateLimitError(error);
        const reason = rateLimitMessage || "AI liveness check failed. Please ensure you are taking a photo of a person and not a screen.";
        return { isLive: false, reason };
    }
  },
  async getPincodeDetails(pincode: string): Promise<{ city: string, state: string }> {
    await delay(500);
    if (pincode === '560001') return { city: 'Bengaluru', state: 'Karnataka' };
    if (pincode.startsWith('5')) return { city: 'Mock City', state: 'Karnataka' };
    throw new Error("Invalid Pincode");
  },
  async extractDataFromImage(base64: string, mimeType: string, schema: any, docType?: 'Aadhaar' | 'PAN'): Promise<any> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64 } },
                    { text: `Extract the information from this document image. The document type is likely ${docType || 'an official ID or document'}. Please return the data in the specified JSON format.` }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (error: any) {
        console.error("Gemini API error in extractDataFromImage:", error);
        const rateLimitMessage = handleGeminiRateLimitError(error);
        if (rateLimitMessage) {
            throw new Error(rateLimitMessage);
        }
        // Return an empty object for other errors to prevent crashes and allow manual entry.
        return {};
    }
  },
  async verifyFingerprintImage(base64: string, mimeType: string): Promise<{ containsFingerprints: boolean; reason: string }> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64 } },
                    { text: "Analyze the image. Does it primarily contain one or more human fingerprints? The image might be a scan of ink prints on paper or a direct scan of a hand. Ignore other elements like text or lines unless they completely obscure the prints. Provide a reason for your decision." }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        containsFingerprints: { type: Type.BOOLEAN },
                        reason: { type: Type.STRING }
                    },
                    required: ["containsFingerprints", "reason"]
                }
            }
        });

        const jsonString = response.text.trim();
        const result = JSON.parse(jsonString);
        return result;
    } catch (error: any) {
        console.error("Gemini API error in verifyFingerprintImage:", error);
        const rateLimitMessage = handleGeminiRateLimitError(error);
        const reason = rateLimitMessage || "AI verification failed. Please try again or upload a clearer image.";
        return { containsFingerprints: false, reason };
    }
  },
  async verifyDetailsWithPerfios(data: any): Promise<VerificationResult> {
      await delay(2500);
      return {
          success: true,
          message: 'All details successfully verified with Perfios.',
          verifiedFields: {
              name: true, dob: true, aadhaar: true, bank: true, uan: true, esi: true
          }
      };
  },

  // Settings & System
  async testEmailConnection(settings: EmailSettings): Promise<{ success: boolean, message: string }> {
    await delay(1000);
    return { success: true, message: "Mock connection successful!" };
  },
  async exportAllData() {
    await delay(200);
    return getMockDatabase();
  },

  // Salary Change Request
  async createSalaryChangeRequest(onboardingData: OnboardingData, requestedAmount: number, requestedById: string): Promise<SalaryChangeRequest> {
    await delay(400);
    const db = await getMockDatabase();
    const requestor = db.users.find(u => u.id === requestedById);
    const newRequest: SalaryChangeRequest = { id: `scr_${Date.now()}`, onboardingId: onboardingData.id!, employeeName: `${onboardingData.personal.firstName} ${onboardingData.personal.lastName}`, siteName: onboardingData.organization.organizationName, requestedBy: requestedById, requestedByName: requestor?.name || 'Unknown', requestedAt: new Date().toISOString(), originalAmount: onboardingData.organization.defaultSalary!, requestedAmount, status: 'pending' };
    db.salaryChangeRequests.push(newRequest);
    return newRequest;
  },

  // Workflow
  async getApprovalWorkflowSettings(): Promise<{ finalConfirmationRole: UserRole }> {
    await delay(100);
    const db = await getMockDatabase();
    return db.approvalWorkflowSettings;
  },
  async updateUserReportingManager(userId: string, managerId: string | null): Promise<void> {
    await delay(100);
    const db = await getMockDatabase();
    const user = db.users.find(u => u.id === userId);
    if (user) user.reportingManagerId = managerId || undefined;
  },
  async updateApprovalWorkflowSettings(role: UserRole): Promise<void> {
    await delay(200);
    const db = await getMockDatabase();
    db.approvalWorkflowSettings.finalConfirmationRole = role;
  },

  // Leave Management
  async getLeaveBalancesForUser(userId: string): Promise<LeaveBalance> {
    await delay(200);
    const db = await getMockDatabase();
    return db.leaveBalances.find(b => b.userId === userId) || { userId, earnedTotal: 0, earnedUsed: 0, sickTotal: 0, sickUsed: 0, floatingTotal: 0, floatingUsed: 0 };
  },
  async getLeaveRequests(filters: { userId?: string, status?: LeaveRequestStatus, forApproverId?: string }): Promise<LeaveRequest[]> {
    await delay(400);
    const db = await getMockDatabase();
    let requests = db.leaveRequests;
    if (filters.userId) requests = requests.filter(r => r.userId === filters.userId);
    if (filters.status) requests = requests.filter(r => r.status === filters.status);
    if (filters.forApproverId) requests = requests.filter(r => r.currentApproverId === filters.forApproverId || (r.status === 'pending_hr_confirmation' && (db.users.find(u => u.id === filters.forApproverId)?.role === 'hr' || db.users.find(u => u.id === filters.forApproverId)?.role === 'admin')));
    return requests;
  },
  async submitLeaveRequest(requestData: Omit<LeaveRequest, 'id' | 'status' | 'currentApproverId' | 'approvalHistory'>): Promise<LeaveRequest> {
    await delay(400);
    const db = await getMockDatabase();
    const user = db.users.find(u => u.id === requestData.userId);
    if (!user) throw new Error("User not found");
    const newRequest: LeaveRequest = { ...requestData, id: `leave_${Date.now()}`, status: 'pending_manager_approval', currentApproverId: user.reportingManagerId || null, approvalHistory: [] };
    if (!newRequest.currentApproverId) {
        newRequest.status = 'pending_hr_confirmation';
        const hrUser = db.users.find(u => u.role === db.approvalWorkflowSettings.finalConfirmationRole);
        newRequest.currentApproverId = hrUser?.id || null;
    }
    db.leaveRequests.push(newRequest);
    return newRequest;
  },
  async approveLeaveRequest(id: string, approverId: string): Promise<void> {
    await delay(300);
    const db = await getMockDatabase();
    const request = db.leaveRequests.find(r => r.id === id);
    if (!request) return;
    request.status = 'pending_hr_confirmation';
    const hrUser = db.users.find(u => u.role === db.approvalWorkflowSettings.finalConfirmationRole);
    request.currentApproverId = hrUser?.id || null;
  },
  async rejectLeaveRequest(id: string, approverId: string): Promise<void> {
    await delay(300);
    const db = await getMockDatabase();
    const request = db.leaveRequests.find(r => r.id === id);
    if (request) request.status = 'rejected';
  },
  async confirmLeaveByHR(id: string, hrId: string): Promise<void> {
    await delay(300);
    const db = await getMockDatabase();
    const request = db.leaveRequests.find(r => r.id === id);
    if (request) request.status = 'approved';
  },

  // Tasks
  async getTasks(): Promise<Task[]> {
    await delay(400);
    const db = await getMockDatabase();
    return db.tasks;
  },
  async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'status' | 'escalationStatus'>): Promise<Task> {
    await delay(300);
    const db = await getMockDatabase();
    const newTask: Task = { ...taskData, id: `task_${Date.now()}`, createdAt: new Date().toISOString(), status: 'To Do', escalationStatus: 'None' };
    db.tasks.unshift(newTask);
    return newTask;
  },
  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    await delay(200);
    const db = await getMockDatabase();
    const task = db.tasks.find(t => t.id === id);
    if (!task) throw new Error("Task not found");
    Object.assign(task, updates);
    return task;
  },
  async deleteTask(id: string): Promise<void> {
    await delay(300);
    const db = await getMockDatabase();
    db.tasks = db.tasks.filter(t => t.id !== id);
  },
  async runAutomaticEscalations(): Promise<{ updatedTasks: Task[], newNotifications: Omit<Notification, 'id' | 'createdAt' | 'isRead'>[] }> {
    return { updatedTasks: [], newNotifications: [] }; // Mock: No automatic escalations in this implementation
  },

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    await delay(300);
    const db = await getMockDatabase();
    return db.notifications.filter(n => n.userId === userId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>): Promise<Notification> {
    await delay(100);
    const db = await getMockDatabase();
    const newNotif: Notification = { ...notification, id: `notif_${Date.now()}`, createdAt: new Date().toISOString(), isRead: false };
    db.notifications.push(newNotif);
    
    const { email } = useSettingsStore.getState().notifications;
    if (email.enabled) {
      const user = db.users.find(u => u.id === notification.userId);
      if (user?.email) {
        try {
          // This will trigger the "Trigger Email" Firebase Extension
          await addDoc(collection(db, "mail"), {
            to: [user.email],
            message: {
              subject: `New Notification: ${notification.type.replace('_', ' ').toUpperCase()}`,
              text: `${notification.message}\n\nYou can view this in the app: ${window.location.origin}`,
              html: `<p>${notification.message}</p><p>You can view this in the <a href="${window.location.origin}">app</a>.</p>`,
            },
          });
          console.log(`Email trigger document written to Firestore for ${user.email}`);
        } catch (error) {
          console.error("Error writing email trigger to Firestore:", error);
          // Don't block the UI for this, just log it.
        }
      }
    }
    
    return newNotif;
  },
  async markNotificationAsRead(id: string): Promise<void> {
    await delay(100);
    const db = await getMockDatabase();
    const notif = db.notifications.find(n => n.id === id);
    if (notif) notif.isRead = true;
  },
  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await delay(200);
    const db = await getMockDatabase();
    db.notifications.forEach(n => { if (n.userId === userId) n.isRead = true; });
  },

  // HR Config: Policies & Insurance
  async getPolicies(): Promise<Policy[]> {
    await delay(200);
    const db = await getMockDatabase();
    return db.policies;
  },
  async createPolicy(policy: Omit<Policy, 'id'>): Promise<Policy> {
    await delay(200);
    const db = await getMockDatabase();
    const newPolicy = { ...policy, id: `pol_${Date.now()}` };
    db.policies.push(newPolicy);
    return newPolicy;
  },
  async getInsurances(): Promise<Insurance[]> {
    await delay(200);
    const db = await getMockDatabase();
    return db.insurances;
  },
  async createInsurance(insurance: Omit<Insurance, 'id'>): Promise<Insurance> {
    await delay(200);
    const db = await getMockDatabase();
    const newIns = { ...insurance, id: `ins_${Date.now()}` };
    db.insurances.push(newIns);
    return newIns;
  },

  // HR Config: Assets, Tools, etc.
  async getAllSiteAssets(): Promise<Record<string, Asset[]>> {
    await delay(400);
    const db = await getMockDatabase();
    return db.siteAssets;
  },
  async updateSiteAssets(siteId: string, assets: Asset[]): Promise<void> {
    await delay(400);
    const db = await getMockDatabase();
    db.siteAssets[siteId] = assets;
  },
  async getBackOfficeIdSeries(): Promise<BackOfficeIdSeries[]> {
    await delay(200);
    const db = await getMockDatabase();
    return db.backOfficeIdSeries;
  },
  async updateBackOfficeIdSeries(series: BackOfficeIdSeries[]): Promise<void> {
    await delay(300);
    const db = await getMockDatabase();
    db.backOfficeIdSeries = series;
  },
  async getSiteStaffDesignations(): Promise<SiteStaffDesignation[]> {
    await delay(200);
    const db = await getMockDatabase();
    return db.siteStaffDesignations;
  },
  async updateSiteStaffDesignations(designations: SiteStaffDesignation[]): Promise<void> {
    await delay(300);
    const db = await getMockDatabase();
    db.siteStaffDesignations = designations;
  },
  async getToolsList(): Promise<MasterToolsList> {
    await delay(200);
    const db = await getMockDatabase();
    return db.toolsList;
  },
  async getAllSiteIssuedTools(): Promise<Record<string, IssuedTool[]>> {
    await delay(400);
    const db = await getMockDatabase();
    return db.siteIssuedTools;
  },
  async updateSiteIssuedTools(siteId: string, tools: IssuedTool[]): Promise<void> {
    await delay(400);
    const db = await getMockDatabase();
    db.siteIssuedTools[siteId] = tools;
  },

  // HR Config: Uniforms
  async getMasterGentsUniforms(): Promise<MasterGentsUniforms> {
    await delay(200);
    const db = await getMockDatabase();
    return db.gentsUniforms;
  },
  async getAllSiteGentsUniforms(): Promise<Record<string, SiteGentsUniformConfig>> {
    await delay(400);
    const db = await getMockDatabase();
    return db.siteGentsUniforms;
  },
  async updateSiteGentsUniforms(siteId: string, config: SiteGentsUniformConfig): Promise<void> {
    await delay(400);
    const db = await getMockDatabase();
    db.siteGentsUniforms[siteId] = config;
  },
  async getMasterLadiesUniforms(): Promise<MasterLadiesUniforms> {
    await delay(200);
    const db = await getMockDatabase();
    return db.ladiesUniforms;
  },
  async getAllSiteLadiesUniforms(): Promise<Record<string, SiteLadiesUniformConfig>> {
    await delay(400);
    const db = await getMockDatabase();
    return db.siteLadiesUniforms;
  },
  async updateSiteLadiesUniforms(siteId: string, config: SiteLadiesUniformConfig): Promise<void> {
    await delay(400);
    const db = await getMockDatabase();
    db.siteLadiesUniforms[siteId] = config;
  },
  async getAllSiteUniformDetails(): Promise<Record<string, SiteUniformDetailsConfig>> {
    await delay(400);
    const db = await getMockDatabase();
    return db.siteUniformDetails;
  },
  async updateSiteUniformDetails(siteId: string, config: SiteUniformDetailsConfig): Promise<void> {
    await delay(400);
    const db = await getMockDatabase();
    db.siteUniformDetails[siteId] = config;
  },

  // Uniform Requests
  async getUniformRequests(): Promise<UniformRequest[]> {
    await delay(300);
    const db = await getMockDatabase();
    return db.uniformRequests;
  },
  async submitUniformRequest(request: UniformRequest): Promise<void> {
    await delay(300);
    const db = await getMockDatabase();
    db.uniformRequests.push(request);
  },
  async updateUniformRequest(request: UniformRequest): Promise<void> {
    await delay(300);
    const db = await getMockDatabase();
    const index = db.uniformRequests.findIndex(r => r.id === request.id);
    if (index > -1) db.uniformRequests[index] = request;
  },
  async deleteUniformRequest(id: string): Promise<void> {
    await delay(300);
    const db = await getMockDatabase();
    db.uniformRequests = db.uniformRequests.filter(r => r.id !== id);
  },

  // Billing
  async getInvoiceStatuses(month: Date): Promise<Record<string, 'Not Generated' | 'Generated' | 'Sent' | 'Paid'>> {
    await delay(600);
    const db = await getMockDatabase();
    const statuses: Record<string, 'Not Generated' | 'Generated' | 'Sent' | 'Paid'> = {};
    db.organizations.forEach(org => {
        const rand = Math.random();
        if (rand < 0.2) statuses[org.id] = 'Not Generated';
        else if (rand < 0.5) statuses[org.id] = 'Generated';
        else if (rand < 0.8) statuses[org.id] = 'Sent';
        else statuses[org.id] = 'Paid';
    });
    return statuses;
  },
  async getInvoiceSummaryData(siteId: string, month: Date): Promise<InvoiceData> {
    await delay(1000);
    const db = await getMockDatabase();
    const site = db.organizations.find(o => o.id === siteId);
    if (!site) throw new Error("Site not found");

    const lineItems = Object.entries(db.billingRates).map(([desc, rates], i) => ({
      id: `li_${i}`,
      description: desc,
      deployment: Math.floor(Math.random() * 5) + 1,
      noOfDays: getDaysInMonth(month),
      ...rates
    }));

    return {
      siteName: site.fullName,
      siteAddress: site.address,
      invoiceNumber: `INV-${site.shortName}-${format(month, 'MMyy')}`,
      invoiceDate: format(getEndOfMonth(month), 'dd-MMM-yyyy'),
      statementMonth: format(month, 'MMMM-yyyy'),
      lineItems,
    };
  },

  // Attendance
  async getAllAttendanceEvents(start: string, end: string): Promise<AttendanceEvent[]> {
    await delay(400);
    const db = await getMockDatabase();
    const startDate = new Date(start);
    const endDate = new Date(end);
    return db.attendanceEvents.filter(e => {
        const eventDate = new Date(e.timestamp);
        return eventDate >= startDate && eventDate <= endDate;
    });
  },
  async getAttendanceEvents(userId: string, start: string, end: string): Promise<AttendanceEvent[]> {
    await delay(100);
    const db = await getMockDatabase();
    const startDate = new Date(start);
    const endDate = new Date(end);
    return db.attendanceEvents.filter(e => {
        const eventDate = new Date(e.timestamp);
        return e.userId === userId && eventDate >= startDate && eventDate <= endDate;
    });
  },
  async addAttendanceEvent(event: Omit<AttendanceEvent, 'id'>): Promise<void> {
    await delay(200);
    const db = await getMockDatabase();
    db.attendanceEvents.push({ ...event, id: `evt_${Date.now()}` });
    
    // Simulate notification logic
    const { enableAttendanceNotifications } = useSettingsStore.getState().attendance;
    if ((event.type === 'check-in' || event.type === 'check-out') && enableAttendanceNotifications) {
      const user = db.users.find(u => u.id === event.userId);
      if (user) {
        const eventType = event.type.replace('-', ' ');
        console.log(`SIMULATED NOTIFICATION: Field Officer ${user.name} ${eventType} at ${format(new Date(event.timestamp), 'hh:mm a')}. Notifying Site Manager, Ops Manager, and HR.`);
      }
    }
  },

  // Documents
  async uploadDocument(file: File): Promise<{ url: string }> {
      await delay(1000); // Simulate upload time
      // In a real app, this would upload to a service like S3/Firebase Storage
      // and return the actual URL. Here we just return a placeholder.
      return { url: `https://mockstorage.com/${file.name}` };
  },
};