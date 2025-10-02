
import { create } from 'zustand';
import type { OnboardingData, PersonalDetails, AddressDetails, FamilyMember, EducationRecord, BankDetails, UanDetails, EsiDetails, GmcDetails, OrganizationDetails, EmployeeUniformSelection, Address, SalaryChangeRequest, BiometricsData } from '../types';

interface OnboardingState {
  data: OnboardingData;
  setData: (data: OnboardingData) => void;
  updatePersonal: (personal: Partial<PersonalDetails>) => void;
  setPersonalVerifiedStatus: (status: Partial<PersonalDetails['verifiedStatus']>) => void;
  updateAddress: (address: Partial<AddressDetails>) => void;
  setAddressVerifiedStatus: (type: 'present' | 'permanent', status: Partial<Address['verifiedStatus']>) => void;
  updateFamily: (family: FamilyMember[]) => void;
  // FIX: Removed duplicate declaration of addFamilyMember to resolve duplicate identifier error. The version without arguments is used.
  updateEducation: (education: EducationRecord[]) => void;
  updateBank: (bank: Partial<BankDetails>) => void;
  setBankVerifiedStatus: (status: Partial<BankDetails['verifiedStatus']>) => void;
  updateUan: (uan: Partial<UanDetails>) => void;
  setUanVerifiedStatus: (status: Partial<UanDetails['verifiedStatus']>) => void;
  updateEsi: (esi: Partial<EsiDetails>) => void;
  setEsiVerifiedStatus: (status: Partial<EsiDetails['verifiedStatus']>) => void;
  updateGmc: (gmc: Partial<GmcDetails>) => void;
  updateOrganization: (org: Partial<OrganizationDetails>) => void;
  updateUniforms: (uniforms: EmployeeUniformSelection[]) => void;
  updateBiometrics: (biometrics: Partial<BiometricsData>) => void;
  setSalaryChangeRequest: (request: SalaryChangeRequest | null) => void;
  setRequiresManualVerification: (requires: boolean) => void;
  setFormsGenerated: (generated: boolean) => void;
  reset: () => void;
  addFamilyMember: () => void;
  updateFamilyMember: (id: string, updates: Partial<FamilyMember>) => void;
  removeFamilyMember: (id: string) => void;
  addEducationRecord: () => void;
  updateEducationRecord: (id: string, updates: Partial<EducationRecord>) => void;
  removeEducationRecord: (id: string) => void;
  addOrUpdateEmergencyContactAsFamilyMember: () => void;
}

const getInitialState = (): OnboardingData => ({
  id: `draft_${Date.now()}`,
  status: 'draft',
  enrollmentDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
  personal: {
    employeeId: `PARA-${Math.floor(1000 + Math.random() * 9000)}`,
    firstName: '',
    lastName: '',
    dob: '',
    gender: '',
    maritalStatus: '',
    bloodGroup: '',
    mobile: '',
    email: '',
    idProofType: '',
    idProofNumber: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    relationship: '',
    salary: null,
    verifiedStatus: {},
  },
  address: {
    present: { line1: '', city: 'Bengaluru', state: 'Karnataka', country: 'India', pincode: '', verifiedStatus: { country: true } },
    permanent: { line1: '', city: '', state: '', country: 'India', pincode: '', verifiedStatus: { country: true } },
    sameAsPresent: false,
  },
  family: [],
  education: [],
  bank: {
    accountHolderName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    verifiedStatus: {},
  },
  uan: { hasPreviousPf: false, verifiedStatus: {}, salarySlip: null },
  esi: { hasEsi: false, verifiedStatus: {} },
  gmc: {
    isOptedIn: null,
    selectedSpouseId: '',
    selectedChildIds: [],
    gmcPolicyCopy: null,
    declarationAccepted: false,
  },
  organization: {
    designation: '',
    department: '',
    reportingManager: '',
    organizationId: '',
    organizationName: '',
    joiningDate: '',
    workType: '',
    defaultSalary: null,
  },
  uniforms: [],
  biometrics: {
    signatureImage: null,
    fingerprints: {
      leftHand: null,
      rightHand: null,
    }
  },
  salaryChangeRequest: null,
  requiresManualVerification: false,
  formsGenerated: false,
});

