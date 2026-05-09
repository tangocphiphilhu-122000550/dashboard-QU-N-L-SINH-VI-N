import React, { useState } from 'react';
import SidebarControl from './SidebarControl';

const X = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const Home = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 12l2-2 7-7 7 7 2 2M5 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0h6"
    />
  </svg>
);

const Layers = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8l5-3 5 3-5 3-5-3zm0 8l5-3 5 3-5 3-5-3zm-2-4l7 4 7-4" />
  </svg>
);

const FileText = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const Sparkles = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 3l1.5 4.5L11 9l-4.5 1.5L5 15l-1.5-4.5L-1 9l4.5-1.5L5 3zm12 6l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3zm-9 8l.75 2.25L11 20l-2.25.75L8 23l-.75-2.25L5 20l2.25-.75L8 17z"
    />
  </svg>
);

const User = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const BarChart3 = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

const SidebarNew = ({ isOpen, onClose, currentPage, setCurrentPage, mode = 'expanded', onModeChange }) => {
  const [isHovered, setIsHovered] = useState(false);

  const navigation = [
    { name: 'Tổng quan', id: 'dashboard', icon: Home },
    { name: 'Khóa học', id: 'courses', icon: Layers },
    { name: 'Bài tập', id: 'exercises', icon: FileText },
    { name: 'Lỗi & Phản hồi', id: 'feedback', icon: Sparkles },
    { name: 'Kỹ năng mềm', id: 'skills', icon: Sparkles },
    { name: 'Hồ sơ', id: 'profile', icon: User },
  ];

  const handleNavigate = (id) => {
    setCurrentPage(id);
    onClose();
  };

  const isHoverMode = mode === 'hover';
  const isCollapsed = mode === 'collapsed' || isHoverMode;
  const showText = mode === 'expanded' || (isHoverMode && isHovered);

  return (
    <>
      {isOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />
        </div>
      ) : null}

      <div
        className={`fixed inset-y-0 left-0 z-50 flex max-h-screen flex-col overflow-visible rounded-none border-r border-white/40 bg-white/35 shadow-glass backdrop-blur-2xl transition-all duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:inset-y-0 lg:left-0 lg:max-h-screen lg:translate-x-0 ${
          isCollapsed && !showText ? 'lg:w-20' : 'w-[min(88vw,320px)] sm:w-72 lg:w-64'
        }`}
        onMouseEnter={() => {
          if (isHoverMode) setIsHovered(true);
        }}
        onMouseLeave={() => {
          if (isHoverMode) setIsHovered(false);
        }}
      >
        <div className="flex items-center justify-between px-4 py-5">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-white/60 bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <BarChart3 className="h-5 w-5 text-primary-600" />
            </div>
            {showText ? (
              <div className="min-w-0">
                <span className="block text-base font-bold text-slate-900">Luyện Code</span>
              </div>
            ) : null}
          </div>

          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-xl p-2 text-slate-600 hover:bg-white/60 hover:text-slate-900 lg:hidden"
          >
            <X />
          </button>
        </div>

        <div className="mx-4 border-t border-slate-200/80" />

        <nav className="mt-5 flex-1 px-3">
          <ul className="space-y-1">
            {navigation.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigate(item.id)}
                  className={`group relative flex w-full items-center rounded-2xl px-3 py-3 text-sm font-medium transition-all ${
                    currentPage === item.id
                      ? 'bg-white/75 text-primary-700 shadow-[0_10px_35px_rgba(24,86,255,0.14)]'
                      : 'text-slate-700 hover:bg-white/55 hover:text-slate-900'
                  }`}
                  title={!showText ? item.name : ''}
                >
                  <item.icon
                    className={`h-5 w-5 flex-shrink-0 ${
                      currentPage === item.id ? 'text-primary-600' : 'text-slate-400 group-hover:text-slate-600'
                    }`}
                  />
                  {showText ? <span className="ml-3 min-w-0 flex-1 text-left leading-5">{item.name}</span> : null}
                  {currentPage === item.id ? (
                    <div className="absolute right-1.5 top-1/2 h-[70%] w-1.5 -translate-y-1/2 rounded-full bg-primary-500" />
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-auto px-3 pb-4 pt-3">
          <div className={`${showText ? 'flex justify-start' : 'flex justify-center'}`}>
            <SidebarControl mode={mode} onModeChange={onModeChange} compact />
          </div>
        </div>
      </div>
    </>
  );
};

export default SidebarNew;
