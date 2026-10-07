import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TIMER_RUNNING: 'sb_timer_running',
  PHASE: 'sb_phase',
  PHASE_START: 'sb_phase_start',
  PAUSED: 'sb_paused',
  PAUSED_REMAINING: 'sb_paused_remaining',
  WORK_MINUTES: 'sb_work_minutes',
  EXERCISE_MINUTES: 'sb_exercise_minutes',
  PRO_EXPIRES_AT: 'pro_expires_at',
  PRO_PERMANENT: 'pro_permanent',
  NOTIF_ENABLED: 'sb_notif_enabled',
  EXERCISE_MENU: 'sb_exercise_menu',
  ROUTINE_ENABLED: 'sb_routine_enabled',
  SCHEDULE_ENABLED: 'sb_schedule_enabled',
  SCHEDULE_START: 'sb_schedule_start',
  SCHEDULE_END: 'sb_schedule_end',
  SCHEDULE_DAYS: 'sb_schedule_days',
  HISTORY: 'sb_history',
  REVIEW_REQUESTED: 'review_requested',
  SESSION_COUNT: 'sb_session_count',
  THEME: 'sb_theme',
  CURRENT_STREAK: 'sb_current_streak',
  LONGEST_STREAK: 'sb_longest_streak',
  LAST_COMPLETED_DATE: 'sb_last_completed_date',
  CUSTOM_ROUTINE: 'sb_custom_routine',
  ROUTINE_SLOT1: 'sb_routine_slot1',
  ROUTINE_SLOT2: 'sb_routine_slot2',
  ROUTINE_SLOT3: 'sb_routine_slot3',
} as const;

export type Phase = 'work' | 'exercise' | 'move_pending';

export async function getTimerState(): Promise<{
  running: boolean;
  phase: Phase;
  phaseStartTimestamp: number;
  paused: boolean;
  pausedRemaining: number;
}> {
  const [running, phase, start, paused, pausedRem] = await Promise.all([
    AsyncStorage.getItem(KEYS.TIMER_RUNNING),
    AsyncStorage.getItem(KEYS.PHASE),
    AsyncStorage.getItem(KEYS.PHASE_START),
    AsyncStorage.getItem(KEYS.PAUSED),
    AsyncStorage.getItem(KEYS.PAUSED_REMAINING),
  ]);
  return {
    running: running === 'true',
    phase: (phase as Phase) || 'work',
    phaseStartTimestamp: start ? Number(start) : 0,
    paused: paused === 'true',
    pausedRemaining: pausedRem ? Number(pausedRem) : 0,
  };
}

export async function saveTimerState(
  running: boolean,
  phase: Phase,
  phaseStartTimestamp: number,
  paused: boolean = false,
  pausedRemaining: number = 0,
): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(KEYS.TIMER_RUNNING, String(running)),
    AsyncStorage.setItem(KEYS.PHASE, phase),
    AsyncStorage.setItem(KEYS.PHASE_START, String(phaseStartTimestamp)),
    AsyncStorage.setItem(KEYS.PAUSED, String(paused)),
    AsyncStorage.setItem(KEYS.PAUSED_REMAINING, String(pausedRemaining)),
  ]);
}

export async function clearTimerState(): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(KEYS.TIMER_RUNNING),
    AsyncStorage.removeItem(KEYS.PHASE),
    AsyncStorage.removeItem(KEYS.PHASE_START),
    AsyncStorage.removeItem(KEYS.PAUSED),
    AsyncStorage.removeItem(KEYS.PAUSED_REMAINING),
  ]);
}

export async function getWorkMinutes(): Promise<number> {
  const val = await AsyncStorage.getItem(KEYS.WORK_MINUTES);
  return val ? Number(val) : 30;
}

export async function setWorkMinutes(minutes: number): Promise<void> {
  await AsyncStorage.setItem(KEYS.WORK_MINUTES, String(minutes));
}

export async function getExerciseMinutes(): Promise<number> {
  const val = await AsyncStorage.getItem(KEYS.EXERCISE_MINUTES);
  return val ? Number(val) : 3;
}

export async function setExerciseMinutes(minutes: number): Promise<void> {
  await AsyncStorage.setItem(KEYS.EXERCISE_MINUTES, String(minutes));
}

export async function getProExpiresAt(): Promise<number> {
  const val = await AsyncStorage.getItem(KEYS.PRO_EXPIRES_AT);
  return val ? Number(val) : 0;
}

