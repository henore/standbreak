import React, {useRef, useCallback} from 'react';
import {View, Text, Pressable, Modal, StyleSheet} from 'react-native';
import {captureRef} from 'react-native-view-shot';
import RNShare from 'react-native-share';
import {t} from './i18n';

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.ohesoft.standbreak';

export type AchievementInfo = {
  durationMinutes: number;
  goalReached: boolean;
  newBest: boolean;
  streakMilestone: number | null;
};

function formatDur(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`;
}

function getShareText(info: AchievementInfo): string {
  const dur = formatDur(info.durationMinutes);
  let text: string;
  if (info.newBest) {
    text = t('share_text_best', dur);
  } else if (info.streakMilestone) {
    text = t('share_text_streak', String(info.streakMilestone));
  } else {
    text = t('share_text_goal', dur);
  }
  return `${text}\n\n${PLAY_STORE_URL}`;
}

type Props = {
  visible: boolean;
  info: AchievementInfo | null;
  onDone: () => void;
};

export default function AchievementModal({visible, info, onDone}: Props) {
  const cardRef = useRef<View>(null);

  const handleShare = useCallback(async () => {
    if (!info || !cardRef.current) return;
    try {
      const uri = await captureRef(cardRef, {format: 'png', quality: 1});
      const fileUri = uri.startsWith('file://') ? uri : `file://${uri}`;
      await RNShare.open({
        url: fileUri,
        message: getShareText(info),
        type: 'image/png',
        failOnCancel: false,
      });
    } catch {}
  }, [info]);

  if (!info) return null;

  const hasAnyBadge =
    info.goalReached || info.newBest || info.streakMilestone != null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDone}>
      <View style={cs.overlay}>
        <View ref={cardRef} collapsable={false} style={cs.card}>
          <Text style={cs.header}>FAST</Text>
          <Text style={cs.duration}>{formatDur(info.durationMinutes)}</Text>
          {hasAnyBadge && (
            <View style={cs.badges}>
              {info.goalReached && (
                <Text style={cs.badge}>{t('achievement_goal_reached')}</Text>
              )}
              {info.newBest && (
                <Text style={cs.badge}>{t('achievement_new_best')}</Text>
              )}
              {info.streakMilestone != null && (
                <Text style={cs.badge}>
                  {t('achievement_day_streak', info.streakMilestone)}
                </Text>
              )}
            </View>
          )}
          <Text style={cs.footer}>Fast</Text>
        </View>
        <View style={cs.buttons}>
          <Pressable onPress={onDone} style={cs.doneBtn}>
            <Text style={cs.doneBtnText}>{t('done')}</Text>
          </Pressable>
          <Pressable onPress={handleShare} style={cs.shareBtn}>
            <Text style={cs.shareBtnText}>{t('share')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const cs = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#000',
    width: 300,
    paddingVertical: 48,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 16,
  },
  header: {
    color: '#555',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 6,
    marginBottom: 28,
  },
  duration: {
    color: '#fff',
    fontSize: 44,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
    marginBottom: 28,
  },
  badges: {
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3,
    textAlign: 'center',
  },
  footer: {
    color: '#333',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 36,
    letterSpacing: 3,
  },
  buttons: {
    flexDirection: 'row',
    marginTop: 32,
    gap: 16,
  },
  doneBtn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
  },
  doneBtnText: {
    color: '#ccc',
    fontSize: 16,
  },
  shareBtn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  shareBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
