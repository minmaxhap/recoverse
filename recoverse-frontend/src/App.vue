<template>
  <div class="app">
    <!-- Top bar -->
    <header class="topbar">
      <div class="brand">
        <div class="logo">R</div>
        <div class="brandText">
          <h1 class="noWrap">Recoverse</h1>
          <p class="noWrap">회고 캡슐 아카이브 (로컬 저장)</p>
        </div>
      </div>

      <nav class="tabs">
        <button
          :class="{ on: mode === 'home-universe' || mode === 'planet-detail' }"
          :title="modePlanById['home-universe'].note"
          @click="setMode('home-universe')"
        >
          {{ t.capsules }}
        </button>
        <button
          :class="{ on: isArchiveMode(mode) }"
          :title="activeArchiveModePlan.note"
          @click="openArchiveSettings()"
        >
          {{ t.archive }}
        </button>
      </nav>

    </header>

    <!-- Main -->
    <main class="main">
      <!-- Archive mode: year tools stay available until ArchiveSettingsView is introduced. -->
      <ArchiveSettingsView
        v-if="mode === 'year-archive'"
        :title="modePlanById['year-archive'].title"
        :description="modePlanById['year-archive'].note"
      >
        <template #actions>
          <ArchiveSettingsTools
            :language="language"
            :language-label="t.language"
            export-label="JSON 내보내기"
            import-label="JSON 가져오기"
            clear-label="전체 삭제"
            :export-disabled="entries.length === 0"
            :clear-disabled="entries.length === 0"
            @update:language="language = $event"
            @change-language="saveLanguage"
            @export="onExport"
            @import-file="onImportFile"
            @clear-all="clearAll"
          />
        </template>
        <ArchiveSectionTabs
          :active-mode="activeArchiveMode"
          :plans="archiveModePlans"
          @select="setMode($event)"
        />
        <ArchiveCapsuleShelf
          :search="capsuleSearch"
          :capsules="capsules"
          :filtered-capsules="filteredCapsules"
          :selected-capsule-id="selectedCapsuleId"
          :stats="capsuleStats"
          :type-labels="t.typeLabels"
          :list-labels="capsuleListLabels"
          :labels="archiveShelfLabels"
          @update:search="capsuleSearch = $event"
          @select="openCapsuleFromArchive"
        />
      <section class="layout3">
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
      </ArchiveSettingsView>

      <!-- Archive mode: comparison stays intact, but is treated as an archive tool now. -->
      <ArchiveSettingsView
        v-else-if="mode === 'question-compare-archive'"
        :title="modePlanById['question-compare-archive'].title"
        :description="modePlanById['question-compare-archive'].note"
      >
        <template #actions>
          <ArchiveSettingsTools
            :language="language"
            :language-label="t.language"
            export-label="JSON 내보내기"
            import-label="JSON 가져오기"
            clear-label="전체 삭제"
            :export-disabled="entries.length === 0"
            :clear-disabled="entries.length === 0"
            @update:language="language = $event"
            @change-language="saveLanguage"
            @export="onExport"
            @import-file="onImportFile"
            @clear-all="clearAll"
          />
        </template>
        <ArchiveSectionTabs
          :active-mode="activeArchiveMode"
          :plans="archiveModePlans"
          @select="setMode($event)"
        />
        <ArchiveCapsuleShelf
          :search="capsuleSearch"
          :capsules="capsules"
          :filtered-capsules="filteredCapsules"
          :selected-capsule-id="selectedCapsuleId"
          :stats="capsuleStats"
          :type-labels="t.typeLabels"
          :list-labels="capsuleListLabels"
          :labels="archiveShelfLabels"
          @update:search="capsuleSearch = $event"
          @select="openCapsuleFromArchive"
        />
      <section class="layoutCompare">
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
              <button class="ghost" @click="setMode('home-universe')">캡슐 홈으로</button>
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
      </ArchiveSettingsView>

      <!-- Mode: CAPSULES -->
      <HomeUniverseView
        v-else-if="mode === 'home-universe'"
        brand-label="Recoverse"
        :title="t.memoryUniverse"
        :capsules="capsules"
        :home-capsule-items="homeCapsuleItems"
        :selected-capsule-id="selectedCapsuleId"
        :discovery-card="discoveryCard"
        :discovery-capsule-title="discoveryCapsuleTitle"
        :discovery-answer-preview="discoveryAnswerPreview"
        :toolbar-labels="{
          exportCapsules: t.exportCapsules,
          importCapsules: t.importCapsules,
          capsuleBackupVersion: t.capsuleBackupVersion,
          refresh: t.refresh,
        }"
        :discovery-labels="discoveryLabels"
        :galaxy-map-labels="{
          title: t.memoryMap,
          empty: t.memoryMapEmpty,
          create: t.createMemoryPlanet,
        }"
        :archive-bridge-labels="archiveBridgeLabels"
        @export="onExportCapsules"
        @import-file="onImportCapsuleFile"
        @refresh="refreshCapsules"
        @open-discovery="openDiscoveryCard"
        @open-archive="openArchiveSettings"
        @open-create-flow="openCreateFlow"
        @select-capsule="selectCapsule"
      />

      <PlanetDetailView
        v-else-if="mode === 'planet-detail'"
        v-model:show-unanswered-cards-only="showUnansweredCardsOnly"
        :create-capsule-title="t.createCapsule"
        :show-create-composer="showCreateComposer"
        :language="language"
        :capsules="capsules"
        :capsule-cards="capsuleCards"
        :selected-capsule="selectedCapsule"
        :selected-capsule-cards="selectedCapsuleCards"
        :selected-capsule-card="selectedCapsuleCard"
        :selected-capsule-card-id="selectedCapsuleCardId"
        :recently-edited-capsule-card-id="recentlyEditedCapsuleCardId"
        :capsule-stats="capsuleStats"
        :capsule-form="capsuleForm"
        :capsule-card-form="capsuleCardForm"
        :capsule-templates="capsuleTemplates"
        :capsule-error="capsuleError"
        :capsule-notice="capsuleNotice"
        :type-labels="t.typeLabels"
        :create-entry-labels="createEntryLabels"
        :capsule-create-labels="capsuleCreateLabels"
        :capsule-summary-labels="{
          type: t.type,
          description: t.description,
          noDescription: t.noDescription,
          recentlyEdited: t.recentlyEdited,
          questions: t.questions,
          answers: t.answers,
        }"
        :capsule-detail-labels="capsuleDetailLabels"
        @back-home="setMode('home-universe')"
        @open-create-flow="openCreateFlow"
        @close-create-flow="closeCreateFlow"
        @create-capsule="onCreateCapsule"
        @reset-capsule-form="resetCapsuleForm"
        @delete-capsule="deleteSelectedCapsule"
        @select-card="selectCapsuleCard"
        @add-card="addCapsuleCard"
        @save-card="saveSelectedCapsuleCard"
        @delete-card="deleteSelectedCapsuleCard"
        @open-card="jumpToCapsuleCard"
      />

      <!-- Mode: ADD -->
      <!-- Archive mode: quick entry remains, but is no longer named as a primary screen. -->
      <ArchiveSettingsView
        v-else-if="mode === 'quick-entry-archive'"
        :title="modePlanById['quick-entry-archive'].title"
        :description="modePlanById['quick-entry-archive'].note"
      >
        <template #actions>
          <ArchiveSettingsTools
            :language="language"
            :language-label="t.language"
            export-label="JSON 내보내기"
            import-label="JSON 가져오기"
            clear-label="전체 삭제"
            :export-disabled="entries.length === 0"
            :clear-disabled="entries.length === 0"
            @update:language="language = $event"
            @change-language="saveLanguage"
            @export="onExport"
            @import-file="onImportFile"
            @clear-all="clearAll"
          />
        </template>
        <ArchiveSectionTabs
          :active-mode="activeArchiveMode"
          :plans="archiveModePlans"
          @select="setMode($event)"
        />
        <ArchiveCapsuleShelf
          :search="capsuleSearch"
          :capsules="capsules"
          :filtered-capsules="filteredCapsules"
          :selected-capsule-id="selectedCapsuleId"
          :stats="capsuleStats"
          :type-labels="t.typeLabels"
          :list-labels="capsuleListLabels"
          :labels="archiveShelfLabels"
          @update:search="capsuleSearch = $event"
          @select="openCapsuleFromArchive"
        />
      <section class="layoutAdd">
        <section class="panel">
          <div class="panelHead">
            <h2 class="noWrap">빠른 입력</h2>
            <div class="headBtns">
              <button class="ghost" @click="setMode('home-universe')">캡슐 홈으로</button>
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
      </ArchiveSettingsView>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, nextTick } from "vue";
