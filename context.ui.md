# UI Context File
## Purpose
The UI layer is responsible for rendering the application, managing user interactions, maintaining local client state, and communicating with the backend API. It must stay lightweight and offload all business logic, grading, curriculum logic, and memory management to the backend + AI.

---

## Responsibilities
- Render dual-pane interface:
  - Left: learning pad (content, code editor, exercise results)
  - Right: chat-based AI instructor panel
- Display learning modules (“nodes”), progress, difficulty, prerequisites
- Trigger code execution, exercise submission, and hint requests
- Maintain temporary local UI state only (editor contents, modal visibility)
- Respect ADHD-friendly UI rules:
  - clear step-by-step tasks
  - focus mode
  - minimal text at once

---

## Non-Responsibilities
- No business logic
- No curriculum planning logic
- No grading logic
- No database access
- No AI agent logic
- No vector memory decisions

---

## Required Components
- `ChatPanel`
- `LearningPad`
- `NodeMap`
- `NodeCard`
- `ExerciseEditor`
- `ExerciseResults`
- `ProgressTracker`
- `OnboardingFlow`
- `FocusModeToggle`

---

## Communication Contract
UI communicates with backend ONLY through these REST endpoints:

- `POST /auth/login`
- `POST /auth/register`
- `GET /nodes`
- `GET /nodes/:id`
- `POST /exercise/submit`
- `POST /exercise/hint`
- `POST /chat/message`
- `GET /progress`

All requests return JSON. UI must gracefully handle 4xx/5xx errors with visible feedback.

---

## State Model (Client-Side)
- `currentNode`
- `editorCode`
- `exerciseState`
- `chatMessages`
- `modalState`
- `focusMode`
- `loadingFlags`

---

## UI Tech Stack Recommendation
- React + Next.js
- TailwindCSS
- Zustand or Jotai for client state
- Monaco Editor for code editing
- SWR or React Query for data fetching


