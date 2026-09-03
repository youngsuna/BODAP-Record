import React from 'react';
import { createPortal } from 'react-dom';
import { AppNotification, Contact } from '../types';

interface NotificationModalProps {
  notifications: AppNotification[];
  isOpen: boolean;
  onClose: () => void;
  onSelectNotification: (notif: AppNotification) => void;
  onClearAll: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  notifications,
  isOpen,
  onClose,
  onSelectNotification,
  onClearAll,
}) => {
  if (!isOpen) return null;

  const modalJSX = (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-16 px-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-neutral-800">
              notifications
            </span>
            <h3 className="font-bold text-[16px] text-neutral-900">알림 센터</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClearAll}
              className="text-[12px] text-neutral-500 hover:text-black transition-colors"
            >
              모두 읽음
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-black"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="p-2 overflow-y-auto divide-y divide-neutral-50 space-y-1">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => onSelectNotification(n)}
              className={`p-3 rounded-xl flex flex-col space-y-1 cursor-pointer transition-colors ${
                n.read ? 'bg-white hover:bg-neutral-50' : 'bg-neutral-50 hover:bg-neutral-100/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-black shrink-0"></span>
                  )}
                  <span className="text-[13px] font-bold text-neutral-900">
                    {n.title}
                  </span>
                </div>
                <span className="text-[11px] text-neutral-400">{n.time}</span>
              </div>
              <p className="text-[12px] text-neutral-600 pl-3.5 leading-snug">
                {n.message}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : modalJSX;
};
