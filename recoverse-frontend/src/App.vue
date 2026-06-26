<template>
  <div class="app" :data-theme="appTheme">
    <AppTopNav
      @go-home="navigateBottomTab('home')"
      @menu-action="onTopMenuAction"
    />
    <main class="main">
      <ArchiveShellView
        v-if="mode === 'archive-library'"
        :title="modePlanById['archive-library'].title"
        :description="modePlanById['archive-library'].note"
        :home-label="t.navHome"
        @back-home="setMode('home-universe')"
      >
        <ArchiveSectionTabs
          :active-mode="activeArchiveMode"
          :plans="archiveModePlans"
          @select="selectArchiveMode"
        />
        <ArchiveCapsuleShelf
          :search="capsuleSearch"
          :sort="capsuleArchiveSort"
          :capsules="capsules"
          :filtered-capsules="filteredCapsules"
          :selected-capsule-id="selectedCapsuleId"
          :stats="capsuleStats"
          :match-reasons="capsuleMatchReasons"
          :type-labels="t.typeLabels"
          :list-labels="capsuleListLabels"
          :labels="archiveShelfLabels"
          @update:search="capsuleSearch = $event"
          @update:sort="capsuleArchiveSort = $event"
          @select="openCapsuleFromArchive"
        />
      </ArchiveShellView>

      <ArchiveShellView
        v-else-if="mode === 'archive-time'"
        :title="modePlanById['archive-time'].title"
        :description="modePlanById['archive-time'].note"
        :home-label="t.navHome"
        @back-home="setMode('home-universe')"
      >
        <ArchiveSectionTabs
          :active-mode="activeArchiveMode"
          :plans="archiveModePlans"
          @select="selectArchiveMode"
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

      <section class="archiveBand">
        <div class="archiveBandHead">
          <span class="eyebrow">반복 질문</span>
          <h2>같은 질문을 시간순으로 비교해요</h2>
          <p>연도별 기록을 둘러보다가, 필요할 때만 같은 질문의 변화를 펼쳐보세요.</p>
          <button class="ghost compareToggle" type="button" @click="showQuestionCompare = !showQuestionCompare">
            {{ showQuestionCompare ? "비교 닫기" : "반복 질문 비교 열기" }}
          </button>
        </div>
        <section v-if="showQuestionCompare" class="layoutCompare">
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
                기록이 충분히 쌓이면 반복 질문을 비교할 수 있어요.
              </div>
            </div>
          </aside>

          <section class="panel">
            <div class="panelHead">
              <h2 class="noWrap">연도별 답</h2>
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
        <div v-else class="empty compareHint">
          반복 질문 비교는 보조 도구예요. 먼저 연도별 기록을 보고, 같은 질문의 변화가 궁금할 때 열어보세요.
        </div>
      </section>
      </ArchiveShellView>

      <ArchiveShellView
        v-else-if="mode === 'archive-settings'"
        eyebrow="Settings"
        tone="settings"
        :title="modePlanById['archive-settings'].title"
        :description="modePlanById['archive-settings'].note"
        :home-label="t.navHome"
        @back-home="setMode('home-universe')"
      >
        <ArchiveSectionTabs
          :active-mode="activeArchiveMode"
          :plans="archiveModePlans"
          @select="selectArchiveMode"
        />
        <section class="settingsPanel">
          <ArchiveSettingsTools
            :language="language"
            :theme="appTheme"
            :active-section="activeSettingsSection"
            :language-label="t.language"
            theme-label="테마"
            :theme-options="themeOptions"
            reflection-group-label="현재 회고 데이터"
            reflection-export-label="회고 백업하기"
            reflection-import-label="회고 가져오기"
            reflection-backup-hint="Recoverse의 기준 데이터입니다. 가져오기는 기존 회고를 지우지 않고 최신 항목만 병합합니다."
            :reflection-export-disabled="reflections.length === 0"
            :capsule-group-label="t.capsuleBackupGroup"
            :capsule-export-label="t.exportCapsules"
            :capsule-import-label="t.importCapsules"
            :capsule-export-disabled="capsules.length === 0"
            :legacy-group-label="t.legacyBackupGroup"
            :export-label="t.legacyExportJson"
            :import-label="t.legacyImportJson"
            :danger-group-label="t.dangerSettingsGroup"
            :clear-label="t.clearAllData"
            :export-disabled="entries.length === 0"
            :clear-disabled="entries.length === 0 && reflections.length === 0 && capsules.length === 0"
            @update:language="language = $event"
            @update:theme="setAppTheme"
            @change-language="saveLanguage"
            @reflection-export="onExportReflections"
            @reflection-import-file="onImportReflectionFile"
            @capsule-export="onExportCapsules"
            @capsule-import-file="onImportCapsuleFile"
            @export="onExport"
            @import-file="onImportFile"
            @clear-all="clearAll"
          />
        </section>
      </ArchiveShellView>

      <!-- Mode: CAPSULES -->
      <HomeUniverseView
        v-else-if="mode === 'home-universe'"
        brand-label="Recoverse"
        :title="t.memoryUniverse"
        :reflections="reflections"
        @start-writing="openNewReflection"
        @open-reflection="openReflectionDetail"
        @continue-reflection="continueReflection"
      />

      <NewReflectionPage
        v-else-if="mode === 'reflection-new'"
        @back-home="setMode('home-universe')"
        @create="startReflectionDraft"
      />

      <WriteReflectionPage
        v-else-if="mode === 'reflection-write'"
        :reflection="activeReflection"
        @save-answer="saveActiveReflectionAnswer"
        @save-later="setMode('home-universe')"
        @back-new="setMode('reflection-new')"
        @finish="setMode('reflection-detail')"
      />

      <ReflectionDetailPage
        v-else-if="mode === 'reflection-detail'"
        :reflection="activeReflection"
        @back-home="setMode('home-universe')"
        @edit="setMode('reflection-write')"
        @share="shareActiveReflection"
        @account-save="requestAccountSave"
        @local-backup="onExportReflections"
      />

      <ReviewAgainPage
        v-else-if="mode === 'review-again'"
        :reflections="reflections"
        @back-home="setMode('home-universe')"
        @open-reflection="openReflectionDetail"
      />

      <SharedReflectionPage
        v-else-if="mode === 'shared-reflections'"
        :reflection="activeReflection"
        :snapshot="sharedReflectionSnapshot"
        @back-home="setMode('home-universe')"
        @answer-same="openNewReflection"
      />

      <GalaxyDetailView
        v-else-if="mode === 'galaxy-detail'"
        :galaxy="selectedGalaxy"
        :members="selectedGalaxyMembers"
        :prompts="selectedGalaxyPrompts"
        :logs="selectedGalaxyLogs"
        :galaxy-form="galaxyEditForm"
        :member-form="galaxyMemberForm"
        :prompt-form="galaxyPromptForm"
        :log-drafts="galaxyLogDrafts"
        :labels="galaxyDetailLabels"
        @back-home="setMode('home-universe')"
        @create-observation="createObservationFromSelectedGalaxy"
        @save-galaxy="saveSelectedGalaxy"
        @delete-galaxy="deleteSelectedGalaxy"
        @add-member="addSelectedGalaxyMember"
        @update-member="updateSelectedGalaxyMember"
        @delete-member="deleteSelectedGalaxyMember"
        @add-prompt="addSelectedGalaxyPrompt"
        @update-prompt="updateSelectedGalaxyPrompt"
        @delete-prompt="deleteSelectedGalaxyPrompt"
        @save-log="saveSelectedGalaxyLog"
      />

      <ObservationModeView
        v-else-if="mode === 'observation'"
        :snapshot="selectedObservationSnapshot"
        :labels="observationLabels"
        @back="setMode('home-universe')"
      />

      <PlanetDetailView
        v-else-if="mode === 'planet-detail'"
        v-model:create-mode="createMode"
        v-model:show-unanswered-cards-only="showUnansweredCardsOnly"
        :create-capsule-title="t.createCapsule"
        :show-create-composer="showCreateComposer"
        :observation-label="t.createObservation"
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
        :galaxy-form="galaxyForm"
        :capsule-card-form="capsuleCardForm"
        :capsule-templates="capsuleTemplates"
        :capsule-error="capsuleError"
        :capsule-notice="capsuleNotice"
        :galaxy-error="galaxyError"
        :galaxy-notice="galaxyNotice"
        :type-labels="t.typeLabels"
        :create-entry-labels="createEntryLabels"
        :capsule-create-labels="capsuleCreateLabels"
        :galaxy-create-labels="galaxyCreateLabels"
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
        @create-galaxy="onCreateGalaxy"
        @create-observation="createObservationFromSelectedPlanet"
        @reset-capsule-form="resetCapsuleForm"
        @reset-galaxy-form="resetGalaxyForm"
        @delete-capsule="deleteSelectedCapsule"
        @select-card="selectCapsuleCard"
        @add-card="addCapsuleCard"
        @save-card="saveSelectedCapsuleCard"
        @delete-card="deleteSelectedCapsuleCard"
        @open-card="jumpToCapsuleCard"
      />

      <ArchiveShellView
        v-else-if="mode === 'archive-organize'"
        :title="modePlanById['archive-organize'].title"
        :description="modePlanById['archive-organize'].note"
        :home-label="t.navHome"
        @back-home="setMode('home-universe')"
      >
        <ArchiveSectionTabs
          :active-mode="activeArchiveMode"
          :plans="archiveModePlans"
          @select="selectArchiveMode"
        />
      <section class="layoutAdd">
        <section class="panel">
          <div class="panelHead">
            <h2 class="noWrap">새 기억 추가</h2>
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
            <button class="ghost" @click="onClonePrevYear">
              {{ selectedYear - 1 }} → {{ selectedYear }} 질문 복제
            </button>
            <p class="hint">
              누락된 연도 회고를 채울 때 이전 연도의 질문만 가져올 수 있어요.
            </p>
          </div>
        </aside>
      </section>
      </ArchiveShellView>
    </main>
    <AppBottomNav
      v-if="showBottomNav"
      :active-tab="activeBottomTab"
      :labels="bottomNavLabels"
      @navigate="navigateBottomTab"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, nextTick } from "vue";
