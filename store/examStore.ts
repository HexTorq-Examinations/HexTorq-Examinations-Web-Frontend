import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';
import { ExamMapping } from '@/types/admin';
import { acknowledge, classifySyncFailure, enqueueUnique, serverRemainingSeconds } from '@/lib/examSync';

export type ExamStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'TERMINATED';

export interface Violation {
  id: string;
  clientViolationId: string;
  timestamp: number;
  type: 'TAB_SWITCH' | 'BLUR' | 'FULLSCREEN_EXIT' | 'SHORTCUT_USED';
  description: string;
}

export interface ExamHistoryEntry {
  examId: string;
  examTitle?: string;
  examSubject?: string;
  examDuration?: number;
  totalMarks?: number;
  isTestExam?: boolean;
  status: 'COMPLETED' | 'TERMINATED';
  // Score is only ever non-null once the Admin has published the Result for this exam;
  // resultStatus tells the UI which case it is so it never guesses.
  resultStatus: 'Published' | 'Pending Evaluation';
  score: number | null;
  date: number;
}

export interface AttemptQuestion {
  id: string;
  text: string;
  options: string[];
  marks: number;
}
export interface SubmissionReceipt {
  attemptId: string;
  status: 'COMPLETED' | 'TERMINATED';
  submittedAt: string;
  serverConfirmedAt: string;
}

interface ActiveAttemptSnapshot {
  serverNow: string;
  startedAt: string;
  expiresAt: string;
  answers?: Record<string, string>;
  violations?: Violation[];
  maxViolations?: number;
  calculatorEnabled?: boolean;
}

const genId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const normalizeViolation = (violation: Violation): Violation => ({
  ...violation,
  clientViolationId: violation.clientViolationId || violation.id,
});
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryAttempt = 0;
const resetRetry = () => { if (retryTimer) clearTimeout(retryTimer); retryTimer = null; retryAttempt = 0; };
const scheduleRetry = () => {
  if (retryTimer) return;
  const delay = Math.min(30_000, 1000 * (2 ** retryAttempt));
  retryAttempt += 1;
  retryTimer = setTimeout(() => { retryTimer = null; useExamStore.getState().flushPending(); }, delay);
};
const errorMessage = (error: unknown) => error instanceof Error ? error.message : 'Synchronization failed';
const authExpiredMessage = 'Your session expired before the saved exam progress could sync. Sign in again on this device to resume synchronization.';

interface ExamState {
  examId: string | null;
  status: ExamStatus;
  startTime: number | null;
  expiresAt: number | null;
  serverTimeOffsetMs: number;
  endTime: number | null;
  timeRemaining: number; // in seconds
  isPaused: boolean;
  violations: Violation[];
  maxViolations: number;
  calculatorEnabled: boolean;
  answers: Record<string, string>; // questionId -> answer text
  examHistory: ExamHistoryEntry[];
  myMappings: ExamMapping[];

  // Offline-resilience bookkeeping. Everything the student enters is applied to local
  // state immediately; these track what still needs to reach the server. All of this
  // is persisted, so progress survives a reload or a dropped connection.
  unsyncedQuestionIds: string[];
  unsyncedViolationIds: string[];
  pendingSubmitStatus: ExamStatus | null;
  submissionReceipt: SubmissionReceipt | null;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncError: string | null;

  // Actions
  startExam: (examId: string) => Promise<{ durationSeconds: number; questions: AttemptQuestion[] }>;
  hydrateActiveAttempt: (examId: string, snapshot: ActiveAttemptSnapshot) => void;
  refreshAttemptStatus: () => Promise<void>;
  endExam: (status?: ExamStatus) => void;
  setIsPaused: (paused: boolean) => void;
  tickTimer: () => void;
  recordViolation: (type: Violation['type'], description: string) => void;
  saveAnswer: (questionId: string, answer: string) => void;
  clearSession: () => void;
  fetchExamHistory: () => Promise<void>;
  fetchMyMappings: () => Promise<void>;
  setOnlineStatus: (online: boolean) => void;
  flushPending: () => Promise<void>;
}

