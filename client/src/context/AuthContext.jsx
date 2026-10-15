import { createContext, useContext, useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check active session on mount
  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const response = await axiosClient.get('/auth/me');
        if (isMounted) {
          setUser(response.data.data.user);
        }
      } catch (err) {
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const response = await axiosClient.post('/auth/login', { email, password });
    const authenticatedUser = response.data.data.user;
    setUser(authenticatedUser);
    return authenticatedUser;
  };

  const register = async (userData) => {
    const response = await axiosClient.post('/auth/register', userData);
    const newUser = response.data.data.user;
    setUser(newUser);
    return newUser;
  };

  const logout = async () => {
    try {
      await axiosClient.post('/auth/logout');
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
