import { Platform, type ViewStyle } from 'react-native';

// Design tokens — SpeakReadyMY design handoff

export const C = {
  ink: '#1A1714',
  ink2: '#3B342D',
  muted: '#8A8278',
  muted2: '#B8B0A4',
  paper: '#F5F0E6',
  paper2: '#EFEAE0',
  card: '#FFFFFF',
  line: '#E6DFD2',
  line2: '#D9D1C0',
  accent: '#E15A3C',
  accentSoft: '#FBE3DC',
  sage: '#5B7A5B',
  sageSoft: '#DCE6D9',
  gold: '#C99A3F',
  goldSoft: '#F4E9CE',
  indigo: '#2E3A8C',
  indigoSoft: '#DCDFF1',
  rose: '#B84A55',
} as const;

export const spacing = {
  screenH: 20,
  cardPad: 16,
  gap: { xs: 8, sm: 10, md: 14 },
} as const;

export const radius = {
  pill: 999,
  chip: 999,
  cardSm: 14,
  cardMd: 16,
  cardLg: 22,
} as const;

const nativeShadow = {
  cardSubtle: {
    shadowColor: '#140F05',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardFloat: {
    shadowColor: '#140F05',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  micCta: {
    shadowColor: '#E15A3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
} as const satisfies Record<string, ViewStyle>;

const webShadow = {
  cardSubtle: {
    boxShadow: '0 1px 2px rgba(20, 15, 5, 0.04)',
  },
  cardFloat: {
    boxShadow: '0 8px 24px rgba(20, 15, 5, 0.08)',
  },
  micCta: {
    boxShadow: '0 4px 14px rgba(225, 90, 60, 0.4)',
  },
} as const satisfies Record<keyof typeof nativeShadow, ViewStyle>;

export const shadow = Platform.OS === 'web' ? webShadow : nativeShadow;

export const type = {
  hero: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.84 },
  sectionH: { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.4 },
  body: { fontSize: 14, fontWeight: '500' as const },
  caption: { fontSize: 11, fontWeight: '600' as const },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 1.1,
    textTransform: 'uppercase' as const,
    color: C.muted,
  },
  monoMeta: { fontSize: 10, fontFamily: 'IBMPlexMono' },
} as const;