export const useOnboardingStore = create<OnboardingState>()((set) => ({
      data: getInitialState(),
      setData: (data) => set({ data }),
      updatePersonal: (personal) => set((state) => ({ data: { ...state.data, personal: { ...state.data.personal, ...personal } } })),
      setPersonalVerifiedStatus: (status) => set((state) => ({ data: { ...state.data, personal: { ...state.data.personal, verifiedStatus: { ...state.data.personal.verifiedStatus, ...status } } } })),
      updateAddress: (address) => set((state) => ({ data: { ...state.data, address: { ...state.data.address, ...address } } })),
      setAddressVerifiedStatus: (type, status) => set((state) => ({
        data: {
            ...state.data,
            address: {
                ...state.data.address,
                [type]: {
                    ...state.data.address[type],
                    verifiedStatus: {
                        ...state.data.address[type].verifiedStatus,
                        ...status,
                    },
                },
            },
        },
      })),
      updateFamily: (family) => set((state) => ({ data: { ...state.data, family } })),
      updateEducation: (education) => set((state) => ({ data: { ...state.data, education } })),
      updateBank: (bank) => set((state) => ({ data: { ...state.data, bank: { ...state.data.bank, ...bank } } })),
      setBankVerifiedStatus: (status) => set((state) => ({ data: { ...state.data, bank: { ...state.data.bank, verifiedStatus: { ...state.data.bank.verifiedStatus, ...status } } } })),
      updateUan: (uan) => set((state) => ({ data: { ...state.data, uan: { ...state.data.uan, ...uan } } })),
      setUanVerifiedStatus: (status) => set((state) => ({ data: { ...state.data, uan: { ...state.data.uan, verifiedStatus: { ...state.data.uan.verifiedStatus, ...status } } } })),
      updateEsi: (esi) => set((state) => ({ data: { ...state.data, esi: { ...state.data.esi, ...esi } } })),
      setEsiVerifiedStatus: (status) => set((state) => ({ data: { ...state.data, esi: { ...state.data.esi, verifiedStatus: { ...state.data.esi.verifiedStatus, ...status } } } })),
      updateGmc: (gmc) => set((state) => ({ data: { ...state.data, gmc: { ...state.data.gmc, ...gmc } } })),
      updateOrganization: (org) => set((state) => ({ data: { ...state.data, organization: { ...state.data.organization, ...org } } })),
      updateUniforms: (uniforms) => set((state) => ({ data: { ...state.data, uniforms } })),
      updateBiometrics: (biometrics) => set((state) => ({ data: { ...state.data, biometrics: { ...state.data.biometrics, ...biometrics } } })),
      setSalaryChangeRequest: (request) => set((state) => ({ data: { ...state.data, salaryChangeRequest: request } })),
      setRequiresManualVerification: (requires) => set((state) => ({ data: { ...state.data, requiresManualVerification: requires } })),
      setFormsGenerated: (generated) => set((state) => ({ data: { ...state.data, formsGenerated: generated } })),
      reset: () => set({ data: getInitialState() }),
      addFamilyMember: () => set((state) => ({
        data: {
          ...state.data,
          family: [...state.data.family, { id: `fam_${Date.now()}`, relation: '', name: '', dob: '', gender: '', occupation: '', dependent: false, idProof: null }]
        }
      })),
      updateFamilyMember: (id, updates) => set((state) => ({
        data: {
            ...state.data,
            family: state.data.family.map(member => member.id === id ? { ...member, ...updates } : member)
        }
      })),
      removeFamilyMember: (id) => set((state) => ({
        data: {
            ...state.data,
            family: state.data.family.filter(member => member.id !== id)
        }
      })),
      addEducationRecord: () => set((state) => ({
        data: {
          ...state.data,
          education: [...state.data.education, { id: `edu_${Date.now()}`, degree: '', institution: '', startYear: '', endYear: '' }]
        }
      })),
      updateEducationRecord: (id, updates) => set((state) => ({
        data: {
            ...state.data,
            education: state.data.education.map(record => record.id === id ? { ...record, ...updates } : record)
        }
      })),
      removeEducationRecord: (id) => set((state) => ({
        data: {
            ...state.data,
            education: state.data.education.filter(record => record.id !== id)
        }
      })),
      addOrUpdateEmergencyContactAsFamilyMember: () => set((state) => {
        const { emergencyContactName, relationship } = state.data.personal;
        
        if (!emergencyContactName || !relationship) return state;
    
        const relationMap: Record<PersonalDetails['relationship'], FamilyMember['relation'] | null> = {
            'Spouse': 'Spouse', 'Child': 'Child', 'Father': 'Father', 'Mother': 'Mother',
            'Sibling': null, 'Other': null, '': null,
        };
        const mappedRelation = relationMap[relationship];
        if (!mappedRelation) return state;
    
        const isAlreadyFamilyMember = state.data.family.some(
            m => m.name.toLowerCase() === emergencyContactName.toLowerCase() && m.relation === mappedRelation
        );
    
        if (isAlreadyFamilyMember) return state;
    
        const newMember: FamilyMember = {
            id: `fam_emg_${Date.now()}`,
            relation: mappedRelation,
            name: emergencyContactName,
            dob: '',
            gender: '',
            occupation: '',
            dependent: false,
            idProof: null,
        };
    
        return { data: { ...state.data, family: [...state.data.family, newMember] } };
    }),
    })
);