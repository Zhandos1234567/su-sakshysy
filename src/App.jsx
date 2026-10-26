import { useEffect, useMemo, useState } from "react";

const GOAL_DEFAULT = 2000;
const REGIONS = [
  { name: "Қызылорда", value: 88, level: "Жоғары", color: "coral", note: "Су ресурстарын тиімді пайдалану маңызды." },
  { name: "Түркістан", value: 82, level: "Жоғары", color: "coral", note: "Суару жүйелеріндегі шығынды азайтуға назар аудару." },
  { name: "Жамбыл", value: 61, level: "Орташа", color: "amber", note: "Суды үнемдеу әдеттерін тұрақты ұстану." },
  { name: "Шымкент", value: 54, level: "Орташа", color: "amber", note: "Тұрмыстық су тұтынуды бақылау." },
  { name: "Алматы", value: 32, level: "Төмен", color: "mint", note: "Үнемдеу дағдысын жалғастыру." }
];
const TIPS = [
  ["🚿", "Душ уақытын қысқарту", "Душты бірнеше минутқа қысқарту судың артық шығынын азайтады."],
  ["🚰", "Кранды жабу", "Тіс тазалағанда және сабын қолданғанда кранды қажетсіз ашық қалдырмаңыз."],
  ["🔧", "Ағып тұрған жерді жөндеу", "Кран мен құбырдағы ақауды уақытында түзетіңіз."],
  ["🌧️", "Жаңбыр суын пайдалану", "Қауіпсіз техникалық мақсаттарда жаңбыр суын жинау мүмкіндігін қарастырыңыз."],
  ["🧺", "Кір жууды жоспарлау", "Кір жуғыш машинаны ұсынылған жүктеме шегінде толықтау пайдаланыңыз."],
  ["🌱", "Табиғатты қорғау", "Суды үнемдеу — табиғи ресурстарға жауапкершілікпен қараудың бір бөлігі."]
];
const ADVICE = [
  "Күні бойы суды аз мөлшермен тұрақты ішіп тұрыңыз.",
  "Суды қажетсіз ағызбай, кранды уақытында жабыңыз.",
  "Үйдегі су ағуын мезгіл-мезгіл тексеріңіз.",
  "Су ішкен мөлшерді тіркеу пайдалы әдет қалыптастыруға көмектеседі.",
  "Су ішу қажеттілігі адамға, ауа райына және белсенділікке байланысты өзгеруі мүмкін."
];
const localDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const readToday = () => {
  try {
    const saved = JSON.parse(localStorage.getItem("suSaqshysyState") || "{}");
    return saved.date === localDate() ? saved : { date: localDate(), amount: 0, goal: GOAL_DEFAULT, logs: [] };
  } catch { return { date: localDate(), amount: 0, goal: GOAL_DEFAULT, logs: [] }; }
};
const format = (n) => new Intl.NumberFormat("kk-KZ").format(n);

function Icon({ children }) { return <span className="icon" aria-hidden="true">{children}</span>; }
function SectionTitle({ eyebrow, title, desc, right }) {
  return <div className="section-title"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{desc && <p>{desc}</p>}</div>{right}</div>;
}