import ArchiveCapsuleShelf from "./components/ArchiveCapsuleShelf.vue";
import ArchiveSectionTabs from "./components/ArchiveSectionTabs.vue";
import ArchiveSettingsTools from "./components/ArchiveSettingsTools.vue";
import ArchiveSettingsView from "./views/ArchiveSettingsView.vue";
import HomeUniverseView from "./views/HomeUniverseView.vue";
import PlanetDetailView from "./views/PlanetDetailView.vue";
import {
  type AppLanguage,
  type Capsule,
  type CapsuleCard,
  type CapsuleType,
  type ReviewEntryV2 as ReviewEntry,
  loadEntries,
  saveEntries,
  loadCapsuleData,
  saveCapsuleData,
} from "./lib/recoverseStore";
import {
  CAPSULE_IMPORT_ERROR,
  exportCapsuleBackup,
  importCapsuleBackup,
  previewCapsuleBackupImport,
} from "./lib/capsuleImportExport";
import {
  buildCapsuleHomeItems,
  buildCapsuleStats,
  filterCapsules,
  findMostRecentlyAnsweredCardId,
  selectDailyDiscoveryCard,
} from "./lib/capsuleHomeData";
import { createCapsule } from "./lib/capsuleActions";
import { capsuleTemplates } from "./lib/capsuleTemplates";
import {
  addEntry,
  updateEntry,
  deleteEntry,
  exportBackup,
  importBackup,
  getQuestionBank,
  buildQuestionTimeline,
  clonePrevYearQuestions,
} from "./lib/reviewEntryActions";
import {
  appModePlans,
  archiveModePlans,
  type AppMode,
  type ArchiveModeId,
} from "./lib/appScreens";

