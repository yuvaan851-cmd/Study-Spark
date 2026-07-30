  import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  BookOpen, FileText, Layers, Clipboard, Calendar, Timer,
  Sun, Moon, Flame, Clock, Trophy, Shuffle, RotateCcw, Check, X,
  Plus, Play, Pause, RefreshCw, Sparkles, ChevronRight, Star, Trash2,
  LogOut, Award, Lock
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { supabase } from "./lib/supabaseClient";

const SUBJECT_COLORS = {
  Math: "#E8A33D", Science: "#6B9080", English: "#C46A5E",
  History: "#7D8CA3", "Computer Science": "#8E6BAF",
};

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: BookOpen },
  { id: "notes", label: "Notes", icon: FileText },
  { id: "flashcards", label: "Flashcards", icon: Layers },
  { id: "quiz", label: "Quizzes", icon: Clipboard },
  { id: "planner", label: "Planner", icon: Calendar },
  { id: "pomodoro", label: "Focus Timer", icon: Timer },
];

const QUIZ_BANKS = {
  Math: [
    { type: "mc", q: "Solve for x: 2x + 6 = 14", options: ["3", "4", "5", "8"], answer: "4",
      explain: "Subtract 6 from both sides: 2x = 8. Divide by 2: x = 4." },
    { type: "tf", q: "The square root of 81 is 9.", answer: "True",
      explain: "9 × 9 = 81, so √81 = 9." },
    { type: "fill", q: "The value of π rounded to 2 decimal places is ____.", answer: "3.14",
      explain: "π ≈ 3.14159..., rounded to 2 decimals is 3.14." },
  ],
  Science: [
    { type: "mc", q: "Which organelle is the 'powerhouse of the cell'?", options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi body"], answer: "Mitochondria",
      explain: "Mitochondria produce ATP through cellular respiration, powering the cell." },
    { type: "tf", q: "Sound travels faster in water than in air.", answer: "True",
      explain: "Sound moves faster through denser mediums like water compared to air." },
    { type: "fill", q: "H2O is commonly known as ____.", answer: "water",
      explain: "H2O is the chemical formula for water." },
  ],
  English: [
    { type: "mc", q: "Which of these is a simile?", options: ["Time is a thief", "Brave as a lion", "The wind whispered", "Silence is golden"], answer: "Brave as a lion",
      explain: "A simile compares two things using 'like' or 'as' — 'brave as a lion' fits." },
    { type: "tf", q: "A metaphor uses 'like' or 'as' to compare things.", answer: "False",
      explain: "That's a simile. A metaphor states one thing IS another, without 'like/as'." },
    { type: "fill", q: "The past tense of 'go' is ____.", answer: "went",
      explain: "'Went' is the irregular past tense of 'go'." },
  ],
};

const LEVELS = [
  { name: "Bronze", minHours: 0, color: "#C08552" },
  { name: "Silver", minHours: 1, color: "#B0B7BF" },
  { name: "Gold", minHours: 3, color: "#E8B93D" },
  { name: "Diamond", minHours: 5, color: "#6FD3E0" },
  { name: "Titan", minHours: 7, color: "#8E6BAF" },
  { name: "Olympian", minHours: 15, color: "#E85D5D" },
];

function getLevel(totalMinutes) {
  const hours = totalMinutes / 60;
  let idx = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (hours >= LEVELS[i].minHours) idx = i;
  }
  const current = LEVELS[idx];
  const next = LEVELS[idx + 1] || null;
  const progress = next
    ? Math.min(100, Math.max(0, ((hours - current.minHours) / (next.minHours - current.minHours)) * 100))
    : 100;
  return { ...current, next, hours, progress };
}

