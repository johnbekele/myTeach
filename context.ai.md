# AI Layer Context File
## Purpose
This layer is the "brain" of the system.  
It orchestrates:
- teaching strategy
- exercise generation
- grading rubrics
- personalized learning path
- memory retrieval
- dialogue with the user
- detection of confusion, overwhelm, ADHD patterns

---

## Responsibilities
- Read/write vector memory and user history
- Decide what to teach next (curriculum tree traversal)
- Generate:
  - explanations
  - step-by-step tasks
  - exercises (with test cases)
  - hints
  - corrections
- Run a feedback loop after each user action
- Adjust teaching complexity dynamically
- Prevent user overwhelm (ADHD mode)
- Process user emotional context (frustration, confusion, overload)
- Produce graded output in predictable format

---

## Non-Responsibilities
- No direct DB access (backend provides abstraction)
- No UI state decisions
- No rendering
- No sandbox management
- No authentication

---

## Internal AI Agents (Submodules)

### 1. **Teaching Strategy Agent**
- builds personalized curriculum
- adapts difficulty based on past failures
- keeps module prerequisites in mind

### 2. **Explanation & Simplification Agent**
- explains in 3 formats:
  - simple
  - medium detail
  - expert
- includes “explain why this matters”

### 3. **Exercise Generator Agent**
- creates:
  - problem statement
  - evaluation criteria
  - auto-grader tests
  - solution template
  - hints

### 4. **Exercise Grading Agent**
- interprets sandbox results
- returns:
  - score
  - mistakes & why
  - next step

### 5. **Memory Agent**
- stores and retrieves:
  - confusion patterns
  - strengths/weaknesses
  - concepts needing repetition
  - emotional patterns (frustration triggers)
  - attention issues (ADHD markers)

### 6. **Dialogue Agent**
- maintains compassionate, motivating tone
- keeps messages concise
- always begins with the next actionable step

---

## Teach-Loop Workflow
1. User sends message → backend forwards to AI layer  
2. Memory is retrieved →  
3. AI determines context (teaching, confusion, exercise, request)  
4. AI decides the best response type  
5. AI produces output  
6. Backend delivers to UI  

---

## Required Output Format (Internal)
All responses must follow a schema:

```json
{
  "mode": "explanation|exercise|grading|onboarding|review",
  "steps": [],
  "content": "",
  "actions": [],
  "memory_write": [],
  "next_node": null
}