const LANGUAGE_KEY = "recoverse_language";

const messages = {
  ko: {
    language: "언어",
    capsules: "캡슐",
    archive: "아카이브",
    archiveCapsulesEyebrow: "행성 보관함",
    archiveCapsulesTitle: "내 기억 행성은 아카이브에서 관리해요",
    archiveCapsulesDescription:
      "행성 검색과 선택은 이 보관함으로 옮기는 중이에요. 행성을 고르면 다시 기억 우주와 상세 편집으로 돌아가요.",
    archiveCount: "전체 행성",
    openArchive: "아카이브 열기",
    createEntryEyebrow: "생성 입구",
    createEntryTitle: "새로운 기억 오브젝트를 시작해요",
    createEntryDescription:
      "개인 행성은 지금 바로 만들 수 있고, 그룹 은하는 다음 단계에서 이 자리로 이어질 거예요.",
    openCreateEntry: "생성 입구 열기",
    createPlanetEntry: "개인 행성 만들기",
    createGalaxyEntry: "그룹 은하 준비 중",
    closeCreateEntry: "입구 닫기",
    memoryUniverse: "나의 기억 우주",
    retrospectiveCapsules: "회고 캡슐",
    exportCapsules: "캡슐 JSON 내보내기",
    importCapsules: "캡슐 JSON 가져오기",
    capsuleBackupVersion: "백업 v1",
    refresh: "새로고침",
    searchCapsules: "캡슐 검색",
    questions: "질문",
    answers: "답변",
    noCapsules: "아직 캡슐이 없어요. 오른쪽에서 첫 회고 캡슐을 만들어보세요.",
    noSearchResults: "검색 결과가 없어요.",
    todayDiscovery: "오늘의 발견",
    openDiscovery: "다시 열어보기",
    memoryMap: "기억 지도",
    memoryMapEmpty: "아직 떠 있는 기억 행성이 없어요. 새 캡슐을 만들면 이곳에 나타나요.",
    createMemoryPlanet: "새 기억 행성 만들기",
    rediscover: "다시 발견하기",
    rediscoverEmpty: "답변이 쌓이면 오래된 질문을 다시 꺼내 보여줄 수 있어요.",
    createCapsule: "새 캡슐 만들기",
    title: "제목",
    titlePlaceholder: "예: 20대 회고, 여행 회고",
    description: "설명",
    descriptionPlaceholder: "이 캡슐에 담고 싶은 기억",
    noDescription: "설명이 없어요.",
    type: "유형",
    defaultQuestions: "기본 질문",
    none: "없음",
    createCapsuleButton: "캡슐 만들기",
    reset: "초기화",
    templateHint: "기본 질문을 고르면 캡슐 안에 질문 카드가 함께 만들어져요.",
    selectCapsuleHint: "왼쪽에서 캡슐을 선택하면 질문 카드를 볼 수 있어요.",
    deleteCapsule: "캡슐 삭제",
    noCards: "아직 기억 카드가 없어요. 첫 기억 카드를 추가해보세요.",
    questionCard: "기억 카드",
    recentlyEdited: "최근 수정",
    unansweredOnly: "미답변 기억만",
    question: "질문",
    questionPlaceholder: "질문을 입력하세요",
    answer: "답변",
    answerPlaceholder: "답변을 한 줄에 하나씩 적어보세요",
    noSavedAnswers: "아직 저장된 답변이 없어요.",
    saveQuestion: "기억 카드 저장",
    deleteQuestion: "기억 카드 삭제",
    selectOrAddQuestion: "기억 카드를 추가하거나 선택해 주세요.",
    capsuleCreated: "캡슐을 만들었어요.",
    capsuleCreateFailed: "캡슐을 만들 수 없어요.",
    questionRequired: "질문을 입력해 주세요.",
    questionSaved: "기억 카드를 저장했어요.",
    questionDeleted: "기억 카드를 삭제했어요.",
    questionAdded: "새 기억 카드를 추가했어요.",
    newQuestionTitle: "새 기억 카드",
    capsuleDeleted: "캡슐을 삭제했어요.",
    confirmDeleteQuestion: "이 질문 카드를 삭제할까요?",
    capsuleImportFailed: "캡슐 가져오기 실패",
    capsuleImportCanceled: "캡슐 가져오기를 취소했어요.",
    capsuleExported: "캡슐 백업 파일을 만들었어요.",
    unknownError: "알 수 없는 오류",
    typeLabels: {
      year: "연도 회고",
      life_stage: "시기 회고",
      career: "커리어 회고",
      relationship: "관계 회고",
      travel: "여행 회고",
      project: "프로젝트 회고",
      custom: "직접 만든 회고",
    },
  },
  en: {
    language: "Language",
    capsules: "Capsules",
    archive: "Archive",
    archiveCapsulesEyebrow: "Planet Archive",
    archiveCapsulesTitle: "Manage memory planets from the archive",
    archiveCapsulesDescription:
      "Planet search and selection are moving here. Picking a planet returns you to the universe view and detail editor.",
    archiveCount: "Planets",
    openArchive: "Open archive",
    createEntryEyebrow: "Creation Entry",
    createEntryTitle: "Start a new memory object",
    createEntryDescription:
      "Personal planets can be created now, and group galaxies will connect to this entry point next.",
    openCreateEntry: "Open creation entry",
    createPlanetEntry: "Create personal planet",
    createGalaxyEntry: "Group galaxy coming soon",
    closeCreateEntry: "Close entry",
    memoryUniverse: "My Memory Universe",
    retrospectiveCapsules: "Retrospective Capsules",
    exportCapsules: "Export capsule JSON",
    importCapsules: "Import capsule JSON",
    capsuleBackupVersion: "Backup v1",
    refresh: "Refresh",
    searchCapsules: "Search capsules",
    questions: "Questions",
    answers: "Answers",
    noCapsules: "No capsules yet. Create your first retrospective capsule on the right.",
    noSearchResults: "No results found.",
    todayDiscovery: "Today's Discovery",
    openDiscovery: "Open again",
    memoryMap: "Memory Map",
    memoryMapEmpty: "No memory planets yet. Create a capsule and it will appear here.",
    createMemoryPlanet: "Create memory planet",
    rediscover: "Rediscover",
    rediscoverEmpty: "Once answers build up, old questions can resurface here.",
    createCapsule: "Create Capsule",
    title: "Title",
    titlePlaceholder: "e.g. My twenties, Travel memories",
    description: "Description",
    descriptionPlaceholder: "The memories you want to keep here",
    noDescription: "No description.",
    type: "Type",
    defaultQuestions: "Default questions",
    none: "None",
    createCapsuleButton: "Create capsule",
    reset: "Reset",
    templateHint: "Choosing default questions creates question cards inside the capsule.",
    selectCapsuleHint: "Select a capsule on the left to view its question cards.",
    deleteCapsule: "Delete capsule",
    noCards: "No memory cards yet. Add the first one.",
    questionCard: "Memory Card",
    recentlyEdited: "Recent",
    unansweredOnly: "Unanswered memories",
    question: "Question",
    questionPlaceholder: "Enter a question",
    answer: "Answer",
    answerPlaceholder: "Write one answer per line",
    noSavedAnswers: "No saved answers yet.",
    saveQuestion: "Save memory card",
    deleteQuestion: "Delete memory card",
    selectOrAddQuestion: "Add or select a memory card.",
    capsuleCreated: "Capsule created.",
    capsuleCreateFailed: "Could not create capsule.",
    questionRequired: "Please enter a question.",
    questionSaved: "Memory card saved.",
    questionDeleted: "Memory card deleted.",
    questionAdded: "Memory card added.",
    newQuestionTitle: "New memory card",
    capsuleDeleted: "Capsule deleted.",
    confirmDeleteQuestion: "Delete this question card?",
    capsuleImportFailed: "Capsule import failed",
    capsuleImportCanceled: "Capsule import canceled.",
    capsuleExported: "Capsule backup file created.",
    unknownError: "Unknown error",
    typeLabels: {
      year: "Year retrospective",
      life_stage: "Life-stage retrospective",
      career: "Career retrospective",
      relationship: "Relationship retrospective",
      travel: "Travel retrospective",
      project: "Project retrospective",
      custom: "Custom retrospective",
    },
  },
} satisfies Record<AppLanguage, Record<string, any>>;

