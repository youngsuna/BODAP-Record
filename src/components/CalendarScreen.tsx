import React, { useState } from 'react';
import { Contact, ScreenType } from '../types';

interface CalendarScreenProps {
  contacts: Contact[];
  onSelectContact: (contact: Contact) => void;
  onNavigate: (screen: ScreenType) => void;
  onQuickRecord: (contactId?: string) => void;
}

export const CalendarScreen: React.FC<CalendarScreenProps> = ({
  contacts,
  onSelectContact,
  onQuickRecord,
}) => {
  const today = new Date();
  const [currentYear] = useState(today.getFullYear());
  const [currentMonth] = useState(today.getMonth() + 1);

  // Derive dynamic calendar events from contacts
  const dynamicEvents = contacts
    .filter((c) => c.upcomingEvent)
    .map((c) => {
      const ev = c.upcomingEvent!;
      // Parse day number if available from string like "5월 18일" or ISO
      let dayNumber = 15;
      const dayMatch = ev.date.match(/(\d+)일/);
      if (dayMatch) {
        dayNumber = parseInt(dayMatch[1], 10);
      }
      return {
        id: `ev-${c.id}`,
        title: ev.title,
        date: ev.date,
        day: dayNumber,
        location: ev.location || '장소 미지정',
        dDay: ev.dDay,
        badge: ev.recommendedAmount
          ? `추천 ${(ev.recommendedAmount / 10000)}만원`
          : c.importantDate?.recurrence === 'yearly'
          ? '매년 반복'
          : c.importantDate?.recurrence === 'monthly'
          ? '매달 챙김'
          : '보답 챙김',
        contact: c,
      };
    });

  // Calendar days grid calculation
  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);
  const leadingBlanks = Array.from({ length: 3 }, (_, i) => null);

  return (
    <div className="flex flex-col w-full space-y-4 pb-20">
      {/* Calendar Header */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-neutral-800">
              calendar_month
            </span>
            <h2 className="text-[17px] font-bold text-neutral-900">
              {currentYear}년 {currentMonth}월
            </h2>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 text-center text-[12px] font-semibold text-neutral-400">
          <span className="text-red-500">일</span>
          <span>월</span>
          <span>화</span>
          <span>수</span>
          <span>목</span>
          <span>금</span>
          <span className="text-blue-500">토</span>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-[13px]">
          {leadingBlanks.map((_, idx) => (
            <div key={`blank-${idx}`} className="h-9" />
          ))}
          {daysInMonth.map((day) => {
            const hasEvent = dynamicEvents.some((e) => e.day === day);
            const isToday = day === today.getDate();

            return (
              <div
                key={day}
                className={`h-9 flex flex-col items-center justify-center rounded-lg relative cursor-pointer ${
                  isToday
                    ? 'bg-neutral-200/80 font-bold text-black'
                    : hasEvent
                    ? 'bg-black text-white font-bold shadow-xs'
                    : 'hover:bg-neutral-100 text-neutral-700'
                }`}
              >
                <span>{day}</span>
                {hasEvent && !isToday && (
                  <span className="w-1 h-1 rounded-full bg-white mt-0.5"></span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events List */}
      <section className="flex flex-col space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[16px] font-bold text-neutral-900">
            예정된 보답 일정 ({dynamicEvents.length}건)
          </h3>
          <button
            onClick={() => onQuickRecord()}
            className="text-[12px] text-black font-semibold flex items-center gap-0.5 hover:underline cursor-pointer"
          >
            + 일정 추가
          </button>
        </div>

        {dynamicEvents.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 shadow-xs border border-neutral-100 flex flex-col items-center justify-center text-center space-y-2">
            <span className="material-symbols-outlined text-[24px] text-neutral-400">
              event_busy
            </span>
            <p className="text-[14px] font-bold text-neutral-800">
              예정된 보답 일정이 없습니다
            </p>
            <p className="text-[12px] text-neutral-500">
              인연 상세 화면이나 + 버튼에서 예정된 보답 일정을 등록해 보세요.
            </p>
          </div>
        ) : (
          <div className="flex flex-col space-y-2.5">
            {dynamicEvents.map((ev) => (
              <div
                key={ev.id}
                onClick={() => onSelectContact(ev.contact)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 flex flex-col space-y-2 active:scale-[0.99] transition-all hover:border-neutral-300 cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-black text-white">
                      {ev.dDay}
                    </span>
                    <h4 className="text-[15px] font-bold text-neutral-900">
                      {ev.title}
                    </h4>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 font-medium">
                    {ev.badge}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[12px] text-neutral-500">
                  <span className="material-symbols-outlined text-[15px]">schedule</span>
                  <span>{ev.date}</span>
                </div>

                {ev.location && (
                  <div className="flex items-center gap-2 text-[12px] text-neutral-500">
                    <span className="material-symbols-outlined text-[15px]">location_on</span>
                    <span>{ev.location}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
