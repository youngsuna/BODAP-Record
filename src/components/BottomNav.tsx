import React from 'react';
import { ScreenType } from '../types';

interface BottomNavProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, onNavigate }) => {
  const tabs: { id: ScreenType; label: string; icon: string }[] = [
    { id: 'home', label: '홈', icon: 'home' },
    { id: 'ledger', label: '장부', icon: 'menu_book' },
    { id: 'calendar', label: '캘린더', icon: 'calendar_today' },
    { id: 'settings', label: '설정', icon: 'settings' },
  ];

  return (
    <nav className="fixed bottom-0 w-full max-w-[440px] z-30 pb-safe bg-[#f8f9fa]/95 backdrop-blur-xl border-t border-neutral-200/80 shadow-[0_-4px_24px_rgba(0,0,0,0.03)]">
      <div className="h-16 px-3 flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive =
            currentScreen === tab.id ||
            (tab.id === 'ledger' && currentScreen === 'relationship-detail');

          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center justify-center w-14 h-12 transition-colors active:scale-95 ${
                isActive ? 'text-black font-semibold' : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[23px] ${
                  isActive ? 'fill' : ''
                }`}
              >
                {tab.icon}
              </span>
              <span className="text-[11px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
