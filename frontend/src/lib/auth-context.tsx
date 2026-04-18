'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from './types';
import { authApi, ApiError } from './api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  googleLogin: (token: string, data: GoogleLoginData) => Promise<void>;
  setupProfile: (data: SetupProfileData) => Promise<void>;
  mockLogin: (user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'student' | 'client';
  domain?: string;
  skills?: string[];
  company?: string;
}

interface GoogleLoginData {
  role: 'student' | 'client';
}

interface SetupProfileData {
  domain: string;
  skills: string[];
  bio?: string;
  github_url?: string;
  avatar_url?: string;
  company?: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  register: async () => {},
  googleLogin: async () => {},
  setupProfile: async () => {},
  mockLogin: () => {},
  logout: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        // First check for mock session
        const token = localStorage.getItem('kramic_token');
        if (token === 'mock_demo_token') {
          const mockUser = localStorage.getItem('kramic_user');
          if (mockUser) {
            setUser(JSON.parse(mockUser));
          }
          setIsLoading(false);
          return;
        }

        // Check Supabase session
        const userData = await authApi.getMe();
        if (userData) {
          setUser(userData as User);
        }
      } catch {
        // No valid session
        localStorage.removeItem('kramic_token');
        localStorage.removeItem('kramic_user');
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);
      if (response.access_token) {
        localStorage.setItem('kramic_token', response.access_token);
      }
      setUser(response.user as User);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await authApi.register(data);
      if (response.access_token) {
        localStorage.setItem('kramic_token', response.access_token);
      }
      setUser(response.user as User);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw error;
    }
  };

  const googleLogin = async (token: string, data: GoogleLoginData) => {
    try {
      const response = await authApi.googleAuth({ token, ...data });
      if (response.access_token) {
        localStorage.setItem('kramic_token', response.access_token);
      }
      setUser(response.user as User);
    } catch (error) {
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw error;
    }
  };

  const setupProfile = async (data: SetupProfileData) => {
    try {
      const response = await authApi.setupProfile(data);
      if (response.user) {
        // Always force profile_completed to true after successful setup
        setUser({ ...response.user, profile_completed: true } as User);
      } else {
        // Even if response.user is null, mark current user as completed
        setUser(prev => prev ? { ...prev, profile_completed: true, domain: data.domain, skills: data.skills } as User : null);
      }
    } catch (error) {
      // If the API call itself didn't throw, the profile update likely went through
      // but getMe failed to reflect it. Still mark as completed locally.
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw error;
    }
  };

  const mockLogin = (demoUser: User) => {
    localStorage.setItem('kramic_token', 'mock_demo_token');
    localStorage.setItem('kramic_user', JSON.stringify(demoUser));
    setUser(demoUser);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error('Logout error', e);
    } finally {
      setUser(null);
      localStorage.removeItem('kramic_token');
      localStorage.removeItem('kramic_user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, googleLogin, setupProfile, mockLogin, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
