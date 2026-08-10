import React from 'react';
import { IconHome, IconList, IconCalendar, IconTarget, IconCamera, IconBrain, IconDollar, IconCrown, IconSun, IconMoon } from './icons';

export default function Navigation({
  activeTab,
  setActiveTab,
  isDark,
  setIsDark,
  sessionUser,
  onLogout,
  theme,
}) {
  const tabs = [
    { id: 'dashboard', icon: <IconHome />, label: 'Dashboard' },
    { id: 'transactions', icon: <IconList />, label: 'Ledger' },
    { id: 'bills', icon: <IconCalendar />, label: 'Bills' },
    { id: 'goals', icon: <IconTarget />, label: 'Goals' },
    { id: 'scanner', icon: <IconCamera />, label: 'Scan' },
    { id: 'advisor', icon: <IconBrain />, label: 'AI Advisor' },
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border-t md:relative md:w-64 md:border-t-0 md:border-r md:h-screen md:flex-shrink-0 z-50 shadow-lg md:shadow-none transition-colors`}>
      <div className="flex md:flex-col items-center md:items-stretch md:justify-start h-16 md:h-full px-2 md:p-6 gap-1 md:gap-2 overflow-x-auto md:overflow-visible">
        <div className="hidden md:flex items-center justify-between gap-3 mb-8 px-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white"><IconDollar /></div>
            <h1 className={`text-xl font-bold ${theme.text}`}>WealthMate</h1>
          </div>
        </div>

        <div className="hidden md:flex mx-2 mb-6 p-3 rounded-xl bg-gradient-to-r from-amber-200 to-amber-400 text-amber-900 items-center gap-3 shadow-lg shadow-amber-500/20">
          <IconCrown />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider">Premium Active</p>
            <p className="text-[10px] opacity-80 font-medium">All features unlocked</p>
          </div>
        </div>

        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col md:flex-row items-center justify-center md:justify-start px-2 md:px-4 py-2 rounded-xl min-w-[68px] md:min-w-0 md:w-full md:flex-none transition-all ${
              activeTab === tab.id
                ? 'text-indigo-500 bg-indigo-500/10 font-semibold'
                : `${theme.textMuted} ${theme.hover}`
            }`}
          >
            <div className="mb-1 md:mb-0 md:mr-3">{tab.icon}</div>
            <span className="text-[10px] leading-none md:text-sm md:leading-normal whitespace-nowrap">{tab.label}</span>
          </button>
        ))}

        <div className="hidden md:flex mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="w-full space-y-2">
            <p className={`text-xs px-2 ${theme.textMuted}`}>Signed in as {sessionUser}</p>
            <button onClick={() => setIsDark(!isDark)} className={`w-full flex items-center justify-center gap-2 p-2 rounded-lg ${theme.hover} ${theme.textMuted}`}>
              {isDark ? <IconSun /> : <IconMoon />}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <button onClick={onLogout} className="w-full p-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors text-sm">
              Log out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
