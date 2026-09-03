import React, { useState } from 'react';
import { CategoryType, Contact, ScreenType } from '../types';

interface LedgerScreenProps {
  contacts: Contact[];
  onSelectContact: (contact: Contact) => void;
  onNavigate: (screen: ScreenType) => void;
  onOpenAddContact: () => void;
  onOpenExcelImport: () => void;
}

export const LedgerScreen: React.FC<LedgerScreenProps> = ({
  contacts,
  onSelectContact,
  onNavigate,
  onOpenAddContact,
  onOpenExcelImport,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | '전체'>('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'recent' | 'amount' | 'pending' | 'name'>('recent');

  const categories: { label: CategoryType | '전체'; count: number }[] = [
    { label: '전체', count: contacts.length },
    { label: '회사', count: contacts.filter((c) => c.category === '회사').length },
    { label: '친구', count: contacts.filter((c) => c.category === '친구').length },
    { label: '친척', count: contacts.filter((c) => c.category === '친척').length },
    { label: '모임/기타', count: contacts.filter((c) => c.category === '모임/기타').length },
  ];

  const filteredContacts = contacts
    .filter((c) => {
      const matchesCategory = selectedCategory === '전체' || c.category === selectedCategory;
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortOrder === 'name') return a.name.localeCompare(b.name);
      if (sortOrder === 'amount') return b.totalSent + b.totalReceived - (a.totalSent + a.totalReceived);
      if (sortOrder === 'pending') {
        if (a.status === '보답권장' && b.status !== '보답권장') return -1;
        if (b.status === '보답권장' && a.status !== '보답권장') return 1;
      }
      return 0; // Default recent exchange
    });

  // Calculate totals
  const totalSentAll = contacts.reduce((sum, c) => sum + c.totalSent, 0);
  const totalReceivedAll = contacts.reduce((sum, c) => sum + c.totalReceived, 0);
  const netBalance = totalSentAll - totalReceivedAll;
  const sentPercent = Math.round((totalSentAll / (totalSentAll + totalReceivedAll || 1)) * 100);
  const receivedPercent = 100 - sentPercent;

  return (
    <div className="flex flex-col w-full space-y-4 pb-20">
      {/* Quick Action: Excel Batch Import Banner */}
      <div className="bg-gradient-to-r from-emerald-50 to-neutral-50 border border-emerald-200/80 rounded-2xl p-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">table_chart</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-neutral-900 leading-tight">
              엑셀로 장부 일괄 등록
            </span>
            <span className="text-[11px] text-neutral-500">
              표준 양식 다운로드 & 한 번에 가져오기
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenExcelImport}
          className="px-3 py-1.5 rounded-xl bg-black text-white hover:bg-neutral-800 text-[12px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
        >
          <span>엑셀 등록</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <span className="absolute left-3.5 top-3 material-symbols-outlined text-[20px] text-neutral-400">
          search
        </span>
        <input
          type="text"
          placeholder="이름, 소속, 태그 검색 (예: 김서연, 카카오, 고등학교)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200/90 rounded-2xl text-[13px] text-neutral-800 placeholder-neutral-400 focus:outline-hidden focus:border-black shadow-xs transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2.5 text-neutral-400 hover:text-black"
          >
            ✕
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.label;
          return (
            <button
              key={cat.label}
              onClick={() => setSelectedCategory(cat.label)}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-semibold tracking-tight whitespace-nowrap transition-all active:scale-95 cursor-pointer ${
                isSelected
                  ? 'bg-black text-white shadow-xs'
                  : 'bg-white text-neutral-600 border border-neutral-200/80 hover:bg-neutral-50'
              }`}
            >
              {cat.label} <span className={`text-[11px] ml-0.5 ${isSelected ? 'text-neutral-300' : 'text-neutral-400'}`}>{cat.count}</span>
            </button>
          );
        })}
      </div>

      {/* Subheader: Count & Sort */}
      <div className="flex items-center justify-between px-1 text-[13px]">
        <div className="flex items-center gap-1 text-neutral-700 font-medium">
          <span className="material-symbols-outlined text-[16px] text-neutral-500">sync_alt</span>
          <span>총 {filteredContacts.length}명의 인연</span>
        </div>
        <div className="relative">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            aria-label="정렬 순서"
            className="text-[12px] font-medium text-neutral-600 bg-transparent border-none focus:outline-hidden cursor-pointer"
          >
            <option value="recent">최근 교환순 ⌵</option>
            <option value="pending">보답 필요순 ⌵</option>
            <option value="amount">교환 금액순 ⌵</option>
            <option value="name">가나다순 ⌵</option>
          </select>
        </div>
      </div>

      {/* Section: 상호 교환 균형도 */}
      <section className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[20px] text-neutral-800">
              balance
            </span>
            <h3 className="text-[16px] font-bold text-neutral-900">
              상호 교환 균형도
            </h3>
          </div>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
            상호 균형 상태
          </span>
        </div>

        {/* 2-Col Totals */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 flex flex-col">
            <span className="text-[12px] text-neutral-500">보낸 마음</span>
            <span className="text-[17px] font-bold text-neutral-900 font-mono mt-0.5">
              {totalSentAll.toLocaleString()}원
            </span>
          </div>
          <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100 flex flex-col">
            <span className="text-[12px] text-neutral-500">받은 마음</span>
            <span className="text-[17px] font-bold text-neutral-900 font-mono mt-0.5">
              {totalReceivedAll.toLocaleString()}원
            </span>
          </div>
        </div>

        {/* Dual Progress Meter */}
        <div className="pt-1">
          <div className="w-full h-2.5 bg-neutral-200 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-black transition-all duration-500"
              style={{ width: `${sentPercent}%` }}
            ></div>
            <div
              className="h-full bg-neutral-400 transition-all duration-500"
              style={{ width: `${receivedPercent}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-neutral-500 font-mono mt-1.5">
            <span>• 송부 누적 {sentPercent}%</span>
            <span className="font-semibold text-black">
              순 보답 잔액 {netBalance >= 0 ? `+${netBalance.toLocaleString()}원` : `${netBalance.toLocaleString()}원`}
            </span>
            <span>수령 누적 {receivedPercent}% •</span>
          </div>
        </div>
      </section>

      {/* Contact Cards List */}
      <div className="flex flex-col space-y-3">
        {contacts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-xs border border-neutral-100 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-13 h-13 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
              <span className="material-symbols-outlined text-[26px]">group_add</span>
            </div>
            <div className="flex flex-col space-y-1">
              <h3 className="text-[16px] font-bold text-neutral-900">
                등록된 인연이 없습니다
              </h3>
              <p className="text-[12px] text-neutral-500 max-w-[280px]">
                경조사를 함께 나눌 가족, 친구, 동료를 등록하고 주고받은 마음을 체계적으로 관리해 보세요.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={onOpenAddContact}
                className="px-4 py-2.5 rounded-xl bg-black text-white text-[13px] font-semibold hover:bg-neutral-800 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                <span>첫 인연 등록하기</span>
              </button>
            </div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-neutral-100 text-center text-neutral-500 text-[13px]">
            검색 조건에 맞는 인연이 없습니다.
          </div>
        ) : (
          filteredContacts.map((contact) => {
            const isPending = contact.status === '보답권장' || contact.netBalance > 0;
            const isPlanned = contact.status === '보답예정';

            return (
              <div
                key={contact.id}
                onClick={() => onSelectContact(contact)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 flex flex-col space-y-2.5 active:scale-[0.99] transition-all hover:border-neutral-300 cursor-pointer"
              >
                {/* Top info line */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={contact.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                      alt={contact.name}
                      className="w-11 h-11 rounded-full object-cover border border-neutral-100 shadow-2xs"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-[15px] font-bold text-neutral-900">
                          {contact.name}
                        </h4>
                        <span className="px-2 py-0.2 rounded-full text-[11px] font-medium bg-neutral-100 text-neutral-600">
                          {contact.tags?.[0] || contact.category}
                        </span>
                        <span
                          className={`px-2 py-0.2 rounded-full text-[11px] font-semibold ${
                            isPending
                              ? 'bg-red-50 text-red-600 border border-red-200/60'
                              : isPlanned
                              ? 'bg-neutral-100 text-neutral-800'
                              : 'bg-neutral-50 text-neutral-500'
                          }`}
                        >
                          {contact.status}
                        </span>
                      </div>
                      <span className="text-[12px] text-neutral-500 mt-0.5">
                        {contact.organization} {contact.title ? `· ${contact.title}` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status / Balance line */}
                <div className="pt-1 flex items-center justify-between text-[12px] border-t border-neutral-50">
                  <div className="flex items-center gap-1.5 text-neutral-700">
                    <span className="material-symbols-outlined text-[16px] text-neutral-500">
                      {contact.netBalance === 0 ? 'handshake' : contact.netBalance > 0 ? 'south_west' : 'north_east'}
                    </span>
                    <span className={contact.netBalance > 0 ? 'text-red-600 font-semibold' : 'text-neutral-700'}>
                      {contact.netBalance === 0
                        ? '상호 균형 상태'
                        : contact.netBalance > 0
                        ? `받은 마음 ${contact.netBalance.toLocaleString()}원 초과`
                        : `보낸 마음 ${Math.abs(contact.netBalance).toLocaleString()}원 초과`}
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-500 font-mono">
                    보냄 {contact.totalSent.toLocaleString()}원 / 받음 {contact.totalReceived.toLocaleString()}원
                  </span>
                </div>

                {/* Event / Action line */}
                <div className="p-2 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-between text-[11px]">
                  {contact.upcomingEvent ? (
                    <>
                      <div className="flex items-center gap-1.5 text-neutral-800 font-medium truncate">
                        <span className="material-symbols-outlined text-[14px] text-black shrink-0">event</span>
                        <span className="truncate">{contact.upcomingEvent.title}</span>
                        {(contact.importantDate?.recurrence || contact.upcomingEvent.recurrence) && (
                          <span className="text-[9px] px-1 py-0.5 bg-neutral-200/80 text-neutral-700 rounded shrink-0 font-semibold">
                            {(contact.importantDate?.recurrence || contact.upcomingEvent.recurrence) === 'yearly'
                              ? '매년'
                              : (contact.importantDate?.recurrence || contact.upcomingEvent.recurrence) === 'monthly'
                              ? '매달'
                              : '1회'}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-black bg-neutral-200/70 px-1.5 py-0.5 rounded shrink-0 ml-1">
                        {contact.upcomingEvent.dDay}
                      </span>
                    </>
                  ) : contact.lastEventType ? (
                    <>
                      <div className="flex items-center gap-1.5 text-neutral-700 truncate">
                        <span className="material-symbols-outlined text-[14px] text-neutral-500">history</span>
                        <span className="truncate">{contact.lastEventType}</span>
                      </div>
                      <span className="text-neutral-500 shrink-0 ml-1">
                        {contact.lastExchangeDate || '교환 이력 있음'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-neutral-500">보답 내역 없음</span>
                      <span className="text-neutral-400 font-medium">터치하여 기록하기</span>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PWA offline banner */}
      <div className="p-3 rounded-xl bg-neutral-100/80 border border-neutral-200/60 flex items-center gap-2 text-[12px] text-neutral-600">
        <span className="material-symbols-outlined text-[16px] text-neutral-500">cloud_done</span>
        <span>PWA 오프라인 모드에서도 로컬 캐시로 즉시 조회됩니다.</span>
      </div>

      {/* New Contact Registration Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-700">
            <span className="material-symbols-outlined text-[20px]">person_add</span>
          </div>
          <div className="flex flex-col">
            <h4 className="text-[14px] font-bold text-neutral-900">
              새로운 인연 등록
            </h4>
            <span className="text-[12px] text-neutral-500">
              연락처 동기화 또는 직접 입력하기
            </span>
          </div>
        </div>
        <button
          onClick={onOpenAddContact}
          className="px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-[13px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>추가</span>
          <span className="material-symbols-outlined text-[15px]">chevron_right</span>
        </button>
      </div>

      {/* Excel Batch Import Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">table_chart</span>
          </div>
          <div className="flex flex-col">
            <h4 className="text-[14px] font-bold text-neutral-900">
              엑셀 장부 일괄 가져오기
            </h4>
            <span className="text-[12px] text-neutral-500">
              표준 양식 다운로드 및 대량 기록 등록
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenExcelImport}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shadow-xs"
        >
          <span>가져오기</span>
          <span className="material-symbols-outlined text-[15px]">upload</span>
        </button>
      </div>
    </div>
  );
};
