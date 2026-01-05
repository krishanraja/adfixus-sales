// Scanner Authentication Hook

import { useState, useEffect, useCallback } from 'react';

const SCANNER_SESSION_KEY = 'adfixus_scanner_auth';
const SCANNER_USERNAME = 'krish';
// Simple hash for demo - in production, use proper password hashing
const SCANNER_PASSWORD = 'krish';

interface ScannerAuthState {
  isAuthenticated: boolean;
  username: string | null;
}

export function useScannerAuth() {
  const [authState, setAuthState] = useState<ScannerAuthState>({
    isAuthenticated: false,
    username: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const session = localStorage.getItem(SCANNER_SESSION_KEY);
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.username && parsed.expiresAt > Date.now()) {
          setAuthState({
            isAuthenticated: true,
            username: parsed.username,
          });
        } else {
          localStorage.removeItem(SCANNER_SESSION_KEY);
        }
      } catch {
        localStorage.removeItem(SCANNER_SESSION_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((username: string, password: string): boolean => {
    if (username === SCANNER_USERNAME && password === SCANNER_PASSWORD) {
      const session = {
        username,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      };
      localStorage.setItem(SCANNER_SESSION_KEY, JSON.stringify(session));
      setAuthState({
        isAuthenticated: true,
        username,
      });
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SCANNER_SESSION_KEY);
    setAuthState({
      isAuthenticated: false,
      username: null,
    });
  }, []);

  return {
    ...authState,
    isLoading,
    login,
    logout,
  };
}
