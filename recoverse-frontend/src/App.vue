<template>
  <div class="app">
    <!-- Top bar -->
    <header class="topbar">
      <div class="brand">
        <div class="logo">R</div>
        <div class="brandText">
          <h1 class="noWrap">Recoverse</h1>
          <p class="noWrap">2016~ 회고 아카이브 (로컬 저장)</p>
        </div>
      </div>

      <nav class="tabs">
        <button :class="{ on: mode === 'year' }" @click="setMode('year')">연도 보기</button>
        <button :class="{ on: mode === 'compare' }" @click="setMode('compare')">질문 비교</button>
        <button :class="{ on: mode === 'add' }" @click="setMode('add')">빠른 입력</button>
        <button :class="{ on: mode === 'capsules' }" @click="setMode('capsules')">캡슐</button>
      </nav>

      <div class="actions">
        <button @click="onExport" :disabled="entries.length === 0">JSON 내보내기</button>
        <label class="file">
          JSON 가져오기
          <input type="file" accept="application/json" @change="onImportFile" />
        </label>
        <button class="danger" @click="clearAll" :disabled="entries.length === 0">전체 삭제</button>
      </div>
    </header>

    <!-- Main -->
    <main class="main">
      <!-- Mode: YEAR -->
      <section v-if="mode === 'year'" class="layout3">
        <!-- Left: Years -->
        <aside class="panel">
          <div class="panelHead">
            <h2 class="noWrap">연도</h2>
          </div>

          <div class="yearList">
            <button
              v-for="y in years"
              :key="y"
              class="yearBtn"
              :class="{ active: y === selectedYear }"
              @click="selectYear(y)"
              :title="`${y} (${yearCountMap.get(y) ?? 0}개)`"
            >
              <span class="yearNum noWrap">{{ y }}</span>
              <span class="yearCount noWrap">{{ yearCountMap.get(y) ?? 0 }}개</span>
            </button>
          </div>

          <div class="panelFoot">
            <button class="ghost" @click="onClonePrevYear">
              {{ selectedYear - 1 }} → {{ selectedYear }} 질문 복제
            </button>
            <p class="hint">
              답은 빈칸(리스트)으로 생성되고, 이미 있는 질문은 건너뜁니다.
            </p>
          </div>
        </aside>

        <!-- Middle: List -->
        <section class="panel">
          <div class="panelHead">
            <!-- ✅ 여기: “2017 질문” 줄바꿈 금지 -->
            <h2 class="noWrap">{{ selectedYear }} 질문</h2>
            <input v-model="searchText" class="search" placeholder="검색(질문/답)" />
          </div>

          <div class="list">
            <button
              v-for="e in yearEntries"
              :key="e.id"
              class="rowItem"
              :class="{ active: e.id === selectedId }"
              @click="selectEntry(e.id)"
            >
              <div class="rowTop">
                <span class="q">{{ e.q }}</span>
                <span class="badge" v-if="e.answers.length === 0">빈 답</span>
                <span class="badge" v-else>{{ e.answers.length }}개</span>
              </div>
              <div class="rowSub">
                <span class="subText">{{ previewAnswers(e.answers) }}</span>
              </div>
            </button>

            <div v-if="yearEntries.length === 0" class="empty">
              이 연도에 데이터가 없어요.
            </div>
          </div>
        </section>

        <!-- Right: Viewer/Editor -->
        <section class="panel">
          <div class="panelHead">
            <h2 class="noWrap">상세</h2>
            <div class="headBtns">
              <button class="ghost" :disabled="!selectedEntry" @click="openCompareFromSelected">
                같은 질문 비교
              </button>
              <button class="danger" :disabled="!selectedEntry" @click="onDeleteSelected">
                삭제
              </button>
            </div>
          </div>

          <div v-if="!selectedEntry" class="empty detailEmpty">
            왼쪽 목록에서 질문을 선택하세요.
          </div>

          <div v-else class="detail">
            <!-- View -->
            <div class="detailBlock" @keydown="onFormKeydown">
              <div class="kv">
                <div class="k noWrap">연도</div>
                <div class="v">{{ selectedEntry.year }}</div>
              </div>

              <div class="kv">
                <div class="k noWrap">질문</div>
                <div class="v strong">{{ selectedEntry.q }}</div>
              </div>

              <div class="kv">
                <div class="k noWrap">답</div>
                <div class="v">
                  <ol v-if="selectedEntry.answers.length" class="answerList">
                    <li v-for="(a, i) in selectedEntry.answers" :key="i" class="answerItem">
                      {{ a }}
                    </li>
                  </ol>
                  <div v-else class="muted">(빈 답)</div>
                </div>
              </div>
            </div>

            <div class="divider"></div>

            <!-- Edit -->
            <div class="detailBlock">
              <h3 class="noWrap">수정</h3>

              <div class="formGrid">
                <label>
                  <span class="noWrap">연도</span>
                  <select v-model.number="form.year">
                    <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
                  </select>
                </label>

                <label class="wide">
                  <span class="noWrap">질문</span>
                  <input v-model="form.q" placeholder="질문" />
                </label>

                <label class="wide">
                  <span class="noWrap">답(여러 개 가능)</span>

                  <div class="answersEditor">
                    <div v-for="(ans, idx) in form.answers" :key="idx" class="answerRow">
                      <div class="num noWrap">{{ idx + 1 }}</div>
                      <textarea
                        class="answerTA"
                        :ref="(el) => setAnswerRef(el as HTMLTextAreaElement, idx)"
                        v-model="form.answers[idx]"
                        placeholder="답 입력 (Enter=다음, Shift+Enter=줄바꿈)"
                        rows="1"
                        @input="(e) => autoGrow(e.target as HTMLTextAreaElement)"
                        @keydown="(e) => onAnswerKeydown(e, idx)"
                      ></textarea>
                      <button
                        class="small danger"
                        @click="removeAnswer(idx)"
                        :disabled="form.answers.length <= 1"
                      >
                        삭제
                      </button>
                    </div>

                    <div class="answerBtns">
                      <button class="small ghost" @click="addAnswer">+ 답 추가</button>
                      <button class="small ghost" @click="clearEmptyAnswers">빈칸 정리</button>
                    </div>

                    <p class="hint" style="margin: 6px 0 0;">
                      저장 시 빈칸 답은 자동으로 제거돼요.
                    </p>
                  </div>
                </label>
              </div>

              <div class="btnRow">
                <button class="primary" @click="onSaveEdit" :disabled="!editingId">수정 저장</button>
                <button class="ghost" @click="cancelEdit" :disabled="!editingId">수정 취소</button>
              </div>

              <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
            </div>
          </div>
        </section>
      </section>

      <!-- Mode: COMPARE -->
      <section v-else-if="mode === 'compare'" class="layoutCompare">
        <aside class="panel">
          <div class="panelHead">
            <h2 class="noWrap">질문 선택</h2>
            <input v-model="compareSearch" class="search" placeholder="질문 검색" />
          </div>

          <div class="list">
            <button
              v-for="q in filteredQuestionBank"
              :key="q.q"
              class="rowItem"
              :class="{ active: q.q === compareQ }"
              @click="compareQ = q.q"
            >
              <div class="rowTop">
                <span class="q">{{ q.q }}</span>
                <span class="count noWrap">{{ q.count }}회</span>
              </div>
              <div class="rowSub">
                <span class="subText">최근: {{ fmtDate(q.lastAt) }}</span>
              </div>
            </button>

            <div v-if="filteredQuestionBank.length === 0" class="empty">
              질문이 없어요. 먼저 입력부터 해줘요.
            </div>
          </div>
        </aside>

        <section class="panel">
          <div class="panelHead">
            <h2 class="noWrap">연도별 답</h2>
            <div class="headBtns">
              <button class="ghost" @click="setMode('year')">연도 보기로</button>
            </div>
          </div>

          <div v-if="!compareQ" class="empty">
            왼쪽에서 질문을 선택하면 연도별 답이 펼쳐져요.
          </div>

          <div v-else class="compare">
            <div class="compareTitle">
              <div class="label noWrap">질문</div>
              <div class="value">{{ compareQ }}</div>
            </div>

            <div class="timeline">
              <div v-for="t in compareTimeline" :key="t.id" class="tlCard">
                <div class="tlHead">
                  <span class="tlYear noWrap">{{ t.year }}</span>
                  <button class="small" @click="jumpToEdit(t.id)">이 답 수정</button>
                </div>

                <div class="tlBody">
                  <ol v-if="t.answers.length" class="answerList">
                    <li v-for="(a, i) in t.answers" :key="i" class="answerItem">{{ a }}</li>
                  </ol>
                  <div v-else class="muted">(빈 답)</div>
                </div>
              </div>

              <div v-if="compareTimeline.length === 0" class="empty">
                아직 이 질문의 답이 없어요.
              </div>
            </div>
          </div>
        </section>
      </section>

      <!-- Mode: CAPSULES -->
      <section v-else-if="mode === 'capsules'" class="layoutAdd">
        <section class="panel">
          <div class="panelHead">
            <h2 class="noWrap">회고 캡슐</h2>
            <div class="headBtns">
              <button class="ghost" @click="onExportCapsules" :disabled="capsules.length === 0">
                캡슐 JSON 내보내기
              </button>
              <label class="file smallFile">
                캡슐 JSON 가져오기
                <input type="file" accept="application/json" @change="onImportCapsuleFile" />
              </label>
              <button class="ghost" @click="refreshCapsules">새로고침</button>
            </div>
          </div>

          <div class="panelHead">
            <input
              v-model="capsuleSearch"
              class="search capsuleSearch"
              placeholder="캡슐 검색"
            />
          </div>

          <div class="list">
            <button
              v-for="capsule in filteredCapsules"
              :key="capsule.id"
              class="rowItem"
              :class="{ active: capsule.id === selectedCapsuleId }"
              @click="selectCapsule(capsule.id)"
            >
              <div class="rowTop">
                <span class="q">{{ capsule.title }}</span>
                <span class="badge">{{ capsule.type }}</span>
              </div>
              <div class="rowSub">
                <span class="subText">
                  질문 {{ capsuleStats.get(capsule.id)?.cards ?? 0 }}개 /
                  답변 {{ capsuleStats.get(capsule.id)?.answered ?? 0 }}개
                </span>
              </div>
              <div v-if="capsule.description" class="rowSub">
                <span class="subText">{{ capsule.description }}</span>
              </div>
            </button>

            <div v-if="capsules.length === 0" class="empty">
              아직 캡슐이 없어요. 오른쪽에서 첫 회고 캡슐을 만들어보세요.
            </div>
            <div v-else-if="filteredCapsules.length === 0" class="empty">
              검색 결과가 없어요.
            </div>
          </div>

          <div class="panelFoot">
            <div v-if="discoveryCard" class="discoverBox">
              <div class="muted">다시 발견하기</div>
              <div class="strong">{{ discoveryCapsuleTitle }}</div>
              <div class="q">{{ discoveryCard.questionText }}</div>
              <div class="rowSub">{{ previewAnswers(discoveryCard.answers) }}</div>
            </div>
            <p v-else class="hint">
              답변이 쌓이면 오래된 질문을 다시 꺼내 보여줄 수 있어요.
            </p>
          </div>
        </section>

        <aside class="panel">
          <div class="panelHead">
            <h2 class="noWrap">새 캡슐 만들기</h2>
          </div>

          <div class="addWrap">
            <div class="formGrid">
              <label class="wide">
                <span class="noWrap">제목</span>
                <input v-model="capsuleForm.title" placeholder="예: 20대 회고, 여행 회고" />
              </label>

              <label class="wide">
                <span class="noWrap">설명</span>
                <input v-model="capsuleForm.description" placeholder="이 캡슐에 담고 싶은 기억" />
              </label>

              <label>
                <span class="noWrap">유형</span>
                <select v-model="capsuleForm.type">
                  <option value="year">연도</option>
                  <option value="life_stage">시기</option>
                  <option value="career">커리어</option>
                  <option value="relationship">관계</option>
                  <option value="travel">여행</option>
                  <option value="project">프로젝트</option>
                  <option value="custom">직접 설정</option>
                </select>
              </label>

              <label>
                <span class="noWrap">기본 질문</span>
                <select v-model="capsuleForm.templateId">
                  <option value="">없음</option>
                  <option v-for="template in capsuleTemplates" :key="template.id" :value="template.id">
                    {{ template.title }}
                  </option>
                </select>
              </label>
            </div>

            <div class="btnRow">
              <button class="primary" @click="onCreateCapsule">캡슐 만들기</button>
              <button class="ghost" @click="resetCapsuleForm">초기화</button>
            </div>

            <p v-if="capsuleError" class="error">{{ capsuleError }}</p>
            <p v-if="capsuleNotice" class="hint">{{ capsuleNotice }}</p>
            <p class="hint">
              기본 질문을 고르면 캡슐 안에 질문 카드가 함께 만들어져요.
            </p>
          </div>

          <div class="divider"></div>

          <div v-if="!selectedCapsule" class="empty">
            왼쪽에서 캡슐을 선택하면 질문 카드를 볼 수 있어요.
          </div>

          <div v-else class="addWrap">
            <div class="detailBlock">
              <h3 class="noWrap">{{ selectedCapsule.title }}</h3>
              <div class="btnRow">
                <button class="danger" @click="deleteSelectedCapsule">캡슐 삭제</button>
              </div>
              <div class="chips">
                <button
                  v-for="card in selectedCapsuleCards"
                  :key="card.id"
                  class="chip"
                  :class="{ active: card.id === selectedCapsuleCardId }"
                  @click="selectCapsuleCard(card.id)"
                >
                  {{ card.questionText }}
                </button>
              </div>

              <div class="btnRow">
                <button class="ghost" @click="addCapsuleCard">+ 질문 카드</button>
              </div>

              <div v-if="selectedCapsuleCard" class="formGrid">
                <label class="wide">
                  <span class="noWrap">질문</span>
                  <input v-model="capsuleCardForm.questionText" placeholder="질문을 입력하세요" />
                </label>

                <label class="wide">
                  <span class="noWrap">답변</span>
                  <textarea
                    v-model="capsuleCardForm.answersText"
                    rows="7"
                    placeholder="답변을 한 줄에 하나씩 적어보세요"
                  ></textarea>
                </label>
              </div>

              <div v-if="selectedCapsuleCard" class="btnRow">
                <button class="primary" @click="saveSelectedCapsuleCard">질문 저장</button>
                <button class="danger" @click="deleteSelectedCapsuleCard">질문 삭제</button>
              </div>

              <div v-else class="empty">
                질문 카드를 추가하거나 선택해 주세요.
              </div>
            </div>
          </div>
        </aside>
      </section>

      <!-- Mode: ADD -->
      <section v-else-if="mode === 'add'" class="layoutAdd">
        <section class="panel">
          <div class="panelHead">
            <h2 class="noWrap">빠른 입력</h2>
            <div class="headBtns">
              <button class="ghost" @click="setMode('year')">연도 보기로</button>
            </div>
          </div>

          <div class="addWrap" @keydown="onFormKeydown">
            <div class="formGrid">
              <label>
                <span class="noWrap">연도</span>
                <select v-model.number="form.year">
                  <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
                </select>
              </label>

              <label class="wide">
                <span class="noWrap">질문</span>
                <input v-model="form.q" placeholder="질문을 입력하거나 오른쪽 추천 클릭" />
              </label>

              <label class="wide">
                <span class="noWrap">답(여러 개 가능)</span>
                <div class="answersEditor">
                  <div v-for="(ans, idx) in form.answers" :key="idx" class="answerRow">
                    <div class="num noWrap">{{ idx + 1 }}</div>
                    <textarea
                      class="answerTA"
                      :ref="(el) => setAnswerRef(el as HTMLTextAreaElement, idx)"
                      v-model="form.answers[idx]"
                      placeholder="답 입력 (Enter=다음, Shift+Enter=줄바꿈)"
                      rows="1"
                      @input="(e) => autoGrow(e.target as HTMLTextAreaElement)"
                      @keydown="(e) => onAnswerKeydown(e, idx)"
                    ></textarea>
                    <button
                      class="small danger"
                      @click="removeAnswer(idx)"
                      :disabled="form.answers.length <= 1"
                    >
                      삭제
                    </button>
                  </div>

                  <div class="answerBtns">
                    <button class="small ghost" @click="addAnswer">+ 답 추가</button>
                    <button class="small ghost" @click="clearEmptyAnswers">빈칸 정리</button>
                  </div>

                  <p class="hint" style="margin: 6px 0 0;">
                    저장 시 빈칸 답은 자동으로 제거돼요.
                  </p>
                </div>
              </label>
            </div>

            <div class="btnRow">
              <button class="primary" @click="onAdd">저장</button>
              <button class="ghost" @click="resetForm">입력 초기화</button>
            </div>

            <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
          </div>
        </section>

        <aside class="panel">
          <div class="panelHead">
            <!-- ✅ 여기: “질문 추천” 줄바꿈 금지 -->
            <h2 class="noWrap">질문 추천</h2>
            <input v-model="addSuggestSearch" class="search" placeholder="추천 질문 검색" />
          </div>

          <div class="chips">
            <button
              v-for="s in addSuggestions"
              :key="s.q"
              class="chip"
              @click="form.q = s.q"
              :title="`등장 ${s.count}회`"
            >
              {{ s.q }}
            </button>
          </div>

          <div class="panelFoot">
            <p class="hint">질문을 클릭하면 입력 칸에 자동으로 들어가요.</p>
          </div>
        </aside>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, nextTick } from "vue";
