import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Calendar from './pages/Calendar/Calendar';
import POS from './pages/POS/POS';
import Customers from './pages/Customers/Customers';
import POSRetail from './pages/POS/POSRetail';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import VehicleMaster from './pages/Admin/VehicleMaster';
import AdminCustomerWarranty from './pages/Admin/AdminCustomerWarranty';
import AdminScheduling from './pages/Admin/AdminScheduling';
import AdminSalesPerformance from './pages/Admin/AdminSalesPerformance';
import AdminInventory from './pages/Admin/AdminInventory';
import CustomerRanking from './pages/Admin/CustomerRanking';
import Complaints from './pages/Admin/Complaints';
import OwnerDashboard from './pages/Admin/OwnerDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import InvoicePrintPage from './pages/InvoicePrintPage';
import PublicInvoicePage from './pages/PublicInvoicePage';
import PublicWarrantyPage from './pages/PublicWarrantyPage';
import AdminMonthlyReport from './pages/Admin/AdminMonthlyReport';

import FinanceLayout from './components/Layout/FinanceLayout';
import OwnerLayout from './components/Layout/OwnerLayout';
import FinanceDashboard from './pages/Finance/FinanceDashboard';
import FinanceReceivables from './pages/Finance/FinanceReceivables';
import FinanceRefunds from './pages/Finance/FinanceRefunds';
import FinanceCommissions from './pages/Finance/FinanceCommissions';
import FinanceHpp from './pages/Finance/FinanceHpp';

import { Toaster } from 'sonner';

import { useAuth } from './context/AuthContext';

// Entry point helper for '/'
const DashboardEntry = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#f9fafb' }}>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>Memverifikasi Sesi Auth...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const userRole = user.role || 'sales';

  if (userRole === 'admin' || userRole === 'superadmin') {
    return <Navigate to="/admin/workspace" replace />;
  } else if (userRole === 'owner') {
    return <Navigate to="/owner-portal/dashboard" replace />;
  } else if (userRole === 'finance') {
    return <Navigate to="/finance/dashboard" replace />;
  }
  return <Navigate to="/sales/dashboard" replace />;
};

function App() {
  return (
    <Router>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<DashboardEntry />} />
        
        {/* Public Routes */}
        <Route path="/public/invoice/:transactionId" element={<PublicInvoicePage />} />
        <Route path="/public/warranty/:transactionId" element={<PublicWarrantyPage />} />
        
        {/* Dedicated Print Route (No Layout/Sidebar) */}
        <Route element={<ProtectedRoute allowedRoles={['sales', 'admin', 'superadmin', 'finance']} />}>
          <Route path="/sales/invoices/print/:transactionId" element={<InvoicePrintPage />} />
        </Route>

        {/* Sales Namespace Routes */}
        <Route element={<ProtectedRoute allowedRoles={['sales', 'admin', 'superadmin']} />}>
          <Route path="/sales" element={<Layout />}>
            <Route index element={<Navigate to="/sales/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="pos" element={<POS />} />
            <Route path="pos-retail" element={<POSRetail />} />
            <Route path="customers" element={<AdminCustomerWarranty />} />
            <Route path="complaints" element={<Complaints />} />
          </Route>
        </Route>

        {/* Admin Namespace Routes */}
        <Route element={<ProtectedRoute allowedRoles={['admin', 'superadmin']} />}>
          <Route path="/admin" element={<Layout />}>
            <Route index element={<Navigate to="/admin/workspace" replace />} />
            <Route path="workspace" element={<AdminDashboard />} />
            <Route path="pos-retail" element={<POSRetail />} />
            <Route path="scheduling" element={<AdminScheduling />} />
            <Route path="calendar" element={<AdminScheduling />} />
            <Route path="sales-performance" element={<AdminSalesPerformance />} />
            <Route path="vehicle-master" element={<VehicleMaster />} />
            <Route path="customer-warranty" element={<AdminCustomerWarranty />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="customer-ranking" element={<CustomerRanking />} />
            <Route path="complaints" element={<Complaints />} />
            <Route path="monthly-report" element={<AdminMonthlyReport />} />
          </Route>
        </Route>

        {/* Finance Workspace Routes */}
        <Route element={<ProtectedRoute allowedRoles={['finance', 'admin', 'superadmin']} />}>
          <Route path="/finance" element={<FinanceLayout />}>
            <Route index element={<Navigate to="/finance/dashboard" replace />} />
            <Route path="dashboard" element={<FinanceDashboard />} />
            <Route path="receivables" element={<FinanceReceivables />} />
            <Route path="refunds" element={<FinanceRefunds />} />
            <Route path="commissions" element={<FinanceCommissions />} />
            <Route path="hpp" element={<FinanceHpp />} />
          </Route>
        </Route>

        {/* Owner Portal Routes */}
        <Route element={<ProtectedRoute allowedRoles={['owner', 'superadmin']} />}>
          <Route path="/owner-portal" element={<OwnerLayout />}>
            <Route index element={<Navigate to="/owner-portal/dashboard" replace />} />
            <Route path="dashboard" element={<OwnerDashboard />} />
          </Route>
        </Route>


        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
