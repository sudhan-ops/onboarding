import type { ComponentType } from 'react';

export type UserRole = 'admin' | 'hr' | 'developer' | 'operation_manager' | 'site_manager' | 'field_officer';

export type Permission =
  | 'view_all_submissions'
  | 'manage_users'
  | 'manage_sites'
  | 'view_entity_management'
  | 'view_developer_settings'
  | 'view_operations_dashboard'
  | 'view_site_dashboard'
  | 'create_enrollment'
  | 'manage_roles_and_permissions'
  | 'manage_attendance_rules'
  | 'view_own_attendance'
  | 'view_all_attendance'
  | 'apply_for_leave'
  | 'manage_leave_requests'
  | 'manage_approval_workflow'
  | 'download_attendance_report'
  | 'manage_tasks'
  | 'manage_policies'
  | 'manage_insurance'
  | 'manage_enrollment_rules'
  | 'manage_uniforms'
  | 'view_invoice_summary'
  | 'view_field_officer_tracking';

export interface Organization {
    id: string;
    shortName: string;
    fullName: string;
    address: string;
    manpowerApprovedCount?: number;
}

export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    organizationId?: string; 
    organizationName?: string;
    reportingManagerId?: string;
    photoUrl?: string;
}

export interface UploadedFile {
    name: string;
    type: string;
    size: number;
    preview: string;
    url?: string; // URL after upload
    file: File;
    progress?: number;
}

export interface PersonalDetails {
    employeeId: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    preferredName?: string;
    dob: string;
    gender: 'Male' | 'Female' | 'Other' | '';
    maritalStatus: 'Single' | 'Married' | 'Divorced' | 'Widowed' | '';
    bloodGroup: '' | 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
    mobile: string;
    alternateMobile?: string;
    email: string;
    idProofType?: 'Aadhaar' | 'PAN' | 'Voter ID' | '';
    idProofNumber?: string;
    photo?: UploadedFile | null;
    idProofFront?: UploadedFile | null;
    idProofBack?: UploadedFile | null;
    emergencyContactName: string;
    emergencyContactNumber: string;
    relationship: 'Spouse' | 'Child' | 'Father' | 'Mother' | 'Sibling' | 'Other' | '';
    salary: number | null;
    verifiedStatus?: {
        name?: boolean;
        dob?: boolean;
        idProofNumber?: boolean;
    };
}

export interface Address {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    verifiedStatus?: {
        line1?: boolean;
        city?: boolean;
        state?: boolean;
        pincode?: boolean;
        country?: boolean;
    };
}

export interface AddressDetails {
    present: Address;
    permanent: Address;
    sameAsPresent: boolean;
}

export interface FamilyMember {
    id: string;
    relation: 'Spouse' | 'Child' | 'Father' | 'Mother' | '';
    name: string;
    dob: string;
    gender: 'Male' | 'Female' | 'Other' | '';
    occupation?: string;
    dependent: boolean;
    idProof: UploadedFile | null;
}

export interface EducationRecord {
    id: string;
    degree: string;
    institution: string;
    startYear: string;
    endYear: string;
    percentage?: number | null;
    grade?: string;
    document?: UploadedFile | null;
}

export interface BankDetails {
    accountHolderName: string;
    accountNumber: string;
    confirmAccountNumber: string;
    ifscCode: string;
    bankName: string;
    branchName: string;
    bankProof?: UploadedFile | null;
    verifiedStatus?: {
        accountHolderName?: boolean;
        accountNumber?: boolean;
        ifscCode?: boolean;
    };
}

export interface UanDetails {
    uanNumber?: string;
    pfNumber?: string;
    hasPreviousPf: boolean;
    document?: UploadedFile | null;
    salarySlip?: UploadedFile | null;
    verifiedStatus?: {
        uanNumber?: boolean;
    };
}

export interface EsiDetails {
    esiNumber?: string;
    esiRegistrationDate?: string;
    esicBranch?: string;
    hasEsi: boolean;
    document?: UploadedFile | null;
    verifiedStatus?: {
        esiNumber?: boolean;
    };
}

// FIX: Added missing optional properties to support legacy GMC form components and resolve type errors.
export interface GmcDetails {
    isOptedIn: boolean | null;
    
