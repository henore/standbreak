import notifee, {
  TriggerType,
  TimestampTrigger,
  AndroidImportance,
} from '@notifee/react-native';

const CHANNEL_ID = 'stand-break-v2';
const OLD_CHANNEL_ID = 'stand-break';
const NOTIF_ID = 'stand-break-alert';

async function ensureChannel(): Promise<void> {
  try { await notifee.deleteChannel(OLD_CHANNEL_ID); } catch {}
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: 'Stand Break',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });
}

export async function scheduleBreakNotification(fireDate: number, body?: string): Promise<void> {
  if (fireDate <= Date.now()) return;
  await ensureChannel();

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: fireDate,
    alarmManager: {allowWhileIdle: true},
  };

  await notifee.createTriggerNotification(
    {
      id: NOTIF_ID,
      title: 'Stand Break',
      body: body || 'Time to stand up and move!',
      android: {channelId: CHANNEL_ID},
    },
    trigger,
  );
}

export async function cancelNotification(): Promise<void> {
  await notifee.cancelNotification(NOTIF_ID);
}

export async function openNotificationSettings(): Promise<void> {
  await notifee.openNotificationSettings();
}

export async function cancelAllDisplayed(): Promise<void> {
  const displayed = await notifee.getDisplayedNotifications();
  for (const n of displayed) {
    if (n.id) {
      await notifee.cancelDisplayedNotification(n.id);
    }
  }
}