import {
  type Capsule,
  type CapsuleCard,
  type CapsuleType,
  type ReviewEntryV2 as ReviewEntry,
  addEntry,
  updateEntry,
  deleteEntry,
  loadEntries,
  saveEntries,
  exportBackup,
  importBackup,
  getQuestionBank,
  buildQuestionTimeline,
  clonePrevYearQuestions,
  capsuleTemplates,
  createCapsule,
  exportCapsuleBackup,
  importCapsuleBackup,
  loadCapsuleData,
  saveCapsuleData,
} from "./lib/recoverseStore";

type Mode = "year" | "compare" | "add" | "capsules";

const entries = ref<ReviewEntry[]>([]);
const capsules = ref<Capsule[]>([]);
const capsuleCards = ref<CapsuleCard[]>([]);
const selectedCapsuleId = ref<string | null>(null);
const selectedCapsuleCardId = ref<string | null>(null);
const mode = ref<Mode>("year");

const selectedYear = ref<number>(2016);
const selectedId = ref<string | null>(null);

const form = reactive({
  year: 2016,
  q: "",
  answers: [""] as string[],
});

const editingId = ref<string | null>(null);
const searchText = ref<string>("");
const errorMsg = ref<string>("");

const compareQ = ref<string>("");
const compareSearch = ref<string>("");

