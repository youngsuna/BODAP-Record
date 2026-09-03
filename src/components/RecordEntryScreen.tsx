import React, { useState, useRef, useEffect } from 'react';
import { Contact, EventCategory, DeliveryFormat, RecordDirection, RecordItem, ScreenType } from '../types';
import { AddContactModal } from './AddContactModal';

interface RecordEntryScreenProps {
  contacts: Contact[];
  preselectedContactId?: string;
  onSaveRecord: (newRecord: Omit<RecordItem, 'id'>) => void;
  onAddContact?: (contact: Contact) => void | Promise<void>;
  onNavigate: (screen: ScreenType) => void;
}

export const RecordEntryScreen: React.FC<RecordEntryScreenProps> = ({
  contacts,
  preselectedContactId,
  onSaveRecord,
  onAddContact,
  onNavigate,
}) => {
  const initialContact = preselectedContactId
    ? contacts.find((c) => c.id === preselectedContactId) || null
    : null;

  const [direction, setDirection] = useState<RecordDirection>('sent');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(initialContact);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [addContactInitialName, setAddContactInitialName] = useState('');

  // Helper for formatted today string YYYY-MM-DD
  const getTodayDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Date state: defaults to today's date
  const [recordDate, setRecordDate] = useState<string>(getTodayDateString());

  const setQuickDateOffset = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setRecordDate(`${year}-${month}-${day}`);
  };

  const [category, setCategory] = useState<EventCategory>('생일 축하');
  const [format, setFormat] = useState<DeliveryFormat>('현금 / 봉투');
  const [amount, setAmount] = useState<number>(100000);
  const [memo, setMemo] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [photoLabel, setPhotoLabel] = useState('선물 인증');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [enableReminder, setEnableReminder] = useState(true);
  const [reminderEventTitle, setReminderEventTitle] = useState('보답 예정일');

  // Default target date is 30 days ahead from today
  const getDefaultTargetEventDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [targetEventDate, setTargetEventDate] = useState<string>(getDefaultTargetEventDate());
  type ReminderTiming = 7 | 3 | 1 | 0 | 'custom';
  const [selectedTimings, setSelectedTimings] = useState<ReminderTiming[]>([7]);
  const [customReminderDate, setCustomReminderDate] = useState<string>('');

  const toggleTiming = (timing: ReminderTiming) => {
    setSelectedTimings((prev) => {
      if (prev.includes(timing)) {
        const next = prev.filter((t) => t !== timing);
        return next.length > 0 ? next : [timing]; // Keep at least one selected
      } else {
        return [...prev, timing];
      }
    });
  };

  // Synchronize target event title & date when selected contact changes
  useEffect(() => {
    if (!selectedContact) {
      setReminderEventTitle('보답 예정일');
      return;
    }
    if (selectedContact.upcomingEvent?.title) {
      setReminderEventTitle(selectedContact.upcomingEvent.title);
    } else if (selectedContact.importantDate?.title) {
      setReminderEventTitle(selectedContact.importantDate.title);
    } else {
      setReminderEventTitle('보답 예정일');
    }

    if (selectedContact.importantDate?.date) {
      const parts = selectedContact.importantDate.date.split('-');
      if (parts.length === 3) {
        const now = new Date();
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        let cand = new Date(now.getFullYear(), m, d);
        if (cand.getTime() < now.getTime()) {
          cand = new Date(now.getFullYear() + 1, m, d);
        }
        const yStr = cand.getFullYear();
        const mStr = String(cand.getMonth() + 1).padStart(2, '0');
        const dStr = String(cand.getDate()).padStart(2, '0');
        setTargetEventDate(`${yStr}-${mStr}-${dStr}`);
      }
    }
  }, [selectedContact]);

  const calculateReminderItem = (timing: ReminderTiming) => {
    if (timing === 'custom') {
      if (!customReminderDate) {
        return {
          timing,
          formattedDate: '알림 날짜 선택 필요',
          dDayText: '직접 지정',
          rawDate: '',
        };
      }
      try {
        const [y, m, d] = customReminderDate.split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const dayName = days[dateObj.getDay()] || '';
        return {
          timing,
          formattedDate: `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')} (${dayName})`,
          dDayText: '직접 지정',
          rawDate: customReminderDate,
        };
      } catch {
        return { timing, formattedDate: customReminderDate, dDayText: '직접 지정', rawDate: customReminderDate };
      }
    }

    if (!targetEventDate) {
      return {
        timing,
        formattedDate: '기준 날짜 선택 필요',
        dDayText: timing === 0 ? '당일' : `${timing}일 전`,
        rawDate: '',
      };
    }

    try {
      const [y, m, d] = targetEventDate.split('-').map(Number);
      const targetObj = new Date(y, m - 1, d);
      targetObj.setDate(targetObj.getDate() - (timing as number));

      const remY = targetObj.getFullYear();
      const remM = targetObj.getMonth() + 1;
      const remD = targetObj.getDate();
      const days = ['일', '월', '화', '수', '목', '금', '토'];
      const dayName = days[targetObj.getDay()] || '';

      const dDayLabel =
        timing === 0
          ? '당일 (D-Day)'
          : `${timing}일 전 (D-${timing})`;

      return {
        timing,
        formattedDate: `${remY}.${String(remM).padStart(2, '0')}.${String(remD).padStart(2, '0')} (${dayName})`,
        dDayText: dDayLabel,
        rawDate: `${remY}-${String(remM).padStart(2, '0')}-${String(remD).padStart(2, '0')}`,
      };
    } catch {
      return { timing, formattedDate: targetEventDate, dDayText: `${timing}일 전`, rawDate: targetEventDate };
    }
  };

  const getAllCalculatedReminders = () => {
    return selectedTimings.map(calculateReminderItem);
  };

  // Quick amount buttons
  const quickAmounts = [
    { label: '+3만', value: 30000 },
    { label: '+5만', value: 50000 },
    { label: '+10만', value: 100000 },
    { label: '+20만', value: 200000 },
  ];

  const photoLabelPresets = ['청첩장/초대장', '선물 인증', '영수증/이체증', '행사 사진'];

  const handleCreatedContact = (newContact: Contact) => {
    if (onAddContact) {
      onAddContact(newContact);
    }
    setSelectedContact(newContact);
    setIsSearching(false);
    setSearchQuery('');
    setIsAddContactModalOpen(false);
  };

  const handleQuickAddFromName = (nameInput: string) => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    const quickContact: Contact = {
      id: `c-${Date.now()}`,
      name: trimmed,
      title: '지인',
      organization: '직접 등록',
      category: '모임/기타',
      relationship: '인연',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      totalSent: 0,
      totalReceived: 0,
      netBalance: 0,
      exchangeCount: 0,
      status: '동률',
      tags: ['직접등록'],
    };
    if (onAddContact) {
      onAddContact(quickContact);
    }
    setSelectedContact(quickContact);
    setIsSearching(false);
    setSearchQuery('');
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일(JPG, PNG, WebP 등)만 업로드할 수 있습니다.');
      return;
    }
    setIsProcessingImage(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        setIsProcessingImage(false);
        return;
      }
      const img = new Image();
      img.onload = () => {
        const maxDim = 1000;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.82);
          setPhotoUrl(compressed);
        } else {
          setPhotoUrl(result);
        }
        setIsProcessingImage(false);
      };
      img.onerror = () => {
        setIsProcessingImage(false);
        alert('이미지를 불러오는데 실패했습니다.');
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const categories: { label: EventCategory; icon: string; emoji: string }[] = [
    { label: '결혼식', icon: 'diamond', emoji: '💍' },
    { label: '부고 / 조의', icon: 'spa', emoji: '🕊️' },
    { label: '생일 축하', icon: 'cake', emoji: '🎂' },
    { label: '승진 / 영전', icon: 'work', emoji: '💼' },
    { label: '출산 / 돌잔치', icon: 'child_care', emoji: '🍼' },
    { label: '기타 선물', icon: 'auto_awesome', emoji: '✨' },
  ];

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact) {
      alert('대상 인물을 선택하거나 새 인물을 등록해주세요.');
      return;
    }

    // Format selected recordDate (YYYY-MM-DD) to YYYY.MM.DD
    let formattedDate: string;
    if (recordDate) {
      formattedDate = recordDate.replace(/-/g, '.');
    } else {
      const today = new Date();
      formattedDate = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(
        today.getDate()
      ).padStart(2, '0')}`;
    }

    const computeRelativeTime = (dateStr: string) => {
      if (!dateStr) return '오늘';
      try {
        const [y, m, d] = dateStr.split('-').map(Number);
        const target = new Date(y, m - 1, d);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return '오늘';
        if (diffDays === 1) return '어제';
        if (diffDays > 1 && diffDays <= 7) return `${diffDays}일 전`;
        if (diffDays > 7 && diffDays <= 30) return `${Math.floor(diffDays / 7)}주 전`;
        if (diffDays > 30) return `${Math.floor(diffDays / 30)}개월 전`;
        if (diffDays === -1) return '내일';
        if (diffDays < -1) return `${Math.abs(diffDays)}일 후`;
        return '방금 전';
      } catch {
        return '방금 전';
      }
    };

    const allCalculatedReminders = enableReminder ? getAllCalculatedReminders() : [];
    const validReminders = allCalculatedReminders.filter((r) => r.rawDate);
    const primaryReminder = validReminders[0];

    onSaveRecord({
      contactId: selectedContact.id,
      contactName: selectedContact.name,
      type: direction,
      date: formattedDate,
      category,
      format,
      amount,
      itemTitle: `${category} ${direction === 'sent' ? '보냄' : '받음'}`,
      memo,
      photoUrl,
      photoLabel: photoUrl ? photoLabel : undefined,
      relativeTime: computeRelativeTime(recordDate),
      reminderDate: primaryReminder?.rawDate,
      reminderTitle: enableReminder ? reminderEventTitle : undefined,
      reminderOffset: primaryReminder ? (primaryReminder.timing === 'custom' ? '직접지정' : primaryReminder.timing) : undefined,
      reminderDates: validReminders.map((r) => r.rawDate),
      reminderOffsets: validReminders.map((r) => (r.timing === 'custom' ? '직접지정' : r.timing)),
    });

    onNavigate('ledger');
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col w-full space-y-4 pb-16">
      {/* Title with bullet & close */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-black"></span>
          <h2 className="text-[17px] font-bold text-neutral-900">
            보답 기록
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Direction Toggle */}
      <div className="grid grid-cols-2 gap-2 bg-neutral-200/60 p-1.5 rounded-2xl">
        <button
          type="button"
          onClick={() => setDirection('received')}
          className={`py-3 px-3 rounded-xl flex items-center justify-center gap-2 text-[14px] font-bold transition-all cursor-pointer ${
            direction === 'received'
              ? 'bg-white text-black shadow-sm'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">south_west</span>
          <span>받은 마음 (수령)</span>
        </button>
        <button
          type="button"
          onClick={() => setDirection('sent')}
          className={`py-3 px-3 rounded-xl flex items-center justify-center gap-2 text-[14px] font-bold transition-all cursor-pointer ${
            direction === 'sent'
              ? 'bg-white text-black shadow-sm'
              : 'text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">north_east</span>
          <span>보낸 마음 (전달)</span>
        </button>
      </div>

      {/* Section: 대상 인물 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 flex flex-col space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[14px] font-bold text-neutral-900 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-neutral-600">person_add</span>
            대상 인물
          </label>
          <button
            type="button"
            onClick={() => {
              setAddContactInitialName(searchQuery.trim());
              setIsAddContactModalOpen(true);
            }}
            className="text-[12px] font-bold text-black bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[15px]">add</span>
            새 인물 등록
          </button>
        </div>

        {/* Selected Contact Pill or placeholder */}
        {selectedContact ? (
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-900 text-[13px] font-medium">
              <span className="material-symbols-outlined text-[16px] text-neutral-600">account_circle</span>
              <span>
                {selectedContact.name} {selectedContact.title} ({selectedContact.tags[0] || selectedContact.organization})
              </span>
              <button
                type="button"
                onClick={() => setSelectedContact(null)}
                className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-neutral-300 text-neutral-500 hover:text-neutral-900 cursor-pointer"
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <div className="text-[12px] text-neutral-500 px-0.5">
            기록을 남길 인물을 검색하거나 아래 목록에서 선택해주세요.
          </div>
        )}

        {/* Search input */}
        <div className="relative">
          <span className="absolute left-3 top-2.5 material-symbols-outlined text-[18px] text-neutral-400">
            search
          </span>
          <input
            type="text"
            placeholder="인물 이름 or 관계 검색..."
            value={searchQuery}
            onFocus={() => setIsSearching(true)}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-[13px] focus:outline-hidden focus:border-black transition-colors"
          />
        </div>

        {/* Autocomplete suggestions */}
        {(isSearching || !selectedContact) && (
          <div className="max-h-48 overflow-y-auto no-scrollbar border border-neutral-100 rounded-xl p-1 bg-white space-y-1">
            {filteredContacts.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedContact(c);
                  setIsSearching(false);
                  setSearchQuery('');
                }}
                className="w-full px-3 py-2 text-left rounded-lg text-[13px] hover:bg-neutral-100 flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-900">{c.name}</span>
                  <span className="text-neutral-500 text-xs">{c.title}</span>
                  <span className="text-neutral-400 text-xs">({c.organization})</span>
                </div>
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-neutral-200/60 text-neutral-700">
                  {c.category}
                </span>
              </button>
            ))}

            {searchQuery.trim().length > 0 && (
              <div className="pt-1 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => handleQuickAddFromName(searchQuery.trim())}
                  className="w-full px-3 py-2 text-left rounded-lg text-[13px] bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-medium flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-black">person_add</span>
                  <span>'{searchQuery.trim()}' 님으로 간편 등록하고 선택</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section: 받은 날짜 / 보낸 날짜 (디폴트: 오늘 날짜) */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[14px] font-bold text-neutral-900 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-neutral-700">calendar_month</span>
            <span>{direction === 'received' ? '받은 날짜' : '보낸 날짜'}</span>
            <span className="text-[11px] text-neutral-400 font-normal ml-1">
              {direction === 'received' ? '(마음을 전해받은 날)' : '(마음을 전달한 날)'}
            </span>
          </label>
        </div>

        {/* Date Input */}
        <div>
          <input
            type="date"
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
            className="w-full py-2.5 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-[13px] font-semibold text-neutral-900 focus:outline-hidden focus:border-black cursor-pointer"
          />
        </div>

        {/* Quick Date Presets */}
        <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto no-scrollbar">
          <span className="text-[11px] text-neutral-400 shrink-0 mr-1">빠른 선택:</span>
          {[
            { label: '오늘', offset: 0 },
            { label: '어제', offset: 1 },
            { label: '그저께', offset: 2 },
            { label: '1주일 전', offset: 7 },
          ].map((preset) => {
            const d = new Date();
            d.setDate(d.getDate() - preset.offset);
            const dateVal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
              d.getDate()
            ).padStart(2, '0')}`;
            const isSelected = recordDate === dateVal;

            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => setQuickDateOffset(preset.offset)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-black text-white border-black shadow-xs'
                    : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section: 보답 분류 (필수 선택) */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 flex flex-col space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[14px] font-bold text-neutral-900">
            보답 분류 <span className="text-red-500 font-normal">*필수 선택</span>
          </label>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {categories.map((cat) => {
            const isSelected = category === cat.label;
            return (
              <button
                key={cat.label}
                type="button"
                onClick={() => setCategory(cat.label)}
                className={`py-3 px-2 rounded-xl flex flex-col items-center justify-center gap-1.5 text-[13px] font-semibold border transition-all active:scale-95 cursor-pointer ${
                  isSelected
                    ? 'bg-black text-white border-black shadow-sm'
                    : 'bg-neutral-50 border-neutral-200/80 text-neutral-800 hover:bg-neutral-100'
                }`}
              >
                <span className="text-[20px]">{cat.emoji}</span>
                <span className="text-[12px]">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section: 전달 형태 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 flex flex-col space-y-2.5">
        <label className="text-[14px] font-bold text-neutral-900">
          전달 형태
        </label>
        <div className="grid grid-cols-2 gap-2 bg-neutral-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setFormat('현금 / 봉투')}
            className={`py-2 px-3 rounded-lg text-[13px] font-semibold transition-all ${
              format === '현금 / 봉투'
                ? 'bg-white text-black shadow-xs'
                : 'text-neutral-500 hover:text-black'
            }`}
          >
            현금 / 봉투
          </button>
          <button
            type="button"
            onClick={() => setFormat('물품 / 기프티콘')}
            className={`py-2 px-3 rounded-lg text-[13px] font-semibold transition-all ${
              format === '물품 / 기프티콘'
                ? 'bg-white text-black shadow-xs'
                : 'text-neutral-500 hover:text-black'
            }`}
          >
            물품 / 기프티콘
          </button>
        </div>
      </div>

      {/* Section: 금액 입력 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 flex flex-col space-y-3">
        <label className="text-[14px] font-bold text-neutral-900">
          금액 입력
        </label>

        {/* Big Numeric Display */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 flex items-center justify-between">
          <span className="text-[13px] text-neutral-500 font-medium">금액 입력</span>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1">
              <input
                type="text"
                inputMode="numeric"
                value={amount === 0 ? '' : amount.toLocaleString()}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  setAmount(raw ? parseInt(raw, 10) : 0);
                }}
                placeholder="0"
                className="text-right text-[22px] font-bold font-mono text-neutral-900 bg-transparent focus:outline-hidden w-36"
              />
              <span className="text-[18px] font-bold text-neutral-900">원</span>
            </div>
            {amount > 0 && (
              <button
                type="button"
                onClick={() => setAmount(0)}
                aria-label="금액 초기화"
                title="금액 초기화"
                className="w-5 h-5 rounded-full bg-neutral-300 hover:bg-neutral-400 text-neutral-700 hover:text-black flex items-center justify-center text-[11px] font-bold transition-colors cursor-pointer shrink-0"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Quick Amount Chips */}
        <div className="grid grid-cols-4 gap-2">
          {quickAmounts.map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => setAmount((prev) => prev + q.value)}
              className="py-2 px-2 bg-neutral-100 hover:bg-neutral-200 active:scale-95 text-neutral-800 text-[12px] font-semibold rounded-lg transition-all"
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Section: 상세 메모 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[14px] font-bold text-neutral-900">
            상세 메모
          </label>
          <span className="text-[11px] text-neutral-400">선택 사항</span>
        </div>
        <textarea
          rows={3}
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="식권 수령 여부, 참석자, 주고받은 배경 등을 메모해 보세요."
          className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-[13px] text-neutral-800 focus:outline-hidden focus:border-black transition-colors"
        />
      </div>

      {/* Section: 사진 및 영수증 첨부 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[14px] font-bold text-neutral-900 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-neutral-700">
              add_photo_alternate
            </span>
            사진 / 영수증 첨부
          </label>
          <span className="text-[11px] text-neutral-400">선택 사항</span>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        {photoUrl ? (
          <div className="flex flex-col space-y-3">
            <div className="relative rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 max-h-56 flex items-center justify-center group">
              <img
                src={photoUrl}
                alt="첨부된 사진"
                className="w-full h-auto max-h-56 object-contain rounded-xl"
              />
              <div className="absolute top-2 right-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black text-white text-[11px] font-medium backdrop-blur-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">sync</span>
                  변경
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoUrl(undefined)}
                  className="px-2.5 py-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-[11px] font-medium backdrop-blur-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[14px]">delete</span>
                  삭제
                </button>
              </div>
            </div>

            {/* Photo Label presets */}
            <div className="flex flex-col space-y-1.5">
              <span className="text-[12px] text-neutral-600 font-medium">사진 분류 태그:</span>
              <div className="flex flex-wrap gap-1.5">
                {photoLabelPresets.map((lbl) => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => setPhotoLabel(lbl)}
                    className={`px-2.5 py-1 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${
                      photoLabel === lbl
                        ? 'bg-black text-white'
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-black bg-neutral-100 scale-[1.01]'
                : 'border-neutral-300 hover:border-neutral-400 bg-neutral-50/70 hover:bg-neutral-50'
            }`}
          >
            {isProcessingImage ? (
              <div className="flex flex-col items-center gap-2 py-3">
                <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <span className="text-[13px] font-medium text-neutral-600">
                  이미지 최적화 중...
                </span>
              </div>
            ) : (
              <>
                <div className="w-11 h-11 rounded-full bg-neutral-200/80 flex items-center justify-center mb-2.5 text-neutral-600">
                  <span className="material-symbols-outlined text-[24px]">
                    add_a_photo
                  </span>
                </div>
                <span className="text-[13px] font-bold text-neutral-800">
                  클릭하여 사진 선택
                </span>
                <p className="text-[11px] text-neutral-500 mt-1 max-w-[280px]">
                  모바일 청첩장 캡처, 선물 인증샷, 영수증, 계좌 이체 확인증 등을 첨부하세요
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Section: 보답 예정일 알림 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 flex flex-col space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-neutral-700">
              alarm
            </span>
            <div className="flex flex-col">
              <span className="text-[14px] font-bold text-neutral-900">
                보답 예정일 알림
              </span>
              <span className="text-[11px] text-neutral-500">
                마음을 잊지 않도록 알림을 예약합니다
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEnableReminder(!enableReminder)}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-200 ease-in-out ${
              enableReminder ? 'bg-black' : 'bg-neutral-300'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                enableReminder ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {enableReminder && (
          <div className="flex flex-col space-y-3 pt-1">
            {/* 1. Target event title */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-bold text-neutral-800">
                  알림 대상 / 기념일 명칭
                </label>
                <span className="text-[11px] text-neutral-400">
                  직접 수정 가능
                </span>
              </div>
              <input
                type="text"
                value={reminderEventTitle}
                onChange={(e) => setReminderEventTitle(e.target.value)}
                placeholder="예: 보답 예정일, 다음 생일, 결혼기념일 등"
                className="w-full py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-[13px] font-semibold text-neutral-900 focus:outline-hidden focus:border-black"
              />
              <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto no-scrollbar">
                {['보답 예정일', '생일', '결혼기념일', '출산/돌잔치', '승진/개업'].map((titlePreset) => (
                  <button
                    key={titlePreset}
                    type="button"
                    onClick={() => setReminderEventTitle(titlePreset)}
                    className={`px-2 py-0.5 text-[11px] font-medium rounded-md border transition-all cursor-pointer shrink-0 ${
                      reminderEventTitle === titlePreset
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    {titlePreset}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Target event date */}
            <div className="flex flex-col space-y-1.5">
              <label className="text-[12px] font-bold text-neutral-800">
                행사 / 보답 기준일
              </label>
              <input
                type="date"
                value={targetEventDate}
                onChange={(e) => setTargetEventDate(e.target.value)}
                className="w-full py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-[13px] font-semibold text-neutral-900 focus:outline-hidden focus:border-black cursor-pointer"
              />
              <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto no-scrollbar">
                <span className="text-[11px] text-neutral-400 shrink-0">빠른 기준일:</span>
                {[
                  { label: '+1개월', months: 1 },
                  { label: '+3개월', months: 3 },
                  { label: '+6개월', months: 6 },
                  { label: '+1년', months: 12 },
                ].map((item) => {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        const d = new Date();
                        d.setMonth(d.getMonth() + item.months);
                        const y = d.getFullYear();
                        const m = String(d.getMonth() + 1).padStart(2, '0');
                        const day = String(d.getDate()).padStart(2, '0');
                        setTargetEventDate(`${y}-${m}-${day}`);
                      }}
                      className="px-2 py-0.5 text-[11px] font-medium rounded-md border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-100 transition-all cursor-pointer shrink-0"
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Reminder timing selection (다중 선택 가능: 7일전, 3일전, 1일전, 당일, 직접 지정) */}
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <label className="text-[12px] font-bold text-neutral-800">
                    알림 받을 시점
                  </label>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-neutral-100 text-neutral-700">
                    복수 선택 가능
                  </span>
                </div>
                <span className="text-[11px] text-neutral-400">
                  {selectedTimings.length}개 선택됨
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { label: '7일 전', value: 7 as ReminderTiming, sub: 'D-7' },
                  { label: '3일 전', value: 3 as ReminderTiming, sub: 'D-3' },
                  { label: '1일 전', value: 1 as ReminderTiming, sub: 'D-1' },
                  { label: '당일', value: 0 as ReminderTiming, sub: 'D-Day' },
                  { label: '직접 지정', value: 'custom' as ReminderTiming, sub: '선택' },
                ].map((item) => {
                  const isSelected = selectedTimings.includes(item.value);
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => toggleTiming(item.value)}
                      className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-black text-white border-black shadow-xs font-bold'
                          : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50 font-medium'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      )}
                      <span className="text-[12px] leading-none whitespace-nowrap">{item.label}</span>
                      <span
                        className={`text-[10px] mt-0.5 leading-none ${
                          isSelected ? 'text-neutral-300' : 'text-neutral-400'
                        }`}
                      >
                        {item.sub}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* If custom timing is selected */}
              {selectedTimings.includes('custom') && (
                <div className="mt-1.5 flex flex-col space-y-1">
                  <span className="text-[11px] text-neutral-500 font-medium">직접 지정할 알림 날짜:</span>
                  <input
                    type="date"
                    value={customReminderDate}
                    onChange={(e) => setCustomReminderDate(e.target.value)}
                    placeholder="알림 받을 날짜 직접 선택"
                    className="w-full py-2 px-3 bg-neutral-50 border border-neutral-200 rounded-xl text-[13px] font-semibold text-neutral-900 focus:outline-hidden focus:border-black cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* 4. Reminder Preview Card (Multiple Reminders Listed) */}
            {(() => {
              const allReminders = getAllCalculatedReminders();
              return (
                <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-col space-y-2 text-[13px] mt-1">
                  <div className="flex items-center justify-between border-b border-neutral-200/70 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[17px] text-neutral-900">
                        notifications_active
                      </span>
                      <span className="text-neutral-900 font-bold text-[13px]">
                        예약된 보답 알림 ({allReminders.length}회)
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-500">
                      오전 9:00 발송
                    </span>
                  </div>

                  <div className="flex flex-col space-y-1.5 divide-y divide-neutral-100">
                    {allReminders.map((rem, idx) => (
                      <div key={idx} className="flex items-center justify-between pt-1.5 first:pt-0">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                          <span className="text-neutral-800 font-semibold text-[12px]">
                            {rem.dDayText}
                          </span>
                        </div>
                        <span className="text-neutral-900 font-mono font-bold text-[12px] bg-white px-2 py-0.5 rounded-md border border-neutral-200">
                          {rem.formattedDate}
                        </span>
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-neutral-500 leading-snug pt-1">
                    {selectedContact ? `${selectedContact.name}님` : '상대방'}의{' '}
                    <span className="text-neutral-900 font-semibold">
                      '{reminderEventTitle || '보답'}'
                    </span>{' '}
                    일정에 맞춰 선택하신 모든 시점에 잊지 않도록 알림을 전해드립니다.
                  </p>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Big Save Button */}
      <div className="pt-2">
        <button
          type="submit"
          className="w-full py-4 rounded-xl bg-black text-white text-[15px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-md cursor-pointer hover:bg-neutral-900"
        >
          <span className="material-symbols-outlined text-[20px]">save</span>
          <span>보답 기록 저장하기</span>
        </button>
      </div>

      {/* Modal for adding a new contact while recording */}
      <AddContactModal
        isOpen={isAddContactModalOpen}
        initialName={addContactInitialName}
        onClose={() => setIsAddContactModalOpen(false)}
        onAddContact={handleCreatedContact}
      />
    </form>
  );
};
