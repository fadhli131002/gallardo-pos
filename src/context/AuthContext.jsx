import { createContext, useState, useEffect, useContext } from 'react';
import { decodeJwt } from '../utils/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const verifySession = async () => {
      const storedToken = sessionStorage.getItem('token');
      
      if (!storedToken) {
        sessionStorage.clear();
        setToken(null);
        setUser(null);
        setLoading(false);
        return;
      }

      const decoded = decodeJwt(storedToken);
      if (!decoded) {
        sessionStorage.clear();
        setToken(null);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/auth/me', {
          headers: { 'Authorization': `Bearer ${storedToken}` }
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData.success && resData.data) {
            const verified = {
              id: resData.data.user_id || resData.data.id,
              name: resData.data.name,
              username: resData.data.username,
              role: resData.data.role
            };
            setUser(verified);
            setToken(storedToken);
            sessionStorage.setItem('userRole', verified.role);
            sessionStorage.setItem('userName', verified.name);
            sessionStorage.setItem('user', JSON.stringify(verified));
          } else {
            throw new Error('Invalid user payload from /me');
          }
        } else {
          // Tangani secara eksplisit status 401/403 dari backend
          if (response.status === 401 || response.status === 403) {
            sessionStorage.clear();
            setUser(null);
            setToken(null);
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
              return;
            }
          }
          throw new Error(`Unauthorized or expired token (status: ${response.status})`);
        }
      } catch (err) {
        console.error('Session verification failed:', err.message);
        sessionStorage.clear();
        setUser(null);
        setToken(null);
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } finally {
        setLoading(false);
      }
    };

    verifySession();
  }, []);

  const login = (newToken, userData) => {
    const normalised = {
      id: userData.user_id || userData.id,
      name: userData.name,
      username: userData.username,
      role: userData.role
    };
    
    // Bersihkan total sisa storage lama sebelum menimpa dengan data baru
    sessionStorage.clear();
    sessionStorage.setItem('token', newToken);
    sessionStorage.setItem('userRole', normalised.role);
    sessionStorage.setItem('userName', normalised.name);
    sessionStorage.setItem('user', JSON.stringify(normalised));
    
    setToken(newToken);
    setUser(normalised);
  };

  const logout = () => {
    sessionStorage.clear();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
