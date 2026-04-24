import { createTheme } from '@mui/material/styles';

const OUTFIT = '"Outfit", "Inter", sans-serif';
const INTER  = '"Inter", "Roboto", sans-serif';

function components(mode) {
  const isDark = mode === 'dark';
  return {
    MuiCssBaseline: {
      styleOverrides: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { overflow-x: hidden; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${isDark ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.25)'}; border-radius: 99px; }
        ::-webkit-scrollbar-thumb:hover { background: ${isDark ? 'rgba(99,102,241,0.65)' : 'rgba(99,102,241,0.45)'}; }
        @keyframes scanLine {
          0%   { top: -8%; }
          100% { top: 108%; }
        }
        @keyframes floatY {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-14px); }
        }
        @keyframes orbPulse {
          0%,100% { opacity: 0.6; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.08); }
        }
        @keyframes neonRing {
          0%,100% { box-shadow: 0 0 0 0 currentColor; }
          50%      { box-shadow: 0 0 18px 4px currentColor; }
        }
        @keyframes blink {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.25; }
        }
        @keyframes countUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes popScale {
          0%   { transform: scale(1); }
          35%  { transform: scale(1.5); }
          65%  { transform: scale(0.92); }
          100% { transform: scale(1); }
        }
      `,
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: isDark
            ? '0 4px 40px rgba(0,0,0,0.65), 0 1px 0 rgba(255,255,255,0.04) inset'
            : '0 4px 28px rgba(99,102,241,0.12), 0 1px 4px rgba(0,0,0,0.06)',
          border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(99,102,241,0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontFamily: OUTFIT,
          fontWeight: 700,
          fontSize: '0.92rem',
          padding: '11px 24px',
          letterSpacing: '0.02em',
          transition: 'all 0.22s cubic-bezier(0.4,0,0.2,1)',
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)',
          boxShadow: '0 4px 18px rgba(99,102,241,0.45), 0 1px 0 rgba(255,255,255,0.12) inset',
          '&:hover': {
            background: 'linear-gradient(135deg, #4F46E5 0%, #6D28D9 100%)',
            boxShadow: '0 8px 28px rgba(99,102,241,0.58), 0 1px 0 rgba(255,255,255,0.15) inset',
            transform: 'translateY(-2px)',
          },
          '&:active': { transform: 'translateY(0)' },
        },
        outlinedPrimary: {
          borderWidth: '1.5px',
          '&:hover': { borderWidth: '1.5px', transform: 'translateY(-1px)', boxShadow: '0 4px 18px rgba(99,102,241,0.2)' },
        },
        containedError: {
          background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
          boxShadow: '0 4px 16px rgba(239,68,68,0.4)',
          '&:hover': { boxShadow: '0 8px 24px rgba(239,68,68,0.55)', transform: 'translateY(-2px)' },
        },
      },
    },
    MuiChip: {
      styleOverrides: { root: { borderRadius: 8, fontWeight: 600, fontSize: '0.75rem' } },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            transition: 'box-shadow 0.2s ease',
            '&.Mui-focused': { boxShadow: '0 0 0 3px rgba(99,102,241,0.25)' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(129,140,248,0.75)' },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: isDark
            ? 'linear-gradient(135deg, rgba(7,6,18,0.97) 0%, rgba(14,12,32,0.97) 100%)'
            : 'linear-gradient(135deg, #2D2A6E 0%, #4C1D95 100%)',
          boxShadow: isDark
            ? '0 1px 0 rgba(129,140,248,0.12), 0 4px 24px rgba(0,0,0,0.5)'
            : '0 2px 20px rgba(49,46,129,0.4)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        },
      },
    },
    MuiPaper: { styleOverrides: { root: { borderRadius: 14 } } },
    MuiLinearProgress: {
      styleOverrides: { root: { borderRadius: 99 }, bar: { borderRadius: 99 } },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 22,
          ...(isDark && {
            background: 'rgba(8,7,20,0.97)',
            backdropFilter: 'blur(28px)',
            border: '1px solid rgba(99,102,241,0.22)',
          }),
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: '0.72rem',
          fontWeight: 500,
          ...(isDark && {
            background: 'rgba(12,11,28,0.96)',
            border: '1px solid rgba(129,140,248,0.2)',
          }),
        },
      },
    },
  };
}

const typographyBase = {
  fontFamily: INTER,
  h1: { fontFamily: OUTFIT, fontWeight: 900, letterSpacing: '-0.03em' },
  h2: { fontFamily: OUTFIT, fontWeight: 800, letterSpacing: '-0.025em' },
  h3: { fontFamily: OUTFIT, fontWeight: 700, letterSpacing: '-0.02em' },
  h4: { fontFamily: OUTFIT, fontWeight: 700, letterSpacing: '-0.02em' },
  h5: { fontFamily: OUTFIT, fontWeight: 600, letterSpacing: '-0.01em' },
  h6: { fontFamily: OUTFIT, fontWeight: 600 },
  subtitle1: { fontWeight: 500 },
  subtitle2: { fontWeight: 600, letterSpacing: '0.04em' },
  body1: { fontWeight: 400, lineHeight: 1.7 },
  body2: { fontWeight: 400, lineHeight: 1.6 },
  caption: { fontWeight: 400, letterSpacing: '0.02em' },
  button: { fontFamily: OUTFIT, fontWeight: 700, letterSpacing: '0.03em' },
};

export const lightTheme = createTheme({
  typography: typographyBase,
  shape: { borderRadius: 14 },
  palette: {
    mode: 'light',
    primary:    { main: '#6366F1', light: '#818CF8', dark: '#4338CA', contrastText: '#fff' },
    secondary:  { main: '#7C3AED', light: '#A78BFA', dark: '#5B21B6', contrastText: '#fff' },
    error:      { main: '#EF4444', light: '#FCA5A5', dark: '#B91C1C' },
    warning:    { main: '#F59E0B', light: '#FDE68A', dark: '#D97706' },
    success:    { main: '#10B981', light: '#6EE7B7', dark: '#047857' },
    info:       { main: '#06B6D4', light: '#67E8F9', dark: '#0E7490' },
    background: { default: '#F3F2FF', paper: '#FFFFFF' },
    text:       { primary: '#0F0E1A', secondary: '#6B7280' },
    divider:    'rgba(99,102,241,0.12)',
  },
  components: components('light'),
});

export const darkTheme = createTheme({
  typography: typographyBase,
  shape: { borderRadius: 14 },
  palette: {
    mode: 'dark',
    primary:    { main: '#818CF8', light: '#A5B4FC', dark: '#6366F1', contrastText: '#06050F' },
    secondary:  { main: '#A78BFA', light: '#C4B5FD', dark: '#7C3AED', contrastText: '#06050F' },
    error:      { main: '#F87171', light: '#FCA5A5', dark: '#EF4444' },
    warning:    { main: '#FBBF24', light: '#FDE68A', dark: '#F59E0B' },
    success:    { main: '#34D399', light: '#6EE7B7', dark: '#10B981' },
    info:       { main: '#22D3EE', light: '#67E8F9', dark: '#06B6D4' },
    background: { default: '#06050F', paper: '#0C0B1D' },
    text:       { primary: '#EEEEFF', secondary: '#9CA3AF' },
    divider:    'rgba(129,140,248,0.1)',
  },
  components: components('dark'),
});
