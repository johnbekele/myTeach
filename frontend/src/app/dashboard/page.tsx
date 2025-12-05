'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/layout/AppLayout';

export default function DashboardPage() {
  const { isAuthenticated, isLoading, loadUser, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome back, {user?.full_name}! 👋
        </h1>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-lg bg-primary-50 p-6">
            <h3 className="text-lg font-semibold text-primary-900">
              Your Progress
            </h3>
            <p className="mt-2 text-3xl font-bold text-primary-600">0%</p>
            <p className="mt-1 text-sm text-primary-700">
              Start your first module to begin learning
            </p>
          </div>

          <div className="rounded-lg bg-green-50 p-6">
            <h3 className="text-lg font-semibold text-green-900">
              Exercises Completed
            </h3>
            <p className="mt-2 text-3xl font-bold text-green-600">0</p>
            <p className="mt-1 text-sm text-green-700">
              Complete exercises to build your skills
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Getting Started
          </h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">📚</span>
              <div>
                <h4 className="font-medium text-gray-800">Explore Learning Path</h4>
                <p className="text-sm text-gray-600">
                  Browse available modules and choose what to learn
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-2xl">💬</span>
              <div>
                <h4 className="font-medium text-gray-800">Chat with AI Mentor</h4>
                <p className="text-sm text-gray-600">
                  Ask questions anytime on the right panel
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-2xl">🎯</span>
              <div>
                <h4 className="font-medium text-gray-800">Enable Focus Mode</h4>
                <p className="text-sm text-gray-600">
                  Toggle focus mode for distraction-free learning
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
