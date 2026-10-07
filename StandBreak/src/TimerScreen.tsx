import React, {useState, useEffect, useCallback, useRef, useMemo} from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  Switch,
  TextInput,
  Alert,
  Share,
  AppState,
  Animated,
  Easing,
  Modal,
  StatusBar,
  PermissionsAndroid,
  Platform,
  useColorScheme,
  type AppStateStatus,
} from 'react-native';

const APP_ICON = require('./assets/app-icon.png');
import {
  getTimerState,
  saveTimerState,
  clearTimerState,
  getWorkMinutes,
  setWorkMinutes as saveWorkMinutes,
  getExerciseMinutes,
  setExerciseMinutes as saveExerciseMinutes,
  getProExpiresAt,
  startProTrial,
  getProPermanent,
  setProPermanent,
  getNotifEnabled,
  setNotifEnabled as saveNotifEnabled,
  getHistory,
  addSessionRecord,
  getReviewRequested,
  setReviewRequested,
  incrementSessionCount,
  getOverlaySeen,
  setOverlaySeen,
  getExerciseMenu,
  setExerciseMenu as saveExerciseMenu,
  getRoutineEnabled,
  setRoutineEnabled as saveRoutineEnabled,
  getWorkSchedule,
  setWorkSchedule as saveWorkSchedule,
  isWithinSchedule,
  getThemeMode,
  setThemeMode as saveThemeMode,
  getStreakData,
  updateStreak,
  getRoutineSlots,
  setRoutineSlot as saveRoutineSlot,
  exportAllData,
  importAllData,
  toDateKey,
  type Phase,
  type ExerciseMenu,
  type WorkSchedule,
  type SessionRecord,
  type ThemeMode,
  type StreakData,
  type SlotExercise,
} from './storage';
import {scheduleBreakNotification, cancelNotification, openNotificationSettings} from './notifications';
import {t, initLocale, changeLocale, getCurrentLocale, LANGUAGE_NAMES, AVAILABLE_LANGUAGES} from './i18n';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import {initIAP, endIAP, buyPro, listenToPurchases} from './purchase';
import {getColors, createStyles, type ColorSet} from './styles';
import {HomeLightColors, HomeDarkColors, createHomeStyles} from './homeStyles';

function getExerciseLabels(): Record<ExerciseMenu, string> {
  return {
    walk: t('ex_walk'),
    stretch: t('ex_stretch_back'),
    squat: t('ex_squats'),
    shoulder: t('ex_shoulder_rolls'),
    random: '',
  };
}

function getRandomExercises(): string[] {
  return [
    t('ex_walk'),
    t('ex_shoulder_rolls'),
    t('ex_squats'),
    t('ex_calf_raises'),
    t('ex_stretch_back'),
  ];
}

function getMenuOptions(): {key: ExerciseMenu; label: string}[] {
  return [
    {key: 'walk', label: t('ex_walk_short')},
    {key: 'stretch', label: t('ex_stretch_short')},
    {key: 'squat', label: t('ex_squat_short')},
    {key: 'shoulder', label: t('ex_shoulder_neck')},
    {key: 'random', label: t('ex_random')},
  ];
}

const SLOT_EXERCISES: SlotExercise[] = ['walk', 'stretch', 'squat', 'shoulder_neck', 'calf_raises', 'march', 'random'];

function getSlotExerciseLabel(ex: SlotExercise): string {
  const map: Record<SlotExercise, string> = {
    walk: t('ex_walk_short'),
    stretch: t('ex_stretch_short'),
    squat: t('ex_squat_short'),
    shoulder_neck: t('ex_shoulder_neck'),
    calf_raises: t('ex_calf_raises_short'),
    march: t('ex_march_short'),
    random: t('ex_random'),
  };
  return map[ex];
}

function resolveSlots(slots: [SlotExercise, SlotExercise, SlotExercise]): [SlotExercise, SlotExercise, SlotExercise] {
  const nonRandom: SlotExercise[] = SLOT_EXERCISES.filter(e => e !== 'random');
  const resolved: SlotExercise[] = [];
  const used = new Set<SlotExercise>();
  for (const s of slots) {
    if (s !== 'random') { resolved.push(s); used.add(s); }
    else resolved.push('random');
  }
  for (let i = 0; i < resolved.length; i++) {
    if (resolved[i] !== 'random') continue;
    const available = nonRandom.filter(e => !used.has(e));
    const pick = available.length > 0 ? available[Math.floor(Math.random() * available.length)] : nonRandom[Math.floor(Math.random() * nonRandom.length)];
    resolved[i] = pick;
    used.add(pick);
  }
  return resolved as [SlotExercise, SlotExercise, SlotExercise];
}

function getRoutineInfo(elapsedMs: number, totalSec: number, labels: string[]): {label: string; nextLabel: string | null; remainingSec: number; stepIndex: number} {
  const sec = Math.floor(elapsedMs / 1000);
  const perSlot = Math.floor(totalSec / 3);
  const durations = [perSlot, perSlot, totalSec - perSlot * 2];
  let cumulative = 0;
  for (let i = 0; i < 3; i++) {
    cumulative += durations[i];
    if (sec < cumulative) {
      return {label: labels[i], nextLabel: i < 2 ? labels[i + 1] : null, remainingSec: cumulative - sec, stepIndex: i};
    }
  }
  return {label: labels[2], nextLabel: null, remainingSec: 0, stepIndex: 2};
}

function pickExerciseText(menu: ExerciseMenu): string {
  if (menu === 'random') {
    const randomExercises = getRandomExercises();
    return randomExercises[Math.floor(Math.random() * randomExercises.length)];
  }
  return getExerciseLabels()[menu];
}

