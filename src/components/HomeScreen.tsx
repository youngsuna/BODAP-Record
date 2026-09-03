import React from 'react';
import { Contact, RecordItem, ScreenType } from '../types';

interface HomeScreenProps {
  contacts: Contact[];
  records: RecordItem[];
  isDbConnected: boolean;
  userName?: string;
  onNavigate: (screen: ScreenType) => void;
  onSelectContact: (contact: Contact) => void;
  onQuickRecord: (contactId?: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  contacts,
  records,
  isDbConnected,
  userName = '사용자',
  onNavigate,
  onSelectContact,
  onQuickRecord,
}) => {
  // Dynamic monthly calculation
  const totalSent = records
    .filter((r) => r.type === 'sent')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalReceived = records
    .filter((r) => r.type === 'received')
    .reduce((sum, r) => sum + r.amount, 0);

  // Reminders: contacts with upcomingEvent or status === '보답권장'
  const contactsWithUpcoming = contacts.filter((c) => c.upcomingEvent);
  const contactsNeedingReciprocation = contacts.filter((c) => c.status === '보답권장');
  const totalTodoCount = contactsWithUpcoming.length + contactsNeedingReciprocation.length;

  // Recent feeds
  const recentFeeds = records.slice(0, 5);

  const todayStr = `${new Date().getMonth() + 1}월 ${new Date().getDate()}일`;

  return (
    <div className="flex flex-col w-full space-y-4 pb-8">
      {/* Personal Warm Greeting */}
      <section className="flex flex-col space-y-1 pt-1">
        <div className="flex items-center justify-end">
          <span className="text-[12px] font-medium text-neutral-500">{todayStr}</span>
        </div>
        <div>
          <h2 className="text-[22px] font-bold text-neutral-900 tracking-tight leading-tight">
            안녕하세요, {userName}님 👋
          </h2>
          <p className="text-[13px] text-neutral-600 mt-0.5 leading-normal">
            {totalTodoCount > 0 ? (
              <>
                이번 달 챙겨야 할 소중한 인연이{' '}
                <span className="font-semibold text-black underline underline-offset-4 decoration-black/30">
                  {totalTodoCount}건
                </span>{' '}
                있어요.
              </>
            ) : (
              <>소중한 인연과의 경조사 및 보답 내역을 관리해 보세요.</>
            )}
          </p>
        </div>
      </section>

      {/* Section 1: Monthly Summary Bento Card */}
      <section className="rounded-2xl bg-[#1c1b1b] text-white p-5 shadow-md relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none"></div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-neutral-300">
              insights
            </span>
            <h3 className="text-[16px] font-semibold tracking-tight text-white">
              보답 요약 ({new Date().getMonth() + 1}월)
            </h3>
          </div>
        </div>

        {/* 3-Col Key Metrics */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
          <div className="flex flex-col py-1">
            <span className="text-[11px] text-neutral-400">예정 일정</span>
            <span className="text-[18px] font-bold text-white mt-1">
              {totalTodoCount}
              <span className="text-xs font-normal ml-0.5 text-neutral-300">건</span>
            </span>
          </div>
          <div className="flex flex-col py-1">
            <span className="text-[11px] text-neutral-400">보낸 마음</span>
            <span className="text-[17px] font-semibold text-white mt-1">
              {totalSent >= 10000
                ? `${Math.round(totalSent / 10000)}만`
                : totalSent.toLocaleString()}
              <span className="text-xs font-normal text-neutral-300">원</span>
            </span>
          </div>
          <div className="flex flex-col py-1">
            <span className="text-[11px] text-neutral-400">받은 마음</span>
            <span className="text-[17px] font-semibold text-neutral-300 mt-1">
              {totalReceived >= 10000
                ? `${Math.round(totalReceived / 10000)}만`
                : totalReceived.toLocaleString()}
              <span className="text-xs font-normal text-neutral-400">원</span>
            </span>
          </div>
        </div>
      </section>

      {/* Section 2: D-Day & Reciprocal Obligation Reminders */}
      <section className="flex flex-col space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-[16px] font-semibold text-neutral-900 flex items-center gap-1.5">
            <span>To-Do 리마인더</span>
            {totalTodoCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-neutral-200 text-neutral-700 text-[11px] flex items-center justify-center font-bold">
                {totalTodoCount}
              </span>
            )}
          </h3>
          <button
            onClick={() => onNavigate('calendar')}
            className="text-[12px] text-neutral-500 hover:text-black flex items-center transition-colors cursor-pointer"
          >
            캘린더 보기
            <span className="material-symbols-outlined text-[16px] ml-0.5">chevron_right</span>
          </button>
        </div>

        {/* Dynamic List of Reminders */}
        {contactsWithUpcoming.map((contact) => {
          const event = contact.upcomingEvent!;
          return (
            <div
              key={`upcoming-${contact.id}`}
              onClick={() => onSelectContact(contact)}
              className="p-4 rounded-xl bg-white shadow-xs border border-neutral-100 flex flex-col space-y-2.5 transition-all active:scale-[0.99] hover:border-neutral-300 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-black text-white text-[11px] font-bold tracking-tight shrink-0">
                    {event.dDay}
                  </span>
                  <span className="text-[15px] font-semibold text-neutral-900 truncate">
                    {event.title}
                  </span>
                  {(contact.importantDate?.recurrence || event.recurrence) && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 shrink-0">
                      {(contact.importantDate?.recurrence || event.recurrence) === 'yearly'
                        ? '매년'
                        : (contact.importantDate?.recurrence || event.recurrence) === 'monthly'
                        ? '매달'
                        : '1번만'}
                    </span>
                  )}
                </div>
                <span className="text-[12px] text-neutral-500 font-medium shrink-0">{event.date}</span>
              </div>

              {event.location && (
                <div className="flex items-center gap-1.5 text-neutral-500 text-[12px]">
                  <span className="material-symbols-outlined text-[15px]">location_on</span>
                  <span>{event.location}</span>
                </div>
              )}

              <div className="mt-1 p-2.5 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-black">
                    {event.recommendedAmount ? 'handshake' : 'notifications'}
                  </span>
                  <span className="text-[12px] text-neutral-800">
                    {event.recommendedAmount ? (
                      <>
                        추천 축의금 <strong className="text-black font-semibold text-[13px]">{event.recommendedAmount.toLocaleString()}원</strong>
                      </>
                    ) : (
                      <>
                        <span className="text-neutral-600 font-medium">{contact.name}</span>
                        {contact.title ? ` (${contact.title})` : ''} · 보답 챙김 일정
                      </>
                    )}
                  </span>
                </div>
                {event.lastReceivedAmount ? (
                  <span className="text-[11px] text-neutral-600 bg-neutral-200/70 px-2 py-0.5 rounded font-medium">
                    받았던 금액: {Math.round(event.lastReceivedAmount / 10000)}만원
                  </span>
                ) : (
                  <span className="text-[11px] text-neutral-500 font-medium">
                    {contact.organization}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Reciprocal obligations */}
        {contactsNeedingReciprocation.map((contact) => (
          <div
            key={`recip-${contact.id}`}
            className="p-4 rounded-xl bg-neutral-100/90 border border-neutral-200/80 shadow-xs flex flex-col space-y-2.5 relative overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                <span className="text-[11px] font-bold text-neutral-700 tracking-wider">
                  보답 권장 알림
                </span>
              </div>
              <span className="text-[11px] text-neutral-500 font-medium">
                순 밸런스 +{contact.netBalance.toLocaleString()}원
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-neutral-900">
                {contact.name} ({contact.title || contact.organization})
              </span>
              <p className="text-[12px] text-neutral-600 mt-1 leading-relaxed">
                {contact.name}님에게서 받은 마음이 남아있습니다. 다가오는 행사나 감사 선물로 보답해 보세요.
              </p>
            </div>
            <div className="pt-1 flex items-center justify-end">
              <button
                onClick={() => onQuickRecord(contact.id)}
                className="w-full py-2 px-3 rounded-lg bg-black text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform hover:bg-neutral-800 cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                <span>바로 보답 기록하기</span>
              </button>
            </div>
          </div>
        ))}

        {/* Empty state when no todo reminders exist */}
        {totalTodoCount === 0 && (
          <div className="p-4 rounded-xl bg-white border border-neutral-100 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                <span className="material-symbols-outlined text-[18px]">event_available</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold text-neutral-800">
                  예정된 보답 리마인더가 없습니다
                </span>
                <span className="text-[11px] text-neutral-500">
                  인연을 추가하거나 보답 일정을 등록해 관리하세요
                </span>
              </div>
            </div>
            <button
              onClick={() => onQuickRecord()}
              className="px-3 py-1.5 rounded-lg bg-black text-white text-[11px] font-semibold hover:bg-neutral-800 transition-colors shrink-0"
            >
              + 기록
            </button>
          </div>
        )}
      </section>

      {/* Section 3: Recent Mutual Feed */}
      <section className="flex flex-col space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <h3 className="text-[16px] font-semibold text-neutral-900">최근 주고받은 내역</h3>
          {recentFeeds.length > 0 && (
            <button
              onClick={() => onNavigate('ledger')}
              className="text-[12px] text-neutral-500 hover:text-black flex items-center transition-colors cursor-pointer"
            >
              전체보기
              <span className="material-symbols-outlined text-[16px] ml-0.5">chevron_right</span>
            </button>
          )}
        </div>

        {recentFeeds.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-xs flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-11 h-11 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
              <span className="material-symbols-outlined text-[22px]">history_edu</span>
            </div>
            <p className="text-[14px] font-bold text-neutral-800">
              등록된 보답 내역이 없습니다
            </p>
            <p className="text-[12px] text-neutral-500 max-w-[260px]">
              보내거나 받은 축의금, 조의금, 선물 등 보답 내역을 기록하여 상호 부조 장부를 시작해 보세요.
            </p>
            <button
              onClick={() => onQuickRecord()}
              className="mt-1 px-4 py-2 rounded-xl bg-black text-white text-[12px] font-semibold hover:bg-neutral-800 active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              + 첫 보답 기록하기
            </button>
          </div>
        ) : (
          <div className="flex flex-col space-y-2">
            {recentFeeds.map((item) => {
              const isReceived = item.type === 'received';
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-white border border-neutral-100 shadow-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                        isReceived
                          ? 'bg-neutral-200 text-neutral-800'
                          : 'bg-neutral-100 text-neutral-600'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[18px] ${
                          isReceived ? 'fill' : ''
                        }`}
                      >
                        {isReceived ? 'call_received' : 'call_made'}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[14px] font-bold text-neutral-900 truncate">
                          {item.contactName}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-neutral-200/70 text-neutral-700 font-medium">
                          {item.category}
                        </span>
                        {item.photoUrl && (
                          <span className="material-symbols-outlined text-[13px] text-neutral-500" title="사진 첨부됨">
                            photo_camera
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-500 truncate mt-0.5">
                        {item.itemTitle}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0 pl-2">
                    <span
                      className={`text-[13px] font-bold font-mono ${
                        isReceived ? 'text-black' : 'text-neutral-800'
                      }`}
                    >
                      {isReceived ? '+' : '-'}
                      {item.amount.toLocaleString()}원
                    </span>
                    <span className="text-[10px] text-neutral-400 mt-0.5">
                      {item.relativeTime || item.date}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Thoughtful Mini Encouragement Banner */}
      <div className="p-3 rounded-xl bg-neutral-100/70 border border-neutral-200/60 flex items-center justify-between text-neutral-600">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-black text-[18px] fill">
            verified
          </span>
          <p className="text-[12px] leading-snug">
            주고받은 마음을 잊지 않는 <strong className="text-black font-semibold">따뜻한 예절</strong>을 실천 중입니다.
          </p>
        </div>
      </div>
    </div>
  );
};