const addSuggestSearch = ref<string>("");
const capsuleSearch = ref<string>("");
const capsuleError = ref<string>("");
const capsuleNotice = ref<string>("");

const capsuleForm = reactive<{
  title: string;
  description: string;
  type: CapsuleType;
  templateId: string;
}>({
  title: "",
  description: "",
  type: "year",
  templateId: "template_year",
});

const capsuleCardForm = reactive({
  questionText: "",
  answersText: "",
});

/** ✅ 연도 범위: 2016부터 20년치 */
const START_YEAR = 2016;
const YEAR_COUNT = 20;

const years = computed(() => {
  const arr: number[] = [];
  for (let i = 0; i < YEAR_COUNT; i++) arr.push(START_YEAR + i); // 2016..2035
  return arr;
});

onMounted(() => {
  entries.value = loadEntries();
  refreshCapsules();
  // 시작은 2016으로 고정 (원하면: 데이터 있으면 그 연도로 자동 이동도 가능)
  selectedYear.value = START_YEAR;
  form.year = START_YEAR;
});

function refreshCapsules() {
  const data = loadCapsuleData();
  capsules.value = data.capsules;
  capsuleCards.value = data.cards;

  if (selectedCapsuleId.value && !capsules.value.some((capsule) => capsule.id === selectedCapsuleId.value)) {
    selectedCapsuleId.value = null;
    selectedCapsuleCardId.value = null;
  }
}

