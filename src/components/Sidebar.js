import React from 'react';

const Sidebar = ({ currentPage, setCurrentPage, darkMode }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: '📊' },
    { id: 'courses', label: 'Khóa học', icon: '📖' },
    { id: 'exercises', label: 'Bài tập', icon: '📚' },
    { id: 'feedback', label: 'Lỗi & Phản hồi', icon: '🐛' },
    { id: 'skills', label: 'Kỹ năng mềm', icon: '💬' },
    { id: 'profile', label: 'Hồ sơ', icon: '👤' }
  ];

  return (
    <aside className="w-64 shadow-lg h-screen sticky top-0 hidden md:block transition-all duration-300 sidebar-gradient">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xl font-bold logo-gradient">
            SL
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-800 dark:text-white">Student</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">Learning Dashboard</p>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 transition-all duration-200 ${
                currentPage === item.id
                  ? 'menu-item-active text-primary-700 dark:text-primary-300 bg-primary-100/80 dark:bg-primary-900/30 border-r-4 border-primary-600 dark:border-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700 border-r-4 border-transparent'
              }`}
              style={{ borderRadius: '10px' }}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200/50 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          <p>© 2025 Student Dashboard</p>
          <p className="mt-1 text-primary-600 dark:text-primary-400 font-semibold">Version 1.0.0</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

