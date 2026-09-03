import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CategoryType, Contact, RecurrenceType } from '../types';
import { calculateUpcomingEventFromImportantDate } from '../utils/dateUtils';

interface AddContactModalProps {
  isOpen: boolean;
  initialName?: string;
  onClose: () => void;
  onAddContact: (contact: Contact) => void;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({
  isOpen,
  initialName = '',
  onClose,
  onAddContact,
}) => {
  const [name, setName] = useState(initialName);
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [category, setCategory] = useState<CategoryType>('회사');
  const [tags, setTags] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('yearly');
  const [preferences, setPreferences] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setTitle('');
      setOrganization('');
      setCategory('회사');
      setTags('');
      setEventDate('');
      setEventTitle('');
      setRecurrence('yearly');
      setPreferences('');
    }
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let importantDate = undefined;
    let upcomingEvent = undefined;

    if (eventDate.trim()) {
      importantDate = {
        date: eventDate.trim(),
        title: eventTitle.trim() || undefined,
        recurrence,
      };

      upcomingEvent = calculateUpcomingEventFromImportantDate(
        importantDate,
        name.trim()
      );
    }

    const newContact: Contact = {
      id: `c-${Date.now()}`,
      name: name.trim(),
      title: title.trim() || '지인',
      organization: organization.trim() || '개인',
      category,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300&auto=format&fit=crop&q=80',
      birthday: eventDate && (eventTitle.includes('생일') || recurrence === 'yearly') ? eventDate : undefined,
      importantDate,
      upcomingEvent,
      preferences: preferences.trim() || undefined,
      status: '동률',
      exchangeCount: 0,
      totalSent: 0,
      totalReceived: 0,
      netBalance: 0,
    };

    onAddContact(newContact);
    onClose();
  };

  const modalJSX = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overscroll-none">
      {/* Backdrop click handler */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className="relative w-full max-w-[440px] bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[84vh] sm:max-h-[86vh] z-10 my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-black"></span>
            <h3 className="font-bold text-[16px] text-neutral-900">새로운 인연 등록</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-black cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        <form
          id="add-contact-form"
          onSubmit={handleSubmit}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-3.5"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div>
            <label className="text-[12px] font-semibold text-neutral-700">
              이름 *
            </label>
            <input
              type="text"
              required
              placeholder="예: 홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-[13px] focus:outline-hidden focus:border-black"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[12px] font-semibold text-neutral-700">
                직함/호칭
              </label>
              <input
                type="text"
                placeholder="예: 마케팅팀 대리, 친구"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full mt-1 p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-[13px] focus:outline-hidden focus:border-black"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-neutral-700">
                소속/관계
              </label>
              <input
                type="text"
                placeholder="예: 카카오, 고교동창"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full mt-1 p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-[13px] focus:outline-hidden focus:border-black"
              />
            </div>
          </div>

          <div>
            <label className="text-[12px] font-semibold text-neutral-700">
              분류 카테고리
            </label>
            <div className="grid grid-cols-4 gap-1.5 mt-1">
              {(['회사', '친구', '친척', '모임/기타'] as CategoryType[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2 text-[12px] font-semibold rounded-lg border transition-all cursor-pointer ${
                    category === cat
                      ? 'bg-black text-white border-black shadow-2xs'
                      : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 선택적 날짜 및 반복 주기 (1번만 / 매년 / 매달) */}
          <div className="p-3 bg-neutral-50/90 rounded-xl border border-neutral-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[12px] font-bold text-neutral-800 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-neutral-700">event</span>
                챙길 날짜 / 기념일 (선택)
              </label>
              {eventDate && (
                <button
                  type="button"
                  onClick={() => {
                    setEventDate('');
                    setEventTitle('');
                  }}
                  className="text-[11px] text-neutral-400 hover:text-neutral-700 underline cursor-pointer"
                >
                  날짜 초기화
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-neutral-500 font-medium">
                  날짜 입력
                </label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="w-full mt-1 p-2 bg-white border border-neutral-200 rounded-lg text-[12px] focus:outline-hidden focus:border-black cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[11px] text-neutral-500 font-medium">
                  일정명 (선택)
                </label>
                <input
                  type="text"
                  placeholder="예: 생일, 결혼기념일"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full mt-1 p-2 bg-white border border-neutral-200 rounded-lg text-[12px] focus:outline-hidden focus:border-black"
                />
              </div>
            </div>

            {/* Quick preset chips */}
            <div className="flex flex-wrap gap-1">
              {[
                { label: '생일', rec: 'yearly' as RecurrenceType },
                { label: '결혼기념일', rec: 'yearly' as RecurrenceType },
                { label: '정기 안부', rec: 'monthly' as RecurrenceType },
                { label: '모임 회비', rec: 'monthly' as RecurrenceType },
                { label: '특정 행사', rec: 'once' as RecurrenceType },
              ].map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => {
                    setEventTitle(chip.label);
                    setRecurrence(chip.rec);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
                    eventTitle === chip.label
                      ? 'bg-neutral-800 text-white border-neutral-800'
                      : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* 반복 주기 선택: 1번만 / 매년 / 매달 */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-neutral-700">
                  챙김 주기 (반복 여부)
                </span>
                <span className="text-[10px] text-neutral-400">
                  {recurrence === 'once'
                    ? '해당일에 1번만 리마인드'
                    : recurrence === 'yearly'
                    ? '매년 같은 날짜에 리마인드'
                    : '매달 같은 날짜에 리마인드'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { value: 'once' as RecurrenceType, label: '1번만', sub: '특정 일정' },
                  { value: 'yearly' as RecurrenceType, label: '매년', sub: '생일·기념일' },
                  { value: 'monthly' as RecurrenceType, label: '매달', sub: '정기 챙김' },
                ].map((item) => {
                  const isSelected = recurrence === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setRecurrence(item.value)}
                      className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                        isSelected
                          ? 'bg-black text-white border-black shadow-xs'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                      }`}
                    >
                      <span className="text-[13px] font-bold">{item.label}</span>
                      <span
                        className={`text-[10px] mt-0.5 ${
                          isSelected ? 'text-neutral-300' : 'text-neutral-400'
                        }`}
                      >
                        {item.sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[12px] font-semibold text-neutral-700">
              태그 (쉼표로 구분)
            </label>
            <input
              type="text"
              placeholder="직장동료, 입사동기, 멘토"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full mt-1 p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-[13px] focus:outline-hidden focus:border-black"
            />
          </div>

          <div>
            <label className="text-[12px] font-semibold text-neutral-700">
              취향 및 전달 메모 (선택)
            </label>
            <input
              type="text"
              placeholder="예: 커피 및 와인 선호, 건강식품 관심"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              className="w-full mt-1 p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-[13px] focus:outline-hidden focus:border-black"
            />
          </div>
        </form>

        {/* Fixed Footer with Save Button */}
        <div className="p-3.5 pb-safe border-t border-neutral-100 bg-white shrink-0 flex items-center gap-2 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-xl border border-neutral-200 text-neutral-600 text-[14px] font-semibold hover:bg-neutral-50 active:scale-[0.98] transition-all cursor-pointer"
          >
            취소
          </button>
          <button
            type="submit"
            form="add-contact-form"
            className="flex-1 py-3 bg-black text-white text-[14px] font-bold rounded-xl active:scale-[0.98] transition-transform hover:bg-neutral-900 cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[18px]">check</span>
            <span>인연 저장하기</span>
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : modalJSX;
};