const yearCountMap = computed(() => {
  const map = new Map<number, number>();
  for (const e of entries.value) map.set(e.year, (map.get(e.year) ?? 0) + 1);
  return map;
});

const questionBank = computed(() => getQuestionBank(entries.value));

const filteredQuestionBank = computed(() => {
  const s = compareSearch.value.trim().toLowerCase();
  if (!s) return questionBank.value;
  return questionBank.value.filter((x) => x.q.toLowerCase().includes(s));
});

const yearEntries = computed(() => {
  const list = entries.value
    .filter((e) => e.year === selectedYear.value)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const s = searchText.value.trim().toLowerCase();
  if (!s) return list;

  return list.filter((e) => {
    const joined = e.answers.join("\n").toLowerCase();
    return e.q.toLowerCase().includes(s) || joined.includes(s);
  });
});

const selectedEntry = computed(() => {
  if (!selectedId.value) return null;
  return entries.value.find((x) => x.id === selectedId.value) ?? null;
});

const compareTimeline = computed(() => {
  const q = compareQ.value.trim();
  if (!q) return [];
  return buildQuestionTimeline(entries.value, q);
});

const addSuggestions = computed(() => {
  const s = addSuggestSearch.value.trim().toLowerCase();
  const base = questionBank.value.slice(0, 80);
  if (!s) return base.slice(0, 30);
  return base.filter((x) => x.q.toLowerCase().includes(s)).slice(0, 40);
});

const capsuleStats = computed(() => {
  const map = new Map<string, { cards: number; answered: number }>();
  for (const card of capsuleCards.value) {
    const prev = map.get(card.capsuleId) ?? { cards: 0, answered: 0 };
    prev.cards += 1;
    if (card.answers.length > 0) prev.answered += 1;
    map.set(card.capsuleId, prev);
  }
  return map;
});

const filteredCapsules = computed(() => {
  const query = capsuleSearch.value.trim().toLowerCase();
  if (!query) return capsules.value;

  return capsules.value.filter((capsule) => {
    const haystack = [
      capsule.title,
      capsule.description ?? "",
      capsule.type,
    ]
      .join("\n")
      .toLowerCase();

    return haystack.includes(query);
  });
});

const selectedCapsule = computed(() => {
  if (!selectedCapsuleId.value) return null;
  return capsules.value.find((capsule) => capsule.id === selectedCapsuleId.value) ?? null;
});

const selectedCapsuleCards = computed(() => {
  if (!selectedCapsuleId.value) return [];
  return capsuleCards.value
    .filter((card) => card.capsuleId === selectedCapsuleId.value)
    .sort((a, b) => a.order - b.order);
});

const selectedCapsuleCard = computed(() => {
  if (!selectedCapsuleCardId.value) return null;
  return capsuleCards.value.find((card) => card.id === selectedCapsuleCardId.value) ?? null;
});

const discoveryCard = computed(() => {
  return (
    capsuleCards.value
      .filter((card) => card.answers.length > 0)
      .sort((a, b) => (a.updatedAt > b.updatedAt ? 1 : -1))[0] ?? null
  );
});

