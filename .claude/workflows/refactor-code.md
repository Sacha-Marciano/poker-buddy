# Refactor Code Workflow

## Overview
```
IDENTIFY → VERIFY → PLAN → REFACTOR → TEST → REVIEW → DOCUMENT
    ↓         ↓       ↓        ↓         ↓       ↓         ↓
  scope    safety  structure  code    verify  quality    docs
```

## Key Principle
> **Refactoring changes structure, not behavior.** All tests must pass before AND after.

## Agents

| Agent | Purpose | Output |
|-------|---------|--------|
| Codebase Analyzer | Identify refactoring scope and dependencies | JSON report (in chat) |
| Business Logic Guardian | Verify refactoring is safe | JSON report (in chat) |
| System Architect | Plan structural changes | Structure specification (in chat or file) |
| Code Refactor | Execute the refactoring | Improved code |
| Test Coverage Agent | Verify no regressions | All tests passing |
| Code Quality Reviewer | Verify improvement quality | Quality score |
| Documentation Updater | Update affected docs | Updated docs |

---

## Procedure

### Phase 1: Scope Identification

#### Step 1 → Codebase Analyzer
- **Input**: User's refactoring request
- **Output**: JSON report with:
  - Files targeted for refactoring
  - Current line counts (flag files > 300 lines)
  - Dependencies and usages
  - Related test files
- **Do NOT**: Create any files

#### Step 2 → USER GATE
> **Confirm refactoring scope with user before proceeding**

---

### Phase 2: Safety Verification

#### Step 3 → Business Logic Guardian
- **Input**: Files to refactor + proposed changes
- **Output**: JSON report with:
  - Business logic that must be preserved
  - Vocabulary/field names that cannot change
  - Potential risks identified
  - Approval or concerns
- **Do NOT**: Create any files
- **⚠️ GATE**: If concerns raised → Address before proceeding

---

### Phase 3: Structure Planning

#### Step 4 → System Architect (CONDITIONAL)
> **Required if ANY of these are true:**
> - Any file exceeds 300 lines
> - Extracting components/hooks/stores
> - Creating new files
> - Reorganizing folder structure

- **Input**: Codebase analysis + refactoring goals
- **Output**: Structure specification:
  - How to split large files
  - Where to place extracted code
  - Import/export patterns
  - File naming conventions
- **If not needed**: Skip to Step 5

#### Step 5 → USER GATE
> **Confirm refactoring plan with user before proceeding**

---

### Phase 4: Execution

#### Step 6 → Run Existing Tests (BASELINE)
- **Input**: Current codebase
- **Validate**: Run `npm test && npm run type-check && npm run lint`
- **Output**: All tests passing, zero TypeScript errors
- **Purpose**: Establish baseline - if tests fail now, fix before refactoring
- **⚠️ GATE**: If tests fail → Fix first, then restart workflow

#### Step 7 → Code Refactor
- **Input**:
  - Analysis from Codebase Analyzer
  - Safety approval from Business Logic Guardian
  - Structure plan from System Architect (if applicable)
- **Output**: Refactored code
- **Rules**:
  - Follow architect's structure exactly
  - Preserve all behavior
  - No file over 300 lines
  - No drive-by feature changes

#### Step 8 → USER GATE
> **Confirm refactored code with user before proceeding**

---

### Phase 5: Verification

#### Step 9 → Test Coverage Agent
- **Input**: Refactored code
- **Validate**: Run `npm test && npm run type-check && npm run lint`
- **Output**: Test results
- **Success Criteria**:
  - ALL existing tests still pass ← **Critical**
  - Zero TypeScript errors
  - No behavior changes detected
- **⚠️ GATE**: If any test fails → Refactoring broke something → Fix or revert

#### Step 10 → USER GATE
> **Confirm all tests pass with user before proceeding**

#### Step 11 → Code Quality Reviewer
- **Input**: Refactored code
- **Output**: Quality score comparing before/after
- **Success Criteria**:
  - Score of 100/100
  - Quality improved (not degraded)
  - All files under 300 lines
- **If score < 100**: Address issues → Re-run reviewer

---

### Phase 6: Finalization

#### Step 12 → Documentation Updater
- **Input**: All refactoring changes
- **Output**:
  - Updated file descriptions
  - Updated structure tree
  - Updated READMEs for affected folders
  - Note: "Refactored - no behavior changes"

#### Step 13 → Retrospective
> **MANDATORY: Evaluate the refactoring**

1. Did refactoring achieve its goals?
2. Were any tests affected? (They shouldn't be)
3. Is code measurably better? (Lines reduced, complexity lowered)
4. Any follow-up refactoring needed?

---

## Quick Reference: Gates & Blockers

| Step | Gate Type | Action if Blocked |
|------|-----------|-------------------|
| 2 | User confirmation | Wait for approval |
| 3 | Safety concerns | Address concerns before proceeding |
| 5 | User confirmation | Wait for approval |
| 6 | Baseline tests fail | Fix tests first → restart workflow |
| 8 | User confirmation | Wait for approval |
| 9 | Tests fail after refactor | **STOP** - refactoring broke something |
| 10 | User confirmation | Wait for approval |
| 11 | Score < 100 | Address issues → retry |

## Data Flow
```
User Request: "Refactor [code/feature]"
     ↓
[Codebase Analyzer] → Scope + Dependencies
     ↓
[Business Logic Guardian] → Safety Approval
     ↓
[System Architect] → Structure Plan (if needed)
     ↓
[Run Existing Tests] → Baseline ✓
     ↓
[Code Refactor] → Improved Code
     ↓
[Test Coverage] → All Tests Still Pass ✓
     ↓
[Code Quality] → Score Improved
     ↓
[Documentation] → Updated Docs
     ↓
Retrospective → Evaluate Success
```

## Refactoring Principles

⚠️ **Tests must pass before AND after** - No exceptions
⚠️ **No behavior changes** - Structure only
⚠️ **300-line limit** - Split large files
⚠️ **Coordinate with other agents** - Don't go alone
⚠️ **No drive-by fixes** - Stay focused on scope
⚠️ **Revert if tests fail** - Don't push broken refactoring

## Measuring Success

| Metric | Before | After | Goal |
|--------|--------|-------|------|
| Largest file (lines) | ? | ≤300 | Reduce |
| Duplicate code blocks | ? | 0 | Eliminate |
| Average function length | ? | ≤50 | Reduce |
| Test pass rate | 100% | 100% | Maintain |
| TypeScript errors | 0 | 0 | Maintain |
| Quality score | ? | 100 | Improve |