    // Fields for "Yes" (New and Old)
    policyAmount?: '1L' | '2L' | '';
    nomineeName?: string;
    nomineeRelation?: 'Spouse' | 'Child' | 'Father' | 'Mother' | '';
    wantsToAddDependents?: boolean;
    selectedSpouseId?: string;
    selectedChildIds?: string[];
    
    // Fields for "No" (New and Old)
    gmcPolicyCopy?: UploadedFile | null;
    declarationAccepted?: boolean;
    optOutReason?: string;
    alternateInsuranceProvider?: string;
    alternateInsuranceStartDate?: string;
    alternateInsuranceEndDate?: string;
    alternateInsuranceCoverage?: string;
}

export interface OrganizationDetails {
    designation: string;
    department: string;
    reportingManager: string;
    organizationId: string;
    organizationName: string;
    joiningDate: string;
    workType: 'Full-time' | 'Part-time' | 'Contract' | '';
    site?: string;
    defaultSalary?: number | null;
}

export interface EmployeeUniformSelection {
  itemId: string; // From UniformItem.id
  itemName: string; // From UniformItem.name
  sizeId: string; // From MasterGents/LadiesUniforms.pants/shirts[].id
  sizeLabel: string; // e.g., "32" or "L"
  fit: string; // e.g., "Regular Fit"
  quantity: number;
}

export interface SalaryChangeRequest {
  id: string;
  onboardingId: string;
  employeeName: string;
  siteName: string;
  requestedBy: string; // userId
  requestedByName: string;
  requestedAt: string; // ISO string
  originalAmount: number;
  requestedAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  approvedBy?: string; // userId
  approvedAt?: string;
  rejectionReason?: string;
}

export interface Fingerprints {
  leftHand: UploadedFile | null;
  rightHand: UploadedFile | null;
}

export interface BiometricsData {
  signatureImage: UploadedFile | null;
  fingerprints: Fingerprints;
}

export interface OnboardingData {
    id?: string;
    status: 'draft' | 'pending' | 'verified' | 'rejected';
    portalSyncStatus?: 'pending_sync' | 'synced' | 'failed';
    organizationId?: string;
    organizationName?: string;
    enrollmentDate: string;
    personal: PersonalDetails;
    address: AddressDetails;
    family: FamilyMember[];
    education: EducationRecord[];
    bank: BankDetails;
    uan: UanDetails;
    esi: EsiDetails;
    gmc: GmcDetails;
    organization: OrganizationDetails;
    uniforms: EmployeeUniformSelection[];
    biometrics: BiometricsData;
    salaryChangeRequest?: SalaryChangeRequest | null;
    requiresManualVerification?: boolean;
    formsGenerated?: boolean;
}

export type OnboardingStep = 'personal' | 'address' | 'family' | 'education' | 'bank' | 'uan' | 'esi' | 'gmc' | 'organization' | 'uniform' | 'documents' | 'biometrics' | 'review';

export interface EmailSettings {
  smtpServer: string;
  port: number;
  username: string;
  password?: string;
  senderEmail: string;
}

export interface AddressSettings {
    enablePincodeVerification: boolean;
}

export interface GmcPolicySettings {
  applicability: 'Mandatory' | 'Optional - Opt-in Default' | 'Optional - Opt-out Default';
  optInDisclaimer: string;
  coverageDetails: string;
  optOutDisclaimer: string;
  requireAlternateInsurance: boolean;
  collectProvider: boolean;
  collectStartDate: boolean;
  collectEndDate: boolean;
  collectExtentOfCover: boolean;
}

export interface DocumentRules {
  aadhaar: boolean;
  pan: boolean;
  bankProof: boolean;
  educationCertificate: boolean;
  salarySlip: boolean;
  uanProof: boolean;
  familyAadhaar: boolean;
}

export interface VerificationRules {
  requireBengaluruAddress: boolean;
  requireDobVerification: boolean;
}

export interface EnrollmentRules {
  esiCtcThreshold: number;
  enforceManpowerLimit: boolean;
  manpowerLimitRule: 'warn' | 'block';
  allowSalaryEdit?: boolean;
  salaryThreshold: number;
  defaultPolicySingle: '1L' | '2L';
  defaultPolicyMarried: '1L' | '2L';
  enableEsiRule: boolean;
  enableGmcRule: boolean;
  enforceFamilyValidation?: boolean;
  rulesByDesignation: {
    [designation: string]: {
      documents: DocumentRules;
      verifications: VerificationRules;
    };
  };
}