const discoveryCapsuleTitle = computed(() => {
  if (!discoveryCard.value) return "";
  return capsules.value.find((capsule) => capsule.id === discoveryCard.value?.capsuleId)?.title ?? "";
});

function setMode(m: Mode) {
  mode.value = m;
  errorMsg.value = "";
  capsuleError.value = "";
  capsuleNotice.value = "";

  if (m === "add") {
    form.year = selectedYear.value;
    editingId.value = null;
    ensureAtLeastOneAnswerRow();
  }

  if (m === "capsules") {
    refreshCapsules();
  }

  if (m === "compare") {
    if (!compareQ.value && questionBank.value[0]) compareQ.value = questionBank.value[0].q;
  }
}

function selectYear(y: number) {
  selectedYear.value = y;
  selectedId.value = null;
  searchText.value = "";
  // 편의: 연도 클릭하면 입력 연도도 따라감
  form.year = y;
}

function selectEntry(id: string) {
  selectedId.value = id;
  const e = entries.value.find((x) => x.id === id);
  if (e) startEdit(e);
}

function startEdit(e: ReviewEntry) {
  editingId.value = e.id;
  form.year = e.year;
  form.q = e.q;
  form.answers = e.answers.length ? [...e.answers] : [""];
}

function cancelEdit() {
  editingId.value = null;
  if (selectedEntry.value) startEdit(selectedEntry.value);
  else resetForm();
}

function resetForm() {
  editingId.value = null;
  form.year = selectedYear.value;
  form.q = "";
  form.answers = [""];
}

function resetCapsuleForm() {
  capsuleError.value = "";
  capsuleNotice.value = "";
  capsuleForm.title = "";
  capsuleForm.description = "";
  capsuleForm.type = "year";
  capsuleForm.templateId = "template_year";
}

function syncCapsuleStorage() {
  saveCapsuleData({
    capsules: capsules.value,
    cards: capsuleCards.value,
  });
}

function selectCapsule(id: string) {
  selectedCapsuleId.value = id;
  const firstCard = capsuleCards.value
    .filter((card) => card.capsuleId === id)
    .sort((a, b) => a.order - b.order)[0];
  selectedCapsuleCardId.value = firstCard?.id ?? null;
  if (firstCard) startCapsuleCardEdit(firstCard);
  else resetCapsuleCardForm();
}

function selectCapsuleCard(id: string) {
  selectedCapsuleCardId.value = id;
  const card = capsuleCards.value.find((item) => item.id === id);
  if (card) startCapsuleCardEdit(card);
}

function resetCapsuleCardForm() {
  capsuleCardForm.questionText = "";
  capsuleCardForm.answersText = "";
}

function startCapsuleCardEdit(card: CapsuleCard) {
  capsuleCardForm.questionText = card.questionText;
  capsuleCardForm.answersText = card.answers.join("\n");
}

function onCreateCapsule() {
  capsuleError.value = "";
  capsuleNotice.value = "";

  try {
    const data = createCapsule({
      title: capsuleForm.title,
      description: capsuleForm.description,
      type: capsuleForm.type,
      templateId: capsuleForm.templateId || undefined,
    });
    capsules.value = data.capsules;
    capsuleCards.value = data.cards;
    selectedCapsuleId.value = data.capsules[0]?.id ?? null;
    const firstCard = selectedCapsuleId.value
      ? data.cards
          .filter((card) => card.capsuleId === selectedCapsuleId.value)
          .sort((a, b) => a.order - b.order)[0]
      : null;
    selectedCapsuleCardId.value = firstCard?.id ?? null;
    if (firstCard) startCapsuleCardEdit(firstCard);
    else resetCapsuleCardForm();
    resetCapsuleForm();
    capsuleNotice.value = "캡슐을 만들었어요.";
  } catch (err: any) {
    capsuleError.value = err?.message ?? "캡슐을 만들 수 없어요.";
  }
}

function addCapsuleCard() {
  if (!selectedCapsule.value) return;

  const now = new Date().toISOString();
  const card: CapsuleCard = {
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    capsuleId: selectedCapsule.value.id,
    questionText: "새 질문",
    answers: [],
    source: "user",
    order: selectedCapsuleCards.value.length,
    createdAt: now,
    updatedAt: now,
  };

  capsuleCards.value = [card, ...capsuleCards.value];
  selectedCapsuleCardId.value = card.id;
  startCapsuleCardEdit(card);
  syncCapsuleStorage();
}

function saveSelectedCapsuleCard() {
  if (!selectedCapsuleCard.value) return;

  const questionText = capsuleCardForm.questionText.trim();
  if (!questionText) {
    capsuleError.value = "질문을 입력해 주세요.";
    capsuleNotice.value = "";
    return;
  }

  const answers = capsuleCardForm.answersText
    .split("\n")
    .map((answer) => answer.trim())
    .filter((answer) => answer.length > 0);

  const now = new Date().toISOString();
  capsuleCards.value = capsuleCards.value.map((card) =>
    card.id === selectedCapsuleCard.value?.id
      ? {
          ...card,
          questionText,
          answers,
          updatedAt: now,
        }
      : card
  );
  capsuleError.value = "";
  capsuleNotice.value = "질문 카드를 저장했어요.";
  syncCapsuleStorage();
}

function deleteSelectedCapsuleCard() {
  const card = selectedCapsuleCard.value;
  if (!card) return;
  if (!confirm("이 질문 카드를 삭제할까요?")) return;

  capsuleCards.value = capsuleCards.value.filter((item) => item.id !== card.id);
  const nextCard = selectedCapsuleCards.value.find((item) => item.id !== card.id) ?? null;
  selectedCapsuleCardId.value = nextCard?.id ?? null;
  if (nextCard) startCapsuleCardEdit(nextCard);
  else resetCapsuleCardForm();

  capsuleError.value = "";
  capsuleNotice.value = "질문 카드를 삭제했어요.";
  syncCapsuleStorage();
}