function PulsingLabel({text, style}: {text: string; style: object}) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {toValue: 0.3, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
        Animated.timing(opacity, {toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.Text style={[style, {opacity}]}>{text}</Animated.Text>;
}

type Tab = 'timer' | 'stats' | 'settings';

const WORK_PRESETS = [20, 25, 30, 45, 60, 90];
const MOVE_PRESETS = [1, 2, 3, 5, 10];

function TabBarIcon({name, color, size}: {name: Tab; color: string; size: number}) {
  if (name === 'timer') {
    return (
      <View style={{width: size, height: size, alignItems: 'center', justifyContent: 'center'}}>
        <View style={{
          width: 0, height: 0,
          borderLeftWidth: size * 0.45, borderRightWidth: size * 0.45,
          borderBottomWidth: size * 0.4,
          borderLeftColor: 'transparent', borderRightColor: 'transparent',
          borderBottomColor: color,
        }} />
        <View style={{width: size * 0.55, height: size * 0.35, backgroundColor: color, marginTop: -1}} />
      </View>
    );
  }
  if (name === 'stats') {
    return (
      <View style={{width: size, height: size, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 2}}>
        <View style={{width: size * 0.2, height: size * 0.4, backgroundColor: color, borderRadius: 1}} />
        <View style={{width: size * 0.2, height: size * 0.7, backgroundColor: color, borderRadius: 1}} />
        <View style={{width: size * 0.2, height: size * 0.55, backgroundColor: color, borderRadius: 1}} />
      </View>
    );
  }
  return (
    <View style={{width: size, height: size, justifyContent: 'center', alignItems: 'center', gap: 3}}>
      <View style={{width: size * 0.7, height: 2, backgroundColor: color, borderRadius: 1}} />
      <View style={{width: size * 0.7, height: 2, backgroundColor: color, borderRadius: 1}} />
      <View style={{width: size * 0.7, height: 2, backgroundColor: color, borderRadius: 1}} />
    </View>
  );
}

export default function TimerScreen() {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [pausedRemaining, setPausedRemaining] = useState(0);
  // A phase and its start time must change together. An intermediate render
  // with 'exercise' and the old work timestamp would immediately finish Move.
  const [{phase, phaseStart}, setTimerPhase] = useState<{phase: Phase; phaseStart: number}>({phase: 'work', phaseStart: 0});
  const [now, setNow] = useState(Date.now());
  const [loaded, setLoaded] = useState(false);
  const [exerciseText, setExerciseText] = useState('');
  const [exerciseMenu, setExerciseMenuState] = useState<ExerciseMenu>('random');
  const [routineEnabled, setRoutineEnabledState] = useState(false);
  const [schedule, setScheduleState] = useState<WorkSchedule>({enabled: false, startHour: 9, startMinute: 0, endHour: 17, endMinute: 0, days: [false, true, true, true, true, true, false]});
  const [scheduleStartStr, setScheduleStartStr] = useState('09:00');
  const [scheduleEndStr, setScheduleEndStr] = useState('17:00');
  const [tab, setTab] = useState<Tab>('timer');

  const [workMins, setWorkMins] = useState(30);
  const [exerciseMins, setExerciseMins] = useState(3);
  const [workStr, setWorkStr] = useState('30');
  const [exerciseStr, setExerciseStr] = useState('3');

  const [proExpiresAt, setProExpiresAt] = useState(0);
  const [proPermanent, setProPermanentState] = useState(false);

  const [notifEnabled, setNotifEnabledState] = useState(true);

  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [selectedBar, setSelectedBar] = useState<number | null>(null);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showHowTo, setShowHowTo] = useState(false);
  const [showFreeVsPro, setShowFreeVsPro] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [langKey, setLangKey] = useState(0);

  // New state
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [todayBreaks, setTodayBreaks] = useState(0);
  const [todayMoveMinutes, setTodayMoveMinutes] = useState(0);
  const [streak, setStreak] = useState<StreakData>({currentStreak: 0, longestStreak: 0, lastCompletedDate: ''});
  const [routineSlots, setRoutineSlots] = useState<[SlotExercise, SlotExercise, SlotExercise]>(['walk', 'shoulder_neck', 'stretch']);
  const [showRoutineMenu, setShowRoutineMenu] = useState(false);
  const [slotPickerIndex, setSlotPickerIndex] = useState<0 | 1 | 2 | null>(null);
  const [resolvedLabels, setResolvedLabels] = useState<string[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [overlayTab, setOverlayTab] = useState<'timer' | 'stats' | 'settings' | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Theme
  const systemScheme = useColorScheme();
  const resolvedTheme: 'light' | 'dark' = themeMode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themeMode;
  const colors = useMemo(() => getColors(resolvedTheme), [resolvedTheme]);
  const s = useMemo(() => createStyles(colors), [colors]);
  const homeColors = resolvedTheme === 'light' ? HomeLightColors : HomeDarkColors;
  const h = useMemo(() => createHomeStyles(homeColors), [homeColors]);

  const routineTotalSec = exerciseMins * 60;

  const refreshTodayStats = useCallback(async () => {
    const h = await getHistory();
    const today = toDateKey(new Date());
    let breaks = 0;
    let moveSec = 0;
    for (const r of h) {
      if (toDateKey(new Date(r.timestamp)) === today) {
        if (r.completed !== false) breaks++;
        moveSec += r.moveSeconds != null ? r.moveSeconds : r.exerciseMinutes * 60;
      }
    }
    setTodayBreaks(breaks);
    setTodayMoveMinutes(Math.floor(moveSec / 60));
  }, []);

  useEffect(() => {
    (async () => {
      await initLocale();
      setLangKey(k => k + 1);
      const [timer, wm, em, menu, routine, sched, proExp, proPerm, notifOn, theme, streakData, slots] = await Promise.all([
        getTimerState(),
        getWorkMinutes(),
        getExerciseMinutes(),
        getExerciseMenu(),
        getRoutineEnabled(),
        getWorkSchedule(),
        getProExpiresAt(),
        getProPermanent(),
        getNotifEnabled(),
        getThemeMode(),
        getStreakData(),
        getRoutineSlots(),
      ]);
      if (timer.running) {
        let loadedPhase = timer.phase;
        let loadedStart = timer.phaseStartTimestamp;
        if (loadedPhase === 'move_pending') {
          loadedPhase = 'exercise';
          loadedStart = Date.now();
          saveTimerState(true, 'exercise', loadedStart);
        }
        setRunning(true);
        setTimerPhase({phase: loadedPhase, phaseStart: loadedStart});
        setPaused(timer.paused);
        setPausedRemaining(timer.pausedRemaining);
        if (loadedPhase === 'exercise') setExerciseText(pickExerciseText(menu));
      }
      setWorkMins(wm);
      setExerciseMins(em);
      setWorkStr(String(wm));
      setExerciseStr(String(em));
      setExerciseMenuState(menu);
      setRoutineEnabledState(routine);
      setScheduleState(sched);
      setScheduleStartStr(`${String(sched.startHour).padStart(2, '0')}:${String(sched.startMinute).padStart(2, '0')}`);
      setScheduleEndStr(`${String(sched.endHour).padStart(2, '0')}:${String(sched.endMinute).padStart(2, '0')}`);
      setThemeModeState(theme);
      setStreak(streakData);
      setRoutineSlots(slots);
      if (timer.running && timer.phase === 'exercise' && routine && (proPerm || proExp > Date.now())) {
        const resolved = resolveSlots(slots);
        setResolvedLabels(resolved.map(e => getSlotExerciseLabel(e)));
      }

      setNotifEnabledState(notifOn);
      const isProNow = proPerm || proExp > Date.now();
      if (!timer.running && isProNow && isWithinSchedule(sched)) {
        const startTs = Date.now();
        setRunning(true);
        setTimerPhase({phase: 'work', phaseStart: startTs});
        setNow(startTs);
        await saveTimerState(true, 'work', startTs);
        if (notifOn) {
          await scheduleBreakNotification(startTs + wm * 60 * 1000, t('notif_body'));
        }
      }
      setProExpiresAt(proExp);
      setProPermanentState(proPerm);

      const timerSeen = await getOverlaySeen('timer');
      if (!timerSeen) setOverlayTab('timer');

      setLoaded(true);

      if (Platform.OS === 'android' && Platform.Version >= 33) {
        await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
      }

      try {
        await initIAP();
        listenToPurchases(async () => {
          await setProPermanent();
          setProPermanentState(true);
        });
      } catch {}
    })();
    return () => { endIAP(); };
  }, []);

  // Load today stats after init
  useEffect(() => {
    if (loaded) refreshTodayStats();
  }, [loaded, refreshTodayStats]);

  const isPro = proPermanent || proExpiresAt > Date.now();
  const trialActive = !proPermanent && proExpiresAt > Date.now();
  const trialHours = Math.max(0, Math.ceil((proExpiresAt - Date.now()) / 3600000));

  // Trial time keeps passing while the work timer is stopped or paused.
  useEffect(() => {
    const remainingMs = proExpiresAt - Date.now();
    if (proPermanent || remainingMs <= 0) return;
    const refresh = () => setNow(Date.now());
    const minuteTick = setInterval(refresh, 60_000);
    const expiryTick = setTimeout(refresh, remainingMs);
    return () => {
      clearInterval(minuteTick);
      clearTimeout(expiryTick);
    };
  }, [proExpiresAt, proPermanent]);
  const workDurationMs = workMins * 60 * 1000;
  const effectiveExerciseDurationMs = exerciseMins * 60 * 1000;
  const phaseDuration = phase === 'work' ? workDurationMs : phase === 'exercise' ? effectiveExerciseDurationMs : 0;
  const elapsed = running && !paused ? now - phaseStart : 0;
  const remaining = paused ? pausedRemaining : Math.max(0, phaseDuration - elapsed);

  useEffect(() => {
    if (!running || paused) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }
    setNow(Date.now());
    intervalRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [running, paused]);

  useEffect(() => {
    const handler = (state: AppStateStatus) => {
      if (state === 'active') {
        setNow(Date.now());
        refreshTodayStats();
        getStreakData().then(d => setStreak(d));
        if (!running && (proPermanent || proExpiresAt > Date.now()) && isWithinSchedule(schedule)) {
          const startTs = Date.now();
          setRunning(true);
          setTimerPhase({phase: 'work', phaseStart: startTs});
          setNow(startTs);
          saveTimerState(true, 'work', startTs);
          if (notifEnabled) {
            scheduleBreakNotification(startTs + workDurationMs, t('notif_body'));
          }
        }
      }
    };
    const sub = AppState.addEventListener('change', handler);
    return () => sub.remove();
  }, [running, schedule, proPermanent, proExpiresAt, workDurationMs, notifEnabled, refreshTodayStats]);

  useEffect(() => {
    if (!running || !loaded || paused) return;
    if (remaining > 0) return;

    if (phase === 'work') {
      const ts = Date.now();
      setTimerPhase({phase: 'exercise', phaseStart: ts});
      setNow(ts);
      setExerciseText(pickExerciseText(exerciseMenu));
      if (routineEnabled && isPro) {
        const resolved = resolveSlots(routineSlots);
        setResolvedLabels(resolved.map(e => getSlotExerciseLabel(e)));
      }
      saveTimerState(true, 'exercise', ts);
    } else if (phase === 'exercise') {
      const moveSec = exerciseMins * 60;
      addSessionRecord({timestamp: Date.now(), workMinutes: workMins, exerciseMinutes: exerciseMins, moveSeconds: moveSec, completed: true});
      updateStreak().then(d => setStreak(d));
      refreshTodayStats();

      const nextStart = Date.now();
      setTimerPhase({phase: 'work', phaseStart: nextStart});
      setNow(nextStart);
      saveTimerState(true, 'work', nextStart);
      if (notifEnabled) {
        scheduleBreakNotification(nextStart + workDurationMs, t('notif_body'));
      }
    }
  }, [running, loaded, paused, remaining, phase, workDurationMs, notifEnabled, workMins, exerciseMins, routineEnabled, isPro, refreshTodayStats, exerciseMenu, routineSlots]);

  const handleStart = useCallback(async () => {
    const startTs = Date.now();
    setRunning(true);
    setPaused(false);
    setPausedRemaining(0);
    setTimerPhase({phase: 'work', phaseStart: startTs});
    setNow(startTs);
    if (!proPermanent) {
      setProExpiresAt(await startProTrial(startTs));
    }
    await saveTimerState(true, 'work', startTs);
    if (notifEnabled) {
      await scheduleBreakNotification(startTs + workDurationMs, t('notif_body'));
    }
  }, [workDurationMs, notifEnabled, proPermanent]);

  const handleStop = useCallback(async () => {
    if (phase === 'exercise') {
      const elapsedSec = Math.floor((Date.now() - phaseStart) / 1000);
      await addSessionRecord({timestamp: Date.now(), workMinutes: workMins, exerciseMinutes: exerciseMins, moveSeconds: elapsedSec, completed: false});
      refreshTodayStats();
    }
    setRunning(false);
    setPaused(false);
    setPausedRemaining(0);
    setTimerPhase({phase: 'work', phaseStart: 0});
    await clearTimerState();
    await cancelNotification();
  }, [phase, phaseStart, workMins, exerciseMins, refreshTodayStats]);

  const handlePause = useCallback(async () => {
    const rem = Math.max(0, phaseDuration - (Date.now() - phaseStart));
    setPaused(true);
    setPausedRemaining(rem);
    await saveTimerState(true, phase, phaseStart, true, rem);
    await cancelNotification();
  }, [phaseDuration, phaseStart, phase]);

  const handleResume = useCallback(async () => {
    const resumeStart = Date.now() - (phaseDuration - pausedRemaining);
    setPaused(false);
    setTimerPhase({phase, phaseStart: resumeStart});
    setNow(Date.now());
    setPausedRemaining(0);
    await saveTimerState(true, phase, resumeStart);
    if (phase === 'work' && notifEnabled) {
      await scheduleBreakNotification(Date.now() + pausedRemaining, t('notif_body'));
    }
  }, [phaseDuration, pausedRemaining, phase, notifEnabled]);

  const handleSkip = useCallback(async () => {
    const nextStart = Date.now();
    setPaused(false);
    setPausedRemaining(0);
    await cancelNotification();

    if (phase === 'work') {
      setTimerPhase({phase: 'exercise', phaseStart: nextStart});
      setNow(nextStart);
      setExerciseText(pickExerciseText(exerciseMenu));
      if (routineEnabled && isPro) {
        const resolved = resolveSlots(routineSlots);
        setResolvedLabels(resolved.map(e => getSlotExerciseLabel(e)));
      }
      await saveTimerState(true, 'exercise', nextStart);
    } else {
      setTimerPhase({phase: 'work', phaseStart: nextStart});
      setNow(nextStart);
      await saveTimerState(true, 'work', nextStart);
      if (notifEnabled) {
        await scheduleBreakNotification(nextStart + workDurationMs, t('notif_body'));
      }
    }
  }, [phase, workDurationMs, notifEnabled, exerciseMenu, routineEnabled, isPro, routineSlots]);

  const loadHistory = useCallback(async () => {
    const h = await getHistory();
    setHistory(h);
  }, []);

  useEffect(() => {
    if (tab === 'stats') loadHistory();
    setSelectedBar(null);
  }, [tab, loadHistory]);

  const handleWorkPreset = useCallback(async (min: number) => {
    setWorkMins(min);
    setWorkStr(String(min));
    await saveWorkMinutes(min);
  }, []);

  const handleMovePreset = useCallback(async (min: number) => {
    setExerciseMins(min);
    setExerciseStr(String(min));
    await saveExerciseMinutes(min);
  }, []);

  const handleMenuChange = useCallback(async (menu: ExerciseMenu) => {
    setExerciseMenuState(menu);
    await saveExerciseMenu(menu);
  }, []);

  const handleRoutineToggle = useCallback(async (val: boolean) => {
    setRoutineEnabledState(val);
    await saveRoutineEnabled(val);
  }, []);

  const handleThemeChange = useCallback(async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await saveThemeMode(mode);
  }, []);

  const SCHEDULE_PRESETS = [
    {label: '8:00-17:00', sh: 8, sm: 0, eh: 17, em: 0},
    {label: '9:00-17:00', sh: 9, sm: 0, eh: 17, em: 0},
    {label: '9:00-18:00', sh: 9, sm: 0, eh: 18, em: 0},
    {label: '10:00-19:00', sh: 10, sm: 0, eh: 19, em: 0},
  ];

  const handleScheduleToggle = useCallback(async (val: boolean) => {
    const updated = {...schedule, enabled: val};
    setScheduleState(updated);
    await saveWorkSchedule(updated);
  }, [schedule]);

  const handleSchedulePreset = useCallback(async (p: typeof SCHEDULE_PRESETS[0]) => {
    const updated: WorkSchedule = {enabled: true, startHour: p.sh, startMinute: p.sm, endHour: p.eh, endMinute: p.em, days: schedule.days};
    setScheduleState(updated);
    setScheduleStartStr(`${String(p.sh).padStart(2, '0')}:${String(p.sm).padStart(2, '0')}`);
    setScheduleEndStr(`${String(p.eh).padStart(2, '0')}:${String(p.em).padStart(2, '0')}`);
    await saveWorkSchedule(updated);
  }, []);

  const formatTimeDigits = (digits: string): string => {
    const d = digits.replace(/\D/g, '').slice(0, 4);
    if (d.length <= 2) return d;
    return d.slice(0, 2) + ':' + d.slice(2);
  };

  const parseTimeStr = (str: string): {h: number; m: number} | null => {
    const digits = str.replace(/\D/g, '');
    if (digits.length !== 4) return null;
    const h = Number(digits.slice(0, 2));
    const m = Number(digits.slice(2, 4));
    if (h > 23 || m > 59) return null;
    return {h, m};
  };

  const handleScheduleDayToggle = useCallback(async (dayIndex: number) => {
    const newDays = [...schedule.days];
    newDays[dayIndex] = !newDays[dayIndex];
    const updated = {...schedule, days: newDays};
    setScheduleState(updated);
    await saveWorkSchedule(updated);
  }, [schedule]);

  const handleScheduleCustom = useCallback(async () => {
    const start = parseTimeStr(scheduleStartStr);
    const end = parseTimeStr(scheduleEndStr);
    if (!start || !end) { Alert.alert(t('invalid'), t('schedule_invalid_format')); return; }
    if (start.h * 60 + start.m >= end.h * 60 + end.m) { Alert.alert(t('invalid'), t('schedule_end_after_start')); return; }
    const updated: WorkSchedule = {enabled: true, startHour: start.h, startMinute: start.m, endHour: end.h, endMinute: end.m, days: schedule.days};
    setScheduleState(updated);
    await saveWorkSchedule(updated);
  }, [scheduleStartStr, scheduleEndStr, schedule.days]);

  const handleUnlockPro = useCallback(() => {
    Alert.alert(t('alert_upgrade_title'), t('alert_upgrade_body'), [
      {text: t('cancel'), style: 'cancel'},
      {text: t('buy_price'), onPress: () => { buyPro(); }},
    ]);
  }, []);

  const handleNotifToggle = useCallback(async (val: boolean) => {
    setNotifEnabledState(val);
    await saveNotifEnabled(val);
    if (!val) {
      await cancelNotification();
    } else if (running && !paused && phase === 'work') {
      await scheduleBreakNotification(phaseStart + workDurationMs, t('notif_body'));
    }
  }, [running, paused, phase, phaseStart, workDurationMs]);

  const handleChangeLanguage = useCallback(async (lang: string) => {
    await changeLocale(lang);
    setShowLangPicker(false);
    setLangKey(k => k + 1);
  }, []);

  const handleSlotChange = useCallback(async (index: 0 | 1 | 2, exercise: SlotExercise) => {
    const updated: [SlotExercise, SlotExercise, SlotExercise] = [...routineSlots];
    updated[index] = exercise;
    setRoutineSlots(updated);
    await saveRoutineSlot(index, exercise);
    setSlotPickerIndex(null);
  }, [routineSlots]);

  const handleBackup = useCallback(async () => {
    try {
      const json = await exportAllData();
      await Share.share({message: json, title: t('backup_title')});
    } catch {}
  }, []);

  const handleImport = useCallback(async () => {
    const text = importText.trim();
    if (!text) return;
    try {
      const ok = await importAllData(text);
      if (ok) {
        Alert.alert(t('success_label'), t('import_success'));
        setShowImportModal(false);
        setImportText('');
      } else {
        Alert.alert(t('error'), t('import_no_data'));
      }
    } catch {
      Alert.alert(t('error'), t('import_invalid'));
    }
  }, [importText]);

  if (!loaded) {
    return <View style={s.container}><Text style={s.loading}>...</Text></View>;
  }

  if (showPrivacy) {
    return (
      <View style={s.container}>
        <StatusBar barStyle={resolvedTheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
        <View style={s.subHeader}>
          <Pressable onPress={() => setShowPrivacy(false)} style={{padding: 8}}>
            <Text style={s.subHeaderBack}>{t('back')}</Text>
          </Pressable>
        </View>
        <PrivacyPolicyScreen colors={colors} />
      </View>
    );
  }

  if (showHowTo) {
    return (
      <View style={s.container}>
        <StatusBar barStyle={resolvedTheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
        <View style={s.subHeader}>
          <Pressable onPress={() => setShowHowTo(false)} style={{padding: 8}}>
            <Text style={s.subHeaderBack}>{t('back')}</Text>
          </Pressable>
          <Text style={s.subHeaderTitle}>{t('how_to_use')}</Text>
          <View style={{width: 40}} />
        </View>
        <ScrollView style={s.subBody} showsVerticalScrollIndicator={false}>
          <View style={s.card}>
            {(['howto_1', 'howto_2', 'howto_3', 'howto_4', 'howto_5', 'howto_6', 'howto_7'] as const).map((key, i) => (
              <Text key={key} style={{color: colors.text, fontSize: 15, lineHeight: 24, marginBottom: i < 6 ? 16 : 0}}>
                {t(key)}
              </Text>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (showFreeVsPro) {
    const FREE_FEATURES = ['sb_feat_timer', 'sb_feat_move', 'sb_feat_random', 'sb_feat_notif', 'sb_feat_7d_stats'];
    const PRO_FEATURES = ['sb_feat_custom_work', 'sb_feat_custom_move', 'sb_feat_menu', 'sb_feat_routine', 'sb_feat_schedule', 'sb_feat_full_stats'];
    return (
      <View style={s.container}>
        <StatusBar barStyle={resolvedTheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
        <View style={s.subHeader}>
          <Pressable onPress={() => setShowFreeVsPro(false)} style={{padding: 8}}>
            <Text style={s.subHeaderBack}>{t('back')}</Text>
          </Pressable>
          <Text style={s.subHeaderTitle}>{t('free_vs_pro')}</Text>
          <View style={{width: 40}} />
        </View>
        <ScrollView style={s.subBody} showsVerticalScrollIndicator={false}>
          <View style={[s.card, {marginTop: 12}]}>
            <Text style={s.settingsLabel}>{t('free')}</Text>
            {FREE_FEATURES.map(key => (
              <View key={key} style={{flexDirection: 'row', alignItems: 'center', paddingVertical: 8}}>
                <Text style={{color: colors.accent, fontSize: 16, marginRight: 10}}>✓</Text>
                <Text style={{color: colors.text, fontSize: 15}}>{t(key)}</Text>
              </View>
            ))}
          </View>

          <View style={s.card}>
            <Text style={s.settingsLabel}>Pro</Text>
            {FREE_FEATURES.map(key => (
              <View key={key} style={{flexDirection: 'row', alignItems: 'center', paddingVertical: 8}}>
                <Text style={{color: colors.accent, fontSize: 16, marginRight: 10}}>✓</Text>
                <Text style={{color: colors.text, fontSize: 15}}>{t(key)}</Text>
              </View>
            ))}
            {PRO_FEATURES.map(key => (
              <View key={key} style={{flexDirection: 'row', alignItems: 'center', paddingVertical: 8}}>
                <Text style={{color: colors.orange, fontSize: 16, marginRight: 10}}>★</Text>
                <Text style={{color: colors.orange, fontSize: 15}}>{t(key)}</Text>
              </View>
            ))}
          </View>

          {!isPro && (
            <Pressable onPress={handleUnlockPro} style={[s.button, {alignSelf: 'center', marginBottom: 32}]}>
              <Text style={s.buttonText}>{t('upgrade_pro')}</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>
    );
  }

  if (showSchedule) {
    return (
      <View style={s.container}>
        <StatusBar barStyle={resolvedTheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
        <View style={s.subHeader}>
          <Pressable onPress={() => setShowSchedule(false)} style={{padding: 8}}>
            <Text style={s.subHeaderBack}>{t('back')}</Text>
          </Pressable>
          <Text style={s.subHeaderTitle}>{t('work_schedule')}</Text>
          <View style={{width: 40}} />
        </View>
        <ScrollView style={s.subBody} showsVerticalScrollIndicator={false}>
          <View style={[s.card, {marginTop: 12}]}>
            <View style={s.settingsToggleRow}>
              <Text style={s.settingsInfoLabel}>{t('auto_start')}</Text>
              <Switch
                value={schedule.enabled}
                onValueChange={handleScheduleToggle}
                trackColor={{false: colors.cardBorder, true: colors.accentDark}}
                thumbColor={schedule.enabled ? colors.accent : colors.textDim}
              />
            </View>
          </View>

          <View style={s.card}>
            <Text style={s.settingsLabel}>{t('presets_label')}</Text>
            <View style={s.goalOptions}>
              {SCHEDULE_PRESETS.map(p => {
                const isActive = schedule.enabled && schedule.startHour === p.sh && schedule.startMinute === p.sm && schedule.endHour === p.eh && schedule.endMinute === p.em;
                return (
                  <Pressable
                    key={p.label}
                    onPress={() => handleSchedulePreset(p)}
                    style={[s.goalOption, isActive && s.goalOptionActive]}>
                    <Text style={[s.goalOptionText, isActive && s.goalOptionTextActive]}>{p.label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={s.settingsDivider} />

            <Text style={s.settingsLabel}>{t('custom_label')}</Text>
            <View style={s.customInputRow}>
              <TextInput
                style={[s.customHHMMInput, {width: 64}]}
                placeholder="09:00"
                placeholderTextColor={colors.textDim}
                value={scheduleStartStr}
                onChangeText={(v) => setScheduleStartStr(formatTimeDigits(v))}
                keyboardType="number-pad"
                maxLength={5}
              />
              <Text style={s.customHHMMLabel}>~</Text>
              <TextInput
                style={[s.customHHMMInput, {width: 64}]}
                placeholder="17:00"
                placeholderTextColor={colors.textDim}
                value={scheduleEndStr}
                onChangeText={(v) => setScheduleEndStr(formatTimeDigits(v))}
                keyboardType="number-pad"
                maxLength={5}
              />
              <Pressable onPress={handleScheduleCustom} style={s.customInputBtn}>
                <Text style={s.customInputBtnText}>{t('set')}</Text>
              </Pressable>
            </View>
          </View>

          <View style={s.card}>
            <Text style={s.settingsLabel}>{t('active_days')}</Text>
            <View style={s.dayRow}>
              {[t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')].map((day, i) => (
                <Pressable
                  key={i}
                  onPress={() => handleScheduleDayToggle(i)}
                  style={[s.dayChip, schedule.days[i] && s.dayChipActive]}>
                  <Text style={[s.dayChipText, schedule.days[i] && s.dayChipTextActive]}>{day}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <Text style={s.scheduleDesc}>
            {t('schedule_desc')}
          </Text>
        </ScrollView>
      </View>
    );
  }

  if (showRoutineMenu) {
    const perSlotSec = Math.floor(routineTotalSec / 3);
    const perSlotMin = Math.floor(perSlotSec / 60);
    const perSlotRemSec = perSlotSec % 60;
    const timeLabel = perSlotRemSec > 0 ? `${perSlotMin}m ${perSlotRemSec}s` : `${perSlotMin}m`;
    return (
      <View style={s.container}>
        <StatusBar barStyle={resolvedTheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
        <View style={s.subHeader}>
          <Pressable onPress={() => setShowRoutineMenu(false)} style={{padding: 8}}>
            <Text style={s.subHeaderBack}>{t('back')}</Text>
          </Pressable>
          <Text style={s.subHeaderTitle}>{t('move_routine')}</Text>
          <View style={{width: 40}} />
        </View>
        <ScrollView style={s.subBody} showsVerticalScrollIndicator={false}>
          <Text style={{color: colors.textDim, fontSize: 14, lineHeight: 20, marginBottom: 16}}>
            {t('routine_desc')}
          </Text>

          <View style={[s.card, {marginBottom: 12}]}>
            <View style={s.settingsToggleRow}>
              <Text style={s.settingsInfoLabel}>{t('guided_routine')}</Text>
              <Switch
                value={routineEnabled}
                onValueChange={handleRoutineToggle}
                trackColor={{false: colors.cardBorder, true: colors.accentDark}}
                thumbColor={routineEnabled ? colors.accent : colors.textDim}
              />
            </View>
          </View>

          <View style={[s.card, {marginBottom: 12}]}>
            <Text style={[s.settingsLabel, {marginBottom: 8}]}>{t('move_settings')}</Text>
            {([0, 1, 2] as const).map(i => (
              <Pressable
                key={i}
                style={[s.settingsRow, i < 2 && s.settingsRowBorder]}
                onPress={() => setSlotPickerIndex(i)}>
                <Text style={s.settingsRowText}>{t('exercise_n', i + 1)}</Text>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <Text style={s.settingsRowSub}>{getSlotExerciseLabel(routineSlots[i])}</Text>
                  <Text style={s.settingsRowArrow}> ›</Text>
                </View>
              </Pressable>
            ))}
          </View>

          <Text style={s.scheduleDesc}>
            {t('each_exercise_time', timeLabel)}
          </Text>
        </ScrollView>

        <Modal visible={slotPickerIndex !== null} transparent animationType="fade" onRequestClose={() => setSlotPickerIndex(null)}>
          <View style={s.modalOverlay}>
            <View style={s.modalContent}>
              <Text style={s.modalTitle}>{slotPickerIndex !== null ? t('exercise_n', slotPickerIndex + 1) : ''}</Text>
              {SLOT_EXERCISES.map(ex => (
                <Pressable
                  key={ex}
                  onPress={() => slotPickerIndex !== null && handleSlotChange(slotPickerIndex, ex)}
                  style={[s.settingsRow, slotPickerIndex !== null && routineSlots[slotPickerIndex] === ex && {backgroundColor: colors.accentDark, borderRadius: 8, marginHorizontal: -8, paddingHorizontal: 8}]}>
                  <Text style={[s.settingsRowText, slotPickerIndex !== null && routineSlots[slotPickerIndex] === ex && {color: colors.accent}]}>{getSlotExerciseLabel(ex)}</Text>
                </Pressable>
              ))}
              <Pressable onPress={() => setSlotPickerIndex(null)} style={[s.modalCancel, {marginTop: 12, alignSelf: 'center'}]}>
                <Text style={s.modalCancelText}>{t('cancel')}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  const renderTimer = () => {
    const displayTime = !running ? workMins * 60 * 1000 : remaining;

    const totalSeconds = Math.max(0, Math.ceil(displayTime / 1000));
    const displayMin = Math.floor(totalSeconds / 60);
    const displaySec = totalSeconds % 60;

    const routineInfo = running && phase === 'exercise' && routineEnabled && isPro && resolvedLabels.length === 3
      ? getRoutineInfo(now - phaseStart, routineTotalSec, resolvedLabels)
      : null;

    const isExercisePhase = running && phase === 'exercise';

    return (
      <ScrollView style={s.timerBody} contentContainerStyle={h.content} showsVerticalScrollIndicator={false}>
        <View style={h.header}>
          <Image source={APP_ICON} style={h.logo} />
          <Text style={[h.title, s.headerTitleFit]}>Stand Break</Text>
          {trialActive && <Text style={s.trialLabel}>{t('pro_trial_hours', trialHours)}</Text>}
        </View>

        <View style={h.summaries}>
          <View style={[h.summary, h.breaks]}>
            <View style={h.summaryHeading}>
              <View style={[h.iconTile, h.breakIcon]}>
                <View style={{width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: homeColors.onPrimary}} />
              </View>
              <Text style={h.label}>{t('breaks_today')}</Text>
            </View>
            <Text style={h.value}>{t('breaks_count', todayBreaks)}</Text>
          </View>
          <View style={[h.summary, h.move]}>
            <View style={h.summaryHeading}>
              <View style={[h.iconTile, h.moveIcon]}>
                <View style={{width: 12, height: 3, backgroundColor: homeColors.onPrimary, borderRadius: 2, transform: [{rotate: '-30deg'}]}} />
                <View style={{width: 12, height: 3, backgroundColor: homeColors.onPrimary, borderRadius: 2, transform: [{rotate: '30deg'}], marginTop: 3}} />
              </View>
              <Text style={h.label}>{t('move_time')}</Text>
            </View>
            <Text style={h.value}>{t('min_moved', todayMoveMinutes)}</Text>
          </View>
        </View>

        <View style={[h.panel, isExercisePhase && h.movePanel]}>
          <Text style={h.phase}>
            {!running || phase === 'work' ? t('phase_work') : t('phase_move_break')}
          </Text>

          <View style={s.timerSection}>
            <Text style={[s.timer, h.digits]}>{displayMin}</Text>
            <Text style={[s.timerUnit, h.unit]}>m</Text>
            <Text style={[s.timer, h.digits, {marginLeft: 12}]}>{String(displaySec).padStart(2, '0')}</Text>
            <Text style={[s.timerUnit, h.unit]}>s</Text>
          </View>

          <Text style={h.subtitle}>
            {phase === 'exercise'
              ? t('move_for', exerciseMins)
              : t('focus_for', workMins)}
          </Text>

          {running && paused && (
            <PulsingLabel text={t('paused_label')} style={[s.phaseLabel, {marginTop: 12}]} />
          )}

          {running && !paused && phase === 'exercise' && routineInfo && (
            <View style={{alignItems: 'center', marginTop: 8}}>
              <PulsingLabel text={routineInfo.label} style={s.phaseLabel} />
              {routineInfo.nextLabel && (
                <Text style={{color: colors.textMuted, fontSize: 14, marginTop: 4}}>
                  {t('next_exercise', routineInfo.nextLabel)}
                </Text>
              )}
            </View>
          )}

          {running && !paused && phase === 'exercise' && !routineInfo && (
            <PulsingLabel text={exerciseText} style={[s.phaseLabel, {marginTop: 8}]} />
          )}

          {!running ? (
            <Pressable
              onPress={handleStart}
              style={({pressed}) => [s.button, h.start, pressed && s.buttonPressed]}>
              <Text style={s.buttonText}>{t('start_timer')}</Text>
            </Pressable>
          ) : (
            <View style={[s.controlRow, h.controls]}>
              <Pressable
                onPress={paused ? handleResume : handlePause}
                style={({pressed}) => [s.controlBtn, h.primary, pressed && s.buttonPressed]}>
                <Text style={[s.controlBtnText, h.primaryText]}>{paused ? t('resume_btn') : t('pause_btn')}</Text>
              </Pressable>
              <Pressable
                onPress={handleSkip}
                style={({pressed}) => [s.controlBtn, s.controlBtnSkip, h.primary, h.secondary, pressed && s.buttonPressed]}>
                <Text style={[s.controlBtnSkipText, h.secondaryText]}>{t('skip_btn')}</Text>
              </Pressable>
              <Pressable
                onPress={handleStop}
                style={({pressed}) => [s.controlBtn, s.controlBtnStop, h.primary, h.stop, pressed && s.buttonPressed]}>
                <Text style={[s.controlBtnStopText, h.stopText]}>{t('stop_btn')}</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={{width: '100%', paddingBottom: 4}}>
          {streak.currentStreak > 0 && (
            <View style={h.streak}>
              <Text style={h.flame}>🔥</Text>
              <Text style={h.streakText}>
                {t('day_streak', streak.currentStreak)}
              </Text>
            </View>
          )}
          {!isPro && !running && (
            <Pressable onPress={handleUnlockPro} style={s.upgradeCard}>
              <Text style={s.upgradeCardText}>{t('upgrade_pro')} — $2.99</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderStats = () => {
    type DayEntry = {dateKey: string; breakCount: number; moveMinutes: number};
    const dayMap = new Map<string, {breakCount: number; moveMinutes: number}>();
    for (const r of history) {
      const d = new Date(r.timestamp);
      const key = toDateKey(d);
      const entry = dayMap.get(key) || {breakCount: 0, moveMinutes: 0};
      if (r.completed !== false) entry.breakCount += 1;
      const moveMins = r.moveSeconds != null ? r.moveSeconds / 60 : r.exerciseMinutes;
      entry.moveMinutes += moveMins;
      dayMap.set(key, entry);
    }
    const allDays: DayEntry[] = [...dayMap.entries()]
      .map(([dateKey, v]) => ({dateKey, breakCount: v.breakCount, moveMinutes: Math.round(v.moveMinutes)}))
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    const days = isPro ? allDays : allDays.slice(-7);
    const hasHidden = !isPro && allDays.length > 7;

    const todayKey = toDateKey(new Date());
    const todayEntry = days.find(d => d.dateKey === todayKey);
    const todayBreaksVal = todayEntry?.breakCount ?? 0;
    const todayMoveVal = todayEntry?.moveMinutes ?? 0;

    // 7-day summary
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);
    const sevenDayKey = toDateKey(sevenDaysAgo);
    const weekDays = allDays.filter(d => d.dateKey > sevenDayKey);
    const weekBreaks = weekDays.reduce((sum, d) => sum + d.breakCount, 0);
    const weekMoveMin = weekDays.reduce((sum, d) => sum + d.moveMinutes, 0);

    const MAX_MINUTES = 24 * 60;
    const maxMove = Math.max(10, ...days.map(d => d.moveMinutes));
    const chartMax = Math.min(maxMove, MAX_MINUTES);
    const CHART_HEIGHT = 120;
    // Reserve space for both labels even when a bar reaches the maximum.
    const CHART_LABEL_SPACE = 48;
    const BAR_WIDTH = 42;
    const BAR_GAP = 4;
    const DAY_NAMES = [t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')];

    const sel = selectedBar !== null && selectedBar < days.length ? days[selectedBar] : null;

    const fmtMove = (min: number) => {
      const h = Math.floor(min / 60);
      const m = min % 60;
      return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    return (
      <ScrollView style={s.tabContent} contentContainerStyle={s.historyContent} showsVerticalScrollIndicator={false}>
        <View style={s.historyHeader}>
          <Image source={APP_ICON} style={s.historyIcon} />
          <Text style={[s.sectionTitle, s.historyTitle, s.headerTitleFit]}>{t('history_screen')}</Text>
          {trialActive && <Text style={s.trialLabel}>{t('pro_trial_hours', trialHours)}</Text>}
        </View>

        <View style={[s.card, s.historyCard, {backgroundColor: colors.cardMint, borderColor: colors.cardMintBorder}]}>
          <Text style={[s.settingsLabel, s.historyCardLabel]}>{t('today_label')}</Text>
          <View style={s.statsRow}>
            <View style={s.statsRowItem}>
              <Text style={[s.statsRowValue, s.historyValue]}>{todayBreaksVal}</Text>
              <Text style={s.statsRowLabel}>{t('breaks_today')}</Text>
            </View>
            <View style={s.statsRowItem}>
              <Text style={[s.statsRowValue, s.historyValue]}>{fmtMove(todayMoveVal)}</Text>
              <Text style={s.statsRowLabel}>{t('move_time')}</Text>
            </View>
          </View>
        </View>

        <View style={[s.card, s.historyCard, {backgroundColor: colors.cardBlue, borderColor: colors.cardBlueBorder}]}>
          <Text style={[s.settingsLabel, s.historyCardLabel]}>{t('last_7_days')}</Text>
          <View style={s.statsRow}>
            <View style={s.statsRowItem}>
              <Text style={[s.statsRowValue, s.historyValue]}>{weekBreaks}</Text>
              <Text style={s.statsRowLabel}>{t('total_breaks')}</Text>
            </View>
            <View style={s.statsRowItem}>
              <Text style={[s.statsRowValue, s.historyValue]}>{fmtMove(weekMoveMin)}</Text>
              <Text style={s.statsRowLabel}>{t('move_time')}</Text>
            </View>
            <View style={s.statsRowItem}>
              <Text style={[s.statsRowValue, s.historyValue]}>{streak.currentStreak}</Text>
              <Text style={s.statsRowLabel}>{t('streak_label')}</Text>
            </View>
          </View>
        </View>

        {days.length > 0 ? (
          <View style={[s.card, s.historyChart]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{minHeight: CHART_HEIGHT + CHART_LABEL_SPACE, paddingHorizontal: 4, alignItems: 'flex-end'}}>
              {days.map((day, i) => {
                const barH = Math.max(4, (Math.min(day.moveMinutes, MAX_MINUTES) / chartMax) * CHART_HEIGHT);
                const parts = day.dateKey.split('-');
                const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                const label = DAY_NAMES[dateObj.getDay()];
                const isSelected = selectedBar === i;
                return (
                  <Pressable
                    key={day.dateKey}
                    onPress={() => setSelectedBar(isSelected ? null : i)}
                    style={{alignItems: 'center', width: BAR_WIDTH, marginRight: BAR_GAP, justifyContent: 'flex-end'}}>
                    <Text style={{color: colors.textMuted, fontSize: 11, lineHeight: 16, marginBottom: 4}}>{fmtMove(day.moveMinutes)}</Text>
                    <View style={{
                      width: BAR_WIDTH - 8,
                      height: barH,
                      backgroundColor: colors.accent,
                      borderRadius: 6,
                      borderWidth: isSelected ? 2 : 0,
                      borderColor: colors.text,
                    }} />
                    <Text style={{color: colors.textMuted, fontSize: 13, lineHeight: 20, marginTop: 6}}>{label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {sel && (
              <Pressable
                style={s.chartOverlay}
                onPress={() => setSelectedBar(null)}>
                <View style={s.chartPopup}>
                  <Text style={s.chartPopupDate}>{sel.dateKey}</Text>
                  <Text style={s.chartPopupValue}>{t('breaks_count', sel.breakCount)}</Text>
                  <Text style={s.chartPopupSub}>{fmtMove(sel.moveMinutes)} {t('move_time')}</Text>
                </View>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={[s.card, s.historyEmpty]}>
            <Text style={[s.emptyTitle, s.historyEmptyTitle]}>{t('no_sessions_title')}</Text>
            <Text style={s.emptyText}>{t('no_sessions_body')}</Text>
          </View>
        )}

        {hasHidden && (
          <Pressable onPress={handleUnlockPro} style={s.upgradeBlock}>
            <Text style={s.upgradeText}>{t('unlock_history')}</Text>
          </Pressable>
        )}
      </ScrollView>
    );
  };

  const renderSettings = () => (
    <ScrollView style={s.tabContent} contentContainerStyle={s.settingsScreenContent} showsVerticalScrollIndicator={false}>
      <View style={s.settingsScreenHeader}>
        <Image source={APP_ICON} style={s.settingsScreenIcon} />
        <Text style={[s.sectionTitle, s.settingsScreenTitle, s.headerTitleFit]}>{t('settings_screen')}</Text>
        {trialActive && <Text style={s.trialLabel}>{t('pro_trial_hours', trialHours)}</Text>}
      </View>

      {/* 1. Notification — 一番上 */}
      <View style={[s.card, s.settingsScreenCard, {backgroundColor: colors.cardMint, borderColor: colors.cardMintBorder}]}>
        <Text style={[s.settingsLabel, s.settingsScreenLabel]}>{t('notifications_label')}</Text>
        <View style={[s.settingsToggleRow, s.settingsScreenRow]}>
          <View style={s.settingsScreenCopy}>
            <Text style={s.settingsInfoLabel}>{t('notifications_label')}</Text>
            <Text style={s.settingsRowSub}>
              {notifEnabled ? t('notif_on_desc') : t('notif_off_desc')}
            </Text>
          </View>
          <Switch
            value={notifEnabled}
            onValueChange={handleNotifToggle}
            trackColor={{false: colors.cardBorder, true: colors.accentDark}}
            thumbColor={notifEnabled ? colors.accent : colors.textDim}
          />
        </View>
        <Pressable style={[s.settingsRow, s.settingsScreenRow, s.settingsRowBorder]} onPress={() => openNotificationSettings()}>
          <Text style={s.settingsRowText}>{t('notification_settings')}</Text>
          <Text style={s.settingsRowArrow}>›</Text>
        </Pressable>
        <Pressable
          style={[s.settingsRow, s.settingsScreenRow]}
          onPress={() => {
            Alert.alert(t('alert_battery_title'), t('alert_battery_body'), [
              {text: t('close'), style: 'cancel'},
              {text: t('open_settings'), onPress: () => { const {Linking} = require('react-native'); Linking.openSettings(); }},
            ]);
          }}>
          <Text style={s.settingsRowText}>{t('battery_settings')}</Text>
          <Text style={s.settingsRowArrow}>›</Text>
        </Pressable>
      </View>

      {/* 2. How to Use — 通知の下 */}
      <View style={[s.card, s.settingsScreenCard, s.settingsScreenSingleRowCard]}>
        <Pressable style={[s.settingsRow, s.settingsScreenRow]} onPress={() => setShowHowTo(true)}>
          <Text style={s.settingsRowText}>{t('how_to_use')}</Text>
          <Text style={s.settingsRowArrow}>›</Text>
        </Pressable>
      </View>

      {/* 3. Custom Timer (Pro) */}
      <View style={[s.card, s.settingsScreenCard, {backgroundColor: colors.cardBlue, borderColor: colors.cardBlueBorder}]}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Text style={[s.settingsLabel, s.settingsScreenLabel]}>{t('custom_timer_settings')}</Text>
          {!isPro && <View style={[s.proBadge, s.settingsScreenBadge]}><Text style={s.proBadgeText}>PRO</Text></View>}
        </View>

        <View style={[s.settingsRow, s.settingsScreenRow]}>
          <Text style={s.settingsRowText}>{t('work_duration')}</Text>
          <Text style={[s.settingsScreenValue, {color: colors.textMuted, fontSize: 15}]}>{t('min_suffix', workMins)}</Text>
        </View>
        {isPro && (
          <View style={[s.goalOptions, {marginBottom: 4}]}>
            {WORK_PRESETS.map(v => (
              <Pressable
                key={v}
                onPress={() => handleWorkPreset(v)}
                style={[s.goalOption, workMins === v && s.goalOptionActive]}>
                <Text style={[s.goalOptionText, workMins === v && s.goalOptionTextActive]}>{v}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={[s.settingsDivider, s.settingsScreenDivider]} />

        <View style={[s.settingsRow, s.settingsScreenRow]}>
          <Text style={s.settingsRowText}>{t('move_duration')}</Text>
          <Text style={[s.settingsScreenValue, {color: colors.textMuted, fontSize: 15}]}>
            {t('min_suffix', exerciseMins)}
          </Text>
        </View>
        {isPro ? (
          <View style={[s.goalOptions, {marginBottom: 4}]}>
            {MOVE_PRESETS.map(v => (
              <Pressable
                key={v}
                onPress={() => handleMovePreset(v)}
                style={[s.goalOption, exerciseMins === v && s.goalOptionActive]}>
                <Text style={[s.goalOptionText, exerciseMins === v && s.goalOptionTextActive]}>{v}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      {/* 4. 作業スケジュール (Pro) */}
      <View style={[s.card, s.settingsScreenCard, {backgroundColor: colors.cardWarm, borderColor: colors.cardWarmBorder}]}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Text style={[s.settingsLabel, s.settingsScreenLabel]}>{t('work_schedule')}</Text>
          {!isPro && <View style={[s.proBadge, s.settingsScreenBadge]}><Text style={s.proBadgeText}>PRO</Text></View>}
        </View>
        <Pressable
          style={[s.settingsRow, s.settingsScreenRow]}
          onPress={isPro ? () => setShowSchedule(true) : handleUnlockPro}>
          <Text style={s.settingsRowText}>{t('auto_start')}</Text>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={s.settingsRowSub}>
              {schedule.enabled
                ? `${String(schedule.startHour).padStart(2, '0')}:${String(schedule.startMinute).padStart(2, '0')}~${String(schedule.endHour).padStart(2, '0')}:${String(schedule.endMinute).padStart(2, '0')}`
                : t('schedule_off')}
            </Text>
            <Text style={s.settingsRowArrow}> ›</Text>
          </View>
        </Pressable>
      </View>

      {/* 5. Move */}
      <View style={[s.card, s.settingsScreenCard, {backgroundColor: colors.cardMint, borderColor: colors.cardMintBorder}]}>
        <Text style={[s.settingsLabel, s.settingsScreenLabel]}>{t('move_settings')}</Text>
        <Pressable
          style={[s.settingsRow, s.settingsScreenRow, s.settingsRowBorder]}
          onPress={isPro ? () => setShowRoutineMenu(true) : handleUnlockPro}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={s.settingsRowText}>{t('move_routine')}</Text>
            {!isPro && <View style={s.proBadge}><Text style={s.proBadgeText}>PRO</Text></View>}
          </View>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={s.settingsRowSub}>{routineEnabled ? 'ON' : 'OFF'}</Text>
            <Text style={s.settingsRowArrow}> ›</Text>
          </View>
        </Pressable>

        {!routineEnabled && (
          <>
            <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 4}}>
              <Text style={[s.settingsLabel, s.settingsScreenLabel]}>{t('exercise_menu_label')}</Text>
              {!isPro && <View style={[s.proBadge, s.settingsScreenBadge]}><Text style={s.proBadgeText}>PRO</Text></View>}
            </View>
            <View style={s.goalOptions}>
              {getMenuOptions().map(opt => (
                <Pressable
                  key={opt.key}
                  onPress={isPro ? () => handleMenuChange(opt.key) : undefined}
                  style={[
                    s.goalOption,
                    exerciseMenu === opt.key && s.goalOptionActive,
                  ]}>
                  <Text style={[
                    s.goalOptionText,
                    exerciseMenu === opt.key && s.goalOptionTextActive,
                  ]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </View>

      {/* 6. Appearance */}
      <View style={[s.card, s.settingsScreenCard, {backgroundColor: colors.cardBlue, borderColor: colors.cardBlueBorder}]}>
        <Text style={[s.settingsLabel, s.settingsScreenLabel]}>{t('appearance')}</Text>
        <View style={s.goalOptions}>
          {(['light', 'dark', 'system'] as const).map(mode => (
            <Pressable
              key={mode}
              onPress={() => handleThemeChange(mode)}
              style={[s.goalOption, themeMode === mode && s.goalOptionActive]}>
              <Text style={[s.goalOptionText, themeMode === mode && s.goalOptionTextActive]}>
                {t(`theme_${mode}`)}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 7. Free vs Pro + Upgrade — 同一カード */}
      <View style={[s.card, s.settingsScreenCard, {backgroundColor: colors.cardWarm, borderColor: colors.cardWarmBorder}]}>
        <Pressable style={[s.settingsRow, s.settingsScreenRow, s.settingsRowBorder]} onPress={() => setShowFreeVsPro(true)}>
          <Text style={s.settingsRowText}>{t('free_vs_pro')}</Text>
          <Text style={s.settingsRowArrow}>›</Text>
        </Pressable>
        {isPro ? (
          <View style={[s.settingsInfoRow, s.settingsScreenRow]}>
            <Text style={s.settingsInfoLabel}>Pro</Text>
            <Text style={{color: colors.accent, fontSize: 13}}>
              {proPermanent ? t('lifetime') : `~${new Date(proExpiresAt).toLocaleDateString()}`}
            </Text>
          </View>
        ) : (
          <Pressable style={[s.settingsRow, s.settingsScreenRow]} onPress={handleUnlockPro}>
            <Text style={s.settingsRowText}>{t('upgrade_pro')}</Text>
            <Text style={s.settingsRowArrow}>›</Text>
          </Pressable>
        )}
      </View>

      {/* 8. Data — バックアップ + インポート 同一カード */}
      <View style={[s.card, s.settingsScreenCard, {backgroundColor: colors.cardBlue, borderColor: colors.cardBlueBorder}]}>
        <Pressable style={[s.settingsRow, s.settingsScreenRow, s.settingsRowBorder]} onPress={handleBackup}>
          <Text style={s.settingsRowText}>{t('data_backup')}</Text>
          <Text style={s.settingsRowArrow}>›</Text>
        </Pressable>
        <Pressable style={[s.settingsRow, s.settingsScreenRow]} onPress={() => { setImportText(''); setShowImportModal(true); }}>
          <Text style={s.settingsRowText}>{t('data_import')}</Text>
          <Text style={s.settingsRowArrow}>›</Text>
        </Pressable>
      </View>

      {/* 9. Other — 言語, プライバシー */}
      <View style={[s.card, s.settingsScreenCard, {backgroundColor: colors.cardMint, borderColor: colors.cardMintBorder}]}>
        <Pressable style={[s.settingsRow, s.settingsScreenRow, s.settingsRowBorder]} onPress={() => setShowLangPicker(true)}>
          <Text style={s.settingsRowText}>{t('language')}</Text>
          <View style={s.settingsScreenTrailing}>
            <Text style={[s.settingsScreenValue, {color: colors.textMuted, fontSize: 14}]}>
              {LANGUAGE_NAMES[getCurrentLocale()] || getCurrentLocale()}
            </Text>
            <Text style={s.settingsRowArrow}>›</Text>
          </View>
        </Pressable>

        <Pressable style={[s.settingsRow, s.settingsScreenRow]} onPress={() => setShowPrivacy(true)}>
          <Text style={s.settingsRowText}>{t('privacy_policy')}</Text>
          <Text style={s.settingsRowArrow}>›</Text>
        </Pressable>
      </View>

      <Text style={[s.versionText, s.settingsScreenFooter]}>{t('version_label', '1.0.0')}</Text>
    </ScrollView>
  );

  const TABS: {key: Tab; labelKey: string}[] = [
    {key: 'timer', labelKey: 'home'},
    {key: 'stats', labelKey: 'history_screen'},
    {key: 'settings', labelKey: 'settings_screen'},
  ];

  return (
    <View style={s.container}>
      <StatusBar barStyle={resolvedTheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.bg} />
      <View style={s.body}>
        {tab === 'timer' && renderTimer()}
        {tab === 'stats' && renderStats()}
        {tab === 'settings' && renderSettings()}
      </View>

      <View style={[s.tabBar, tab === 'timer' && h.tabBar]}>
        {TABS.map(tabItem => {
          const isActive = tab === tabItem.key;
          const iconColor = tab === 'timer'
            ? (isActive ? homeColors.teal : homeColors.inactive)
            : (isActive ? colors.accent : colors.textDim);
          return (
            <Pressable key={tabItem.key} style={s.tabItem} onPress={async () => {
                setTab(tabItem.key);
                const seen = await getOverlaySeen(tabItem.key);
                if (!seen) setOverlayTab(tabItem.key as any);
              }}>
              <View style={tab === 'timer' ? [h.tabIcon, isActive && h.activeTab] : undefined}>
                <TabBarIcon name={tabItem.key} color={iconColor} size={22} />
              </View>
              <Text style={[s.tabLabel, isActive && s.tabActive, tab === 'timer' && h.tabLabel, tab === 'timer' && isActive && h.activeLabel]}>{t(tabItem.labelKey)}</Text>
            </Pressable>
          );
        })}
      </View>

      {overlayTab !== null && (
        <Pressable
          style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: resolvedTheme === 'dark' ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32}}
          onPress={() => { setOverlaySeen(overlayTab); setOverlayTab(null); }}>
          <View style={{backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder, padding: 24, maxWidth: 340, width: '100%'}}>
            {overlayTab === 'timer' && (
              <>
                <Text style={{color: colors.text, fontSize: 16, fontWeight: '600', lineHeight: 24, marginBottom: 10}}>{t('overlay_timer_1')}</Text>
                <Text style={{color: colors.textMuted, fontSize: 14, lineHeight: 22, marginBottom: 10}}>{t('overlay_timer_2')}</Text>
                <Text style={{color: colors.accent, fontSize: 13, lineHeight: 20}}>{t('overlay_timer_3')}</Text>
              </>
            )}
            {overlayTab === 'stats' && (
              <>
                <Text style={{color: colors.text, fontSize: 16, fontWeight: '600', lineHeight: 24, marginBottom: 10}}>{t('overlay_stats_1')}</Text>
                <Text style={{color: colors.textMuted, fontSize: 14, lineHeight: 22}}>{t('overlay_stats_2')}</Text>
              </>
            )}
            {overlayTab === 'settings' && (
              <Text style={{color: colors.text, fontSize: 16, fontWeight: '600', lineHeight: 24}}>{t('overlay_settings_1')}</Text>
            )}
            <Text style={{color: colors.textDim, fontSize: 12, textAlign: 'center', marginTop: 16}}>{t('tap_to_dismiss')}</Text>
          </View>
        </Pressable>
      )}

      <Modal visible={showLangPicker} transparent animationType="fade" onRequestClose={() => setShowLangPicker(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, {maxHeight: '70%'}]}>
            <Text style={s.modalTitle}>{t('language')}</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {AVAILABLE_LANGUAGES.map(lang => (
                <Pressable
                  key={lang}
                  onPress={() => handleChangeLanguage(lang)}
                  style={[s.settingsRow, lang === getCurrentLocale() && {backgroundColor: colors.accentDark}]}>
                  <Text style={s.settingsRowText}>{LANGUAGE_NAMES[lang]}</Text>
                  {lang === getCurrentLocale() && <Text style={{color: colors.accent, fontSize: 16}}>✓</Text>}
                </Pressable>
              ))}
            </ScrollView>
            <Pressable onPress={() => setShowLangPicker(false)} style={[s.modalCancel, {marginTop: 12, alignSelf: 'center'}]}>
              <Text style={s.modalCancelText}>{t('cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showImportModal} transparent animationType="fade" onRequestClose={() => setShowImportModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>{t('data_import')}</Text>
            <Text style={{color: colors.textMuted, fontSize: 13, marginBottom: 12}}>
              {t('import_desc')}
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.inputBg,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: colors.inputBorder,
                color: colors.text,
                fontSize: 13,
                padding: 12,
                minHeight: 100,
                textAlignVertical: 'top',
              }}
              multiline
              placeholder='{"sb_history":"..."}'
              placeholderTextColor={colors.textDim}
              value={importText}
              onChangeText={setImportText}
            />
            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 16}}>
              <Pressable onPress={() => setShowImportModal(false)} style={s.modalCancel}>
                <Text style={s.modalCancelText}>{t('cancel')}</Text>
              </Pressable>
              <Pressable onPress={handleImport} style={[s.customInputBtn, {paddingHorizontal: 24, paddingVertical: 10}]}>
                <Text style={s.customInputBtnText}>{t('import_btn')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
