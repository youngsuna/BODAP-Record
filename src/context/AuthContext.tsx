import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  loginWithGoogle as fbLoginWithGoogle,
  loginWithEmail as fbLoginWithEmail,
  registerWithEmail as fbRegisterWithEmail,
  logoutUser as fbLogoutUser,
} from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, nickname: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearError = () => setError(null);

  const formatAuthError = (err: unknown): string => {
    if (typeof err === 'object' && err !== null && 'code' in err) {
      const code = (err as { code: string }).code;
      switch (code) {
        case 'auth/user-not-found':
          return '가입되지 않은 이메일 주소입니다.';
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          return '비밀번호 또는 이메일 정보가 일치하지 않습니다.';
        case 'auth/email-already-in-use':
          return '이미 등록된 이메일 계정입니다. 로그인해 주세요.';
        case 'auth/weak-password':
          return '비밀번호는 최소 6자 이상이어야 합니다.';
        case 'auth/invalid-email':
          return '올바른 이메일 형식을 입력해 주세요.';
        case 'auth/popup-closed-by-user':
          return 'Google 로그인 창이 닫혔습니다. 다시 시도해 주세요.';
        case 'auth/popup-blocked':
          return '브라우저 팝업이 차단되었습니다. 팝업 허용 후 다시 시도하시거나 이메일로 로그인해 주세요.';
        case 'auth/network-request-failed':
          return '네트워크 연결 상태를 확인해 주세요.';
        case 'auth/operation-not-allowed':
          return '해당 인증 방식이 활성화되지 않았습니다. 관리자 설정을 확인해 주세요.';
        default:
          return (err as { message?: string }).message || '인증 처리 중 오류가 발생했습니다.';
      }
    }
    return '알 수 없는 오류가 발생했습니다.';
  };

  const loginWithGoogle = async () => {
    try {
      setError(null);
      await fbLoginWithGoogle();
    } catch (err: unknown) {
      console.error('Google Auth Error:', err);
      const msg = formatAuthError(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      setError(null);
      await fbLoginWithEmail(email, pass);
    } catch (err: unknown) {
      console.error('Email Login Error:', err);
      const msg = formatAuthError(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const registerWithEmail = async (email: string, pass: string, nickname: string) => {
    try {
      setError(null);
      const updatedUser = await fbRegisterWithEmail(email, pass, nickname);
      setUser(auth.currentUser || updatedUser);
    } catch (err: unknown) {
      console.error('Email Register Error:', err);
      const msg = formatAuthError(err);
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try {
      await fbLogoutUser();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        clearError,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
