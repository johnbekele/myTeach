'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useNodeStore } from '@/stores/nodeStore';
import AppLayout from '@/components/layout/AppLayout';

export default function NodeDetailPage({
  params,
}: {
  params: { nodeId: string };
}) {
  const { nodeId } = params;
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();
  const { currentNode, selectNode, startNode } = useNodeStore();
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      selectNode(nodeId);
    }
  }, [isAuthenticated, nodeId, selectNode]);

  const handleStartNode = async () => {
    await startNode(nodeId);
    // Reload node to get updated status
    selectNode(nodeId);
  };

  if (isLoading || !currentNode) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            {currentNode.title}
          </h1>
          <p className="mt-2 text-gray-600">{currentNode.description}</p>

          <div className="mt-4 flex items-center space-x-4">
            <span
              className={`rounded-full px-3 py-1 text-sm ${
                currentNode.difficulty === 'beginner'
                  ? 'bg-green-100 text-green-700'
                  : currentNode.difficulty === 'intermediate'
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {currentNode.difficulty}
            </span>
            <span className="text-sm text-gray-500">
              {currentNode.estimated_duration} minutes
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800">Introduction</h2>
          <p className="mt-3 text-gray-700">{currentNode.content.introduction}</p>

          <h3 className="mt-6 text-lg font-semibold text-gray-800">
            What You'll Learn
          </h3>
          <ul className="mt-3 list-inside list-disc space-y-1 text-gray-700">
            {currentNode.content.concepts.map((concept, idx) => (
              <li key={idx}>{concept}</li>
            ))}
          </ul>

          <h3 className="mt-6 text-lg font-semibold text-gray-800">
            Practical Applications
          </h3>
          <ul className="mt-3 list-inside list-disc space-y-1 text-gray-700">
            {currentNode.content.practical_applications.map((app, idx) => (
              <li key={idx}>{app}</li>
            ))}
          </ul>
        </div>

        {/* Exercises */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800">Exercises</h2>
          <div className="mt-4 space-y-3">
            {currentNode.exercises?.map((exercise) => (
              <button
                key={exercise.exercise_id}
                onClick={() => router.push(`/exercise/${exercise.exercise_id}`)}
                className="flex w-full items-center justify-between rounded-lg border border-gray-300 p-4 text-left hover:border-primary-500 hover:shadow-sm"
              >
                <div>
                  <h3 className="font-medium text-gray-800">
                    {exercise.title}
                  </h3>
                  <p className="text-sm text-gray-500">{exercise.difficulty}</p>
                </div>
                {exercise.completed && (
                  <span className="text-2xl">✅</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleStartNode}
          className="w-full rounded-lg bg-primary-600 py-3 font-medium text-white hover:bg-primary-700"
        >
          Start Learning
        </button>
      </div>
    </AppLayout>
  );
}