const BADGES = [
  { id: "first_session", label: "First Steps", desc: "Complete your first focus session", check: (s) => s.totalMinutes > 0 },
  { id: "silver", label: "Silver Scholar", desc: "Reach Silver (1+ hour studied)", check: (s) => s.totalMinutes / 60 >= 1 },
  { id: "gold", label: "Gold Scholar", desc: "Reach Gold (3+ hours studied)", check: (s) => s.totalMinutes / 60 >= 3 },
  { id: "diamond", label: "Diamond Scholar", desc: "Reach Diamond (5+ hours studied)", check: (s) => s.totalMinutes / 60 >= 5 },
  { id: "titan", label: "Titan Scholar", desc: "Reach Titan (7+ hours studied)", check: (s) => s.totalMinutes / 60 >= 7 },
  { id: "olympian", label: "Olympian", desc: "Reach Olympian (15+ hours studied)", check: (s) => s.totalMinutes / 60 >= 15 },
  { id: "streak3", label: "3-Day Streak", desc: "Study 3 days in a row", check: (s) => s.longestStreak >= 3 },
  { id: "streak7", label: "Week Warrior", desc: "Study 7 days in a row", check: (s) => s.longestStreak >= 7 },
  { id: "streak30", label: "Unstoppable", desc: "Study 30 days in a row", check: (s) => s.longestStreak >= 30 },
  { id: "flashcards10", label: "Flashcard Fledgling", desc: "Create 10 flashcards", check: (s) => s.flashcardCount >= 10 },
  { id: "flashcards50", label: "Flashcard Master", desc: "Create 50 flashcards", check: (s) => s.flashcardCount >= 50 },
  { id: "quiz5", label: "Quiz Taker", desc: "Complete 5 quizzes", check: (s) => s.quizCount >= 5 },
  { id: "perfect", label: "Perfect Score", desc: "Score 100% on a quiz", check: (s) => s.hasPerfectScore },
  { id: "planner5", label: "Planner Pro", desc: "Add 5 deadlines to your planner", check: (s) => s.plannerCount >= 5 },
  { id: "notes1", label: "Note Taker", desc: "Generate your first study guide", check: (s) => s.hasNotes },
];

