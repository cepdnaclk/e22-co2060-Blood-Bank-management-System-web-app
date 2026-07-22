import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RoleRoute from './api/RoleRoute';
import MainLayout from './components/layout/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import ScrollToTop from './components/utils/ScrollToTop';

import LandingPage from './pages/public/LandingPage';
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import DonorDashboard from './pages/donor/DonorDashboard';
import DonorEligibility from './pages/donor/DonorEligibility';
import DonorRegistration from './pages/donor/DonorRegistration';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import LabDashboard from './pages/staff/LabDashboard';
import StaffDashboard from './pages/staff/StaffDashboard';
import PatientDashboard from './pages/patient/PatientDashboard';
import DonorNotifications from './pages/donor/DonorNotifications';
import CampDashboard from './pages/bloodcamp/CampDashboard';
import ContactPage from './pages/public/ContactPage';
import Events from "./pages/events/Events";
import AboutUs from "./pages/public/AboutUs";
import Services from "./pages/public/Services";
import Unauthorized from "./pages/public/Unauthorized";
import NotFound from "./pages/public/NotFound";
import './App.css';
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import DoctorsList from "./pages/admin/DoctorsList.jsx";
import NationalInventoryDashboard from "./pages/admin/NationalInventoryDashboard.jsx";
import HospitalInventoryDetail from "./pages/admin/HospitalInventoryDetail.jsx";
import ExpiryAlertsPage from "./pages/admin/ExpiryAlertsPage.jsx";
import CampBloodTrackingPage from "./pages/admin/CampBloodTrackingPage.jsx";
import BloodRequestsPage from "./pages/admin/BloodRequestsPage.jsx";
import DonationsPage from "./pages/admin/DonationsPage.jsx";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage.jsx";
import PublicDonorScan from "./pages/donor/publicDonorScan.jsx";
import HospitalManagement from "./pages/admin/HospitalManagement.jsx";

import BloodCamps from './pages/bloodcamp/BloodCamps';

function App() {
  return (
    <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Main Layout Routes (Public + Regular Authed) */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/events" element={<Events />} />
              <Route path="/about-us" element={<AboutUs />} />
              <Route path="/services" element={<Services />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/blood-camps" element={<BloodCamps />} />
              <Route path="/donor/scan/:qrId" element={<PublicDonorScan />} />

              <Route path="/donor" element={
                <RoleRoute allowedRoles={['donor', 'admin']}>
                  <DonorDashboard />
                </RoleRoute>
              } />
              <Route path="/donor/notifications" element={
                <RoleRoute allowedRoles={['donor', 'admin']}>
                  <DonorNotifications />
                </RoleRoute>
              } />
              <Route path="/donor/eligibility" element={<DonorEligibility />} />
              <Route path="/donor/register" element={
                <RoleRoute allowedRoles={['donor', 'admin']}>
                  <DonorRegistration />
                </RoleRoute>
              } />

              <Route path="/doctor" element={
                <RoleRoute allowedRoles={['doctor', 'medical_officer', 'admin']}>
                  <DoctorDashboard />
                </RoleRoute>
              } />

              <Route path="/staff" element={
                <RoleRoute allowedRoles={['bloodcamp', 'admin']}>
                  <LabDashboard />
                </RoleRoute>
              } />

              <Route path="/inventory" element={
                <RoleRoute allowedRoles={['Inventor', 'inventor', 'admin']}>
                  <StaffDashboard />
                </RoleRoute>
              } />

              <Route path="/patient" element={
                <RoleRoute allowedRoles={['doctor', 'medical_officer', 'admin']}>
                  <PatientDashboard />
                </RoleRoute>
              } />
            </Route>

            {/* Blood Camp Organizer Route - No Main Layout as they have their own dashboard */}
            <Route path="/bloodcamp" element={
              <RoleRoute allowedRoles={['bloodcamp', 'admin']}>
                <CampDashboard />
              </RoleRoute>
            } />
            {/* Admin Routes */}
            <Route path="/admin" element={<RoleRoute allowedRoles={['admin']}><AdminLayout /></RoleRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="doctors" element={<DoctorsList />} />
              <Route path="hospitals" element={<HospitalManagement />} />
              <Route path="inventory" element={<NationalInventoryDashboard />} />
              <Route path="inventory/hospital/:hospitalId" element={<HospitalInventoryDetail />} />
              <Route path="expiry-alerts" element={<ExpiryAlertsPage />} />
              <Route path="camp-blood" element={<CampBloodTrackingPage />} />
              <Route path="requests" element={<BloodRequestsPage />} />
              <Route path="donations" element={<DonationsPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
  );
}

export default App;