import { useArchiveCapsuleSearch } from "./composables/useArchiveCapsuleSearch";
import { useAppNavigation } from "./composables/useAppNavigation";
import { useCapsuleEditorState } from "./composables/useCapsuleEditorState";
import ArchiveCapsuleShelf from "./components/ArchiveCapsuleShelf.vue";
import ArchiveSectionTabs from "./components/ArchiveSectionTabs.vue";
import ArchiveSettingsTools from "./components/ArchiveSettingsTools.vue";
import type { RecoverseTheme, SettingsSection } from "./components/ArchiveSettingsTools.vue";
import AppBottomNav from "./components/AppBottomNav.vue";
import AppTopNav from "./components/AppTopNav.vue";
import type { TopMenuAction } from "./components/AppTopNav.vue";
import ArchiveShellView from "./views/ArchiveShellView.vue";
import GalaxyDetailView from "./views/GalaxyDetailView.vue";
import HomeUniverseView from "./views/HomeUniverseView.vue";
import NewReflectionPage from "./views/NewReflectionPage.vue";
import ObservationModeView from "./views/ObservationModeView.vue";
import PlanetDetailView from "./views/PlanetDetailView.vue";
import ReflectionDetailPage from "./views/ReflectionDetailPage.vue";
import ReviewAgainPage from "./views/ReviewAgainPage.vue";
import SharedReflectionPage from "./views/SharedReflectionPage.vue";
import WriteReflectionPage from "./views/WriteReflectionPage.vue";
import {
  type AppLanguage,
  type Capsule,
  type CapsuleCard,
  type Galaxy,
  type GalaxyData,
  type GalaxyTheme,
  type ObservationData,
  type ReviewEntryV2 as ReviewEntry,
  loadEntries,
  saveEntries,
  loadCapsuleData,
  saveCapsuleData,
  buildCapsuleDataFromEntries,
  loadGalaxyData,
  loadObservationData,
} from "./lib/recoverseStore";
import {
  exportCapsuleBackup,
  importCapsuleBackup,
  previewCapsuleBackupImport,
} from "./lib/capsuleImportExport";
import {
  buildCapsuleImportErrorMessage,
  buildImportPreviewMessage,
  buildImportResultMessage,
} from "./lib/capsuleImportMessages";
import { downloadBlob } from "./lib/downloadBlob";
import {
  buildCapsuleHomeItems,
  buildCapsuleStats,
  type CapsuleArchiveSort,
  selectDailyDiscoveryCard,
} from "./lib/capsuleHomeData";
import { createCapsule } from "./lib/capsuleActions";
import {
  addGalaxyMember,
  addGalaxyPrompt,
  createGalaxy,
  deleteGalaxy,
  deleteGalaxyMember,
  deleteGalaxyPrompt,
  saveGalaxyLog,
  updateGalaxy,
  updateGalaxyMember,
  updateGalaxyPrompt,
} from "./lib/galaxyActions";
import {
  createGalaxyObservationSnapshot,
  createPlanetObservationSnapshot,
} from "./lib/observationActions";
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
  type ArchiveModeId,
  type AppMode,
} from "./lib/appScreens";
import {
  createReflectionDraft,
  loadReflections,
  saveReflection,
  saveReflectionAnswer,
  saveReflections,
} from "./lib/reflectionStore";
import {
  exportReflectionBackup,
  mergeReflectionBackup,
  REFLECTION_BACKUP_SCHEMA,
} from "./lib/reflectionBackup";
import {
  buildReflectionSyncPayload,
  getAccountSaveUnavailableMessage,
  getLocalOnlyStorageWarning,
  type AccountStorageProvider,
} from "./lib/reflectionSync";
import {
  buildShareHash,
  buildSharedReflectionSnapshot,
  REFLECTION_SHARE_HASH_PREFIX,
  readShareHash,
  type SharedReflectionSnapshot,
} from "./lib/reflectionShare";
import type { Reflection, ReflectionPeriod, ReflectionQuestionSetMode } from "./types/reflection";

type BottomTabId = "write" | "home" | "review";

const LANGUAGE_KEY = "recoverse_language";
const THEME_KEY = "recoverse_theme";

