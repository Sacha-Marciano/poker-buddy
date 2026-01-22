# Improve Existing Feature Workflow

## Overview
```
UNDERSTAND → REFINE → ANALYZE → GUARD → ARCHITECT → IMPLEMENT → TEST → REVIEW → DOCUMENT
     ↓          ↓        ↓        ↓         ↓            ↓         ↓       ↓         ↓
  existing    scope   impact   conflicts  phases       code      tests   quality    docs
  feature                                + files
```

## Key Difference from Create Feature
> **The feature already exists.** Your first job is to understand what's there before changing it.

## Agents

| Agent | Purpose | Output |
|-------|---------|--------|
| Codebase Analyzer | Understand existing feature + find impact | JSON report (in chat) |
| Prompt Refiner | Clarify the improvement scope | Refined scope (in chat) |
| Business Logic Guardian | Check conflicts with existing logic | JSON report (in chat) |
| System Architect | Design changes as phased plan | `.claude/project/features/<name>/` updated with improvement phases |
| Technical Researcher | Document new third-party libraries | `.claude/project/package-docs/<library>.md` |
| Code Implementer | Execute phase specifications | Working code |
| Test Coverage Agent | Create/update tests | Passing test suite |
| Code Quality Reviewer | Grade code quality | Quality score |
| Documentation Updater | Update all documentation | Updated docs |

---

## Procedure

### Phase 1: Understanding

#### Step 1 → Codebase Analyzer (EXISTING FEATURE)
- **Input**: Feature name from user
- **Output**: JSON report with:
  - Current feature structure
  - All files involved
  - Existing patterns and conventions
  - Dependencies and integrations
- **Do NOT**: Create any files
- **Purpose**: Understand what exists before changing it

#### Step 2 → Prompt Refiner
- **Input**: User's improvement request + existing feature analysis
- **Output**: Detailed scope of what changes are needed
- **Must clarify**:
  - What behavior is changing?
  - What is staying the same?
  - Are there breaking changes?
- **Do NOT**: Create any files

#### Step 3 → USER GATE
> **Confirm improvement scope with user before proceeding**

---

### Phase 2: Impact Analysis

#### Step 4 → Codebase Analyzer (IMPACT)
- **Input**: Refined improvement scope
- **Output**: JSON report with:
  - Files that need modification
  - Files that might be affected (ripple effects)
  - Existing tests that cover this area
- **Do NOT**: Create any files

#### Step 5 → Business Logic Guardian
- **Input**: Existing feature analysis + improvement scope
- **Output**: JSON report with:
  - Vocabulary to maintain (existing terms)
  - Vocabulary changes needed (if any)
  - Potential conflicts with existing business rules
  - Breaking changes identified
- **Do NOT**: Create any files
- **⚠️ GATE**: If breaking changes or conflicts found → Resolve with user → May adjust scope

---

### Phase 3: Architecture

#### Step 6 → System Architect
- **Input**: All reports from Phase 1 & 2
- **Output**: Update `.claude/project/features/<feature-name>/` folder:
  - Update `00-overview.md` with improvement notes
  - Add improvement phase files: `XX-improvement-name.md`
- **Must specify**:
  - What existing code to modify (not rewrite)
  - What new code to add
  - What to leave untouched
  - Backward compatibility requirements

#### Step 6b → Technical Researcher (CONDITIONAL)
> **Only if System Architect returns `status: BLOCKED` for missing library docs**
- **Input**: Library research request from architect
- **Output**: `.claude/project/package-docs/<library>.md`
- **Then**: Re-run Step 6 with same input

#### Step 7 → USER GATE
> **Confirm architecture plan with user before proceeding**

---

### Phase 4: Implementation

#### Step 8 → Code Implementer (LOOP)
```
FOR EACH improvement phase file:
  1. Run Code Implementer with phase file
  2. Verify: No syntax errors, no linter errors
  3. Verify: Existing functionality not broken
  4. If errors: Fix before next phase
```
- **Input**: Phase file (`XX-improvement-name.md`)
- **Output**: Working code matching phase specification
- **Validate**: Run `npm run type-check && npm run lint`
- **Success Criteria**:
  - Zero TypeScript/linter errors
  - Existing features still work

#### Step 9 → USER GATE
> **Confirm implementation with user before proceeding**

---

### Phase 5: Quality Assurance

#### Step 10 → Test Coverage Agent
- **Input**: Modified feature code
- **Output**: Updated/new test files
- **Success Criteria**: 
  - All NEW tests pass
  - All EXISTING tests still pass ← **Critical for improvements**
- **If existing tests fail**: Stop and fix - you broke something

#### Step 11 → USER GATE
> **Confirm test coverage with user before proceeding**

#### Step 12 → Code Quality Reviewer
- **Input**: All modified code
- **Output**: Quality score and findings
- **Success Criteria**: Score of 100/100
- **If score < 100**: Address issues → Re-run reviewer

---

### Phase 6: Finalization

#### Step 13 → Documentation Updater
- **Input**: All changes from implementation
- **Output**: 
  - Updated feature documentation
  - Updated README files
  - Updated structure tree
  - Changelog entry for the improvement

#### Step 14 → Retrospective
> **MANDATORY: Collect user feedback and learn**

1. Ask user for feedback on the improvement
2. List all errors/issues encountered during workflow
3. Specifically check:
   - Did we break any existing functionality?
   - Were backward compatibility requirements met?
   - Was the scope accurate?
4. Propose improvements:
   - Agent prompt modifications
   - Workflow adjustments
   - Better impact analysis
   - New validation steps

---

## Quick Reference: Gates & Blockers

| Step | Gate Type | Action if Blocked |
|------|-----------|-------------------|
| 3 | User confirmation | Wait for approval |
| 5 | Breaking changes/conflicts | Resolve with user → may adjust scope |
| 6 | Missing library docs | Run Technical Researcher → retry |
| 7 | User confirmation | Wait for approval |
| 8 | Lint/type errors | Fix before next phase |
| 9 | User confirmation | Wait for approval |
| 10 | Test failures (existing) | **STOP** - fix regression before continuing |
| 10 | Test failures (new) | Fix until all pass |
| 11 | User confirmation | Wait for approval |
| 12 | Score < 100 | Address issues → retry |

## Data Flow
```
User Request: "Improve [feature]"
     ↓
[Codebase Analyzer] → Existing Feature Report
     ↓
[Prompt Refiner] → Refined Improvement Scope
     ↓
[Codebase Analyzer] → Impact Report ─────────┐
     ↓                                       │
[Business Logic Guardian] → Conflicts ───────┼→ Combined Context
     ↓                                       │
[System Architect] ←─────────────────────────┘
     ↓
features/<name>/XX-improvement-*.md (Phase Files)
     ↓
[Code Implementer] × N phases
     ↓
Modified Code
     ↓
[Test Coverage] → New Tests + Verify Existing
     ↓
[Code Quality] → Score
     ↓
[Documentation] → Updated Docs + Changelog
     ↓
User Feedback → Improvements
```

## Critical Reminders for Improvements

⚠️ **Do NOT rewrite** - Modify existing code, don't replace it
⚠️ **Existing tests must pass** - If they fail, you broke something
⚠️ **Maintain backward compatibility** - Unless explicitly approved otherwise
⚠️ **Understand before changing** - Step 1 is mandatory, not optional