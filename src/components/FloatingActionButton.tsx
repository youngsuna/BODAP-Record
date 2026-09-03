import React from 'react';

interface FloatingActionButtonProps {
  onClick: () => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick }) => {
  return (
    <div className="fixed bottom-24 right-4 z-40 max-w-[440px] pointer-events-none">
      <div className="pointer-events-auto flex justify-end">
        <button
          onClick={onClick}
          aria-label="새 보답 기록 추가"
          className="w-14 h-14 rounded-full bg-black text-white flex items-center justify-center shadow-[0_12px_32px_rgba(0,0,0,0.22)] active:scale-90 hover:bg-neutral-900 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[30px]">add</span>
        </button>
      </div>
    </div>
  );
};
