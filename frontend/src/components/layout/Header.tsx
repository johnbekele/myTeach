'use client';

import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

export default function Header() {
  const { user, logout } = useAuthStore();
  const { focusMode, toggleFocusMode } = useUIStore();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold text-primary-600">MyTeacher</h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* Focus Mode Toggle */}
        <button
          onClick={toggleFocusMode}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            focusMode
              ? 'bg-primary-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {focusMode ? '🎯 Focus On' : '🎯 Focus Off'}
        </button>

        {/* User Menu */}
        {user && (
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">{user.full_name}</span>
            <button
              onClick={() => logout()}
              className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
