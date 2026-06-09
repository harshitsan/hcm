import { Navigate, Route, Routes } from 'react-router-dom'
import { useApp } from './app/store'
import { AppShell } from './components/shell'

import Login from './pages/Login'
import Home from './pages/Home'
import Portfolio from './pages/Portfolio'
import Profile from './pages/Profile'
import Notifications from './pages/Notifications'
import Directory from './pages/Directory'
import OrgChart from './pages/OrgChart'
import Employees from './pages/Employees'
import Assets from './pages/Assets'
import Letters from './pages/Letters'
import Leave from './pages/Leave'
import Attendance from './pages/Attendance'
import Requisitions from './pages/Requisitions'
import Candidates from './pages/Candidates'
import Interviews from './pages/Interviews'
import Onboarding from './pages/Onboarding'
import Performance from './pages/Performance'
import TransfersExit from './pages/TransfersExit'
import Announcements from './pages/Announcements'
import Feedback from './pages/Feedback'
import Policies from './pages/Policies'
import SharedPolicies from './pages/SharedPolicies'
import Documents from './pages/Documents'
import Reports from './pages/Reports'
import Companies from './pages/Companies'
import CompanySetup from './pages/CompanySetup'
import OrgData from './pages/OrgData'
import WorkflowBuilder from './pages/WorkflowBuilder'
import Roles from './pages/Roles'
import CustomFields from './pages/CustomFields'
import DataPorting from './pages/DataPorting'
import Audit from './pages/Audit'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { persona } = useApp()
  if (!persona) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/me/profile" element={<Profile />} />
        <Route path="/me/notifications" element={<Notifications />} />
        <Route path="/people/directory" element={<Directory />} />
        <Route path="/people/org-chart" element={<OrgChart />} />
        <Route path="/people/employees" element={<Employees />} />
        <Route path="/people/assets" element={<Assets />} />
        <Route path="/people/letters" element={<Letters />} />
        <Route path="/time/leave" element={<Leave />} />
        <Route path="/time/attendance" element={<Attendance />} />
        <Route path="/hiring/requisitions" element={<Requisitions />} />
        <Route path="/hiring/candidates" element={<Candidates />} />
        <Route path="/hiring/interviews" element={<Interviews />} />
        <Route path="/lifecycle/onboarding" element={<Onboarding />} />
        <Route path="/lifecycle/performance" element={<Performance />} />
        <Route path="/lifecycle/transfers-exit" element={<TransfersExit />} />
        <Route path="/comms/announcements" element={<Announcements />} />
        <Route path="/comms/feedback" element={<Feedback />} />
        <Route path="/policies" element={<Policies />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/admin/companies" element={<Companies />} />
        <Route path="/admin/company-setup" element={<CompanySetup />} />
        <Route path="/admin/shared-policies" element={<SharedPolicies />} />
        <Route path="/admin/org-data" element={<OrgData />} />
        <Route path="/admin/workflow-builder" element={<WorkflowBuilder />} />
        <Route path="/admin/roles" element={<Roles />} />
        <Route path="/admin/custom-fields" element={<CustomFields />} />
        <Route path="/admin/data" element={<DataPorting />} />
        <Route path="/admin/audit" element={<Audit />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
