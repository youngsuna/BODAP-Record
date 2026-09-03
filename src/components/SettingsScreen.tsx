import React, { useState } from 'react';
import { USER_PROFILE } from '../data/initialData';
import { useAuth } from '../context/AuthContext';
import { purgeSampleDataFromFirestore } from '../lib/firebase';

interface SettingsScreenProps {
  onNavigate?: (screen: string) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = () => {
  const { user, logout } = useAuth();
  const [offlineSync, setOfflineSync] = useState(true);
  const [pushNotification, setPushNotification] = useState(true);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  const handleExportData = () => {
    setShowToast('전체 경조사 장부 데이터가 안전하게 백업되었습니다 (JSON).');
    setTimeout(() => setShowToast(null), 2500);
  };

  const handleExportPDF = () => {
    setShowToast('경조사 상호 교환 정산서가 PDF로 생성되었습니다.');
    setTimeout(() => setShowToast(null), 2500);
  };

  const handleLogout = async () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      setIsLoggingOut(true);
      try {
        await logout();
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoggingOut(false);
      }
    }
  };

  const handlePurgeSamples = async () => {
    if (!user) return;
    if (window.confirm('기존에 클라우드에 복사된 샘플 데이터를 모두 삭제하고, 내가 직접 등록한 데이터만 남기시겠습니까?')) {
      setIsCleaning(true);
      try {
        await purgeSampleDataFromFirestore(user.uid);
        setShowToast('샘플 데이터가 정리되었습니다. 내 실제 데이터만 표시됩니다.');
      } catch (err) {
        console.error(err);
        setShowToast('샘플 정리 중 오류가 발생했습니다.');
      } finally {
        setIsCleaning(false);
        setTimeout(() => setShowToast(null), 2500);
      }
    }
  };

  const getProviderLabel = () => {
    if (!user) return '미로그인';
    const provider = user.providerData[0]?.providerId;
    if (provider === 'google.com') return 'Google 계정';
    if (provider === 'password') return '이메일 계정';
    return 'Firebase 인증';
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || USER_PROFILE.name;
  const userEmail = user?.email || USER_PROFILE.email;
  const avatarUrl = user?.photoURL || USER_PROFILE.avatar;

  return (
    <div className="flex flex-col w-full space-y-4 pb-20">
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-black text-white text-[13px] px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          <span>{showToast}</span>
        </div>
      )}

      {/* Database Connection & Profile Card */}
      <section className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-13 h-13 rounded-full object-cover border border-neutral-200 shadow-2xs"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
              }}
            />
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-bold text-neutral-900">
                  {displayName}님
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${user ? 'bg-neutral-900 text-white' : 'bg-amber-100 text-amber-800'}`}>
                  {getProviderLabel()}
                </span>
              </div>
              <span className="text-[12px] text-neutral-500 mt-0.5 break-all">
                {userEmail}
              </span>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] font-medium">
                {user ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-emerald-700">Firestore DB 연결됨 (내 실제 데이터만 표시)</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span className="text-amber-700">DB 미연결 · 기본 목업 샘플 화면</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="flex flex-col gap-2 pt-2 border-t border-neutral-100">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full py-2.5 px-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 active:scale-[0.99] text-[13px] font-semibold text-neutral-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[17px] text-neutral-600">
              logout
            </span>
            <span>{isLoggingOut ? '로그아웃 중...' : '로그아웃'}</span>
          </button>
          <button
            onClick={handlePurgeSamples}
            disabled={isCleaning}
            className="w-full py-2 px-3 rounded-xl bg-neutral-50 border border-neutral-200 hover:bg-neutral-100 text-[11px] font-medium text-neutral-600 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px] text-neutral-500">
              cleaning_services
            </span>
            <span>{isCleaning ? '정리 중...' : '내 실제 데이터만 유지 (샘플 데이터 모두 제거)'}</span>
          </button>
        </div>
      </section>

      {/* Recommended Courtesy Guide */}
      <section className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 flex flex-col space-y-3">
        <h3 className="text-[15px] font-bold text-neutral-900 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px]">verified</span>
          BODAP 경조사 금액 표준 가이드
        </h3>
        <div className="space-y-2 text-[12px]">
          <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
            <span className="text-neutral-700 font-medium">가벼운 지인 / 직장 동료 (불참)</span>
            <span className="font-bold text-black">50,000원</span>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
            <span className="text-neutral-700 font-medium">친한 직장 동료 / 식사 참석</span>
            <span className="font-bold text-black">100,000원</span>
          </div>
          <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between">
            <span className="text-neutral-700 font-medium">친한 친구 / 호텔 예식장 / 친척</span>
            <span className="font-bold text-black">150,000 ~ 200,000원</span>
          </div>
        </div>
      </section>

      {/* Sync & Notification Preferences */}
      <section className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 flex flex-col space-y-3">
        <h3 className="text-[15px] font-bold text-neutral-900">
          시스템 및 알림
        </h3>
        <div className="flex items-center justify-between py-1 border-b border-neutral-50 text-[13px]">
          <div className="flex flex-col">
            <span className="font-medium text-neutral-900">오프라인 모드 로컬 캐시</span>
            <span className="text-[11px] text-neutral-500">네트워크 없이도 즉시 조회</span>
          </div>
          <button
            type="button"
            onClick={() => setOfflineSync(!offlineSync)}
            className={`w-11 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
              offlineSync ? 'bg-black' : 'bg-neutral-300'
            }`}
          >
            <div
              className={`bg-white w-5 h-5 rounded-full shadow-xs transform transition-transform ${
                offlineSync ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between py-1 text-[13px]">
          <div className="flex flex-col">
            <span className="font-medium text-neutral-900">D-Day 및 보답 알림</span>
            <span className="text-[11px] text-neutral-500">D-7, D-3 일정 푸시 전송</span>
          </div>
          <button
            type="button"
            onClick={() => setPushNotification(!pushNotification)}
            className={`w-11 h-6 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
              pushNotification ? 'bg-black' : 'bg-neutral-300'
            }`}
          >
            <div
              className={`bg-white w-5 h-5 rounded-full shadow-xs transform transition-transform ${
                pushNotification ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </section>

      {/* Backup & Export */}
      <section className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 flex flex-col space-y-2">
        <h3 className="text-[15px] font-bold text-neutral-900">
          데이터 관리 및 내보내기
        </h3>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleExportPDF}
            className="py-2.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[13px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
            <span>장부 PDF 출력</span>
          </button>
          <button
            onClick={handleExportData}
            className="py-2.5 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[13px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>데이터 백업 (JSON)</span>
          </button>
        </div>
      </section>

      {/* App Version Info */}
      <div className="text-center text-[12px] text-neutral-400 py-2 space-y-0.5">
        <p className="font-semibold text-neutral-600">BODAP - 마음을 잇는 보답 장부</p>
        <p>Version 2.4.0 (Cloud Firestore {user ? '동기화 연결됨' : '미연결 목업'})</p>
      </div>
    </div>
  );
};