export interface OtpSettings {
  enabled: boolean;
}

export interface NotificationSettings {
  email: {
    enabled: boolean;
  };
}

// Types for Entity Management
export type RegistrationType = 'CIN' | 'ROC' | 'ROF' | 'Society' | 'Trust' | '';

export interface Entity {
  id: string;
  name: string;
  organizationId?: string;
  location?: string;
  registeredAddress?: string;
  registrationType?: RegistrationType;
  registrationNumber?: string;
  gstNumber?: string;
  panNumber?: string;
  email?: string;
  eShramNumber?: string;
  shopAndEstablishmentCode?: string;
  epfoCode?: string;
  esicCode?: string;
  psaraLicenseNumber?: string;
  psaraValidTill?: string;
  insuranceIds?: string[];
  policyIds?: string[];
}

export interface Company {
  id: string;
  name: string;
  entities: Entity[];
}

export interface OrganizationGroup {
  id: string;
  name: string; // e.g., "Paradigm Group"
  locations: string[];
  companies: Company[];
}

export interface Policy {
  id: string;
  name: string;
  description?: string;
}

export type InsuranceType = 'GMC' | 'GPA' | 'WCA' | 'Other';
export interface Insurance {
  id: string;
  type: InsuranceType;
  provider: string;
  policyNumber: string;
  validTill: string;
}

export interface HolidayListItem {
  id: string;
  date: string;
  description: string;
}

export interface ToolListItem {
  id: string;
  name: string;
  brand: string;
  size: string;
  quantity: number | null;
  issueDate: string;
  picture?: UploadedFile | null;
}

export interface SimDetail {
  id: string;
  mobileNumber: string;
  allocatedTo?: string;
  plan?: string;
  ownerName?: string;
}

export interface IssuedEquipment {
  id: string;
  name: string;
  brand: string;
  modelNumber: string;
  serialNumber: string;
  accessories: string;
  condition: 'New' | 'Old' | '';
  issueDate: string;
  picture?: UploadedFile | null;
}

export interface InsurancePolicyDetails {
  policyNumber: string;
  provider: string;
  validFrom: string;
  validTo: string;
  document?: UploadedFile | null;
}

export interface SiteInsuranceStatus {
  isCompliant: boolean;
  gpa?: InsurancePolicyDetails;
  gmcGhi?: InsurancePolicyDetails;
  gtl?: InsurancePolicyDetails;
  wc?: InsurancePolicyDetails;
}

export interface IssuedTool {
  id: string;
  department: string;
  name: string;
  quantity: number | null;
  picture?: UploadedFile | null;
  inwardDcCopy?: UploadedFile | null;
  deliveryCopy?: UploadedFile | null;
  invoiceCopy?: UploadedFile | null;
  receiverName?: string;
  signedReceipt?: UploadedFile | null;
}