const entries = ref<ReviewEntry[]>([]);
const language = ref<AppLanguage>(
  localStorage.getItem(LANGUAGE_KEY) === "en" ? "en" : "ko"
);
const capsules = ref<Capsule[]>([]);
const capsuleCards = ref<CapsuleCard[]>([]);
const selectedCapsuleId = ref<string | null>(null);
const selectedCapsuleCardId = ref<string | null>(null);
const mode = ref<AppMode>("home-universe");
const showCreateComposer = ref<boolean>(false);
const modePlanById = Object.fromEntries(appModePlans.map((plan) => [plan.id, plan])) as Record<
  AppMode,
  (typeof appModePlans)[number]
>;
const archiveModePlanById = Object.fromEntries(
  archiveModePlans.map((plan) => [plan.id, plan])
) as Record<ArchiveModeId, (typeof archiveModePlans)[number]>;
const lastArchiveMode = ref<ArchiveModeId>("year-archive");

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
const showUnansweredCardsOnly = ref<boolean>(false);

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

const t = computed(() => messages[language.value]);

function isArchiveMode(m: AppMode): m is ArchiveModeId {
  return m === "quick-entry-archive" || m === "year-archive" || m === "question-compare-archive";
}

const activeArchiveMode = computed<ArchiveModeId>(() => {
  return isArchiveMode(mode.value) ? mode.value : lastArchiveMode.value;
});
const activeArchiveModePlan = computed(() => archiveModePlanById[activeArchiveMode.value]);