export default function App() {
  const [data, setData] = useState(readToday);
  const [activeNav, setActiveNav] = useState("overview");
  const [advice, setAdvice] = useState(ADVICE[0]);
  const [goalInput, setGoalInput] = useState(String(readToday().goal || GOAL_DEFAULT));
  const [customInput, setCustomInput] = useState("");
  const [notice, setNotice] = useState("");
  const [apiStatus, setApiStatus] = useState("Тексерілуде…");
  const [apiHistory, setApiHistory] = useState([]);
  const [backendError, setBackendError] = useState("");

  useEffect(() => {
    localStorage.setItem("suSaqshysyState", JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    fetch("/api/health")
      .then(r => { if (!r.ok) throw new Error("API қолжетімсіз"); return r.json(); })
      .then(json => { setApiStatus("Backend қосылды"); setBackendError(""); if (json.database === "connected") setApiStatus("Backend + PostgreSQL қосылды"); })
      .catch(() => { setApiStatus("Демо режим"); setBackendError("Backend сервері қосылмаған. Frontend жергілікті режимде жұмыс істеп тұр."); });
  }, []);

  useEffect(() => {
    const today = localDate();
    if (data.date !== today) setData({ date: today, amount: 0, goal: data.goal || GOAL_DEFAULT, logs: [] });
  }, [data.date, data.goal]);

  const goal = Math.max(250, Math.min(10000, Number(data.goal) || GOAL_DEFAULT));
  const percent = Math.min(100, Math.round((data.amount / goal) * 100));
  const remaining = Math.max(0, goal - data.amount);
  const completionDays = useMemo(() => {
    try {
      const all = JSON.parse(localStorage.getItem("suSaqshysyCompletedDays") || "[]");
      return all.length;
    } catch { return 0; }
  }, [data.amount, percent]);

  function addWater(amount) {
    setData(prev => {
      const nextAmount = Math.max(0, prev.amount + amount);
      const logs = [...(prev.logs || []), { amount, time: new Date().toISOString() }];
      if (nextAmount >= (Number(prev.goal) || GOAL_DEFAULT)) {
        const days = JSON.parse(localStorage.getItem("suSaqshysyCompletedDays") || "[]");
        if (!days.includes(localDate())) localStorage.setItem("suSaqshysyCompletedDays", JSON.stringify([...days, localDate()]));
      }
      return { ...prev, amount: nextAmount, logs };
    });
    setNotice(`+${amount} мл қосылды`);
    window.setTimeout(() => setNotice(""), 1800);
  }

  function resetToday() {
    setData(prev => ({ ...prev, amount: 0, logs: [] }));
    setNotice("Бүгінгі есеп нөлден басталды");
    window.setTimeout(() => setNotice(""), 1800);
  }

  function saveGoal() {
    const nextGoal = Number(goalInput);
    if (!Number.isFinite(nextGoal) || nextGoal < 250 || nextGoal > 10000) {
      setNotice("Мақсат 250–10000 мл аралығында болуы керек");
      window.setTimeout(() => setNotice(""), 2400);
      return;
    }
    setData(prev => ({ ...prev, goal: nextGoal }));
    setNotice("Күндік мақсат сақталды");
    window.setTimeout(() => setNotice(""), 1800);
  }

  async function syncToBackend() {
    setApiHistory([]);
    try {
      const response = await fetch("/api/water/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: localDate(), amount: data.amount, goal, logs: data.logs || [] })
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Синхрондау сәтсіз аяқталды");
      setApiHistory(json.logs || []);
      setNotice("Backend-ке синхрондалды");
    } catch (err) {
      setNotice("Серверге қосылмады: " + err.message);
    }
    window.setTimeout(() => setNotice(""), 2600);
  }

  const navItems = [
    ["overview", "Шолу"], ["tracker", "Су трекері"], ["statistics", "Статистика"],
    ["regions", "Өңірлер"], ["tips", "Кеңестер"], ["technology", "Технологиялар"]
  ];

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#overview"><span className="brand-mark"><Icon>≈</Icon></span><span><strong>Су сақшысы</strong><small>WATER INTELLIGENCE</small></span></a>
      <div className="side-label">ЖОБА МӘЗІРІ</div>
      <nav className="side-nav" aria-label="Негізгі мәзір">
        {navItems.map(([id, label], i) => <a key={id} href={`#${id}`} className={activeNav === id ? "active" : ""} onClick={() => setActiveNav(id)}><span className="nav-icon">{["◫","◉","▥","⌁","✳","⌘"][i]}</span>{label}{id === "tracker" && <span className="nav-dot" />}</a>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="water-mini"><div className="mini-drop">💧</div><strong>Әр тамшы маңызды</strong><p>Бүгінгі әдет — ертеңгі ресурс.</p><a href="#tips">Кеңестерді оқу ↗</a></div>
        <div className="api-indicator"><span className={apiStatus.includes("қосылды") ? "status-dot online" : "status-dot"} /> <span>{apiStatus}</span></div>
        <div className="profile"><div className="avatar">СС</div><div><strong>Су сақшысы</strong><small>Жеке бақылау тақтасы</small></div><span className="profile-menu">•••</span></div>
      </div>
    </aside>

    <main className="main-content">
      <header className="topbar"><div className="breadcrumb">Жобалар <span>/</span> <strong>Су сақшысы</strong></div><div className="top-actions"><span className="today-chip"><span>●</span> {new Date().toLocaleDateString("kk-KZ", { day: "numeric", month: "long", year: "numeric" })}</span><a className="top-avatar" href="#technology" title="Жоба туралы">СС</a></div></header>

      <section className="hero-panel" id="overview">
        <div className="hero-copy"><span className="hero-tag"><span className="pulse" /> WATER AWARENESS PLATFORM</span><h1>Суды бақыла.<br /><em>Болашақты сақта.</em></h1><p>Күнделікті су тұтынуыңды бақылап, ресурстарды үнемдеуге көмектесетін біртұтас цифрлық кеңістік.</p><div className="hero-cta"><a href="#tracker" className="btn btn-light">Трекерді ашу <span>↘</span></a><a href="#regions" className="btn btn-ghost">Өңірлер дерегі <span>↗</span></a></div><div className="hero-footnote"><span className="tiny-check">✓</span> Күнделікті пайдалы әдеттерді қалыптастыр</div></div>
        <div className="hero-art" aria-hidden="true"><div className="orb orb-one" /><div className="orb orb-two" /><div className="water-ring ring-one" /><div className="water-ring ring-two" /><div className="drop-large">💧</div><div className="art-label label-top"><span>01 / DAILY</span><strong>Су тұтыну</strong></div><div className="art-label label-bottom"><span>LIVE TRACKER</span><strong>{format(data.amount)} <small>мл бүгін</small></strong></div><div className="art-spark">✳</div></div>
      </section>

      <div className="quick-stats">
        <div className="quick-stat"><div className="stat-icon blue">◉</div><div><span>БҮГІН ІШІЛГЕН СУ</span><strong>{format(data.amount)} <small>мл</small></strong><p><b className="positive">{percent}%</b> күндік мақсаттан</p></div><div className="stat-line"><span style={{ width: `${percent}%` }} /></div></div>
        <div className="quick-stat"><div className="stat-icon aqua">◎</div><div><span>ҚАЛҒАН МӨЛШЕР</span><strong>{format(remaining)} <small>мл</small></strong><p>Күндік мақсатқа дейін</p></div><div className="mini-progress"><span style={{ width: `${100 - percent}%` }} /></div></div>
        <div className="quick-stat"><div className="stat-icon gold">✳</div><div><span>МАҚСАТ</span><strong>{format(goal)} <small>мл</small></strong><p>Жеке күндік жоспар</p></div><a href="#tracker" className="stat-link">Өзгерту ↗</a></div>
        <div className="quick-stat"><div className="stat-icon violet">♧</div><div><span>МАҚСАТҚА ЖЕТКЕН КҮН</span><strong>{completionDays} <small>күн</small></strong><p>Осы браузерде сақталған</p></div><span className="stat-badge">Тұрақтылық</span></div>
      </div>

      <section className="content-section" id="tracker">
        <SectionTitle eyebrow="DAILY HABIT" title="Су тұтыну трекері" desc="Күн бойы ішкен су мөлшеріңді тірке және прогресті бақыла." right={<span className="live-chip"><span className="pulse" /> БҮГІНГІ ЕСЕП</span>} />
        <div className="tracker-layout">
          <div className="tracker-card">
            <div className="tracker-head"><div><span className="muted-label">КҮНДІК ПРОГРЕСС</span><h3>Сенің су балансың</h3></div><span className="calendar-icon">▦ {new Date().toLocaleDateString("kk-KZ", { day: "numeric", month: "short" })}</span></div>
            <div className="tracker-main"><div className="donut" style={{ "--progress": `${percent * 3.6}deg` }}><div className="donut-inner"><span>ІШІЛДІ</span><strong>{format(data.amount)}</strong><small>мл су</small><div className="donut-percent">{percent}%</div></div></div><div className="tracker-summary"><span className="summary-kicker">КҮНДІК МАҚСАТ</span><h3>{format(goal)} <small>мл</small></h3><p>{remaining > 0 ? `Мақсатқа жету үшін тағы ${format(remaining)} мл су қажет.` : "Жарайсың! Бүгінгі мақсатыңа жеттің."}</p><div className="summary-progress"><span style={{ width: `${percent}%` }} /></div><div className="progress-caption"><span>0 мл</span><span>{format(goal)} мл</span></div></div></div>
            <div className="add-water-title"><strong>Су қосу</strong><span>Ішкен мөлшеріңді таңда</span></div>
            <div className="water-actions">{[250, 500, 1000].map((amount, i) => <button className="water-add" key={amount} onClick={() => addWater(amount)}><span className={`glass glass-${i}`}>♧</span><strong>+{amount}</strong><small>мл қосу</small></button>)}</div>
            <div className="custom-water"><label htmlFor="customAmount">Басқа мөлшер</label><div><input id="customAmount" type="number" min="1" max="5000" value={customInput} onChange={e => setCustomInput(e.target.value)} placeholder="Мөлшерді мл-мен енгіз" /><button onClick={() => { const n = Number(customInput); if (n > 0 && n <= 5000) { addWater(n); setCustomInput(""); } else setNotice("1–5000 мл аралығындағы мөлшерді енгіз"); }}>Қосу +</button></div></div>
            <button className="reset-link" onClick={resetToday}>↻ Бүгінгі есепті тазалау</button>
          </div>
          <aside className="tracker-side">
            <div className="achievement-card"><div className="achievement-top"><span className="achievement-icon">✦</span><span className="achievement-label">ЖЕТІСТІК</span></div><h3>{percent >= 100 ? "Су жауынгері!" : "Әр қадам маңызды"}</h3><p>{percent >= 100 ? "Күндік мақсатың орындалды. Осы пайдалы әдетті жалғастыр!" : "Кішкентай қадамдар үлкен өзгеріске бастайды. Мақсатыңа біртіндеп жақында."}</p><div className="achievement-bottom"><span>{percent >= 100 ? "🏆 Мақсат орындалды" : "💧 Сенің прогресің"}</span><strong>{percent}%</strong></div><div className="achievement-bar"><span style={{ width: `${percent}%` }} /></div></div>
            <div className="goal-card"><div className="goal-card-title"><span>⚙</span><strong>Күндік мақсатың</strong></div><p>Өзіңе ыңғайлы жоспарды таңда. Қажетті су мөлшері адамға байланысты өзгеруі мүмкін.</p><div className="goal-input-row"><input aria-label="Күндік мақсат мл" type="number" min="250" max="10000" step="250" value={goalInput} onChange={e => setGoalInput(e.target.value)} /><span>мл / күн</span></div><button className="btn btn-dark full-width" onClick={saveGoal}>Мақсатты сақтау <span>→</span></button></div>
          </aside>
        </div>
      </section>

      <section className="content-section" id="statistics">
        <SectionTitle eyebrow="YOUR INSIGHTS" title="Статистика және талдау" desc="Су тұтынуыңды бір жерден бақыла." />
        <div className="analytics-grid">
          <div className="analytics-card"><div className="card-topline"><div><h3>Бүгінгі нәтиже</h3><p>Күндік мақсаттың орындалуы</p></div><span className="small-pill">БҮГІН</span></div><div className="big-number">{percent}<small>%</small></div><div className="bar-chart"><div className="chart-y"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><div className="chart-plot"><div className="chart-gridlines"><i/><i/><i/><i/><i/></div><div className="chart-column"><div className="chart-fill" style={{ height: `${percent}%` }} /><span>Бүгін</span></div><div className="chart-column ghost-column"><div className="chart-fill" style={{ height: "72%" }} /><span>Мақсат</span></div></div></div><div className="chart-foot"><span><i className="legend-dot" /> Нақты мөлшер</span><span><i className="legend-dot pale" /> Жоспар</span></div></div>
          <div className="analytics-card history-card"><div className="card-topline"><div><h3>Соңғы әрекеттер</h3><p>Осы күнгі енгізулер</p></div><span className="history-count">{(data.logs || []).length} жазба</span></div>{(data.logs || []).length ? <div className="history-list">{[...(data.logs || [])].slice(-5).reverse().map((log, i) => <div className="history-row" key={`${log.time}-${i}`}><span className="history-drop">💧</span><span><strong>+{format(log.amount)} мл</strong><small>{new Date(log.time).toLocaleTimeString("kk-KZ", { hour: "2-digit", minute: "2-digit" })}</small></span><b>Тіркелді ✓</b></div>)}</div> : <div className="empty-history"><span>◷</span><strong>Әзірге жазба жоқ</strong><p>Су мөлшерін қоссаң, әрекеттер осында көрінеді.</p></div>}<button className="sync-button" onClick={syncToBackend}>↥ Backend-ке синхрондау</button>{apiHistory.length > 0 && <p className="sync-result">Сервер жауап берді: {apiHistory.length} жазба.</p>}</div>
        </div>
        <div className="weekly-note"><span className="weekly-icon">▦</span><div><strong>Апталық есепті жақсарту</strong><p>Бұл нұсқа күндік жазбаларды браузерде сақтайды. Толық апталық тарих үшін PostgreSQL серверін қосып, деректерді серверге синхронда.</p></div><a href="#technology">Архитектураны көру ↗</a></div>
      </section>

      <section className="content-section" id="regions">
        <SectionTitle eyebrow="WATER & REGIONS" title="Өңірлердегі су тапшылығы" desc="Жобадағы демонстрациялық индекстер. Ресми статистика емес." right={<span className="demo-tag">DEMO DATA</span>} />
        <div className="region-layout"><div className="region-list">{REGIONS.map((r, i) => <div className="region-row" key={r.name}><div className="region-rank">{String(i + 1).padStart(2, "0")}</div><div className="region-info"><strong>{r.name}</strong><small>{r.level} деңгей</small></div><div className="region-meter"><div><span className={r.color} style={{ width: `${r.value}%` }} /></div></div><strong className={`region-percent ${r.color}`}>{r.value}%</strong></div>)}</div><div className="region-feature"><div className="feature-globe">◉</div><span className="eyebrow">СУҒА ЖАУАПКЕРШІЛІКПЕН</span><h3>Әр өңірдің суы — ортақ құндылық.</h3><p>Су ресурстарын сақтау үшін тұрмыста, ауыл шаруашылығында және өндірісте үнемді тәсілдерді қолдану маңызды.</p><a href="#tips">Үнемдеу кеңестері <span>↗</span></a><div className="feature-watermark">H₂O</div></div></div>
      </section>

      <section className="content-section" id="tips">
        <SectionTitle eyebrow="SMALL STEPS, BIG IMPACT" title="Суды үнемдеу жолдары" desc="Күнделікті өмірде қолдануға болатын қарапайым әдеттер." />
        <div className="tips-grid">{TIPS.map(([icon, title, desc], i) => <article className="tip-card" key={title}><div className={`tip-icon tip-${i}`}>{icon}</div><div className="tip-number">0{i + 1}</div><h3>{title}</h3><p>{desc}</p><span className="tip-arrow">↗</span></article>)}</div>
      </section>

      <section className="content-section" id="advice">
        <div className="advice-panel"><div className="advice-visual"><div className="advice-circle">✳</div><div className="advice-orbit" /></div><div className="advice-copy"><span className="eyebrow">SMART WATER HABITS</span><h2>Бүгінгі шағын кеңес</h2><p>{advice}</p><button className="btn btn-dark" onClick={() => setAdvice(ADVICE[Math.floor(Math.random() * ADVICE.length)])}>Басқа кеңес алу <span>↻</span></button><small>Бұл — алдын ала дайындалған кеңестер. Нақты AI API қосылмаған.</small></div></div>
      </section>

      <section className="content-section" id="technology">
        <SectionTitle eyebrow="BUILT FOR THE FUTURE" title="Жоба технологиялары" desc="Frontend, API және дерекқор бір архитектурада біріктірілген." />
        <div className="tech-grid">{[
          ["⚛", "React", "Компоненттерге бөлінген интерактивті интерфейс.", "FRONTEND"],
          ["◈", "Vite", "Жылдам әзірлеу сервері және production build.", "TOOLING"],
          ["⌘", "Node.js + Express", "REST API endpoint-тері және серверлік логика.", "BACKEND"],
          ["▤", "PostgreSQL", "Қолданушылар мен су жазбаларын тұрақты сақтау.", "DATABASE"],
          ["♢", "JWT", "Қорғалған маршруттар үшін токен негізіндегі аутентификацияға дайын құрылым.", "AUTH"],
          ["✓", "Helmet + CORS", "Қауіпсіздік тақырыптары мен рұқсат етілген origin бақылауы.", "SECURITY"]
        ].map(([symbol, name, desc, tag]) => <article className="tech-card" key={name}><div className="tech-card-top"><span className="tech-symbol">{symbol}</span><span className="tech-tag">{tag}</span></div><h3>{name}</h3><p>{desc}</p></article>)}</div>
        <div className="architecture-card"><div><span className="eyebrow">SYSTEM ARCHITECTURE</span><h3>Жүйе қалай жұмыс істейді?</h3><p>Frontend → REST API → Backend → PostgreSQL. Демо режимде негізгі трекер браузердің localStorage қоймасын пайдаланады.</p></div><div className="architecture-flow"><span>React UI</span><b>→</b><span>REST API</span><b>→</b><span>Express</span><b>→</b><span>PostgreSQL</span></div></div>
      </section>

      <footer className="footer"><a className="brand footer-brand" href="#overview"><span className="brand-mark"><Icon>≈</Icon></span><span><strong>Су сақшысы</strong><small>WATER INTELLIGENCE</small></span></a><p>Суды сақтайық — болашақты қорғайық.</p><span>© {new Date().getFullYear()} Су сақшысы · Оқу жобасы</span></footer>
    </main>
    {notice && <div className="toast" role="status">✓ {notice}</div>}
  </div>;
}