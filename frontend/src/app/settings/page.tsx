'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import AppLayout from '@/components/layout/AppLayout';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, loadUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Profile settings
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  // Learning preferences
  const [pacePreference, setPacePreference] = useState('medium');
  const [adhdMode, setAdhdMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [breakReminders, setBreakReminders] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setEmail(user.email || '');
      setPacePreference(user.settings?.pace_preference || 'medium');
      setAdhdMode(user.settings?.adhd_mode || false);
      setFocusMode(user.settings?.focus_mode || false);
      setBreakReminders(user.settings?.break_reminders !== false);
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await api.updateProfile({ full_name: fullName });
      await loadUser();
      setMessage('Profile updated successfully!');
    } catch (error: any) {
      setMessage(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await api.updateSettings({
        pace_preference: pacePreference,
        adhd_mode: adhdMode,
        focus_mode: focusMode,
        break_reminders: breakReminders,
      });
      await loadUser();
      setMessage('Preferences saved successfully!');
    } catch (error: any) {
      setMessage(error.response?.data?.detail || 'Failed to save preferences');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-full items-center justify-center">
          <p>Loading...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Settings</h1>

        {message && (
          <div
            className={`rounded-lg p-4 ${
              message.includes('success')
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {message}
          </div>
        )}

        {/* Profile Settings */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-gray-800">Profile</h2>
          <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                disabled
                className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-gray-600"
              />
              <p className="mt-1 text-xs text-gray-500">
                Email cannot be changed
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary-600 px-6 py-2 font-medium text-white hover:bg-primary-700 disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Learning Preferences */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Learning Preferences
          </h2>
          <form onSubmit={handleSavePreferences} className="mt-6 space-y-6">
            {/* Pace Preference */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Learning Pace
              </label>
              <select
                value={pacePreference}
                onChange={(e) => setPacePreference(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="slow">Slow - Take your time</option>
                <option value="medium">Medium - Balanced pace</option>
                <option value="fast">Fast - Quick progression</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                How quickly you want to progress through content
              </p>
            </div>

            {/* ADHD Mode */}
            <div className="flex items-start">
              <input
                type="checkbox"
                id="adhd-mode"
                checked={adhdMode}
                onChange={(e) => setAdhdMode(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div className="ml-3">
                <label
                  htmlFor="adhd-mode"
                  className="font-medium text-gray-700"
                >
                  ADHD-Friendly Mode
                </label>
                <p className="text-sm text-gray-500">
                  Extra visual cues, smaller chunks, and more frequent rewards
                </p>
              </div>
            </div>

            {/* Focus Mode */}
            <div className="flex items-start">
              <input
                type="checkbox"
                id="focus-mode"
                checked={focusMode}
                onChange={(e) => setFocusMode(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div className="ml-3">
                <label
                  htmlFor="focus-mode"
                  className="font-medium text-gray-700"
                >
                  Focus Mode
                </label>
                <p className="text-sm text-gray-500">
                  Hide distractions and show only essential content
                </p>
              </div>
            </div>

            {/* Break Reminders */}
            <div className="flex items-start">
              <input
                type="checkbox"
                id="break-reminders"
                checked={breakReminders}
                onChange={(e) => setBreakReminders(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <div className="ml-3">
                <label
                  htmlFor="break-reminders"
                  className="font-medium text-gray-700"
                >
                  Break Reminders
                </label>
                <p className="text-sm text-gray-500">
                  Get reminded to take breaks every 45 minutes
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary-600 px-6 py-2 font-medium text-white hover:bg-primary-700 disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </form>
        </div>

        {/* Account Actions */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-gray-800">Account</h2>
          <div className="mt-6 space-y-3">
            <button
              onClick={() => {
                if (confirm('Are you sure you want to log out?')) {
                  useAuthStore.getState().logout();
                  router.push('/login');
                }
              }}
              className="rounded-lg border border-red-300 px-6 py-2 font-medium text-red-600 hover:bg-red-50"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
