import React, { useState } from 'react';
import { Contact, RecordItem, ScreenType } from '../types';

interface RelationshipDetailScreenProps {
  contact: Contact;
  records: RecordItem[];
  onNavigate: (screen: ScreenType) => void;
  onQuickRecord: (contactId: string) => void;
}

export const RelationshipDetailScreen: React.FC<RelationshipDetailScreenProps> = ({
  contact,
  records,
  onNavigate,
  onQuickRecord,
}) => {
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');
  const [showToast, setShowToast] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

  // Filter records for this contact
  const contactRecords = records.filter(
    (r) => r.contactId === contact.id || r.contactName === contact.name
  );

  const sortedRecords = [...contactRecords].sort((a, b) => {
    if (sortOrder === 'latest') {
      return b.date.localeCompare(a.date);
    }
    return a.date.localeCompare(b.date);
  });

  const receivedRecords = contactRecords.filter((r) => r.type === 'received');
  const sentRecords = contactRecords.filter((r) => r.type === 'sent');

  const totalReceived = receivedRecords.reduce((sum, r) => sum + r.amount, 0) || contact.totalReceived;
  const totalSent = sentRecords.reduce((sum, r) => sum + r.amount, 0) || contact.totalSent;
  const netDiff = totalReceived - totalSent;

  const triggerFeedback = (message: string) => {
    setShowToast(message);
    setTimeout(() => setShowToast(null), 2500);
  };

  return (
    <div className="flex flex-col w-full space-y-4 pb-12">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-black text-white text-[13px] px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-bounce">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          <span>{showToast}</span>
        </div>
      )}

      {/* Card 1: Contact Header & Preferences */}
      <section className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 flex flex-col space-y-3.5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={contact.avatar}
                alt={contact.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-neutral-100 shadow-sm"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black text-white text-[10px] flex items-center justify-center font-bold">
                ✓
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h2 className="text-[18px] font-bold text-neutral-900">
                  {contact.name}
                </h2>
                <span className="text-[14px] text-neutral-500 font-normal">
                  {contact.title}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                {contact.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-[11px] font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() => triggerFeedback('인연 정보 수정 메뉴가 열렸습니다.')}
            className="w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">more_vert</span>
          </button>
        </div>

        {/* Important Date & Preferences Card */}
        <div className="p-3 rounded-xl bg-neutral-50/90 border border-neutral-100 flex flex-col space-y-2 text-[13px]">
          {contact.importantDate && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-neutral-700">
                <span className="material-symbols-outlined text-[16px] text-neutral-500">event</span>
                <span>
                  {contact.importantDate.title || '챙길 일정'}:{' '}
                  <strong className="font-semibold text-neutral-900">
                    {contact.importantDate.date}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-neutral-200/80 text-neutral-800 text-[11px] font-semibold">
                  {contact.importantDate.recurrence === 'yearly'
                    ? '매년 반복'
                    : contact.importantDate.recurrence === 'monthly'
                    ? '매달 챙김'
                    : '1번만'}
                </span>
                {contact.upcomingEvent?.dDay && (
                  <span className="px-2 py-0.5 rounded-full bg-black text-white text-[11px] font-bold">
                    {contact.upcomingEvent.dDay}
                  </span>
                )}
              </div>
            </div>
          )}

          {contact.birthday && !contact.importantDate && (
            <div className="flex items-center gap-2 text-neutral-700">
              <span className="material-symbols-outlined text-[16px] text-neutral-500">cake</span>
              <span>
                생일:{' '}
                <strong className="font-semibold text-neutral-900">
                  {contact.birthday}
                </strong>
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-neutral-700">
            <span className="material-symbols-outlined text-[16px] text-neutral-500">sentiment_satisfied</span>
            <span>
              선호 취향:{' '}
              <span className="text-neutral-800">
                {contact.preferences || '등록된 취향 메모가 없습니다.'}
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* Card 2: 마음 교환 밸런스 */}
      <section className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[20px] text-neutral-800">
              balance
            </span>
            <h3 className="text-[16px] font-bold text-neutral-900">
              마음 교환 밸런스
            </h3>
          </div>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
            최근 2개년 기준
          </span>
        </div>

        <div className="flex items-center justify-between text-[13px] pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-neutral-400"></span>
            <span className="text-neutral-600">내가 받은 마음</span>
            <strong className="font-semibold text-neutral-900">
              {totalReceived.toLocaleString()}원
            </strong>
            <span className="text-[11px] text-neutral-400">({receivedRecords.length || 2}건)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-black"></span>
            <span className="text-neutral-600">내가 보낸 마음</span>
            <strong className="font-semibold text-neutral-900">
              {totalSent.toLocaleString()}원
            </strong>
            <span className="text-[11px] text-neutral-400">({sentRecords.length || 1}건)</span>
          </div>
        </div>

        {/* Proportional Balance Bar */}
        <div className="w-full h-2.5 bg-neutral-200 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-neutral-400 transition-all duration-500"
            style={{ width: `${(totalReceived / (totalReceived + totalSent || 1)) * 100}%` }}
          ></div>
          <div
            className="h-full bg-black transition-all duration-500"
            style={{ width: `${(totalSent / (totalReceived + totalSent || 1)) * 100}%` }}
          ></div>
        </div>

        {/* Net Callout Badge */}
        <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-100 flex items-center justify-center gap-2 text-[13px]">
          <span>🎁</span>
          <span className="text-neutral-700 font-medium">
            {netDiff > 0 ? (
              <>
                받은 마음이{' '}
                <strong className="text-black font-bold">
                  {netDiff.toLocaleString()}원
                </strong>{' '}
                더 많아요
              </>
            ) : netDiff < 0 ? (
              <>
                보낸 마음이{' '}
                <strong className="text-black font-bold">
                  {Math.abs(netDiff).toLocaleString()}원
                </strong>{' '}
                더 많아요
              </>
            ) : (
              <strong className="text-black font-bold">주고받은 마음이 완벽한 동률입니다</strong>
            )}
          </span>
          <span className="text-[11px] font-mono font-semibold px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-800">
            NET {netDiff >= 0 ? `+${netDiff.toLocaleString()}` : netDiff.toLocaleString()}
          </span>
        </div>
      </section>

      {/* Card 3: BODAP AI 추천 (Dark Bento Card) */}
      <section className="bg-[#1c1b1b] text-white rounded-2xl p-4 shadow-sm flex flex-col space-y-2 relative overflow-hidden">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-[15px] text-white">auto_awesome</span>
          </div>
          <span className="text-[12px] font-bold tracking-widest text-neutral-300">
            BODAP AI 추천
          </span>
        </div>
        <p className="text-[13px] text-neutral-200 leading-relaxed font-normal">
          다가오는 <strong className="text-white font-semibold">5월 18일 결혼식에 100,000원 축의</strong> 시
          누적 교환 비율이 5:5로 가장 조화롭게 맞춰집니다.
        </p>
      </section>

      {/* Section 4: 주고받은 타임라인 */}
      <section className="flex flex-col space-y-3 pt-1">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5">
            <h3 className="text-[16px] font-bold text-neutral-900">주고받은 타임라인</h3>
            <span className="text-[12px] text-neutral-500 font-medium">
              (총 {sortedRecords.length}건)
            </span>
          </div>
          <button
            onClick={() => setSortOrder(sortOrder === 'latest' ? 'oldest' : 'latest')}
            className="flex items-center gap-1 text-[12px] text-neutral-600 hover:text-black transition-colors"
          >
            <span>{sortOrder === 'latest' ? '최신순' : '과거순'}</span>
            <span className="material-symbols-outlined text-[16px]">expand_more</span>
          </button>
        </div>

        {/* Timeline Items */}
        {sortedRecords.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white border border-neutral-100 shadow-xs flex flex-col items-center justify-center text-center space-y-2">
            <span className="material-symbols-outlined text-[24px] text-neutral-400">
              history_edu
            </span>
            <p className="text-[14px] font-bold text-neutral-800">
              기록된 보답 내역이 없습니다
            </p>
            <p className="text-[12px] text-neutral-500">
              이 인연과 주고받은 축의금, 부의금, 선물 내역을 기록해 보세요.
            </p>
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-neutral-200">
            {sortedRecords.map((item) => {
            const isPlanned = item.type === 'planned';
            const isSent = item.type === 'sent';
            const isReceived = item.type === 'received';

            return (
              <div key={item.id} className="relative group">
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs ${
                    isPlanned
                      ? 'bg-black text-white'
                      : isSent
                      ? 'bg-neutral-400 text-white'
                      : 'bg-neutral-200 text-neutral-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-[12px]">
                    {isPlanned ? 'schedule' : isSent ? 'arrow_upward' : 'arrow_downward'}
                  </span>
                </div>

                {/* Timeline Card */}
                <div className="bg-white rounded-xl p-3.5 shadow-sm border border-neutral-100 flex flex-col space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isPlanned
                            ? 'bg-black text-white'
                            : isSent
                            ? 'bg-neutral-200 text-neutral-800'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {isPlanned ? '보낼 예정' : isSent ? '보냄' : '받음'}
                      </span>
                      <span className="text-[12px] font-mono text-neutral-500">
                        {item.date}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[15px] font-bold font-mono text-neutral-900">
                        {item.amount.toLocaleString()}원
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        {item.format}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[15px] font-bold text-neutral-900">
                      {item.itemTitle}
                    </h4>
                    {item.itemDescription && (
                      <p className="text-[13px] text-neutral-600 mt-0.5">
                        {item.itemDescription}
                      </p>
                    )}
                  </div>

                  {/* Location or Memo */}
                  {item.location && (
                    <div className="p-2 rounded-lg bg-neutral-50 border border-neutral-100 flex items-center justify-between text-[12px] text-neutral-600">
                      <span>{item.location}</span>
                      <span className="material-symbols-outlined text-[16px] text-neutral-400">
                        event
                      </span>
                    </div>
                  )}

                  {item.memo && !item.location && (
                    <div className="p-2 rounded-lg bg-neutral-50 text-[12px] text-neutral-600 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[15px] text-neutral-400">
                        chat
                      </span>
                      <span>"{item.memo}"</span>
                    </div>
                  )}

                  {/* Photo Attachment */}
                  {item.photoUrl && (
                    <div
                      onClick={() =>
                        setLightboxImage({
                          url: item.photoUrl!,
                          title: `${item.itemTitle} (${item.photoLabel || '첨부 사진'})`,
                        })
                      }
                      className="mt-1 p-2 rounded-xl bg-neutral-50 hover:bg-neutral-100/80 border border-neutral-200/70 flex items-center gap-3 cursor-pointer transition-colors group"
                    >
                      <img
                        src={item.photoUrl}
                        alt="인증 사진"
                        className="w-14 h-14 rounded-lg object-cover border border-neutral-200 shrink-0 group-hover:scale-105 transition-transform"
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-[12px] font-bold text-neutral-800 flex items-center gap-1 truncate">
                          <span className="material-symbols-outlined text-[15px] text-neutral-600">photo_camera</span>
                          {item.photoLabel || '첨부 사진'}
                        </span>
                        <span className="text-[11px] text-neutral-500 mt-0.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">zoom_in</span>
                          클릭하여 크게 보기
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </section>

      {/* Section 5: 함께한 순간들 */}
      {contact.photos && contact.photos.length > 0 && (
        <section className="flex flex-col space-y-2 pt-2">
          <div className="flex items-center gap-1.5 px-0.5">
            <span className="material-symbols-outlined text-[18px] text-neutral-700">photo_library</span>
            <h3 className="text-[15px] font-bold text-neutral-900">
              함께한 순간들
            </h3>
            <span className="text-[12px] text-neutral-500">
              ({contact.photos.length}장의 사진)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {contact.photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() =>
                  setLightboxImage({
                    url: photo.imageUrl,
                    title: photo.title || photo.tag,
                  })
                }
                className="relative rounded-xl overflow-hidden aspect-4/3 bg-neutral-100 shadow-xs group cursor-pointer"
              >
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2.5">
                  <span className="text-white text-[12px] font-semibold tracking-tight">
                    {photo.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sticky / Bottom Action Buttons */}
      <div className="flex flex-col space-y-2 pt-3">
        <button
          onClick={() => onQuickRecord(contact.id)}
          className="w-full py-3.5 rounded-xl bg-black text-white text-[14px] font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-md cursor-pointer hover:bg-neutral-900"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          <span>새 보답 기록하기</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => triggerFeedback('연락처가 클립보드에 복사되었습니다.')}
            className="py-2.5 px-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 text-[13px] font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-neutral-50"
          >
            <span className="material-symbols-outlined text-[17px] text-neutral-600">share</span>
            <span>연락처 공유</span>
          </button>
          <button
            onClick={() => triggerFeedback('내역이 PDF로 내보내기 준비되었습니다.')}
            className="py-2.5 px-3 rounded-xl bg-white border border-neutral-200 text-neutral-800 text-[13px] font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-all hover:bg-neutral-50"
          >
            <span className="material-symbols-outlined text-[17px] text-neutral-600">file_download</span>
            <span>내역 내보내기 (PDF)</span>
          </button>
        </div>
      </div>

      {/* Fullscreen Photo Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-[420px] w-full bg-[#1c1b1b] rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 flex items-center justify-between border-b border-white/10 text-white">
              <span className="text-[14px] font-semibold truncate pr-2">
                {lightboxImage.title}
              </span>
              <button
                onClick={() => setLightboxImage(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-2 flex items-center justify-center bg-black/50 min-h-[260px] max-h-[70vh] overflow-hidden">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title}
                className="max-h-[65vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
