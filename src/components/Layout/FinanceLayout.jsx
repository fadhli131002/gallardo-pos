import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Wallet, FileText, Receipt, PieChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logoGallardo from '../../assets/logo-gallardo.png';
import logoNewRatu from '../../assets/logo-new-ratu.png';
import './FinanceLayout.css';

import { useAuth } from '../../context/AuthContext';

const FinanceLayout = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userBranch, setUserBranch] = useState('Global');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout: authLogout, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user || (user.role !== 'finance' && user.role !== 'admin' && user.role !== 'superadmin')) {
      navigate('/login');
    }
    const branch = sessionStorage.getItem('userBranch') || 'Global';
    setUserBranch(branch);
  }, [user, loading, navigate]);

  const handleLogout = () => {
    authLogout();
    navigate('/login', { state: { fromLogout: true } });
  };

  const NavText = ({ children }) => (
    <AnimatePresence>
      {isExpanded && (
        <motion.span
          className="font-mono-ui text-sm ml-3 tracking-wider whitespace-nowrap"
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 'auto' }}
          exit={{ opacity: 0, width: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  );

  return (
    <div className="layout-container animate-fade-in">
      {/* Sidebar */}
      <motion.aside 
        className="sidebar finance-sidebar"
        initial={false}
        animate={{ width: isExpanded ? '260px' : '80px' }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div className="sidebar-brand" style={{ padding: isExpanded ? '2rem 1.5rem' : '2rem 0', alignItems: 'center', justifyContent: 'center' }}>
          <img 
             src={userBranch === 'New Ratu' ? logoNewRatu : logoGallardo} 
             alt="Brand"
             style={{ 
               width: isExpanded ? '100px' : '40px', 
               height: 'auto', 
               objectFit: 'contain',
               transition: 'all 0.3s ease'
             }} 
          />
          {isExpanded && <div className="mt-2 text-xs font-mono-ui opacity-70">FINANCE DEPT</div>}
        </div>
        
        <nav className="sidebar-nav">
          <NavLink 
            to="/finance" 
            end
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{ justifyContent: isExpanded ? 'flex-start' : 'center', padding: isExpanded ? '1rem 1.25rem' : '1rem 0' }}
          >
            <LayoutDashboard size={22} style={{ flexShrink: 0 }} />
            <NavText>Dashboard Keuangan</NavText>
          </NavLink>

          <NavLink 
            to="/finance/receivables" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{ justifyContent: isExpanded ? 'flex-start' : 'center', padding: isExpanded ? '1rem 1.25rem' : '1rem 0' }}
          >
            <Wallet size={22} style={{ flexShrink: 0 }} />
            <NavText>Piutang Pelanggan</NavText>
          </NavLink>

          <NavLink 
            to="/finance/refunds" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{ justifyContent: isExpanded ? 'flex-start' : 'center', padding: isExpanded ? '1rem 1.25rem' : '1rem 0' }}
          >
            <Receipt size={22} style={{ flexShrink: 0 }} />
            <NavText>Riwayat Refund</NavText>
          </NavLink>

          <NavLink 
            to="/finance/commissions" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{ justifyContent: isExpanded ? 'flex-start' : 'center', padding: isExpanded ? '1rem 1.25rem' : '1rem 0' }}
          >
            <PieChart size={22} style={{ flexShrink: 0 }} />
            <NavText>Laporan Komisi</NavText>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button 
            onClick={handleLogout} 
            className="nav-item logout-btn w-full"
            style={{ justifyContent: isExpanded ? 'flex-start' : 'center', padding: isExpanded ? '1rem 1.25rem' : '1rem 0' }}
          >
            <LogOut size={22} style={{ flexShrink: 0 }} />
            <NavText>Sign Out</NavText>
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="main-content finance-main bg-gray-50">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="content-wrapper"
          >
            <Outlet context={{ userBranch }} />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default FinanceLayout;
