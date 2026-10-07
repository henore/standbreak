import {StyleSheet} from 'react-native';

// HOME-only palette: shared Settings and History colors stay unchanged.
export const HomeLightColors = {
  navy: '#123454', muted: '#496579', teal: '#087F78', blue: '#197BA4',
  mint: '#E6F5EF', mintBorder: '#BEDFD2',
  sky: '#EAF4FB', skyBorder: '#C2DEEF',
  panel: '#FAFDFC', panelBorder: '#D5E9E1',
  movePanel: '#FAFCFE', moveBorder: '#D4E5F1',
  surface: '#FFFFFF', coral: '#FFF5F1', coralBorder: '#EED2C9', stop: '#A45142',
  warm: '#FFF6E6', warmBorder: '#EFDFC1', warmText: '#845719',
  inactive: '#647D91', onPrimary: '#FFFFFF',
};

export const HomeDarkColors: typeof HomeLightColors = {
  navy: '#E4F1FB', muted: '#A8C1D0', teal: '#087F78', blue: '#197BA4',
  mint: '#19473F', mintBorder: '#306C5E',
  sky: '#203F59', skyBorder: '#3B6688',
  panel: '#19352F', panelBorder: '#31594E',
  movePanel: '#1A3047', moveBorder: '#355774',
  surface: '#172533', coral: '#4A302D', coralBorder: '#785045', stop: '#F5B5A4',
  warm: '#40351F', warmBorder: '#705B31', warmText: '#F0CC85',
  inactive: '#9DB2C3', onPrimary: '#FFFFFF',
};

export function createHomeStyles(c: typeof HomeLightColors) {
  return StyleSheet.create({
    content: {paddingBottom: 16},
    header: {flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20},
    logo: {width: 38, height: 38, borderRadius: 10},
    title: {color: c.navy, fontSize: 25, fontWeight: '800', letterSpacing: -0.7},
    summaries: {flexDirection: 'row', gap: 12, marginBottom: 16},
    summary: {flex: 1, borderRadius: 20, borderWidth: 1, padding: 14, gap: 12},
    breaks: {backgroundColor: c.mint, borderColor: c.mintBorder},
    move: {backgroundColor: c.sky, borderColor: c.skyBorder},
    summaryHeading: {flexDirection: 'row', alignItems: 'center', gap: 8},
    iconTile: {width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
    breakIcon: {backgroundColor: c.teal},
    moveIcon: {backgroundColor: c.blue},
    label: {flex: 1, color: c.muted, fontSize: 12, lineHeight: 17, fontWeight: '600'},
    value: {color: c.navy, fontSize: 30, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: -0.7},
    // Content-sized: never consume the remaining screen height.
    panel: {alignItems: 'center', borderRadius: 24,
      borderWidth: 1, backgroundColor: c.panel, borderColor: c.panelBorder, paddingVertical: 28, paddingHorizontal: 16, marginBottom: 16},
    movePanel: {backgroundColor: c.movePanel, borderColor: c.moveBorder},
    phase: {color: c.navy, fontSize: 15, fontWeight: '700', letterSpacing: 1, marginBottom: 18},
    digits: {color: c.navy, fontSize: 66, fontWeight: '800', letterSpacing: -2},
    unit: {color: c.muted, fontSize: 22},
    subtitle: {color: c.muted, fontSize: 15, marginTop: 18},
    controls: {marginTop: 26, gap: 8, alignItems: 'stretch'},
    primary: {flex: 1.5, minHeight: 52, paddingVertical: 14, paddingHorizontal: 6, justifyContent: 'center', borderRadius: 15, backgroundColor: c.teal},
    primaryText: {color: c.onPrimary, fontSize: 14, textAlign: 'center'},
    secondary: {flex: 1, backgroundColor: c.surface, borderColor: c.panelBorder},
    secondaryText: {color: c.muted, fontSize: 13, textAlign: 'center'},
    stop: {flex: 1, backgroundColor: c.coral, borderColor: c.coralBorder},
    stopText: {color: c.stop, fontSize: 13, textAlign: 'center'},
    start: {backgroundColor: c.teal, borderRadius: 16, paddingVertical: 16, paddingHorizontal: 40, marginTop: 26},
    streak: {alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.warm,
      borderWidth: 1, borderColor: c.warmBorder, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 10, marginBottom: 6},
    flame: {fontSize: 18},
    streakText: {color: c.warmText, fontSize: 14, fontWeight: '700'},
    tabBar: {backgroundColor: c.surface, borderTopColor: c.panelBorder, paddingTop: 10},
    tabIcon: {width: 52, height: 30, borderRadius: 12, justifyContent: 'center', alignItems: 'center'},
    activeTab: {backgroundColor: c.mint},
    tabLabel: {color: c.inactive, fontSize: 11, marginTop: 4},
    activeLabel: {color: c.teal},
  });
}
