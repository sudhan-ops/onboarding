import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { EnrollmentRules } from '../types';

interface EnrollmentRulesState extends EnrollmentRules {
  updateRules: (settings: Partial<EnrollmentRules>) => void;
}

const initialRules: EnrollmentRules = {
  esiCtcThreshold: 21000,
  enforceManpowerLimit: true,
  manpowerLimitRule: 'warn',
  allowSalaryEdit: true,
  salaryThreshold: 21000,
  defaultPolicySingle: '1L',
  defaultPolicyMarried: '2L',
  enableEsiRule: true,
  enableGmcRule: true,
  enforceFamilyValidation: true,
  rulesByDesignation: {
    'Administrator': {
      documents: {
        aadhaar: true,
        pan: true,
        bankProof: true,
        educationCertificate: true,
        salarySlip: true,
        uanProof: true,
        familyAadhaar: true,
      },
      verifications: {
        requireBengaluruAddress: true,
        requireDobVerification: true,
      }
    }
  }
};

export const useEnrollmentRulesStore = create<EnrollmentRulesState>()(
  persist(
    (set) => ({
      ...initialRules,
      updateRules: (settings) => set((state) => ({ ...state, ...settings })),
    }),
    {
      name: 'paradigm_enrollment_rules',
      storage: createJSONStorage(() => localStorage),
    }
  )
);