function deleteSelectedCapsule() {
  const capsule = selectedCapsule.value;
  if (!capsule) return;
  if (!confirm(`"${capsule.title}" 캡슐과 그 안의 질문 카드를 삭제할까요?`)) return;

  capsules.value = capsules.value.filter((item) => item.id !== capsule.id);
  capsuleCards.value = capsuleCards.value.filter((card) => card.capsuleId !== capsule.id);

  const nextCapsule = capsules.value[0] ?? null;
  selectedCapsuleId.value = nextCapsule?.id ?? null;
  const nextCard = nextCapsule
    ? capsuleCards.value
        .filter((card) => card.capsuleId === nextCapsule.id)
        .sort((a, b) => a.order - b.order)[0]
    : null;
  selectedCapsuleCardId.value = nextCard?.id ?? null;
  if (nextCard) startCapsuleCardEdit(nextCard);
  else resetCapsuleCardForm();

  capsuleError.value = "";
  capsuleNotice.value = "캡슐을 삭제했어요.";
  syncCapsuleStorage();
}

function ensureAtLeastOneAnswerRow() {
  if (!Array.isArray(form.answers) || form.answers.length === 0) form.answers = [""];
}

function addAnswer() {
  form.answers.push("");
}

function removeAnswer(idx: number) {
  if (form.answers.length <= 1) return;
  form.answers.splice(idx, 1);
  ensureAtLeastOneAnswerRow();
}

function clearEmptyAnswers() {
  form.answers = (form.answers ?? [])
    .map((x) => (x ?? "").toString().trim())
    .filter((x) => x.length > 0);

  ensureAtLeastOneAnswerRow();
}

function normalizedAnswersForSave(): string[] {
  return (form.answers ?? [])
    .map((x) => (x ?? "").toString().trim())
    .filter((x) => x.length > 0);
}

function validateCommon(requireAtLeastOneAnswer: boolean) {
  errorMsg.value = "";

  if (!Number.isFinite(form.year) || form.year < 1900 || form.year > 3000) {
    errorMsg.value = "연도 값이 이상해요.";
    return false;
  }
  if (!form.q.trim()) {
    errorMsg.value = "질문을 입력해줘요.";
    return false;
  }

  const answers = normalizedAnswersForSave();
  if (requireAtLeastOneAnswer && answers.length === 0) {
    errorMsg.value = "답을 최소 1개는 입력해줘요.";
    return false;
  }

  return true;
}

function onSaveEdit() {
  if (!editingId.value) return;
  if (!validateCommon(false)) return; // 수정은 빈 답 저장 허용

  entries.value = updateEntry(editingId.value, {
    year: Number(form.year),
    q: form.q.trim(),
    answers: normalizedAnswersForSave(),
  });

  selectedYear.value = Number(form.year);
  selectedId.value = editingId.value;
}

function onAdd() {
  if (!validateCommon(true)) return; // 신규 추가는 최소 1개 답 요구

  entries.value = addEntry({
    year: Number(form.year),
    q: form.q.trim(),
    answers: normalizedAnswersForSave(),
  });

  selectedYear.value = Number(form.year);
  form.q = "";
  form.answers = [""];
  errorMsg.value = "";
}

function onDeleteSelected() {
  if (!selectedEntry.value) return;
  if (!confirm("삭제할까요?")) return;

  entries.value = deleteEntry(selectedEntry.value.id);
  selectedId.value = null;
  editingId.value = null;
  resetForm();
}

function onClonePrevYear() {
  const targetYear = selectedYear.value;
  const prevYear = targetYear - 1;

  const hasPrev = entries.value.some((e) => e.year === prevYear);
  if (!hasPrev) {
    alert(`${prevYear}년 데이터가 없어서 질문을 가져올 수 없어요.`);
    return;
  }

  const ok = confirm(
    `${prevYear}년의 질문들을 ${targetYear}년에 복제할까요?\n` +
      `답은 빈칸(리스트)으로 생성되고, 이미 있는 질문은 건너뜁니다.`
  );
  if (!ok) return;

  const result = clonePrevYearQuestions({ targetYear });
  entries.value = result.entries;

  alert(`완료! 추가 ${result.added}개 / 건너뜀 ${result.skipped}개`);
}

function openCompareFromSelected() {
  if (!selectedEntry.value) return;
  compareQ.value = selectedEntry.value.q;
  setMode("compare");
}

function jumpToEdit(id: string) {
  const e = entries.value.find((x) => x.id === id);
  if (!e) return;

  selectedYear.value = e.year;
  selectedId.value = e.id;
  setMode("year");
  startEdit(e);
}

function previewAnswers(answers: string[]) {
  if (!answers || answers.length === 0) return "—";
  const trimmed = answers.map((x) => x.trim()).filter(Boolean);
  if (trimmed.length === 0) return "—";

  const head = trimmed.slice(0, 2).join(" / ");
  const more = trimmed.length > 2 ? ` 외 ${trimmed.length - 2}개` : "";
  const text = head + more;

  return text.length > 70 ? text.slice(0, 70) + "…" : text;
}

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}

function downloadBlob(blob: Blob, filename: string) {
  // @ts-ignore
  if (window.navigator && window.navigator.msSaveOrOpenBlob) {
    // @ts-ignore
    window.navigator.msSaveOrOpenBlob(blob, filename);
    return;
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function onExport() {
  const blob = exportBackup(entries.value);
  const yyyyMMdd = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `recoverse_${yyyyMMdd}.json`);
}

function onExportCapsules() {
  capsuleError.value = "";
  capsuleNotice.value = "";

  const blob = exportCapsuleBackup({
    capsules: capsules.value,
    cards: capsuleCards.value,
  });
  const yyyyMMdd = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `recoverse_capsules_${yyyyMMdd}.json`);
  capsuleNotice.value = "캡슐 백업 파일을 만들었어요.";
}