export interface SiteConfiguration {
  organizationId: string;
  entityId?: string;
  location?: string;
  billingName?: string;
  registeredAddress?: string;
  gstNumber?: string;
  panNumber?: string;
  email1?: string;
  email2?: string;
  email3?: string;
  eShramNumber?: string;
  shopAndEstablishmentCode?: string;
  keyAccountManager?: string;
  siteAreaSqFt?: number | null;
  projectType?: 'Apartment' | 'Villa' | 'Vilament' | 'Rowhouse' | 'Combined' | 'Commercial Office' | 'Commercial Retail' | 'Commercial' | 'Public' | '';
  apartmentCount?: number | null;
  agreementDetails?: {
    fromDate?: string | null;
    toDate?: string | null;
    renewalIntervalDays?: number | null;
    softCopy?: UploadedFile | null;
    scannedCopy?: UploadedFile | null;
    agreementDate?: string | null;
    addendum1Date?: string | null;
    addendum2Date?: string | null;
  };
  siteOperations?: {
    form6Applicable: boolean;
    form6RenewalTaskCreation?: boolean;
    form6ValidityFrom?: string | null;
    form6ValidityTo?: string | null;
    form6Document?: UploadedFile | null;

    minWageRevisionApplicable: boolean;
    minWageRevisionTaskCreation?: boolean;
    minWageRevisionValidityFrom?: string | null;
    minWageRevisionValidityTo?: string | null;
    minWageRevisionDocument?: UploadedFile | null;

    holidays?: {
      numberOfDays?: number | null;
      list?: HolidayListItem[];
      salaryPayment?: 'Full Payment' | 'Duty Payment' | 'Nil Payment' | '';
      billing?: 'Full Payment' | 'Duty Payment' | 'Nil Payment' | '';
    };
    
    costingSheetLink?: string;
    
    tools?: {
      dcCopy1?: UploadedFile | null;
      dcCopy2?: UploadedFile | null;
      list?: ToolListItem[];
    };

    sims?: {
      issuedCount?: number | null;
      details?: SimDetail[];
    };

    equipment?: {
      issued?: IssuedEquipment[];
      intermittent?: {
        billing: 'To Be Billed' | 'Not to be Billed' | '';
        frequency: 'Monthly' | 'Bi-Monthly' | 'Quarterly' | 'Half Yearly' | 'Yearly' | '';
        taskCreation?: boolean;
        durationDays?: number | null;
      };
    };

    billingCycleFrom?: string | null;
    uniformDeductions: boolean;
  };
  insuranceStatus?: SiteInsuranceStatus;
  assets?: Asset[];
  issuedTools?: IssuedTool[];
}

export interface Agreement {
  id: string;
  name: string;
  fromDate?: string;
  toDate?: string;
  renewalIntervalDays?: number | null;
  softCopy?: UploadedFile | null;
  scannedCopy?: UploadedFile | null;
  agreementDate?: string;
  addendum1Date?: string;
  addendum2Date?: string;
}


// Types for Attendance
export type AttendanceEventType = 'check-in' | 'check-out';

export interface AttendanceEvent {
    id: string;
    userId: string;
    timestamp: string; // ISO String
    type: AttendanceEventType;
    latitude?: number;
    longitude?: number;
}

export interface AttendanceSettings {
    minimumHoursFullDay: number;
    minimumHoursHalfDay: number;
    annualEarnedLeaves: number;
    annualSickLeaves: number;
    monthlyFloatingLeaves: number;
    enableAttendanceNotifications: boolean;
}

export interface Holiday {
    id: string;
    date: string; // YYYY-MM-DD
    name: string;
}

export type DailyAttendanceStatus = 'Present' | 'Half Day' | 'Absent' | 'Holiday' | 'Weekend' | 'Incomplete' | 'On Leave (Full)' | 'On Leave (Half)';

export interface DailyAttendanceRecord {
    date: string; // YYYY-MM-DD
    day: string; // 'Monday', etc.
    checkIn: string | null; // "HH:mm"
    checkOut: string | null; // "HH:mm"
    duration: string | null; // "HHh MMm"
    status: DailyAttendanceStatus;
}

// Types for Leave Management
export type LeaveType = 'Earned' | 'Sick' | 'Floating';
export type LeaveRequestStatus = 'pending_manager_approval' | 'pending_hr_confirmation' | 'approved' | 'rejected';

export interface ApprovalRecord {
    approverId: string;
    approverName: string;
    status: 'approved' | 'rejected';
    timestamp: string;
    comments?: string;
}

export interface LeaveBalance {
    userId: string;
    [key: string]: number | string; // To allow indexing with a string
    earnedTotal: number;
    earnedUsed: number;
    sickTotal: number;
    sickUsed: number;
    floatingTotal: number;
    floatingUsed: number;
}

export interface LeaveRequest {
    id: string;
    userId: string;
    userName: string;
    leaveType: LeaveType;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    reason: string;
    status: LeaveRequestStatus;
    dayOption?: 'full' | 'half'; // only for single-day earned leave
    currentApproverId: string | null;
    approvalHistory: ApprovalRecord[];
}

// Types for Task Management
export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'To Do' | 'In Progress' | 'Done';
export type EscalationStatus = 'None' | 'Level 1' | 'Level 2' | 'Email Sent';