function localDateString(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function recordStudySession(userId, minutes) {
  const today = new Date();
  const todayStr = localDateString(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = localDateString(yesterday);

  const { data: existing } = await supabase
    .from("profile_stats")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  let totalMinutes = minutes;
  let currentStreak = 1;
  let longestStreak = 1;

  if (existing) {
    totalMinutes = (existing.total_minutes || 0) + minutes;
    if (existing.last_study_date === todayStr) {
      currentStreak = existing.current_streak || 1;
    } else if (existing.last_study_date === yesterdayStr) {
      currentStreak = (existing.current_streak || 0) + 1;
    } else {
      currentStreak = 1;
    }
    longestStreak = Math.max(existing.longest_streak || 0, currentStreak);
  }

  await supabase.from("profile_stats").upsert({
    user_id: userId,
    total_minutes: totalMinutes,
    current_streak: currentStreak,
    longest_streak: longestStreak,
    last_study_date: todayStr,
    updated_at: new Date().toISOString(),
  });
}

export default function StudyBuddyApp({ session }) {
  const [dark, setDark] = useState(true);
  const [tab, setTab] = useState("dashboard");
  const userId = session.user.id;

  const theme = dark
    ? { bg: "#14181F", panel: "#1B212C", panel2: "#212836", ink: "#F1EEE6", sub: "#9AA5B4", border: "#2B3341", accent: "#F2B65A" }
    : { bg: "#FCFCFA", panel: "#FFFFFF", panel2: "#F3F1EA", ink: "#1E2A3A", sub: "#5B6B7C", border: "#E4E1D6", accent: "#E8A33D" };

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <div style={{ background: theme.bg, color: theme.ink, minHeight: "700px", fontFamily: "'Iowan Old Style', Georgia, 'Times New Roman', serif" }} className="flex w-full rounded-2xl overflow-hidden border" >
      <Sidebar tab={tab} setTab={setTab} dark={dark} setDark={setDark} theme={theme} userEmail={session.user.email} onSignOut={handleSignOut} />
      <main className="flex-1 overflow-y-auto" style={{ background: theme.bg }}>
        <div className="max-w-4xl mx-auto p-6 md:p-10">
          <InfoBanner theme={theme} />
          {tab === "dashboard" && <Dashboard theme={theme} userId={userId} />}
          {tab === "notes" && <Notes theme={theme} userId={userId} />}
          {tab === "flashcards" && <Flashcards theme={theme} userId={userId} />}
          {tab === "quiz" && <Quiz theme={theme} userId={userId} />}
          {tab === "planner" && <Planner theme={theme} userId={userId} />}
          {tab === "pomodoro" && <Pomodoro theme={theme} userId={userId} />}
        </div>
      </main>
    </div>
  );
}

function InfoBanner({ theme }) {
  return (
    <div className="mb-6 text-xs tracking-wide flex items-center gap-2" style={{ color: theme.sub, fontFamily: "system-ui, sans-serif" }}>
      <Sparkles size={13} />
      <span>Your flashcards, notes, planner, and quiz history are saved to your account.</span>
    </div>
  );
}

function SansLabel({ children, theme, style }) {
  return <span style={{ fontFamily: "system-ui, sans-serif", color: theme.sub, ...style }}>{children}</span>;
}

function Sidebar({ tab, setTab, dark, setDark, theme, userEmail, onSignOut }) {
  return (
    <aside className="w-20 md:w-56 shrink-0 flex flex-col py-6 px-2 md:px-4" style={{ background: theme.panel, borderRight: `1px solid ${theme.border}` }}>
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: theme.accent }}>
          <BookOpen size={16} color={dark ? "#14181F" : "#fff"} />
        </div>
        <span className="hidden md:inline text-lg" style={{ letterSpacing: "0.02em" }}>StudySpark</span>
      </div>
      <nav className="flex-1 flex flex-col gap-1">
        {NAV.map((item) => {
          const active = tab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className="relative flex items-center gap-3 px-3 py-2.5 rounded-r-full rounded-l-md transition-all text-sm"
              style={{
                fontFamily: "system-ui, sans-serif",
                background: active ? theme.panel2 : "transparent",
                color: active ? theme.ink : theme.sub,
                borderLeft: active ? `3px solid ${theme.accent}` : "3px solid transparent",
                boxShadow: active ? "2px 2px 6px rgba(0,0,0,0.08)" : "none",
              }}
            >
              <Icon size={17} />
              <span className="hidden md:inline">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <button
        onClick={() => setDark(!dark)}
        className="flex items-center gap-3 px-3 py-2.5 rounded-full text-sm mt-4"
        style={{ fontFamily: "system-ui, sans-serif", color: theme.sub, border: `1px solid ${theme.border}` }}
      >
        {dark ? <Sun size={16} /> : <Moon size={16} />}
        <span className="hidden md:inline">{dark ? "Light mode" : "Dark mode"}</span>
      </button>

      <div className="hidden md:block px-2 mt-3 truncate">
        <SansLabel theme={theme} style={{ fontSize: 11 }}>{userEmail}</SansLabel>
      </div>

      <button
        onClick={onSignOut}
        className="flex items-center gap-3 px-3 py-2.5 rounded-full text-sm mt-2"
        style={{ fontFamily: "system-ui, sans-serif", color: theme.sub, border: `1px solid ${theme.border}` }}
      >
        <LogOut size={16} />
        <span className="hidden md:inline">Sign out</span>
      </button>
    </aside>
  );
}

function Card({ theme, children, accent, className = "", style = {} }) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{
        background: theme.panel, border: `1px solid ${theme.border}`,
        borderTop: accent ? `3px solid ${accent}` : `1px solid ${theme.border}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Dashboard({ theme, userId }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let active = true;
    async function loadAll() {
      const [statsRes, fcRes, quizRes, plannerRes, notesRes] = await Promise.all([
        supabase.from("profile_stats").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("flashcards").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("quiz_results").select("score,total").eq("user_id", userId),
        supabase.from("planner_items").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("notes").select("user_id").eq("user_id", userId).maybeSingle(),
      ]);
      if (!active) return;
      const quizRows = quizRes.data ?? [];
      setStats({
        totalMinutes: statsRes.data?.total_minutes ?? 0,
        currentStreak: statsRes.data?.current_streak ?? 0,
        longestStreak: statsRes.data?.longest_streak ?? 0,
        flashcardCount: fcRes.count ?? 0,
        quizCount: quizRows.length,
        hasPerfectScore: quizRows.some((r) => r.total > 0 && r.score === r.total),
        plannerCount: plannerRes.count ?? 0,
        hasNotes: !!notesRes.data,
      });
    }
    loadAll();
    return () => { active = false; };
  }, [userId]);

  if (!stats) {
    return (
      <div>
        <h1 className="text-3xl mb-1">Welcome back</h1>
        <SansLabel theme={theme}>Loading your progress…</SansLabel>
      </div>
    );
  }

  const level = getLevel(stats.totalMinutes);
  const hoursStudied = (stats.totalMinutes / 60).toFixed(1);

  const summaryCards = [
    { label: "Current streak", value: `${stats.currentStreak} day${stats.currentStreak !== 1 ? "s" : ""}`, icon: Flame, accent: "#E8A33D" },
    { label: "Hours studied", value: `${hoursStudied} hrs`, icon: Clock, accent: "#6B9080" },
    { label: "Quizzes done", value: stats.quizCount, icon: Trophy, accent: "#C46A5E" },
    { label: "Flashcards made", value: stats.flashcardCount, icon: Layers, accent: "#7D8CA3" },
  ];

  return (
    <div>
      <h1 className="text-3xl mb-1">Welcome back</h1>
      <SansLabel theme={theme}>Here's where things stand.</SansLabel>

      <Card theme={theme} accent={level.color} className="mt-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: level.color }}>
              <Award size={20} color="#14181F" />
            </div>
            <div>
              <div className="text-2xl" style={{ color: level.color }}>{level.name}</div>
              <SansLabel theme={theme} style={{ fontSize: 12 }}>{hoursStudied} hours studied all-time · longest streak {stats.longestStreak} day{stats.longestStreak !== 1 ? "s" : ""}</SansLabel>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: theme.panel2 }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${level.progress}%`, background: level.color }} />
          </div>
          <SansLabel theme={theme} style={{ fontSize: 11, marginTop: 6 }}>
            {level.next
              ? `${(level.next.minHours - level.hours).toFixed(1)} hrs to ${level.next.name}`
              : "Top level reached — Olympian!"}
          </SansLabel>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 mb-6">
        {summaryCards.map((s) => (
          <Card key={s.label} theme={theme} accent={s.accent}>
            <s.icon size={18} color={s.accent} />
            <div className="text-2xl mt-2">{s.value}</div>
            <SansLabel theme={theme} style={{ fontSize: "12px" }}>{s.label}</SansLabel>
          </Card>
        ))}
      </div>

      <SansLabel theme={theme} style={{ fontSize: 13, fontWeight: 600, color: theme.ink, display: "block", marginBottom: 10 }}>Badges</SansLabel>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {BADGES.map((b) => {
          const earned = b.check(stats);
          return (
            <Card key={b.id} theme={theme} accent={earned ? theme.accent : undefined} style={{ opacity: earned ? 1 : 0.5 }}>
              <div className="flex items-center gap-2">
                {earned ? <Award size={16} color={theme.accent} /> : <Lock size={16} color={theme.sub} />}
                <span className="text-sm" style={{ fontWeight: 600 }}>{b.label}</span>
              </div>
              <SansLabel theme={theme} style={{ fontSize: 11, marginTop: 4 }}>{b.desc}</SansLabel>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Notes({ theme, userId }) {
  const [text, setText] = useState("");
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data } = await supabase.from("notes").select("*").eq("user_id", userId).maybeSingle();
      if (active) {
        if (data) {
          setText(data.raw_text || "");
          setGuide({ summary: data.summary, concepts: data.concepts || [], vocab: data.vocab || [] });
        }
        setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [userId]);

  async function generate() {
    if (!text.trim()) return;
    const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
    const words = text.replace(/[^a-zA-Z\s]/g, "").split(/\s+/).filter((w) => w.length > 6);
    const uniqueWords = [...new Set(words.map((w) => w.toLowerCase()))].slice(0, 6);
    const newGuide = {
      summary: sentences.slice(0, Math.min(3, sentences.length)).join(" ") || "Add more notes for a summary.",
      concepts: sentences.slice(0, 4).map((s) => s.trim().slice(0, 70) + (s.length > 70 ? "…" : "")),
      vocab: uniqueWords.length ? uniqueWords : ["(add longer notes to extract vocabulary)"],
    };
    setGuide(newGuide);
    setSaving(true);
    await supabase.from("notes").upsert({
      user_id: userId,
      raw_text: text,
      summary: newGuide.summary,
      concepts: newGuide.concepts,
      vocab: newGuide.vocab,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
  }

  return (
    <div>
      <h1 className="text-3xl mb-1">Notes</h1>
      <SansLabel theme={theme}>{loading ? "Loading your notes…" : "Paste notes and generate a study guide — it's saved to your account."}</SansLabel>
      <Card theme={theme} className="mt-5">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7}
          placeholder="Paste your notes here…"
          className="w-full rounded-xl p-3 text-sm outline-none resize-none"
          style={{ fontFamily: "system-ui, sans-serif", background: theme.panel2, color: theme.ink, border: `1px solid ${theme.border}` }} />
        <button onClick={generate} className="mt-3 px-4 py-2 rounded-full text-sm flex items-center gap-2"
          style={{ fontFamily: "system-ui, sans-serif", background: theme.accent, color: "#14181F" }}>
          <Sparkles size={14} /> {saving ? "Saving…" : "Generate study guide"}
        </button>
      </Card>

      {guide && (
        <div className="grid md:grid-cols-3 gap-4 mt-4">
          <Card theme={theme} accent="#6B9080">
            <SansLabel theme={theme} style={{ fontSize: 12, fontWeight: 600, color: theme.ink }}>Summary</SansLabel>
            <p className="text-sm mt-2" style={{ fontFamily: "system-ui, sans-serif" }}>{guide.summary}</p>
          </Card>
          <Card theme={theme} accent="#E8A33D">
            <SansLabel theme={theme} style={{ fontSize: 12, fontWeight: 600, color: theme.ink }}>Key concepts</SansLabel>
            <ul className="text-sm mt-2 space-y-1.5" style={{ fontFamily: "system-ui, sans-serif" }}>
              {guide.concepts.map((c, i) => <li key={i}>• {c}</li>)}
            </ul>
          </Card>
          <Card theme={theme} accent="#C46A5E">
            <SansLabel theme={theme} style={{ fontSize: 12, fontWeight: 600, color: theme.ink }}>Vocabulary</SansLabel>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {guide.vocab.map((v, i) => (
                <span key={i} className="px-2 py-1 rounded-md text-xs" style={{ fontFamily: "system-ui, sans-serif", background: theme.panel2 }}>{v}</span>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function Flashcards({ theme, userId }) {
  const [deck, setDeck] = useState([]);
  const [loading, setLoading] = useState(true);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [newQ, setNewQ] = useState(""); const [newA, setNewA] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      if (active && !error && data) {
        setDeck(data.map((c) => ({ id: c.id, q: c.question, a: c.answer, difficult: c.difficult })));
      }
      if (active) setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [userId]);

  function shuffle() {
    setDeck((d) => [...d].sort(() => Math.random() - 0.5));
    setI(0); setFlipped(false);
  }
  function next() { setFlipped(false); setI((prev) => (deck.length ? (prev + 1) % deck.length : 0)); }

  async function toggleDifficult() {
    const card = deck[i];
    if (!card) return;
    const newVal = !card.difficult;
    setDeck((d) => d.map((c, idx) => (idx === i ? { ...c, difficult: newVal } : c)));
    await supabase.from("flashcards").update({ difficult: newVal }).eq("id", card.id);
  }

  async function addCard() {
    if (!newQ.trim() || !newA.trim()) return;
    const { data, error } = await supabase
      .from("flashcards")
      .insert({ user_id: userId, question: newQ, answer: newA, difficult: false })
      .select()
      .single();
    if (!error && data) {
      setDeck((d) => [...d, { id: data.id, q: data.question, a: data.answer, difficult: data.difficult }]);
      setNewQ(""); setNewA("");
    }
  }

  async function removeCard(id) {
    await supabase.from("flashcards").delete().eq("id", id);
    setDeck((d) => {
      const filtered = d.filter((c) => c.id !== id);
      setI((prev) => Math.min(prev, Math.max(0, filtered.length - 1)));
      return filtered;
    });
    setFlipped(false);
  }

  const card = deck[i];

  return (
    <div>
      <h1 className="text-3xl mb-1">Flashcards</h1>
      <SansLabel theme={theme}>
        {loading ? "Loading your cards…" : `${deck.length} cards · ${deck.filter((c) => c.difficult).length} marked difficult`}
      </SansLabel>

      {!loading && card && (
        <div className="mt-6 flex flex-col items-center">
          <div onClick={() => setFlipped(!flipped)} className="w-full max-w-md h-56 cursor-pointer rounded-2xl flex items-center justify-center text-center p-6"
            style={{ background: theme.panel2, border: `1px solid ${theme.border}`, borderTop: `3px solid ${card.difficult ? "#C46A5E" : theme.accent}` }}>
            <p className="text-lg" style={{ fontFamily: flipped ? "system-ui, sans-serif" : "inherit" }}>{flipped ? card.a : card.q}</p>
          </div>
          <SansLabel theme={theme} style={{ fontSize: 12, marginTop: 8 }}>Tap the card to flip · card {i + 1} of {deck.length}</SansLabel>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <button onClick={shuffle} className="px-3 py-2 rounded-full text-sm flex items-center gap-1.5" style={{ fontFamily: "system-ui, sans-serif", border: `1px solid ${theme.border}` }}><Shuffle size={14} />Shuffle</button>
            <button onClick={toggleDifficult} className="px-3 py-2 rounded-full text-sm flex items-center gap-1.5" style={{ fontFamily: "system-ui, sans-serif", border: `1px solid ${theme.border}`, color: card.difficult ? "#C46A5E" : theme.ink }}><Star size={14} />{card.difficult ? "Marked difficult" : "Mark difficult"}</button>
            <button onClick={next} className="px-3 py-2 rounded-full text-sm flex items-center gap-1.5" style={{ fontFamily: "system-ui, sans-serif", background: theme.accent, color: "#14181F" }}><RotateCcw size={14} />Next card</button>
            <button onClick={() => removeCard(card.id)} className="px-3 py-2 rounded-full text-sm flex items-center gap-1.5" style={{ fontFamily: "system-ui, sans-serif", border: `1px solid ${theme.border}`, color: "#C46A5E" }}><Trash2 size={14} />Delete</button>
          </div>
        </div>
      )}

      {!loading && deck.length === 0 && (
        <p className="mt-6 text-sm" style={{ fontFamily: "system-ui, sans-serif", color: theme.sub }}>No flashcards yet — add your first one below.</p>
      )}

      <Card theme={theme} className="mt-8">
        <SansLabel theme={theme} style={{ fontSize: 12, fontWeight: 600, color: theme.ink }}>Add a card</SansLabel>
        <div className="grid md:grid-cols-2 gap-2 mt-3">
          <input value={newQ} onChange={(e) => setNewQ(e.target.value)} placeholder="Question"
            className="px-3 py-2 rounded-xl text-sm outline-none" style={{ fontFamily: "system-ui, sans-serif", background: theme.panel2, border: `1px solid ${theme.border}`, color: theme.ink }} />
          <input value={newA} onChange={(e) => setNewA(e.target.value)} placeholder="Answer"
            className="px-3 py-2 rounded-xl text-sm outline-none" style={{ fontFamily: "system-ui, sans-serif", background: theme.panel2, border: `1px solid ${theme.border}`, color: theme.ink }} />
        </div>
        <button onClick={addCard} className="mt-3 px-4 py-2 rounded-full text-sm flex items-center gap-2" style={{ fontFamily: "system-ui, sans-serif", border: `1px solid ${theme.border}` }}><Plus size={14} />Add card</button>
      </Card>
    </div>
  );
}

function Quiz({ theme, userId }) {
  const [subject, setSubject] = useState("Math");
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [recent, setRecent] = useState([]);
  const questions = QUIZ_BANKS[subject];

  useEffect(() => {
    let active = true;
    async function loadRecent() {
      const { data } = await supabase
        .from("quiz_results")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);
      if (active && data) setRecent(data);
    }
    loadRecent();
    return () => { active = false; };
  }, [userId, submitted]);

  const score = questions.reduce((acc, q, i) => acc + ((answers[i] || "").toLowerCase().trim() === q.answer.toLowerCase() ? 1 : 0), 0);

  async function submit() {
    setSubmitted(true);
    await supabase.from("quiz_results").insert({ user_id: userId, subject, score, total: questions.length });
  }
  function restart() { setStarted(false); setSubmitted(false); setAnswers({}); }

  return (
    <div>
      <h1 className="text-3xl mb-1">Quiz Generator</h1>
      <SansLabel theme={theme}>Auto-generated from your subject material.</SansLabel>

      {!started && (
        <>
          <Card theme={theme} className="mt-5">
            <SansLabel theme={theme} style={{ fontSize: 12, fontWeight: 600, color: theme.ink }}>Choose a subject</SansLabel>
            <div className="flex flex-wrap gap-2 mt-3">
              {Object.keys(QUIZ_BANKS).map((s) => (
                <button key={s} onClick={() => setSubject(s)} className="px-3 py-1.5 rounded-full text-sm"
                  style={{ fontFamily: "system-ui, sans-serif", background: subject === s ? SUBJECT_COLORS[s] : theme.panel2, color: subject === s ? "#fff" : theme.ink }}>{s}</button>
              ))}
            </div>
            <button onClick={() => setStarted(true)} className="mt-4 px-4 py-2 rounded-full text-sm" style={{ fontFamily: "system-ui, sans-serif", background: theme.accent, color: "#14181F" }}>Generate quiz</button>
          </Card>

          {recent.length > 0 && (
            <Card theme={theme} className="mt-4">
              <SansLabel theme={theme} style={{ fontSize: 12, fontWeight: 600, color: theme.ink }}>Your recent scores</SansLabel>
              <ul className="mt-2 space-y-1.5 text-sm" style={{ fontFamily: "system-ui, sans-serif" }}>
                {recent.map((r) => (
                  <li key={r.id} className="flex justify-between">
                    <span>{r.subject}</span>
                    <span style={{ color: theme.sub }}>{r.score} / {r.total}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}

      {started && !submitted && (
        <div className="space-y-4 mt-5">
          {questions.map((q, i) => (
            <Card key={i} theme={theme}>
              <SansLabel theme={theme} style={{ fontSize: 11 }}>{q.type === "mc" ? "Multiple choice" : q.type === "tf" ? "True / False" : "Fill in the blank"}</SansLabel>
              <p className="mt-1">{q.q}</p>
              {q.type === "mc" && (
                <div className="flex flex-col gap-1.5 mt-2">
                  {q.options.map((o) => (
                    <label key={o} className="flex items-center gap-2 text-sm" style={{ fontFamily: "system-ui, sans-serif" }}>
                      <input type="radio" name={`q${i}`} checked={answers[i] === o} onChange={() => setAnswers((a) => ({ ...a, [i]: o }))} /> {o}
                    </label>
                  ))}
                </div>
              )}
              {q.type === "tf" && (
                <div className="flex gap-3 mt-2">
                  {["True", "False"].map((o) => (
                    <label key={o} className="flex items-center gap-2 text-sm" style={{ fontFamily: "system-ui, sans-serif" }}>
                      <input type="radio" name={`q${i}`} checked={answers[i] === o} onChange={() => setAnswers((a) => ({ ...a, [i]: o }))} /> {o}
                    </label>
                  ))}
                </div>
              )}
              {q.type === "fill" && (
                <input value={answers[i] || ""} onChange={(e) => setAnswers((a) => ({ ...a, [i]: e.target.value }))}
                  className="mt-2 px-3 py-2 rounded-xl text-sm outline-none w-full max-w-xs"
                  style={{ fontFamily: "system-ui, sans-serif", background: theme.panel2, border: `1px solid ${theme.border}`, color: theme.ink }} />
              )}
            </Card>
          ))}
          <button onClick={submit} className="px-4 py-2 rounded-full text-sm" style={{ fontFamily: "system-ui, sans-serif", background: theme.accent, color: "#14181F" }}>Submit quiz</button>
        </div>
      )}

      {submitted && (
        <div className="mt-5">
          <Card theme={theme} accent="#6B9080">
            <div className="flex items-center gap-2"><Trophy size={18} color="#6B9080" /><span className="text-lg">Score: {score} / {questions.length}</span></div>
          </Card>
          <div className="space-y-3 mt-4">
            {questions.map((q, i) => {
              const correct = (answers[i] || "").toLowerCase().trim() === q.answer.toLowerCase();
              return (
                <Card key={i} theme={theme} accent={correct ? "#6B9080" : "#C46A5E"}>
                  <div className="flex items-center gap-2">{correct ? <Check size={15} color="#6B9080" /> : <X size={15} color="#C46A5E" />}<p className="text-sm" style={{ fontFamily: "system-ui, sans-serif" }}>{q.q}</p></div>
                  {!correct && <p className="text-xs mt-1" style={{ fontFamily: "system-ui, sans-serif", color: theme.sub }}>Your answer: {answers[i] || "(blank)"} · Correct: {q.answer}</p>}
                  <p className="text-xs mt-2" style={{ fontFamily: "system-ui, sans-serif", color: theme.sub }}>{q.explain}</p>
                </Card>
              );
            })}
          </div>
          <button onClick={restart} className="mt-4 px-4 py-2 rounded-full text-sm flex items-center gap-2" style={{ fontFamily: "system-ui, sans-serif", border: `1px solid ${theme.border}` }}><RefreshCw size={14} />Try another quiz</button>
        </div>
      )}
    </div>
  );
}

function Planner({ theme, userId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState(""); const [date, setDate] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const { data, error } = await supabase
        .from("planner_items")
        .select("*")
        .eq("user_id", userId)
        .order("exam_date", { ascending: true });
      if (active && !error && data) {
        setItems(data.map((it) => ({ id: it.id, name: it.name, date: it.exam_date })));
      }
      if (active) setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [userId]);

  async function add() {
    if (!name.trim() || !date) return;
    const { data, error } = await supabase
      .from("planner_items")
      .insert({ user_id: userId, name, exam_date: date })
      .select()
      .single();
    if (!error && data) {
      setItems((it) => [...it, { id: data.id, name: data.name, date: data.exam_date }]);
      setName(""); setDate("");
    }
  }
  async function remove(id) {
    await supabase.from("planner_items").delete().eq("id", id);
    setItems((it) => it.filter((i) => i.id !== id));
  }

  const schedule = useMemo(() => {
    const today = new Date();
    return items.map((it) => {
      const target = new Date(it.date);
      const daysLeft = Math.max(1, Math.ceil((target - today) / 86400000));
      const sessions = Math.min(daysLeft, 5);
      const interval = Math.max(1, Math.floor(daysLeft / sessions));
      const plan = Array.from({ length: sessions }, (_, k) => {
        const d = new Date(today.getTime() + k * interval * 86400000);
        return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
      });
      return { ...it, daysLeft, plan };
    });
  }, [items]);

  return (
    <div>
      <h1 className="text-3xl mb-1">Study Planner</h1>
      <SansLabel theme={theme}>{loading ? "Loading your deadlines…" : "Add an exam or deadline and get a revision schedule."}</SansLabel>

      <Card theme={theme} className="mt-5">
        <div className="flex flex-col md:flex-row gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chemistry midterm"
            className="flex-1 px-3 py-2 rounded-xl text-sm outline-none" style={{ fontFamily: "system-ui, sans-serif", background: theme.panel2, border: `1px solid ${theme.border}`, color: theme.ink }} />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm outline-none" style={{ fontFamily: "system-ui, sans-serif", background: theme.panel2, border: `1px solid ${theme.border}`, color: theme.ink }} />
          <button onClick={add} className="px-4 py-2 rounded-full text-sm flex items-center gap-1.5 justify-center" style={{ fontFamily: "system-ui, sans-serif", background: theme.accent, color: "#14181F" }}><Plus size={14} />Add</button>
        </div>
      </Card>

      <div className="space-y-3 mt-4">
        {schedule.map((s) => (
          <Card key={s.id} theme={theme} accent={theme.accent}>
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontWeight: 600 }}>{s.name}</p>
                <SansLabel theme={theme} style={{ fontSize: 12 }}>{s.daysLeft} day{s.daysLeft !== 1 ? "s" : ""} away</SansLabel>
              </div>
              <button onClick={() => remove(s.id)}><Trash2 size={15} color={theme.sub} /></button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              {s.plan.map((d, i) => (
                <span key={i} className="px-2 py-1 rounded-md text-xs" style={{ fontFamily: "system-ui, sans-serif", background: theme.panel2 }}>{d}</span>
              ))}
            </div>
          </Card>
        ))}
        {!loading && items.length === 0 && <SansLabel theme={theme} style={{ fontSize: 13 }}>No deadlines yet — add one above to generate a schedule.</SansLabel>}
      </div>
    </div>
  );
}

function Pomodoro({ theme, userId }) {
  const [mode, setMode] = useState(25);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const [custom, setCustom] = useState(25);
  const intervalRef = useRef(null);
  const prevSessions = useRef(0);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            setSessions((n) => n + 1);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  useEffect(() => {
    if (sessions > prevSessions.current && userId) {
      recordStudySession(userId, modeRef.current);
    }
    prevSessions.current = sessions;
  }, [sessions, userId]);

  function setLength(mins) { setMode(mins); setSecondsLeft(mins * 60); setRunning(false); }
  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const ss = String(secondsLeft % 60).padStart(2, "0");

  return (
    <div>
      <h1 className="text-3xl mb-1">Focus Timer</h1>
      <SansLabel theme={theme}>Pomodoro-style focus sessions.</SansLabel>

      <div className="flex flex-col items-center mt-8">
        <div className="w-56 h-56 rounded-full flex items-center justify-center text-5xl" style={{ border: `4px solid ${theme.accent}`, fontFamily: "system-ui, sans-serif" }}>
          {mm}:{ss}
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={() => setLength(25)} className="px-3 py-1.5 rounded-full text-sm" style={{ fontFamily: "system-ui, sans-serif", background: mode === 25 ? theme.accent : theme.panel2, color: mode === 25 ? "#14181F" : theme.ink }}>25 / 5</button>
          <button onClick={() => setLength(50)} className="px-3 py-1.5 rounded-full text-sm" style={{ fontFamily: "system-ui, sans-serif", background: mode === 50 ? theme.accent : theme.panel2, color: mode === 50 ? "#14181F" : theme.ink }}>50 / 10</button>
          <input type="number" value={custom} onChange={(e) => setCustom(Number(e.target.value))} className="w-16 px-2 py-1.5 rounded-full text-sm text-center outline-none" style={{ fontFamily: "system-ui, sans-serif", background: theme.panel2, border: `1px solid ${theme.border}`, color: theme.ink }} />
          <button onClick={() => setLength(custom)} className="px-3 py-1.5 rounded-full text-sm" style={{ fontFamily: "system-ui, sans-serif", border: `1px solid ${theme.border}` }}>Custom</button>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={() => setRunning(!running)} className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: theme.accent }}>
            {running ? <Pause size={18} color="#14181F" /> : <Play size={18} color="#14181F" />}
          </button>
          <button onClick={() => setLength(mode)} className="w-12 h-12 rounded-full flex items-center justify-center" style={{ border: `1px solid ${theme.border}` }}>
            <RotateCcw size={18} color={theme.ink} />
          </button>
        </div>
        <SansLabel theme={theme} style={{ fontSize: 13, marginTop: 20 }}>{sessions} session{sessions !== 1 ? "s" : ""} completed today · {(sessions * mode / 60).toFixed(1)} hrs focused</SansLabel>
      </div>
    </div>
  );
}
