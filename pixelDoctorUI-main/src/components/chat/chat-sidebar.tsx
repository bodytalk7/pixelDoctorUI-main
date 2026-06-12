"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatDateTime, formatRelative } from "@/lib/utils";
import { FileImage, ScanLine, MessageSquare, Plus, AlertTriangle, CheckCircle, Clock, ChevronDown, Search, X } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import styles from "./chat-sidebar.module.css";

interface Patient { id: string; name: string; patientCode: string; visits: { id: string }[]; }

interface Props {
  visit: any;
  chatSessions: any[];
  activeSessionId: string | null;
  onSessionSelect: (session: any) => void;
  patients: Patient[];
}

export function ChatSidebar({ visit, chatSessions, activeSessionId, onSessionSelect, patients }: Props) {
  const router = useRouter();
  const patient = visit.patient;

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownSearch, setDropdownSearch] = useState("");

  const searchRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchFocused(false);
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) { setDropdownOpen(false); setDropdownSearch(""); }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const debouncedSearch = useDebouncedCallback((q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearchResults(patients.filter((p) => p.name.includes(q) || p.patientCode.includes(q)));
  }, 200);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) { setSearchQuery(e.target.value); debouncedSearch(e.target.value); }
  function handleSearchClear() { setSearchQuery(""); setSearchResults([]); }

  function navigateToPatient(p: Patient) {
    setSearchQuery(""); setSearchResults([]); setSearchFocused(false); setDropdownOpen(false); setDropdownSearch("");
    if (p.id === patient.id) return;
    const vid = p.visits[0]?.id;
    router.push(vid ? `/patients/${p.id}/visits/${vid}/chat` : `/patients/${p.id}`);
  }

  const dropdownFiltered = dropdownSearch
    ? patients.filter((p) => p.name.includes(dropdownSearch) || p.patientCode.includes(dropdownSearch))
    : patients;

  const latestResult = (visit.xrayImages?.[0]?.analysisResult ?? visit.ctScans?.[0]?.analysisResult) as any;
  const riskLevel = latestResult?.risk_level as string | undefined;
  const riskConfig = {
    high:     { label: "높음", icon: AlertTriangle, cls: styles.riskHigh },
    moderate: { label: "중간", icon: Clock,         cls: styles.riskMod  },
    low:      { label: "낮음", icon: CheckCircle,   cls: styles.riskLow  },
  }[riskLevel ?? ""] ?? null;

  const showSearchResults = searchFocused && searchQuery.length > 0;

  return (
    <aside className={styles.sidebar}>

      {/* 상단 검색 */}
      <div className={styles.searchSection} ref={searchRef}>
        <div className={styles.searchWrap}>
          <Search className={styles.searchIcon} />
          <input type="text" value={searchQuery} onChange={handleSearchChange}
            onFocus={() => setSearchFocused(true)}
            placeholder="환자 이름 또는 ID" className={styles.searchInput} />
          {searchQuery && (
            <button onClick={handleSearchClear} className={styles.clearBtn}><X style={{ width: 12, height: 12 }} /></button>
          )}
        </div>
        {showSearchResults && (
          <div className={styles.searchDropdown}>
            {searchResults.length === 0
              ? <p className={styles.searchEmpty}>검색 결과가 없습니다</p>
              : searchResults.map((p) => (
                <button key={p.id} onClick={() => navigateToPatient(p)}
                  className={`${styles.searchItem} ${p.id === patient.id ? styles.searchItemActive : ""}`}>
                  <div className={`${styles.searchAvatar} ${p.id === patient.id ? styles.searchAvatarActive : styles.searchAvatarDefault}`}>{p.name[0]}</div>
                  <div><p className={styles.searchItemName}>{p.name}</p><p className={styles.searchItemCode}>{p.patientCode}</p></div>
                  {p.id === patient.id && <span className={styles.searchItemCurrent}>현재</span>}
                </button>
              ))
            }
          </div>
        )}
      </div>

      {/* 환자 전환 */}
      <div className={styles.patientSection} ref={dropdownRef}>
        <button onClick={() => { setDropdownOpen(!dropdownOpen); setDropdownSearch(""); }} className={styles.patientBtn}>
          <div className={styles.patientAvatar}>{patient.name[0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className={styles.patientName}>{patient.name}</p>
            <p className={styles.patientCode}>{patient.patientCode} · {patient.doctor?.specialty ?? "일반의"}</p>
          </div>
          <ChevronDown className={`${styles.patientChevron} ${dropdownOpen ? styles.patientChevronOpen : ""}`} />
        </button>
        {dropdownOpen && (
          <div className={styles.dropdown}>
            <div className={styles.dropdownSearch}>
              <div className={styles.dropdownSearchWrap}>
                <Search className={styles.dropdownSearchIcon} />
                <input autoFocus value={dropdownSearch} onChange={(e) => setDropdownSearch(e.target.value)}
                  placeholder="이름 또는 ID" className={styles.dropdownInput} />
              </div>
            </div>
            <div className={styles.dropdownList}>
              {dropdownFiltered.length === 0
                ? <p className={styles.dropdownEmpty}>결과 없음</p>
                : dropdownFiltered.map((p) => (
                  <button key={p.id} onClick={() => navigateToPatient(p)}
                    className={`${styles.dropdownItem} ${p.id === patient.id ? styles.dropdownItemActive : ""}`}>
                    <div className={`${styles.dropdownAvatar} ${p.id === patient.id ? styles.dropdownAvatarActive : styles.dropdownAvatarDefault}`}>{p.name[0]}</div>
                    <div><p className={styles.dropdownItemName}>{p.name}</p><p className={styles.dropdownItemCode}>{p.patientCode}</p></div>
                  </button>
                ))
              }
            </div>
          </div>
        )}
      </div>

      {/* 방문 정보 */}
      <div className={styles.visitSection}>
        <p className={styles.visitDate}>{formatDateTime(visit.visitedAt)} 방문</p>
        <p className={styles.visitSymptoms}>{visit.symptoms}</p>
        <div className={styles.visitBadges}>
          {visit.xrayImages?.length > 0 && (
            <span className={`${styles.visitBadge} ${styles.visitBadgeXray}`}>
              <FileImage className={styles.visitBadgeIcon} />X-ray {visit.xrayImages.length}
            </span>
          )}
          {visit.ctScans?.length > 0 && (
            <span className={`${styles.visitBadge} ${styles.visitBadgeCT}`}>
              <ScanLine className={styles.visitBadgeIcon} />CT {visit.ctScans.length}
            </span>
          )}
        </div>
      </div>

      {/* 위험도 */}
      {riskConfig && (
        <div className={styles.riskSection}>
          <p className={styles.riskLabel}>분석 결과</p>
          <div className={`${styles.riskBadge} ${riskConfig.cls}`}>
            <riskConfig.icon className={styles.riskBadgeIcon} />
            위험도 {riskConfig.label}
          </div>
        </div>
      )}

      {/* 세션 목록 */}
      <div className={styles.sessionList}>
        <p className={styles.sessionListLabel}>대화 기록</p>
        {chatSessions.length === 0 ? (
          <div className={styles.sessionEmpty}>
            <MessageSquare className={styles.sessionEmptyIcon} />
            <p className={styles.sessionEmptyText}>대화 기록이 없습니다</p>
          </div>
        ) : (
          chatSessions.map((s) => {
            const preview = s.messages?.find((m: any) => m.role === "assistant")?.finalResponse ?? "새 대화";
            const isActive = s.id === activeSessionId;
            return (
              <button key={s.id} onClick={() => onSessionSelect(s)}
                className={`${styles.sessionItem} ${isActive ? styles.sessionItemActive : ""}`}>
                <p className={`${styles.sessionDate} ${isActive ? styles.sessionDateActive : ""}`}>{formatDateTime(s.createdAt)}</p>
                <p className={styles.sessionPreview}>{preview}</p>
                <p className={styles.sessionMeta}>{s.messages?.length ?? 0}개 · {formatRelative(s.updatedAt ?? s.createdAt)}</p>
              </button>
            );
          })
        )}
      </div>

      {/* 새 대화 */}
      <div className={styles.newSessionSection}>
        <button onClick={() => onSessionSelect(null)} className={styles.newSessionBtn}>
          <Plus className={styles.newSessionIcon} />
          새 대화 시작
        </button>
      </div>
    </aside>
  );
}