const messages = {
  ko: {
    language: "언어",
    capsules: "기억 행성",
    archive: "아카이브",
    archiveCapsulesEyebrow: "행성 보관함",
    archiveCapsulesTitle: "기억 행성을 찾고 다시 열어요",
    archiveCapsulesDescription:
      "검색과 필터로 오래된 회고를 조용히 찾고, 필요한 행성만 다시 탐험해요.",
    archiveCount: "전체 행성",
    openArchive: "아카이브 열기",
    createEntryEyebrow: "생성 입구",
    createEntryTitle: "어떤 기억을 남겨볼까요?",
    createEntryDescription:
      "혼자 남길 기억 행성과 함께 남길 그룹 은하 중 먼저 만들 대상을 고르세요.",
    openCreateEntry: "새 기억 시작하기",
    createPlanetEntry: "혼자 쓰는 기억 행성",
    createGalaxyEntry: "함께 쓰는 회고 은하",
    closeCreateEntry: "입구 닫기",
    navHome: "홈",
    navPlanet: "기록",
    navGalaxy: "은하",
    navWrite: "기억 작성",
    navReview: "다시 보기",
    navShared: "함께 보기",
    navArchive: "아카이브",
    navSettings: "설정",
    startReflection: "새 회고 시작",
    galaxyPlaceholder: "그룹 은하",
    memoryUniverse: "내 회고 홈",
    retrospectiveCapsules: "회고 행성",
    exportCapsules: "기억 행성 JSON 내보내기",
    importCapsules: "기억 행성 JSON 가져오기",
    capsuleBackupGroup: "이전 행성 데이터",
    legacyBackupGroup: "이전 연도 데이터",
    legacyExportJson: "연도 JSON 내보내기",
    legacyImportJson: "연도 JSON 가져오기",
    dangerSettingsGroup: "데이터 초기화",
    clearAllData: "전체 데이터 삭제",
    capsuleBackupVersion: "백업 v1",
    refresh: "새로고침",
    searchCapsules: "기억 행성 검색",
    archiveSort: "정렬",
    archiveSortUpdated: "최근 수정순",
    archiveSortCreated: "생성순",
    archiveSortTitle: "제목순",
    archiveMatch: "매칭",
    questions: "질문",
    answers: "답변",
    noCapsules: "아직 기억 행성이 없어요. 첫 회고 행성을 만들어보세요.",
    noSearchResults: "검색 결과가 없어요.",
    archiveRecentTitle: "최근 다시 열 기억",
    archiveRecentDescription: "방금 수정했거나 이어 쓰기 좋은 행성을 먼저 보여줘요.",
    archiveRecentOpen: "열기",
    todayDiscovery: "오늘의 발견",
    openDiscovery: "다시 열어보기",
    memoryMap: "기억 지도",
    memoryMapEmpty: "아직 떠 있는 기억 행성이 없어요. 첫 회고 행성을 만들면 이곳에 나타나요.",
    createMemoryPlanet: "내 첫 회고 행성 만들기",
    rediscover: "다시 발견하기",
    rediscoverEmpty: "답변이 쌓이면 오래된 질문을 다시 꺼내 보여줄 수 있어요.",
    createCapsule: "새 기억 만들기",
    title: "제목",
    titlePlaceholder: "예: 2026 연말 회고 행성",
    description: "설명",
    descriptionPlaceholder: "이 행성에 담고 싶은 기억",
    noDescription: "설명이 없어요.",
    type: "유형",
    defaultQuestions: "기본 질문",
    none: "없음",
    createCapsuleButton: "기억 행성 만들기",
    reset: "초기화",
    templateHint: "기본 질문을 고르면 행성 안에 탐사 기록이 함께 만들어져요.",
    selectCapsuleHint: "왼쪽에서 기억 행성을 선택하면 탐사 기록을 볼 수 있어요.",
    deleteCapsule: "행성 삭제",
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
    capsuleCreated: "기억 행성을 만들었어요.",
    capsuleCreateFailed: "기억 행성을 만들 수 없어요.",
    galaxyCreated: "그룹 은하를 만들었어요.",
    galaxyCreateFailed: "그룹 은하를 만들 수 없어요.",
    galaxyTitle: "은하 이름",
    galaxyTitlePlaceholder: "예: 2026 팀 회고 은하",
    galaxyDescription: "은하 설명",
    galaxyDescriptionPlaceholder: "함께 남길 기억의 주제",
    galaxyTheme: "은하 유형",
    createGalaxyButton: "그룹 은하 만들기",
    galaxyHint: "기본 멤버와 공통 탐사 기록이 함께 만들어져요. 멤버와 로그 편집은 다음 단계에서 확장합니다.",
    galaxyEmptyTitle: "그룹 은하가 없어요",
    galaxyEmptyDescription: "홈에서 새 그룹 은하를 만들면 이곳에서 함께 편집할 수 있어요.",
    galaxyNoSelected: "선택된 그룹 은하가 없어요.",
    galaxySettings: "은하 설정",
    galaxyInfo: "은하 정보",
    saveGalaxy: "은하 저장",
    deleteGalaxy: "은하 삭제",
    memberEyebrow: "멤버 행성",
    memberTitle: "함께 남기는 기억",
    memberPlaceholder: "멤버 이름",
    addMember: "멤버 추가",
    joined: "합류",
    promptEyebrow: "공통 탐사 기록",
    promptTitle: "같은 질문, 다른 로그",
    promptPlaceholder: "함께 답할 질문",
    addPrompt: "질문 추가",
    logPlaceholder: "탐사 로그를 적어보세요",
    saveLog: "로그 저장",
    noPrompts: "아직 공통 탐사 기록이 없어요.",
    delete: "삭제",
    galaxySaved: "은하를 저장했어요.",
    galaxyDeleted: "은하를 삭제했어요.",
    galaxyMemberAdded: "멤버를 추가했어요.",
    galaxyPromptAdded: "질문을 추가했어요.",
    galaxyLogSaved: "탐사 로그를 저장했어요.",
    createObservation: "읽기 전용 링크 만들기",
    observationCreated: "관측 스냅샷을 만들었어요.",
    observationMode: "관측 모드",
    observationEmptyTitle: "관측 스냅샷이 없어요",
    observationEmptyDescription: "행성이나 은하에서 관측 초대장을 만들면 이곳에서 읽을 수 있어요.",
    observationNoSnapshot: "아직 선택된 읽기 전용 스냅샷이 없습니다.",
    observationBack: "내 기억 우주로",
    readOnly: "읽기 전용",
    observationNoLogs: "아직 공유된 답변이 없어요.",
    observationNoticeTitle: "이 초대장은 원본과 분리된 스냅샷입니다",
    observationNoticeDescription:
      "관측자는 편집, 삭제, 댓글, 좋아요를 할 수 없습니다. 원본이 바뀌어도 이 화면은 공유 시점의 기록만 보여줍니다.",
    confirmDeleteGalaxy: "이 그룹 은하를 삭제할까요?",
    confirmDeleteGalaxyMember: "이 멤버와 관련 로그를 삭제할까요?",
    confirmDeleteGalaxyPrompt: "이 질문과 관련 로그를 삭제할까요?",
    galaxyThemeLabels: {
      year: "연도 회고",
      trip: "여행",
      project: "프로젝트",
      relationship: "관계",
      career: "커리어",
      custom: "직접 정하기",
    },
    questionRequired: "질문을 입력해 주세요.",
    questionSaved: "기억 카드를 저장했어요.",
    questionDeleted: "기억 카드를 삭제했어요.",
    questionAdded: "새 기억 카드를 추가했어요.",
    newQuestionTitle: "새 기억 카드",
    capsuleDeleted: "기억 행성을 삭제했어요.",
    confirmDeleteQuestion: "이 질문 카드를 삭제할까요?",
    capsuleImportFailed: "기억 행성 가져오기 실패",
    capsuleImportCanceled: "기억 행성 가져오기를 취소했어요.",
    capsuleExported: "기억 행성 백업 파일을 만들었어요.",
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
    capsules: "Memory Planets",
    archive: "Archive",
    archiveCapsulesEyebrow: "Planet Archive",
    archiveCapsulesTitle: "Find and reopen memory planets",
    archiveCapsulesDescription:
      "Search and filter older retrospectives, then reopen only the planet you need.",
    archiveCount: "Planets",
    openArchive: "Open archive",
    createEntryEyebrow: "Creation Entry",
    createEntryTitle: "What memory are you keeping?",
    createEntryDescription:
      "Choose whether you are creating a personal memory planet or a group galaxy.",
    openCreateEntry: "Start a new memory",
    createPlanetEntry: "Solo memory planet",
    createGalaxyEntry: "Shared reflection galaxy",
    closeCreateEntry: "Close entry",
    navHome: "Home",
    navPlanet: "Planet",
    navGalaxy: "Galaxy",
    navWrite: "Write Memory",
    navReview: "Review",
    navShared: "Shared",
    navArchive: "Archive",
    navSettings: "Settings",
    startReflection: "Start reflection",
    galaxyPlaceholder: "Group galaxy",
    memoryUniverse: "My reflection home",
    retrospectiveCapsules: "Retrospective Capsules",
    exportCapsules: "Export memory planet JSON",
    importCapsules: "Import memory planet JSON",
    capsuleBackupGroup: "Legacy Planet Data",
    legacyBackupGroup: "Legacy Year Data",
    legacyExportJson: "Export year JSON",
    legacyImportJson: "Import year JSON",
    dangerSettingsGroup: "Data reset",
    clearAllData: "Clear all data",
    capsuleBackupVersion: "Backup v1",
    refresh: "Refresh",
    searchCapsules: "Search memory planets",
    archiveSort: "Sort",
    archiveSortUpdated: "Recently updated",
    archiveSortCreated: "Created",
    archiveSortTitle: "Title",
    archiveMatch: "Match",
    questions: "Questions",
    answers: "Answers",
    noCapsules: "No memory planets yet. Create your first retrospective planet.",
    noSearchResults: "No results found.",
    archiveRecentTitle: "Recent memories",
    archiveRecentDescription: "Quickly return to planets that were edited recently.",
    archiveRecentOpen: "Open",
    todayDiscovery: "Today's Discovery",
    openDiscovery: "Open again",
    memoryMap: "Memory Map",
    memoryMapEmpty: "No memory planets yet. Create a planet and it will appear here.",
    createMemoryPlanet: "Create memory planet",
    rediscover: "Rediscover",
    rediscoverEmpty: "Once answers build up, old questions can resurface here.",
    createCapsule: "Create memory",
    title: "Title",
    titlePlaceholder: "e.g. 2026 Year-End Planet",
    description: "Description",
    descriptionPlaceholder: "The memories you want to keep in this planet",
    noDescription: "No description.",
    type: "Type",
    defaultQuestions: "Default questions",
    none: "None",
    createCapsuleButton: "Create memory planet",
    reset: "Reset",
    templateHint: "Choosing default questions creates exploration records inside the planet.",
    selectCapsuleHint: "Select a memory planet on the left to view exploration records.",
    deleteCapsule: "Delete memory planet",
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
    capsuleCreated: "Memory planet created.",
    capsuleCreateFailed: "Could not create memory planet.",
    galaxyCreated: "Group galaxy created.",
    galaxyCreateFailed: "Could not create group galaxy.",
    galaxyTitle: "Galaxy name",
    galaxyTitlePlaceholder: "e.g. 2026 Team Retrospective Galaxy",
    galaxyDescription: "Galaxy description",
    galaxyDescriptionPlaceholder: "The shared memory topic",
    galaxyTheme: "Galaxy type",
    createGalaxyButton: "Create group galaxy",
    galaxyHint: "A default member and shared exploration records are created now. Member and log editing will expand next.",
    galaxyEmptyTitle: "No group galaxy yet",
    galaxyEmptyDescription: "Create a group galaxy from Home to edit it here.",
    galaxyNoSelected: "No group galaxy selected.",
    galaxySettings: "Galaxy Settings",
    galaxyInfo: "Galaxy Info",
    saveGalaxy: "Save galaxy",
    deleteGalaxy: "Delete galaxy",
    memberEyebrow: "Member Planets",
    memberTitle: "Shared memories",
    memberPlaceholder: "Member name",
    addMember: "Add member",
    joined: "joined",
    promptEyebrow: "Shared Records",
    promptTitle: "Same questions, different logs",
    promptPlaceholder: "Question for everyone",
    addPrompt: "Add question",
    logPlaceholder: "Write an exploration log",
    saveLog: "Save log",
    noPrompts: "No shared exploration records yet.",
    delete: "Delete",
    galaxySaved: "Galaxy saved.",
    galaxyDeleted: "Galaxy deleted.",
    galaxyMemberAdded: "Member added.",
    galaxyPromptAdded: "Question added.",
    galaxyLogSaved: "Exploration log saved.",
    createObservation: "Create read-only link",
    observationCreated: "Observation snapshot created.",
    observationMode: "Observation Mode",
    observationEmptyTitle: "No observation snapshot",
    observationEmptyDescription: "Create an observation invite from a planet or galaxy to read it here.",
    observationNoSnapshot: "No read-only snapshot is selected yet.",
    observationBack: "My memory universe",
    readOnly: "Read only",
    observationNoLogs: "No shared answers yet.",
    observationNoticeTitle: "This invite is a snapshot separated from the source",
    observationNoticeDescription:
      "Observers cannot edit, delete, comment, or like. Even if the source changes, this screen keeps the records from the sharing moment.",
    confirmDeleteGalaxy: "Delete this group galaxy?",
    confirmDeleteGalaxyMember: "Delete this member and related logs?",
    confirmDeleteGalaxyPrompt: "Delete this question and related logs?",
    galaxyThemeLabels: {
      year: "Year retrospective",
      trip: "Trip",
      project: "Project",
      relationship: "Relationship",
      career: "Career",
      custom: "Custom",
    },
    questionRequired: "Please enter a question.",
    questionSaved: "Memory card saved.",
    questionDeleted: "Memory card deleted.",
    questionAdded: "Memory card added.",
    newQuestionTitle: "New memory card",
    capsuleDeleted: "Memory planet deleted.",
    confirmDeleteQuestion: "Delete this question card?",
    capsuleImportFailed: "Memory planet import failed",
    capsuleImportCanceled: "Memory planet import canceled.",
    capsuleExported: "Memory planet backup file created.",
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
const savedTheme = localStorage.getItem(THEME_KEY);
const appTheme = ref<RecoverseTheme>(
  savedTheme === "letter" || savedTheme === "journey" ? savedTheme : "universe"
);
const activeSettingsSection = ref<SettingsSection>("settings");
const themeOptions: Array<{
  id: RecoverseTheme;
  label: string;
  description: string;
}> = [
  { id: "universe", label: "우주", description: "기본 기억 공간" },
  { id: "letter", label: "편지방", description: "낡은 편지와 잉크" },
  { id: "journey", label: "지도", description: "여행 지도와 항해 일지" },
];
const capsules = ref<Capsule[]>([]);
const capsuleCards = ref<CapsuleCard[]>([]);
const galaxyData = ref<GalaxyData>({
  galaxies: [],
  members: [],
  prompts: [],
  logs: [],
});
const observationData = ref<ObservationData>({
  snapshots: [],
});
const reflections = ref<Reflection[]>(loadReflections());
const activeReflectionId = ref<string | null>(reflections.value[0]?.id ?? null);
const sharedReflectionSnapshot = ref<SharedReflectionSnapshot | null>(null);
const {
  selectedCapsuleId,
  selectedCapsuleCardId,
  showUnansweredCardsOnly,
  capsuleForm,
  capsuleCardForm,
  selectedCapsule,
  selectedCapsuleCards,
  selectedCapsuleCard,
  recentlyEditedCapsuleCardId,
  resetCapsuleForm: resetCapsuleEditorForm,
  resetCapsuleCardForm,
  startCapsuleCardEdit,
} = useCapsuleEditorState(capsules, capsuleCards);
const selectedGalaxyId = ref<string | null>(null);
const selectedObservationId = ref<string | null>(null);
const selectedUniverseObject = ref<{ type: "planet" | "galaxy"; id: string } | null>(null);
const { mode, activeArchiveMode, setNavigationMode } = useAppNavigation("home-universe");
const showCreateComposer = ref<boolean>(false);
const createMode = ref<"planet" | "galaxy">("planet");
const modePlanById = Object.fromEntries(appModePlans.map((plan) => [plan.id, plan])) as Record<
  AppMode,
  (typeof appModePlans)[number]
>;

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
const showQuestionCompare = ref(false);

const addSuggestSearch = ref<string>("");
const capsuleError = ref<string>("");
const capsuleNotice = ref<string>("");
const galaxyError = ref<string>("");
const galaxyNotice = ref<string>("");
const galaxyForm = reactive<{
  title: string;
  description: string;
  theme: GalaxyTheme;
}>({
  title: "",
  description: "",
  theme: "year",
});

const galaxyEditForm = reactive<{
  title: string;
  description: string;
  theme: GalaxyTheme;
}>({
  title: "",
  description: "",
  theme: "year",
});
const galaxyMemberForm = reactive({
  displayName: "",
});
const galaxyPromptForm = reactive({
  questionText: "",
});
const galaxyLogDrafts = reactive<Record<string, string>>({});

const {
  capsuleSearch,
  capsuleArchiveSort,
  filteredCapsules,
  capsuleMatchReasons,
} = useArchiveCapsuleSearch(capsules, capsuleCards);

/** ✅ 연도 범위: 2016부터 20년치 */
const START_YEAR = 2016;
const YEAR_COUNT = 20;

const years = computed(() => {
  const arr: number[] = [];
  for (let i = 0; i < YEAR_COUNT; i++) arr.push(START_YEAR + i); // 2016..2035
  return arr;
});

const t = computed(() => messages[language.value]);

const bottomNavLabels = computed(() => ({
  home: t.value.navHome,
  write: t.value.navWrite,
  review: t.value.navReview,
}));

const showBottomNav = computed(() =>
  [
    "home-universe",
    "reflection-new",
    "reflection-write",
    "reflection-detail",
    "review-again",
  ].includes(mode.value)
);

const activeBottomTab = computed<BottomTabId>(() => {
  if (mode.value === "reflection-new" || mode.value === "reflection-write") return "write";
  if (mode.value === "review-again" || mode.value === "shared-reflections") return "review";
  return "home";
});

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

const galaxyCreateLabels = computed(() => ({
  title: t.value.galaxyTitle,
  titlePlaceholder: t.value.galaxyTitlePlaceholder,
  description: t.value.galaxyDescription,
  descriptionPlaceholder: t.value.galaxyDescriptionPlaceholder,
  theme: t.value.galaxyTheme,
  themeLabels: t.value.galaxyThemeLabels as Record<GalaxyTheme, string>,
  createGalaxyButton: t.value.createGalaxyButton,
  reset: t.value.reset,
  hint: t.value.galaxyHint,
}));

const capsuleListLabels = computed(() => ({
  searchCapsules: t.value.searchCapsules,
  questions: t.value.questions,
  answers: t.value.answers,
  noCapsules: t.value.noCapsules,
  noSearchResults: t.value.noSearchResults,
  sort: t.value.archiveSort,
  match: t.value.archiveMatch,
  sortLabels: {
    updated: t.value.archiveSortUpdated,
    created: t.value.archiveSortCreated,
    title: t.value.archiveSortTitle,
  } as Record<CapsuleArchiveSort, string>,
}));
const archiveShelfLabels = computed(() => ({
  eyebrow: t.value.archiveCapsulesEyebrow,
  title: t.value.archiveCapsulesTitle,
  description: t.value.archiveCapsulesDescription,
  recentTitle: t.value.archiveRecentTitle,
  recentDescription: t.value.archiveRecentDescription,
  recentOpen: t.value.archiveRecentOpen,
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

const galaxyDetailLabels = computed(() => ({
  eyebrow: t.value.navGalaxy,
  emptyTitle: t.value.galaxyEmptyTitle,
  emptyDescription: t.value.galaxyEmptyDescription,
  noGalaxy: t.value.galaxyNoSelected,
  backHome: t.value.navHome,
  createObservation: t.value.createObservation,
  deleteGalaxy: t.value.deleteGalaxy,
  galaxySettings: t.value.galaxySettings,
  galaxyInfo: t.value.galaxyInfo,
  title: t.value.galaxyTitle,
  description: t.value.galaxyDescription,
  theme: t.value.galaxyTheme,
  themeLabels: t.value.galaxyThemeLabels as Record<GalaxyTheme, string>,
  saveGalaxy: t.value.saveGalaxy,
  memberEyebrow: t.value.memberEyebrow,
  memberTitle: t.value.memberTitle,
  memberPlaceholder: t.value.memberPlaceholder,
  addMember: t.value.addMember,
  joined: t.value.joined,
  promptEyebrow: t.value.promptEyebrow,
  promptTitle: t.value.promptTitle,
  promptPlaceholder: t.value.promptPlaceholder,
  addPrompt: t.value.addPrompt,
  logPlaceholder: t.value.logPlaceholder,
  saveLog: t.value.saveLog,
  noPrompts: t.value.noPrompts,
  delete: t.value.delete,
}));

const observationLabels = computed(() => ({
  mode: t.value.observationMode,
  emptyTitle: t.value.observationEmptyTitle,
  emptyDescription: t.value.observationEmptyDescription,
  noSnapshot: t.value.observationNoSnapshot,
  back: t.value.observationBack,
  readOnly: t.value.readOnly,
  noLogs: t.value.observationNoLogs,
  noticeTitle: t.value.observationNoticeTitle,
  noticeDescription: t.value.observationNoticeDescription,
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

function setAppTheme(theme: RecoverseTheme) {
  appTheme.value = theme;
  localStorage.setItem(THEME_KEY, theme);
}

function openSettingsSection(section: SettingsSection) {
  activeSettingsSection.value = section;
  if (!confirmLeavingWriteMode()) return;
  setMode("archive-settings");

  nextTick(() => {
    const targetId =
      section === "language"
        ? "settings-language"
        : section === "theme"
          ? "settings-theme"
          : section === "import" || section === "backup"
            ? "settings-backup"
            : "";
    if (!targetId) return;
    document.getElementById(targetId)?.scrollIntoView({ block: "center", behavior: "smooth" });
  });
}

function onTopMenuAction(action: TopMenuAction) {
  if (action === "backup") {
    if (!confirmLeavingWriteMode()) return;
    if (reflections.value.length > 0) {
      onExportReflections();
      return;
    }
    alert("백업할 새 회고가 아직 없어요.");
    openSettingsSection("backup");
    return;
  }

  if (action === "logout") {
    alert("아직 로그인 계정이 연결되어 있지 않아요. 현재 데이터는 이 브라우저에 임시 저장되어 있어요.");
    return;
  }

  openSettingsSection(action);
}

function requestAccountSave(provider: AccountStorageProvider) {
  const payload = buildReflectionSyncPayload(reflections.value, provider);
  const message = [
    getAccountSaveUnavailableMessage(provider),
    getLocalOnlyStorageWarning(payload.reflections.length),
    "지금 백업 파일을 내려받을까요?",
  ].join("\n\n");

  if (confirm(message)) {
    onExportReflections();
  }
}

function openSharedSnapshotFromHash() {
  const snapshot = readShareHash(window.location.hash);
  if (!snapshot) return false;

  sharedReflectionSnapshot.value = snapshot;
  activeReflectionId.value = null;
  setMode("shared-reflections", { recordHistory: false });
  return true;
}

function onHashChange() {
  if (openSharedSnapshotFromHash()) return;
  if (sharedReflectionSnapshot.value) {
    sharedReflectionSnapshot.value = null;
    setMode("home-universe");
  }
}

onMounted(() => {
  entries.value = loadEntries();
  refreshCapsules();
  refreshGalaxies();
  refreshObservations();
  // 시작은 2016으로 고정 (원하면: 데이터 있으면 그 연도로 자동 이동도 가능)
  selectedYear.value = START_YEAR;
  form.year = START_YEAR;
  window.history.replaceState({ recoverseMode: mode.value }, "", window.location.href);
  openSharedSnapshotFromHash();
  window.addEventListener("popstate", onBrowserBack);
  window.addEventListener("hashchange", onHashChange);
});

onBeforeUnmount(() => {
  window.removeEventListener("popstate", onBrowserBack);
  window.removeEventListener("hashchange", onHashChange);
});

function refreshCapsules() {
  const data = loadCapsuleData();
  capsules.value = data.capsules;
  capsuleCards.value = data.cards;

  if (selectedCapsuleId.value && !capsules.value.some((capsule) => capsule.id === selectedCapsuleId.value)) {
    selectedCapsuleId.value = null;
    selectedCapsuleCardId.value = null;
    if (selectedUniverseObject.value?.type === "planet") selectedUniverseObject.value = null;
  }
}

function refreshGalaxies() {
  galaxyData.value = loadGalaxyData();
  if (selectedGalaxyId.value && !galaxyData.value.galaxies.some((galaxy) => galaxy.id === selectedGalaxyId.value)) {
    selectedGalaxyId.value = null;
    if (selectedUniverseObject.value?.type === "galaxy") selectedUniverseObject.value = null;
  }
}

function refreshObservations() {
  observationData.value = loadObservationData();
  if (
    selectedObservationId.value &&
    !observationData.value.snapshots.some((snapshot) => snapshot.id === selectedObservationId.value)
  ) {
    selectedObservationId.value = null;
  }
}

function galaxyLogKey(promptId: string, memberId: string) {
  return `${promptId}:${memberId}`;
}

function resetGalaxyEditForms() {
  galaxyEditForm.title = "";
  galaxyEditForm.description = "";
  galaxyEditForm.theme = "year";
  galaxyMemberForm.displayName = "";
  galaxyPromptForm.questionText = "";
  for (const key of Object.keys(galaxyLogDrafts)) delete galaxyLogDrafts[key];
}

function syncGalaxyEditForms() {
  const galaxy = selectedGalaxy.value;
  if (!galaxy) {
    resetGalaxyEditForms();
    return;
  }

  galaxyEditForm.title = galaxy.title;
  galaxyEditForm.description = galaxy.description ?? "";
  galaxyEditForm.theme = galaxy.theme;
  galaxyMemberForm.displayName = "";
  galaxyPromptForm.questionText = "";

  for (const key of Object.keys(galaxyLogDrafts)) delete galaxyLogDrafts[key];
  for (const prompt of selectedGalaxyPrompts.value) {
    for (const member of selectedGalaxyMembers.value) {
      const log = selectedGalaxyLogs.value.find(
        (item) => item.promptId === prompt.id && item.memberId === member.id
      );
      galaxyLogDrafts[galaxyLogKey(prompt.id, member.id)] = log?.answers.join("\n") ?? "";
    }
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

const discoveryCard = computed(() => {
  return selectDailyDiscoveryCard(capsuleCards.value);
});

const homeCapsuleItems = computed(() =>
  buildCapsuleHomeItems(capsules.value, capsuleStats.value, discoveryCard.value)
);

const galaxies = computed<Galaxy[]>(() => galaxyData.value.galaxies);

const selectedGalaxy = computed(() => {
  if (!selectedGalaxyId.value) return null;
  return galaxyData.value.galaxies.find((galaxy) => galaxy.id === selectedGalaxyId.value) ?? null;
});

const selectedGalaxyMembers = computed(() => {
  if (!selectedGalaxyId.value) return [];
  return galaxyData.value.members.filter((member) => member.galaxyId === selectedGalaxyId.value);
});

const selectedGalaxyPrompts = computed(() => {
  if (!selectedGalaxyId.value) return [];
  return galaxyData.value.prompts
    .filter((prompt) => prompt.galaxyId === selectedGalaxyId.value)
    .sort((a, b) => a.order - b.order);
});

const selectedGalaxyLogs = computed(() => {
  if (!selectedGalaxyId.value) return [];
  return galaxyData.value.logs.filter((log) => log.galaxyId === selectedGalaxyId.value);
});

const selectedObservationSnapshot = computed(() => {
  if (!selectedObservationId.value) return null;
  return (
    observationData.value.snapshots.find((snapshot) => snapshot.id === selectedObservationId.value) ??
    null
  );
});

const activeReflection = computed(() => {
  if (!activeReflectionId.value) return null;
  return reflections.value.find((reflection) => reflection.id === activeReflectionId.value) ?? null;
});

const discoveryCapsuleTitle = computed(() => {
  if (!discoveryCard.value) return "";
  return capsules.value.find((capsule) => capsule.id === discoveryCard.value?.capsuleId)?.title ?? "";
});

const discoveryAnswerPreview = computed(() => {
  if (!discoveryCard.value) return "";
  return previewAnswers(discoveryCard.value.answers);
});

const modeBackStack = ref<AppMode[]>([]);
const isHandlingBrowserBack = ref(false);

function confirmLeavingWriteMode() {
  if (mode.value !== "reflection-write") return true;
  return confirm(
    "작성 중인 회고를 벗어나려 합니다. 저장하고 다음을 누르지 않은 현재 답변은 저장되지 않을 수 있어요. 이동할까요?"
  );
}

function setMode(m: AppMode, options: { recordHistory?: boolean } = {}) {
  const previousMode = mode.value;
  const shouldRecordHistory = options.recordHistory !== false;

  if (m !== "shared-reflections") {
    sharedReflectionSnapshot.value = null;
    clearShareHash();
  }

  if (previousMode !== m && shouldRecordHistory && !isHandlingBrowserBack.value) {
    modeBackStack.value.push(previousMode);
    window.history.pushState({ recoverseMode: m }, "", window.location.href);
  }

  setNavigationMode(m);
  errorMsg.value = "";
  capsuleError.value = "";
  capsuleNotice.value = "";
  galaxyError.value = "";
  galaxyNotice.value = "";

  if (m === "archive-organize") {
    form.year = selectedYear.value;
    editingId.value = null;
    ensureAtLeastOneAnswerRow();
  }

  if (
    m === "home-universe" ||
    m === "planet-detail" ||
    m === "galaxy-detail" ||
    m === "observation"
  ) {
    refreshCapsules();
    refreshGalaxies();
    refreshObservations();
  }

  if (m === "archive-time") {
    if (!compareQ.value && questionBank.value[0]) compareQ.value = questionBank.value[0].q;
  }
}

function clearShareHash() {
  if (!window.location.hash.startsWith(REFLECTION_SHARE_HASH_PREFIX)) return;
  window.history.replaceState(
    { recoverseMode: mode.value },
    "",
    `${window.location.pathname}${window.location.search}`
  );
}

function navigateBottomTab(tabId: BottomTabId) {
  if (tabId === activeBottomTab.value) return;
  if (!confirmLeavingWriteMode()) return;

  if (tabId === "home") {
    setMode("home-universe");
    return;
  }
  if (tabId === "write") {
    openNewReflection();
    return;
  }
  if (tabId === "review") {
    openReviewAgain();
    return;
  }
}

function onBrowserBack() {
  if (!confirmLeavingWriteMode()) {
    window.history.pushState({ recoverseMode: mode.value }, "", window.location.href);
    return;
  }

  const previousMode = modeBackStack.value.pop() ?? "home-universe";
  isHandlingBrowserBack.value = true;
  setMode(previousMode, { recordHistory: false });
  isHandlingBrowserBack.value = false;
}

function openArchiveSettings() {
  setMode("archive-library");
}

function openNewReflection() {
  sharedReflectionSnapshot.value = null;
  setMode("reflection-new");
}

function openReflectionDetail(reflectionId: string) {
  sharedReflectionSnapshot.value = null;
  activeReflectionId.value = reflectionId;
  setMode("reflection-detail");
}

function continueReflection(reflectionId: string) {
  sharedReflectionSnapshot.value = null;
  activeReflectionId.value = reflectionId;
  const reflection = activeReflection.value;
  setMode(reflection?.isCompleted ? "reflection-detail" : "reflection-write");
}

function openReviewAgain() {
  sharedReflectionSnapshot.value = null;
  setMode("review-again");
}

function openSharedReflections() {
  sharedReflectionSnapshot.value = null;
  if (!activeReflectionId.value) {
    activeReflectionId.value =
      reflections.value.find((reflection) => reflection.visibility === "shared")?.id ??
      reflections.value[0]?.id ??
      null;
  }
  setMode("shared-reflections");
}

async function shareActiveReflection(questionIds: string[]) {
  const reflection = activeReflection.value;
  const selectedQuestionIds = questionIds.filter(Boolean);
  if (!reflection || selectedQuestionIds.length === 0) return;

  const allQuestionIds = reflection.questionGroups.flatMap((group) =>
    group.questions.map((question) => question.id)
  );
  const next = {
    ...reflection,
    visibility: "shared" as const,
    shareSettings: {
      shareId: reflection.shareSettings?.shareId ?? `share_${Date.now().toString(36)}`,
      selectedQuestionIds,
      hiddenQuestionIds: allQuestionIds.filter((questionId) => !selectedQuestionIds.includes(questionId)),
      createdAt: reflection.shareSettings?.createdAt ?? new Date().toISOString(),
    },
    updatedAt: new Date().toISOString(),
  };

  reflections.value = saveReflection(next);
  activeReflectionId.value = next.id;
  const snapshot = buildSharedReflectionSnapshot(next, selectedQuestionIds);
  const hash = buildShareHash(snapshot);
  const shareUrl = `${window.location.origin}${window.location.pathname}${window.location.search}${hash}`;
  sharedReflectionSnapshot.value = snapshot;
  window.history.pushState({ recoverseMode: "shared-reflections" }, "", shareUrl);
  setMode("shared-reflections");

  try {
    await navigator.clipboard?.writeText(shareUrl);
    alert("읽기 전용 공유 링크를 복사했어요.");
  } catch {
    window.prompt("읽기 전용 공유 링크를 복사해 주세요.", shareUrl);
  }
}

function startReflectionDraft(payload: {
  templateId: string;
  period: ReflectionPeriod;
  questionSetMode: ReflectionQuestionSetMode;
  title?: string;
}) {
  const duplicate = reflections.value.find(
    (reflection) =>
      reflection.templateId === payload.templateId &&
      reflection.period.label.trim() === payload.period.label.trim()
  );

  if (duplicate) {
    activeReflectionId.value = duplicate.id;
    alert("같은 기간의 회고가 이미 있어요. 새로 만들지 않고 기존 회고를 이어서 열게요.");
    setMode(duplicate.isCompleted ? "reflection-detail" : "reflection-write");
    return;
  }

  const reflection = createReflectionDraft(payload);
  reflections.value = saveReflection(reflection);
  activeReflectionId.value = reflection.id;
  setMode("reflection-write");
}

function saveActiveReflectionAnswer(payload: {
  questionId: string;
  value: string;
  skipped: boolean;
}) {
  const reflection = activeReflection.value;
  if (!reflection) return;

  const next = saveReflectionAnswer(
    reflection,
    payload.questionId,
    payload.value,
    payload.skipped
  );
  reflections.value = saveReflection(next);
  activeReflectionId.value = next.id;
}

function selectArchiveMode(nextMode: ArchiveModeId) {
  if (nextMode === "archive-organize") {
    openCreateFlow();
    return;
  }

  setMode(nextMode);
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
  resetCapsuleEditorForm();
}

function resetGalaxyForm() {
  galaxyError.value = "";
  galaxyNotice.value = "";
  galaxyForm.title = "";
  galaxyForm.description = "";
  galaxyForm.theme = "year";
}

function openCreateFlow() {
  resetCapsuleForm();
  resetGalaxyForm();
  createMode.value = "planet";
  showCreateComposer.value = true;
  setMode("planet-detail");
}

function openGalaxyCreateFlow() {
  resetCapsuleForm();
  resetGalaxyForm();
  createMode.value = "galaxy";
  showCreateComposer.value = true;
  setMode("planet-detail");
}

function closeCreateFlow() {
  showCreateComposer.value = false;
  createMode.value = "planet";
}

function syncCapsuleStorage() {
  saveCapsuleData({
    capsules: capsules.value,
    cards: capsuleCards.value,
  });
}

function syncEntryToCapsule(entry: ReviewEntry) {
  const converted = buildCapsuleDataFromEntries([entry]);
  const convertedCapsule = converted.capsules[0];
  const convertedCard = converted.cards[0];
  if (!convertedCapsule || !convertedCard) return;

  const existingCapsule = capsules.value.find((capsule) => capsule.id === convertedCapsule.id);
  capsules.value = existingCapsule
    ? capsules.value.map((capsule) =>
        capsule.id === convertedCapsule.id
          ? {
              ...capsule,
              updatedAt:
                capsule.updatedAt > convertedCard.updatedAt ? capsule.updatedAt : convertedCard.updatedAt,
            }
          : capsule
      )
    : [convertedCapsule, ...capsules.value];
  capsuleCards.value = [
    convertedCard,
    ...capsuleCards.value.filter((card) => card.id !== convertedCard.id),
  ];
  syncCapsuleStorage();
  selectedCapsuleId.value = convertedCapsule.id;
  selectedCapsuleCardId.value = convertedCard.id;
  selectedUniverseObject.value = { type: "planet", id: convertedCapsule.id };
  startCapsuleCardEdit(convertedCard);
}

function selectCapsule(id: string) {
  selectedCapsuleId.value = id;
  selectedUniverseObject.value = { type: "planet", id };
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

function openSelectedCapsule() {
  const id =
    selectedUniverseObject.value?.type === "planet"
      ? selectedUniverseObject.value.id
      : selectedCapsuleId.value ?? capsules.value[0]?.id ?? null;

  if (id) {
    selectCapsule(id);
    return;
  }

  openCreateFlow();
}

function selectGalaxy(id: string) {
  selectedGalaxyId.value = id;
  selectedUniverseObject.value = { type: "galaxy", id };
  syncGalaxyEditForms();
  setMode("galaxy-detail");
}

function openSelectedGalaxy() {
  const id =
    selectedUniverseObject.value?.type === "galaxy"
      ? selectedUniverseObject.value.id
      : selectedGalaxyId.value ?? galaxies.value[0]?.id ?? null;

  if (!id) {
    resetCapsuleForm();
    resetGalaxyForm();
    createMode.value = "galaxy";
    showCreateComposer.value = true;
    setMode("planet-detail");
    return;
  }

  selectGalaxy(id);
}

function updateGalaxyData(next: GalaxyData) {
  galaxyData.value = next;
  syncGalaxyEditForms();
}

function saveSelectedGalaxy() {
  const galaxy = selectedGalaxy.value;
  if (!galaxy) return;

  try {
    updateGalaxyData(
      updateGalaxy(
        galaxy.id,
        {
          title: galaxyEditForm.title,
          description: galaxyEditForm.description,
          theme: galaxyEditForm.theme,
        },
        language.value
      )
    );
    galaxyNotice.value = t.value.galaxySaved;
  } catch (err: any) {
    galaxyError.value = err?.message ?? t.value.galaxyCreateFailed;
  }
}

function deleteSelectedGalaxy() {
  const galaxy = selectedGalaxy.value;
  if (!galaxy) return;
  if (!confirm(t.value.confirmDeleteGalaxy)) return;

  galaxyData.value = deleteGalaxy(galaxy.id);
  selectedGalaxyId.value = galaxyData.value.galaxies[0]?.id ?? null;
  selectedUniverseObject.value = selectedGalaxyId.value
    ? { type: "galaxy", id: selectedGalaxyId.value }
    : null;
  syncGalaxyEditForms();
  galaxyNotice.value = t.value.galaxyDeleted;
  setMode(selectedGalaxyId.value ? "galaxy-detail" : "home-universe");
}

function addSelectedGalaxyMember() {
  const galaxy = selectedGalaxy.value;
  if (!galaxy) return;

  try {
    updateGalaxyData(addGalaxyMember(galaxy.id, galaxyMemberForm.displayName, language.value));
    galaxyNotice.value = t.value.galaxyMemberAdded;
  } catch (err: any) {
    galaxyError.value = err?.message ?? t.value.unknownError;
  }
}

function updateSelectedGalaxyMember(payload: { memberId: string; displayName: string }) {
  try {
    updateGalaxyData(updateGalaxyMember(payload.memberId, payload.displayName, language.value));
  } catch (err: any) {
    galaxyError.value = err?.message ?? t.value.unknownError;
  }
}

function deleteSelectedGalaxyMember(memberId: string) {
  if (!confirm(t.value.confirmDeleteGalaxyMember)) return;
  updateGalaxyData(deleteGalaxyMember(memberId));
}

function addSelectedGalaxyPrompt() {
  const galaxy = selectedGalaxy.value;
  if (!galaxy) return;

  try {
    updateGalaxyData(addGalaxyPrompt(galaxy.id, galaxyPromptForm.questionText, language.value));
    galaxyNotice.value = t.value.galaxyPromptAdded;
  } catch (err: any) {
    galaxyError.value = err?.message ?? t.value.unknownError;
  }
}

function updateSelectedGalaxyPrompt(payload: { promptId: string; questionText: string }) {
  try {
    updateGalaxyData(updateGalaxyPrompt(payload.promptId, payload.questionText, language.value));
  } catch (err: any) {
    galaxyError.value = err?.message ?? t.value.unknownError;
  }
}

function deleteSelectedGalaxyPrompt(promptId: string) {
  if (!confirm(t.value.confirmDeleteGalaxyPrompt)) return;
  updateGalaxyData(deleteGalaxyPrompt(promptId));
}

function saveSelectedGalaxyLog(payload: { promptId: string; memberId: string }) {
  const galaxy = selectedGalaxy.value;
  if (!galaxy) return;

  updateGalaxyData(
    saveGalaxyLog(
      galaxy.id,
      payload.promptId,
      payload.memberId,
      galaxyLogDrafts[galaxyLogKey(payload.promptId, payload.memberId)] ?? ""
    )
  );
  galaxyNotice.value = t.value.galaxyLogSaved;
}

function openLatestObservationSnapshot() {
  selectedObservationId.value = observationData.value.snapshots[0]?.id ?? null;
  setMode("observation");
}

function createObservationFromSelectedPlanet() {
  const capsule = selectedCapsule.value;
  if (!capsule) return;

  observationData.value = createPlanetObservationSnapshot(capsule, selectedCapsuleCards.value);
  capsuleNotice.value = t.value.observationCreated;
  openLatestObservationSnapshot();
}

function createObservationFromSelectedGalaxy() {
  const galaxy = selectedGalaxy.value;
  if (!galaxy) return;

  observationData.value = createGalaxyObservationSnapshot(
    galaxy,
    selectedGalaxyMembers.value,
    selectedGalaxyPrompts.value,
    selectedGalaxyLogs.value
  );
  galaxyNotice.value = t.value.observationCreated;
  openLatestObservationSnapshot();
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

function onCreateGalaxy() {
  galaxyError.value = "";
  galaxyNotice.value = "";

  try {
    galaxyData.value = createGalaxy({
      title: galaxyForm.title,
      description: galaxyForm.description,
      theme: galaxyForm.theme,
      language: language.value,
    });
    selectedGalaxyId.value = galaxyData.value.galaxies[0]?.id ?? null;
    if (selectedGalaxyId.value) {
      selectedUniverseObject.value = { type: "galaxy", id: selectedGalaxyId.value };
    }
    resetGalaxyForm();
    showCreateComposer.value = false;
    createMode.value = "planet";
    galaxyNotice.value = t.value.galaxyCreated;
    setMode("home-universe");
  } catch (err: any) {
    galaxyError.value = err?.message ?? t.value.galaxyCreateFailed;
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
      ? `"${capsule.title}" 기억 행성과 그 안의 탐사 기록을 삭제할까요?`
      : `Delete "${capsule.title}" and its exploration records?`;
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

  const nextEntries = addEntry({
    year: Number(form.year),
    q: form.q.trim(),
    answers: normalizedAnswersForSave(),
  });
  entries.value = nextEntries;

  selectedYear.value = Number(form.year);
  const createdEntry = nextEntries[0];
  form.q = "";
  form.answers = [""];
  errorMsg.value = "";
  if (createdEntry) {
    syncEntryToCapsule(createdEntry);
    setMode("planet-detail");
  }
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
  showQuestionCompare.value = true;
  setMode("archive-time");
}

function jumpToEdit(id: string) {
  const e = entries.value.find((x) => x.id === id);
  if (!e) return;

  selectedYear.value = e.year;
  selectedId.value = e.id;
  setMode("archive-time");
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

function onExport() {
  const blob = exportBackup(entries.value);
  const yyyyMMdd = new Date().toISOString().slice(0, 10);
  downloadBlob(blob, `recoverse_${yyyyMMdd}.json`);
}

function onExportReflections() {
  const yyyyMMdd = new Date().toISOString().slice(0, 10);
  const blob = exportReflectionBackup(reflections.value);
  downloadBlob(blob, `recoverse_reflections_${yyyyMMdd}.json`);
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

async function onImportCapsuleFile(e: Event) {
  capsuleError.value = "";
  capsuleNotice.value = "";

  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const preview = previewCapsuleBackupImport(text);
    if (!confirm(buildImportPreviewMessage(preview, language.value))) {
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

    capsuleNotice.value = buildImportResultMessage(result, language.value);
  } catch (err: unknown) {
    capsuleError.value = `${t.value.capsuleImportFailed}: ${buildCapsuleImportErrorMessage(
      err,
      language.value,
      t.value.unknownError
    )}`;
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

async function onImportReflectionFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const result = mergeReflectionBackup(reflections.value, text);
    reflections.value = saveReflections(result.reflections);
    activeReflectionId.value = reflections.value[0]?.id ?? null;
    alert(
      `회고 가져오기 완료: 추가 ${result.added}개, 업데이트 ${result.updated}개, 유지 ${result.skipped}개`
    );
  } catch (err: any) {
    const reason =
      err?.message === "RECOVERSE_REFLECTION_IMPORT_INVALID_JSON"
        ? "JSON 파일을 읽을 수 없어요."
        : err?.message === "RECOVERSE_REFLECTION_IMPORT_UNSUPPORTED_VERSION"
          ? `${REFLECTION_BACKUP_SCHEMA} 백업 파일이 아니에요.`
          : err?.message ?? "알 수 없는 오류";
    alert(`회고 가져오기 실패: ${reason}`);
  } finally {
    input.value = "";
  }
}

function clearAll() {
  if (!confirm("진짜로 전부 삭제할까요? (되돌리기 없음)")) return;
  entries.value = [];
  reflections.value = [];
  capsules.value = [];
  capsuleCards.value = [];
  saveEntries([]);
  saveReflections([]);
  saveCapsuleData({ capsules: [], cards: [] });
  selectedId.value = null;
  activeReflectionId.value = null;
  selectedCapsuleId.value = null;
  selectedCapsuleCardId.value = null;
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
  if (mode.value === "archive-organize") onAdd();
  else if (mode.value === "archive-time" && editingId.value) onSaveEdit();
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

.app[data-theme="letter"] {
  --color-page: #17120f;
  --color-bg: #17120f;
  --color-surface: #251d18;
  --color-surface-2: #30241e;
  --color-text: #f1dfc4;
  --color-ink: #f1dfc4;
  --color-gold: #d7a35f;
  --color-primary: #d7a35f;
  --color-border-gold: rgba(215, 163, 95, 0.28);
}

.app[data-theme="journey"] {
  --color-page: #111915;
  --color-bg: #111915;
  --color-surface: #1a2720;
  --color-surface-2: #22342b;
  --color-text: #e8dfca;
  --color-ink: #e8dfca;
  --color-gold: #c7a96a;
  --color-primary: #c7a96a;
  --color-border-gold: rgba(199, 169, 106, 0.28);
}

/* ✅ 한글 텍스트가 글자 단위로 쪼개져 줄바꿈되는 현상 방지 */
.noWrap {
  white-space: nowrap;      /* 한 줄 유지 */
  word-break: keep-all;     /* 한글 단어 단위 줄바꿈 */
  overflow-wrap: normal;    /* 글자 단위 강제 줄바꿈 방지 */
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
  padding: 54px 0 0;
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

.archiveBand,
.settingsPanel {
  margin: 0 18px;
}

.archiveBand {
  display: grid;
  gap: 12px;
}

.archiveBandHead {
  display: grid;
  gap: 4px;
}

.archiveBandHead .eyebrow {
  color: var(--color-muted);
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

.archiveBandHead h2 {
  margin: 0;
  color: var(--color-ink);
  font-size: 17px;
  font-weight: 900;
}

.archiveBandHead p {
  margin: 0;
  color: var(--color-muted);
  font-size: 13px;
  line-height: 1.5;
}

.compareToggle {
  width: fit-content;
  border-color: var(--color-border-gold);
  background: rgba(240, 192, 96, 0.08);
  color: var(--color-text);
}

.compareHint {
  border: 1px dashed var(--color-border);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
}

.settingsPanel {
  border: 1px solid var(--color-soft-border);
  border-radius: 16px;
  background: var(--color-surface);
  padding: 14px;
}

.placeholderPanel {
  margin: 0 18px;
  border: 1px solid var(--color-soft-border);
  border-radius: 16px;
  background: var(--color-surface);
  padding: 20px;
}

.placeholderPanel .eyebrow {
  color: var(--color-gold);
  font-size: 11px;
  font-weight: 900;
}

.placeholderPanel h2 {
  margin: 6px 0 8px;
  color: var(--color-text);
  letter-spacing: 0;
}

.placeholderPanel p {
  margin: 0;
  color: var(--color-text-dim);
  line-height: 1.5;
}

@media (max-width: 899px) {
  .panel {
    min-height: auto;
  }

  .layout3,
  .layoutCompare,
  .layoutAdd {
    grid-template-columns: 1fr;
  }

  .archiveBand,
  .settingsPanel,
  .placeholderPanel {
    margin: 0 12px;
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
