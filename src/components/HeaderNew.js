import React, { useEffect, useMemo, useRef, useState } from 'react';

const Menu = () => (
  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const Bell = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
);

const Search = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const User = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LogOut = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);

const mockNotifications = [
  {
    id: 'noti-01',
    title: 'Đã mở bài kiểm tra cấp 3',
    description: 'Bạn đã hoàn thành đủ bài luyện của cấp hiện tại. Có thể vào làm bài kiểm tra ngay.',
    time: '5 phút trước',
    unread: true,
  },
  {
    id: 'noti-02',
    title: 'Có bài nên làm hôm nay',
    description: 'Hệ thống đang gợi ý một bài luyện về DFS/BFS để giữ nhịp tiến độ của bạn.',
    time: '30 phút trước',
    unread: true,
  },
  {
    id: 'noti-03',
    title: 'Phản hồi mới sau lần nộp gần nhất',
    description: 'Bạn vừa có thêm góp ý về nhánh xử lý lỗi đầu vào trong bài đã nộp.',
    time: 'Hôm nay',
    unread: false,
  },
];

const getDisplayName = (authUser) => authUser?.full_name || authUser?.fullName || 'Tài khoản';

const getDisplayEmail = (authUser) => authUser?.email || authUser?.mssv || 'Chưa có thông tin';

