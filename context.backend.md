# Backend Context File
## Purpose
The backend provides:
- user/session management
- curriculum storage and retrieval
- exercise generation & grading orchestration
- AI message routing
- vector memory operations
- secure code execution sandboxing

Backend is NOT responsible for rendering UI.

---

## Responsibilities
- Expose REST API endpoints for:
  - onboarding
  - curriculum modules & node map
  - exercise generation & grading
  - chat messages
  - progress & memory retrieval
- Store all long-term data:
  - users
  - learning nodes
  - exercises
  - attempts
  - long-term AI memory
  - onboarding results
- Run worker processes:
  - code execution in sandbox
  - exercise grading
  - AI chain-of-thought & reasoning orchestration
- Provide sanitized outputs to UI only

---

## Non-Responsibilities
- No front-end rendering
- No UI layout logic
- No direct LLM chain-of-thought revealing
- No cloud resource deployment
- No complex business rules in the API layer (AI layer owns the logic)

---

## Services Inside Backend
- **Auth Service**
- **Nodes/Curriculum Service**
- **Exercise Service**
- **Grading Service**
- **Memory Service**
- **Chat Relay / AI Router**
- **Sandbox Executor**
- **Progress Tracker**

---

## Database Schema Requirements
Tables:
- `users`
- `learning_nodes`
- `node_prerequisites`
- `exercises`
- `exercise_attempts`
- `chat_logs`
- `user_memory_vectors`
- `onboarding_profiles`
- `progress_state`

---

## Sandbox Rules
- No internet access
- Time limit per execution
- CPU & memory restricted
- Whitelisted commands only
- Isolated filesystem per run

---

## Backend Tech Stack Recommendation
- FastAPI (Python)  
- mongo db 
- Redis for job queues  
- Docker-based sandbox  
- OpenTelemetry for logs  