export async function startProTrial(startedAt: number = Date.now()): Promise<number> {
  const existing = await AsyncStorage.getItem(KEYS.PRO_EXPIRES_AT);
  if (existing && Number(existing) > 0) return Number(existing);
  const expires = startedAt + 48 * 60 * 60 * 1000;
  await AsyncStorage.setItem(KEYS.PRO_EXPIRES_AT, String(expires));
  return expires;
}

export async function getProPermanent(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.PRO_PERMANENT);
  return val === 'true';
}

export async function setProPermanent(): Promise<void> {
  await AsyncStorage.setItem(KEYS.PRO_PERMANENT, 'true');
}

export type ExerciseMenu = 'walk' | 'stretch' | 'squat' | 'shoulder' | 'random';

export async function getExerciseMenu(): Promise<ExerciseMenu> {
  const val = await AsyncStorage.getItem(KEYS.EXERCISE_MENU);
  return (val as ExerciseMenu) || 'random';
}

export async function setExerciseMenu(menu: ExerciseMenu): Promise<void> {
  await AsyncStorage.setItem(KEYS.EXERCISE_MENU, menu);
}

export async function getRoutineEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.ROUTINE_ENABLED);
  return val === 'true';
}

export async function setRoutineEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.ROUTINE_ENABLED, String(enabled));
}

export type WorkSchedule = {
  enabled: boolean;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  days: boolean[];
};

const DEFAULT_DAYS = [false, true, true, true, true, true, false];

export async function getWorkSchedule(): Promise<WorkSchedule> {
  const [enabled, start, end, daysStr] = await Promise.all([
    AsyncStorage.getItem(KEYS.SCHEDULE_ENABLED),
    AsyncStorage.getItem(KEYS.SCHEDULE_START),
    AsyncStorage.getItem(KEYS.SCHEDULE_END),
    AsyncStorage.getItem(KEYS.SCHEDULE_DAYS),
  ]);
  const [sh, sm] = (start || '9:00').split(':').map(Number);
  const [eh, em] = (end || '17:00').split(':').map(Number);
  let days = DEFAULT_DAYS;
  if (daysStr) {
    try { days = JSON.parse(daysStr); } catch {}
  }
  return {
    enabled: enabled === 'true',
    startHour: sh,
    startMinute: sm,
    endHour: eh,
    endMinute: em,
    days,
  };
}

export async function setWorkSchedule(schedule: WorkSchedule): Promise<void> {
  await Promise.all([
    AsyncStorage.setItem(KEYS.SCHEDULE_ENABLED, String(schedule.enabled)),
    AsyncStorage.setItem(KEYS.SCHEDULE_START, `${schedule.startHour}:${String(schedule.startMinute).padStart(2, '0')}`),
    AsyncStorage.setItem(KEYS.SCHEDULE_END, `${schedule.endHour}:${String(schedule.endMinute).padStart(2, '0')}`),
    AsyncStorage.setItem(KEYS.SCHEDULE_DAYS, JSON.stringify(schedule.days)),
  ]);
}

export function isWithinSchedule(schedule: WorkSchedule): boolean {
  if (!schedule.enabled) return false;
  const now = new Date();
  const dayOfWeek = now.getDay();
  if (!schedule.days[dayOfWeek]) return false;
  const current = now.getHours() * 60 + now.getMinutes();
  const start = schedule.startHour * 60 + schedule.startMinute;
  const end = schedule.endHour * 60 + schedule.endMinute;
  return current >= start && current < end;
}

export async function getNotifEnabled(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.NOTIF_ENABLED);
  return val !== 'false';
}

export async function setNotifEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.NOTIF_ENABLED, String(enabled));
}

export type SessionRecord = {
  timestamp: number;
  workMinutes: number;
  exerciseMinutes: number;
  moveSeconds?: number;
  completed?: boolean;
};

export async function getHistory(): Promise<SessionRecord[]> {
  const val = await AsyncStorage.getItem(KEYS.HISTORY);
  return val ? JSON.parse(val) : [];
}

export async function addSessionRecord(record: SessionRecord): Promise<void> {
  const history = await getHistory();
  history.unshift(record);
  if (history.length > 200) history.length = 200;
  await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
}

export async function getReviewRequested(): Promise<boolean> {
  const val = await AsyncStorage.getItem(KEYS.REVIEW_REQUESTED);
  return val === 'true';
}

