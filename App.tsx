
import React, { useEffect } from 'react';
// FIX: Corrected named imports from react-router-dom to resolve module export errors.
import * as ReactRouterDOM from 'react-router-dom';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import UpdatePassword from './pages/auth/UpdatePassword';
import MainLayout from './components/layouts/MainLayout';
import AuthLayout from './components/layouts/AuthLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuthStore } from './store/authStore';
import UserManagement from './pages/admin/UserManagement';
// FIX: Changed to a named import for ApiSettings to resolve module export error.
import { ApiSettings } from './pages/developer/ApiSettings';
import OperationsDashboard from './pages/operations/OperationsDashboard';
import SiteDashboard from './pages/site/OrganizationDashboard';
import Forbidden from './pages/Forbidden';
import { Loader2 } from 'lucide-react';
import Splash from './pages/Splash';
import AddEmployee from './pages/onboarding/AddEmployee';
import OnboardingHome from './pages/OnboardingHome';
import PersonalDetails from './pages/onboarding/PersonalDetails';
import AddressDetails from './pages/onboarding/AddressDetails';
import FamilyDetails from './pages/onboarding/FamilyDetails';
import EducationDetails from './pages/onboarding/EducationDetails';
import BankDetails from './pages/onboarding/BankDetails';
import UanDetails from './pages/onboarding/UanDetails';
import EsiDetails from './pages/onboarding/EsiDetails';
import GmcDetails from './pages/onboarding/GmcDetails';
import OrganizationDetails from './pages/onboarding/OrganizationDetails';
import Documents from './pages/onboarding/Documents';
import Biometrics from './pages/onboarding/Biometrics';
import Review from './pages/onboarding/Review';
import VerificationDashboard from './pages/verification/VerificationDashboard';
import OnboardingPdfOutput from './pages/onboarding/OnboardingPdfOutput';
import SiteManagement from './pages/admin/OrganizationManagement';
import EntityManagement from './pages/hr/EntityManagement';
import RoleManagement from './pages/admin/RoleManagement';
import ProfilePage from './pages/profile/ProfilePage';
import AttendanceDashboard from './pages/attendance/AttendanceDashboard';
import AttendanceSettings from './pages/hr/AttendanceSettings';
import LeaveDashboard from './pages/leaves/LeaveDashboard';
import LeaveManagement from './pages/hr/LeaveManagement';
import ApprovalWorkflow from './pages/admin/ApprovalWorkflow';
import TaskManagement from './pages/tasks/TaskManagement';
import PoliciesAndInsurance from './pages/hr/PoliciesAndInsurance';
import SelectOrganization from './pages/onboarding/SelectOrganization';
import EnrollmentRules from './pages/hr/EnrollmentRules';
import UniformDashboard from './pages/uniforms/UniformDashboard';
import UniformDetails from './pages/onboarding/UniformDetails';
import InvoiceSummary from './pages/billing/InvoiceSummary';
import PreUpload from './pages/onboarding/PreUpload';
import MySubmissions from './pages/onboarding/MySubmissions';
import UniformRequests from './pages/onboarding/UniformRequests';
import Tasks from './pages/onboarding/MyTasks';
import FieldOfficerTracking from './pages/hr/FieldOfficerTracking';

