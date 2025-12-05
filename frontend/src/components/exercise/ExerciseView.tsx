'use client';

import { useEffect, useState } from 'react';
import { useExerciseStore } from '@/stores/exerciseStore';
import { useChatStore } from '@/stores/chatStore';
import CodeEditor from './CodeEditor';
import ExerciseResults from './ExerciseResults';

interface ExerciseViewProps {
  exerciseId: string;
}

export default function ExerciseView({ exerciseId }: ExerciseViewProps) {
  const {
    currentExercise,
    editorCode,
    submissionStatus,
    results,
    loadExercise,
    setEditorCode,
    submitCode,
    error,
  } = useExerciseStore();

  const { getHint } = useChatStore();
  const [hintLevel, setHintLevel] = useState(1);

  useEffect(() => {
    loadExercise(exerciseId);
  }, [exerciseId, loadExercise]);

  const handleSubmit = () => {
    if (currentExercise) {
      submitCode(exerciseId, editorCode, currentExercise.type);
    }
  };

  const handleHint = async () => {
    try {
      await getHint(exerciseId, hintLevel, editorCode);
      setHintLevel((prev) => prev + 1);
    } catch (err) {
      console.error('Failed to get hint:', err);
    }
  };

  if (!currentExercise) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">Loading exercise...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* Exercise Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">
          {currentExercise.title}
        </h2>
        <p className="mt-2 text-gray-600">{currentExercise.description}</p>
        <div className="mt-4 rounded-lg bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-900">Task:</p>
          <p className="mt-1 whitespace-pre-wrap text-blue-800">
            {currentExercise.prompt}
          </p>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Code Editor */}
      <div className="flex-1 min-h-[300px]">
        <CodeEditor
          value={editorCode}
          onChange={(value) => setEditorCode(value || '')}
          language={currentExercise.type}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        <button
          onClick={handleSubmit}
          disabled={submissionStatus === 'submitting' || submissionStatus === 'grading'}
          className="rounded-lg bg-primary-600 px-6 py-2 font-medium text-white hover:bg-primary-700 disabled:bg-gray-400"
        >
          {submissionStatus === 'submitting'
            ? 'Submitting...'
            : submissionStatus === 'grading'
            ? 'Grading...'
            : 'Submit Code'}
        </button>

        <button
          onClick={handleHint}
          className="rounded-lg border border-gray-300 px-6 py-2 font-medium text-gray-700 hover:bg-gray-50"
        >
          💡 Get Hint {hintLevel > 1 ? `(${hintLevel})` : ''}
        </button>

        <div className="flex-1" />

        <span className="text-sm text-gray-500">
          Attempts: {currentExercise.user_progress?.attempts || 0} | Best:{' '}
          {currentExercise.user_progress?.best_score || 0}%
        </span>
      </div>

      {/* Results */}
      {submissionStatus === 'completed' && results && (
        <ExerciseResults results={results} />
      )}
    </div>
  );
}
