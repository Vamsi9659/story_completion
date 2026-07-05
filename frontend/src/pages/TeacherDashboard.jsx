// src/pages/TeacherDashboard.jsx
//
// Story Completion & Emotional Analysis System — Teacher Dashboard
// PREMIUM FUTURISTIC EDITION — cinematic 3D glassmorphism / AI-SaaS look.
//
// Backend behavior is 100% unchanged from your original:
//   - reads "teacher" from localStorage (set at login)
//   - redirects to /teacher/login if no teacher found
//   - fetches GET http://127.0.0.1:8000/teacher/reports/{teacherEmail}
//   - renders student_name, story, emotional_tone, coping_style,
//     hope_level, conflict_resolution, summary for each report
//
// Only the visual layer changed: new aurora/particle background, glowing
// glass panels, 3D-tilting report cards, animated stat cards, a redesigned
// sidebar with a traveling light rail, and restyled charts.
//
// Requires: npm install framer-motion lucide-react recharts

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useSpring } from "framer-motion";
import {
  Users, BookMarked, HeartHandshake, Sparkles, LayoutGrid, Table2,
  BarChart3, LogOut, BookOpenText, Moon, Sun, GraduationCap, Search,
  SlidersHorizontal, Download, Heart, Shield, TrendingUp, Handshake,
  ChevronDown, NotebookPen, Radar,
} from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

import Navbar from "../components/Navbar";

/* ============================================================================
   EMOTION THEME — single source of truth for tone → color across the whole
   dashboard (card border, tone pill, table badge, chart slice, glow). Any
   tone string the backend sends gets a deterministic color even if it isn't
   in the predefined list, so nothing breaks if new tones get added later.
   ========================================================================== */

const TONE_PALETTE = {
  hopeful: { hex: "#FBBF24", label: "Hopeful" },
  anxious: { hex: "#818CF8", label: "Anxious" },
  sad: { hex: "#38BDF8", label: "Sad" },
  fearful: { hex: "#A78BFA", label: "Fearful" },
  angry: { hex: "#FB7185", label: "Angry" },
  calm: { hex: "#2DD4BF", label: "Calm" },
  resilient: { hex: "#C084FC", label: "Resilient" },
  confident: { hex: "#34D399", label: "Confident" },
  neutral: { hex: "#94A3B8", label: "Neutral" },
};

const FALLBACK_COLORS = ["#8B5CF6", "#22D3EE", "#EC4899", "#FB923C", "#34D399", "#F472B6"];

function hashColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return FALLBACK_COLORS[Math.abs(hash) % FALLBACK_COLORS.length];
}

function getToneMeta(tone) {
  if (!tone) return { hex: "#94A3B8", label: "Unknown" };
  const key = String(tone).trim().toLowerCase();
  if (TONE_PALETTE[key]) return TONE_PALETTE[key];
  return { hex: hashColor(key), label: String(tone) };
}

function getToneList() {
  return Object.values(TONE_PALETTE);
}

function hexToRgba(hex, alpha = 1) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* ============================================================================
   AMBIENT BACKGROUND — fixed aurora orbs + faint scanning grid. Purely
   decorative, pointer-events disabled, sits behind everything via z-index.
   ========================================================================== */

