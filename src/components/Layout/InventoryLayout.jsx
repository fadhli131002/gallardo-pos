import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Package,
  MessageSquareWarning,
  History,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Wrench,
  Megaphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logoGallardo from '../../assets/logo-gallardo.png';
import logoNewRatu from '../../assets/logo-new-ratu.png';
import { useAuth } from '../../context/AuthContext';
import { useInventoryComms } from '../../pages/InventoryPortal/context/InventoryCommsContext';
import MegaphoneButton from '../MegaphoneButton';
import './InventoryLayout.css';

const InventoryLayout = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [userBranch, setUserBranch] = useState('Gallardo');
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout: authLogout, loading } = useAuth();
  const { totalUnreadCount = 0 } = useInventoryComms() || {};

  // Enforce Light Mode
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('inventory-theme');
  }, []);

  // Auth Guard verification
  useEffect(() => {
    if (loading) return;
    if (!user || (user.role !== 'inventory' && user.role !== 'admin' && user.role !== 'superadmin')) {
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
    }, 400);
  };

  const toggleSidebar = () => {
    setIsExpanded(prev => !prev);
  };

  return (
    <div className="inventory-layout-container bg-[#f8f9fa]">
        {/* Logout Transition Overlay */}
        <AnimatePresence>
          {isLoggingOut && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-50 flex items-center justify-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
              >
                <Wrench size={42} className="text-white" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar (Optimized pure CSS width transition, zero Framer Motion lag on aside) */}
        <aside
          className={`inventory-sidebar bg-white dark:bg-[#181818] border-r border-gray-200 dark:border-neutral-800 flex flex-col z-20 ${
            isExpanded ? 'w-[260px]' : 'w-[76px]'
          }`}
          onMouseEnter={() => setIsExpanded(true)}
        >
          {/* Brand Header */}
          <div className="flex items-center justify-between py-5 px-3 border-b border-gray-100 dark:border-neutral-800">
            <div className="flex flex-col items-center flex-1 overflow-hidden">
              <img
                src={userBranch === 'New Ratu' ? logoNewRatu : logoGallardo}
                alt="Brand Logo"
                className="transition-all duration-200"
                style={{
                  width: isExpanded ? '130px' : '38px',
                  height: 'auto',
                  objectFit: 'contain'
                }}
              />
              <span
                className={`text-[10px] font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase font-mono mt-1.5 transition-all duration-200 ${
                  isExpanded ? 'opacity-100 max-h-5' : 'opacity-0 max-h-0 overflow-hidden'
                }`}
              >
                Inventory & Logistics
              </span>
            </div>

            {/* Toggle button */}
            {isExpanded && (
              <button
                type="button"
                onClick={toggleSidebar}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors"
                title="Ciutkan Sidebar"
              >
                <PanelLeftClose size={17} />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 py-4 px-2.5 space-y-1.5 overflow-y-auto">
            <div
              className={`px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 font-mono transition-all duration-200 ${
                isExpanded ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden mb-0'
              }`}
            >
              Workspace Gudang
            </div>

            {/* Nav 1: Master Stok */}
            <NavLink
              to="/inventory-portal/dashboard"
              className={({ isActive }) =>
                `inventory-nav-item flex items-center px-3 py-2.5 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
                }`
              }
              title="Dashboard Master Stok"
            >
              <Package size={20} className="flex-shrink-0" />
              <span
                className={`text-xs font-semibold tracking-wide ml-3 whitespace-nowrap transition-all duration-150 ${
                  isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0 overflow-hidden ml-0'
                }`}
              >
                Master Stok Gudang
              </span>
            </NavLink>

            {/* Nav 2: Discrepancy Comms */}
            <NavLink
              to="/inventory-portal/comms"
              className={({ isActive }) =>
                `inventory-nav-item flex items-center px-3 py-2.5 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-sm font-bold'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-neutral-800'
                }`
              }
              title="Stock Discrepancy Comms"
            >
              <div className="relative flex items-center">
                <MessageSquareWarning size={20} className="flex-shrink-0" />
                {totalUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
                )}
              </div>
              <span
                className={`text-xs font-semibold tracking-wide ml-3 whitespace-nowrap transition-all duration-150 ${
                  isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0 overflow-hidden ml-0'
                }`}
              >
                Discrepancy Comms
              </span>
              {totalUnreadCount > 0 && isExpanded && (
                <span className="ml-auto text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-500 text-white shadow-sm animate-pulse">
                  {totalUnreadCount}
                </span>
              )}
            </NavLink>

            {/* Nav 3: Mutasi & Riwayat */}
            <NavLink
              to="/inventory-portal/logs"
              className={({ isActive }) =>
                `inventory-nav-item flex items-center px-3 py-2.5 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
                }`
              }
              title="Mutasi & Riwayat Stok"
            >
              <History size={20} className="flex-shrink-0" />
              <span
                className={`text-xs font-semibold tracking-wide ml-3 whitespace-nowrap transition-all duration-150 ${
                  isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0 overflow-hidden ml-0'
                }`}
              >
                Mutasi & Riwayat
              </span>
            </NavLink>

            {/* Nav 4: What's New (Update) */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('open-release-notes'))}
              className="inventory-nav-item flex items-center px-3 py-2.5 rounded-xl transition-colors text-indigo-600 hover:bg-indigo-50 w-full text-left"
              title="Catatan Rilis & Fitur Baru (What's New)"
            >
              <Megaphone size={20} className="flex-shrink-0 text-indigo-600" />
              <span
                className={`text-xs font-bold tracking-wide ml-3 whitespace-nowrap transition-all duration-150 text-indigo-600 ${
                  isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0 overflow-hidden ml-0'
                }`}
              >
                What's New (Update)
              </span>
            </button>
          </nav>

          {/* User Profile Footer */}
          <div className="p-3 border-t border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs flex-shrink-0 border border-indigo-200">
                {user?.name ? user.name[0].toUpperCase() : 'M'}
              </div>
              <div
                className={`flex flex-col min-w-0 overflow-hidden transition-all duration-150 ${
                  isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'
                }`}
              >
                <span className="text-xs font-bold text-gray-900 truncate">
                  {user?.name || 'Mba Umi'}
                </span>
                <span className="text-[10px] text-gray-400 capitalize">
                  {user?.role || 'inventory'} &bull; {userBranch}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="text-gray-400 hover:text-rose-500 p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
              title="Keluar / Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="inventory-main-content">
          {/* Header Bar */}
          <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-gray-100 text-gray-600">
                LOKASI: GUDANG {userBranch.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <MegaphoneButton showLabel={true} />
              <span className="text-xs text-gray-400 font-mono hidden md:inline">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
              </span>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="Sistem Gudang Online"></div>
            </div>
          </header>

          {/* Scrollable Subpage Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-[1550px] mx-auto w-full">
              <Outlet context={{ userBranch }} />
            </div>
          </div>
        </main>
      </div>
  );
};

export default InventoryLayout;
