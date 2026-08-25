export type ThemeKey = 'monday-big-cruise' | 'tuesday-too-lit' | 'wednesday-women-cruise' | 'thursday-throwback' | 'friday-new-music' | 'saturday-secret-messages' | 'sunday-wild-out';

export type DailyTheme = {
  key: ThemeKey;
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  name: string;
  energy: string;
  tokens: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    backgroundAlt: string;
    surface: string;
    surfaceRaised: string;
    border: string;
    text: string;
    muted: string;
    shadow: string;
    gradient: string;
  };
  motion: 'steady' | 'playful' | 'retro' | 'pulse' | 'cinematic' | 'wild';
  decorative: 'bolts' | 'memes' | 'petals' | 'pixels' | 'waveform' | 'cipher' | 'sparks';
};

export const dailyThemes: DailyTheme[] = [
  { key: 'monday-big-cruise', day: 'monday', name: 'BIG CRUISE', energy: 'Power • Confidence • Momentum • Leadership', motion: 'steady', decorative: 'bolts', tokens: { primary: '#FFD400', secondary: '#FFB000', accent: '#FFEA00', background: '#050505', backgroundAlt: '#101010', surface: '#151515', surfaceRaised: '#1E1E1E', border: '#2F2F2F', text: '#FFFFFF', muted: '#A1A1AA', shadow: 'rgba(255, 212, 0, 0.24)', gradient: 'linear-gradient(135deg, #FFD400 0%, #FFB000 45%, #FFFFFF 120%)' } },
  { key: 'tuesday-too-lit', day: 'tuesday', name: 'TOO LIT', energy: 'Chaos • Fun • Memes • High Energy', motion: 'playful', decorative: 'memes', tokens: { primary: '#FF6A00', secondary: '#FFD400', accent: '#FFFFFF', background: '#050505', backgroundAlt: '#160900', surface: '#17110C', surfaceRaised: '#24170D', border: '#3A2415', text: '#FFFFFF', muted: '#D4B49A', shadow: 'rgba(255, 106, 0, 0.28)', gradient: 'linear-gradient(135deg, #FF6A00 0%, #FFD400 58%, #FFFFFF 130%)' } },
  { key: 'wednesday-women-cruise', day: 'wednesday', name: 'WOMEN CRUISE', energy: 'Confidence • Elegance • Strength • Expression', motion: 'steady', decorative: 'petals', tokens: { primary: '#D94686', secondary: '#7C2D6D', accent: '#FFD400', background: '#160817', backgroundAlt: '#251024', surface: '#21101F', surfaceRaised: '#31162D', border: '#5B2A50', text: '#FFF7ED', muted: '#E8C6D7', shadow: 'rgba(217, 70, 134, 0.26)', gradient: 'linear-gradient(135deg, #7C2D6D 0%, #D94686 58%, #FFD400 125%)' } },
  { key: 'thursday-throwback', day: 'thursday', name: 'THROWBACK', energy: 'Nostalgia • Retro Internet • Archive Culture', motion: 'retro', decorative: 'pixels', tokens: { primary: '#C66A1D', secondary: '#F5D08A', accent: '#E0B72F', background: '#120D09', backgroundAlt: '#24170F', surface: '#201611', surfaceRaised: '#302119', border: '#5A3C28', text: '#FFF4D6', muted: '#C8A983', shadow: 'rgba(198, 106, 29, 0.24)', gradient: 'linear-gradient(135deg, #C66A1D 0%, #F5D08A 65%, #E0B72F 120%)' } },
  { key: 'friday-new-music', day: 'friday', name: 'NEW MUSIC', energy: 'Music • Nightlife • Sound • Celebration', motion: 'pulse', decorative: 'waveform', tokens: { primary: '#FFEA00', secondary: '#7C3AED', accent: '#EC4899', background: '#050505', backgroundAlt: '#12071F', surface: '#15101B', surfaceRaised: '#21142E', border: '#3B225C', text: '#FFFFFF', muted: '#C7B9DE', shadow: 'rgba(236, 72, 153, 0.28)', gradient: 'linear-gradient(135deg, #FFEA00 0%, #7C3AED 48%, #EC4899 100%)' } },
  { key: 'saturday-secret-messages', day: 'saturday', name: 'SECRET MESSAGES', energy: 'Mystery • Confessions • Conversations • Curiosity', motion: 'cinematic', decorative: 'cipher', tokens: { primary: '#A3A3A3', secondary: '#1D4ED8', accent: '#EAB308', background: '#030712', backgroundAlt: '#07111F', surface: '#111827', surfaceRaised: '#172033', border: '#334155', text: '#F8FAFC', muted: '#B6C1D1', shadow: 'rgba(29, 78, 216, 0.26)', gradient: 'linear-gradient(135deg, #A3A3A3 0%, #1D4ED8 58%, #EAB308 130%)' } },
  { key: 'sunday-wild-out', day: 'sunday', name: 'WILD OUT', energy: 'Chaos • Celebration • Freedom • No Rules', motion: 'wild', decorative: 'sparks', tokens: { primary: '#FFD400', secondary: '#FF6A00', accent: '#00A3FF', background: '#050505', backgroundAlt: '#081018', surface: '#151515', surfaceRaised: '#1D1D1D', border: '#28384A', text: '#FFFFFF', muted: '#B8C6D6', shadow: 'rgba(0, 163, 255, 0.28)', gradient: 'linear-gradient(135deg, #FFD400 0%, #FF6A00 44%, #00A3FF 100%)' } }
];

export function getDailyTheme(date = new Date()): DailyTheme {
  const utcDay = date.getUTCDay();
  const mondayFirstIndex = utcDay === 0 ? 6 : utcDay - 1;
  return dailyThemes[mondayFirstIndex];
}

export function themeCssVariables(theme: DailyTheme): Record<string, string> {
  return {
    '--theme-primary': theme.tokens.primary,
    '--theme-secondary': theme.tokens.secondary,
    '--theme-accent': theme.tokens.accent,
    '--theme-bg': theme.tokens.background,
    '--theme-bg-alt': theme.tokens.backgroundAlt,
    '--theme-surface': theme.tokens.surface,
    '--theme-surface-raised': theme.tokens.surfaceRaised,
    '--theme-border': theme.tokens.border,
    '--theme-text': theme.tokens.text,
    '--theme-muted': theme.tokens.muted,
    '--theme-shadow': theme.tokens.shadow,
    '--theme-gradient': theme.tokens.gradient
  };
}
