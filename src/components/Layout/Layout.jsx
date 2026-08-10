import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, ShoppingCart, LogOut, Users, Shield, Car, FileCheck, CalendarClock, TrendingUp, Package, Wallet, Wrench, Store, Trophy, MessageSquareWarning, PieChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logoGallardo from '../../assets/logo-gallardo.png';
import logoNewRatu from '../../assets/logo-new-ratu.png';
import './Layout.css';

import { useAuth } from '../../context/AuthContext';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout: authLogout } = useAuth();

  const userRole = user?.role || 'sales';
  const userBranch = sessionStorage.getItem('userBranch') || 'Gallardo';

  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      authLogout();
      navigate('/login', { state: { fromLogout: true } });
    }, 500);
  };

  const NavText = ({ children, className = "font-sans font-medium" }) => (
    <motion.span
      initial={false}
      animate={{ opacity: isExpanded ? 1 : 0, width: isExpanded ? 'auto' : 0, marginLeft: isExpanded ? 16 : 0 }}
      style={{ overflow: 'hidden', whiteSpace: 'nowrap', display: 'block', minWidth: isExpanded ? 'max-content' : '0' }}
      className={className}
    >
      {children}
    </motion.span>
  );

  return (
    <div className="layout-container">
      <AnimatePresence>
        {isLoggingOut && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: '#000000',
              zIndex: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            >
              <Wrench size={48} color="#ffffff" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.aside 
        className="sidebar print:hidden"
        initial={false}
        animate={{ width: isExpanded ? 320 : 80 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div className="sidebar-brand" style={{ padding: isExpanded ? '2rem 1.5rem' : '2rem 0', alignItems: 'center', justifyContent: 'center' }}>
          <img 
             src={userBranch === 'New Ratu' ? logoNewRatu : logoGallardo} 
             alt={userBranch}
             style={{ 
               width: isExpanded ? (userBranch === 'New Ratu' ? '60px' : '140px') : '40px', 
               height: 'auto', 
               objectFit: 'contain',
               transition: 'all 0.3s ease'
             }} 
          />
        </div>
        
        <nav className="sidebar-nav">
          {userRole === 'sales' && (
            <>
              <NavLink 
                to="/sales/dashboard" 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                style={{ justifyContent: isExpanded ? 'flex-start' : 'center', padding: isExpanded ? '1rem 1.25rem' : '1rem 0' }}
              >
                <LayoutDashboard size={22} style={{ flexShrink: 0 }} />
                <NavText>Dashboard</NavText>
              </NavLink>
              
              <NavLink 
                to="/sales/calendar" 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                style={{ justifyContent: isExpanded ? 'flex-start' : 'center', padding: isExpanded ? '1rem 1.25rem' : '1rem 0' }}
              >
                <CalendarDays size={22} style={{ flexShrink: 0 }} />
                <NavText>Calendar</NavText>
              </NavLink>
              
              <NavLink 
                to="/sales/customers" 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                style={{ justifyContent: isExpanded ? 'flex-start' : 'center', padding: isExpanded ? '1rem 1.25rem' : '1rem 0' }}
              >
                <Users size={22} style={{ flexShrink: 0 }} />
                <NavText>Customers & Warranty</NavText>
              </NavLink>

              <NavLink 
                to="/sales/complaints" 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                style={{ justifyContent: isExpanded ? 'flex-start' : 'center', padding: isExpanded ? '1rem 1.25rem' : '1rem 0' }}
              >
                <MessageSquareWarning size={22} style={{ flexShrink: 0 }} />
                <NavText>Komplain / Klaim</NavText>
              </NavLink>

              <NavLink 
                to="/sales/pos" 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                style={{ justifyContent: isExpanded ? 'flex-start' : 'center', padding: isExpanded ? '1rem 1.25rem' : '1rem 0' }}
              >
                <ShoppingCart size={22} style={{ flexShrink: 0 }} />
                <NavText>POS Cashier</NavText>
              </NavLink>

            </>
          )}

          {(userRole === 'admin' || userRole === 'superadmin') && (
            <>
              <motion.span 
                className="font-sans text-xs text-secondary px-4 mb-2 block font-semibold tracking-wider" 
                style={{ marginTop: '0.5rem', overflow: 'hidden', whiteSpace: 'nowrap', textAlign: isExpanded ? 'left' : 'center' }}
                initial={false}
                animate={{ opacity: isExpanded ? 1 : 0, height: isExpanded ? 'auto' : 0 }}
              >
                ADMIN AREA
              </motion.span>

              <NavLink 
                to="/admin/workspace" 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                style={{ justifyContent: isExpanded ? 'flex-start' : 'center', padding: isExpanded ? '1rem 1.25rem' : '1rem 0' }}
              >
                <Shield size={22} style={{ flexShrink: 0 }} />
                <NavText>Admin Workspace</NavText>
              </NavLink>

              <NavLink 
                to="/admin/scheduling" 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                style={{ justifyContent: isExpanded ? 'flex-start' : 'center', padding: isExpanded ? '1rem 1.25rem' : '1rem 0' }}
              >
                <CalendarClock size={22} style={{ flexShrink: 0 }} />
                <NavText>Penjadwalan & Booking</NavText>
              </NavLink>

              <NavLink 
                to="/admin/sales-performance" 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                style={{ justifyContent: isExpanded ? 'flex-start' : 'center', padding: isExpanded ? '1rem 1.25rem' : '1rem 0' }}
              >
                <TrendingUp size={22} style={{ flexShrink: 0 }} />
                <NavText>Performa Closing Sales</NavText>
              </NavLink>

              <NavLink 
                to="/admin/monthly-report" 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                style={{ justifyContent: isExpanded ? 'flex-start' : 'center', padding: isExpanded ? '1rem 1.25rem' : '1rem 0' }}
              >
                <PieChart size={22} style={{ flexShrink: 0 }} />
                <NavText>Laporan Bulanan</NavText>
              </NavLink>

              <NavLink 
                to="/admin/vehicle-master" 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                style={{ justifyContent: isExpanded ? 'flex-start' : 'center', padding: isExpanded ? '1rem 1.25rem' : '1rem 0' }}
              >
                <Car size={22} style={{ flexShrink: 0 }} />
                <NavText>Data Master & Kategori</NavText>
              </NavLink>

              <NavLink 
                to="/admin/customer-warranty" 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                style={{ justifyContent: isExpanded ? 'flex-start' : 'center', padding: isExpanded ? '1rem 1.25rem' : '1rem 0' }}
              >
                <FileCheck size={22} style={{ flexShrink: 0 }} />
                <NavText>Customer & Garansi</NavText>
              </NavLink>

              <NavLink 
                to="/admin/complaints" 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                style={{ justifyContent: isExpanded ? 'flex-start' : 'center', padding: isExpanded ? '1rem 1.25rem' : '1rem 0' }}
              >
                <MessageSquareWarning size={22} style={{ flexShrink: 0 }} />
                <NavText>Data Komplain</NavText>
              </NavLink>

              <NavLink 
                to="/admin/customer-ranking" 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                style={{ justifyContent: isExpanded ? 'flex-start' : 'center', padding: isExpanded ? '1rem 1.25rem' : '1rem 0' }}
              >
                <Trophy size={22} style={{ flexShrink: 0 }} />
                <NavText>Leaderboard Customer</NavText>
              </NavLink>

              <NavLink 
                to="/admin/pos-retail" 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                style={{ justifyContent: isExpanded ? 'flex-start' : 'center', padding: isExpanded ? '1rem 1.25rem' : '1rem 0' }}
              >
                <Store size={22} style={{ flexShrink: 0 }} />
                <NavText>POS Retail (Grosir)</NavText>
              </NavLink>

              <NavLink 
                to="/admin/inventory" 
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                style={{ justifyContent: isExpanded ? 'flex-start' : 'center', padding: isExpanded ? '1rem 1.25rem' : '1rem 0' }}
              >
                <Package size={22} style={{ flexShrink: 0 }} />
                <NavText>Inventory & Stok</NavText>
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={handleLogout} style={{ justifyContent: isExpanded ? 'flex-start' : 'center', padding: isExpanded ? '1rem 1.25rem' : '1rem 0' }}>
            <LogOut size={22} style={{ flexShrink: 0 }} />
            <NavText>Logout</NavText>
          </button>
        </div>
      </motion.aside>

      <main className="main-content bg-secondary">
        <div className="content-wrapper">
          <Outlet context={{ userRole, userBranch }} />
        </div>
      </main>
    </div>
  );
};

export default Layout;
