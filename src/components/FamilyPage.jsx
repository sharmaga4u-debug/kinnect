import React, { useMemo, useState } from 'react';
import { HeartPulse, Pill, Siren, CalendarDays, Clock, Plus, Trash2, BookHeart, Users, Settings2, Mic, Send, Check, Play } from 'lucide-react';
import { useApp, personView, displayName, groupChatKey, messagePreview } from '../context/AppContext';
import { useCare, todayKey } from '../context/CareContext';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';
import { RELATIONS, GENERATIONS, relationById, nativeRelation, MEMORY_PROMPTS } from '../data/relations';
import { WEEKDAYS, fmtTime, parseHHMM, weeklyInMyZone, nextWeekly, goodHoursForAll, myTimeZone, partsIn } from '../utils/tz';
import Avatar from './Avatar';
import Sheet from './Sheet';

/* ── shared bits ──────────────────────────────────────────── */
function Section({ icon: Icon, color, title, action, children }) {
  return (
    <section style={{ marginTop: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 4px 8px' }}>
        <Icon size={19} color={color} />
        <h2 style={{ flex: 1, fontWeight: 800, fontSize: 'calc(1.02rem * var(--app-font-scale))', color: 'var(--c-text)' }}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

// People and groups you can pick as a target (schedules, stories, calendar sharing)
function useTargets() {
  const { kinnectContacts, groups } = useApp();
  return [
    ...Object.values(groups).map(g => ({ key: groupChatKey(g.id), name: g.name, view: { id: g.id, emoji: g.avatar || '👥', avatarBg: '#FEF3C7' }, members: g.members.map(m => m.id) })),
    ...kinnectContacts.map(c => ({ key: c.id, name: c.name, view: c, members: [c.id] })),
  ];
}

function PickPeople({ selected, onChange, max }) {
  const { kinnectContacts } = useApp();
  if (!kinnectContacts.length) return <p style={{ color: 'var(--c-muted)', fontSize: '0.9rem' }}>Add family on Kinnect first (Chats → New chat).</p>;
  return kinnectContacts.map(c => {
    const on = selected.includes(c.id);
    return (
      <button key={c.id} className="list-row" onClick={() => onChange(on ? selected.filter(x => x !== c.id) : [...selected, c.id].slice(0, max || 99))}>
        <Avatar person={c} size={40} />
        <span className="row-main row-title">{c.name}</span>
        <span className={`check-dot ${on ? 'on' : ''}`}>{on && <Check size={15} />}</span>
      </button>
    );
  });
}

/* ═══════════════════════════════════════════════════════════
   Family tab
═══════════════════════════════════════════════════════════ */
export default function FamilyPage() {
  return (
    <div className="page" style={{ paddingTop: 4, paddingBottom: 120 }}>
      <CareCard />
      <WatchingCard />
      <SchedulesCard />
      <CalendarCard />
      <StoriesCard />
      <TreeCard />
    </div>
  );
}

/* ── My care: I'm OK, medicines, SOS ─────────────────────── */
function CareCard() {
  const { care, sayImOk, okToday, markTaken, sendSOS } = useCare();
  const { startCall, people } = useApp();
  const [setup, setSetup] = useState(false);
  const [sos, setSos] = useState(null); // null | 'confirm' | 'sending' | {sent}
  const day = todayKey();
  const log = care.medLog[day] || {};
  const doses = care.medicines.flatMap(m => m.times.map(t => ({ m, t }))).sort((a, b) => a.t.localeCompare(b.t));
  const configured = care.checkIn.enabled || care.medicines.length || care.sosContacts.length;

  return (
    <Section icon={HeartPulse} color="#DB2777" title="My care" action={<button className="pill-btn" onClick={() => setSetup(true)}><Settings2 size={15} /> Set up</button>}>
      <div className="list-card" style={{ padding: 14 }}>
        {care.checkIn.enabled && (
          okToday ? (
            <div className="ok-done">✅ You told your family you're OK today at {new Date(care.lastOk).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
          ) : (
            <button className="im-ok-btn" onClick={sayImOk}>👋 I'm OK today</button>
          )
        )}

        {doses.length > 0 && (
          <div style={{ marginTop: care.checkIn.enabled ? 14 : 0 }}>
            <p className="section-label" style={{ margin: '0 0 6px' }}>Today's medicines</p>
            {doses.map(({ m, t }) => {
              const taken = log[`${m.id}@${t}`];
              const { hour, minute } = parseHHMM(t);
              return (
                <div key={m.id + t} className="list-row" style={{ cursor: 'default', padding: '8px 0' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: taken ? '#DCFCE7' : '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Pill size={20} color={taken ? '#16A34A' : '#D97706'} /></div>
                  <div className="row-main">
                    <p className="row-title">{m.name}{m.dose ? ` · ${m.dose}` : ''}</p>
                    <p className="row-sub">{fmtTime(hour, minute)}{taken ? ` · taken at ${new Date(taken).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : ''}</p>
                  </div>
                  {taken ? <span className="badge badge-green">Taken ✓</span>
                    : <button className="btn btn-sm btn-green" style={{ minHeight: 40 }} onClick={() => markTaken(m.id, t)}>Taken</button>}
                </div>
              );
            })}
          </div>
        )}

        {!configured && (
          <p style={{ color: 'var(--c-muted)', lineHeight: 1.5 }}>
            Set up a daily <strong>I'm OK</strong> check-in, <strong>medicine reminders</strong> and an <strong>SOS</strong> button. Your family is kept in the loop, privately.
          </p>
        )}

        <button className="sos-btn" onClick={() => setSos('confirm')}><Siren size={22} /> SOS · Get help</button>
      </div>

      {setup && <CareSetupSheet onClose={() => setSetup(false)} />}

      {sos && (
        <Sheet title="Send SOS?" onClose={() => setSos(null)}>
          {sos === 'confirm' && (
            <>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.5, color: 'var(--c-text-soft)' }}>
                Your family will get an alert with your location, and Kinnect will call{' '}
                <strong>{(() => { const id = care.sosContacts[0] || care.checkIn.watchers[0] || care.favorites[0]; return id && people[id] ? displayName(people[id]) : 'your first contact'; })()}</strong>.
              </p>
              <button className="sos-btn" style={{ marginTop: 18 }} onClick={async () => {
                setSos('sending');
                const r = await sendSOS();
                if (r.error) { setSos({ error: true }); return; }
                setSos({ sent: true, loc: r.loc });
                if (r.first && people[r.first]) setTimeout(() => startCall(personView(people[r.first]), 'audio'), 800); // emergency: no late-night check
              }}><Siren size={22} /> Yes, send SOS now</button>
              <button className="btn btn-ghost btn-full" style={{ marginTop: 10 }} onClick={() => setSos(null)}>Cancel</button>
            </>
          )}
          {sos === 'sending' && <div className="empty-state"><div className="icon">📍</div><h3>Getting your location…</h3></div>}
          {sos?.sent && <div className="empty-state"><div className="icon">✅</div><h3>SOS sent</h3><p>{sos.loc ? 'Your family has your location.' : 'Location was not available, but your family was alerted.'}</p></div>}
          {sos?.error && <div className="empty-state"><div className="icon">⚠️</div><h3>No SOS contacts yet</h3><p>Tap "Set up" in My care and choose who should get your SOS.</p></div>}
        </Sheet>
      )}
    </Section>
  );
}

function CareSetupSheet({ onClose }) {
  const { care, setCheckIn, saveMedicine, removeMedicine, setSosContacts } = useCare();
  const [enabled, setEnabled] = useState(care.checkIn.enabled);
  const [time, setTime] = useState(care.checkIn.time);
  const [watchers, setWatchers] = useState(care.checkIn.watchers);
  const [sosIds, setSosIds] = useState(care.sosContacts);
  const [med, setMed] = useState(null);
  const [tab, setTab] = useState('checkin');

  if (med) {
    return (
      <Sheet title={med.id ? 'Edit medicine' : 'Add medicine'} onClose={onClose} onBack={() => setMed(null)}>
        <label className="field-label">Medicine name</label>
        <input className="input" value={med.name} onChange={e => setMed({ ...med, name: e.target.value })} placeholder="e.g. Metformin" />
        <label className="field-label" style={{ marginTop: 12 }}>Dose (optional)</label>
        <input className="input" value={med.dose} onChange={e => setMed({ ...med, dose: e.target.value })} placeholder="e.g. 1 tablet after food" />
        <label className="field-label" style={{ marginTop: 12 }}>Times each day</label>
        {med.times.map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <input className="input" type="time" value={t} onChange={e => setMed({ ...med, times: med.times.map((x, j) => (j === i ? e.target.value : x)) })} />
            {med.times.length > 1 && <button className="icon-btn" onClick={() => setMed({ ...med, times: med.times.filter((_, j) => j !== i) })} aria-label="Remove time"><Trash2 size={18} /></button>}
          </div>
        ))}
        <button className="pill-btn" onClick={() => setMed({ ...med, times: [...med.times, '20:00'] })}><Plus size={15} /> Add a time</button>
        <label style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 14 }}>
          <input type="checkbox" checked={med.share !== false} onChange={e => setMed({ ...med, share: e.target.checked })} style={{ width: 20, height: 20 }} />
          Let my family see when I take it
        </label>
        <button className="btn btn-primary btn-full" style={{ marginTop: 16 }} disabled={!med.name.trim()} onClick={async () => { await saveMedicine({ ...med, name: med.name.trim() }); setMed(null); }}>Save medicine</button>
      </Sheet>
    );
  }

  return (
    <Sheet title="Set up my care" onClose={onClose} full
      footer={<button className="btn btn-primary btn-full" onClick={async () => { await setCheckIn({ enabled, time, watchers }); setSosContacts(sosIds); onClose(); }}>Save</button>}>
      <div className="segmented" style={{ marginBottom: 14 }}>
        {[['checkin', "I'm OK"], ['meds', 'Medicines'], ['sos', 'SOS']].map(([id, l]) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{l}</button>
        ))}
      </div>

      {tab === 'checkin' && (
        <>
          <label className="setting-row" style={{ borderTop: 'none' }}>
            <span className="label">Daily "I'm OK" check-in<span className="hint">A reminder each day; one tap tells your family you're fine</span></span>
            <span className="switch"><input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} /><span /></span>
          </label>
          {enabled && (
            <>
              <label className="field-label">Remind me at</label>
              <input className="input" type="time" value={time} onChange={e => setTime(e.target.value)} />
            </>
          )}
          <p className="section-label">Who can see my check-ins & medicines</p>
          <PickPeople selected={watchers} onChange={setWatchers} />
        </>
      )}

      {tab === 'meds' && (
        <>
          {care.medicines.map(m => (
            <div key={m.id} className="list-row" style={{ cursor: 'default' }}>
              <Pill size={22} color="#D97706" />
              <div className="row-main">
                <p className="row-title">{m.name}</p>
                <p className="row-sub">{m.times.map(t => { const { hour, minute } = parseHHMM(t); return fmtTime(hour, minute); }).join(', ')}{m.dose ? ` · ${m.dose}` : ''}</p>
              </div>
              <button className="pill-btn" onClick={() => setMed(m)}>Edit</button>
              <button className="icon-btn" onClick={() => removeMedicine(m.id)} aria-label={`Remove ${m.name}`}><Trash2 size={18} /></button>
            </div>
          ))}
          <button className="btn btn-ghost btn-full" style={{ marginTop: 10 }} onClick={() => setMed({ name: '', dose: '', times: ['08:00'], share: true })}>
            <Plus size={18} /> Add medicine
          </button>
        </>
      )}

      {tab === 'sos' && (
        <>
          <p style={{ color: 'var(--c-muted)', marginBottom: 8 }}>They get an alert with your location, and Kinnect calls the first one.</p>
          <PickPeople selected={sosIds} onChange={setSosIds} max={5} />
        </>
      )}
    </Sheet>
  );
}

/* ── Caregiver view ───────────────────────────────────────── */
function WatchingCard() {
  const { care } = useCare();
  const entries = Object.entries(care.watching || {}).filter(([, w]) => w.enabled || w.meds?.length);
  if (!entries.length) return null;
  const sameDay = (ts, tz) => ts && partsIn(tz || myTimeZone(), ts).d === partsIn(tz || myTimeZone(), Date.now()).d && Date.now() - ts < 86400000;

  return (
    <Section icon={HeartPulse} color="#16A34A" title="Family I look after">
      <div className="list-card">
        {entries.map(([id, w]) => {
          const ok = sameDay(w.lastOk, w.tz);
          const { hour, minute } = parseHHMM(w.time);
          return (
            <div key={id} className="list-row" style={{ cursor: 'default', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '1.6rem' }}>{ok ? '✅' : '⏳'}</div>
              <div className="row-main">
                <p className="row-title">{w.name}</p>
                <p className="row-sub" style={{ whiteSpace: 'normal', color: ok ? '#16A34A' : '#B45309' }}>
                  {ok ? `Said I'm OK at ${new Date(w.lastOk).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
                    : w.enabled ? `No check-in yet today (due ${fmtTime(hour, minute)} their time)` : 'Check-in is off'}
                </p>
                {(w.meds || []).filter(x => Date.now() - x.at < 86400000).slice(0, 3).map((x, i) => (
                  <p key={i} className="row-sub">💊 Took {x.med} at {new Date(x.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ── Scheduled family calls ───────────────────────────────── */
function SchedulesCard() {
  const { care, removeSchedule } = useCare();
  const { openChat } = useApp();
  const [adding, setAdding] = useState(false);
  const list = [...care.schedules].map(s => {
    const { hour, minute } = parseHHMM(s.time);
    return { s, next: nextWeekly(s.tz, s.weekday, hour, minute) };
  }).sort((a, b) => a.next - b.next);

  return (
    <Section icon={CalendarDays} color="var(--c-primary)" title="Family calls" action={<button className="pill-btn" onClick={() => setAdding(true)}><Plus size={15} /> Schedule</button>}>
      <div className="list-card">
        {list.length === 0 && <p style={{ padding: 14, color: 'var(--c-muted)' }}>Set a regular time, like <strong>Sunday 7 PM with Dadi</strong>. Everyone is reminded in their own time zone.</p>}
        {list.map(({ s, next }) => {
          const mine = partsIn(myTimeZone(), next);
          const { hour, minute } = parseHHMM(s.time);
          const differs = s.tz !== myTimeZone();
          return (
            <div key={s.id} className="list-row" onClick={() => openChat(s.chatKey)}>
              <div className="date-chip"><span>{WEEKDAYS[mine.weekday].slice(0, 3)}</span><strong>{fmtTime(mine.hour, mine.minute)}</strong></div>
              <div className="row-main">
                <p className="row-title">{s.title}</p>
                <p className="row-sub">Every {WEEKDAYS[mine.weekday]}{differs ? ` · ${fmtTime(hour, minute)} for ${s.byName || 'them'}` : ''}</p>
              </div>
              <button className="icon-btn" onClick={(e) => { e.stopPropagation(); removeSchedule(s.id); }} aria-label="Remove schedule"><Trash2 size={18} /></button>
            </div>
          );
        })}
      </div>
      {adding && <ScheduleSheet onClose={() => setAdding(false)} />}
    </Section>
  );
}

function ScheduleSheet({ onClose }) {
  const { createSchedule } = useCare();
  const { people, user } = useApp();
  const targets = useTargets();
  const [target, setTarget] = useState(null);
  const [title, setTitle] = useState('Family video call');
  const [weekday, setWeekday] = useState(0);
  const [time, setTime] = useState('19:00');

  // Best hours: when everyone in the chosen chat is between 8 AM and 9 PM
  const zones = useMemo(() => {
    if (!target) return [];
    return [myTimeZone(), ...target.members.filter(id => id !== user.id).map(id => people[id]?.profile?.tz).filter(Boolean)];
  }, [target, people, user.id]);
  const hours = zones.length > 1 ? goodHoursForAll(zones) : [];
  const best = hours.filter(h => h.ok);

  return (
    <Sheet title="Schedule a family call" onClose={onClose} full
      footer={<button className="btn btn-primary btn-full" disabled={!target || !title.trim()} onClick={async () => { await createSchedule({ title: title.trim(), chatKey: target.key, weekday, time }); onClose(); }}>Save & tell everyone</button>}>
      <label className="field-label">Name</label>
      <input className="input" value={title} onChange={e => setTitle(e.target.value)} />
      <label className="field-label" style={{ marginTop: 12 }}>With</label>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {targets.map(t => (
          <button key={t.key} onClick={() => setTarget(t)} className={`chip ${target?.key === t.key ? 'active' : ''}`} style={{ flexShrink: 0 }}>{t.name}</button>
        ))}
      </div>
      <label className="field-label" style={{ marginTop: 12 }}>Every</label>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {WEEKDAYS.map((d, i) => <button key={d} className={`chip ${weekday === i ? 'active' : ''}`} onClick={() => setWeekday(i)} style={{ padding: '6px 12px' }}>{d.slice(0, 3)}</button>)}
      </div>
      <label className="field-label" style={{ marginTop: 12 }}>At (your time)</label>
      <input className="input" type="time" value={time} onChange={e => setTime(e.target.value)} />

      {target && zones.length > 1 && (
        <>
          <p className="section-label">Best time for everyone</p>
          {best.length ? (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {best.map(h => (
                <button key={h.hour} className="chip" style={{ padding: '6px 12px', borderColor: '#86EFAC', color: '#166534' }} onClick={() => setTime(`${String(h.hour).padStart(2, '0')}:00`)}>
                  {fmtTime(h.hour, 0)}
                </button>
              ))}
            </div>
          ) : <p style={{ color: 'var(--c-muted)', fontSize: '0.9rem' }}>There's no hour when everyone is awake (8 AM–9 PM). Pick the least late one.</p>}
          <p style={{ fontSize: '0.8rem', color: 'var(--c-muted)', marginTop: 6 }}>Hours when it's between 8 AM and 9 PM for everyone.</p>
        </>
      )}
    </Sheet>
  );
}

/* ── Family calendar ──────────────────────────────────────── */
function nextOccurrence(date) {
  const [, m, d] = date.split('-').map(Number);
  const now = new Date();
  let at = new Date(now.getFullYear(), m - 1, d);
  if (at < new Date(now.getFullYear(), now.getMonth(), now.getDate())) at = new Date(now.getFullYear() + 1, m - 1, d);
  return at;
}

function CalendarCard() {
  const { care, removeEvent } = useCare();
  const [adding, setAdding] = useState(false);
  const list = care.events.map(e => ({ e, at: nextOccurrence(e.date) })).sort((a, b) => a.at - b.at);
  const days = (at) => Math.round((at - new Date(new Date().toDateString())) / 86400000);

  return (
    <Section icon={CalendarDays} color="#D97706" title="Birthdays & special days" action={<button className="pill-btn" onClick={() => setAdding(true)}><Plus size={15} /> Add</button>}>
      <div className="list-card">
        {list.length === 0 && <p style={{ padding: 14, color: 'var(--c-muted)' }}>Add birthdays and anniversaries. You'll get a reminder on the day, and can share them with a family group.</p>}
        {list.slice(0, 8).map(({ e, at }) => {
          const n = days(at);
          return (
            <div key={e.id} className="list-row" style={{ cursor: 'default' }}>
              <div className="date-chip" style={{ background: '#FEF3C7', color: '#92400E' }}><span>{at.toLocaleDateString([], { month: 'short' })}</span><strong>{at.getDate()}</strong></div>
              <div className="row-main">
                <p className="row-title">{e.kind === 'birthday' ? '🎂' : e.kind === 'anniversary' ? '💐' : '📅'} {e.title}</p>
                <p className="row-sub">{n === 0 ? 'Today!' : n === 1 ? 'Tomorrow' : `In ${n} days`}{e.from ? ` · from ${e.from}` : ''}</p>
              </div>
              <button className="icon-btn" onClick={() => removeEvent(e.id)} aria-label="Remove"><Trash2 size={18} /></button>
            </div>
          );
        })}
      </div>
      {adding && <EventSheet onClose={() => setAdding(false)} />}
    </Section>
  );
}

function EventSheet({ onClose }) {
  const { saveEvent } = useCare();
  const targets = useTargets().filter(t => t.key.startsWith('g:'));
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('birthday');
  const [date, setDate] = useState('');
  const [share, setShare] = useState('');
  return (
    <Sheet title="Add a special day" onClose={onClose}
      footer={<button className="btn btn-primary btn-full" disabled={!title.trim() || !date} onClick={async () => { await saveEvent({ title: title.trim(), kind, date, shareWith: share || undefined }); onClose(); }}>Save</button>}>
      <div className="segmented">
        {[['birthday', '🎂 Birthday'], ['anniversary', '💐 Anniversary'], ['other', '📅 Other']].map(([k, l]) => (
          <button key={k} className={kind === k ? 'active' : ''} onClick={() => setKind(k)}>{l}</button>
        ))}
      </div>
      <label className="field-label" style={{ marginTop: 12 }}>What</label>
      <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder={kind === 'birthday' ? "e.g. Aarav's birthday" : 'e.g. Mom & Dad anniversary'} />
      <label className="field-label" style={{ marginTop: 12 }}>Date</label>
      <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
      {targets.length > 0 && (
        <>
          <label className="field-label" style={{ marginTop: 12 }}>Share with a family group (optional)</label>
          <select className="input" value={share} onChange={e => setShare(e.target.value)}>
            <option value="">Just me</option>
            {targets.map(t => <option key={t.key} value={t.key}>{t.name}</option>)}
          </select>
        </>
      )}
    </Sheet>
  );
}

/* ── Story library: recorded bedtime stories & family memories ── */
export function StoriesCard() {
  const { messagesByChat } = useApp();
  const [recording, setRecording] = useState(false);
  const stories = useMemo(() => Object.values(messagesByChat).flat()
    .filter(m => m.type === 'story' && !m.deleted)
    .sort((a, b) => b.timestamp - a.timestamp), [messagesByChat]);

  return (
    <Section icon={BookHeart} color="#7C3AED" title="Story library" action={<button className="pill-btn" onClick={() => setRecording(true)}><Mic size={15} /> Record</button>}>
      <div className="list-card">
        {stories.length === 0 && (
          <p style={{ padding: 14, color: 'var(--c-muted)', lineHeight: 1.5 }}>
            Grandparents can record <strong>bedtime stories</strong> and <strong>family memories</strong> in their own voice. Kids can listen any time.
          </p>
        )}
        {stories.slice(0, 20).map(m => <StoryRow key={m.id} m={m} />)}
      </div>
      {recording && <StoryRecorderSheet onClose={() => setRecording(false)} />}
    </Section>
  );
}

function StoryRow({ m }) {
  const audio = React.useRef(null);
  const [playing, setPlaying] = useState(false);
  return (
    <div className="list-row" style={{ cursor: 'default' }}>
      <button onClick={() => { const a = audio.current; if (a.paused) a.play(); else a.pause(); }} aria-label={playing ? 'Pause story' : 'Play story'}
        style={{ width: 46, height: 46, minWidth: 46, borderRadius: '50%', border: 'none', background: '#7C3AED', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
        {playing ? '❚❚' : <Play size={20} style={{ marginLeft: 2 }} />}
      </button>
      <div className="row-main">
        <p className="row-title">{m.title || 'Story'}</p>
        <p className="row-sub">{m.isMe ? 'Recorded by you' : `By ${m.senderName}`} · {Math.round((m.duration || 0) / 60) || '<1'} min</p>
      </div>
      <audio ref={audio} src={m.audio} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
    </div>
  );
}

function StoryRecorderSheet({ onClose }) {
  const { sendMessage } = useApp();
  const targets = useTargets();
  const [kind, setKind] = useState('bedtime');
  const [title, setTitle] = useState('');
  const [to, setTo] = useState([]);
  const [recorded, setRecorded] = useState(null);
  const [sent, setSent] = useState(false);
  // 5 minutes at a lower bitrate (speech) keeps stories small enough to send
  const rec = useVoiceRecorder((r) => setRecorded(r), 300, 16000);

  function send() {
    for (const key of to) sendMessage(key, '', 'story', { audio: recorded.audio, duration: recorded.duration, title: title.trim() || (kind === 'bedtime' ? 'Bedtime story' : 'Family memory') });
    setSent(true);
    setTimeout(onClose, 900);
  }

  return (
    <Sheet title="Record a story" onClose={onClose} full>
      {sent ? <div className="empty-state"><div className="icon">📖</div><h3>Story sent!</h3></div> : (
        <>
          <div className="segmented">
            <button className={kind === 'bedtime' ? 'active' : ''} onClick={() => setKind('bedtime')}>🌙 Bedtime story</button>
            <button className={kind === 'memory' ? 'active' : ''} onClick={() => setKind('memory')}>💭 Family memory</button>
          </div>
          <label className="field-label" style={{ marginTop: 12 }}>Title</label>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder={kind === 'bedtime' ? 'e.g. The Clever Rabbit' : 'e.g. My first day of school'} />
          {kind === 'memory' && (
            <>
              <p className="section-label">Need an idea? Tap a question</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {MEMORY_PROMPTS.map(q => <button key={q} className="chip" style={{ justifyContent: 'flex-start', whiteSpace: 'normal', textAlign: 'left' }} onClick={() => setTitle(q)}>{q}</button>)}
              </div>
            </>
          )}

          <div style={{ textAlign: 'center', margin: '20px 0' }}>
            {rec.recording ? (
              <>
                <p style={{ fontSize: '1.4rem', fontWeight: 800 }}><span className="rec-dot" style={{ display: 'inline-block', marginRight: 8 }} />{Math.floor(rec.seconds / 60)}:{String(rec.seconds % 60).padStart(2, '0')}</p>
                <p style={{ color: 'var(--c-muted)', fontSize: '0.85rem' }}>Up to 5 minutes</p>
                <button className="btn btn-primary" style={{ marginTop: 10 }} onClick={rec.send}><Check size={18} /> Finish</button>
              </>
            ) : recorded ? (
              <>
                <audio controls src={recorded.audio} style={{ width: '100%' }} />
                <button className="pill-btn" style={{ marginTop: 8 }} onClick={() => setRecorded(null)}>Record again</button>
              </>
            ) : (
              <button className="record-big" onClick={rec.start} aria-label="Start recording"><Mic size={34} /></button>
            )}
            {rec.error && <p style={{ color: 'var(--c-red)', marginTop: 8 }}>{rec.error}</p>}
          </div>

          {recorded && (
            <>
              <p className="section-label">Send to</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {targets.map(t => {
                  const on = to.includes(t.key);
                  return <button key={t.key} className={`chip ${on ? 'active' : ''}`} onClick={() => setTo(on ? to.filter(x => x !== t.key) : [...to, t.key])}>{t.name}</button>;
                })}
              </div>
              <button className="btn btn-primary btn-full" style={{ marginTop: 16 }} disabled={!to.length} onClick={send}><Send size={18} /> Send story</button>
            </>
          )}
        </>
      )}
    </Sheet>
  );
}

/* ── Family tree ──────────────────────────────────────────── */
function TreeCard() {
  const { care, setRelation } = useCare();
  const { kinnectContacts, user, selectedLanguage } = useApp();
  const [picking, setPicking] = useState(null);
  const placed = kinnectContacts.filter(c => care.relations[c.id]);
  const unplaced = kinnectContacts.filter(c => !care.relations[c.id]);

  return (
    <Section icon={Users} color="#0891B2" title="Family tree">
      <div className="list-card" style={{ padding: 12 }}>
        {GENERATIONS.map(g => {
          const members = g.gen === 0
            ? [{ id: 'me', name: 'You', view: { ...user, emoji: user.avatar } }, ...placed.filter(c => relationById(care.relations[c.id])?.gen === 0).map(c => ({ id: c.id, name: c.name, view: c }))]
            : placed.filter(c => relationById(care.relations[c.id])?.gen === g.gen).map(c => ({ id: c.id, name: c.name, view: c }));
          if (!members.length) return null;
          return (
            <div key={g.gen} className="tree-gen">
              <p className="tree-label">{g.label}</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                {members.map(m => {
                  const rel = relationById(care.relations[m.id]);
                  return (
                    <button key={m.id} className="tree-person" onClick={() => m.id !== 'me' && setPicking(m)}>
                      <Avatar person={m.view} size={54} ring={m.id === 'me'} />
                      <span className="tree-name">{m.name.split(' ')[0]}</span>
                      {rel && <span className="tree-rel">{nativeRelation(rel, selectedLanguage)}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        {unplaced.length > 0 && (
          <>
            <p className="section-label">Tap to add to the tree</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {unplaced.map(c => <button key={c.id} className="chip" onClick={() => setPicking({ id: c.id, name: c.name, view: c })}>+ {c.name.split(' ')[0]}</button>)}
            </div>
          </>
        )}
        {!kinnectContacts.length && <p style={{ color: 'var(--c-muted)' }}>Your family tree fills in as relatives join Kinnect.</p>}
      </div>

      {picking && (
        <Sheet title={`How is ${picking.name.split(' ')[0]} related to you?`} onClose={() => setPicking(null)}>
          {RELATIONS.map(r => (
            <button key={r.id} className="list-row" onClick={() => { setRelation(picking.id, r.id); setPicking(null); }}>
              <span className="row-main">
                <span className="row-title">{r.en}</span>
                <span className="row-sub" style={{ display: 'block' }}>{r.hi} · {r.te}</span>
              </span>
              {care.relations[picking.id] === r.id && <Check size={18} color="var(--c-emerald)" />}
            </button>
          ))}
        </Sheet>
      )}
    </Section>
  );
}