const capsuleCreateLabels = computed(() => ({
  title: t.value.title,
  titlePlaceholder: t.value.titlePlaceholder,
  description: t.value.description,
  descriptionPlaceholder: t.value.descriptionPlaceholder,
  type: t.value.type,
  defaultQuestions: t.value.defaultQuestions,
  none: t.value.none,
  createCapsuleButton: t.value.createCapsuleButton,
  reset: t.value.reset,
  templateHint: t.value.templateHint,
}));

const capsuleListLabels = computed(() => ({
  searchCapsules: t.value.searchCapsules,
  questions: t.value.questions,
  answers: t.value.answers,
  noCapsules: t.value.noCapsules,
  noSearchResults: t.value.noSearchResults,
}));
const archiveShelfLabels = computed(() => ({
  eyebrow: t.value.archiveCapsulesEyebrow,
  title: t.value.archiveCapsulesTitle,
  description: t.value.archiveCapsulesDescription,
}));
const archiveBridgeLabels = computed(() => ({
  eyebrow: t.value.archiveCapsulesEyebrow,
  title: t.value.archiveCapsulesTitle,
  description: t.value.archiveCapsulesDescription,
  count: t.value.archiveCount,
  open: t.value.openArchive,
}));
const createEntryLabels = computed(() => ({
  eyebrow: t.value.createEntryEyebrow,
  title: t.value.createEntryTitle,
  description: t.value.createEntryDescription,
  open: t.value.openCreateEntry,
  createPlanet: t.value.createPlanetEntry,
  createGalaxy: t.value.createGalaxyEntry,
  close: t.value.closeCreateEntry,
}));