const normalizeSearchText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const highlightMatch = (text, query) => {
  if (!text) return '';
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, index) => 
        regex.test(part) ? (
          <mark key={index} className="bg-yellow-200 text-yellow-950 rounded-md font-bold px-1 py-0.5 shadow-sm">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

const HeaderNew = ({ onMenuClick, currentPage, authUser, onLogout, onProfileClick, searchItems = [], onSearchSelect }) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);
  const searchRef = useRef(null);

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('training:notifications');
    return saved ? JSON.parse(saved) : mockNotifications;
  });

  const unreadNotificationCount = useMemo(
    () => notifications.filter((notification) => notification.unread).length,
    [notifications]
  );

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, unread: false }));
    setNotifications(updated);
    localStorage.setItem('training:notifications', JSON.stringify(updated));
  };

  const markAsRead = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, unread: false } : n);
    setNotifications(updated);
    localStorage.setItem('training:notifications', JSON.stringify(updated));
    setNotificationOpen(false);
  };

  const searchResults = useMemo(() => {
    const normalizedQuery = normalizeSearchText(searchQuery);

    if (!normalizedQuery) {
      return [];
    }

    return searchItems
      .map((item) => {
        const titleValue = normalizeSearchText(item.title);
        const subtitleValue = normalizeSearchText(item.subtitle);
        let score = 0;

        if (titleValue.startsWith(normalizedQuery)) {
          score = 120;
        } else if (titleValue.includes(normalizedQuery)) {
          score = 90;
        } else if (subtitleValue.includes(normalizedQuery)) {
          score = 65;
        } else if (item.searchValue?.includes(normalizedQuery)) {
          score = 40;
        }

        return score ? { ...item, score } : null;
      })
      .filter(Boolean)
      .sort((left, right) => right.score - left.score || left.title.length - right.title.length)
      .slice(0, 8);
  }, [searchItems, searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }

      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }

      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutClick = async () => {
    setUserMenuOpen(false);
    if (onLogout) {
      await onLogout();
    }
  };

  const handleSearchItemClick = (item) => {
    setSearchQuery('');
    setSearchOpen(false);
    if (onSearchSelect) {
      onSearchSelect(item);
    }
  };

  return (
    <header className="relative z-40 isolate overflow-visible border-b border-white/45 bg-white/65 shadow-glass lg:border">
      <div className="flex min-h-[72px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center space-x-3">
          <button
            onClick={onMenuClick}
            className="rounded-2xl p-2 text-slate-600 transition-colors hover:bg-white/60 hover:text-slate-900 lg:hidden"
          >
            <Menu />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-slate-900">
              {currentPage?.title || 'Dashboard luyện tập'}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="hidden items-center xl:flex">
            <div className="relative" ref={searchRef}>
              <div className="glass-search relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm bài tập, kỹ năng, mức độ..."
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setSearchOpen(true);
                  setActiveIndex(-1);
                }}
                onFocus={() => {
                  if (searchQuery.trim()) {
                    setSearchOpen(true);
                  }
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setSearchOpen(false);
                  } else if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    setActiveIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
                  } else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    setActiveIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
                  } else if (event.key === 'Enter') {
                    event.preventDefault();
                    if (activeIndex >= 0 && activeIndex < searchResults.length) {
                      handleSearchItemClick(searchResults[activeIndex]);
                    } else if (searchResults.length > 0) {
                      handleSearchItemClick(searchResults[0]);
                    }
                  }
                }}
                className="w-80 bg-transparent py-3 pl-10 pr-4 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
              </div>

              {searchOpen && searchQuery.trim() ? (
                <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-[90] overflow-hidden rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(239,246,255,0.98),rgba(255,255,255,0.94))] shadow-[0_24px_60px_rgba(15,23,42,0.14)] backdrop-blur-2xl">
                  {searchQuery.trim().length < 2 ? (
                    <div className="px-4 py-4 text-xs font-semibold text-amber-600 flex items-center gap-2 bg-amber-50/45 border-b border-amber-100">
                      <span>⚠️</span>
                      <span>Vui lòng nhập tối thiểu 2 ký tự để bắt đầu tìm kiếm.</span>
                    </div>
                  ) : searchResults.length ? (
                    <div className="max-h-[360px] overflow-y-auto py-2">
                      {searchResults.map((item, index) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSearchItemClick(item)}
                          className={`flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition-colors ${
                            index === activeIndex
                              ? 'bg-primary-50/95 border-l-4 border-primary-500 pl-3'
                              : 'hover:bg-blue-50/80'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {highlightMatch(item.title, searchQuery)}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {highlightMatch(item.subtitle, searchQuery)}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-primary-700">
                            {item.kind}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-4 text-sm text-slate-500">Không tìm thấy mục phù hợp với từ khóa này.</div>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          <div className="relative z-50" ref={notificationRef}>
            <button
              onClick={() => setNotificationOpen((value) => !value)}
              className="relative rounded-2xl border border-white/55 bg-white/55 p-3 text-slate-600 transition-colors hover:bg-white/70 hover:text-slate-900"
            >
              <Bell />
              {unreadNotificationCount ? (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                  {unreadNotificationCount}
                </span>
              ) : null}
            </button>

            {notificationOpen ? (
              <div className="absolute right-0 z-[80] mt-2 w-80 overflow-hidden rounded-3xl border border-white/55 bg-white/82 py-2 shadow-glass backdrop-blur-2xl">
                <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Thông báo</p>
                    <p className="text-xs text-slate-500">Các nhắc nhở và cập nhật hệ thống</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-600">
                    {unreadNotificationCount} mới
                  </span>
                </div>

                {unreadNotificationCount > 0 ? (
                  <div className="flex justify-end border-b border-slate-200/40 px-4 py-2 bg-slate-50/50">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAllAsRead();
                      }}
                      className="text-[11px] font-semibold text-primary-600 hover:text-primary-700 hover:underline"
                    >
                      Đánh dấu tất cả đã đọc
                    </button>
                  </div>
                ) : null}

                <div className="max-h-[384px] overflow-y-auto py-1">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-slate-500">
                      Không có thông báo nào
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => markAsRead(notification.id)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-primary-50/60 ${
                          notification.unread ? 'bg-slate-50/45' : ''
                        }`}
                      >
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                            notification.unread ? 'bg-primary-500' : 'bg-slate-300'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className={`text-sm font-semibold text-slate-900 ${notification.unread ? 'text-primary-800' : 'text-slate-700'}`}>
                              {notification.title}
                            </p>
                            <span className="shrink-0 text-[11px] text-slate-400">{notification.time}</span>
                          </div>
                          <p className="mt-1 text-xs leading-5 text-slate-600">{notification.description}</p>
                          {notification.unread ? (
                            <div className="mt-2 flex items-center gap-1.5">
                              <span className="rounded bg-rose-50 px-2 py-0.5 text-[9px] font-bold text-rose-600 ring-1 ring-inset ring-rose-500/10">
                                Chưa đọc
                              </span>
                            </div>
                          ) : null}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>

          <div className="relative z-50" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen((value) => !value)}
              className="flex items-center space-x-3 rounded-2xl border border-white/55 bg-white/55 px-3 py-2 transition-colors hover:bg-white/70"
            >
              <div className="hidden text-right md:block">
                <p className="text-sm font-semibold text-slate-900">{getDisplayName(authUser)}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-cyan-400 shadow-[0_12px_28px_rgba(24,86,255,0.25)]">
                <User className="h-5 w-5 text-white" />
              </div>
            </button>

            {userMenuOpen ? (
              <div className="absolute right-0 z-[80] mt-2 w-64 rounded-3xl border border-white/55 bg-white/80 py-2 shadow-glass backdrop-blur-2xl">
                <div className="border-b border-slate-200/70 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-900">{getDisplayName(authUser)}</p>
                  <p className="text-xs text-slate-500">{getDisplayEmail(authUser)}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      if (onProfileClick) {
                        onProfileClick();
                      }
                    }}
                    className="flex w-full items-center px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-blue-50/80 hover:text-primary-700"
                  >
                    <User className="mr-3 h-4 w-4 text-slate-400" />
                    <span>Hồ sơ</span>
                  </button>
                </div>

                <div className="border-t border-slate-200/70 py-1">
                  <button
                    onClick={handleLogoutClick}
                    className="flex w-full items-center px-4 py-2.5 text-sm text-danger-600 transition-colors hover:bg-rose-50/80 hover:text-rose-700"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderNew;