export interface Task {
    id: string;
    name: string;
    description?: string;
    dueDate?: string | null;
    priority: TaskPriority;
    status: TaskStatus;
    createdAt: string; // ISO String
    assignedToId?: string;
    assignedToName?: string;
    completionNotes?: string;
    completionPhoto?: UploadedFile | null;
    escalationStatus: EscalationStatus;
    escalationLevel1UserId?: string;
    escalationLevel1DurationDays?: number;
    escalationLevel2UserId?: string;
    escalationLevel2DurationDays?: number;
    escalationEmail?: string;
    escalationEmailDurationDays?: number;
}

// Types for Notifications
export type NotificationType = 'task_assigned' | 'task_escalated';

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string; // ISO String
  linkTo?: string; // e.g., '/tasks'
}

// Manpower Details Type
export interface ManpowerDetail {
  designation: string;
  count: number;
}

// Back Office ID Series Type
export interface BackOfficeIdSeries {
  id: string;
  department: string;
  designation: string;
  permanentId: string;
  temporaryId: string;
}

// Site Staff Designation Type
export interface SiteStaffDesignation {
  id: string;
  department: string;
  designation: string;
  permanentId: string;
  temporaryId: string;
  monthlySalary?: number | null;
}

// Asset Management Types
export type AssetCondition = 'New' | 'Used' | '';
export type DamageStatus = 'With Damages' | 'Without Damages' | '';

export interface PhoneAsset {
  id: string;
  type: 'Phone';
  brand: string;
  condition: AssetCondition;
  chargerStatus: 'With Charger' | 'Without Charger' | '';
  displayStatus: DamageStatus;
  bodyStatus: DamageStatus;
  imei: string;
  color: string;
  picture?: UploadedFile | null;
}

export interface SimAsset {
  id: string;
  type: 'Sim';
  number: string;
}

export interface ComputerAsset {
  id: string;
  type: 'Computer';
  computerType: 'Laptop' | 'Desktop' | 'Tab' | '';
  brand: string;
  condition: AssetCondition;
  bagStatus: 'With Bag' | 'Without Bag' | '';
  mouseStatus: 'With Mouse' | 'Without Mouse' | '';
  chargerStatus: 'With Charger' | 'Without Charger' | '';
  displayStatus: DamageStatus;
  bodyStatus: DamageStatus;
  serialNumber: string;
  windowsKey: string;
  officeStatus: 'With Office' | 'Without Office' | '';
  antivirusStatus: 'With Antivirus' | 'Without Antivirus' | '';
  picture?: UploadedFile | null;
}

export interface IdCardAsset {
  id: string;
  type: 'IdCard';
  issueDate: string;
}

export interface PetrocardAsset {
  id: string;
  type: 'Petrocard';
  number: string;
}

export interface VehicleAsset {
  id: string;
  type: 'Vehicle';
  vehicleType: 'Bicycle' | 'Two Wheeler' | 'Three Wheeler' | 'Four Wheeler' | '';
  brand: string;
  dlNumber: string;
  dlFrontPic?: UploadedFile | null;
  dlBackPic?: UploadedFile | null;
  condition: AssetCondition;
  kmsAtIssue: number | null;
  vehicleNumber: string;
  chassisNumber: string;
  insuranceValidity: string;
  pollutionCertValidity: string;
  finesStatus: 'Existing' | 'Nil' | '';
  picture?: UploadedFile | null;
}

export interface ToolAssetItem {
    id: string;
    name: string;
    description: string;
    quantity: number | null;
}

export interface ToolsAsset {
    id:string;
    type: 'Tools';
    toolList: ToolAssetItem[];
    picture?: UploadedFile | null;
}

export interface OtherAsset {
  id: string;
  type: 'Other';
  name: string;
  brand: string;
  model: string;
  serialNumber: string;
  condition: AssetCondition;
  issueCondition: string;
  accessories: string;
  picture?: UploadedFile | null;
}

export type Asset = PhoneAsset | SimAsset | ComputerAsset | IdCardAsset | PetrocardAsset | VehicleAsset | ToolsAsset | OtherAsset;

// Types for Master Tools List
export interface MasterTool {
  id: string;
  name: string;
}

export type MasterToolsList = {
  [category: string]: MasterTool[];
};