async function onImportCapsuleFile(e: Event) {
  capsuleError.value = "";
  capsuleNotice.value = "";

  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const result = importCapsuleBackup(text);
    capsules.value = result.data.capsules;
    capsuleCards.value = result.data.cards;
    selectedCapsuleId.value = result.data.capsules[0]?.id ?? null;

    const firstCard = selectedCapsuleId.value
      ? result.data.cards
          .filter((card) => card.capsuleId === selectedCapsuleId.value)
          .sort((a, b) => a.order - b.order)[0]
      : null;

    selectedCapsuleCardId.value = firstCard?.id ?? null;
    if (firstCard) startCapsuleCardEdit(firstCard);
    else resetCapsuleCardForm();

    capsuleNotice.value =
      `가져오기 완료: 캡슐 ${result.addedCapsules}개, 질문 카드 ${result.addedCards}개 추가` +
      ` / 중복 ${result.skippedCapsules + result.skippedCards}개 건너뜀`;
  } catch (err: any) {
    capsuleError.value = `캡슐 가져오기 실패: ${err?.message ?? "알 수 없는 오류"}`;
  } finally {
    input.value = "";
  }
}

async function onImportFile(e: Event) {
  errorMsg.value = "";
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    entries.value = importBackup(text);
    selectedYear.value = START_YEAR;
    form.year = START_YEAR;
    selectedId.value = null;
    resetForm();
  } catch (err: any) {
    errorMsg.value = `가져오기 실패: ${err?.message ?? "알 수 없는 오류"}`;
  } finally {
    input.value = "";
  }
}

function clearAll() {
  if (!confirm("진짜로 전부 삭제할까요? (되돌리기 없음)")) return;
  entries.value = [];
  saveEntries([]);
  selectedId.value = null;
  editingId.value = null;
  resetForm();
}


const answerRefs = ref<HTMLTextAreaElement[]>([]);

function autoGrow(el: HTMLTextAreaElement) {
  // 높이를 한번 접었다가(scrollHeight 재계산) 다시 늘림
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
}

function setAnswerRef(el: HTMLTextAreaElement | null, idx: number) {
  if (!el) return;
  answerRefs.value[idx] = el;
  // ✅ 처음 렌더/갱신 시에도 자동 높이 맞추기
  autoGrow(el);
}

async function focusAnswer(idx: number) {
  await nextTick();
  const el = answerRefs.value[idx];
  if (el) {
    el.focus();
    const len = el.value?.length ?? 0;
    el.setSelectionRange(len, len);
    autoGrow(el); // 포커스 줄 때도 한 번 맞춰줌
  }
}

/**
 * textarea 키보드 UX
 * - Enter: 다음 칸 / 마지막이면 새 칸 생성
 * - Shift+Enter: 줄바꿈 (textarea 기본 동작)
 * - Backspace: 빈칸에서 누르면 해당 칸 삭제 + 이전 칸으로 포커스 (칸 1개면 유지)
 */
async function onAnswerKeydown(e: KeyboardEvent, idx: number) {
  // Shift+Enter는 줄바꿈 허용 (textarea 기본)
  if (e.key === "Enter" && e.shiftKey) return;

  // Enter: 다음/새 칸
  if (e.key === "Enter") {
    e.preventDefault();

    if (idx === form.answers.length - 1) {
      form.answers.push("");
      await focusAnswer(idx + 1);
      return;
    }
    await focusAnswer(idx + 1);
    return;
  }

  // Backspace: 빈칸이면 삭제하고 이전으로
  if (e.key === "Backspace") {
    const current = (form.answers[idx] ?? "").toString();

    if (current.trim().length === 0 && form.answers.length > 1) {
      e.preventDefault();
      form.answers.splice(idx, 1);
      const nextIdx = Math.max(0, idx - 1);
      await focusAnswer(nextIdx);
    }
  }
}

/** (선택) Ctrl/Cmd+Enter로 저장 */
function onFormKeydown(e: KeyboardEvent) {
  const isSubmit = (e.ctrlKey || e.metaKey) && e.key === "Enter";
  if (!isSubmit) return;

  e.preventDefault();
  if (mode.value === "add") onAdd();
  else if (mode.value === "year" && editingId.value) onSaveEdit();
}

</script>

<style scoped>
/* ===== Laptop-first (no mobile optimization) ===== */
.app {
  min-height: 100vh;
  background: #f6f7f9;
  color: #111;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
}

/* ✅ 한글 텍스트가 글자 단위로 쪼개져 줄바꿈되는 현상 방지 */
.noWrap {
  white-space: nowrap;      /* 한 줄 유지 */
  word-break: keep-all;     /* 한글 단어 단위 줄바꿈 */
  overflow-wrap: normal;    /* 글자 단위 강제 줄바꿈 방지 */
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  display: grid;
  grid-template-columns: 360px 1fr 520px;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
}

.brand {
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
}

.brandText {
  min-width: 0;
}

.logo {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: #111;
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 800;
}

.brand h1 {
  margin: 0;
  font-size: 18px;
  line-height: 1.1;
}

.brand p {
  margin: 3px 0 0;
  font-size: 12px;
  color: #4b5563;
}

.tabs {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.tabs button {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 999px;
  color: #111;
  cursor: pointer;
}

.tabs button.on {
  background: #111;
  border-color: #111;
  color: #fff;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.file {
  border: 1px solid #d1d5db;
  background: #fff;
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  user-select: none;
}

.file input { display: none; }

.smallFile {
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 12px;
}

button {
  font: inherit;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 12px;
  padding: 10px 12px;
  cursor: pointer;
  color: #111;
}

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.primary {
  background: #111;
  border-color: #111;
  color: #fff;
}

.ghost {
  background: #fff;
}

.danger {
  border-color: #b00020;
  color: #b00020;
}

.small {
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 12px;
}

.main {
  padding: 16px;
}

.panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 92px);
}

