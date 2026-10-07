import React from 'react';
import {AppState, Switch} from 'react-native';
import ReactTestRenderer, {act} from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import App from '../App';
import {cancelNotification, scheduleBreakNotification} from '../src/notifications';
import {getHistory, getTimerState, saveTimerState, getProExpiresAt, startProTrial, setProPermanent} from '../src/storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../src/notifications', () => ({
  scheduleBreakNotification: jest.fn().mockResolvedValue(undefined),
  cancelNotification: jest.fn().mockResolvedValue(undefined),
  openNotificationSettings: jest.fn(),
}));
jest.mock('../src/purchase', () => ({
  initIAP: jest.fn().mockResolvedValue(undefined),
  endIAP: jest.fn().mockResolvedValue(undefined),
  listenToPurchases: jest.fn(),
}));
jest.mock('../src/i18n', () => ({
  t: (key: string) => key,
  initLocale: jest.fn().mockResolvedValue(undefined),
  getCurrentLocale: () => 'en',
  LANGUAGE_NAMES: {en: 'English'},
  AVAILABLE_LANGUAGES: ['en'],
}));

const MINUTE = 60_000;
let app: ReactTestRenderer.ReactTestRenderer;

async function mount() {
  await act(async () => { app = ReactTestRenderer.create(<App />); });
}

async function press(label: string) {
  const button = app.root.findAll(node => typeof node.props.onPress === 'function').find(node =>
    node.findAll(text => text.props.children === label).length > 0,
  );
  expect(button).toBeDefined();
  await act(async () => { await button!.props.onPress(); });
}

async function advance(ms: number) {
  jest.setSystemTime(Date.now() + ms - 1000);
  await act(async () => { jest.advanceTimersByTime(1000); });
}

