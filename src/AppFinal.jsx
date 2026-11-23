import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { questionBank } from './data/index.js';
import { SUBJECTS, CLUES_PER_SESSION, HINTS_PER_ITEM, PASSING } from './examConfig.js';
import {
  PLAN_DAYS, DAILY_QUOTAS, accuracyStat, completeDay, dailySet, dayNumber, dueMistakes,
  loadState, recordAnswer, saveState, streak, targetLevel, weakSet, weightedSet, emptyState, startPlan, restartPlan,
} from './plan2.js';

const SESSION_KEY = 'let-english-session-v1';
const EXAM_ORDER = ['gened', 'profed', 'english'];
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const byId = Object.fromEntries(Object.values(questionBank).flat().map((q) => [q.id, q]));
const fmt = (s) => {
  const n = Math.max(0, s);
  if (n >= 3600) return `${Math.floor(n / 3600)}:${String(Math.floor((n % 3600) / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
  return `${String(Math.floor(n / 60)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
};
const pct = (n, d) => (d ? Math.round((100 * n) / d) : 0);

export default function AppFinal() {
  const [state, setState] = useState(loadState);
  const [view, setView] = useState('dashboard');
  const [session, setSession] = useState(null);
  const [storageWarn, setStorageWarn] = useState(false);
  const [crossTabLock, setCrossTabLock] = useState(false);
  const [saved, setSaved] = useState(() => {
    try { const raw = localStorage.getItem(SESSION_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  const sessionRef = useRef(null);
  const stateRef = useRef(state);
  const finishedRef = useRef(false);
  const advanceRef = useRef(false);
  const tabRef = useRef(Math.random().toString(36).slice(2));
  const importRef = useRef(null);
  const day = dayNumber(state);

  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'let-english-state-v1' && e.newValue) {
        try {
          const incoming = JSON.parse(e.newValue);
          if (incoming.startDate) {
            stateRef.current = incoming;
            setState(incoming);
            setStorageWarn('Progress synced from another tab.');
          }
        } catch { /* ignore malformed cross-tab data */ }
      }
      if (e.key === SESSION_KEY) {
        if (!e.newValue) { setSaved(null); return; }
        try {
          const incoming = JSON.parse(e.newValue);
          setSaved(incoming);
          if (incoming.tabId && incoming.tabId !== tabRef.current) {
            setCrossTabLock(true);
            setStorageWarn('Another tab owns this session. Reload here to take it over.');
          }
        } catch { /* ignore malformed cross-tab data */ }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  useEffect(() => { if (!saveState(state)) setStorageWarn(true); }, [state]);

  useEffect(() => {
    if (view !== 'quiz' || !session || session.finished || crossTabLock) return undefined;
    try { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); setSaved(session); }
    catch { setStorageWarn(true); }
    return undefined;
  }, [session, view, crossTabLock]);

  const finishNow = useCallback(() => {
    const s = sessionRef.current;
    if (!s || finishedRef.current || s.finished) return;
    finishedRef.current = true;
    const answered = Object.values(s.answers);
    const correct = answered.filter((a) => a.correct).length;
    const part = {
      subject: s.subject, correct, total: s.ids.length, score: pct(correct, s.ids.length),
      blanks: s.ids.length - answered.length,
      itemAnswers: Object.entries(s.answers).map(([id, a]) => ({ id, correct: a.correct })),
    };
    let next = { ...stateRef.current };
    if (s.source === 'mock') {
      next = { ...next, mockResults: [...next.mockResults, { subject: s.subject, at: Date.now(), score: part.score, total: s.ids.length, blanks: part.blanks }] };
    }
    if (s.source === 'day' && s.day) {
      const ds = { ...(next.daySets || {}), [s.day]: { ...(next.daySets?.[s.day] || {}), [s.subject]: true } };
      next = { ...next, daySets: ds };
      const marks = ds[s.day];
      if (marks.gened && marks.profed && marks.english) next = completeDay(next, s.day);
    }
    if (s.source === 'exam') {
      const parts = [...(s.parts || []), part];
      if (parts.length < 3) {
        const subject = EXAM_ORDER[parts.length];
        const seconds = SUBJECTS[subject].officialMinutes * 60;
        const nextSession = {
          ...s, subject, source: 'exam', ids: weightedSet(subject, dayNumber(next), next, 150),
          index: 0, selected: null, checked: false, answers: {}, confidence: 'sure',
          cluesLeft: 0, hintLevel: 0, secondsLeft: seconds, endsAt: Date.now() + seconds * 1000,
          parts, finished: false, tabId: tabRef.current,
        };
        stateRef.current = next;
        setState(next);
        sessionRef.current = nextSession;
        finishedRef.current = false;
        setSession(nextSession);
        setView('quiz');
        return;
      }
      const avg = Math.round(0.2 * parts[0].score + 0.4 * parts[1].score + 0.4 * parts[2].score);
      const floorOk = parts.every((p) => p.score >= 50);
      next = { ...next, examResults: [...next.examResults, { at: Date.now(), parts, avg, passed: avg >= PASSING.average && floorOk }] };
    }
    stateRef.current = next;
    setState(next);
    try { localStorage.removeItem(SESSION_KEY); } catch { /* storage disabled */ }
    setSaved(null);
    const done = { ...s, finished: true, parts: s.source === 'exam' ? [...(s.parts || []), part] : s.parts };
    sessionRef.current = done;
    setSession(done);
    setView('results');
  }, []);

  useEffect(() => {
    if (view !== 'quiz' || !session || session.mode !== 'timed' || session.finished) return undefined;
    const tick = () => {
      const s = sessionRef.current;
      if (!s || s.finished) return;
      const left = s.endsAt ? Math.max(0, Math.ceil((s.endsAt - Date.now()) / 1000)) : Math.max(0, s.secondsLeft - 1);
      const updated = { ...s, secondsLeft: left };
      sessionRef.current = updated;
      if (left !== s.secondsLeft) setSession(updated);
      if (left <= 0) finishNow();
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [view, session?.mode, session?.finished, session?.endsAt, finishNow]);

  const startSet = ({ subject, ids, mode = 'practice', source = 'practice', dayNo = null, parts = [] }) => {
    if (!ids?.length) return;
    const seconds = mode === 'timed' ? (source === 'mock' || source === 'exam'
      ? SUBJECTS[subject].officialMinutes * 60
      : Math.round((SUBJECTS[subject].officialMinutes * 60 * ids.length) / SUBJECTS[subject].officialItems)) : null;
    const next = {
      subject, mode, source, day: dayNo, ids, parts, index: 0, selected: null, checked: false,
      answers: {}, confidence: 'sure', cluesLeft: CLUES_PER_SESSION, hintLevel: 0,
      secondsLeft: seconds, endsAt: seconds ? Date.now() + seconds * 1000 : null,
      startedAt: Date.now(), finished: false, tabId: tabRef.current,
    };
    finishedRef.current = false;
    advanceRef.current = false;
    setCrossTabLock(false);
    sessionRef.current = next;
    setSession(next);
    setView('quiz');
  };

  const startPractice = (subject) => startSet({ subject, ids: weightedSet(subject, day, state, 30) });
  const startTimed = (subject) => startSet({ subject, ids: weightedSet(subject, day, state, 30), mode: 'timed' });
  const startDay = (subject) => startSet({ subject, ids: dailySet(subject, day, state), source: 'day', dayNo: day });
  const startMock = (subject) => startSet({ subject, ids: weightedSet(subject, day, state, 150), mode: 'timed', source: 'mock' });
  const startExam = () => startSet({ subject: 'gened', ids: weightedSet('gened', day, state, 150), mode: 'timed', source: 'exam' });
  const startWeak = (subject) => startSet({ subject, ids: weakSet(subject, state), source: 'weak' });
  const startDue = () => {
    const ids = dueMistakes(state).slice(0, 10).map((m) => m.id).filter((id) => byId[id]);
    startSet({ subject: ids.length ? byId[ids[0]].subject : 'gened', ids, source: 'due' });
  };

  const beginPlan = () => {
    const next = startPlan(stateRef.current);
    stateRef.current = next;
    setState(next);
  };
  const resetPlan = () => {
    if (!window.confirm('Restart the 80-day clock? Your answers and mistakes stay; completed days are cleared.')) return;
    const next = restartPlan(stateRef.current);
    stateRef.current = next;
    setState(next);
  };

  const resume = () => {
    if (!saved?.ids?.length) return;
    const s = { ...saved };
    if (s.mode === 'timed' && s.endsAt) s.secondsLeft = Math.max(0, Math.ceil((s.endsAt - Date.now()) / 1000));
    finishedRef.current = false;
    advanceRef.current = false;
    sessionRef.current = s;
    setSession(s);
    setView('quiz');
    if (s.mode === 'timed' && s.secondsLeft <= 0) window.setTimeout(finishNow, 0);
  };

  const question = session ? byId[session.ids[session.index]] : null;
  const examLike = session && (session.source === 'mock' || session.source === 'exam');

  const check = () => {
    const s = sessionRef.current;
    if (!s || s.selected === null || s.checked || !question) return;
    const correct = s.selected === question.answer;
    setState((prev) => recordAnswer(prev, question, correct, s.source, s.confidence || 'sure', (s.hintLevel || 0) > 0));
    const updated = { ...s, checked: true, answers: { ...s.answers, [question.id]: { selected: s.selected, correct, confidence: s.confidence } } };
    sessionRef.current = updated;
    setSession(updated);
  };

  const next = () => {
    const s = sessionRef.current;
    if (!s || advanceRef.current) return;
    if (s.index + 1 >= s.ids.length) { advanceRef.current = true; return finishNow(); }
    advanceRef.current = true;
    const updated = { ...s, index: s.index + 1, selected: null, checked: false, hintLevel: 0, confidence: 'sure' };
    sessionRef.current = updated;
    setSession(updated);
    window.setTimeout(() => { advanceRef.current = false; }, 120);
  };

  const revealClue = () => {
    const s = sessionRef.current;
    if (!s || examLike || s.checked || s.selected === null || s.hintLevel >= HINTS_PER_ITEM || s.cluesLeft <= 0) return;
    const updated = { ...s, hintLevel: s.hintLevel + 1, cluesLeft: s.cluesLeft - 1 };
    sessionRef.current = updated;
    setSession(updated);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (view !== 'quiz' || !session) return;
      if (e.target instanceof Element && e.target.closest('button, a, input, textarea, select')) return;
      const k = e.key.toLowerCase();
      if (['a', 'b', 'c', 'd'].includes(k) && !session.checked) {
        e.preventDefault();
        const updated = { ...session, selected: 'abcd'.indexOf(k) };
        sessionRef.current = updated; setSession(updated);
      } else if (k === 'h') { e.preventDefault(); revealClue(); }
      else if (e.key === 'Enter') { e.preventDefault(); if (session.checked) next(); else check(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, session, question]);

  const results = useMemo(() => {
    if (!session) return null;
    const answered = Object.values(session.answers);
    const correct = answered.filter((a) => a.correct).length;
    const topics = {};
    session.ids.forEach((id) => {
      const q = byId[id]; if (!q) return;
      if (!topics[q.topic]) topics[q.topic] = { total: 0, correct: 0 };
      topics[q.topic].total += 1;
      if (session.answers[id]?.correct) topics[q.topic].correct += 1;
    });
    let verdict = null;
    if (session.source === 'exam' && (session.parts?.length || 0) === 3) {
      const parts = session.parts;
      const avg = Math.round(0.2 * parts[0].score + 0.4 * parts[1].score + 0.4 * parts[2].score);
      verdict = { avg, floorOk: parts.every((p) => p.score >= 50), passed: avg >= PASSING.average && parts.every((p) => p.score >= 50) };
    }
    return { correct, total: answered.length, blanks: session.ids.length - answered.length, topics, score: pct(correct, session.ids.length || 1), verdict };
  }, [session]);

  const quit = () => {
    if (!window.confirm('End this session? Your answers so far will be kept only if you resume.')) return;
    try { localStorage.removeItem(SESSION_KEY); } catch { /* storage disabled */ }
    setSaved(null); sessionRef.current = null; setSession(null); setView('dashboard');
  };

  const exportProgress = () => {
    const blob = new Blob([JSON.stringify(state)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `let-reviewer-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setState((s) => ({ ...s, lastExport: Date.now() }));
  };
  const importProgress = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed.startDate || !Array.isArray(parsed.completedDays)) throw new Error('bad file');
        const base = emptyState();
        const merged = {
          ...base, ...parsed,
          answers: { ...base.answers, ...(parsed.answers || {}) },
          completedDays: parsed.completedDays,
          mistakes: Array.isArray(parsed.mistakes) ? parsed.mistakes : [],
          hiddenIds: Array.isArray(parsed.hiddenIds) ? parsed.hiddenIds : [],
          examResults: Array.isArray(parsed.examResults) ? parsed.examResults : [],
          mockResults: Array.isArray(parsed.mockResults) ? parsed.mockResults : [],
          daySets: parsed.daySets && typeof parsed.daySets === 'object' ? parsed.daySets : {},
          topicAnswers: parsed.topicAnswers && typeof parsed.topicAnswers === 'object' ? parsed.topicAnswers : {},
        };
        stateRef.current = merged;
        setState(merged);
      } catch { window.alert('That file is not a LET Reviewer progress export.'); }
    };
    reader.readAsText(file);
  };

  const nav = [
    ['dashboard', 'Dashboard'], ['plan', '80-day plan'], ['mock', 'Mock exams'], ['mistakes', `Mistakes (${dueMistakes(state).length})`],
  ];
  const marks = state.daySets?.[day] || {};
  const stat = (subject) => accuracyStat(state, subject);

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => setView('dashboard')} aria-label="Go to dashboard">
          <span className="brand-mark">LET</span>
          <span><strong>English Reviewer</strong><small>PRC-aligned · offline PWA</small></span>
        </button>
        {view === 'quiz' && session && (
          <div className="hud">
            {session.mode === 'timed' && <span className={`chip timer ${session.secondsLeft < 60 ? 'danger' : ''}`} aria-live="off">⏱ {fmt(session.secondsLeft)}</span>}
            {!examLike && <span className="chip clues">💡 {session.cluesLeft}/{CLUES_PER_SESSION}</span>}
            <span className="chip progress">{session.index + 1}/{session.ids.length}</span>
          </div>
        )}
      </header>

      {storageWarn && <div className="warn" role="alert">{typeof storageWarn === 'string' ? storageWarn : 'Progress could not be saved on this device. Export a backup from the dashboard.'}</div>}

      {view !== 'quiz' && (
        <nav className="nav" aria-label="Sections">
          {nav.map(([id, label]) => (
            <button key={id} className={view === id ? 'active' : ''} aria-current={view === id ? 'page' : undefined} onClick={() => setView(id)}>{label}</button>
          ))}
        </nav>
      )}

      <main className="main">
        {view === 'dashboard' && (
          <section>
            <div className="hero">
              <p className="eyebrow">Philippines · LET secondary · English major</p>
              <h1>{day ? `Day ${day} of ${PLAN_DAYS}` : 'Your 80 days start when you say so'}</h1>
              <p className="lede">{day ? `${state.completedDays.length} days completed · ${streak(state)}-day streak · ${Object.values(questionBank).flat().length.toLocaleString()} clean sourced questions offline.` : 'Practice and mock exams work any time. Press start when you are ready — Day 1 begins that day, not when you first open the app.'}</p>
              {day > 0 && <div className="track big"><div className="track-fill" style={{ width: `${(state.completedDays.length / PLAN_DAYS) * 100}%` }} /></div>}
              <div className="card-actions" style={{ marginTop: 14 }}>
                {day === 0
                  ? <button className="btn primary" onClick={beginPlan}>Start my 80 days</button>
                  : <button className="btn ghost" onClick={resetPlan}>Restart the 80 days</button>}
              </div>
            </div>

            {saved?.ids?.length > 0 && !saved.finished && (
              <div className="resume-card">
                <div><strong>Unfinished session</strong><p>{SUBJECTS[saved.subject]?.short || saved.source} · {saved.source} · item {saved.index + 1} of {saved.ids.length}</p></div>
                <button className="btn primary" onClick={resume}>Resume</button>
              </div>
            )}

            {day > 0 && (
              <div className="card">
                <h2>Today's weighted 30</h2>
              <p className="card-meta">6 Gen Ed / 12 Prof Ed / 12 English — the real 20/40/40 rating split. TOS area targets are applied where the bank has items; thin areas are backfilled from available topics (see Coverage below).</p>
              <div className="card-actions">
                {Object.values(SUBJECTS).map((s) => (
                  <button key={s.id} className={`btn ${marks[s.id] ? 'ghost' : 'primary'}`} onClick={() => startDay(s.id)}>
                    {marks[s.id] ? '✓ ' : ''}{s.short} {DAILY_QUOTAS[s.id]}
                  </button>
                ))}
              </div>
              <div className="card-actions" style={{ marginTop: 10 }}>
                <button className="btn ghost" onClick={startDue}>Due mistakes ({dueMistakes(state).length})</button>
                {Object.values(SUBJECTS).map((s) => (
                  <button key={s.id} className="btn ghost" onClick={() => startWeak(s.id)}>Drill weak {s.short}</button>
                ))}
              </div>
            </div>
            )}

            <div className="cards">
              {Object.values(SUBJECTS).map((s) => {
                const a = stat(s.id);
                return (
                  <article className="card" key={s.id}>
                    <div className="card-top"><h2>{s.short}</h2><span className="pill">{s.officialItems} items · {s.officialMinutes} min</span></div>
                    <p className="card-meta">{questionBank[s.id].length.toLocaleString()} clean items · {a.total >= 20 ? `${a.pct}% unaided (${a.correct}/${a.total}${a.aided ? ` · ${a.aided} aided excluded` : ''})` : `accuracy n/a — answer ${20 - a.total} more`}</p>
                    <div className="mini-track" aria-label={`Accuracy ${a.pct} percent over ${a.total} answers`}><div style={{ width: `${a.total >= 20 ? a.pct : 0}%` }} /></div>
                    <div className="card-actions">
                      <button className="btn primary" onClick={() => startTimed(s.id)}>30 timed</button>
                      <button className="btn ghost" onClick={() => startPractice(s.id)}>Practice</button>
                    </div>
                  </article>
                );
              })}
            </div>

            <section className="info-card">
              <h2>Verified rules</h2>
              <ul>
                <li>Gen Ed 150/120 min · Prof Ed 150/180 min · English 150/210 min (20/40/40).</li>
                <li>Pass: weighted average ≥{PASSING.average}% and no part below {PASSING.floor}%. Exam-day mode computes the real verdict; blanks count as zero.</li>
                <li>Clues are practice-only: 5 per session, 2 hints per item. Mock and exam modes give no hints or per-item feedback.</li>
                <li>Progress is local to this device. Export a backup regularly — clearing site data cannot be undone.</li>
              </ul>
              <p className="fineprint"><strong>Coverage:</strong> all 22 English TOS areas now have at least 5 sourced items; the three previously empty/thin areas were filled with 15 researched questions from LETPass sample items with published rationales. Run <code>npm run coverage</code> to verify.</p>
              <p className="fineprint">Imported items are sourced from the owner's Sir Jay 2026 reviewer and a checked third-party LET bank, but 96% have key-only explanations. Question-quality rejects are logged in <code>src/data/imported/rejects.jsonl</code>.</p>
              <div className="card-actions">
                <button className="btn ghost" onClick={exportProgress}>Export progress</button>
                <button className="btn ghost" onClick={() => importRef.current?.click()}>Import progress</button>
                <input ref={importRef} type="file" accept="application/json" hidden onChange={(e) => importProgress(e.target.files[0])} />
              </div>
              {state.lastExport && <p className="fineprint">Last exported: {new Date(state.lastExport).toLocaleString()}</p>}
            </section>
          </section>
        )}

        {view === 'plan' && (
          <section>
            <div className="hero"><p className="eyebrow">80-day plan</p><h1>{day ? `Day ${day}: ramp up` : 'Plan not started'}</h1>
              <p className="lede">{day ? 'Weeks 1–4 foundations, 5–8 application, 9–12 exam difficulty. Difficulty is nudged only after 20 answers per subject; floor-risk areas get more items, never fewer.' : 'The 80 days begin only when you press start. Practice and mock exams remain available now.'}</p>
              {day === 0 && <button className="btn primary" onClick={beginPlan}>Start my 80 days</button>}
            </div>
            {day > 0 && (<>
            <div className="cards">
              {Object.values(SUBJECTS).map((s) => {
                const a = stat(s.id);
                return (
                  <article className="card" key={s.id}>
                    <div className="card-top"><h2>{s.short}</h2><span className="pill">level {targetLevel(day, a)}</span></div>
                    <p className="card-meta">{marks[s.id] ? "Today's set done." : `${DAILY_QUOTAS[s.id]} TOS-weighted items today.`} {a.total >= 20 ? `${a.pct}% over ${a.total}` : `${a.total}/20 answers toward a reliable accuracy`}</p>
                    <button className="btn primary" onClick={() => startDay(s.id)}>{marks[s.id] ? 'Review again' : `Start ${s.short}`}</button>
                  </article>
                );
              })}
            </div>
            <div className="calendar">
              {Array.from({ length: PLAN_DAYS }, (_, i) => i + 1).map((d) => (
                <span key={d} className={`cal ${state.completedDays.includes(d) ? 'done' : ''} ${d === day ? 'today' : ''}`} title={`Day ${d}`}>{d}</span>
              ))}
            </div>
            <p className="fineprint">Full exam-day rehearsals: days 55, 70 and 78 — use Mock exams → Exam day. No new items in the last two days.</p>
            </>)}
          </section>
        )}

        {view === 'mock' && (
          <section>
            <div className="hero"><p className="eyebrow">Full simulation</p><h1>Mock exams</h1>
              <p className="lede">Exam day runs all three subjects back-to-back (120 + 180 + 210 min), with no clues and no per-item feedback. The verdict uses 20/40/40 and the 75%/50% rule.</p>
            </div>
            <button className="btn primary" onClick={startExam}>Start exam day (3 parts)</button>
            <div className="cards" style={{ marginTop: 14 }}>
              {Object.values(SUBJECTS).map((s) => (
                <article className="card" key={s.id}>
                  <div className="card-top"><h2>{s.short}</h2><span className="pill">150 items · {fmt(s.officialMinutes * 60)}</span></div>
                  <p className="card-meta">Single-subject timed set · no hints, no immediate feedback.</p>
                  <button className="btn ghost" onClick={() => startMock(s.id)}>Start {s.short} mock</button>
                </article>
              ))}
            </div>
            {state.examResults.length > 0 && (
              <div className="info-card"><h2>Exam-day history</h2>
                {state.examResults.slice(-5).reverse().map((r, i) => (
                  <p key={i} className="card-meta">{r.passed ? 'PASS' : 'FAIL'} · {r.avg}% weighted · parts {r.parts.map((p) => `${SUBJECTS[p.subject].short} ${p.score}`).join(' / ')} · {new Date(r.at).toLocaleDateString()}</p>
                ))}
              </div>
            )}
          </section>
        )}

        {view === 'mistakes' && (
          <section>
            <div className="hero"><p className="eyebrow">Spaced review</p><h1>Due mistakes ({dueMistakes(state).length})</h1>
              <p className="lede">Missed items return after 1, 3, 7, 14 and 30 days. A correct answer promotes it; a miss resets it. Guessed-correct answers also enter the queue. An item graduates after two correct answers at the top box.</p>
            </div>
            {dueMistakes(state).length === 0 ? <div className="card"><p className="card-meta">Nothing due today. Keep going.</p></div> : (
              <>
                <button className="btn primary" onClick={startDue}>Review due items</button>
                <div className="mistake-list" style={{ marginTop: 14 }}>
                  {dueMistakes(state).map((m) => {
                    const q = byId[m.id]; if (!q) return null;
                    return (
                      <div className="card mistake" key={m.id}>
                        <p className="topic">{SUBJECTS[q.subject].short} · {q.topic} · box {m.box || 0}</p>
                        <p className="stem">{q.stem.slice(0, 150)}</p>
                        <button className="btn ghost" onClick={() => setState((s) => ({ ...s, hiddenIds: [...new Set([...(s.hiddenIds || []), m.id])], mistakes: s.mistakes.filter((x) => x.id !== m.id) }))}>Hide this item</button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
        )}

        {view === 'quiz' && session && question && (
          <section className="quiz">
            <div className="quiz-head">
              <span className="topic">{session.source === 'exam' ? `EXAM DAY · PART ${(session.parts?.length || 0) + 1}/3` : (session.source === 'due' ? 'DUE REVIEW' : `${SUBJECTS[session.subject].short} · ${question.topic} · L${question.difficulty || 2}`)}</span>
              <button className="linkbtn" onClick={quit}>End session</button>
            </div>
            <div className="track"><div className="track-fill" style={{ width: `${((session.index + (session.checked ? 1 : 0)) / session.ids.length) * 100}%` }} /></div>
            <div className="question-card">
              <p className="qnum">ITEM {session.index + 1} · {session.source}{examLike ? ' · feedback withheld' : ''}</p>
              <h2>{question.stem}</h2>
              <div className="options" role="group" aria-label="Answer choices">
                {question.options.map((opt, i) => {
                  const chosen = session.selected === i;
                  const isKey = session.checked && !examLike && i === question.answer;
                  const wrongPick = session.checked && !examLike && chosen && i !== question.answer;
                  return (
                    <button key={`${question.id}-${i}`} className={`option ${chosen ? 'selected' : ''} ${isKey ? 'key' : ''} ${wrongPick ? 'wrong' : ''}`} aria-pressed={chosen} disabled={session.checked} onClick={() => { const u = { ...session, selected: i }; sessionRef.current = u; setSession(u); }}>
                      <span className="letter">{'ABCD'[i]}</span><span>{opt}</span>
                    </button>
                  );
                })}
              </div>
              {!examLike && !session.checked && (
                <div className="confidence" role="group" aria-label="Confidence">
                  {['guess', 'unsure', 'sure'].map((c) => (
                    <button key={c} className={`btn ${session.confidence === c ? 'primary' : 'ghost'}`} onClick={() => { const u = { ...session, confidence: c }; sessionRef.current = u; setSession(u); }}>{c}</button>
                  ))}
                </div>
              )}
              <div className="controls">
                {!examLike && (
                  <button className="btn clue" onClick={revealClue} disabled={session.checked || session.selected === null || session.cluesLeft <= 0 || session.hintLevel >= HINTS_PER_ITEM}>
                    💡 Clue {session.hintLevel > 0 ? `(${session.hintLevel}/${HINTS_PER_ITEM})` : ''}
                  </button>
                )}
                {!session.checked
                  ? <button className="btn primary" onClick={check} disabled={session.selected === null}>{examLike ? 'Save answer' : 'Check answer'}</button>
                  : <button className="btn primary" onClick={next}>{session.index + 1 >= session.ids.length ? (session.source === 'exam' ? 'Finish part' : 'See results') : 'Next item →'}</button>}
              </div>
              {session.selected === null && !session.checked && !examLike && <p className="hintline">Pick an answer, set confidence, then check or reveal a clue.</p>}
              {session.hintLevel > 0 && (
                <div className="hintbox" aria-live="polite">
                  <strong>Clue {session.hintLevel}</strong><p>{session.hintLevel === 1 ? question.clue1 : question.clue2}</p>
                  <small>{session.cluesLeft} clues left this session</small>
                </div>
              )}
              {session.checked && (
                examLike
                  ? <div className="feedback" role="status"><strong>Answer saved.</strong><p>Feedback is released after the paper is submitted.</p></div>
                  : <div className={`feedback ${session.answers[question.id]?.correct ? 'good' : 'bad'}`} role="status">
                      <strong>{session.answers[question.id]?.correct ? 'Correct' : `Not quite — answer is ${'ABCD'[question.answer]}`}</strong>
                      <p>{question.rationale}</p>
                      <small>Source: {question.source}</small>
                      <button className="linkbtn" onClick={() => setState((s) => ({ ...s, hiddenIds: [...new Set([...(s.hiddenIds || []), question.id])] }))}>Hide this item</button>
                    </div>
              )}
            </div>
          </section>
        )}

        {view === 'results' && session && results && (
          <section className="results">
            <p className="eyebrow">Session complete</p>
            <h1>{session.source === 'exam' ? 'Exam-day verdict' : session.source === 'due' ? 'Due review' : `${SUBJECTS[session.subject]?.short || 'Review'} · ${session.source}`}</h1>
            {results.verdict ? (
              <div className={`score-card ${results.verdict.passed ? 'passed' : 'failed'}`}>
                <div className="score">{results.verdict.passed ? 'PASS' : 'FAIL'}</div>
                <p>Weighted average {results.verdict.avg}% · need ≥{PASSING.average}%</p>
                <p>Floor rule: {results.verdict.floorOk ? 'all parts ≥50%' : 'at least one part below 50%'} — need all parts ≥{PASSING.floor}%</p>
                {session.parts?.map((p) => <p key={p.subject} className="card-meta">{SUBJECTS[p.subject].short}: {p.score}% ({p.correct}/{p.total}, {p.blanks} blank)</p>)}
              </div>
            ) : (
              <div className="score-card">
                <div className="score">{results.score}<span>%</span></div>
                <p>{results.correct} correct · {results.blanks} blank · {session.ids.length} total (blanks count as zero)</p>
                <p className="fineprint">LET requires ≥{PASSING.average}% average and no part below {PASSING.floor}%. {session.source === 'mock' ? 'Mock result saved.' : 'Short sets are practice, not a passing rating.'}</p>
              </div>
            )}
            <><h2>By TOS area (this part's answers)</h2>
              <div className="topic-table">
                {Object.entries(results.topics).map(([topic, v]) => (
                  <div className="topic-row" key={topic}>
                    <span>{topic}</span><strong>{v.correct}/{v.total}</strong>
                    <div className="mini-track"><div style={{ width: `${pct(v.correct, v.total)}%` }} /></div>
                  </div>
                ))}
              </div></>
            <div className="card-actions">
              <button className="btn primary" onClick={() => setView('dashboard')}>Dashboard</button>
              <button className="btn ghost" onClick={() => setView('mistakes')}>Review mistakes</button>
            </div>
          </section>
        )}
      </main>

      <footer><span>LET English Reviewer · offline-first · phone-first</span><button className="linkbtn" onClick={() => setView('dashboard')}>Home</button></footer>
    </div>
  );
}