export async function setReviewRequested(): Promise<void> {
  await AsyncStorage.setItem(KEYS.REVIEW_REQUESTED, 'true');
}

export async function incrementSessionCount(): Promise<number> {
  const val = await AsyncStorage.getItem(KEYS.SESSION_COUNT);
  const next = (val ? Number(val) : 0) + 1;
  await AsyncStorage.setItem(KEYS.SESSION_COUNT, String(next));
  return next;
}

export async function getOverlaySeen(tab: string): Promise<boolean> {
  const val = await AsyncStorage.getItem(`overlay_seen_${tab}`);
  return val === 'true';
}

export async function setOverlaySeen(tab: string): Promise<void> {
  await AsyncStorage.setItem(`overlay_seen_${tab}`, 'true');
}

// ── Theme ──

export type ThemeMode = 'light' | 'dark' | 'system';

export async function getThemeMode(): Promise<ThemeMode> {
  const val = await AsyncStorage.getItem(KEYS.THEME);
  return (val as ThemeMode) || 'light';
}

export async function setThemeMode(mode: ThemeMode): Promise<void> {
  await AsyncStorage.setItem(KEYS.THEME, mode);
}

// ── Streak ──

export function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export type StreakData = {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string;
};

export async function getStreakData(): Promise<StreakData> {
  const [current, longest, lastDate] = await Promise.all([
    AsyncStorage.getItem(KEYS.CURRENT_STREAK),
    AsyncStorage.getItem(KEYS.LONGEST_STREAK),
    AsyncStorage.getItem(KEYS.LAST_COMPLETED_DATE),
  ]);
  return {
    currentStreak: current ? Number(current) : 0,
    longestStreak: longest ? Number(longest) : 0,
    lastCompletedDate: lastDate || '',
  };
}

export async function updateStreak(): Promise<StreakData> {
  const today = toDateKey(new Date());
  const data = await getStreakData();

  if (data.lastCompletedDate === today) return data;

  const yesterday = toDateKey(new Date(Date.now() - 86400000));
  const newCurrent = data.lastCompletedDate === yesterday ? data.currentStreak + 1 : 1;
  const newLongest = Math.max(data.longestStreak, newCurrent);

  await Promise.all([
    AsyncStorage.setItem(KEYS.CURRENT_STREAK, String(newCurrent)),
    AsyncStorage.setItem(KEYS.LONGEST_STREAK, String(newLongest)),
    AsyncStorage.setItem(KEYS.LAST_COMPLETED_DATE, today),
  ]);

  return {currentStreak: newCurrent, longestStreak: newLongest, lastCompletedDate: today};
}

// ── Custom Routine ──


// ── Move Routine Slots ──

export type SlotExercise = 'walk' | 'stretch' | 'squat' | 'shoulder_neck' | 'calf_raises' | 'march' | 'random';

export async function getRoutineSlots(): Promise<[SlotExercise, SlotExercise, SlotExercise]> {
  const [s1, s2, s3] = await Promise.all([
    AsyncStorage.getItem(KEYS.ROUTINE_SLOT1),
    AsyncStorage.getItem(KEYS.ROUTINE_SLOT2),
    AsyncStorage.getItem(KEYS.ROUTINE_SLOT3),
  ]);
  return [
    (s1 as SlotExercise) || 'walk',
    (s2 as SlotExercise) || 'shoulder_neck',
    (s3 as SlotExercise) || 'stretch',
  ];
}

export async function setRoutineSlot(index: 0 | 1 | 2, exercise: SlotExercise): Promise<void> {
  const key = [KEYS.ROUTINE_SLOT1, KEYS.ROUTINE_SLOT2, KEYS.ROUTINE_SLOT3][index];
  await AsyncStorage.setItem(key, exercise);
}

// ── Data Backup / Import ──

export async function exportAllData(): Promise<string> {
  const keys = Object.values(KEYS);
  const pairs = await AsyncStorage.multiGet(keys);
  const data: Record<string, string> = {};
  for (const [key, value] of pairs) {
    if (value !== null) data[key] = value;
  }
  return JSON.stringify(data);
}

export async function importAllData(json: string): Promise<boolean> {
  const data = JSON.parse(json) as Record<string, string>;
  const validKeys = new Set(Object.values(KEYS));
  const pairs: [string, string][] = Object.entries(data).filter(
    ([key]) => validKeys.has(key as any),
  );
  if (pairs.length === 0) return false;
  await AsyncStorage.multiSet(pairs);
  return true;
}
