import { useState, useEffect, useRef, useCallback } from "react";

/* ─────────────── RECOVERSE — The Year-End Issue ───────────────
   잡지 컨셉: 세션 하나 = 한 호(issue) 발행
   멀티플레이어: 공유 저장소 + 폴링. 각자 자기 폰으로 참여.
   - 호스트가 호를 만들고 코드 공유 → 친구들이 코드로 합류
   - 라운드마다 한 명이 질문(헤드라인)을 쓰고, 모두가 답하고,
     모두 제출되면 스프레드가 공개됨
   개인 책장(지난 호)은 개인 저장소에 보관됨.
──────────────────────────────────────────────────────────────── */

const COLORS = ["#D8451F", "#B98A2A", "#3D7A5C", "#4E6E93", "#7D5578", "#8C4B3A"];
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const POLL_MS = 2500;

const sane = (s) => s.trim().replace(/[\s/\\'"]+/g, "_");

/* ── 저장소 헬퍼 (없는 키는 null) ── */
async function sGet(key, shared) {
  try {
    const r = await window.storage.get(key, shared);
    return r ? JSON.parse(r.value) : null;
  } catch {
    return null;
  }
}
async function sSet(key, value, shared) {
  try {
    await window.storage.set(key, JSON.stringify(value), shared);
    return true;
  } catch {
    return false;
  }
}
async function sList(prefix, shared) {
  try {
    const r = await window.storage.list(prefix, shared);
    return r?.keys || [];
  } catch {
    return [];
  }
}

/* ── 다시 발견: 연도를 가로질러 같은 질문 묶기 ── */
function questionGroups(shelf) {
  const map = new Map();
  for (const issue of shelf) {
    for (const r of issue.rounds || []) {
      const key = (r.question || "").toLowerCase().replace(/[\s?.!,~…'"'"]/g, "");
      if (!key) continue;
      if (!map.has(key)) map.set(key, { question: r.question, entries: [] });
      map.get(key).entries.push({
        year: issue.year,
        title: issue.title,
        answers: r.answers || {},
        participants: issue.participants || [],
      });
    }
  }
  return [...map.values()]
    .map((g) => ({
      ...g,
      years: [...new Set(g.entries.map((e) => e.year))].sort((a, b) => a - b),
    }))
    .sort(
      (a, b) =>
        b.years.length - a.years.length ||
        (b.years[b.years.length - 1] || 0) - (a.years[a.years.length - 1] || 0)
    );
}

const metaKey = (c) => `rs:${c}:meta`;
const pPrefix = (c) => `rs:${c}:p:`;
const aPrefix = (c, r) => `rs:${c}:a:${r}:`;

export default function Recoverse() {
  const [view, setView] = useState("cover"); // cover|create|join|lobby|live|digitize|detail
  const [shelf, setShelf] = useState([]);
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // 세션 공통
  const [me, setMe] = useState("");
  const [code, setCode] = useState("");
  const [meta, setMeta] = useState(null);
  const [players, setPlayers] = useState([]); // 합류 순서
  const [answered, setAnswered] = useState([]); // 이번 라운드 제출자
  const [answers, setAnswers] = useState(null); // 전원 제출 시 {name: text}

  // 입력
  const [nameDraft, setNameDraft] = useState("");
  const [codeDraft, setCodeDraft] = useState("");
  const [qDraft, setQDraft] = useState("");
  const [aDraft, setADraft] = useState("");
  const [sentAnswer, setSentAnswer] = useState(false);

  // 옮겨적기
  const [digi, setDigi] = useState(null);

  // 다시 발견
  const [redisQ, setRedisQ] = useState(null);

  const colorOf = useCallback(
    (name) => COLORS[Math.max(0, players.indexOf(name)) % COLORS.length],
    [players]
  );
  const isHost = meta && meta.host === me;

  /* ── 개인 책장 로드 ── */
  const loadShelf = useCallback(async () => {
    const keys = await sList("rsissue:", false);
    const items = [];
    for (const k of keys) {
      const v = await sGet(k, false);
      if (v) items.push({ ...v, _key: k });
    }
    items.sort((a, b) => (b.year || 0) - (a.year || 0));
    setShelf(items);
  }, []);
  useEffect(() => {
    loadShelf();
  }, [loadShelf]);

  /* ── 폴링 ── */
  const refresh = useCallback(async () => {
    if (!code) return;
    const m = await sGet(metaKey(code), true);
    if (!m) return;
    const pk = await sList(pPrefix(code), true);
    const ps = pk
      .map((k) => k.slice(pPrefix(code).length))
      .sort()
      .map((s) => s.split("~")[1] || s);
    setMeta(m);
    setPlayers(ps);
    if (m.phase === "answer") {
      const ak = await sList(aPrefix(code, m.roundIdx), true);
      const who = ak.map((k) => k.slice(aPrefix(code, m.roundIdx).length));
      setAnswered(who);
      if (ps.length > 0 && who.length >= ps.length) {
        const map = {};
        for (const n of who) map[n] = (await sGet(aPrefix(code, m.roundIdx) + n, true)) || "";
        setAnswers(map);
      } else setAnswers(null);
    } else {
      setAnswered([]);
      setAnswers(null);
    }
  }, [code]);

  useEffect(() => {
    if (view !== "lobby" && view !== "live") return;
    refresh();
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
  }, [view, refresh]);

  // 새 라운드 진입 시 로컬 입력 초기화
  const roundRef = useRef(-1);
  useEffect(() => {
    if (meta && meta.roundIdx !== roundRef.current) {
      roundRef.current = meta.roundIdx;
      setQDraft("");
      setADraft("");
      setSentAnswer(false);
    }
  }, [meta]);

  /* ── 액션 ── */
  async function createIssue() {
    const n = nameDraft.trim();
    if (!n) return;
    setBusy(true);
    const c = Array.from({ length: 4 }, () => CODE_CHARS[(Math.random() * CODE_CHARS.length) | 0]).join("");
    const ok = await sSet(
      metaKey(c),
      { code: c, host: n, phase: "lobby", roundIdx: -1, question: null, asker: null, history: [], year: new Date().getFullYear() },
      true
    );
    if (!ok) {
      setErr("저장소에 연결하지 못했어요. 잠시 후 다시 시도해주세요.");
      setBusy(false);
      return;
    }
    await sSet(pPrefix(c) + Date.now() + "~" + sane(n), 1, true);
    setMe(n);
    setCode(c);
    setErr("");
    setBusy(false);
    setView("lobby");
  }

  async function joinIssue() {
    const n = nameDraft.trim();
    const c = codeDraft.trim().toUpperCase();
    if (!n || c.length !== 4) return;
    setBusy(true);
    const m = await sGet(metaKey(c), true);
    if (!m) {
      setErr("코드에 해당하는 호를 찾지 못했어요. 코드를 확인해주세요.");
      setBusy(false);
      return;
    }
    if (m.phase !== "lobby") {
      setErr("이미 시작된 호예요. 다음 라운드부터 함께하려면 호스트에게 문의!");
      setBusy(false);
      return;
    }
    await sSet(pPrefix(c) + Date.now() + "~" + sane(n), 1, true);
    setMe(n);
    setCode(c);
    setErr("");
    setBusy(false);
    setView("lobby");
  }

  async function startIssue() {
    if (!isHost || players.length < 2) return;
    await sSet(metaKey(code), { ...meta, phase: "question", roundIdx: 0, asker: players[0], question: null }, true);
    refresh();
    setView("live");
  }

  async function submitQuestion() {
    if (!qDraft.trim()) return;
    await sSet(metaKey(code), { ...meta, phase: "answer", question: qDraft.trim() }, true);
    refresh();
  }

  async function submitAnswer() {
    if (!aDraft.trim()) return;
    await sSet(aPrefix(code, meta.roundIdx) + me, aDraft.trim(), true);
    setSentAnswer(true);
    refresh();
  }

  function currentRoundEntry() {
    return { asker: meta.asker, question: meta.question, answers: answers || {} };
  }

  async function nextRound() {
    if (!isHost || !answers) return;
    const hist = [...(meta.history || []), currentRoundEntry()];
    const nextIdx = meta.roundIdx + 1;
    await sSet(
      metaKey(code),
      { ...meta, phase: "question", roundIdx: nextIdx, asker: players[nextIdx % players.length], question: null, history: hist },
      true
    );
    refresh();
  }

  async function endIssue() {
    if (!isHost) return;
    const hist = answers ? [...(meta.history || []), currentRoundEntry()] : meta.history || [];
    await sSet(metaKey(code), { ...meta, phase: "ended", history: hist }, true);
    refresh();
  }

  async function saveIssueToShelf(m) {
    const issue = {
      year: m.year,
      title: `${m.year} 연말호`,
      code: m.code,
      participants: players,
      rounds: m.history || [],
    };
    await sSet(`rsissue:${m.code}-${Date.now()}`, issue, false);
    await loadShelf();
    setCode("");
    setMeta(null);
    setView("cover");
  }

  /* ═══════════ 렌더 ═══════════ */
  const Shell = ({ children }) => (
    <div className="page">
      <StyleSheet />
      <div className="col">{children}</div>
    </div>
  );

  /* ── 표지 ── */
  if (view === "cover") {
    return (
      <Shell>
        <header className="masthead">
          <div className="rule thick" />
          <h1 className="brand">RECOVERSE</h1>
          <div className="deck">
            <span>질문과 답으로 만드는 연말호</span>
            <span>EST. 2016</span>
          </div>
          <div className="rule" />
        </header>

        <p className="coverline">
          한 해에 한 번,
          <br />
          우리는 서로에게
          <br />
          <em>질문</em>이 된다.
        </p>

        <div className="entry">
          <button
            className="entryBtn primary"
            onClick={() => {
              setNameDraft("");
              setErr("");
              setView("create");
            }}
          >
            <span className="eyebrow">NEW ISSUE</span>
            <span className="entryTitle">새 호 발행하기</span>
            <span className="entrySub">코드를 만들어 친구들을 초대해요</span>
          </button>
          <button
            className="entryBtn"
            onClick={() => {
              setNameDraft("");
              setCodeDraft("");
              setErr("");
              setView("join");
            }}
          >
            <span className="eyebrow red">JOIN</span>
            <span className="entryTitle">코드로 참여하기</span>
            <span className="entrySub">각자 자기 폰으로 합류해요</span>
          </button>
          <button
            className="entryBtn"
            onClick={() => {
              setDigi({ mode: "solo", title: "", year: "", names: "", rounds: [], q: "", answers: {} });
              setView("digitize");
            }}
          >
            <span className="eyebrow red">SOLO</span>
            <span className="entryTitle">혼자 쓰기</span>
            <span className="entrySub">여행이든 한 달이든, 지금 나에게 질문을 던져요</span>
          </button>
          <button
            className="entryBtn"
            onClick={() => {
              setDigi({ mode: "paper", title: "", year: "", names: "", rounds: [], q: "", answers: {} });
              setView("digitize");
            }}
          >
            <span className="eyebrow red">BACK ISSUE</span>
            <span className="entryTitle">종이 회고 옮기기</span>
            <span className="entrySub">예전 기록을 지난 호로 복간해요</span>
          </button>
          <button className="entryBtn" onClick={() => setView("rediscover")}>
            <span className="eyebrow red">REDISCOVER</span>
            <span className="entryTitle">다시 발견</span>
            <span className="entrySub">같은 질문에 답한, 다른 해의 나를 만나요</span>
          </button>
        </div>

        <section className="backissues">
          <div className="sectionHead">
            <h2>지난 호</h2>
            <span className="count">{shelf.length}권</span>
          </div>
          {shelf.length === 0 && <p className="empty">아직 발행된 호가 없어요. 첫 호를 만들어보세요.</p>}
          {shelf.map((s, i) => (
            <button
              key={s._key}
              className="issueRow"
              onClick={() => {
                setDetail(s);
                setView("detail");
              }}
            >
              <span className="issueYear">{s.year}</span>
              <span className="issueInfo">
                <b>{s.title}</b>
                <small>
                  {(s.participants || []).join(" · ")} — 질문 {(s.rounds || []).length}개
                </small>
              </span>
              <span className="arrow">→</span>
            </button>
          ))}
        </section>
      </Shell>
    );
  }

  /* ── 발행 / 참여 ── */
  if (view === "create" || view === "join") {
    const creating = view === "create";
    return (
      <Shell>
        <Back onClick={() => setView("cover")} label={creating ? "새 호 발행" : "코드로 참여"} />
        <h1 className="pageTitle">{creating ? "이번 호의 발행인은?" : "어느 호에 합류해요?"}</h1>
        <div className="stack">
          {!creating && (
            <input
              className="input code"
              value={codeDraft}
              onChange={(e) => setCodeDraft(e.target.value.toUpperCase())}
              placeholder="세션 코드 4자리"
              maxLength={4}
            />
          )}
          <input
            className="input"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder="내 이름"
          />
          {err && <p className="error">{err}</p>}
          <button
            className="cta"
            disabled={busy || !nameDraft.trim() || (!creating && codeDraft.length !== 4)}
            onClick={creating ? createIssue : joinIssue}
          >
            {busy ? "연결 중…" : creating ? "발행 준비" : "합류하기"}
          </button>
          {creating && (
            <p className="fineprint">
              세션 내용은 이 프로토타입의 공유 저장소에 올라가요 — 코드를 아는 사람은 볼 수 있어요.
            </p>
          )}
        </div>
      </Shell>
    );
  }

  /* ── 대기실 ── */
  if (view === "lobby") {
    if (meta && meta.phase !== "lobby") {
      setView("live");
      return null;
    }
    return (
      <Shell>
        <Back
          onClick={() => {
            setCode("");
            setMeta(null);
            setView("cover");
          }}
          label="대기실"
        />
        <div className="codeBox">
          <span className="eyebrow">INVITE CODE</span>
          <span className="bigCode">{code}</span>
          <span className="fineprint">친구들에게 이 코드를 알려주세요</span>
        </div>
        <div className="sectionHead">
          <h2>합류한 사람</h2>
          <span className="count">{players.length}명</span>
        </div>
        <div className="stack">
          {players.map((n) => (
            <div key={n} className="playerRow">
              <Dot color={colorOf(n)} />
              <span>{n}</span>
              {meta?.host === n && <span className="hostTag">발행인</span>}
            </div>
          ))}
        </div>
        <div className="gap" />
        {isHost ? (
          <button className="cta" disabled={players.length < 2} onClick={startIssue}>
            {players.length < 2 ? "2명 이상 모이면 시작할 수 있어요" : "이번 호 시작하기"}
          </button>
        ) : (
          <p className="waiting">발행인이 시작하길 기다리는 중…</p>
        )}
      </Shell>
    );
  }

  /* ── 라이브 ── */
  if (view === "live" && meta) {
    const roundNo = meta.roundIdx + 1;
    const myTurn = meta.asker === me;

    let body = null;

    if (meta.phase === "ended") {
      body = (
        <div className="center">
          <div className="stampEnd">閉</div>
          <h1 className="pageTitle centered">
            {meta.year} 연말호,
            <br />
            발행 완료
          </h1>
          <p className="waiting">질문 {(meta.history || []).length}개 · {players.join(" · ")}</p>
          <button className="cta" onClick={() => saveIssueToShelf(meta)}>
            내 책장에 이번 호 꽂기
          </button>
        </div>
      );
    } else if (meta.phase === "question") {
      body = myTurn ? (
        <>
          <h1 className="pageTitle">
            {roundNo}번째 헤드라인,
            <br />내 차례
          </h1>
          <p className="lede">모두에게 던질 질문을 적어주세요.</p>
          <textarea
            className="input area"
            value={qDraft}
            onChange={(e) => setQDraft(e.target.value)}
            placeholder="예) 올해의 나를 건물 하나로 표현한다면?"
            autoFocus
          />
          <PastQuestions meta={meta} />
          <div className="gap" />
          <button className="cta" disabled={!qDraft.trim()} onClick={submitQuestion}>
            헤드라인 확정
          </button>
        </>
      ) : (
        <div className="center">
          <Dot color={colorOf(meta.asker)} size={56} pulse />
          <h1 className="pageTitle centered">
            {meta.asker}이(가)
            <br />
            질문을 쓰는 중
          </h1>
          <PastQuestions meta={meta} centered />
        </div>
      );
    } else if (meta.phase === "answer" && !answers) {
      const iAnswered = sentAnswer || answered.includes(me);
      body = (
        <>
          <Headline no={roundNo} q={meta.question} asker={meta.asker} />
          {iAnswered ? (
            <div className="center small">
              <p className="waiting">
                제출 완료 — {answered.length}/{players.length}명 답했어요
              </p>
              <div className="dotRow">
                {players.map((n) => (
                  <Dot key={n} color={colorOf(n)} dim={!answered.includes(n)} />
                ))}
              </div>
              <p className="fineprint">모두 제출하면 스프레드가 열려요</p>
            </div>
          ) : (
            <>
              <textarea
                className="input area"
                value={aDraft}
                onChange={(e) => setADraft(e.target.value)}
                placeholder="지금 떠오르는 그대로, 짧아도 좋아요"
                autoFocus
              />
              <div className="gap" />
              <button className="cta" disabled={!aDraft.trim()} onClick={submitAnswer}>
                내 답 싣기
              </button>
            </>
          )}
        </>
      );
    } else if (meta.phase === "answer" && answers) {
      body = (
        <>
          <Headline no={roundNo} q={meta.question} asker={meta.asker} />
          <div className="spread">
            {players.map((n, i) => (
              <figure key={n} className="quote" style={{ animationDelay: `${0.15 + i * 0.22}s` }}>
                <blockquote>{answers[n]}</blockquote>
                <figcaption>
                  <Dot color={colorOf(n)} small /> {n}
                </figcaption>
              </figure>
            ))}
          </div>
          {isHost ? (
            <div className="stack">
              <button className="cta" onClick={nextRound}>
                다음 헤드라인으로 ({players[(meta.roundIdx + 1) % players.length]} 차례)
              </button>
              <button className="ghost" onClick={endIssue}>
                이번 호 마감하기
              </button>
            </div>
          ) : (
            <p className="waiting">발행인이 다음 페이지를 넘기길 기다리는 중…</p>
          )}
        </>
      );
    }

    return (
      <Shell>
        <div className="liveBar">
          <span className="eyebrow">
            {meta.year} ISSUE · {code}
          </span>
          <span className="eyebrow red">{meta.phase === "ended" ? "CLOSED" : `ROUND ${String(roundNo).padStart(2, "0")}`}</span>
        </div>
        <div className="rule" />
        <div className="gap" />
        {body}
        {isHost && meta.phase !== "ended" && (
          <>
            <div className="gap big" />
            <button className="endLink" onClick={endIssue}>
              세션 종료하기
            </button>
          </>
        )}
      </Shell>
    );
  }

  /* ── 직접 쓰기: 혼자 쓰기 / 종이 회고 옮기기 ── */
  if (view === "digitize" && digi) {
    const solo = digi.mode === "solo";
    const ps = digi.names.split(",").map((s) => s.trim()).filter(Boolean);
    const qaReady = digi.q.trim() && ps.length > 0 && ps.every((n) => (digi.answers[n] || "").trim());
    return (
      <Shell>
        <Back onClick={() => setView("cover")} label={solo ? "혼자 쓰기" : "복간 — 종이 회고 옮기기"} />
        <p className="lede">
          {solo
            ? "스스로에게 질문을 던지고 답해보세요. 발행하면 책장에 꽂혀요."
            : "보이는 그대로 옮겨 적으면, 지난 호로 책장에 꽂혀요."}
        </p>
        <div className="stack">
          {solo ? (
            <>
              <input className="input" value={digi.title} onChange={(e) => setDigi({ ...digi, title: e.target.value })} placeholder="제목 (예: 제주 여행 회고, 6월의 회고)" />
              <input className="input" value={digi.names} onChange={(e) => setDigi({ ...digi, names: e.target.value })} placeholder="내 이름" />
            </>
          ) : (
            <>
              <input className="input" value={digi.year} onChange={(e) => setDigi({ ...digi, year: e.target.value })} placeholder="연도 (예: 2019)" />
              <input className="input" value={digi.names} onChange={(e) => setDigi({ ...digi, names: e.target.value })} placeholder="참여자 (쉼표 구분 — 예: 민희, 지원)" />
            </>
          )}
        </div>
        {digi.rounds.length > 0 && (
          <div className="pastQ">
            {digi.rounds.map((r, i) => (
              <div key={i}>
                ✓ {i + 1}. {r.question}
              </div>
            ))}
          </div>
        )}
        <div className="qaBox">
          <span className="eyebrow red">질문 {digi.rounds.length + 1}</span>
          <input className="input" value={digi.q} onChange={(e) => setDigi({ ...digi, q: e.target.value })} placeholder="질문" />
          {ps.map((n, i) => (
            <div key={n} className="answerLine">
              <Dot color={COLORS[i % COLORS.length]} />
              <textarea
                className="input area short"
                value={digi.answers[n] || ""}
                onChange={(e) => setDigi({ ...digi, answers: { ...digi.answers, [n]: e.target.value } })}
                placeholder={`${n}의 답`}
              />
            </div>
          ))}
          <button
            className="ghost"
            disabled={!qaReady}
            onClick={() =>
              setDigi({
                ...digi,
                rounds: [...digi.rounds, { asker: ps[digi.rounds.length % ps.length], question: digi.q.trim(), answers: { ...digi.answers } }],
                q: "",
                answers: {},
              })
            }
          >
            이 질문 추가
          </button>
        </div>
        <div className="gap" />
        <button
          className="cta"
          disabled={(solo ? ps.length === 0 : !digi.year.trim()) || digi.rounds.length === 0}
          onClick={async () => {
            const year = solo ? new Date().getFullYear() : parseInt(digi.year, 10) || new Date().getFullYear();
            const title = solo ? digi.title.trim() || `${year} 나의 회고` : `${year} 연말호 (복간)`;
            await sSet(
              `rsissue:${solo ? "solo" : "paper"}-${Date.now()}`,
              { year, title, participants: ps, rounds: digi.rounds },
              false
            );
            await loadShelf();
            setView("cover");
          }}
        >
          {solo ? `발행하기 (${digi.rounds.length}개 질문)` : `지난 호로 꽂기 (${digi.rounds.length}개 질문)`}
        </button>
      </Shell>
    );
  }

  /* ── 다시 발견 ── */
  if (view === "rediscover") {
    const groups = questionGroups(shelf);
    const hasSample = shelf.some((s) => (s._key || "").startsWith("rsissue:sample-"));

    async function addSamples() {
      const mk = (year, a1, a2, b1, b2) => ({
        year,
        title: `${year} 연말호 (예시)`,
        participants: ["민희", "지원"],
        rounds: [
          { asker: "지원", question: "올해 가장 잘한 선택은?", answers: { 민희: a1, 지원: a2 } },
          { asker: "민희", question: "내년의 나에게 한 문장을 남긴다면?", answers: { 민희: b1, 지원: b2 } },
        ],
      });
      await sSet("rsissue:sample-2016", mk(2016, "고민만 하던 스터디를 결국 시작한 것.", "이 회고를 하자고 한 것!", "겁내지 말고 일단 만들어봐.", "건강 챙기면서 가자."), false);
      await sSet("rsissue:sample-2019", mk(2019, "이직. 무서웠지만 배우는 게 훨씬 많았다.", "혼자 떠난 첫 여행.", "완벽하지 않아도 공유하자.", "기록을 미루지 말자."), false);
      await sSet("rsissue:sample-2022", mk(2022, "사이드 프로젝트를 끝까지 배포한 것.", "운동을 습관으로 만든 것.", "속도보다 방향.", "좋아하는 걸 더 자주 말하자."), false);
      await loadShelf();
    }
    async function removeSamples() {
      const keys = await sList("rsissue:sample-", false);
      for (const k of keys) {
        try {
          await window.storage.delete(k, false);
        } catch {}
      }
      await loadShelf();
    }

    return (
      <Shell>
        <Back onClick={() => setView("cover")} label="다시 발견" />
        <h1 className="pageTitle">
          같은 질문,
          <br />
          다른 해의 나
        </h1>
        <p className="lede">여러 해에 걸쳐 반복된 질문일수록 위에 올라와요. 하나를 골라 시간 여행을 시작하세요.</p>

        {groups.length === 0 && (
          <div className="stack">
            <p className="empty">아직 책장이 비어 있어요. 세션을 하거나 종이 회고를 복간하면 여기서 이어져요.</p>
            <button className="ghost" onClick={addSamples}>
              예시 지난 호 3권 꽂아보기
            </button>
          </div>
        )}

        {groups.map((g, i) => (
          <button
            key={i}
            className="redisRow"
            onClick={() => {
              setRedisQ(g);
              setView("rediscoverDetail");
            }}
          >
            <span className="redisQ">{g.question}</span>
            <span className="yearChips">
              {g.years.map((y) => (
                <em key={y}>{y}</em>
              ))}
              {g.years.length > 1 && <b>{g.years.length}개의 해</b>}
            </span>
          </button>
        ))}

        {hasSample && (
          <>
            <div className="gap" />
            <button className="endLink" onClick={removeSamples}>
              예시 데이터 지우기
            </button>
          </>
        )}
      </Shell>
    );
  }

  if (view === "rediscoverDetail" && redisQ) {
    const entries = [...redisQ.entries].sort((a, b) => a.year - b.year);
    return (
      <Shell>
        <Back onClick={() => setView("rediscover")} label="다시 발견" />
        <header className="issueHead">
          <span className="eyebrow red">ACROSS {entries.length > 1 ? `${entries[0].year}–${entries[entries.length - 1].year}` : entries[0].year}</span>
          <h1 className="pageTitle">{redisQ.question}</h1>
          <div className="rule" />
        </header>
        {entries.map((e, i) => (
          <section key={i} className="yearBlock" style={{ animationDelay: `${0.1 + i * 0.18}s` }}>
            <div className="yearMark">
              <span>{e.year}</span>
              <small>{e.title}</small>
            </div>
            <div className="spread still">
              {e.participants.map((n, j) =>
                e.answers?.[n] ? (
                  <figure key={n} className="quote">
                    <blockquote>{e.answers[n]}</blockquote>
                    <figcaption>
                      <Dot color={COLORS[j % COLORS.length]} small /> {n}
                    </figcaption>
                  </figure>
                ) : null
              )}
            </div>
          </section>
        ))}
      </Shell>
    );
  }

  /* ── 지난 호 열람 ── */
  if (view === "detail" && detail) {
    const ps = detail.participants || [];
    return (
      <Shell>
        <Back onClick={() => setView("cover")} label="책장으로" />
        <header className="issueHead">
          <span className="eyebrow red">{detail.year} ISSUE</span>
          <h1 className="pageTitle">{detail.title}</h1>
          <div className="rule" />
          <p className="fineprint">{ps.join(" · ")}</p>
        </header>
        {(detail.rounds || []).map((r, i) => (
          <article key={i} className="archiveRound">
            <Headline no={i + 1} q={r.question} asker={r.asker} />
            <div className="spread still">
              {ps.map((n, j) =>
                r.answers?.[n] ? (
                  <figure key={n} className="quote">
                    <blockquote>{r.answers[n]}</blockquote>
                    <figcaption>
                      <Dot color={COLORS[j % COLORS.length]} small /> {n}
                    </figcaption>
                  </figure>
                ) : null
              )}
            </div>
          </article>
        ))}
      </Shell>
    );
  }

  return (
    <Shell>
      <p className="waiting">불러오는 중…</p>
    </Shell>
  );
}

/* ── 조각들 ── */
function Headline({ no, q, asker }) {
  return (
    <header className="headline">
      <span className="eyebrow red">
        QUESTION {String(no).padStart(2, "0")} <i>by {asker}</i>
      </span>
      <h2>{q}</h2>
      <div className="rule" />
    </header>
  );
}

function PastQuestions({ meta, centered }) {
  const h = meta.history || [];
  if (!h.length) return null;
  return (
    <div className={"pastQ" + (centered ? " centered" : "")}>
      <span className="eyebrow">지금까지의 헤드라인</span>
      {h.map((r, i) => (
        <div key={i}>
          {i + 1}. {r.question}
        </div>
      ))}
    </div>
  );
}

function Dot({ color, size = 14, small, dim, pulse }) {
  const s = small ? 10 : size;
  return (
    <span
      className={pulse ? "pulse" : ""}
      style={{
        display: "inline-block",
        width: s,
        height: s,
        borderRadius: "50%",
        background: dim ? "transparent" : color,
        border: `2px solid ${color}`,
        opacity: dim ? 0.35 : 1,
        flexShrink: 0,
      }}
    />
  );
}

function Back({ onClick, label }) {
  return (
    <div className="backbar">
      <button onClick={onClick}>←</button>
      <span>{label}</span>
    </div>
  );
}

function StyleSheet() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&display=swap');

      .page {
        min-height: 100vh;
        background: #FAF7F0;
        color: #191511;
        font-family: 'Pretendard Variable','Apple SD Gothic Neo','Malgun Gothic',system-ui,sans-serif;
      }
      .col { max-width: 480px; margin: 0 auto; padding: 26px 22px 56px; }
      .rule { border-top: 1px solid #191511; }
      .rule.thick { border-top: 3px solid #191511; }
      .gap { height: 18px; } .gap.big { height: 40px; }

      /* masthead */
      .masthead .brand {
        font-family: 'Gowun Batang', Georgia, serif;
        font-size: 40px; letter-spacing: .04em; margin: 10px 0 6px; font-weight: 700;
      }
      .masthead .deck {
        display: flex; justify-content: space-between;
        font-size: 11px; font-weight: 700; letter-spacing: .12em;
        padding-bottom: 10px; color: #191511;
      }
      .coverline {
        font-family: 'Gowun Batang', Georgia, serif;
        font-size: 30px; line-height: 1.5; margin: 34px 0 36px;
        word-break: keep-all;
      }
      .coverline em { font-style: normal; color: #D8451F; border-bottom: 3px solid #D8451F; }

      .eyebrow { font-size: 11px; font-weight: 800; letter-spacing: .14em; color: #191511; }
      .eyebrow.red { color: #D8451F; }
      .eyebrow i { font-style: normal; letter-spacing: .04em; font-weight: 600; color: #7A736A; }

      /* 입구 */
      .entry { display: grid; gap: 0; border-top: 1px solid #191511; margin-bottom: 44px; }
      .entryBtn {
        display: grid; gap: 3px; text-align: left; padding: 18px 2px;
        background: none; border: none; border-bottom: 1px solid #191511; cursor: pointer;
        font-family: inherit; color: inherit;
      }
      .entryBtn.primary { background: #191511; color: #FAF7F0; padding: 20px 16px; }
      .entryBtn.primary .eyebrow { color: #E7B355; }
      .entryTitle { font-size: 19px; font-weight: 800; }
      .entrySub { font-size: 13px; color: #7A736A; }
      .entryBtn.primary .entrySub { color: #B9B2A6; }

      /* 지난 호 */
      .sectionHead { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
      .sectionHead h2 { font-size: 15px; font-weight: 800; margin: 0; letter-spacing: .02em; }
      .count { font-size: 12px; color: #7A736A; }
      .empty { font-size: 14px; color: #7A736A; }
      .issueRow {
        width: 100%; display: flex; align-items: center; gap: 14px; text-align: left;
        background: none; border: none; border-bottom: 1px solid #DED8CB;
        padding: 14px 2px; cursor: pointer; font-family: inherit; color: inherit;
      }
      .issueYear { font-family: 'Gowun Batang', serif; font-size: 20px; font-weight: 700; }
      .issueInfo { flex: 1; display: grid; gap: 2px; }
      .issueInfo b { font-size: 15px; }
      .issueInfo small { font-size: 12px; color: #7A736A; }
      .arrow { color: #7A736A; }

      /* 폼 */
      .pageTitle {
        font-family: 'Gowun Batang', serif; font-size: 25px; line-height: 1.45;
        margin: 8px 0 16px; word-break: keep-all; font-weight: 700;
      }
      .pageTitle.centered { text-align: center; }
      .lede { font-size: 14px; color: #7A736A; line-height: 1.65; margin: 0 0 18px; }
      .stack { display: grid; gap: 10px; }
      .input {
        width: 100%; box-sizing: border-box; padding: 14px 15px; font-size: 16px;
        font-family: inherit; color: #191511; background: #FFFEFA;
        border: 1px solid #191511; border-radius: 0; outline: none; line-height: 1.6;
      }
      .input:focus { border-color: #D8451F; box-shadow: 2px 2px 0 #D8451F; }
      .input.code { font-size: 22px; letter-spacing: .4em; text-transform: uppercase; text-align: center; font-weight: 800; }
      .input.area { min-height: 120px; resize: none; }
      .input.area.short { min-height: 68px; flex: 1; }
      .cta {
        width: 100%; padding: 16px; font-size: 16px; font-weight: 800;
        background: #D8451F; color: #FFF6F0; border: none; cursor: pointer; font-family: inherit;
      }
      .cta:disabled { opacity: .35; cursor: default; }
      .ghost {
        width: 100%; padding: 14px; font-size: 15px; font-weight: 700;
        background: none; border: 1px solid #191511; cursor: pointer; font-family: inherit; color: #191511;
      }
      .ghost:disabled { opacity: .35; cursor: default; }
      .error { font-size: 13px; color: #D8451F; margin: 0; }
      .fineprint { font-size: 12px; color: #7A736A; line-height: 1.6; margin: 4px 0 0; }
      .backbar { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
      .backbar button { background: none; border: none; font-size: 20px; cursor: pointer; color: #191511; padding: 4px 6px 4px 0; }
      .backbar span { font-size: 12px; font-weight: 800; letter-spacing: .08em; color: #7A736A; }

      /* 대기실 */
      .codeBox {
        display: grid; justify-items: center; gap: 6px; text-align: center;
        border: 1px solid #191511; padding: 22px; margin: 12px 0 26px;
        background: #FFFEFA;
      }
      .bigCode { font-size: 44px; font-weight: 900; letter-spacing: .3em; margin-left: .3em; }
      .playerRow { display: flex; align-items: center; gap: 12px; padding: 12px 2px; border-bottom: 1px solid #DED8CB; font-size: 16px; font-weight: 600; }
      .hostTag { font-size: 11px; font-weight: 800; letter-spacing: .08em; color: #D8451F; margin-left: auto; }
      .waiting { text-align: center; font-size: 14px; color: #7A736A; margin: 18px 0; }

      /* 라이브 */
      .liveBar { display: flex; justify-content: space-between; padding-bottom: 8px; }
      .center { display: grid; justify-items: center; gap: 14px; padding-top: 8vh; text-align: center; }
      .center.small { padding-top: 10px; }
      .dotRow { display: flex; gap: 10px; }
      .pulse { animation: pulse 1.6s ease infinite; }
      @keyframes pulse { 0%,100% { transform: scale(1); opacity: 1 } 50% { transform: scale(1.25); opacity: .6 } }
      .pastQ { margin-top: 20px; display: grid; gap: 6px; font-size: 14px; color: #7A736A; line-height: 1.6; }
      .pastQ.centered { justify-items: center; }
      .pastQ .eyebrow { margin-bottom: 2px; }

      /* 헤드라인 + 스프레드 */
      .headline h2 {
        font-family: 'Gowun Batang', serif; font-size: 26px; line-height: 1.5;
        margin: 10px 0 14px; word-break: keep-all; font-weight: 700;
      }
      .headline { margin-bottom: 18px; }
      .spread { display: grid; gap: 0; margin-bottom: 26px; }
      .quote {
        margin: 0; padding: 16px 2px; border-bottom: 1px solid #DED8CB;
        animation: rise .55s ease both;
      }
      .spread.still .quote { animation: none; }
      .quote blockquote {
        margin: 0 0 8px; font-family: 'Gowun Batang', serif;
        font-size: 17px; line-height: 1.75; word-break: keep-all;
      }
      .quote figcaption { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; letter-spacing: .06em; color: #7A736A; }
      @keyframes rise { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }

      .endLink { display: block; margin: 0 auto; background: none; border: none; font-family: inherit; font-size: 13px; color: #7A736A; text-decoration: underline; cursor: pointer; }
      .stampEnd { font-family: 'Gowun Batang', serif; font-size: 44px; color: #D8451F; border: 2px solid #D8451F; border-radius: 50%; width: 84px; height: 84px; display: grid; place-items: center; }

      /* 복간 */
      .qaBox { border: 1px solid #191511; padding: 16px; display: grid; gap: 10px; margin-top: 16px; background: #FFFEFA; }
      .answerLine { display: flex; gap: 10px; align-items: flex-start; }
      .answerLine > span { margin-top: 14px; }

      /* 다시 발견 */
      .redisRow {
        width: 100%; display: grid; gap: 8px; text-align: left;
        background: none; border: none; border-bottom: 1px solid #DED8CB;
        padding: 16px 2px; cursor: pointer; font-family: inherit; color: inherit;
      }
      .redisQ { font-family: 'Gowun Batang', serif; font-size: 18px; line-height: 1.55; word-break: keep-all; font-weight: 700; }
      .yearChips { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
      .yearChips em { font-style: normal; font-size: 12px; font-weight: 800; letter-spacing: .06em; border: 1px solid #191511; padding: 2px 8px; }
      .yearChips b { font-size: 11px; font-weight: 800; letter-spacing: .08em; color: #D8451F; }
      .yearBlock { margin-bottom: 30px; animation: rise .55s ease both; }
      .yearMark { display: flex; align-items: baseline; gap: 10px; margin-bottom: 4px; }
      .yearMark span { font-family: 'Gowun Batang', serif; font-size: 30px; font-weight: 700; color: #D8451F; }
      .yearMark small { font-size: 12px; color: #7A736A; letter-spacing: .04em; }

      .issueHead { margin: 8px 0 26px; display: grid; gap: 8px; }
      .archiveRound { margin-bottom: 34px; }

      @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
    `}</style>
  );
}
