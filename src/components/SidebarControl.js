import React, { useEffect, useRef, useState } from 'react';

const PanelLeftDashed = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M9 14v1" />
    <path d="M9 19v2" />
    <path d="M9 3v2" />
    <path d="M9 9v1" />
  </svg>
);

const Check = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const ChevronUpDown = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m7 15 5 5 5-5" />
    <path d="m7 9 5-5 5 5" />
  </svg>
);

const SidebarControl = ({ mode, onModeChange, compact = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const modes = [
    { value: 'expanded', label: 'Expanded' },
    { value: 'collapsed', label: 'Collapsed' },
    { value: 'hover', label: 'Expand on hover' },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleModeSelect = (value) => {
    onModeChange(value);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((value) => !value)}
        className={`group flex items-center border border-white/45 bg-white/60 text-slate-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] transition-all hover:bg-white/80 hover:text-slate-900 ${
          compact ? 'h-8 w-8 justify-center rounded-lg' : 'h-10 w-full justify-between rounded-xl px-3'
        }`}
        title="Sidebar control"
      >
        <span className={`flex items-center ${compact ? '' : 'gap-2'}`}>
          <PanelLeftDashed className="h-4 w-4" />
          {!compact ? <span className="text-sm font-medium text-slate-700">Sidebar control</span> : null}
        </span>
        {!compact ? <ChevronUpDown className="h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-slate-600" /> : null}
      </button>

      {isOpen ? (
        <div
          className={`absolute z-50 w-56 rounded-2xl border border-blue-200/60 bg-[linear-gradient(180deg,rgba(239,246,255,0.96),rgba(255,255,255,0.88))] py-2 shadow-[0_18px_45px_rgba(59,130,246,0.16)] backdrop-blur-2xl ${
            compact ? 'bottom-full left-0 mb-2' : 'bottom-full left-0 mb-2'
          }`}
        >
          <div className="border-b border-blue-100/80 px-4 py-3 text-sm text-slate-500">Sidebar control</div>

          {modes.map((item) => (
            <button
              key={item.value}
              onClick={() => handleModeSelect(item.value)}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-blue-50/75"
            >
              <span className={`h-2.5 w-2.5 rounded-full ${mode === item.value ? 'bg-slate-500' : 'bg-slate-200'}`} />
              <span className="flex-1 text-left">{item.label}</span>
              {mode === item.value ? <Check className="h-4 w-4 text-primary-600" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default SidebarControl;
