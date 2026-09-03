import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Contact, EventCategory, DeliveryFormat, RecordDirection, RecordItem, CategoryType } from '../types';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingContacts: Contact[];
  onImportSuccess: (newRecords: Omit<RecordItem, 'id'>[], newOrUpdatedContacts: Contact[]) => Promise<void>;
}

interface ParsedRow {
  id: string;
  date: string;
  type: RecordDirection;
  contactName: string;
  category: EventCategory;
  amount: number;
  format: DeliveryFormat;
  contactCategory: CategoryType;
  memo: string;
  isExistingContact: boolean;
  matchedContactId?: string;
  isValid: boolean;
  errorMessage?: string;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  existingContacts,
  onImportSuccess,
}) => {
  const [step, setStep] = useState<'upload' | 'preview'>('upload');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Download Excel Template
  const handleDownloadTemplate = () => {
    try {
      const headers = [
        '날짜 (YYYY-MM-DD)',
        '구분 (받음 / 보냄)',
        '이름',
        '관계 (친구 / 회사 / 친척 / 모임/기타)',
        '경조사 분류 (결혼식 / 생일 축하 / 출산 / 돌잔치 / 부고 / 조의 / 승진 / 영전 / 기타)',
        '금액 (원)',
        '전달형태 (현금 / 계좌이체 / 선물 / 기프티콘)',
        '메모',
      ];

      const sampleData = [
        [
          '2026-05-12',
          '받음',
          '김민수',
          '친구',
          '결혼식',
          100000,
          '현금',
          '호텔 결혼식 축의금, 식권 2매 수령',
        ],
        [
          '2026-04-20',
          '보냄',
          '이서연',
          '회사',
          '생일 축하',
          50000,
          '기프티콘',
          '생일 축하 모바일 상품권 선물',
        ],
        [
          '2026-03-15',
          '받음',
          '박준형',
          '친척',
          '출산 / 돌잔치',
          100000,
          '현금',
          '첫째 돌잔치 축하금 봉투',
        ],
        [
          '2026-02-08',
          '보냄',
          '최승우',
          '모임/기타',
          '부고 / 조의',
          50000,
          '계좌이체',
          '부친상 부의금 전달',
        ],
      ];

      const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);

      // Set column widths
      ws['!cols'] = [
        { wch: 18 }, // 날짜
        { wch: 18 }, // 구분
        { wch: 14 }, // 이름
        { wch: 20 }, // 관계
        { wch: 24 }, // 경조사 분류
        { wch: 15 }, // 금액
        { wch: 22 }, // 전달형태
        { wch: 35 }, // 메모
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '보답_장부기록_양식');

      XLSX.writeFile(wb, '보답_장부기록_업로드양식.xlsx');
    } catch (err) {
      console.error('Error generating excel template:', err);
      setErrorMsg('양식 다운로드 중 오류가 발생했습니다.');
    }
  };

  // Helper to parse dates from Excel
  const parseExcelDate = (val: any): string => {
    if (!val) {
      const today = new Date();
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
        today.getDate()
      ).padStart(2, '0')}`;
    }

    // Number (Excel serial date)
    if (typeof val === 'number') {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    }

    const str = String(val).trim().replace(/\./g, '-').replace(/\//g, '-');
    const match = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (match) {
      const y = match[1];
      const m = match[2].padStart(2, '0');
      const d = match[3].padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`;
  };

  // Helper to parse Category
  const parseCategory = (val: any): EventCategory => {
    const s = String(val || '').trim();
    if (s.includes('결혼')) return '결혼식';
    if (s.includes('생일')) return '생일 축하';
    if (s.includes('돌') || s.includes('출산')) return '출산 / 돌잔치';
    if (s.includes('조의') || s.includes('부의') || s.includes('부고') || s.includes('장례')) return '부고 / 조의';
    if (s.includes('승진') || s.includes('영전') || s.includes('개업')) return '승진 / 영전';
    return '기타 선물';
  };

  // Helper to parse Format
  const parseFormat = (val: any): DeliveryFormat => {
    const s = String(val || '').trim();
    if (s.includes('선물') || s.includes('기프티콘') || s.includes('물품')) return '물품 / 기프티콘';
    return '현금 / 봉투';
  };

  // Helper to parse Contact Category
  const parseContactCategory = (val: any): CategoryType => {
    const s = String(val || '').trim();
    if (s.includes('회사') || s.includes('직장')) return '회사';
    if (s.includes('친구') || s.includes('동창')) return '친구';
    if (s.includes('친척') || s.includes('가족')) return '친척';
    return '모임/기타';
  };

  // 2. Parse Uploaded Excel File
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    setIsProcessing(true);
    setFileName(file.name);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error('엑셀 파일에 시트가 존재하지 않습니다.');
      }

      const sheet = workbook.Sheets[firstSheetName];
      const rawData: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (rawData.length < 2) {
        throw new Error('데이터가 없는 비어 있는 엑셀 파일입니다.');
      }

      // Find header row
      const headerRow: any[] = rawData[0];
      const findColIndex = (keywords: string[]) => {
        return headerRow.findIndex((col) => {
          if (!col) return false;
          const colStr = String(col).toLowerCase().replace(/\s/g, '');
          return keywords.some((kw) => colStr.includes(kw.toLowerCase()));
        });
      };

      const dateIdx = findColIndex(['날짜', '일자', 'date']);
      const typeIdx = findColIndex(['구분', '유형', 'type', '방향']);
      const nameIdx = findColIndex(['이름', '성명', '인물', '대상', 'name']);
      const relIdx = findColIndex(['관계', '소속', '분류']);
      const catIdx = findColIndex(['경조사', '행사', '이벤트', '경조사분류', 'category']);
      const amountIdx = findColIndex(['금액', '액수', 'amount', '원']);
      const formatIdx = findColIndex(['전달', '형태', '수단', '방식', 'format']);
      const memoIdx = findColIndex(['메모', '비고', '내용', 'memo']);

      const parsed: ParsedRow[] = [];

      for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length === 0) continue;

        // Extract values with fallbacks
        const rawDate = dateIdx !== -1 ? row[dateIdx] : row[0];
        const rawType = typeIdx !== -1 ? row[typeIdx] : row[1];
        const rawName = nameIdx !== -1 ? row[nameIdx] : row[2];
        const rawRel = relIdx !== -1 ? row[relIdx] : row[3];
        const rawCat = catIdx !== -1 ? row[catIdx] : row[4];
        const rawAmount = amountIdx !== -1 ? row[amountIdx] : row[5];
        const rawFormat = formatIdx !== -1 ? row[formatIdx] : row[6];
        const rawMemo = memoIdx !== -1 ? row[memoIdx] : row[7];

        const contactName = String(rawName || '').trim();
        if (!contactName) continue; // Skip blank rows

        // Parse amount
        let amount = 0;
        if (typeof rawAmount === 'number') {
          amount = rawAmount;
        } else if (rawAmount) {
          const numStr = String(rawAmount).replace(/[^0-9]/g, '');
          amount = numStr ? parseInt(numStr, 10) : 0;
        }

        // Parse direction
        const typeStr = String(rawType || '').trim();
        const type: RecordDirection =
          typeStr.includes('보냄') || typeStr.includes('sent') || typeStr.includes('출금')
            ? 'sent'
            : 'received';

        // Check if contact exists
        const matched = existingContacts.find(
          (c) => c.name.trim().toLowerCase() === contactName.toLowerCase()
        );

        const date = parseExcelDate(rawDate);
        const category = parseCategory(rawCat);
        const format = parseFormat(rawFormat);
        const contactCategory = parseContactCategory(rawRel);
        const memo = rawMemo ? String(rawMemo).trim() : '';

        const isValid = amount > 0 && contactName.length > 0;

        parsed.push({
          id: `parsed-${i}-${Date.now()}`,
          date,
          type,
          contactName,
          category,
          amount,
          format,
          contactCategory,
          memo,
          isExistingContact: !!matched,
          matchedContactId: matched?.id,
          isValid,
          errorMessage: !isValid ? (amount <= 0 ? '금액 누락' : '이름 누락') : undefined,
        });
      }

      if (parsed.length === 0) {
        throw new Error('유효한 장부 데이터 행을 찾을 수 없습니다. 양식을 확인해주세요.');
      }

      setParsedRows(parsed);
      setStep('preview');
    } catch (err: any) {
      console.error('Error parsing excel:', err);
      setErrorMsg(err.message || '엑셀 파일을 읽는 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Delete a parsed row
  const handleDeleteRow = (id: string) => {
    setParsedRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Toggle type of a row
  const handleToggleRowType = (id: string) => {
    setParsedRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, type: r.type === 'received' ? 'sent' : 'received' } : r
      )
    );
  };

  // 3. Final Batch Save Execution
  const handleConfirmImport = async () => {
    if (parsedRows.length === 0) return;

    setIsSaving(true);
    setErrorMsg(null);

    try {
      // Group calculations by contact
      const contactMap = new Map<string, Contact>();
      existingContacts.forEach((c) => contactMap.set(c.name.trim().toLowerCase(), { ...c }));

      const newRecordsToSave: Omit<RecordItem, 'id'>[] = [];

      for (const row of parsedRows) {
        if (!row.isValid) continue;

        const key = row.contactName.trim().toLowerCase();
        let targetContact = contactMap.get(key);

        if (!targetContact) {
          // Create new contact
          const newId = `c-bulk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          targetContact = {
            id: newId,
            name: row.contactName,
            title: row.contactCategory,
            organization: '엑셀 일괄 등록',
            category: row.contactCategory,
            tags: [row.contactCategory],
            avatar:
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            status: '동률',
            exchangeCount: 0,
            totalSent: 0,
            totalReceived: 0,
            netBalance: 0,
          };
          contactMap.set(key, targetContact);
        }

        // Update contact metrics
        const addSent = row.type === 'sent' ? row.amount : 0;
        const addRecv = row.type === 'received' ? row.amount : 0;

        targetContact.exchangeCount = (targetContact.exchangeCount || 0) + 1;
        targetContact.totalSent = (targetContact.totalSent || 0) + addSent;
        targetContact.totalReceived = (targetContact.totalReceived || 0) + addRecv;
        targetContact.netBalance = targetContact.totalReceived - targetContact.totalSent;
        targetContact.lastEventType = row.category;
        targetContact.lastExchangeDate = row.date;
        targetContact.status =
          targetContact.netBalance === 0
            ? '동률'
            : targetContact.netBalance > 0
            ? '보답권장'
            : '마음전달완료';

        newRecordsToSave.push({
          contactId: targetContact.id,
          contactName: targetContact.name,
          type: row.type,
          date: row.date,
          category: row.category,
          format: row.format,
          amount: row.amount,
          itemTitle: `${row.category} ${row.type === 'sent' ? '보냄' : '받음'}`,
          memo: row.memo,
        });
      }

      const allUpdatedContacts = Array.from(contactMap.values());

      await onImportSuccess(newRecordsToSave, allUpdatedContacts);
      onClose();
    } catch (err: any) {
      console.error('Error importing batch records:', err);
      setErrorMsg(err.message || '일괄 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const totalValid = parsedRows.filter((r) => r.isValid).length;
  const totalReceivedAmount = parsedRows
    .filter((r) => r.isValid && r.type === 'received')
    .reduce((sum, r) => sum + r.amount, 0);
  const totalSentAmount = parsedRows
    .filter((r) => r.isValid && r.type === 'sent')
    .reduce((sum, r) => sum + r.amount, 0);
  const newContactCount = new Set(
    parsedRows.filter((r) => !r.isExistingContact).map((r) => r.contactName.trim().toLowerCase())
  ).size;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-neutral-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-[20px]">table_chart</span>
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-neutral-900 leading-tight">
                엑셀로 장부 일괄 등록
              </h3>
              <p className="text-[11px] text-neutral-500">
                수많은 축의금·부의금 내역을 한 번에 가져오세요
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-neutral-200 text-neutral-500 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px] flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 'upload' ? (
            <div className="flex flex-col space-y-4">
              {/* Step 1: Download Template */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-neutral-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center">
                      1
                    </span>
                    보답 전용 엑셀 양식 다운로드
                  </span>
                  <span className="text-[11px] text-neutral-400 font-medium">.xlsx 형식</span>
                </div>
                <p className="text-[12px] text-neutral-600 leading-relaxed">
                  미리 준비된 규격 양식을 다운로드하여 날짜, 구분(받음/보냄), 이름, 경조사, 금액 등을
                  입력해 보세요. 샘플 예시가 포함되어 있어 바로 작성이 가능합니다.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="mt-1 py-2.5 px-4 rounded-xl bg-white border border-neutral-300 hover:border-black hover:bg-neutral-50 text-neutral-900 text-[13px] font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-emerald-600">
                    download
                  </span>
                  <span>보답 엑셀 표준 양식 다운로드 (.xlsx)</span>
                </button>
              </div>

              {/* Step 2: Upload File */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 flex flex-col space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-neutral-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-black text-white text-[11px] font-bold flex items-center justify-center">
                      2
                    </span>
                    작성된 엑셀 파일 업로드
                  </span>
                  <span className="text-[11px] text-neutral-400 font-medium">.xlsx, .xls, .csv</span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-300 hover:border-black rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-white transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[26px]">upload_file</span>
                  </div>
                  <span className="text-[14px] font-bold text-neutral-900">
                    클릭하여 엑셀 파일 선택
                  </span>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    작성하신 엑셀 파일을 선택하면 자동으로 행을 읽어 미리보기를 제공합니다.
                  </p>
                </div>
              </div>

              {isProcessing && (
                <div className="flex items-center justify-center gap-2 py-2 text-neutral-600 text-[13px]">
                  <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>엑셀 데이터를 분석하는 중입니다...</span>
                </div>
              )}
            </div>
          ) : (
            /* Step: Preview Table */
            <div className="flex flex-col space-y-3">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col">
                  <span className="text-[11px] text-neutral-500 font-medium">가져올 기록</span>
                  <span className="text-[16px] font-bold text-neutral-900 font-mono mt-0.5">
                    {totalValid}건
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col">
                  <span className="text-[11px] text-emerald-700 font-medium">받은 마음 총액</span>
                  <span className="text-[15px] font-bold text-emerald-800 font-mono mt-0.5">
                    +{totalReceivedAmount.toLocaleString()}원
                  </span>
                </div>
                <div className="p-3 bg-neutral-100 rounded-xl border border-neutral-200 flex flex-col">
                  <span className="text-[11px] text-neutral-600 font-medium">보낸 마음 총액</span>
                  <span className="text-[15px] font-bold text-neutral-900 font-mono mt-0.5">
                    -{totalSentAmount.toLocaleString()}원
                  </span>
                </div>
              </div>

              {newContactCount > 0 && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[12px] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">person_add</span>
                  <span>
                    새로운 인연 <strong>{newContactCount}명</strong>이 인연 목록에 자동으로 함께 등록됩니다.
                  </span>
                </div>
              )}

              {/* Data Table */}
              <div className="border border-neutral-200 rounded-2xl overflow-hidden bg-white">
                <div className="max-h-64 overflow-y-auto divide-y divide-neutral-100">
                  {parsedRows.map((row, idx) => (
                    <div
                      key={row.id}
                      className="p-3 flex items-center justify-between hover:bg-neutral-50 transition-colors gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[11px] font-mono text-neutral-400 w-5 shrink-0">
                          {idx + 1}
                        </span>

                        {/* Direction Badge (clickable to toggle) */}
                        <button
                          type="button"
                          onClick={() => handleToggleRowType(row.id)}
                          title="클릭하여 받음/보냄 전환"
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0 cursor-pointer transition-colors ${
                            row.type === 'received'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-neutral-800 text-white hover:bg-black'
                          }`}
                        >
                          {row.type === 'received' ? '받음' : '보냄'}
                        </button>

                        {/* Contact & Date */}
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[13px] font-bold text-neutral-900 truncate">
                              {row.contactName}
                            </span>
                            {row.isExistingContact ? (
                              <span className="text-[10px] px-1 py-0.2 rounded bg-neutral-100 text-neutral-600 shrink-0">
                                기존인연
                              </span>
                            ) : (
                              <span className="text-[10px] px-1 py-0.2 rounded bg-amber-100 text-amber-800 shrink-0">
                                새인연
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-neutral-400 font-mono">
                            {row.date} · {row.category}
                          </span>
                        </div>
                      </div>

                      {/* Amount & Delete */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[13px] font-mono font-bold text-neutral-900">
                          {row.amount.toLocaleString()}원
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(row.id)}
                          title="삭제"
                          className="w-6 h-6 rounded-full hover:bg-neutral-200 text-neutral-400 hover:text-red-600 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons in preview */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep('upload');
                    setParsedRows([]);
                  }}
                  className="py-3 px-4 rounded-xl border border-neutral-300 text-neutral-700 hover:bg-neutral-100 text-[13px] font-semibold transition-colors cursor-pointer"
                >
                  다시 업로드
                </button>
                <button
                  type="button"
                  disabled={isSaving || totalValid === 0}
                  onClick={handleConfirmImport}
                  className="flex-1 py-3 px-4 rounded-xl bg-black text-white hover:bg-neutral-800 text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>장부에 일괄 저장 중...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      <span>총 {totalValid}건 장부에 일괄 등록하기</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
