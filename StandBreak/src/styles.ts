import {StyleSheet} from 'react-native';

export type ColorSet = {
  bg: string;
  card: string;
  cardBorder: string;
  cardMint: string;
  cardMintBorder: string;
  cardBlue: string;
  cardBlueBorder: string;
  cardWarm: string;
  cardWarmBorder: string;
  accent: string;
  accentDark: string;
  accentSoft: string;
  navy: string;
  text: string;
  textMuted: string;
  textDim: string;
  danger: string;
  dangerDark: string;
  tabBg: string;
  tabBorder: string;
  inputBg: string;
  inputBorder: string;
  orange: string;
};

export const DarkColors: ColorSet = {
  bg: '#0F1923',
  card: '#172533',
  cardBorder: '#243344',
  cardMint: '#122E24',
  cardMintBorder: '#1E4838',
  cardBlue: '#121E30',
  cardBlueBorder: '#1E3048',
  cardWarm: '#2A2010',
  cardWarmBorder: '#3E3420',
  accent: '#2BB894',
  accentDark: '#132E26',
  accentSoft: '#3EC9A0',
  navy: '#1E3A6E',
  text: '#E4ECF4',
  textMuted: '#7A8BA0',
  textDim: '#4A5568',
  danger: '#E07A6E',
  dangerDark: '#2A1D1A',
  tabBg: '#0D1520',
  tabBorder: '#1A2838',
  inputBg: '#0E1726',
  inputBorder: '#243344',
  orange: '#F5A623',
};

export const LightColors: ColorSet = {
  bg: '#FAFCFB',
  card: '#F7F9FB',
  cardBorder: '#E8EDF2',
  cardMint: '#EDF6F1',
  cardMintBorder: '#C8DFD0',
  cardBlue: '#EDF2F8',
  cardBlueBorder: '#C8D6E4',
  cardWarm: '#FDF3E8',
  cardWarmBorder: '#E8D4B8',
  accent: '#1A9B78',
  accentDark: '#E6F5F0',
  accentSoft: '#2BB894',
  navy: '#1A2B3C',
  text: '#1A2B3C',
  textMuted: '#5A6B7A',
  textDim: '#94A3B3',
  danger: '#E07A6E',
  dangerDark: '#FDF4F2',
  tabBg: '#FAFCFB',
  tabBorder: '#E8EDF2',
  inputBg: '#F2F5F8',
  inputBorder: '#D8E0E8',
  orange: '#E89B1C',
};

export const C = {...DarkColors};

export function getColors(mode: 'light' | 'dark'): ColorSet {
  return mode === 'light' ? LightColors : DarkColors;
}