function AmbientBackground() {
  return (
    <div className="ambient-bg" aria-hidden="true">
      <div className="ambient-bg__grid" />
      <motion.span
        className="ambient-bg__orb ambient-bg__orb--violet"
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="ambient-bg__orb ambient-bg__orb--cyan"
        animate={{ x: [0, -50, 30, 0], y: [0, 40, -20, 0] }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.span
        className="ambient-bg__orb ambient-bg__orb--pink"
        animate={{ x: [0, 30, -40, 0], y: [0, -20, 30, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="ambient-bg__vignette" />
    </div>
  );
}

/* ============================================================================
   SUB-COMPONENTS
   ========================================================================== */

function Sidebar({ activeView, onChangeView, onLogout }) {
  const NAV_ITEMS = [
    { id: "grid", label: "Reports", icon: LayoutGrid },
    { id: "table", label: "Submissions", icon: Table2 },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];
  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="sidebar__brand-icon">
          <BookOpenText size={20} />
          <span className="sidebar__brand-icon-glow" />
        </div>
        <span className="sidebar__brand-text">
          Story<span className="sidebar__brand-accent">Lens</span>
        </span>
      </div>

      <nav className="sidebar__nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar__nav-item ${isActive ? "is-active" : ""}`}
              onClick={() => onChangeView(item.id)}
            >
              {isActive && (
                <motion.span
                  layoutId="sidebar-active-pill"
                  className="sidebar__nav-pill"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <Icon size={18} strokeWidth={2} />
              <span>{item.label}</span>
              {isActive && <span className="sidebar__nav-dot" />}
            </button>
          );
        })}
      </nav>

      <div className="sidebar__status">
        <span className="sidebar__status-dot" />
        Live sync active
      </div>

      <button className="sidebar__logout" onClick={onLogout}>
        <LogOut size={18} strokeWidth={2} />
        <span>Log out</span>
      </button>
    </aside>
  );
}

function TopBar({ teacherName, teacherEmail, darkMode, onToggleDark }) {
  const initials = teacherName
    ? teacherName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "T";
  return (
    <header className="topbar">
      <div className="topbar__greeting">
        <span className="topbar__eyebrow">
          <Radar size={12} /> Emotional insight engine
        </span>
        <h1>Welcome back{teacherName ? `, ${teacherName.split(" ")[0]}` : ""}</h1>
        <p>Here's how your students are expressing themselves this week.</p>
      </div>
      <div className="topbar__right">
        <button className="topbar__theme-toggle" onClick={onToggleDark} aria-label="Toggle dark mode">
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={darkMode ? "sun" : "moon"}
              initial={{ opacity: 0, rotate: -60, scale: 0.6 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 60, scale: 0.6 }}
              transition={{ duration: 0.25 }}
              style={{ display: "grid", placeItems: "center" }}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </motion.span>
          </AnimatePresence>
        </button>
        <div className="topbar__profile">
          <div className="topbar__avatar">{initials}</div>
          <div className="topbar__profile-text">
            <span className="topbar__profile-name"><GraduationCap size={14} /> {teacherName || "Teacher"}</span>
            <span className="topbar__profile-email">{teacherEmail}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function StatCard({ icon: Icon, label, value, accent, glow, delay = 0 }) {
  return (
    <motion.div
      className="stat-card"
      style={{ "--accent": accent, "--glow": glow }}
      initial={{ opacity: 0, y: 20, rotateX: -8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
    >
      <span className="stat-card__glow" />
      <div className="stat-card__icon">
        <Icon size={20} strokeWidth={2.2} />
      </div>
      <div className="stat-card__body">
        <span className="stat-card__value">{value}</span>
        <span className="stat-card__label">{label}</span>
      </div>
      <span className="stat-card__spark" />
    </motion.div>
  );
}

function SearchFilterBar({ searchTerm, onSearchChange, toneFilter, onToneChange, onExport, resultCount }) {
  const tones = getToneList();
  return (
    <div className="search-filter-bar">
      <div className="search-filter-bar__search">
        <Search size={17} />
        <input
          type="text"
          placeholder="Search by student name..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="search-filter-bar__filter">
        <SlidersHorizontal size={16} />
        <select value={toneFilter} onChange={(e) => onToneChange(e.target.value)}>
          <option value="all">All tones</option>
          {tones.map((t) => (
            <option key={t.label} value={t.label.toLowerCase()}>{t.label}</option>
          ))}
        </select>
      </div>
      <span className="search-filter-bar__count">{resultCount} result{resultCount === 1 ? "" : "s"}</span>
      <button className="search-filter-bar__export" onClick={onExport}>
        <Download size={16} /> Export
      </button>
    </div>
  );
}

/* ---- ReportCard: 3D pointer-tilt + holographic sheen sweep ---- */

function ReportCard({ report, index }) {
  const [expanded, setExpanded] = useState(false);
  const tone = getToneMeta(report.emotional_tone);
  const initials = (report.student_name || "?").slice(0, 1).toUpperCase();

  const cardRef = useRef(null);
  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rotateX = useSpring(rawRotateX, { stiffness: 220, damping: 20 });
  const rotateY = useSpring(rawRotateY, { stiffness: 220, damping: 20 });
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, ${hexToRgba(tone.hex, 0.28)}, transparent 55%)`;

  function handleMouseMove(e) {
    const rect = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    rawRotateY.set((px - 0.5) * 14);
    rawRotateX.set((0.5 - py) * 14);
    glareX.set(px * 100);
    glareY.set(py * 100);
  }
  function handleMouseLeave() {
    rawRotateX.set(0);
    rawRotateY.set(0);
  }

  return (
    <motion.div
      ref={cardRef}
      className="report-card"
      style={{
        "--tone-color": tone.hex,
        "--tone-soft": hexToRgba(tone.hex, 0.14),
        rotateX,
        rotateY,
        transformPerspective: 900,
      }}
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.4), ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.015 }}
    >
      <motion.span className="report-card__glare" style={{ background: glareBackground }} />
      <div className="report-card__inner">
        <div className="report-card__header">
          <div className="report-card__avatar">{initials}</div>
          <div>
            <h4>{report.student_name || "Unnamed student"}</h4>
            <span className="report-card__tone-pill">
              <span className="report-card__tone-dot" />
              {tone.label}
            </span>
          </div>
        </div>

        <p className={`report-card__story ${expanded ? "is-expanded" : ""}`}>{report.story}</p>
        {report.story && report.story.length > 140 && (
          <button className="report-card__toggle" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Show less" : "Read full story"}
            <ChevronDown size={14} className={expanded ? "is-flipped" : ""} />
          </button>
        )}

        <div className="report-card__metrics">
          <div className="report-card__metric">
            <Shield size={14} />
            <span className="report-card__metric-label">Coping style</span>
            <span className="report-card__metric-value">{report.coping_style || "—"}</span>
          </div>
          <div className="report-card__metric">
            <TrendingUp size={14} />
            <span className="report-card__metric-label">Hope level</span>
            <span className="report-card__metric-value">{report.hope_level ?? "—"}</span>
          </div>
          <div className="report-card__metric">
            <Handshake size={14} />
            <span className="report-card__metric-label">Conflict resolution</span>
            <span className="report-card__metric-value">{report.conflict_resolution || "—"}</span>
          </div>
        </div>

        <div className="report-card__summary">
          <Heart size={14} />
          <p>{report.summary}</p>
        </div>
      </div>
    </motion.div>
  );
}

function ReportsTable({ reports }) {
  return (
    <div className="reports-table-wrap">
      <table className="reports-table">
        <thead>
          <tr>
            <th>Student</th><th>Emotional tone</th><th>Coping style</th>
            <th>Hope level</th><th>Conflict resolution</th><th>Summary</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r, i) => {
            const tone = getToneMeta(r.emotional_tone);
            return (
              <tr key={i}>
                <td className="reports-table__student">
                  <span className="reports-table__avatar" style={{ background: tone.hex }}>
                    {(r.student_name || "?").slice(0, 1).toUpperCase()}
                  </span>
                  {r.student_name || "Unnamed"}
                </td>
                <td><span className="reports-table__tone" style={{ "--tone-color": tone.hex }}>{tone.label}</span></td>
                <td>{r.coping_style || "—"}</td>
                <td>{r.hope_level ?? "—"}</td>
                <td>{r.conflict_resolution || "—"}</td>
                <td className="reports-table__summary">{r.summary}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EmotionChart({ reports }) {
  const toneCounts = {};
  reports.forEach((r) => {
    const tone = getToneMeta(r.emotional_tone).label;
    toneCounts[tone] = (toneCounts[tone] || 0) + 1;
  });
  const pieData = Object.entries(toneCounts).map(([label, value]) => ({
    name: label, value, color: getToneMeta(label).hex,
  }));

  const barData = reports
    .filter((r) => !isNaN(parseFloat(r.hope_level)))
    .map((r) => ({ name: (r.student_name || "?").split(" ")[0], hope: parseFloat(r.hope_level) }))
    .slice(0, 10);

  return (
    <div className="emotion-chart-grid">
      <div className="chart-card">
        <h3><Sparkles size={14} /> Emotional tone distribution</h3>
        {pieData.length === 0 ? (
          <p className="chart-card__empty">Not enough data yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <defs>
                {pieData.map((entry, i) => (
                  <filter key={i} id={`glow-${i}`} x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor={entry.color} floodOpacity="0.55" />
                  </filter>
                ))}
              </defs>
              <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={4}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="none" filter={`url(#glow-${i})`} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 14, border: "1px solid rgba(139,92,246,0.35)",
                  background: "rgba(10,12,28,0.92)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                  color: "#EEF0FF", backdropFilter: "blur(10px)",
                }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12.5 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="chart-card">
        <h3><TrendingUp size={14} /> Hope level by student</h3>
        {barData.length === 0 ? (
          <p className="chart-card__empty">Hope level isn't numeric for these reports.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,253,0.12)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "var(--color-text-muted)" }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "rgba(139,92,246,0.08)" }}
                contentStyle={{
                  borderRadius: 14, border: "1px solid rgba(139,92,246,0.35)",
                  background: "rgba(10,12,28,0.92)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                  color: "#EEF0FF", backdropFilter: "blur(10px)",
                }}
              />
              <Bar dataKey="hope" fill="url(#hopeGradient)" radius={[10, 10, 4, 4]} />
              <defs>
                <linearGradient id="hopeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="55%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#22D3EE" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function EmptyState({ title, subtitle }) {
  return (
    <div className="empty-state">
      <motion.div
        className="empty-state__icon"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <NotebookPen size={28} strokeWidth={1.6} />
      </motion.div>
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
  );
}

function LoadingState({ count = 6 }) {
  return (
    <div className="student-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="skeleton-card" key={i}>
          <div className="skeleton-line skeleton-line--avatar" />
          <div className="skeleton-line skeleton-line--title" />
          <div className="skeleton-line skeleton-line--text" />
          <div className="skeleton-line skeleton-line--text short" />
        </div>
      ))}
    </div>
  );
}

/* ============================================================================
   STYLES — injected once via a plain <style> tag so the whole dashboard
   stays in this single file (no separate .css import needed).
   ========================================================================== */

const DASHBOARD_STYLES = `
@import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500&display=swap");

.teacher-shell {
  --color-bg: #F3F4FB; --color-bg-alt: #E9ECFB;
  --color-surface: rgba(255, 255, 255, 0.68); --color-surface-solid: #ffffff;
  --color-border: rgba(99, 91, 255, 0.14); --color-text: #191B3A; --color-text-muted: #62648A;
  --color-indigo: #4F46E5; --color-violet: #8B5CF6; --color-cyan: #22D3EE; --color-pink: #EC4899; --color-amber: #FBBF24;
  --shadow-soft: 0 10px 30px rgba(79, 70, 229, 0.10); --shadow-lift: 0 20px 46px rgba(79, 70, 229, 0.20);
  --radius-lg: 22px; --radius-md: 16px; --radius-sm: 10px;
  position: relative; isolation: isolate;
  background: var(--color-bg);
  min-height: 100vh; color: var(--color-text); font-family: "Inter", system-ui, sans-serif;
  transition: background 0.5s ease, color 0.5s ease;
  overflow-x: clip;
}
.teacher-shell.theme-dark {
  --color-bg: #05060F; --color-bg-alt: #0A0D1F; --color-surface: rgba(20, 22, 48, 0.55);
  --color-surface-solid: #12142E; --color-border: rgba(148, 163, 253, 0.14);
  --color-text: #EEF0FF; --color-text-muted: #9BA3D4;
  --shadow-soft: 0 10px 30px rgba(0, 0, 0, 0.4); --shadow-lift: 0 22px 50px rgba(0, 0, 0, 0.6);
}
.teacher-shell h1, .teacher-shell h2, .teacher-shell h3, .teacher-shell h4 {
  font-family: "Space Grotesk", "Inter", sans-serif; letter-spacing: -0.01em; margin: 0;
}

/* ---------------- Ambient background: orbs + grid + vignette ---------------- */
.ambient-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
.ambient-bg__grid {
  position: absolute; inset: -10%;
  background-image:
    linear-gradient(rgba(139,92,246,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(139,92,246,0.05) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(circle at 30% 10%, black 0%, transparent 65%);
  opacity: 0.7;
}
.theme-light .ambient-bg__grid { opacity: 0.35; }
.ambient-bg__orb { position: absolute; border-radius: 50%; filter: blur(70px); opacity: 0.55; }
.ambient-bg__orb--violet { width: 480px; height: 480px; top: -140px; left: -100px; background: radial-gradient(circle, #8B5CF6, transparent 70%); }
.ambient-bg__orb--cyan { width: 420px; height: 420px; top: 30%; right: -140px; background: radial-gradient(circle, #22D3EE, transparent 70%); }
.ambient-bg__orb--pink { width: 380px; height: 380px; bottom: -160px; left: 20%; background: radial-gradient(circle, #EC4899, transparent 70%); }
.theme-light .ambient-bg__orb { opacity: 0.3; }
.ambient-bg__vignette { position: absolute; inset: 0; background: radial-gradient(circle at 50% 0%, transparent 40%, rgba(5,6,15,0.35) 100%); }
.theme-light .ambient-bg__vignette { background: radial-gradient(circle at 50% 0%, transparent 55%, rgba(233,236,251,0.5) 100%); }

.teacher-layout { position: relative; z-index: 1; display: grid; grid-template-columns: 252px 1fr; gap: 0; max-width: 1480px; margin: 0 auto; }
.teacher-main { padding: 32px 40px 64px; display: flex; flex-direction: column; gap: 24px; min-width: 0; }

/* ---------------------------------- Sidebar ---------------------------------- */
.sidebar {
  position: sticky; top: 0; height: 100vh; padding: 28px 18px; display: flex; flex-direction: column; gap: 28px;
  border-right: 1px solid var(--color-border);
  background: linear-gradient(180deg, rgba(139,92,246,0.05), transparent 30%);
}
.sidebar__brand { display: flex; align-items: center; gap: 10px; padding: 0 8px; }
.sidebar__brand-icon {
  position: relative; width: 38px; height: 38px; border-radius: 13px; display: grid; place-items: center;
  background: linear-gradient(135deg, var(--color-violet), var(--color-indigo)); color: white;
  box-shadow: 0 6px 20px rgba(139,92,246,0.45);
}
.sidebar__brand-icon-glow { position: absolute; inset: -6px; border-radius: 16px; background: linear-gradient(135deg, var(--color-violet), var(--color-cyan)); opacity: 0.35; filter: blur(10px); z-index: -1; }
.sidebar__brand-text { font-family: "Space Grotesk", sans-serif; font-weight: 700; font-size: 18px; }
.sidebar__brand-accent { background: linear-gradient(90deg, var(--color-violet), var(--color-cyan)); -webkit-background-clip: text; background-clip: text; color: transparent; }
.sidebar__nav { display: flex; flex-direction: column; gap: 5px; }
.sidebar__nav-item {
  position: relative; display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 13px; border: none;
  background: transparent; color: var(--color-text-muted); font-size: 14px; font-weight: 500; cursor: pointer; text-align: left;
  transition: color 0.2s ease;
}
.sidebar__nav-item:hover { color: var(--color-text); }
.sidebar__nav-item.is-active { color: white; }
.sidebar__nav-pill {
  position: absolute; inset: 0; border-radius: 13px;
  background: linear-gradient(135deg, var(--color-violet), var(--color-indigo));
  box-shadow: 0 8px 24px rgba(139,92,246,0.5), inset 0 0 0 1px rgba(255,255,255,0.08);
  z-index: 0;
}
.sidebar__nav-item span, .sidebar__nav-item svg { position: relative; z-index: 1; }
.sidebar__nav-dot { position: absolute; right: 14px; width: 6px; height: 6px; border-radius: 50%; background: var(--color-cyan); box-shadow: 0 0 8px 2px var(--color-cyan); z-index: 1; }
.sidebar__status {
  margin-top: auto; display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 12px;
  font-size: 11.5px; color: var(--color-text-muted); background: var(--color-surface); border: 1px solid var(--color-border);
}
.sidebar__status-dot { width: 7px; height: 7px; border-radius: 50%; background: #34D399; box-shadow: 0 0 0 0 rgba(52,211,153,0.6); animation: status-pulse 2s infinite; }
@keyframes status-pulse { 0% { box-shadow: 0 0 0 0 rgba(52,211,153,0.55); } 70% { box-shadow: 0 0 0 8px rgba(52,211,153,0); } 100% { box-shadow: 0 0 0 0 rgba(52,211,153,0); } }
.sidebar__logout {
  display: flex; align-items: center; gap: 10px; padding: 11px 14px; border-radius: 13px; border: 1px solid var(--color-border);
  background: var(--color-surface); color: #FB7185; font-weight: 600; font-size: 14px; cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease; backdrop-filter: blur(14px);
}
.sidebar__logout:hover { transform: translateY(-2px); box-shadow: var(--shadow-soft); border-color: rgba(251,113,133,0.4); }

/* ----------------------------------- Topbar ----------------------------------- */
.topbar { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
.topbar__eyebrow {
  display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase;
  color: var(--color-violet); background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.25); padding: 4px 10px 4px 8px; border-radius: 999px; margin-bottom: 10px;
}
.topbar__greeting h1 { font-size: 28px; font-weight: 700; }
.topbar__greeting p { margin: 6px 0 0; color: var(--color-text-muted); font-size: 14px; }
.topbar__right { display: flex; align-items: center; gap: 14px; }
.topbar__theme-toggle {
  width: 42px; height: 42px; border-radius: 50%; border: 1px solid var(--color-border); background: var(--color-surface);
  color: var(--color-text); display: grid; place-items: center; cursor: pointer; overflow: hidden;
  box-shadow: var(--shadow-soft); backdrop-filter: blur(14px);
}
.topbar__profile {
  display: flex; align-items: center; gap: 10px; padding: 6px 16px 6px 6px; border-radius: 999px; background: var(--color-surface);
  border: 1px solid var(--color-border); box-shadow: var(--shadow-soft); backdrop-filter: blur(14px);
}
.topbar__avatar {
  width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; font-weight: 700; font-size: 13px; color: white;
  background: linear-gradient(135deg, var(--color-violet), var(--color-cyan)); box-shadow: 0 4px 14px rgba(139,92,246,0.4);
}
.topbar__profile-text { display: flex; flex-direction: column; line-height: 1.25; }
.topbar__profile-name { display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 600; }
.topbar__profile-email { font-size: 11px; color: var(--color-text-muted); }

/* --------------------------------- Stat cards --------------------------------- */
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; perspective: 1200px; }
.stat-card {
  position: relative; display: flex; align-items: center; gap: 14px; padding: 20px 22px; border-radius: var(--radius-lg);
  background: var(--color-surface); border: 1px solid var(--color-border); box-shadow: var(--shadow-soft);
  backdrop-filter: blur(16px); overflow: hidden; transform-style: preserve-3d;
}
.stat-card__glow {
  position: absolute; inset: -40% -40% auto auto; width: 60%; height: 140%; border-radius: 50%;
  background: radial-gradient(circle, var(--glow), transparent 70%); opacity: 0.5; pointer-events: none;
}
.stat-card__icon {
  position: relative; width: 46px; height: 46px; border-radius: 15px; display: grid; place-items: center; color: white; flex-shrink: 0;
  background: var(--accent); box-shadow: 0 8px 22px -6px var(--glow);
}
.stat-card__body { position: relative; display: flex; flex-direction: column; }
.stat-card__value { font-family: "JetBrains Mono", monospace; font-size: 23px; font-weight: 600; }
.stat-card__label { font-size: 12.5px; color: var(--color-text-muted); }
.stat-card__spark { position: absolute; top: 12px; right: 14px; width: 5px; height: 5px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 10px 2px var(--glow); }

.error-banner { padding: 14px 18px; border-radius: var(--radius-md); background: rgba(251,113,133,0.1); border: 1px solid rgba(251,113,133,0.3); color: #FB7185; font-size: 13.5px; font-weight: 500; backdrop-filter: blur(10px); }

/* ------------------------------ Search / filter bar ------------------------------ */
.search-filter-bar {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding: 12px 16px; border-radius: var(--radius-lg);
  background: var(--color-surface); border: 1px solid var(--color-border); box-shadow: var(--shadow-soft); backdrop-filter: blur(16px);
}
.search-filter-bar__search {
  display: flex; align-items: center; gap: 8px; flex: 1; min-width: 200px; padding: 10px 14px; border-radius: var(--radius-sm);
  background: var(--color-surface-solid); border: 1px solid var(--color-border); color: var(--color-text-muted);
}
.search-filter-bar__search input { border: none; outline: none; background: transparent; color: var(--color-text); font-size: 14px; width: 100%; }
.search-filter-bar__filter {
  display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: var(--radius-sm);
  background: var(--color-surface-solid); border: 1px solid var(--color-border); color: var(--color-text-muted);
}
.search-filter-bar__filter select { border: none; outline: none; background: transparent; color: var(--color-text); font-size: 13.5px; }
.search-filter-bar__count { font-size: 12.5px; color: var(--color-text-muted); white-space: nowrap; }
.search-filter-bar__export {
  display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: var(--radius-sm); border: none;
  background: linear-gradient(135deg, var(--color-violet), var(--color-indigo)); color: white; font-weight: 600; font-size: 13.5px; cursor: pointer;
  box-shadow: 0 8px 20px -6px rgba(139,92,246,0.6); transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.search-filter-bar__export:hover { transform: translateY(-2px); box-shadow: 0 14px 28px -6px rgba(139,92,246,0.75); }

/* ---------------------------------- Report cards ---------------------------------- */
.student-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)); gap: 20px; perspective: 1400px; }
.report-card {
  position: relative; border-radius: var(--radius-lg); background: var(--color-surface); border: 1px solid var(--color-border);
  box-shadow: var(--shadow-soft); backdrop-filter: blur(16px); overflow: hidden; cursor: default;
  transform-style: preserve-3d; will-change: transform;
}
.report-card::before {
  content: ""; position: absolute; inset: 0; border-radius: inherit; padding: 1px;
  background: linear-gradient(135deg, var(--tone-color), transparent 40%, transparent 60%, var(--tone-color));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude; opacity: 0.55; pointer-events: none;
}
.report-card__glare { position: absolute; inset: 0; pointer-events: none; z-index: 0; }
.report-card__inner { position: relative; z-index: 1; padding: 22px; display: flex; flex-direction: column; gap: 14px; }
.report-card__header { display: flex; align-items: center; gap: 12px; }
.report-card__avatar {
  width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; font-weight: 700; color: white;
  background: linear-gradient(135deg, var(--tone-color, var(--color-indigo)), var(--color-cyan)); flex-shrink: 0;
  box-shadow: 0 6px 18px -4px var(--tone-color);
}
.report-card__header h4 { font-size: 15.5px; font-weight: 600; }
.report-card__tone-pill {
  display: inline-flex; align-items: center; gap: 6px; margin-top: 4px; font-size: 11.5px; font-weight: 600;
  color: var(--tone-color, var(--color-indigo)); background: var(--tone-soft, rgba(139,92,246,0.1)); padding: 3px 10px; border-radius: 999px;
}
.report-card__tone-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--tone-color, var(--color-indigo)); box-shadow: 0 0 6px 1px var(--tone-color); }
.report-card__story {
  font-size: 13.5px; line-height: 1.6; color: var(--color-text-muted); display: -webkit-box; -webkit-line-clamp: 3;
  -webkit-box-orient: vertical; overflow: hidden;
}
.report-card__story.is-expanded { -webkit-line-clamp: unset; overflow: visible; }
.report-card__toggle { align-self: flex-start; display: flex; align-items: center; gap: 4px; border: none; background: none; color: var(--color-violet); font-size: 12.5px; font-weight: 600; cursor: pointer; padding: 0; margin-top: -8px; }
.report-card__toggle svg { transition: transform 0.2s ease; }
.report-card__toggle svg.is-flipped { transform: rotate(180deg); }
.report-card__metrics { display: grid; grid-template-columns: 1fr; gap: 9px; padding: 13px; border-radius: 14px; background: rgba(139,92,246,0.06); border: 1px solid var(--color-border); }
.report-card__metric { display: grid; grid-template-columns: 16px 1fr auto; align-items: center; gap: 8px; font-size: 12.5px; color: var(--color-text-muted); }
.report-card__metric svg { color: var(--tone-color, var(--color-indigo)); }
.report-card__metric-value { font-weight: 600; color: var(--color-text); font-family: "JetBrains Mono", monospace; font-size: 12px; }
.report-card__summary { display: flex; gap: 8px; font-size: 12.5px; color: var(--color-text-muted); font-style: italic; border-top: 1px dashed var(--color-border); padding-top: 12px; }
.report-card__summary svg { flex-shrink: 0; margin-top: 2px; color: var(--tone-color, var(--color-indigo)); }

/* ------------------------------------ Table ------------------------------------ */
.reports-table-wrap { overflow-x: auto; border-radius: var(--radius-lg); border: 1px solid var(--color-border); background: var(--color-surface); box-shadow: var(--shadow-soft); backdrop-filter: blur(16px); }
.reports-table { width: 100%; border-collapse: collapse; font-size: 13.5px; min-width: 720px; }
.reports-table thead th { text-align: left; padding: 14px 18px; font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border); }
.reports-table tbody td { padding: 14px 18px; border-bottom: 1px solid var(--color-border); vertical-align: top; }
.reports-table tbody tr:hover { background: rgba(139,92,246,0.05); }
.reports-table__student { display: flex; align-items: center; gap: 10px; font-weight: 600; white-space: nowrap; }
.reports-table__avatar { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; color: white; font-size: 11px; font-weight: 700; }
.reports-table__tone { color: var(--tone-color); background: color-mix(in srgb, var(--tone-color) 14%, transparent); padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.reports-table__summary { max-width: 320px; color: var(--color-text-muted); }

/* ------------------------------------ Charts ------------------------------------ */
.emotion-chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.chart-card { padding: 22px; border-radius: var(--radius-lg); background: var(--color-surface); border: 1px solid var(--color-border); box-shadow: var(--shadow-soft); backdrop-filter: blur(16px); }
.chart-card h3 { display: flex; align-items: center; gap: 7px; font-size: 14px; margin-bottom: 12px; color: var(--color-text); }
.chart-card h3 svg { color: var(--color-violet); }
.chart-card__empty { color: var(--color-text-muted); font-size: 13px; padding: 40px 0; text-align: center; }

/* --------------------------------- Empty state --------------------------------- */
.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 8px; padding: 68px 24px; border-radius: var(--radius-lg); background: var(--color-surface); border: 1px dashed var(--color-border); backdrop-filter: blur(16px); }
.empty-state__icon { width: 58px; height: 58px; border-radius: 18px; display: grid; place-items: center; background: linear-gradient(135deg, var(--color-violet), var(--color-cyan)); color: white; margin-bottom: 8px; box-shadow: 0 10px 26px -6px rgba(139,92,246,0.55); }
.empty-state h3 { font-size: 16px; }
.empty-state p { color: var(--color-text-muted); font-size: 13.5px; max-width: 340px; }

/* ------------------------------ Loading skeletons ------------------------------ */
.skeleton-card { padding: 22px; border-radius: var(--radius-lg); background: var(--color-surface); border: 1px solid var(--color-border); display: flex; flex-direction: column; gap: 12px; backdrop-filter: blur(16px); }
.skeleton-line { border-radius: 8px; background: linear-gradient(90deg, rgba(139,92,246,0.10) 25%, rgba(139,92,246,0.22) 37%, rgba(139,92,246,0.10) 63%); background-size: 400% 100%; animation: skeleton-shimmer 1.4s ease infinite; }
.skeleton-line--avatar { width: 44px; height: 44px; border-radius: 50%; }
.skeleton-line--title { width: 60%; height: 14px; }
.skeleton-line--text { width: 100%; height: 10px; }
.skeleton-line--text.short { width: 70%; }
@keyframes skeleton-shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }

/* ------------------------------------ Responsive ------------------------------------ */
@media (max-width: 1100px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } .emotion-chart-grid { grid-template-columns: 1fr; } }
@media (max-width: 900px) {
  .teacher-layout { grid-template-columns: 1fr; }
  .sidebar { position: static; height: auto; flex-direction: row; align-items: center; border-right: none; border-bottom: 1px solid var(--color-border); overflow-x: auto; gap: 16px; }
  .sidebar__nav { flex-direction: row; }
  .sidebar__status { display: none; }
  .sidebar__logout { margin-left: auto; }
  .teacher-main { padding: 24px 20px 48px; }
}
@media (max-width: 560px) {
  .stats-grid { grid-template-columns: 1fr; }
  .search-filter-bar { flex-direction: column; align-items: stretch; }
  .search-filter-bar__count { text-align: center; }
}
@media (prefers-reduced-motion: reduce) {
  .ambient-bg__orb, .sidebar__status-dot { animation: none !important; }
}
`;

/* ============================================================================
   MAIN COMPONENT
   ========================================================================== */

export default function TeacherDashboard() {
  const nav = useNavigate();

  // Read the stored teacher object (set at login) — unchanged from original
  const teacher = JSON.parse(localStorage.getItem("teacher"));
  const teacherEmail = teacher?.email;
  const teacherName = teacher?.name;

  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [toneFilter, setToneFilter] = useState("all");
  const [activeView, setActiveView] = useState("grid"); // grid | table | analytics
  const [darkMode, setDarkMode] = useState(true); // premium build defaults to the cinematic dark theme

  useEffect(() => {
    if (!teacherEmail) {
      nav("/teacher/login");
      return;
    }
    setIsLoading(true);
    fetch(`http://127.0.0.1:8000/teacher/reports/${teacherEmail}`)
      .then((res) => res.json())
      .then((data) => {
        setReports(Array.isArray(data) ? data : []);
        setLoadError(false);
      })
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false));
  }, [teacherEmail, nav]);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesSearch = (r.student_name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTone = toneFilter === "all" || (r.emotional_tone || "").toLowerCase() === toneFilter;
      return matchesSearch && matchesTone;
    });
  }, [reports, searchTerm, toneFilter]);

  const stats = useMemo(() => {
    const uniqueStudents = new Set(reports.map((r) => r.student_name)).size;
    const numericHopes = reports.map((r) => parseFloat(r.hope_level)).filter((n) => !isNaN(n));
    const avgHope = numericHopes.length
      ? (numericHopes.reduce((a, b) => a + b, 0) / numericHopes.length).toFixed(1)
      : "—";
    const toneCounts = {};
    reports.forEach((r) => {
      const t = r.emotional_tone || "Unknown";
      toneCounts[t] = (toneCounts[t] || 0) + 1;
    });
    const topTone = Object.entries(toneCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
    return { total: reports.length, uniqueStudents, avgHope, topTone };
  }, [reports]);

  function handleLogout() {
    localStorage.removeItem("teacher");
    nav("/teacher/login");
  }

  function handleExport() {
    const rows = [
      ["Student", "Emotional Tone", "Coping Style", "Hope Level", "Conflict Resolution", "Summary"],
      ...filteredReports.map((r) => [
        r.student_name, r.emotional_tone, r.coping_style, r.hope_level, r.conflict_resolution, r.summary,
      ]),
    ];
    const csv = rows.map((row) => row.map((v) => `"${(v ?? "").toString().replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student-reports.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className={`teacher-shell ${darkMode ? "theme-dark" : "theme-light"}`}>
      <style>{DASHBOARD_STYLES}</style>
      <AmbientBackground />
      <Navbar />

      <div className="teacher-layout">
        <Sidebar activeView={activeView} onChangeView={setActiveView} onLogout={handleLogout} />

        <main className="teacher-main">
          <TopBar
            teacherName={teacherName}
            teacherEmail={teacherEmail}
            darkMode={darkMode}
            onToggleDark={() => setDarkMode((v) => !v)}
          />

          <section className="stats-grid">
            <StatCard
              icon={BookMarked} label="Total submissions" value={stats.total}
              accent="linear-gradient(135deg,#8B5CF6,#4F46E5)" glow="rgba(139,92,246,0.55)" delay={0}
            />
            <StatCard
              icon={Users} label="Students reporting" value={stats.uniqueStudents}
              accent="linear-gradient(135deg,#22D3EE,#0EA5E9)" glow="rgba(34,211,238,0.55)" delay={0.05}
            />
            <StatCard
              icon={Sparkles} label="Average hope level" value={stats.avgHope}
              accent="linear-gradient(135deg,#FBBF24,#F59E0B)" glow="rgba(251,191,36,0.55)" delay={0.1}
            />
            <StatCard
              icon={HeartHandshake} label="Most common tone" value={stats.topTone}
              accent="linear-gradient(135deg,#EC4899,#F472B6)" glow="rgba(236,72,153,0.55)" delay={0.15}
            />
          </section>

          {loadError && (
            <div className="error-banner">
              Couldn't load reports right now. Check that the API server is running and try refreshing.
            </div>
          )}

          <SearchFilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            toneFilter={toneFilter}
            onToneChange={setToneFilter}
            onExport={handleExport}
            resultCount={filteredReports.length}
          />

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="loading" exit={{ opacity: 0 }}>
                <LoadingState />
              </motion.div>
            ) : filteredReports.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <EmptyState
                  title={reports.length === 0 ? "No stories submitted yet" : "No matching reports"}
                  subtitle={
                    reports.length === 0
                      ? "Once your students complete a story prompt, their reports will appear here."
                      : "Try a different search term or clear the tone filter."
                  }
                />
              </motion.div>
            ) : activeView === "grid" ? (
              <motion.div
                key="grid" className="student-grid"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                {filteredReports.map((r, i) => <ReportCard key={i} report={r} index={i} />)}
              </motion.div>
            ) : activeView === "table" ? (
              <motion.div
                key="table"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <ReportsTable reports={filteredReports} />
              </motion.div>
            ) : (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <EmotionChart reports={filteredReports} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