// Types for Gents Uniform Chart
export interface GentsPantsSize {
  id: string;
  size: string;
  length: number;
  waist: number;
  hip: number;
  tilesLoose: number;
  bottomWaist: number;
  fit: 'Slim Fit' | 'Regular Fit' | 'Plump Fit';
}

export interface GentsShirtSize {
  id: string;
  size: string;
  length: number;
  sleeves: number;
  sleevesLoose: number;
  chest: number;
  halfChestLoose: number;
  shoulder: number;
  collar: number;
  fit: 'Slim Fit' | 'Regular Fit' | 'Plump Fit';
}

export interface MasterGentsUniforms {
    pants: GentsPantsSize[];
    shirts: GentsShirtSize[];
}

export interface UniformDesignationConfig {
  id: string;
  designation: string;
  pantsQuantities: Record<string, number | null>; // key is GentsPantsSize id
  shirtsQuantities: Record<string, number | null>; // key is GentsShirtSize id
}

export interface UniformDepartmentConfig {
  id: string;
  department: string;
  designations: UniformDesignationConfig[];
}

export interface SiteGentsUniformConfig {
  organizationId: string;
  departments: UniformDepartmentConfig[];
}

// Types for Ladies Uniform Chart
export interface LadiesPantsSize {
  id: string;
  size: string;
  length: number;
  waist: number;
  hip: number;
  fit: 'Slim Fit' | 'Regular Fit' | 'Comfort Fit';
}

export interface LadiesShirtSize {
  id: string;
  size: string;
  length: number;
  sleeves: number;
  bust: number;
  shoulder: number;
  fit: 'Slim Fit' | 'Regular Fit' | 'Comfort Fit';
}

export interface MasterLadiesUniforms {
    pants: LadiesPantsSize[];
    shirts: LadiesShirtSize[];
}

export interface LadiesUniformDesignationConfig {
  id:string;
  designation: string;
  pantsQuantities: Record<string, number | null>; // key is LadiesPantsSize id
  shirtsQuantities: Record<string, number | null>; // key is LadiesShirtSize id
}

export interface LadiesUniformDepartmentConfig {
  id: string;
  department: string;
  designations: LadiesUniformDesignationConfig[];
}

export interface SiteLadiesUniformConfig {
  organizationId: string;
  departments: LadiesUniformDepartmentConfig[];
}

// Types for Uniform Details
export interface UniformItem {
  id: string;
  name: string;
}

export interface UniformDetailDesignation {
  id: string;
  designation: string;
  items: UniformItem[];
}

export interface UniformDetailDepartment {
  id: string;
  department: string;
  designations: UniformDetailDesignation[];
}

export interface SiteUniformDetailsConfig {
  organizationId: string;
  departments: UniformDetailDepartment[];
}

// Types for Billing & Invoicing
export interface InvoiceLineItem {
  id: string;
  description: string;
  deployment: number;
  noOfDays: number;
  ratePerDay: number;
  ratePerMonth: number;
}

export interface InvoiceData {
  siteName: string;
  siteAddress: string;
  invoiceNumber: string;
  invoiceDate: string;
  statementMonth: string;
  lineItems: InvoiceLineItem[];
}

export interface BillingRates {
    [designation: string]: {
        ratePerDay: number;
        ratePerMonth: number;
    }
}

export interface PerfiosApiSettings {
  enabled: boolean;
  endpoint: string;
  apiKey: string;
  clientSecret: string;
}

export interface SurepassApiSettings {
  enabled: boolean;
  endpoint: string;
  apiKey: string;
  token: string;
}

export interface AuthbridgeApiSettings {
  enabled: boolean;
  endpoint: string;
  username: string;
  password?: string;
}

export interface VerificationResult {
    success: boolean;
    message: string;
    verifiedFields: {
        name: boolean | null;
        dob: boolean | null;
        aadhaar: boolean | null;
        bank: boolean | null;
        uan: boolean | null;
        esi: boolean | null;
    };
}

// Types for Uniform Management
export interface UniformRequestItem {
  sizeId: string;
  sizeLabel: string;
  fit: string;
  category: 'Pants' | 'Shirts';
  quantity: number;
}

export interface UniformRequest {
  id: string;
  siteId: string;
  siteName: string;
  gender: 'Gents' | 'Ladies';
  requestedDate: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Issued';
  items: UniformRequestItem[];
}