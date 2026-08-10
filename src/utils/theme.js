export const createTheme = (isDark) => ({
  bg: isDark ? 'bg-slate-900' : 'bg-gray-50',
  card: isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100',
  text: isDark ? 'text-slate-100' : 'text-gray-800',
  textMuted: isDark ? 'text-slate-400' : 'text-gray-500',
  border: isDark ? 'border-slate-700' : 'border-gray-200',
  hover: isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-50',
  input: isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'
});
