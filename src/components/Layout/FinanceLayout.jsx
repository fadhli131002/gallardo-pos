import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, Wallet, FileText, Receipt, PieChart, Search, Bell, Calendar, Settings, Sun, Moon, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logoGallardo from '../../assets/logo-gallardo.png';
import logoNewRatu from '../../assets/logo-new-ratu.png';
import './FinanceLayout.css';

import { useAuth } from '../../context/AuthContext';

const FinanceLayout = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userBranch, setUserBranch] = useState('Global');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout: authLogout, loading } = useAuth();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  }, [isDarkMode]);

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
          className="font-mono-ui text-[14px] ml-4 tracking-wide whitespace-nowrap"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
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
        className={`sidebar finance-sidebar flex flex-col ${!isExpanded ? 'collapsed' : ''}`}
        initial={false}
        animate={{ width: isExpanded ? '280px' : '80px' }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div className="flex flex-col items-center justify-center pt-8 pb-6">
          <img 
             src={userBranch === 'New Ratu' ? logoNewRatu : logoGallardo} 
             alt="Brand"
             className="logo-invert"
             style={{ 
               width: isExpanded ? '140px' : '40px', 
               height: 'auto', 
               objectFit: 'contain',
               transition: 'all 0.3s ease'
             }} 
          />
          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 text-[12px] font-bold tracking-widest text-gray-800 uppercase"
              >
                Finance Dept
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        

        <nav className="sidebar-nav flex-1 flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-6 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 mt-2"
              >
                Menu
              </motion.div>
            )}
          </AnimatePresence>

          <NavLink to="/finance" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} className="flex-shrink-0" />
            <NavText>Dashboard Keuangan</NavText>
          </NavLink>

          <NavLink to="/finance/receivables" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Wallet size={20} className="flex-shrink-0" />
            <NavText>Piutang Pelanggan</NavText>
          </NavLink>

          <NavLink to="/finance/refunds" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Receipt size={20} className="flex-shrink-0" />
            <NavText>Riwayat Refund</NavText>
          </NavLink>

          <NavLink to="/finance/commissions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <PieChart size={20} className="flex-shrink-0" />
            <NavText>Laporan Komisi</NavText>
          </NavLink>

          <NavLink to="/finance/hpp" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <ShieldCheck size={20} className="flex-shrink-0" />
            <NavText>Harga Modal (HPP)</NavText>
          </NavLink>
        </nav>

        {/* Theme Switcher */}
        <div className="px-5 mb-4">
          <div className="bg-gray-50 rounded-full p-1 flex items-center justify-center">
            {isExpanded ? (
              <>
                <button onClick={() => setIsDarkMode(false)} className={`theme-toggle-btn flex items-center justify-center gap-2 flex-1 rounded-full py-1.5 text-sm ${!isDarkMode ? 'active text-gray-900' : 'text-gray-400'}`}>
                  <Sun size={16} />
                  Light
                </button>
                <button onClick={() => setIsDarkMode(true)} className={`theme-toggle-btn flex items-center justify-center gap-2 flex-1 rounded-full py-1.5 text-sm ${isDarkMode ? 'active text-gray-900' : 'text-gray-400'}`}>
                  <Moon size={16} />
                  Dark
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 p-1">
                <button onClick={() => setIsDarkMode(false)} className={`theme-toggle-btn flex items-center justify-center rounded-full p-1.5 ${!isDarkMode ? 'active shadow-sm bg-white' : 'text-gray-400'}`}><Sun size={18} /></button>
                <button onClick={() => setIsDarkMode(true)} className={`theme-toggle-btn flex items-center justify-center rounded-full p-1.5 ${isDarkMode ? 'active shadow-sm bg-white' : 'text-gray-400'}`}><Moon size={18} /></button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Footer */}
        <div className="px-5 pb-6 pt-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full relative shadow-sm flex-shrink-0">
              <img 
                src="https://ui-avatars.com/api/?name=Dea+Finance&background=eff6ff&color=2563eb&bold=true" 
                className="w-full h-full rounded-full object-cover" 
                alt="Profile" 
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>
            
            <AnimatePresence>
              {isExpanded && (
                <motion.div 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex flex-col whitespace-nowrap overflow-hidden"
                >
                  <p className="text-[14px] font-bold text-gray-900 leading-tight">Dea Finance</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <AnimatePresence>
            {isExpanded && (
              <motion.button 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleLogout} 
                className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg flex-shrink-0" 
                title="Keluar"
              >
                <LogOut size={18} style={{ transform: 'scaleX(-1)' }} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="main-content finance-main bg-gray-50 flex flex-col h-screen overflow-hidden">
        {/* Top Bar Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-800 hidden md:block">
              {location.pathname === '/finance' ? 'Dashboard Keuangan' : 
               location.pathname.includes('receivables') ? 'Piutang Pelanggan' :
               location.pathname.includes('refunds') ? 'Riwayat Refund' :
               location.pathname.includes('commissions') ? 'Laporan Komisi' :
               location.pathname.includes('hpp') ? 'Atur Harga Modal (HPP)' : 'Finance'}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative hidden lg:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Pencarian global..." 
                className="pl-10 pr-4 py-2 bg-gray-100/50 border border-transparent focus:border-gray-300 focus:bg-white rounded-full text-sm outline-none transition-all w-64"
              />
            </div>
            
            <button className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="content-wrapper max-w-[1600px] mx-auto w-full"
            >
              <Outlet context={{ userBranch }} />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default FinanceLayout;