beforeEach(async () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2026-10-07T00:00:00Z'));
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

afterEach(async () => {
  if (app) await act(async () => { app.unmount(); });
  jest.restoreAllMocks();
  jest.useRealTimers();
});

test('notification ON: work expires into a full Move, then starts the next work period', async () => {
  await mount();
  await press('start_timer');
  await advance(30 * MINUTE);
  expect(await getTimerState()).toMatchObject({phase: 'exercise', phaseStartTimestamp: Date.now()});
  expect(await getHistory()).toHaveLength(0);
  // Expiration must not cancel the notification racing with this JS tick.
  expect(cancelNotification).not.toHaveBeenCalled();
  expect(scheduleBreakNotification).toHaveBeenCalledTimes(1);
  await advance(3 * MINUTE - 1000);
  expect((await getTimerState()).phase).toBe('exercise');
  await advance(1000);
  expect(await getTimerState()).toMatchObject({phase: 'work', phaseStartTimestamp: Date.now()});
  expect(await getHistory()).toEqual([expect.objectContaining({completed: true, moveSeconds: 180})]);
  expect(scheduleBreakNotification).toHaveBeenLastCalledWith(Date.now() + 30 * MINUTE, 'notif_body');
});

test('returning after a suspended work timer starts Move instead of skipping it', async () => {
  const listener = jest.spyOn(AppState, 'addEventListener');
  await mount();
  await press('start_timer');
  jest.setSystemTime(Date.now() + 35 * MINUTE);
  const onChange = listener.mock.calls[listener.mock.calls.length - 1][1];
  await act(async () => { onChange('active'); });
  expect(await getTimerState()).toMatchObject({phase: 'exercise', phaseStartTimestamp: Date.now()});
  expect(await getHistory()).toHaveLength(0);
  await advance(1000);
  expect((await getTimerState()).phase).toBe('exercise');
});

test('restarting with an expired work timer preserves a full Move period', async () => {
  await saveTimerState(true, 'work', Date.now() - 35 * MINUTE);
  await mount();
  expect(await getTimerState()).toMatchObject({phase: 'exercise', phaseStartTimestamp: Date.now()});
  expect(await getHistory()).toHaveLength(0);
});

test('pausing Move prevents completion until resumed', async () => {
  await mount();
  await press('start_timer');
  await advance(30 * MINUTE);
  await press('pause_btn');
  await advance(5 * MINUTE);
  expect(await getTimerState()).toMatchObject({phase: 'exercise', paused: true});
  await press('resume_btn');
  await advance(3 * MINUTE - 1000);
  expect((await getTimerState()).phase).toBe('exercise');
  await advance(1000);
  expect((await getTimerState()).phase).toBe('work');
});

test('enabling notifications during work schedules the remaining time', async () => {
  await AsyncStorage.setItem('sb_notif_enabled', 'false');
  await mount();
  await press('start_timer');
  await advance(10 * MINUTE);
  expect(scheduleBreakNotification).not.toHaveBeenCalled();
  await press('settings_screen');
  await act(async () => {
    await app.root.findAllByType(Switch)[0].props.onValueChange(true);
  });
  expect(scheduleBreakNotification).toHaveBeenLastCalledWith(Date.now() + 20 * MINUTE, 'notif_body');
  await advance(20 * MINUTE);
  expect((await getTimerState()).phase).toBe('exercise');
});

test('notification OFF still runs a full work and Move cycle without alerts', async () => {
  await AsyncStorage.setItem('sb_notif_enabled', 'false');
  await mount();
  await press('start_timer');
  await advance(30 * MINUTE);
  expect((await getTimerState()).phase).toBe('exercise');
  await advance(3 * MINUTE);
  expect((await getTimerState()).phase).toBe('work');
  expect(scheduleBreakNotification).not.toHaveBeenCalled();
});

test('trial starts on first timer start, lasts 48 hours, and is not renewed after stopping', async () => {
  await mount();
  expect(await getProExpiresAt()).toBe(0);
  const firstStart = Date.now();
  await press('start_timer');
  expect(await getProExpiresAt()).toBe(firstStart + 48 * 60 * MINUTE);
  expect(app.root.findAll(node => node.props.children === 'Pro trial 48h').length).toBeGreaterThan(0);
  await press('stop_btn');
  jest.setSystemTime(Date.now() + 60 * MINUTE);
  await press('start_timer');
  expect(await getProExpiresAt()).toBe(firstStart + 48 * 60 * MINUTE);
  expect(app.root.findAll(node => node.props.children === 'Pro trial 47h').length).toBeGreaterThan(0);
});

test('trial expires while stopped, hides the label and locks Pro settings', async () => {
  await AsyncStorage.setItem('pro_expires_at', String(Date.now() + 1000));
  await mount();
  await press('settings_screen');
  expect(app.root.findAllByType(Switch)[1].props.disabled).toBe(false);
  await advance(1000);
  expect(app.root.findAllByType(Switch)[1].props.disabled).toBe(true);
  expect(app.root.findAll(node => typeof node.props.children === 'string' && node.props.children.startsWith('Pro trial'))).toHaveLength(0);
});

test('expired trial is not renewed on a later start', async () => {
  const expiredAt = Date.now() - 1000;
  await AsyncStorage.setItem('pro_expires_at', String(expiredAt));
  await mount();
  await press('start_timer');
  expect(await getProExpiresAt()).toBe(expiredAt);
});

test('saved active trial is restored on launch without extending its expiry', async () => {
  const expiresAt = await startProTrial(Date.now() - 60 * MINUTE);
  await mount();
  expect(app.root.findAll(node => node.props.children === 'Pro trial 47h').length).toBeGreaterThan(0);
  await press('start_timer');
  expect(await getProExpiresAt()).toBe(expiresAt);
});

test('permanent Pro takes precedence over a saved trial', async () => {
  const expiresAt = await startProTrial();
  await setProPermanent();
  await mount();
  await press('start_timer');
  expect(await getProExpiresAt()).toBe(expiresAt);
  expect(app.root.findAll(node => typeof node.props.children === 'string' && node.props.children.startsWith('Pro trial'))).toHaveLength(0);
  await press('settings_screen');
  expect(app.root.findAllByType(Switch)[1].props.disabled).toBe(false);
});
