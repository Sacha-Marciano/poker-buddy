# Create New Feature Workflow

## Overview
```
REFINE → ANALYZE → GUARD → ARCHITECT → IMPLEMENT → TEST → REVIEW → DOCUMENT
   ↓        ↓        ↓         ↓            ↓         ↓       ↓         ↓
 scope   files    vocab     phases       code      tests   quality    docs
        report   report    + files
```

## Agents

| Agent | Purpose | Output |
|-------|---------|--------|
| Prompt Refiner | Clarify and detail the task scope | Refined scope (in chat) |
| Codebase Analyzer | Find affected files and patterns | JSON report (in chat) |
| Business Logic Guardian | Define vocabulary, flag conflicts | JSON report (in chat) |
| System Architect | Design phased implementation plan | `.claude/project/features/<name>/` folder with phase files |
| Technical Researcher | Document third-party libraries | `.claude/project/package-docs/<library>.md` |
| Code Implementer | Execute phase specifications | Working code |
| Test Coverage Agent | Create and run tests | Passing test suite |
| Code Quality Reviewer | Grade code quality | Quality score |
| Documentation Updater | Update all documentation | Updated docs |

---

## Procedure

### Phase 1: Discovery

#### Step 1 → Prompt Refiner
- **Input**: User's initial feature request
- **Output**: Detailed, unambiguous scope definition
- **Do NOT**: Create any files

#### Step 2 → USER GATE
> **Confirm scope with user before proceeding**

#### Step 3 → Codebase Analyzer
- **Input**: Refined scope from Step 1
- **Output**: JSON report with affected files and existing patterns
- **Do NOT**: Create any files

#### Step 4 → Business Logic Guardian
- **Input**: Refined scope + Codebase Analyzer report
- **Output**: JSON report with vocabulary and potential conflicts
- **Do NOT**: Create any files
- **⚠️ GATE**: If conflicts found → Resolve with user → Return to Step 1 if scope changes

---

### Phase 2: Architecture

#### Step 5 → System Architect
- **Input**: All reports from Phase 1
- **Output**: `.claude/project/features/<feature-name>/` folder containing:
  - `00-overview.md`
  - `01-phase-name.md`
  - `02-phase-name.md`
  - ... (one file per phase)

#### Step 5b → Technical Researcher (CONDITIONAL)
> **Only if System Architect returns `status: BLOCKED` for missing library docs**
- **Input**: Library research request from architect
- **Output**: `.claude/project/package-docs/<library>.md`
- **Then**: Re-run Step 5 with same input

#### Step 6 → USER GATE
> **Confirm architecture plan with user before proceeding**

---

### Phase 3: Implementation

#### Step 7 → Code Implementer (LOOP)
```
FOR EACH phase file in features/<feature-name>/:
  1. Run Code Implementer with phase file
  2. Verify: No syntax errors, no linter errors
  3. If errors: Fix before next phase
```
- **Input**: Phase file (`XX-phase-name.md`)
- **Output**: Working code matching phase specification
- **Validate**: Run `npm run type-check && npm run lint`
- **Success Criteria**: Zero TypeScript/linter errors after each phase

#### Step 8 → USER GATE
> **Confirm implementation with user before proceeding**

---

### Phase 4: Quality Assurance

#### Step 9 → Test Coverage Agent
- **Input**: Implemented feature code
- **Output**: Test files with passing tests
- **Validate**: Run `npm test`
- **Success Criteria**: All new tests pass, all existing tests still pass

#### Step 10 → USER GATE
> **Confirm test coverage with user before proceeding**

#### Step 11 → Code Quality Reviewer
- **Input**: All new/modified code
- **Output**: Quality score and findings
- **Success Criteria**: Score of 100/100
- **If score < 100**: Address issues → Re-run reviewer

---

### Phase 5: Finalization

#### Step 12 → Documentation Updater
- **Input**: All changes from implementation
- **Output**: Updated documentation reflecting all changes

#### Step 13 → Retrospective
> **MANDATORY: Collect user feedback and learn**

1. Ask user for feedback on the feature
2. List all errors/issues encountered during workflow
3. Analyze root causes:
   - Which agent failed?
   - Which specification was unclear?
   - What was missed in planning?
4. Propose improvements:
   - Agent prompt modifications
   - Workflow adjustments
   - Documentation additions
   - New validation steps

---

## Quick Reference: Gates & Blockers

| Step | Gate Type | Action if Blocked |
|------|-----------|-------------------|
| 2 | User confirmation | Wait for approval |
| 4 | Conflict detection | Resolve with user → may restart |
| 5 | Missing library docs | Run Technical Researcher → retry |
| 6 | User confirmation | Wait for approval |
| 7 | Lint/type errors | Fix before next phase |
| 8 | User confirmation | Wait for approval |
| 9 | Test failures | Fix until all pass |
| 10 | User confirmation | Wait for approval |
| 11 | Score < 100 | Address issues → retry |

## Data Flow
```
User Request
     ↓
[Prompt Refiner] → Refined Scope
     ↓
[Codebase Analyzer] → Files Report ──┐
     ↓                               │
[Business Logic Guardian] → Vocab ───┼→ Combined Context
     ↓                               │
[System Architect] ←─────────────────┘
     ↓
features/<name>/*.md (Phase Files)
     ↓
[Code Implementer] × N phases
     ↓
Working Code
     ↓
[Test Coverage] → Tests
     ↓
[Code Quality] → Score
     ↓
[Documentation] → Updated Docs
     ↓
User Feedback → Improvements
```