/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  INITIAL_CONTACTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_RECORDS,
  LOGO_URL,
} from './data/initialData';
import { AppNotification, Contact, RecordItem, ScreenType } from './types';

import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { FloatingActionButton } from './components/FloatingActionButton';
import { HomeScreen } from './components/HomeScreen';
import { LedgerScreen } from './components/LedgerScreen';
import { RelationshipDetailScreen } from './components/RelationshipDetailScreen';
import { RecordEntryScreen } from './components/RecordEntryScreen';
import { CalendarScreen } from './components/CalendarScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { NotificationModal } from './components/NotificationModal';
import { AddContactModal } from './components/AddContactModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import {
  subscribeUserContacts,
  subscribeUserRecords,
  saveRecordToFirestore,
  saveContactToFirestore,
  saveBatchRecordsAndContactsToFirestore,
} from './lib/firebase';

function MainApp() {
  const { user, loading: authLoading } = useAuth();

  // Real user data state from Firestore
  const [realContacts, setRealContacts] = useState<Contact[]>([]);
  const [realRecords, setRealRecords] = useState<RecordItem[]>([]);

  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [recordEntryContactId, setRecordEntryContactId] = useState<string | undefined>(undefined);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Real-time Firestore sync for logged-in user
  useEffect(() => {
    if (!user) {
      setRealContacts([]);
      setRealRecords([]);
      return;
    }

    // Subscribe to Firestore Contacts - ONLY real user data
    const unsubscribeContacts = subscribeUserContacts(user.uid, (remoteContacts) => {
      setRealContacts(remoteContacts || []);
    });

    // Subscribe to Firestore Records - ONLY real user data
    const unsubscribeRecords = subscribeUserRecords(user.uid, (remoteRecords) => {
      setRealRecords(remoteRecords || []);
    });

    return () => {
      unsubscribeContacts();
      unsubscribeRecords();
    };
  }, [user]);

  // Keep selectedContact in sync with realContacts
  useEffect(() => {
    if (selectedContact) {
      const found = realContacts.find((c) => c.id === selectedContact.id);
      if (found) {
        setSelectedContact(found);
      } else {
        setSelectedContact(realContacts[0] || null);
      }
    } else if (realContacts.length > 0) {
      setSelectedContact(realContacts[0]);
    }
  }, [realContacts]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    setCurrentScreen('relationship-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickRecord = (contactId?: string) => {
    setRecordEntryContactId(contactId);
    setCurrentScreen('record-entry');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveRecord = async (newRecordData: Omit<RecordItem, 'id'>) => {
    if (!user) return;

    const newRecord: RecordItem = {
      ...newRecordData,
      id: `r-${Date.now()}`,
    };

    // Calculate updated contact metrics
    let updatedContactToSave: Contact | null = null;
    const updateContactList = (prevList: Contact[]) =>
      prevList.map((c) => {
        if (c.id === newRecord.contactId || c.name === newRecord.contactName) {
          const addSent = newRecord.type === 'sent' ? newRecord.amount : 0;
          const addRecv = newRecord.type === 'received' ? newRecord.amount : 0;
          const updatedSent = (c.totalSent || 0) + addSent;
          const updatedRecv = (c.totalReceived || 0) + addRecv;
          const updatedBalance = updatedRecv - updatedSent;

          const updated: Contact = {
            ...c,
            exchangeCount: (c.exchangeCount || 0) + 1,
            totalSent: updatedSent,
            totalReceived: updatedRecv,
            netBalance: updatedBalance,
            lastEventType: newRecord.category,
            lastExchangeDate: newRecord.date,
            status:
              updatedBalance === 0
                ? '동률'
                : updatedBalance > 0
                ? '보답권장'
                : '마음전달완료',
          };
          updatedContactToSave = updated;
          return updated;
        }
        return c;
      });

    // Save directly to Firestore database
    try {
      await saveRecordToFirestore(user.uid, newRecord);
      if (updatedContactToSave) {
        await saveContactToFirestore(user.uid, updatedContactToSave);
      }
      setRealRecords((prev) => [newRecord, ...prev]);
      setRealContacts((prev) => updateContactList(prev));

      // Generate notifications for scheduled reminder(s)
      const rDates = newRecord.reminderDates && newRecord.reminderDates.length > 0
        ? newRecord.reminderDates
        : newRecord.reminderDate
        ? [newRecord.reminderDate]
        : [];

      if (rDates.length > 0) {
        const newNotifs: AppNotification[] = rDates.map((rDate, idx) => {
          const offsetVal =
            newRecord.reminderOffsets && newRecord.reminderOffsets[idx] !== undefined
              ? newRecord.reminderOffsets[idx]
              : newRecord.reminderOffset;

          const offsetLabel =
            offsetVal === 0
              ? '당일'
              : typeof offsetVal === 'number'
              ? `${offsetVal}일 전`
              : '지정일';

          return {
            id: `n-${Date.now()}-${idx}`,
            title: `[알림 예약] ${newRecord.contactName}님 ${newRecord.reminderTitle || '보답'} (${offsetLabel})`,
            message: `${rDate}에 ${newRecord.contactName}님께 전할 보답 알림이 예약되었습니다.`,
            time: '방금 전',
            read: false,
            type: 'd-day',
            contactId: newRecord.contactId,
          };
        });
        setNotifications((prev) => [...newNotifs, ...prev]);
      }

      showToast(
        rDates.length > 1
          ? `보답 기록과 ${rDates.length}개의 알림이 예약되었습니다.`
          : rDates.length === 1
          ? '보답 기록과 알림이 예약되었습니다.'
          : '보답 기록이 저장되었습니다.'
      );
    } catch (err) {
      console.error('Error saving record to Firestore:', err);
      showToast('저장 중 오류가 발생했습니다.');
    }
  };

  const handleBatchImportSuccess = async (
    newRecordsData: Omit<RecordItem, 'id'>[],
    newOrUpdatedContacts: Contact[]
  ) => {
    if (!user) return;
    try {
      const fullRecords: RecordItem[] = newRecordsData.map((r, idx) => ({
        ...r,
        id: `r-excel-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
      }));

      await saveBatchRecordsAndContactsToFirestore(user.uid, fullRecords, newOrUpdatedContacts);

      setRealRecords((prev) => [...fullRecords, ...prev]);
      setRealContacts(newOrUpdatedContacts);
      showToast(`장부 기록 ${fullRecords.length}건이 성공적으로 등록되었습니다.`);
      setCurrentScreen('ledger');
    } catch (err) {
      console.error('Error in handleBatchImportSuccess:', err);
      showToast('일괄 등록 중 오류가 발생했습니다.');
    }
  };

  const handleAddContact = async (newContact: Contact) => {
    if (!user) return;
    try {
      await saveContactToFirestore(user.uid, newContact);
      setRealContacts((prev) => [newContact, ...prev]);
      showToast(`${newContact.name}님이 등록되었습니다.`);
    } catch (err) {
      console.error('Error saving contact to Firestore:', err);
      showToast('인연 등록 중 오류가 발생했습니다.');
    }
  };

  const handleSelectNotification = (notif: AppNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    setIsNotificationOpen(false);

    if (notif.contactId) {
      const contact = realContacts.find((c) => c.id === notif.contactId);
      if (contact) {
        handleSelectContact(contact);
      }
    }
  };

  const handleClearNotifications = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Initial Auth Loading Spinner
  if (authLoading) {
    return (
      <div className="w-full max-w-[440px] mx-auto min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white shadow-md border border-neutral-100 flex items-center justify-center mb-4 p-2">
          <img src={LOGO_URL} alt="BODAP Logo" className="w-full h-full object-contain" />
        </div>
        <div className="w-6 h-6 border-2 border-neutral-300 border-t-black rounded-full animate-spin mb-3"></div>
        <p className="text-[14px] font-semibold text-neutral-800">
          보답(BODAP) 불러오는 중...
        </p>
      </div>
    );
  }

  // Without authentication, show Login / Register screen directly (no guest exploration bypass)
  if (!user) {
    return (
      <LoginScreen
        onSuccess={() => {
          showToast('성공적으로 로그인되었습니다.');
        }}
      />
    );
  }

  const userDisplayName =
    user.displayName || user.email?.split('@')[0] || '보답 회원';

  return (
    <div className="bg-[#f8f9fa] text-[#191c1d] flex flex-col min-h-screen antialiased selection:bg-black selection:text-white">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-black text-white text-[13px] font-medium px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[16px] text-emerald-400">
            check_circle
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Responsive Mobile Frame Container (max-w-[440px]) */}
      <div className="mx-auto w-full max-w-[440px] min-h-screen relative flex flex-col bg-[#f8f9fa] shadow-[0_0_50px_rgba(0,0,0,0.04)]">
        {/* Fixed Header */}
        <Header
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
          onOpenNotifications={() => setIsNotificationOpen(true)}
          unreadNotificationsCount={unreadCount}
        />

        {/* Screen Content Area with top padding for header and bottom for nav */}
        <main className="flex-1 flex flex-col relative w-full pt-18 pb-20 bg-[#f8f9fa] px-4">
          {currentScreen === 'home' && (
            <HomeScreen
              contacts={realContacts}
              records={realRecords}
              isDbConnected={true}
              userName={userDisplayName}
              onNavigate={setCurrentScreen}
              onSelectContact={handleSelectContact}
              onQuickRecord={handleQuickRecord}
            />
          )}

          {currentScreen === 'ledger' && (
            <LedgerScreen
              contacts={realContacts}
              onSelectContact={handleSelectContact}
              onNavigate={setCurrentScreen}
              onOpenAddContact={() => setIsAddContactOpen(true)}
              onOpenExcelImport={() => setIsExcelImportOpen(true)}
            />
          )}

          {currentScreen === 'relationship-detail' && (
            selectedContact ? (
              <RelationshipDetailScreen
                contact={selectedContact}
                records={realRecords}
                onNavigate={setCurrentScreen}
                onQuickRecord={handleQuickRecord}
              />
            ) : (
              <div className="py-10 text-center text-neutral-500">
                선택된 인연이 없습니다.
                <button
                  onClick={() => setCurrentScreen('ledger')}
                  className="mt-3 block mx-auto px-4 py-2 rounded-xl bg-black text-white text-xs font-semibold cursor-pointer"
                >
                  장부 목록으로 돌아가기
                </button>
              </div>
            )
          )}

          {currentScreen === 'record-entry' && (
            <RecordEntryScreen
              contacts={realContacts}
              preselectedContactId={recordEntryContactId}
              onSaveRecord={handleSaveRecord}
              onAddContact={handleAddContact}
              onNavigate={setCurrentScreen}
              onOpenExcelImport={() => setIsExcelImportOpen(true)}
            />
          )}

          {currentScreen === 'calendar' && (
            <CalendarScreen
              contacts={realContacts}
              onSelectContact={handleSelectContact}
              onNavigate={setCurrentScreen}
              onQuickRecord={handleQuickRecord}
            />
          )}

          {currentScreen === 'settings' && (
            <SettingsScreen />
          )}
        </main>

        {/* Floating Action Button for (+) on main screens */}
        {(currentScreen === 'home' ||
          currentScreen === 'ledger' ||
          currentScreen === 'calendar') && (
          <FloatingActionButton onClick={() => handleQuickRecord()} />
        )}

        {/* Fixed Bottom Navigation (only on primary screens) */}
        {(currentScreen === 'home' ||
          currentScreen === 'ledger' ||
          currentScreen === 'calendar' ||
          currentScreen === 'settings') && (
          <BottomNav
            currentScreen={currentScreen}
            onNavigate={(screen) => {
              setCurrentScreen(screen);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* Notifications Modal */}
        <NotificationModal
          notifications={notifications}
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
          onSelectNotification={handleSelectNotification}
          onClearAll={handleClearNotifications}
        />

        {/* Add Contact Modal */}
        <AddContactModal
          isOpen={isAddContactOpen}
          onClose={() => setIsAddContactOpen(false)}
          onAddContact={handleAddContact}
        />

        {/* Excel Import Modal */}
        <ExcelImportModal
          isOpen={isExcelImportOpen}
          onClose={() => setIsExcelImportOpen(false)}
          existingContacts={realContacts}
          onImportSuccess={handleBatchImportSuccess}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
