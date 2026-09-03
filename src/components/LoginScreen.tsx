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
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [passwordCheckedMessage, setPasswordCheckedMessage] = useState<{ isMatch: boolean; text: string } | null>(null);
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // 비밀번호 유효성 검사: 8자 이상, 숫자 포함, 특수문자 포함
  const checkPasswordRules = (pwd: string) => {
    const hasMinLength = pwd.length >= 8;
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>\-_+=[\]\\/`~]/.test(pwd);
    return {
      hasMinLength,
      hasNumber,
      hasSpecial,
      isValid: hasMinLength && hasNumber && hasSpecial,
    };
  };

  const passwordRules = checkPasswordRules(password);

  const handleCheckPasswordMatch = () => {
    setLocalError(null);
    if (!password) {
      setPasswordCheckedMessage({ isMatch: false, text: '먼저 비밀번호를 입력해 주세요.' });
      return;
    }
    if (!passwordRules.isValid) {
      setPasswordCheckedMessage({
        isMatch: false,
        text: '비밀번호 규칙을 만족해야 합니다 (숫자+특수문자 포함 8자리 이상).',
      });
      return;
    }
    if (!passwordConfirm) {
      setPasswordCheckedMessage({ isMatch: false, text: '비밀번호 확인란에 비밀번호를 다시 입력해 주세요.' });
      return;
    }
    if (password !== passwordConfirm) {
      setPasswordCheckedMessage({ isMatch: false, text: '비밀번호가 일치하지 않습니다.' });
    } else {
      setPasswordCheckedMessage({ isMatch: true, text: '비밀번호가 안전하며 일치합니다.' });
    }
  };

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

      if (!passwordRules.isValid) {
        setLocalError('비밀번호는 숫자와 특수문자를 포함하여 8자리 이상이어야 합니다.');
        return;
      }

      if (password !== passwordConfirm) {
        setLocalError('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
        return;
      }
    } else {
      if (password.length < 6) {
        setLocalError('비밀번호를 올바르게 입력해 주세요.');
        return;
      }
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
        <p className="text-[14px] text-neutral-600 mt-2 max-w-[300px] leading-relaxed font-medium">
          소중한 선물을 기록하고 잊지않고 보답하세요
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="my-6 bg-white rounded-3xl p-6 shadow-[0_4px_25px_rgba(0,0,0,0.05)] border border-neutral-100 flex flex-col">
        {/* Mode Toggle Tabs */}
        <div className="flex bg-neutral-100 p-1 rounded-xl mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setPasswordConfirm('');
              setPasswordCheckedMessage(null);
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
              setPasswordConfirm('');
              setPasswordCheckedMessage(null);
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
          <div className="mb-4 p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-left shadow-2xs">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-amber-600 text-[19px] shrink-0 mt-0.5">
                {activeError.includes('unauthorized-domain') ? 'domain_verification' : 'error'}
              </span>
              <div className="text-[12px] text-neutral-800 leading-snug flex-1">
                {activeError}
              </div>
              <button
                type="button"
                onClick={() => {
                  setLocalError(null);
                  clearError();
                }}
                className="text-neutral-400 hover:text-neutral-700 text-xs cursor-pointer p-0.5"
              >
                ✕
              </button>
            </div>

            {activeError.includes('unauthorized-domain') && (
              <div className="mt-3 pt-3 border-t border-amber-200/80 text-[11px] text-neutral-700 space-y-2">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px] text-amber-700">help</span>
                  <span>도메인 승인 등록 방법 (1분 해결)</span>
                </div>
                <p className="text-neutral-600 leading-relaxed">
                  Google 로그인은 보안상 <strong>Firebase 콘솔의 승인된 도메인 목록</strong>에 등록된 웹사이트 주소에서만 동작합니다.
                </p>
                <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-amber-200">
                  <span className="text-[11px] text-neutral-500 font-medium">등록할 도메인:</span>
                  <code className="text-[12px] font-bold text-black select-all">
                    {typeof window !== 'undefined' ? window.location.hostname : '도메인 확인 불가'}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(window.location.hostname);
                        alert(`도메인 주소 [${window.location.hostname}]가 복사되었습니다!`);
                      }
                    }}
                    className="ml-auto px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-semibold text-[10px] cursor-pointer"
                  >
                    복사
                  </button>
                </div>
                <div className="text-[11px] text-neutral-600 space-y-0.5 pl-1">
                  <div>1. <strong>Firebase 콘솔</strong> &gt; <strong>Authentication</strong> &gt; <strong>설정</strong> 탭 클릭</div>
                  <div>2. <strong>승인된 도메인</strong> 섹션에서 [<strong>도메인 추가</strong>] 클릭</div>
                  <div>3. 위 복사한 도메인을 붙여넣고 저장하면 즉시 정상 작동합니다.</div>
                </div>
                <div className="pt-1 flex items-center gap-2">
                  <a
                    href="https://console.firebase.google.com/project/gen-lang-client-0941452046/authentication/settings"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black text-white hover:bg-neutral-800 text-[11px] font-bold transition-all shadow-2xs"
                  >
                    <span>Firebase 콘솔 설정 바로가기</span>
                    <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                  </a>
                  <span className="text-[10px] text-neutral-500">또는 아래 이메일 가입/로그인은 즉시 사용 가능합니다.</span>
                </div>
              </div>
            )}
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
                비밀번호 {mode === 'register' && <span className="text-black font-semibold">*</span>}
              </label>
              <span className="text-[11px] text-neutral-500">
                {mode === 'register' ? '숫자·특수문자 포함 8자 이상' : '비밀번호 입력'}
              </span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordCheckedMessage(null);
                }}
                placeholder={mode === 'register' ? '영문, 숫자, 특수문자 조합 8자 이상' : '••••••••'}
                required
                minLength={mode === 'register' ? 8 : 6}
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black text-[14px] text-neutral-900 transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                title={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                <span className="material-symbols-outlined text-[18px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            {/* Password requirement chips in registration mode */}
            {mode === 'register' && (
              <div className="flex flex-wrap gap-2 text-[11px] pt-1.5 pl-0.5">
                <span className={`inline-flex items-center gap-1 ${passwordRules.hasMinLength ? 'text-emerald-600 font-semibold' : 'text-neutral-400'}`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {passwordRules.hasMinLength ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  8자리 이상
                </span>
                <span className={`inline-flex items-center gap-1 ${passwordRules.hasNumber ? 'text-emerald-600 font-semibold' : 'text-neutral-400'}`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {passwordRules.hasNumber ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  숫자 포함
                </span>
                <span className={`inline-flex items-center gap-1 ${passwordRules.hasSpecial ? 'text-emerald-600 font-semibold' : 'text-neutral-400'}`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {passwordRules.hasSpecial ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  특수문자 포함
                </span>
              </div>
            )}
          </div>

          {/* Password Confirmation Field & Button (Register Mode) */}
          {mode === 'register' && (
            <div>
              <label className="block text-[12px] font-medium text-neutral-700 mb-1">
                비밀번호 확인 <span className="text-black font-semibold">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPasswordConfirm ? 'text' : 'password'}
                    value={passwordConfirm}
                    onChange={(e) => {
                      setPasswordConfirm(e.target.value);
                      setPasswordCheckedMessage(null);
                    }}
                    placeholder="비밀번호를 한 번 더 입력해 주세요"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-black focus:ring-1 focus:ring-black text-[14px] text-neutral-900 transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    title={showPasswordConfirm ? '비밀번호 숨기기' : '비밀번호 보기'}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPasswordConfirm ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleCheckPasswordMatch}
                  className="px-3.5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-[12px] font-bold shrink-0 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  비밀번호 확인
                </button>
              </div>

              {/* Password Match Status Message */}
              {passwordCheckedMessage && (
                <div
                  className={`mt-2 px-2.5 py-1.5 rounded-lg text-[11px] flex items-center gap-1.5 font-medium border ${
                    passwordCheckedMessage.isMatch
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-600 border-red-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">
                    {passwordCheckedMessage.isMatch ? 'check_circle' : 'cancel'}
                  </span>
                  <span>{passwordCheckedMessage.text}</span>
                </div>
              )}
            </div>
          )}

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
          <span>안전한 보안 암호화 및 장부 데이터 보호</span>
        </div>
        <p>© 2026 BODAP. 경조사 교환 예절 및 상호 부조 장부 플랫폼</p>
      </div>
    </div>
  );
};
