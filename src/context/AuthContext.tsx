import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../lib/axios';
import { ENDPOINTS } from '../config';

interface User {
  agency_id: string;
  agency_name: string;
  sub: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const decoded: any = jwtDecode(storedToken);
        // Check if token is expired
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          console.log('Token expired');
          localStorage.removeItem('token');
          setIsLoading(false);
          return;
        }
        
        setToken(storedToken);
        setUser({
          agency_id: decoded.sub,
          agency_name: decoded.agency_name || 'Agency',
          sub: decoded.sub
        });
        
        // Fetch fresh user details from /auth/me
        api.get(ENDPOINTS.AUTH.ME)
          .then(res => {
            setUser({
              agency_id: res.data.id,
              agency_name: res.data.name,
              sub: res.data.id
            });
          })
          .catch((err) => {
            console.error('Failed to fetch user details:', err);
            // If /me fails, token might be invalid
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('token');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    try {
      await api.post(ENDPOINTS.AUTH.LOGOUT);
    } catch (e) {
      console.error('Logout failed on server:', e);
    }
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
