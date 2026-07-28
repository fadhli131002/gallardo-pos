import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { PieChart, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logoGallardo from '../../assets/logo-gallardo.png';
import logoNewRatu from '../../assets/logo-new-ratu.png';
import './Layout.css'; // Reusing Layout CSS for consistency

import { useAuth } from '../../context/AuthContext';

const OwnerLayout = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userBranch, setUserBranch] = useState('Global');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  const { user, logout: authLogout, loading } = useAuth();

  useEffect(() => {
    const savedTheme = localStorage.getItem('owner-theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
    
    const handleThemeChange = () => {
      setIsDarkMode(localStorage.getItem('owner-theme') === 'dark');
    };
    
    window.addEventListener('themeChanged', handleThemeChange);
    return () => window.removeEventListener('themeChanged', handleThemeChange);
  }, []);

  useEffect(() => {
    if (loading) return;
    // Strict role checking: 'owner' or 'superadmin' allowed
    if (!user || (user.role !== 'owner' && user.role !== 'superadmin')) {
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
    <div className={`layout-container animate-fade-in ${isDarkMode ? 'owner-dark-layout' : ''}`}>
      {/* Sidebar */}
      <motion.aside 
        className="sidebar"
        initial={false}
        animate={{ width: isExpanded ? '260px' : '80px' }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div className="sidebar-brand" style={{ padding: isExpanded ? '2rem 1.5rem' : '2rem 0', alignItems: 'center', justifyContent: 'center' }}>
          <img 
             className="brand-logo"
             src={userBranch === 'New Ratu' ? logoNewRatu : logoGallardo} 
             alt="Brand"
             style={{ 
               width: isExpanded ? '160px' : '40px', 
               height: isExpanded ? 'auto' : '40px', 
               objectFit: 'contain',
               transition: 'all 0.3s ease'
             }} 
          />
        </div>
        
        <nav className="sidebar-nav">
          <motion.span 
            className="font-sans text-xs text-secondary px-4 mb-2 block font-semibold tracking-wider" 
            style={{ marginTop: '0.5rem', overflow: 'hidden', whiteSpace: 'nowrap', textAlign: isExpanded ? 'left' : 'center', color: '#10b981' }}
            initial={false}
            animate={{ opacity: isExpanded ? 1 : 0, height: isExpanded ? 'auto' : 0 }}
          >
            OWNER PORTAL
          </motion.span>

          <NavLink 
            to="/owner-portal/dashboard" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{ justifyContent: isExpanded ? 'flex-start' : 'center', padding: isExpanded ? '1rem 1.25rem' : '1rem 0' }}
          >
            <PieChart size={22} style={{ flexShrink: 0 }} />
            <NavText>Dashboard Owner</NavText>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={handleLogout} style={{ justifyContent: isExpanded ? 'flex-start' : 'center', padding: isExpanded ? '1rem 1.25rem' : '1rem 0' }}>
            <LogOut size={22} style={{ flexShrink: 0 }} />
            <NavText>Logout</NavText>
          </button>
        </div>
      </motion.aside>

      <main className={`main-content ${isDarkMode ? '' : 'bg-secondary'}`}>
        <div className="content-wrapper">
          <Outlet context={{ userRole: user?.role, userBranch }} />
        </div>
      </main>
    </div>
  );
};

export default OwnerLayout;