const discoveryLabels = computed(() => ({
  title: t.value.todayDiscovery,
  empty: t.value.rediscoverEmpty,
  open: t.value.openDiscovery,
}));

const capsuleDetailLabels = computed(() => ({
  selectCapsuleHint: t.value.selectCapsuleHint,
  deleteCapsule: t.value.deleteCapsule,
  noCards: t.value.noCards,
  questionCard: t.value.questionCard,
  recentlyEdited: t.value.recentlyEdited,
  unansweredOnly: t.value.unansweredOnly,
  question: t.value.question,
  questionPlaceholder: t.value.questionPlaceholder,
  answer: t.value.answer,
  answerPlaceholder: t.value.answerPlaceholder,
  noSavedAnswers: t.value.noSavedAnswers,
  saveQuestion: t.value.saveQuestion,
  deleteQuestion: t.value.deleteQuestion,
  selectOrAddQuestion: t.value.selectOrAddQuestion,
}));

function saveLanguage() {
  localStorage.setItem(LANGUAGE_KEY, language.value);
}

function capsuleTypeLabel(type: CapsuleType) {
  return t.value.typeLabels[type] ?? type;
}

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

const capsuleStats = computed(() => buildCapsuleStats(capsuleCards.value));

const filteredCapsules = computed(() => filterCapsules(capsules.value, capsuleSearch.value));

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

const recentlyEditedCapsuleCardId = computed(() => {
  return findMostRecentlyAnsweredCardId(selectedCapsuleCards.value);
});

const discoveryCard = computed(() => {
  return selectDailyDiscoveryCard(capsuleCards.value);
});

const homeCapsuleItems = computed(() =>
  buildCapsuleHomeItems(capsules.value, capsuleStats.value, discoveryCard.value)
);

const discoveryCapsuleTitle = computed(() => {
  if (!discoveryCard.value) return "";
  return capsules.value.find((capsule) => capsule.id === discoveryCard.value?.capsuleId)?.title ?? "";
});

const discoveryAnswerPreview = computed(() => {
  if (!discoveryCard.value) return "";
  return previewAnswers(discoveryCard.value.answers);
});

function setMode(m: AppMode) {
  mode.value = m;
  errorMsg.value = "";
  capsuleError.value = "";
  capsuleNotice.value = "";

  if (isArchiveMode(m)) {
    lastArchiveMode.value = m;
  }

  if (m === "quick-entry-archive") {
    form.year = selectedYear.value;
    editingId.value = null;
    ensureAtLeastOneAnswerRow();
  }

  if (m === "home-universe" || m === "planet-detail") {
    refreshCapsules();
  }

  if (m === "question-compare-archive") {
    if (!compareQ.value && questionBank.value[0]) compareQ.value = questionBank.value[0].q;
  }
}

function openArchiveSettings() {
  setMode(lastArchiveMode.value);
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

function openCreateFlow() {
  resetCapsuleForm();
  showCreateComposer.value = true;
  setMode("planet-detail");
}

function closeCreateFlow() {
  showCreateComposer.value = false;
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
  setMode("planet-detail");
}

function openCapsuleFromArchive(id: string) {
  selectCapsule(id);
}

function selectCapsuleCard(id: string) {
  selectedCapsuleCardId.value = id;
  const card = capsuleCards.value.find((item) => item.id === id);
  if (card) startCapsuleCardEdit(card);
}

function jumpToCapsuleCard(capsuleId: string, cardId: string) {
  selectedCapsuleId.value = capsuleId;
  selectCapsuleCard(cardId);
  setMode("planet-detail");
}

function openDiscoveryCard() {
  if (!discoveryCard.value) return;
  jumpToCapsuleCard(discoveryCard.value.capsuleId, discoveryCard.value.id);
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
      language: language.value,
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
    showCreateComposer.value = false;
    capsuleNotice.value = t.value.capsuleCreated;
    setMode("planet-detail");
  } catch (err: any) {
    capsuleError.value = err?.message ?? t.value.capsuleCreateFailed;
  }
}