export function createStyles(c: ColorSet) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    body: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 54,
    },
    loading: {
      color: c.textDim,
      textAlign: 'center',
      marginTop: 100,
    },

    // ── Card ──
    card: {
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.cardBorder,
      padding: 20,
      marginBottom: 12,
    },
    cardSmall: {
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.cardBorder,
      padding: 16,
      marginBottom: 12,
    },

    // ── Timer ──
    headerTitleFit: {
      flexShrink: 1,
    },
    trialLabel: {
      marginLeft: 'auto',
      flexShrink: 0,
      color: c.textMuted,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: '600',
    },
    timerBody: {
      flex: 1,
    },
    timerCard: {
      backgroundColor: c.card,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.cardBorder,
      paddingVertical: 40,
      paddingHorizontal: 32,
      alignItems: 'center',
      width: '100%',
    },
    timerSection: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },
    timer: {
      color: c.text,
      fontSize: 68,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
    timerUnit: {
      color: c.textMuted,
      fontSize: 24,
      fontWeight: '500',
      marginLeft: 2,
    },
    labelSection: {
      marginTop: 16,
      alignItems: 'center',
    },
    phaseLabel: {
      color: c.accent,
      fontSize: 20,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },

    // ── Buttons ──
    button: {
      backgroundColor: c.accent,
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: 60,
      marginTop: 20,
    },
    buttonPressed: {
      opacity: 0.6,
    },
    buttonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
    },
    controlRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 16,
      width: '100%',
    },
    controlBtn: {
      flex: 2,
      backgroundColor: c.accent,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
    },
    controlBtnText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '700',
    },
    controlBtnSkip: {
      flex: 1,
      backgroundColor: c.bg === LightColors.bg ? '#E8EDF2' : '#1A1F2E',
      borderWidth: 1,
      borderColor: c.cardBorder,
    },
    controlBtnSkipText: {
      color: c.textMuted,
      fontSize: 14,
      fontWeight: '600',
    },
    controlBtnStop: {
      flex: 1,
      backgroundColor: c.bg === LightColors.bg ? '#FCEAE6' : '#2A1D1A',
      borderWidth: 1,
      borderColor: c.bg === LightColors.bg ? '#E8B8AE' : '#3A2820',
    },
    controlBtnStopText: {
      color: c.danger,
      fontSize: 14,
      fontWeight: '600',
    },

    // ── Sub screens ──
    subHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 50,
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    subHeaderBack: {
      color: c.accent,
      fontSize: 16,
    },
    subHeaderTitle: {
      color: c.text,
      fontSize: 17,
      fontWeight: '600',
    },
    subBody: {
      flex: 1,
      paddingHorizontal: 16,
    },

    // ── Day chips ──
    dayRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    dayChip: {
      width: 42,
      height: 42,
      borderRadius: 21,
      borderWidth: 1,
      borderColor: c.cardBorder,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dayChipActive: {
      borderColor: c.accent,
      backgroundColor: c.accentDark,
    },
    dayChipText: {
      color: c.textDim,
      fontSize: 12,
      fontWeight: '600',
    },
    dayChipTextActive: {
      color: c.accent,
    },
    scheduleDesc: {
      color: c.textDim,
      fontSize: 13,
      lineHeight: 20,
      marginTop: 4,
    },

    // ── Tab bar ──
    tabBar: {
      flexDirection: 'row',
      backgroundColor: c.tabBg,
      borderTopWidth: 1,
      borderTopColor: c.tabBorder,
      paddingVertical: 8,
      paddingBottom: 20,
    },
    tabItem: {
      flex: 1,
      alignItems: 'center',
    },
    tabIcon: {
      fontSize: 22,
      color: c.textDim,
    },
    tabLabel: {
      fontSize: 10,
      color: c.textDim,
      marginTop: 3,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    tabActive: {
      color: c.accent,
    },
    tabContent: {
      flex: 1,
    },

    // ── Stats ──
    historyContent: {
      paddingBottom: 16,
    },
    historyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 20,
    },
    historyIcon: {
      width: 38,
      height: 38,
      borderRadius: 10,
    },
    historyTitle: {
      fontSize: 25,
      fontWeight: '800',
      letterSpacing: -0.7,
      marginBottom: 0,
    },
    historyCard: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    historyCardLabel: {
      marginTop: 0,
      marginBottom: 6,
    },
    historyValue: {
      fontSize: 22,
      fontWeight: '700',
    },
    historyChart: {
      position: 'relative',
      paddingVertical: 14,
      paddingHorizontal: 12,
      marginBottom: 10,
    },
    historyEmpty: {
      paddingVertical: 22,
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    historyEmptyTitle: {
      marginTop: 0,
    },
    sectionTitle: {
      color: c.text,
      fontSize: 28,
      fontWeight: '700',
      marginBottom: 16,
    },
    emptyTitle: {
      color: c.text,
      fontSize: 17,
      fontWeight: '600',
      textAlign: 'center',
      marginTop: 32,
      marginBottom: 8,
    },
    emptyText: {
      color: c.textDim,
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statsRowItem: {
      alignItems: 'center',
    },
    statsRowValue: {
      color: c.text,
      fontSize: 19,
      fontWeight: '600',
      fontVariant: ['tabular-nums'],
    },
    statsRowLabel: {
      color: c.textMuted,
      fontSize: 12,
      marginTop: 2,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    chartOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: c.bg === LightColors.bg ? 'rgba(255,255,255,0.7)' : 'rgba(15,25,35,0.7)',
      borderRadius: 16,
    },
    chartPopup: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 20,
      alignItems: 'center',
      minWidth: 140,
    },
    chartPopupDate: {
      color: c.textMuted,
      fontSize: 13,
      marginBottom: 6,
    },
    chartPopupValue: {
      color: c.text,
      fontSize: 20,
      fontWeight: '600',
      marginBottom: 4,
    },
    chartPopupSub: {
      color: c.accent,
      fontSize: 14,
    },
    upgradeBlock: {
      backgroundColor: c.card,
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 12,
      marginBottom: 20,
    },
    upgradeText: {
      color: c.textMuted,
      fontSize: 15,
    },

    // ── Settings ──
    settingsScreenContent: {
      paddingBottom: 12,
    },
    settingsScreenHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 20,
    },
    settingsScreenIcon: {
      width: 38,
      height: 38,
      borderRadius: 10,
    },
    settingsScreenTitle: {
      fontSize: 25,
      fontWeight: '800',
      letterSpacing: -0.7,
      marginBottom: 0,
    },
    settingsScreenCard: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      marginBottom: 10,
    },
    settingsScreenSingleRowCard: {
      paddingVertical: 4,
    },
    settingsScreenTrailing: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flexShrink: 1,
    },
    settingsScreenValue: {
      textAlign: 'right',
      flexShrink: 1,
      fontVariant: ['tabular-nums'],
    },
    settingsScreenRow: {
      minHeight: 48,
      paddingVertical: 10,
      gap: 12,
    },
    settingsScreenLabel: {
      marginTop: 2,
      marginBottom: 4,
    },
    settingsScreenDivider: {
      marginVertical: 2,
    },
    settingsScreenCopy: {
      flex: 1,
      minWidth: 0,
    },
    settingsScreenBadge: {
      marginBottom: 4,
    },
    settingsScreenFooter: {
      marginTop: 6,
      marginBottom: 12,
    },
    settingsLabel: {
      color: c.textMuted,
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 10,
      marginTop: 4,
    },
    goalOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    goalOption: {
      borderWidth: 1,
      borderColor: c.cardBorder,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 18,
      backgroundColor: c.inputBg,
    },
    goalOptionActive: {
      borderColor: c.accent,
      backgroundColor: c.accentDark,
    },
    goalOptionText: {
      color: c.textMuted,
      fontSize: 15,
    },
    goalOptionTextActive: {
      color: c.accent,
    },
    settingsHint: {
      color: c.textDim,
      fontSize: 12,
      marginTop: 6,
    },
    settingsDivider: {
      height: 1,
      backgroundColor: c.cardBorder,
      marginVertical: 14,
    },
    settingsInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 12,
    },
    settingsInfoLabel: {
      color: c.text,
      fontSize: 16,
    },
    settingsToggleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
    },
    settingsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
    },
    settingsRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: c.cardBorder,
    },
    settingsRowText: {
      color: c.text,
      fontSize: 16,
    },
    settingsRowArrow: {
      color: c.textDim,
      fontSize: 22,
    },
    settingsRowSub: {
      color: c.textDim,
      fontSize: 12,
      marginTop: 2,
    },
    versionText: {
      color: c.textDim,
      fontSize: 13,
      textAlign: 'center',
      marginTop: 24,
      marginBottom: 40,
    },
    proBadge: {
      backgroundColor: c.orange,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 1,
      marginLeft: 8,
    },
    proBadgeText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
    customInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    customHHMMInput: {
      width: 56,
      backgroundColor: c.inputBg,
      borderRadius: 10,
      color: c.text,
      fontSize: 15,
      textAlign: 'center',
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: c.inputBorder,
    },
    customHHMMLabel: {
      color: c.textMuted,
      fontSize: 14,
      alignSelf: 'center',
    },
    customClearBtn: {
      backgroundColor: c.dangerDark,
      borderRadius: 10,
      width: 32,
      height: 32,
      justifyContent: 'center',
      alignItems: 'center',
    },
    customClearBtnText: {
      color: c.danger,
      fontSize: 14,
      fontWeight: '600',
    },
    customInputBtn: {
      backgroundColor: c.accentDark,
      borderRadius: 10,
      paddingHorizontal: 16,
      justifyContent: 'center',
      paddingVertical: 8,
    },
    customInputBtnText: {
      color: c.accent,
      fontSize: 15,
      fontWeight: '600',
    },

    // ── Modal ──
    modalOverlay: {
      flex: 1,
      backgroundColor: c.bg === LightColors.bg ? 'rgba(0,0,0,0.4)' : 'rgba(15,25,35,0.85)',
      justifyContent: 'center',
      paddingHorizontal: 24,
    },
    modalContent: {
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: c.cardBorder,
      padding: 20,
    },
    modalTitle: {
      color: c.text,
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 16,
    },
    modalCancel: {
      paddingVertical: 10,
      paddingHorizontal: 20,
    },
    modalCancelText: {
      color: c.textMuted,
      fontSize: 15,
    },

    // ── Upgrade card ──
    upgradeCard: {
      backgroundColor: c.accentDark,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.accent,
      paddingVertical: 14,
      paddingHorizontal: 20,
      alignItems: 'center',
      marginTop: 12,
      width: '100%',
    },
    upgradeCardText: {
      color: c.accent,
      fontSize: 15,
      fontWeight: '600',
    },

    timerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    appTitle: {
      color: c.navy,
      fontSize: 24,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    settingsGear: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.inputBg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    settingsGearIcon: {
      fontSize: 20,
      color: c.textMuted,
    },
    phaseTitle: {
      color: c.text,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    timerSubtitle: {
      color: c.textMuted,
      fontSize: 15,
      marginTop: 8,
    },
    statCardBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: c.card,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: c.cardBorder,
      paddingVertical: 14,
      paddingHorizontal: 14,
      gap: 10,
    },
    statCardIcon: {
      fontSize: 22,
    },
    statCardValue: {
      color: c.navy,
      fontSize: 20,
      fontWeight: '800',
    },
    statCardLabel: {
      color: c.textMuted,
      fontSize: 11,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 0.3,
    },
  });
}

export const styles = createStyles(LightColors);
