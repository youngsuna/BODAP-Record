import React from 'react';
import { LOGO_URL, USER_PROFILE } from '../data/initialData';
import { ScreenType } from '../types';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  onOpenNotifications: () => void;
  unreadNotificationsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  onOpenNotifications,
  unreadNotificationsCount,
}) => {
  const { user } = useAuth();
  const isSubScreen = currentScreen === 'relationship-detail' || currentScreen === 'record-entry';

  const avatarUrl =
    user?.photoURL ||
    USER_PROFILE.avatar;

  const displayName =
    user?.displayName ||
    (user?.isAnonymous ? '체험 게스트' : user?.email?.split('@')[0] || USER_PROFILE.name);

  const getScreenTitle = () => {
    switch (currentScreen) {
      case 'home':
        return '홈';
      case 'ledger':
        return '장부';
      case 'calendar':
        return '캘린더';
      case 'settings':
        return '설정';
      case 'relationship-detail':
        return '인연 상세';
      case 'record-entry':
        return '보답 기록';
      default:
        return '홈';
    }
  };

  return (
    <header className="fixed top-0 w-full max-w-[440px] z-50 bg-[#f8f9fa]/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)] pt-safe">
      <div className="h-16 px-4 flex items-center justify-between">
        {isSubScreen ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate(currentScreen === 'record-entry' ? 'home' : 'ledger')}
              className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full text-neutral-800 hover:bg-neutral-200/60 active:scale-95 transition-all"
              aria-label="Back"
            >
              <span className="material-symbols-outlined text-[24px]">arrow_back</span>
            </button>
            <h1 className="font-semibold text-[18px] text-neutral-900 tracking-tight">
              {getScreenTitle()}
            </h1>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <img
              src={LOGO_URL}
              alt="BODAP Logo"
              className="h-7 w-auto object-contain"
            />
            <span className="text-[17px] font-bold text-black tracking-tight">보답</span>
            {currentScreen !== 'home' && (
              <>
                <span className="text-neutral-400 text-xs">|</span>
                <h1 className="text-[17px] font-semibold text-neutral-800 truncate max-w-[130px]">
                  {getScreenTitle()}
                </h1>
              </>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5">
          {!isSubScreen && (
            <button
              aria-label="Notifications"
              onClick={onOpenNotifications}
              className="relative w-10 h-10 flex items-center justify-center rounded-full text-neutral-800 hover:bg-neutral-200/60 active:scale-95 transition-all"
              type="button"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-black"></span>
              )}
            </button>
          )}
          <button
            onClick={() => onNavigate('settings')}
            className="relative w-10 h-10 flex items-center justify-center rounded-full active:scale-95 transition-all"
            aria-label="Profile"
            title={`${displayName} (설정 및 계정)`}
          >
            <img
              alt={displayName}
              className="w-8 h-8 rounded-full object-cover shadow-[0_1px_4px_rgba(0,0,0,0.12)] border border-neutral-200"
              src={avatarUrl}
              onError={(e) => {
                // Fallback avatar
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
              }}
            />
            {user && (
              <span
                className="absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white"
                title="Firebase 클라우드 실시간 연결됨"
              />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