function addCapsuleCard() {
  if (!selectedCapsule.value) return;

  const now = new Date().toISOString();
  const card: CapsuleCard = {
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    capsuleId: selectedCapsule.value.id,
    questionText: t.value.newQuestionTitle,
    answers: [],
    source: "user",
    order: selectedCapsuleCards.value.length,
    createdAt: now,
    updatedAt: now,
  };

  capsuleCards.value = [card, ...capsuleCards.value];
  selectedCapsuleCardId.value = card.id;
  startCapsuleCardEdit(card);
  capsuleError.value = "";
  capsuleNotice.value = t.value.questionAdded;
  syncCapsuleStorage();
}

function saveSelectedCapsuleCard() {
  if (!selectedCapsuleCard.value) return;

  const questionText = capsuleCardForm.questionText.trim();
  if (!questionText) {
    capsuleError.value = t.value.questionRequired;
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
  const savedTime = new Date().toLocaleTimeString(language.value === "ko" ? "ko-KR" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  capsuleNotice.value =
    language.value === "ko"
      ? `${t.value.questionSaved} (${savedTime})`
      : `${t.value.questionSaved} (${savedTime})`;
  syncCapsuleStorage();
}

function deleteSelectedCapsuleCard() {
  const card = selectedCapsuleCard.value;
  if (!card) return;
  if (!confirm(t.value.confirmDeleteQuestion)) return;

  capsuleCards.value = capsuleCards.value.filter((item) => item.id !== card.id);
  const nextCard = selectedCapsuleCards.value.find((item) => item.id !== card.id) ?? null;
  selectedCapsuleCardId.value = nextCard?.id ?? null;
  if (nextCard) startCapsuleCardEdit(nextCard);
  else resetCapsuleCardForm();

  capsuleError.value = "";
  capsuleNotice.value = t.value.questionDeleted;
  syncCapsuleStorage();
}

function deleteSelectedCapsule() {
  const capsule = selectedCapsule.value;
  if (!capsule) return;
  const message =
    language.value === "ko"
      ? `"${capsule.title}" 캡슐과 그 안의 질문 카드를 삭제할까요?`
      : `Delete "${capsule.title}" and its question cards?`;
  if (!confirm(message)) return;

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
  capsuleNotice.value = t.value.capsuleDeleted;
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
  setMode("question-compare-archive");
}

function jumpToEdit(id: string) {
  const e = entries.value.find((x) => x.id === id);
  if (!e) return;

  selectedYear.value = e.year;
  selectedId.value = e.id;
  setMode("year-archive");
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
  capsuleNotice.value = t.value.capsuleExported;
}

function buildImportPreviewMessage(preview: ReturnType<typeof previewCapsuleBackupImport>): string {
  const duplicates = preview.skippedCapsules + preview.skippedCards;
  if (language.value === "ko") {
    return [
      "가져오기 미리보기",
      `추가될 캡슐: ${preview.addedCapsules}개`,
      `추가될 질문 카드: ${preview.addedCards}개`,
      `중복: ${duplicates}개`,
      "계속 가져올까요?",
    ].join("\n");
  }

  return [
    "Import preview",
    `Capsules to add: ${preview.addedCapsules}`,
    `Question cards to add: ${preview.addedCards}`,
    `Duplicates: ${duplicates}`,
    "Continue importing?",
  ].join("\n");
}

function buildImportResultMessage(result: ReturnType<typeof importCapsuleBackup>): string {
  const duplicates = result.skippedCapsules + result.skippedCards;
  const added = result.addedCapsules + result.addedCards;

  if (language.value === "ko") {
    if (added === 0) {
      return `가져오기 완료: 새로 추가된 항목은 없고 중복 ${duplicates}개를 건너뛰었어요.`;
    }

    return `가져오기 완료: 캡슐 ${result.addedCapsules}개와 질문 카드 ${result.addedCards}개를 추가했어요. 중복 ${duplicates}개는 건너뛰었어요.`;
  }

  if (added === 0) {
    return `Import complete: nothing new was added, and ${duplicates} duplicates were skipped.`;
  }

  return `Import complete: added ${result.addedCapsules} capsules and ${result.addedCards} question cards. Skipped ${duplicates} duplicates.`;
}

function buildCapsuleImportErrorMessage(err: unknown): string {
  const message = err instanceof Error ? err.message : "";

  if (language.value === "ko") {
    if (message === CAPSULE_IMPORT_ERROR.invalidJson) {
      return "JSON 형식이 올바르지 않아요. Recoverse에서 내보낸 JSON 파일인지 확인해 주세요.";
    }
    if (message === CAPSULE_IMPORT_ERROR.unsupportedVersion) {
      return "지원하지 않는 백업 버전이에요. 최신 Recoverse 백업 파일을 사용해 주세요.";
    }
    if (message === CAPSULE_IMPORT_ERROR.unsupportedFormat) {
      return "Recoverse 백업 구조를 찾을 수 없어요. 캡슐 백업 또는 기존 연도별 백업 파일인지 확인해 주세요.";
    }
  } else {
    if (message === CAPSULE_IMPORT_ERROR.invalidJson) {
      return "This is not valid JSON. Please check that it was exported from Recoverse.";
    }
    if (message === CAPSULE_IMPORT_ERROR.unsupportedVersion) {
      return "This backup version is not supported. Please use a recent Recoverse backup file.";
    }
    if (message === CAPSULE_IMPORT_ERROR.unsupportedFormat) {
      return "Recoverse backup data was not found. Please use a capsule backup or legacy yearly backup file.";
    }
  }

  return err instanceof Error ? err.message : t.value.unknownError;
}

async function onImportCapsuleFile(e: Event) {
  capsuleError.value = "";
  capsuleNotice.value = "";

  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const preview = previewCapsuleBackupImport(text);
    if (!confirm(buildImportPreviewMessage(preview))) {
      capsuleNotice.value = t.value.capsuleImportCanceled;
      return;
    }

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

    capsuleNotice.value = buildImportResultMessage(result);
  } catch (err: unknown) {
    capsuleError.value = `${t.value.capsuleImportFailed}: ${buildCapsuleImportErrorMessage(err)}`;
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
  if (mode.value === "quick-entry-archive") onAdd();
  else if (mode.value === "year-archive" && editingId.value) onSaveEdit();
}

</script>

<style scoped>
/* ===== Laptop-first (no mobile optimization) ===== */
.app {
  min-height: 100vh;
  background: var(--color-page);
  color: var(--color-ink);
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
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-soft-border);
  display: grid;
  grid-template-columns: 360px 1fr;
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
  background: var(--color-primary);
  color: var(--color-primary-contrast);
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
  color: var(--color-muted);
}

.tabs {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.tabs button {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  background: var(--color-paper);
  border-radius: 999px;
  color: var(--color-ink);
  cursor: pointer;
}

.tabs button.on {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-primary-contrast);
}

button {
  font: inherit;
  border: 1px solid var(--color-border);
  background: var(--color-paper);
  border-radius: 12px;
  padding: 10px 12px;
  cursor: pointer;
  color: var(--color-ink);
}

button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-primary-contrast);
}

.ghost {
  background: var(--color-paper);
}

.danger {
  border-color: var(--color-danger);
  color: var(--color-danger);
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
  background: var(--color-surface);
  border: 1px solid var(--color-soft-border);
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 92px);
}

.panelHead {
  padding: 12px 12px;
  border-bottom: 1px solid var(--color-soft-border);
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

.panelFoot {
  padding: 12px;
  border-top: 1px solid var(--color-soft-border);
}

.hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--color-muted);
  line-height: 1.35;
}

.search {
  margin-left: auto;
  width: 220px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
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

@media (max-width: 899px) {
  .topbar {
    position: static;
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 12px;
  }

  .tabs {
    justify-content: flex-start;
    overflow-x: auto;
    padding-bottom: 2px;
  }

  .tabs button {
    flex: 0 0 auto;
    padding: 9px 10px;
  }

  .main {
    padding: 10px;
  }

  .panel {
    min-height: auto;
  }

  .layout3,
  .layoutCompare,
  .layoutAdd {
    grid-template-columns: 1fr;
  }
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

.discoverButton {
  width: 100%;
  text-align: left;
  border-radius: 12px;
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
