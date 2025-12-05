'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useNodeStore } from '@/stores/nodeStore';
import AppLayout from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import DynamicContentRenderer from '@/components/learning/DynamicContentRenderer';
import ChatPanel from '@/components/chat/ChatPanel';

interface LearningContent {
  content_id: string;
  title: string;
  content_type: string;
  sections: Array<{
    heading: string;
    body: string;
    code_example?: string;
    language?: string;
  }>;
  created_at: string;
}

interface Exercise {
  exercise_id: string;
  title: string;
  description: string;
  prompt: string;
  starter_code: string;
  type: string;
  difficulty: string;
}

export default function LearningSessionPage({
  params,
}: {
  params: { nodeId: string };
}) {
  const { nodeId } = params;
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, loadUser } = useAuthStore();
  const { currentNode, selectNode } = useNodeStore();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [content, setContent] = useState<LearningContent | null>(null);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [currentView, setCurrentView] = useState<'content' | 'exercise' | 'loading'>('loading');
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user and node on mount
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      selectNode(nodeId);
    }
  }, [isAuthenticated, nodeId, selectNode]);

  // Load learning session data
  useEffect(() => {
    const loadSessionData = async () => {
      if (!isAuthenticated) return;

      try {
        setIsLoadingData(true);
        setError(null);

        const contentId = searchParams.get('content');
        const exerciseId = searchParams.get('exercise');

        if (contentId) {
          // Load AI-generated content
          const contentData = await api.getDynamicContent(contentId);
          setContent(contentData);
          setCurrentView('content');
        } else if (exerciseId) {
          // Load exercise
          const exerciseData = await api.getExercise(exerciseId);
          setExercise(exerciseData.exercise);
          setCurrentView('exercise');
        } else {
          // No content or exercise ID - show error
          setError('No learning content specified. Please start from the node page.');
        }
      } catch (err: any) {
        console.error('Failed to load learning session:', err);
        setError(err.response?.data?.detail || 'Failed to load learning content');
      } finally {
        setIsLoadingData(false);
      }
    };

    loadSessionData();
  }, [isAuthenticated, searchParams]);

  // Handle exercise completion and navigation
  const handleExerciseComplete = () => {
    // This will be called after exercise submission
    // The AI will provide navigation instructions
    console.log('Exercise completed, awaiting AI instructions');
  };

  const handleNavigateToExercise = (exerciseId: string) => {
    router.push(`/exercise/${exerciseId}`);
  };

  const handleContinueLearning = () => {
    // User clicked "Continue" - can trigger AI to provide next step
    console.log('User wants to continue learning');
  };

  if (authLoading || isLoadingData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading learning session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto mt-8">
          <div className="rounded-lg bg-red-50 border border-red-200 p-6">
            <h2 className="text-xl font-semibold text-red-900 mb-2">Error</h2>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => router.push(`/nodes/${nodeId}`)}
              className="mt-4 rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Back to Node
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            {currentNode?.title || 'Learning Session'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            AI-driven personalized learning
          </p>
        </div>

        {/* Main Content Area */}
        <div className="space-y-6">
          {currentView === 'content' && content && (
            <div>
              <DynamicContentRenderer content={content} />

              {/* Continue Button */}
              <div className="mt-6">
                <button
                  onClick={handleContinueLearning}
                  className="w-full rounded-lg bg-primary-600 py-3 font-medium text-white hover:bg-primary-700"
                >
                  Continue to Practice
                </button>
              </div>
            </div>
          )}

          {currentView === 'exercise' && exercise && (
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800">{exercise.title}</h2>
              <span className="mt-2 inline-block rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                {exercise.difficulty}
              </span>
              <p className="mt-4 text-gray-700">{exercise.description}</p>
              <div className="mt-4 whitespace-pre-wrap text-gray-700 bg-gray-50 rounded p-4">
                {exercise.prompt}
              </div>
              <button
                onClick={() => handleNavigateToExercise(exercise.exercise_id)}
                className="mt-6 w-full rounded-lg bg-primary-600 py-3 font-medium text-white hover:bg-primary-700"
              >
                Start Exercise
              </button>
            </div>
          )}
        </div>

        {/* AI Chat Panel - Always visible */}
        <div className="mt-6" style={{ height: '600px' }}>
          <ChatPanel
            sessionId={sessionId || undefined}
            contextType="learning_session"
            contextId={nodeId}
            onActionReceived={(action) => {
              console.log('AI Action received:', action);
              // Handle navigation actions
              if (action.type === 'show_exercise' && action.data.exercise_id) {
                router.push(`/exercise/${action.data.exercise_id}`);
              } else if (action.type === 'display_content' && action.data.content_id) {
                router.push(`/learn/${nodeId}?content=${action.data.content_id}`);
              }
            }}
          />
        </div>
      </div>
    </AppLayout>
  );
}
