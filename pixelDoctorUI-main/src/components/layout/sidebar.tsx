"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { formatRelative } from "@/lib/utils";
import { Search, Edit, MoreHorizontal, X, LogOut, Settings } from "lucide-react";
import type { SessionUser } from "@/types";
import { useDebouncedCallback } from "use-debounce";
import styles from "./sidebar.module.css";

interface Patient {
  id: string;
  name: string;
  patientCode: string;
  updatedAt: Date | string;
  visits: { id: string; visitedAt: Date }[];
}

interface Props {
  user: SessionUser;
  patients: Patient[];
}

const AVATAR_COLORS = [
  { bg: "#eff6ff", color: "#2563eb" },
  { bg: "#f5f3ff", color: "#7c3aed" },
  { bg: "#f0fdf4", color: "#16a34a" },
  { bg: "#fffbeb", color: "#d97706" },
  { bg: "#fdf2f8", color: "#db2777" },
];

export function Sidebar({ user, patients }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const debouncedSearch = useDebouncedCallback((q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearchResults(patients.filter((p) => p.name.includes(q) || p.patientCode.includes(q)));
  }, 200);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchQuery(e.target.value);
    debouncedSearch(e.target.value);
  }

  function handleSearchClear() {
    setSearchQuery("");
    setSearchResults([]);
  }

  const showResults = searchFocused && searchQuery.length > 0;
  const activePatientId = pathname.split("/patients/")[1]?.split("/")[0];

  return (
    <aside className={styles.sidebar}>

      {/* 검색 */}
      <div className={styles.searchSection} ref={searchRef}>
        <div className={styles.searchWrap}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => setSearchFocused(true)}
            placeholder="환자 이름 또는 ID"
            className={styles.searchInput}
          />
          {searchQuery && (
            <button onClick={handleSearchClear} className={styles.clearBtn}>
              <X style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>
        {showResults && (
          <div className={styles.searchDropdown}>
            {searchResults.length === 0 ? (
              <p className={styles.searchResultEmpty}>검색 결과가 없습니다</p>
            ) : (
              searchResults.map((p, i) => {
                const c = AVATAR_COLORS[i % AVATAR_COLORS.length];
                return (
                  <button
                    key={p.id}
                    onClick={() => { setSearchFocused(false); setSearchQuery(""); setSearchResults([]); router.push(`/patients/${p.id}`); }}
                    className={styles.searchResultItem}
                  >
                    <div className={styles.searchResultAvatar} style={{ background: c.bg, color: c.color }}>
                      {p.name[0]}
                    </div>
                    <div>
                      <p className={styles.searchResultName}>{p.name}</p>
                      <p className={styles.searchResultCode}>{p.patientCode}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* 새 환자 등록 */}
      <div className={styles.newPatientSection}>
        <Link href="/patients/new" className={styles.newPatientBtn}>
          <Edit className={styles.newPatientIcon} />
          새 환자 등록
        </Link>
      </div>

      {/* 환자 목록 */}
      <p className={styles.listLabel}>최근 환자</p>
      <div className={styles.patientList}>
        {patients.length === 0 ? (
          <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", padding: "32px 0" }}>
            등록된 환자가 없습니다
          </p>
        ) : (
          patients.map((patient, i) => {
            const isActive = patient.id === activePatientId;
            const c = AVATAR_COLORS[i % AVATAR_COLORS.length];
            return (
              <Link
                key={patient.id}
                href={`/patients/${patient.id}`}
                className={`${styles.patientItem} ${isActive ? styles.patientItemActive : ""}`}
              >
                <div className={styles.patientAvatar} style={{ background: c.bg, color: c.color }}>
                  {patient.name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className={`${styles.patientName} ${isActive ? styles.patientNameActive : ""}`}>
                    {patient.name}
                  </p>
                  <p className={styles.patientCode}>{patient.patientCode}</p>
                </div>
                <p className={styles.patientTime}>{formatRelative(patient.updatedAt)}</p>
              </Link>
            );
          })
        )}
      </div>

      {/* 사용자 영역 */}
      <div className={styles.userSection} ref={userMenuRef}>
        <button className={styles.userBtn} onClick={() => setUserMenuOpen(!userMenuOpen)}>
          <div className={styles.userAvatar}>{user.name[0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className={styles.userName}>{user.name}</p>
            <p className={styles.userRole}>{user.role === "ADMIN" ? "관리자" : "의사"}</p>
          </div>
          <MoreHorizontal className={styles.userMoreIcon} />
        </button>
        {userMenuOpen && (
          <div className={styles.userMenu}>
            <div className={styles.userMenuHeader}>
              <p className={styles.userMenuName}>{user.name}</p>
              <p className={styles.userMenuUsername}>{user.username}</p>
            </div>
            <button className={`${styles.userMenuItem} ${styles.userMenuItemDefault}`}>
              <Settings className={styles.userMenuItemIcon} />
              설정
            </button>
            <button
              className={`${styles.userMenuItem} ${styles.userMenuItemDanger}`}
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className={styles.userMenuItemIcon} />
              로그아웃
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
