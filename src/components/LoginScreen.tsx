import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LOGO_URL } from '../data/initialData';

interface LoginScreenProps {
  onSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onSuccess }) => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, error, clearError } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email.trim() || !password) {
      setLocalError('이메일과 비밀번호를 모두 입력해 주세요.');
      return;
    }

    if (mode === 'register') {
      if (!nickname.trim()) {
        setLocalError('장부에 사용할 닉네임을 입력해 주세요.');
        return;
      }
      if (nickname.trim().length < 2) {
        setLocalError('닉네임은 2자 이상 입력해 주세요.');
        return;
      }
    }

    if (password.length < 6) {
      setLocalError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email.trim(), password);
      } else {
        await registerWithEmail(email.trim(), password, nickname.trim());
      }
      onSuccess?.();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setLocalError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError(null);
    clearError();
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      onSuccess?.();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setLocalError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeError = localError || error;

  return (
    <div className="w-full max-w-[440px] mx-auto min-h-screen bg-[#f8f9fa] flex flex-col justify-between p-6 antialiased text-[#191c1d]">
      {/* Top Branding Section */}
      <div className="pt-10 flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-neutral-100 flex items-center justify-center mb-4 overflow-hidden p-2.5">
          <img src={LOGO_URL} alt="BODAP" className="w-full h-full object-contain" />
        </div>
        <h1 className="text-2xl font-extrabold text-neutral-900 tracking-tight flex items-center gap-2">
          <span>BODAP</span>
          <span className="text-neutral-400 font-normal text-lg">·</span>
          <span className="font-semibold text-neutral-800 text-lg">보답</span>
        </h1>
        <p className="text-[14px] text-neutral-500 mt-1 max-w-[280px] leading-relaxed">
          경조사와 선물 상호 교환 장부, <br />
          마음의 밸런스를 스마트하게 관리하세요
        </p>

        {/* Live Service Authentication Badge */}
        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-900 text-white text-[11px] font-medium tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
          <span>클라우드 실시간 동기화 (Firebase Auth)</span>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="my-6 bg-white rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.05)] border border-neutral-100 flex flex-col">
        {/* Mode Toggle Tabs */}
        <div className="flex bg-neutral-100 p-1 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setLocalError(null);
              clearError();
            }}
            className={`flex-1 py-2 text-[13px] font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setLocalError(null);
              clearError();
            }}
            className={`flex-1 py-2 text-[13px] font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            계정 생성 (회원가입)
          </button>
        </div>

        {/* Error Notice */}
        {activeError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-2.5 text-left">
            <span className="material-symbols-outlined text-red-500 text-[18px] shrink-0 mt-0.5">
              error
            </span>
            <div className="text-[12px] text-red-700 leading-snug flex-1">
              {activeError}
            </div>
            <button
              onClick={() => {
                setLocalError(null);
                clearError();
              }}
              className="text-red-400 hover:text-red-600 text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Primary Social Login: Real Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 active:scale-[0.99] text-neutral-800 font-semibold text-[14px] flex items-center justify-center gap-3 transition-all shadow-xs disabled:opacity-60 cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.1C3.28 21.43 7.35 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.58H1.25C.45 8.16 0 9.98 0 12c0 2.02.45 3.84 1.25 5.42l4.03-3.1z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.28 2.57 1.25 6.58l4.03 3.1c.95-2.83 3.6-4.93 6.72-4.93z"
            />
          </svg>
          <span>Google 계정으로 계속하기</span>
        </button>

        {/* Divider */}
        <div className="relative my-5 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200"></div>
          </div>
          <span className="relative bg-white px-3 text-[11px] text-neutral-400 font-medium">
            또는 이메일로 {mode === 'login' ? '로그인' : '가입'}
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-[12px] font-medium text-neutral-700 mb-1">
                닉네임 <span className="text-black font-semibold">*</span>
                <span className="text-[11px] text-neutral-400 ml-1.5 font-normal">(장부 및 인연에게 표시될 호칭)</span>
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="예: 민지, 보답러, 김철수"
                required
                minLength={2}
                maxLength={20}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black text-[14px] text-neutral-900 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-[12px] font-medium text-neutral-700 mb-1">
              이메일 주소
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@bodap.com"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black text-[14px] text-neutral-900 transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[12px] font-medium text-neutral-700">
                비밀번호
              </label>
              <span className="text-[11px] text-neutral-400">
                6자 이상
              </span>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black text-[14px] text-neutral-900 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 rounded-xl bg-black hover:bg-neutral-800 active:scale-[0.99] text-white font-semibold text-[14px] transition-all disabled:opacity-50 cursor-pointer shadow-xs flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>처리 중...</span>
              </>
            ) : (
              <span>{mode === 'login' ? '로그인하기' : '닉네임으로 계정 생성'}</span>
            )}
          </button>
        </form>
      </div>

      {/* Footer Security Notice */}
      <div className="text-center pb-4 text-[11px] text-neutral-400 space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-neutral-500">
          <span className="material-symbols-outlined text-[14px] text-neutral-400">
            lock
          </span>
          <span>Google Firebase 보안 인증 및 실시간 클라우드 DB 연동</span>
        </div>
        <p>© 2026 BODAP. 경조사 교환 예절 및 상호 부조 장부 플랫폼</p>
      </div>
    </div>
  );
};