export const useExamStore = create<ExamState>()(
  persist(
    (set, get) => ({
      examId: null,
      status: 'NOT_STARTED',
      startTime: null,
      expiresAt: null,
      serverTimeOffsetMs: 0,
      endTime: null,
      timeRemaining: 0,
      isPaused: false,
      violations: [],
      maxViolations: 5, // 5 warnings allowed; the 6th auto-terminates
      calculatorEnabled: false,
      answers: {},
      examHistory: [],
      myMappings: [],

      unsyncedQuestionIds: [],
      unsyncedViolationIds: [],
      pendingSubmitStatus: null,
      submissionReceipt: null,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isSyncing: false,
      lastSyncError: null,

      startExam: async (examId: string) => {
        const { data } = await api.post(`/exams/${examId}/start`);
        const serverTimeOffsetMs = new Date(data.serverNow).getTime() - Date.now();
        const expiresAt = new Date(data.expiresAt).getTime();
        set({
          examId,
          status: 'IN_PROGRESS',
          startTime: new Date(data.startedAt).getTime(),
          expiresAt,
          serverTimeOffsetMs,
          timeRemaining: serverRemainingSeconds(expiresAt, serverTimeOffsetMs),
          violations: ((data.violations || []) as Violation[]).map(normalizeViolation),
          maxViolations: data.maxViolations || 5,
          calculatorEnabled: !!data.calculatorEnabled,
          answers: data.answers || {},
          isPaused: false,
          unsyncedQuestionIds: [],
          unsyncedViolationIds: [],
          pendingSubmitStatus: null,
          submissionReceipt: null,
          lastSyncError: null,
        });
        return {
          durationSeconds: data.durationSeconds,
          questions: Array.isArray(data.questions) ? data.questions : [],
        };
      },

      hydrateActiveAttempt: (examId: string, snapshot: ActiveAttemptSnapshot) => {
        if (!snapshot.serverNow || !snapshot.startedAt || !snapshot.expiresAt) return;
        const serverTimeOffsetMs = new Date(snapshot.serverNow).getTime() - Date.now();
        const expiresAt = new Date(snapshot.expiresAt).getTime();
        set((state) => {
          const keepLocalUnsynced = state.examId === examId && state.unsyncedQuestionIds.length > 0;
          const unsyncedAnswers = keepLocalUnsynced
            ? Object.fromEntries(state.unsyncedQuestionIds.map((questionId) => [questionId, state.answers[questionId]]).filter(([, answer]) => answer))
            : {};
          return {
            examId,
            status: 'IN_PROGRESS',
            startTime: new Date(snapshot.startedAt).getTime(),
            expiresAt,
            serverTimeOffsetMs,
            timeRemaining: serverRemainingSeconds(expiresAt, serverTimeOffsetMs),
            violations: (snapshot.violations || []).map(normalizeViolation),
            maxViolations: snapshot.maxViolations || 5,
            calculatorEnabled: !!snapshot.calculatorEnabled,
            answers: { ...(snapshot.answers || {}), ...unsyncedAnswers },
            isPaused: false,
            pendingSubmitStatus: null,
            submissionReceipt: null,
            lastSyncError: null,
          };
        });
      },

      refreshAttemptStatus: async () => {
        const { examId } = get();
        if (!examId) return;
        const { data } = await api.get(`/exams/${examId}/my-attempt`, { silent: true });
        const serverTimeOffsetMs = new Date(data.serverNow).getTime() - Date.now();

        if (!data.hasActiveAttempt && (data.status === 'COMPLETED' || data.status === 'TERMINATED')) {
          set({
            status: data.status,
            timeRemaining: 0,
            endTime: Date.now() + serverTimeOffsetMs,
            pendingSubmitStatus: null,
            unsyncedQuestionIds: [],
            unsyncedViolationIds: [],
            serverTimeOffsetMs,
            submissionReceipt: data.attemptId ? { attemptId: data.attemptId, status: data.status, submittedAt: data.submittedAt, serverConfirmedAt: data.serverConfirmedAt } : null,
            lastSyncError: null,
          });
          return;
        }

        if (data.hasActiveAttempt && data.expiresAt) {
          const expiresAt = new Date(data.expiresAt).getTime();
          set({
            expiresAt,
            serverTimeOffsetMs,
            timeRemaining: serverRemainingSeconds(expiresAt, serverTimeOffsetMs),
          });
        }
      },

      // Optimistic: flips local status immediately so the UI (and the student) treat the
      // exam as finished right away, even with no connection. The actual submit is queued
      // and retried via flushPending() until the server confirms it — no answer is lost and
      // no window is left open for the student to keep answering past the deadline.
      endExam: (status: ExamStatus = 'COMPLETED') => {
        const { examId } = get();
        if (!examId) {
          set({ status, endTime: Date.now() });
          return;
        }
        set({ status, endTime: Date.now(), pendingSubmitStatus: status });
        get().flushPending();
      },

      setIsPaused: (paused: boolean) => {
        set({ isPaused: paused });
      },

      tickTimer: () => {
        const { status, expiresAt, serverTimeOffsetMs } = get();
        if (status !== 'IN_PROGRESS' || !expiresAt) return;

        const remaining = serverRemainingSeconds(expiresAt, serverTimeOffsetMs);
        set({ timeRemaining: remaining });
        if (remaining === 0) get().endExam('COMPLETED');
      },

      // Violations are decided locally (so a lost connection can't let a student dodge
      // the warning/termination policy by being offline) and synced in the background.
      recordViolation: (type: Violation['type'], description: string) => {
        const { status, violations, maxViolations } = get();
        if (status !== 'IN_PROGRESS') return;

        const violation: Violation = {
          id: genId(),
          clientViolationId: genId(),
          timestamp: Date.now(),
          type,
          description,
        };
        const updatedViolations = [...violations, violation];
        const shouldTerminate = updatedViolations.length >= maxViolations;

        set((state) => ({
          violations: updatedViolations,
          unsyncedViolationIds: enqueueUnique(state.unsyncedViolationIds, violation.clientViolationId),
          ...(shouldTerminate ? { status: 'TERMINATED', endTime: Date.now(), pendingSubmitStatus: 'TERMINATED' } : {}),
        }));

        get().flushPending();
      },

      // Local-first: the answer is applied to state immediately regardless of connectivity;
      // syncing to the server happens in the background and is retried until confirmed.
      saveAnswer: (questionId: string, answer: string) => {
        set((state) => ({
          answers: { ...state.answers, [questionId]: answer },
          unsyncedQuestionIds: enqueueUnique(state.unsyncedQuestionIds, questionId),
        }));
        get().flushPending();
      },

      setOnlineStatus: (online: boolean) => {
        set({ isOnline: online });
        if (online) get().flushPending();
      },

      // Drains whatever hasn't reached the server yet: answers, then violations, then a
      // queued submit (only once every answer/violation has landed, so the score the
      // server computes reflects everything the student actually did). Safe to call
      // repeatedly/concurrently — network calls are idempotent on the backend, and a
      // single in-flight flush is enforced via isSyncing.
      flushPending: async () => {
        const { examId, isSyncing } = get();
        if (!examId || isSyncing) return;
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          set({ isOnline: false });
          return;
        }

        set({ isSyncing: true });
        let encounteredPermanentFailure = false;
        try {
          // 1) Answers
          for (const questionId of [...get().unsyncedQuestionIds]) {
            const answer = get().answers[questionId];
            try {
              await api.post(`/exams/${examId}/answer`, { questionId, answer }, { silent: true });
              set((state) => ({
                unsyncedQuestionIds: acknowledge(state.unsyncedQuestionIds, questionId),
              }));
              set({ isOnline: true });
            } catch (error) {
              const kind = classifySyncFailure(error);
              if (kind === 'auth') {
                set({ isOnline: true, lastSyncError: authExpiredMessage });
                return;
              }
              if (kind === 'network' || kind === 'retryable') {
                set({ isOnline: kind !== 'network', lastSyncError: kind === 'retryable' ? `Server temporarily unavailable: ${errorMessage(error)}` : null });
                scheduleRetry();
                return;
              }
              set((state) => ({ unsyncedQuestionIds: acknowledge(state.unsyncedQuestionIds, questionId), lastSyncError: errorMessage(error), isOnline: true }));
              encounteredPermanentFailure = true;
              if (kind === 'reconcile') { await get().refreshAttemptStatus().catch(() => {}); return; }
            }
          }

          // 2) Violations, oldest first, so server-side chronology matches what happened
          for (const clientViolationId of [...get().unsyncedViolationIds]) {
            const violation = get().violations.find((v) => v.clientViolationId === clientViolationId);
            if (!violation) continue;
            try {
              const { data } = await api.post(`/exams/${examId}/violation`, {
                type: violation.type,
                description: violation.description,
                clientViolationId,
              }, { silent: true });
              set((state) => ({
                unsyncedViolationIds: acknowledge(state.unsyncedViolationIds, clientViolationId),
                ...(data.status === 'TERMINATED' ? { status: 'TERMINATED' as ExamStatus } : {}),
              }));
              set({ isOnline: true });
            } catch (error) {
              const kind = classifySyncFailure(error);
              if (kind === 'auth') {
                set({ isOnline: true, lastSyncError: authExpiredMessage });
                return;
              }
              if (kind === 'network' || kind === 'retryable') {
                set({ isOnline: kind !== 'network', lastSyncError: kind === 'retryable' ? `Server temporarily unavailable: ${errorMessage(error)}` : null });
                scheduleRetry();
                return;
              }
              set((state) => ({ unsyncedViolationIds: acknowledge(state.unsyncedViolationIds, clientViolationId), lastSyncError: errorMessage(error), isOnline: true }));
              encounteredPermanentFailure = true;
              if (kind === 'reconcile') { await get().refreshAttemptStatus().catch(() => {}); return; }
            }
          }

          // 3) Submit, only once everything above has synced
          const { pendingSubmitStatus, unsyncedQuestionIds, unsyncedViolationIds } = get();
          if (pendingSubmitStatus && unsyncedQuestionIds.length === 0 && unsyncedViolationIds.length === 0) {
            try {
              const { data } = await api.post(`/exams/${examId}/submit`, { status: pendingSubmitStatus });
              set({ pendingSubmitStatus: null, isOnline: true, submissionReceipt: { attemptId: data.attemptId, status: data.status, submittedAt: data.submittedAt, serverConfirmedAt: data.serverConfirmedAt } });
              await get().fetchExamHistory();
            } catch (error) {
              const kind = classifySyncFailure(error);
              if (kind === 'auth') {
                set({ isOnline: true, lastSyncError: authExpiredMessage });
                return;
              }
              if (kind === 'network' || kind === 'retryable') {
                set({ isOnline: kind !== 'network', lastSyncError: kind === 'retryable' ? `Server temporarily unavailable: ${errorMessage(error)}` : null });
                scheduleRetry();
              } else {
                set({ isOnline: true, lastSyncError: errorMessage(error) });
                encounteredPermanentFailure = true;
                if (kind === 'reconcile') await get().refreshAttemptStatus().catch(() => {});
              }
            }
          }
          const remaining = get();
          if (!encounteredPermanentFailure && remaining.unsyncedQuestionIds.length === 0 && remaining.unsyncedViolationIds.length === 0 && !remaining.pendingSubmitStatus) {
            resetRetry();
            set({ lastSyncError: null });
          }
        } finally {
          set({ isSyncing: false });
        }
      },

      fetchExamHistory: async () => {
        const { data } = await api.get('/exams/history/me');
        set({ examHistory: data });
      },

      fetchMyMappings: async () => {
        const { data } = await api.get('/exam-mappings/mine');
        set({ myMappings: data });
      },

      clearSession: () => {
        resetRetry();
        set({
          status: 'NOT_STARTED',
          examId: null,
          startTime: null,
          expiresAt: null,
          serverTimeOffsetMs: 0,
          endTime: null,
          timeRemaining: 0,
          isPaused: false,
          violations: [],
          answers: {},
          unsyncedQuestionIds: [],
          unsyncedViolationIds: [],
          pendingSubmitStatus: null,
          submissionReceipt: null,
          maxViolations: 5,
          calculatorEnabled: false,
          lastSyncError: null,
        });
      }
    }),
    {
      name: 'secure-exam-storage',
      partialize: (state) => ({
        examId: state.examId,
        status: state.status,
        startTime: state.startTime,
        expiresAt: state.expiresAt,
        serverTimeOffsetMs: state.serverTimeOffsetMs,
        endTime: state.endTime,
        timeRemaining: state.timeRemaining,
        isPaused: state.isPaused,
        violations: state.violations,
        answers: state.answers,
        unsyncedQuestionIds: state.unsyncedQuestionIds,
        unsyncedViolationIds: state.unsyncedViolationIds,
        pendingSubmitStatus: state.pendingSubmitStatus,
        submissionReceipt: state.submissionReceipt,
        maxViolations: state.maxViolations,
        calculatorEnabled: state.calculatorEnabled,
        lastSyncError: state.lastSyncError,
      }),
    }
  )
);
