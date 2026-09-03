export type ScreenType = 'home' | 'ledger' | 'calendar' | 'settings' | 'relationship-detail' | 'record-entry';

export type CategoryType = '회사' | '친구' | '친척' | '모임/기타';

export type EventCategory = '결혼식' | '부고 / 조의' | '생일 축하' | '승진 / 영전' | '출산 / 돌잔치' | '기타 선물';

export type DeliveryFormat = '현금 / 봉투' | '물품 / 기프티콘';

export type RecordDirection = 'received' | 'sent' | 'planned';

export type RecurrenceType = 'once' | 'yearly' | 'monthly';

export interface ContactImportantDate {
  date: string; // YYYY-MM-DD
  title?: string;
  recurrence: RecurrenceType; // 'once' (1번만) | 'yearly' (매년) | 'monthly' (매달)
}

export interface PhotoMoment {
  id: string;
  title: string;
  imageUrl: string;
  tag: string;
}

export interface RecordItem {
  id: string;
  contactId: string;
  contactName: string;
  type: RecordDirection;
  date: string;
  relativeTime?: string;
  category: EventCategory;
  format: DeliveryFormat;
  amount: number;
  itemTitle: string;
  itemDescription?: string;
  memo?: string;
  photoUrl?: string;
  photoLabel?: string;
  location?: string;
  reminderDate?: string;
  reminderTitle?: string;
  reminderOffset?: number | string;
  reminderDates?: string[];
  reminderOffsets?: (number | string)[];
}

export interface Contact {
  id: string;
  name: string;
  title: string;
  organization: string;
  category: CategoryType;
  tags: string[];
  avatar: string;
  birthday?: string;
  preferences?: string;
  status: '보답예정' | '보답권장' | '마음전달완료' | '동률';
  exchangeCount: number;
  totalSent: number;
  totalReceived: number;
  netBalance: number;
  lastEventType?: string;
  lastExchangeDate?: string;
  relationship?: string;
  importantDate?: ContactImportantDate;
  upcomingEvent?: {
    title: string;
    dDay: string;
    date: string;
    location?: string;
    recommendedAmount?: number;
    lastReceivedAmount?: number;
    lastReceivedGift?: string;
    recurrence?: RecurrenceType;
  };
  pendingObligation?: {
    title: string;
    elapsed: string;
    description: string;
    excessReceived?: number;
  };
  photos?: PhotoMoment[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'd-day' | 'obligation' | 'sync';
  contactId?: string;
}
