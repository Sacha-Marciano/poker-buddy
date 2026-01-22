# Fix Bug Workflow

## Overview
```
REPRODUCE → LOCATE → UNDERSTAND → FIX → TEST → REVIEW → DOCUMENT
     ↓         ↓          ↓         ↓      ↓       ↓         ↓
  confirm    find       root     patch  verify  quality   history
   bug      files      cause
```

## Key Difference from Other Workflows
> **Bugs are urgent and focused.** Skip architecture phases - go straight to fix. But ALWAYS understand before fixing.

## Agents

| Agent | Purpose | Output |
|-------|---------|--------|
| Codebase Analyzer | Locate bug-related files | JSON report (in chat) |
| Business Logic Guardian | Understand expected behavior | JSON report (in chat) |
| Code Implementer | Apply the fix | Fixed code |
| Test Coverage Agent | Add regression test + verify | Passing test suite |
| Code Quality Reviewer | Verify fix quality | Quality score |
| Documentation Updater | Update bug history | Updated docs |

---

## Procedure

### Phase 1: Reproduction & Location

#### Step 1 → Reproduce Bug
- **Input**: User's bug report
- **Output**: Clear reproduction steps and expected vs actual behavior
- **Must confirm**:
  - Can we reproduce the bug?
  - What is the exact error/wrong behavior?
  - What is the expected behavior?
- **If cannot reproduce**: Ask user for more details

#### Step 2 → USER GATE
> **Confirm bug reproduction with user before proceeding**

#### Step 3 → Codebase Analyzer
- **Input**: Bug reproduction details
- **Output**: JSON report with:
  - Files likely containing the bug
  - Related files that might be affected
  - Existing tests covering this area
- **Do NOT**: Create any files

---

### Phase 2: Root Cause Analysis

#### Step 4 → Business Logic Guardian
- **Input**: Bug details + affected files
- **Output**: JSON report with:
  - Expected behavior according to business logic
  - What rule/logic is being violated
  - Potential root causes
- **Do NOT**: Create any files
- **Purpose**: Understand WHAT should happen before fixing HOW

#### Step 5 → Identify Root Cause
- **Input**: All analysis from Steps 3-4
- **Output**: Clear statement of:
  - WHERE the bug is (file, function, line)
  - WHY it's happening (root cause)
  - WHAT the fix should do
- **Do NOT**: Fix yet - just identify

#### Step 6 → USER GATE
> **Confirm root cause analysis with user before proceeding**

---

### Phase 3: Fix Implementation

#### Step 7 → Code Implementer
- **Input**: Root cause analysis
- **Output**: Minimal fix that solves the bug
- **Rules**:
  - Fix ONLY the bug - no refactoring
  - Minimal changes - smallest possible diff
  - Don't fix adjacent issues (note them for later)
- **Validate**: Run `npm run type-check && npm run lint`
- **Success Criteria**: Bug no longer reproducible, zero TypeScript errors

#### Step 8 → USER GATE
> **Confirm fix with user before proceeding**

---

### Phase 4: Verification

#### Step 9 → Test Coverage Agent
- **Input**: Bug details + fix
- **Output**: 
  - **Regression test**: Test that would have caught this bug
  - **Verification**: All existing tests still pass
- **Success Criteria**: 
  - New regression test passes
  - All existing tests pass
  - Bug cannot be reproduced

#### Step 10 → USER GATE
> **Confirm test coverage with user before proceeding**

#### Step 11 → Code Quality Reviewer
- **Input**: Fix code + regression test
- **Output**: Quality score and findings
- **Success Criteria**: Score of 100/100
- **Focus**: Is the fix clean and minimal?

---

### Phase 5: Documentation

#### Step 12 → Documentation Updater
- **Input**: Bug details + fix + root cause
- **Output**: 
  - Update `.claude/project/bug-fix-history/history.md`:
```markdown
    ## [Date] - Bug: [Short Description]
    
    **Reported**: [How user described it]
    **Root Cause**: [What was actually wrong]
    **Files Changed**: [List of files]
    **Fix**: [Brief description of fix]
    **Regression Test**: [Test file added]
    **Lesson Learned**: [How to prevent similar bugs]
```
  - Update any affected documentation

#### Step 13 → Retrospective
> **MANDATORY: Learn from this bug**

1. Could this bug have been prevented?
2. Why didn't existing tests catch it?
3. Is there a pattern of similar bugs?
4. Should we add validation/checks elsewhere?
5. Propose preventive improvements

---

## Quick Reference: Gates & Blockers

| Step | Gate Type | Action if Blocked |
|------|-----------|-------------------|
| 1 | Cannot reproduce | Get more details from user |
| 2 | User confirmation | Wait for approval |
| 6 | User confirmation | Wait for approval |
| 8 | User confirmation | Wait for approval |
| 9 | Existing tests fail | **STOP** - fix caused regression |
| 10 | User confirmation | Wait for approval |
| 11 | Score < 100 | Address issues → retry |

## Data Flow
```
User Report: "There's a bug..."
     ↓
[Reproduce Bug] → Confirmed reproduction steps
     ↓
[Codebase Analyzer] → Affected files
     ↓
[Business Logic Guardian] → Expected behavior
     ↓
[Root Cause Analysis] → WHERE + WHY + WHAT
     ↓
[Code Implementer] → Minimal fix
     ↓
[Test Coverage] → Regression test + verify existing
     ↓
[Code Quality] → Score
     ↓
[Documentation] → Bug history entry
     ↓
Retrospective → Prevention strategies
```

## Bug Fix Principles

⚠️ **Reproduce first** - Never fix a bug you can't reproduce
⚠️ **Understand before fixing** - Know WHY before changing code
⚠️ **Minimal fix** - Smallest change that fixes the bug
⚠️ **No drive-by fixes** - Don't fix other issues you notice (log them)
⚠️ **Always add regression test** - Prevent this bug from returning
⚠️ **Document the lesson** - Help prevent similar bugs
