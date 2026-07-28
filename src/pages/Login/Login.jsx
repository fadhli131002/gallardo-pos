import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Loader2, Wrench } from 'lucide-react';
import lamboImage from '../../assets/lambo-gray.png';
import logoGallardo from '../../assets/logo-gallardo.png';
import logoNewRatu from '../../assets/logo-new-ratu.png';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('sales');
  const [branch, setBranch] = useState('Gallardo');

  // 0: idle, 1: zooming (car shoots left), 2: loading (black screen)
  const [animationStage, setAnimationStage] = useState(0);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const location = useLocation();
  const isFromLogout = location.state?.fromLogout;

  useEffect(() => {
    sessionStorage.clear();
  }, []);

  useEffect(() => {
    if (role === 'admin' || role === 'superadmin') {
      setBranch('Gallardo');
    } else if (role === 'finance') {
      setBranch('Global');
    }
  }, [role]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsAuthenticating(true);

    try {
      const res = await fetch(window.API_URL + '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(data.error || 'Login gagal');
        setIsAuthenticating(false);
        return;
      }

      // Frontend Role Validation (Fallback in case backend is not restarted)
      if (data.data.user.role !== role) {
        const roleNames = {
          'sales': 'Sales Team',
          'finance': 'Finance / Accounting',
          'admin': 'Administrator',
          'superadmin': 'Super Administrator',
          'owner': 'Business Owner'
        };
        toast.error(`Akun ini tidak memiliki hak akses sebagai ${roleNames[role] || role}`);
        setIsAuthenticating(false);
        return;
      }

      // Success - Clear old session & store via AuthContext
      authLogin(data.data.token, data.data.user);
      sessionStorage.setItem('userBranch', (data.data.user.role === 'admin' || data.data.user.role === 'superadmin') ? 'Gallardo' : branch);

      const loggedInRole = data.data.user.role;
      setAnimationStage(1);

      // Phase 2: Fade in black loading screen after car shoots off (800ms)
      setTimeout(() => {
        setAnimationStage(2);

        setTimeout(() => {
            if (loggedInRole === 'admin' || loggedInRole === 'superadmin') {
              navigate('/admin/workspace');
            } else if (loggedInRole === 'finance') {
              navigate('/finance/dashboard');
            } else if (loggedInRole === 'owner') {
              navigate('/owner-portal/dashboard');
            } else {
              navigate('/sales/dashboard');
            }
        }, 500);

      }, 800);
    } catch (err) {
      toast.error('Gagal terhubung ke server');
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="login-container-new">

      {/* Phase 2: Loading Overlay */}
      <AnimatePresence>
        {animationStage === 2 && (
          <motion.div
            className="login-loading-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
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

      <div className="login-left-col">
        <div className="login-card-wrapper">
          <motion.div
            className="login-premium-card"
            initial={{ opacity: 0, y: isFromLogout ? 0 : 20 }}
            animate={{ opacity: animationStage === 0 ? 1 : 0, y: animationStage === 0 ? 0 : -20 }}
            transition={{ duration: 0.8 }}
            style={{ pointerEvents: animationStage === 0 ? 'auto' : 'none' }}
          >
            <div className="login-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h1>GALLARDO AUTOSPORT</h1>
              <p>Premium Automotive Protection</p>
            </div>

            <form className="login-form-new" onSubmit={handleLogin}>
              <div className="input-group">
                <label htmlFor="username">USERNAME</label>
                <input
                  type="text"
                  id="username"
                  className="modern-input"
                  placeholder="sales@gallardo.com"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="password">PASSWORD</label>
                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className="modern-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="role">LOGIN AS</label>
                <div className="select-wrapper">
                  <select
                    id="role"
                    className="modern-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="sales">Sales Team</option>
                    <option value="finance">Finance / Accounting</option>
                    <option value="admin">Administrator</option>
                    <option value="superadmin">Super Administrator</option>
                    <option value="owner">Business Owner</option>
                  </select>
                </div>
              </div>

              {role !== 'finance' && role !== 'owner' && (
                <div className="input-group">
                  <label htmlFor="branch">BRANCH</label>
                  <div className="select-wrapper">
                    <select
                      id="branch"
                      className="modern-select"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      disabled={role === 'admin' || role === 'superadmin' || role === 'finance'}
                      style={{ opacity: (role === 'admin' || role === 'superadmin' || role === 'finance') ? 0.7 : 1, cursor: (role === 'admin' || role === 'superadmin' || role === 'finance') ? 'not-allowed' : 'pointer', display: role === 'finance' ? 'none' : 'block' }}
                    >
                      <option value="Gallardo">Gallardo</option>
                      {role === 'sales' && <option value="New Ratu">New Ratu</option>}
                    </select>
                  </div>
                </div>
              )}

              <button type="submit" className="btn-signin mt-4" disabled={animationStage > 0 || isAuthenticating} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                {animationStage > 0 || isAuthenticating ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    AUTHENTICATING...
                  </>
                ) : (
                  'SIGN IN'
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
      <div className="login-right-col">
        <motion.img
          src={lamboImage}
          alt="Lamborghini Gallardo"
          className="login-car-image"
          initial={{ y: 0, x: isFromLogout ? '-150vw' : 0 }}
          animate={{
            x: animationStage > 0 ? '-150vw' : 0,
            y: animationStage > 0 ? 0 : [0, -3, 0]
          }}
          transition={{
            x: animationStage > 0
              ? { duration: 0.8, ease: "easeIn" }
              : (isFromLogout ? { duration: 0.8, ease: "easeOut" } : { duration: 0 }),
            y: animationStage > 0
              ? { duration: 0 }
              : { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
        />
      </div>
    </div>
  );
};

export default Login;
