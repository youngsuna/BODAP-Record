import { ContactImportantDate, RecurrenceType } from '../types';

export function calculateUpcomingEventFromImportantDate(
  importantDate: ContactImportantDate,
  contactName?: string
) {
  const { date, title, recurrence } = importantDate;
  if (!date) return undefined;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const parts = date.split('-');
  if (parts.length < 3) return undefined;

  const origYear = parseInt(parts[0], 10);
  const origMonth = parseInt(parts[1], 10) - 1; // 0-indexed
  const origDay = parseInt(parts[2], 10);

  let targetDate: Date;
  let formattedDisplayDate = '';

  if (recurrence === 'yearly') {
    // Current year's occurrence
    let candidate = new Date(now.getFullYear(), origMonth, origDay);
    if (candidate.getTime() < today.getTime()) {
      // already passed this year, pick next year
      candidate = new Date(now.getFullYear() + 1, origMonth, origDay);
    }
    targetDate = candidate;
    formattedDisplayDate = `${targetDate.getMonth() + 1}월 ${targetDate.getDate()}일 (매년)`;
  } else if (recurrence === 'monthly') {
    // Current month's occurrence
    let candidate = new Date(now.getFullYear(), now.getMonth(), origDay);
    if (candidate.getTime() < today.getTime()) {
      // already passed this month, pick next month
      candidate = new Date(now.getFullYear(), now.getMonth() + 1, origDay);
    }
    targetDate = candidate;
    formattedDisplayDate = `매월 ${origDay}일`;
  } else {
    // 'once'
    targetDate = new Date(origYear, origMonth, origDay);
    formattedDisplayDate = `${targetDate.getFullYear()}년 ${targetDate.getMonth() + 1}월 ${targetDate.getDate()}일`;
  }

  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let dDay = '';
  if (diffDays === 0) {
    dDay = 'D-Day';
  } else if (diffDays > 0) {
    dDay = `D-${diffDays}`;
  } else {
    dDay = `D+${Math.abs(diffDays)}`;
  }

  const defaultTitle =
    recurrence === 'yearly'
      ? `${contactName ? contactName + ' ' : ''}기념일/생일`
      : recurrence === 'monthly'
      ? `${contactName ? contactName + ' ' : ''}매달 정기 챙김`
      : `${contactName ? contactName + ' ' : ''}예정 일정`;

  return {
    title: title?.trim() || defaultTitle,
    dDay,
    date: formattedDisplayDate,
    recurrence,
  };
}

export function getRecurrenceLabel(recurrence?: RecurrenceType): string {
  switch (recurrence) {
    case 'once':
      return '1번만';
    case 'yearly':
      return '매년 반복';
    case 'monthly':
      return '매달 챙김';
    default:
      return '';
  }
}