const App: React.FC = () => {
  const { user, isInitialized, init } = useAuthStore();
  const checkAttendanceStatus = useAuthStore((state) => state.checkAttendanceStatus);
  
  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (user) {
      checkAttendanceStatus();
    }
  }, [user, checkAttendanceStatus]);

  const getHomeRoute = () => {
      if (!user) return "/auth/login";
      // This can be simplified or made permission-based in the future,
      // but for now, it directs users to a sensible default page for their role.
      switch (user.role) {
          case 'admin': return "/verification/dashboard";
          case 'hr': return "/hr/entities";
          case 'developer': return "/developer/api";
          case 'operation_manager': return "/operations/dashboard";
          case 'site_manager': return "/site/dashboard";
          case 'field_officer': return "/onboarding";
          default: return "/auth/login";
      }
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <Loader2 className="h-12 w-12 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <ReactRouterDOM.HashRouter>
      <ReactRouterDOM.Routes>
        <ReactRouterDOM.Route path="/" element={<Splash />} />
        <ReactRouterDOM.Route element={<AuthLayout />}>
            <ReactRouterDOM.Route path="/auth/login" element={<Login />} />
            <ReactRouterDOM.Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <ReactRouterDOM.Route path="/auth/update-password" element={<UpdatePassword />} />
        </ReactRouterDOM.Route>
        
        <ReactRouterDOM.Route path="/forbidden" element={<Forbidden />} />

        <ReactRouterDOM.Route element={<MainLayout />}>
          <ReactRouterDOM.Route path="/profile" element={<ProfilePage />} />
          <ReactRouterDOM.Route element={<ProtectedRoute requiredPermission="manage_users" />}>
            <ReactRouterDOM.Route path="/admin/users" element={<UserManagement />} />
          </ReactRouterDOM.Route>
          <ReactRouterDOM.Route element={<ProtectedRoute requiredPermission="manage_sites" />}>
            <ReactRouterDOM.Route path="/admin/sites" element={<SiteManagement />} />
          </ReactRouterDOM.Route>
          <ReactRouterDOM.Route element={<ProtectedRoute requiredPermission="manage_roles_and_permissions" />}>
            <ReactRouterDOM.Route path="/admin/roles" element={<RoleManagement />} />
          </ReactRouterDOM.Route>
          <ReactRouterDOM.Route element={<ProtectedRoute requiredPermission="manage_approval_workflow" />}>
            <ReactRouterDOM.Route path="/admin/approval-workflow" element={<ApprovalWorkflow />} />
          </ReactRouterDOM.Route>
          <ReactRouterDOM.Route element={<ProtectedRoute requiredPermission="view_all_submissions" />}>
            <ReactRouterDOM.Route path="/verification/dashboard" element={<VerificationDashboard />} />
          </ReactRouterDOM.Route>
          <ReactRouterDOM.Route element={<ProtectedRoute requiredPermission="view_entity_management" />}>
            <ReactRouterDOM.Route path="/hr/entities" element={<EntityManagement />} />
          </ReactRouterDOM.Route>
           <ReactRouterDOM.Route element={<ProtectedRoute requiredPermission="manage_attendance_rules" />}>
            <ReactRouterDOM.Route path="/hr/attendance-settings" element={<AttendanceSettings />} />
          </ReactRouterDOM.Route>
           <ReactRouterDOM.Route element={<ProtectedRoute requiredPermission="manage_leave_requests" />}>
            <ReactRouterDOM.Route path="/hr/leave-management" element={<LeaveManagement />} />
          </ReactRouterDOM.Route>
          <ReactRouterDOM.Route element={<ProtectedRoute requiredPermission="manage_insurance" />}>
            <ReactRouterDOM.Route path="/hr/policies-and-insurance" element={<PoliciesAndInsurance />} />
          </ReactRouterDOM.Route>
          <ReactRouterDOM.Route element={<ProtectedRoute requiredPermission="manage_enrollment_rules" />}>
            <ReactRouterDOM.Route path="/hr/enrollment-rules" element={<EnrollmentRules />} />
          </ReactRouterDOM.Route>
          <ReactRouterDOM.Route element={<ProtectedRoute requiredPermission="manage_tasks" />}>
            <ReactRouterDOM.Route path="/tasks" element={<TaskManagement />} />
          </ReactRouterDOM.Route>
          <ReactRouterDOM.Route element={<ProtectedRoute requiredPermission="manage_uniforms" />}>
            <ReactRouterDOM.Route path="/uniforms" element={<UniformDashboard />} />
          </ReactRouterDOM.Route>
          <ReactRouterDOM.Route element={<ProtectedRoute requiredPermission="view_invoice_summary" />}>
            <ReactRouterDOM.Route path="/billing/summary" element={<InvoiceSummary />} />
          </ReactRouterDOM.Route>
           <ReactRouterDOM.Route element={<ProtectedRoute requiredPermission="view_field_officer_tracking" />}>
            <ReactRouterDOM.Route path="/hr/field-officer-tracking" element={<FieldOfficerTracking />} />
          </ReactRouterDOM.Route>
          <ReactRouterDOM.Route element={<ProtectedRoute requiredPermission="view_developer_settings" />}>
            <ReactRouterDOM.Route path="/developer/api" element={<ApiSettings />} />
          </ReactRouterDOM.Route>
          <ReactRouterDOM.Route element={<ProtectedRoute requiredPermission="view_operations_dashboard" />}>
            <ReactRouterDOM.Route path="/operations/dashboard" element={<OperationsDashboard />} />
          </ReactRouterDOM.Route>
          <ReactRouterDOM.Route element={<ProtectedRoute requiredPermission="view_site_dashboard" />}>
            <ReactRouterDOM.Route path="/site/dashboard" element={<SiteDashboard />} />
          </ReactRouterDOM.Route>
          <ReactRouterDOM.Route element={<ProtectedRoute requiredPermission="view_own_attendance" />}>
            <ReactRouterDOM.Route path="/attendance/dashboard" element={<AttendanceDashboard />} />
          </ReactRouterDOM.Route>
          <ReactRouterDOM.Route element={<ProtectedRoute requiredPermission="apply_for_leave" />}>
            <ReactRouterDOM.Route path="/leaves/dashboard" element={<LeaveDashboard />} />
          </ReactRouterDOM.Route>
          <ReactRouterDOM.Route element={<ProtectedRoute requiredPermission="create_enrollment" />}>
            <ReactRouterDOM.Route path="/onboarding" element={<OnboardingHome />} />
            <ReactRouterDOM.Route path="/onboarding/select-organization" element={<SelectOrganization />} />
            <ReactRouterDOM.Route path="/onboarding/pre-upload" element={<PreUpload />} />
            <ReactRouterDOM.Route path="/onboarding/submissions" element={<MySubmissions />} />
            <ReactRouterDOM.Route path="/onboarding/uniforms" element={<UniformRequests />} />
            <ReactRouterDOM.Route path="/onboarding/tasks" element={<Tasks />} />
            <ReactRouterDOM.Route path="/onboarding/add" element={<AddEmployee />}>
              <ReactRouterDOM.Route path="personal" element={<PersonalDetails />} />
              <ReactRouterDOM.Route path="address" element={<AddressDetails />} />
              <ReactRouterDOM.Route path="family" element={<FamilyDetails />} />
              <ReactRouterDOM.Route path="education" element={<EducationDetails />} />
              <ReactRouterDOM.Route path="bank" element={<BankDetails />} />
              <ReactRouterDOM.Route path="uan" element={<UanDetails />} />
              <ReactRouterDOM.Route path="esi" element={<EsiDetails />} />
              <ReactRouterDOM.Route path="gmc" element={<GmcDetails />} />
              <ReactRouterDOM.Route path="organization" element={<OrganizationDetails />} />
              <ReactRouterDOM.Route path="uniform" element={<UniformDetails />} />
              <ReactRouterDOM.Route path="documents" element={<Documents />} />
              <ReactRouterDOM.Route path="biometrics" element={<Biometrics />} />
              <ReactRouterDOM.Route path="review" element={<Review />} />
              <ReactRouterDOM.Route index element={<ReactRouterDOM.Navigate to="personal" replace />} />
            </ReactRouterDOM.Route>
          </ReactRouterDOM.Route>
           
           {/* PDF generation route */}
           <ReactRouterDOM.Route path="/onboarding/pdf/:id" element={<OnboardingPdfOutput />} />
        </ReactRouterDOM.Route>
        
        <ReactRouterDOM.Route path="*" element={<ReactRouterDOM.Navigate to={getHomeRoute()} />} />
      </ReactRouterDOM.Routes>
    </ReactRouterDOM.HashRouter>
  );
};

// FIX: Added default export for the App component.
export default App;