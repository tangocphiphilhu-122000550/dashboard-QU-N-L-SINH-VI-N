import React from 'react';
import { studentInfo } from '../data/data';
import DarkModeToggle from './DarkModeToggle';

const Header = ({ currentPage, setCurrentPage, darkMode, setDarkMode }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: '📊' },
    { id: 'courses', label: 'Khóa học', icon: '📖' },
    { id: 'exercises', label: 'Bài tập', icon: '📚' },
    { id: 'feedback', label: 'Lỗi & Phản hồi', icon: '🐛' },
    { id: 'skills', label: 'Kỹ năng mềm', icon: '💬' },
    { id: 'profile', label: 'Hồ sơ', icon: '👤' }
  ];

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Beginner':
        return 'bg-blue-100 text-blue-800';
      case 'Intermediate':
        return 'bg-purple-100 text-purple-800';
      case 'Advanced':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      {/* Header chính */}
      <header className="header-gradient sticky top-0 z-40 transition-all duration-300">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Badges & Dark Mode - Bên trái */}
            <div className="flex items-center space-x-3">
              <div className={`badge ${getLevelColor(studentInfo.level)}`}>
                {studentInfo.level}
              </div>
              <div className={`badge border ${getRiskLevelColor(studentInfo.riskLevel)}`}>
                Nguy cơ: {studentInfo.riskLevel}
              </div>
              <DarkModeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
            </div>

            {/* Thông tin sinh viên - Bên phải */}
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">{studentInfo.name}</h2>
                <div className="flex items-center justify-end space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>{studentInfo.class}</span>
                  <span>•</span>
                  <span>{studentInfo.course}</span>
                </div>
              </div>
              <img
                src={studentInfo.avatar}
                alt={studentInfo.name}
                className="w-12 h-12 rounded-full border-2 border-primary-500"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <div className="md:hidden mobile-nav-gradient sticky top-[73px] z-30 transition-all duration-300">
        <div className="flex overflow-x-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors ${
                currentPage === item.id
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Header;