.panelHead {
  padding: 12px 12px;
  border-bottom: 1px solid #eef0f3;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

/* ✅ 패널 헤더 타이틀/라벨 한 줄 유지(안전망) */
.panelHead h2,
.panelHead span,
.panelHead label {
  white-space: nowrap;
  word-break: keep-all;
  overflow-wrap: normal;
}

.panelHead h2 {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  min-width: 0;
}

.headBtns {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.panelFoot {
  padding: 12px;
  border-top: 1px solid #eef0f3;
}

.hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.35;
}

.search {
  margin-left: auto;
  width: 220px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #d1d5db;
  outline: none;
}

.capsuleSearch {
  margin-left: 0;
  width: 100%;
}

.layout3 {
  display: grid;
  grid-template-columns: 260px 380px 1fr;
  gap: 12px;
}

.layoutCompare {
  display: grid;
  grid-template-columns: 420px 1fr;
  gap: 12px;
}

.layoutAdd {
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 12px;
}

/* left years */
.yearList {
  padding: 10px;
  overflow: auto;
  display: grid;
  gap: 8px;
}

.yearBtn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #fff;
}

/* ✅ 연도 버튼 텍스트 줄바꿈 방지(안전망) */
.yearBtn,
.yearNum,
.yearCount {
  white-space: nowrap;
  word-break: keep-all;
  overflow-wrap: normal;
}

.yearBtn.active {
  border-color: #111;
  box-shadow: 0 0 0 1px #111 inset;
}

.yearNum { font-weight: 900; }
.yearCount { font-size: 12px; color: #6b7280; }

/* middle list */
.list {
  padding: 10px;
  overflow: auto;
  display: grid;
  gap: 8px;
}

.rowItem {
  text-align: left;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #fff;
  padding: 10px 12px;
}

.rowItem.active {
  border-color: #111;
  box-shadow: 0 0 0 1px #111 inset;
}

.rowTop {
  display: flex;
  gap: 8px;
  align-items: center;
}

.q {
  font-weight: 800;
  font-size: 13px;
  line-height: 1.25;
  flex: 1;
}

.count {
  font-size: 12px;
  color: #6b7280;
}

.badge {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid #d1d5db;
  color: #6b7280;
}

.rowSub {
  margin-top: 6px;
  color: #6b7280;
  font-size: 12px;
}

.subText { line-height: 1.3; }

/* right detail */
.detail {
  padding: 12px;
  overflow: auto;
}

.detailEmpty {
  padding: 20px 12px;
}

.detailBlock {
  display: grid;
  gap: 10px;
}

.kv {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 10px;
  align-items: start;
}

.k {
  color: #6b7280;
  font-size: 12px;
  font-weight: 700;
  padding-top: 2px;
}

.v {
  font-size: 13px;
  color: #111;
}

.strong { font-weight: 900; }

.muted {
  color: #6b7280;
  font-size: 12px;
}

.divider {
  height: 1px;
  background: #eef0f3;
  margin: 14px 0;
}

h3 {
  margin: 0 0 6px;
  font-size: 13px;
}

.formGrid {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 10px;
}

.formGrid label {
  display: grid;
  gap: 6px;
}

.formGrid label span {
  font-size: 12px;
  font-weight: 800;
  color: #374151;
}

.formGrid .wide {
  grid-column: 1 / -1;
}

input, textarea, select {
  font: inherit;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  padding: 10px 12px;
  outline: none;
  background: #fff;
  color: #111;
}

textarea { resize: vertical; }

.btnRow {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}

.error {
  margin: 10px 0 0;
  color: #b00020;
  font-weight: 700;
}

/* answers */
.answerList {
  margin: 0;
  padding-left: 18px;
  line-height: 1.55;
}

.answerItem {
  margin: 2px 0;
}

.answersEditor {
  border: 1px solid #eef0f3;
  border-radius: 14px;
  padding: 10px;
  background: #fbfbfc;
}

.answerRow {
  display: grid;
  grid-template-columns: 34px 1fr 64px;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.answerRow .num {
  width: 34px;
  height: 32px;
  border-radius: 10px;
  background: #fff;
  border: 1px solid #e5e7eb;
  display: grid;
  place-items: center;
  font-weight: 900;
  color: #111;
  font-size: 12px;
}

.answerBtns {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

/* compare */
.compare {
  padding: 12px;
  overflow: auto;
}

.compareTitle {
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 12px;
  background: #fff;
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 10px;
  margin-bottom: 12px;
}

.compareTitle .label {
  color: #6b7280;
  font-size: 12px;
  font-weight: 800;
}

.compareTitle .value {
  font-weight: 900;
  font-size: 13px;
}

.timeline {
  display: grid;
  gap: 10px;
}

.tlCard {
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 12px;
  background: #fff;
}

.tlHead {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tlYear {
  font-weight: 900;
  font-size: 16px;
  flex: 1;
}

/* add */
.addWrap {
  padding: 12px;
  overflow: auto;
}

.chips {
  padding: 12px;
  overflow: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-content: flex-start;
}

.chip {
  border: 1px solid #e5e7eb;
  background: #f3f4f6;
  border-radius: 999px;
  padding: 8px 10px;
  font-size: 12px;
}

.chip.active {
  border-color: #111;
  background: #111;
  color: #fff;
}

.discoverBox {
  display: grid;
  gap: 6px;
}

/* general empty */
.empty {
  padding: 14px 12px;
  color: #6b7280;
  font-size: 13px;
}

.answerTA {
  width: 100%;
  font: inherit;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  padding: 10px 12px;
  outline: none;
  background: #fff;
  color: #111;

  resize: none;          /* 사용자가 드래그로 늘리지 않게 */
  overflow: hidden;      /* 스크롤바 대신 자동 확장(아래 옵션) */
  line-height: 1.4;
}

</style>
