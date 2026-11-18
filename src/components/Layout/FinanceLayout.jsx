import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  LogOut,
  Wallet,
  Receipt,
  PieChart,
  ShieldCheck,
  Wrench,
  Megaphone
} from '@/icons/itshover';
import { motion, AnimatePresence } from 'framer-motion';
import logoGallardo from '../../assets/logo-gallardo.png';
import logoNewRatu from '../../assets/logo-new-ratu.png';
import { useAuth } from '../../context/AuthContext';
import PWAInstallNavItem from '../PWAInstallNavItem';
import './Layout.css';

const FinanceLayout = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [userBranch, setUserBranch] = useState('Gallardo');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const { user, logout: authLogout, loading } = useAuth();

  // Pastikan selalu Light Mode seragam dengan Admin & Inventory
  useEffect(() => {
    document.documentElement.classList.remove('dark-theme', 'dark');
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user || (user.role !== 'finance' && user.role !== 'admin' && user.role !== 'superadmin')) {
      navigate('/login');
    }
    const branch = sessionStorage.getItem('userBranch') || 'Gallardo';
    setUserBranch(branch);
  }, [user, loading, navigate]);

  const handleLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      authLogout();
      navigate('/login', { state: { fromLogout: true } });
    }, 500);
  };

  const NavText = ({ children, className = 'font-sans font-medium' }) => (
    <motion.span
      initial={false}
      animate={{
        opacity: isExpanded ? 1 : 0,
        width: isExpanded ? 'auto' : 0,
        marginLeft: isExpanded ? 16 : 0
      }}
      style={{
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        display: 'block',
        minWidth: isExpanded ? 'max-content' : '0'
      }}
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
              transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
            >
              <Wrench size={48} color="#ffffff" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar identik dengan Layout.jsx (Admin/Sales) & InventoryLayout.jsx */}
      <motion.aside
        className="sidebar print:hidden"
        initial={false}
        animate={{ width: isExpanded ? 320 : 80 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div
          className="sidebar-brand"
          style={{
            padding: isExpanded ? '2rem 1.5rem' : '2rem 0',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
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
          <motion.span
            className="font-sans text-xs text-secondary px-4 mb-2 block font-semibold tracking-wider"
            style={{
              marginTop: '0.5rem',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textAlign: isExpanded ? 'left' : 'center'
            }}
            initial={false}
            animate={{ opacity: isExpanded ? 1 : 0, height: isExpanded ? 'auto' : 0 }}
          >
            WORKSPACE FINANCE
          </motion.span>

          <NavLink
            to="/finance"
            end
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{
              justifyContent: isExpanded ? 'flex-start' : 'center',
              padding: isExpanded ? '1rem 1.25rem' : '1rem 0'
            }}
          >
            <LayoutDashboard size={22} style={{ flexShrink: 0 }} />
            <NavText>Dashboard Keuangan</NavText>
          </NavLink>

          <NavLink
            to="/finance/receivables"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{
              justifyContent: isExpanded ? 'flex-start' : 'center',
              padding: isExpanded ? '1rem 1.25rem' : '1rem 0'
            }}
          >
            <Wallet size={22} style={{ flexShrink: 0 }} />
            <NavText>Piutang Pelanggan</NavText>
          </NavLink>

          <NavLink
            to="/finance/refunds"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{
              justifyContent: isExpanded ? 'flex-start' : 'center',
              padding: isExpanded ? '1rem 1.25rem' : '1rem 0'
            }}
          >
            <Receipt size={22} style={{ flexShrink: 0 }} />
            <NavText>Riwayat Refund</NavText>
          </NavLink>

          <NavLink
            to="/finance/commissions"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{
              justifyContent: isExpanded ? 'flex-start' : 'center',
              padding: isExpanded ? '1rem 1.25rem' : '1rem 0'
            }}
          >
            <PieChart size={22} style={{ flexShrink: 0 }} />
            <NavText>Laporan Komisi</NavText>
          </NavLink>

          <NavLink
            to="/finance/hpp"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{
              justifyContent: isExpanded ? 'flex-start' : 'center',
              padding: isExpanded ? '1rem 1.25rem' : '1rem 0'
            }}
          >
            <ShieldCheck size={22} style={{ flexShrink: 0 }} />
            <NavText>Harga Modal (HPP)</NavText>
          </NavLink>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('open-release-notes'))}
            className="nav-item"
            style={{
              background: 'none',
              border: 'none',
              width: '100%',
              cursor: 'pointer',
              justifyContent: isExpanded ? 'flex-start' : 'center',
              padding: isExpanded ? '1rem 1.25rem' : '1rem 0',
              color: '#6366f1'
            }}
          >
            <Megaphone size={22} style={{ flexShrink: 0 }} />
            <NavText className="font-sans font-bold text-indigo-600">What's New (Update)</NavText>
          </button>
        </nav>

        <div className="sidebar-footer">
          <PWAInstallNavItem isExpanded={isExpanded} NavText={NavText} />
          <button
            className="nav-item logout-btn"
            onClick={handleLogout}
            style={{
              justifyContent: isExpanded ? 'flex-start' : 'center',
              padding: isExpanded ? '1rem 1.25rem' : '1rem 0'
            }}
          >
            <LogOut size={22} style={{ flexShrink: 0 }} />
            <NavText>Logout</NavText>
          </button>
        </div>
      </motion.aside>

      <main className="main-content bg-secondary">
        <div className="content-wrapper">
          <Outlet context={{ userBranch }} />
        </div>
      </main>
    </div>
  );
};

export default FinanceLayout;
