---
id: std-20250117-143000-tests
depthUsed: standard
timestamp: 2025-01-17T14:30:00Z
executed: false
originalPrompt: "No estan pasando algunos test de los que armaste, revisa todos los tests"
---

# Improved Prompt

# Task: Debug and Fix Failing Tests

## Objective
Review and fix all failing tests in the codebase.

## Context
- Working directory: C:\Users\agust\Desktop\Proyectos\sistema-gestion
- This is a monorepo with backend (NestJS) and frontend (React/Next.js) apps
- Tests were recently created/modified

## Required Actions

1. **Run all tests** to identify which ones are failing
   - Backend tests: `npm test` in apps/backend
   - Frontend tests: `npm test` in apps/frontend
   - E2E tests: Check for failures

2. **Analyze failures** for each failing test
   - Read the test file
   - Understand what it's testing
   - Identify the root cause

3. **Fix failures** by addressing root causes
   - Update test code if logic is incorrect
   - Update implementation code if tests are valid
   - Update factories/fixtures if data is incorrect

4. **Verify fixes** by running tests again until all pass

## Technical Constraints
- Do NOT use `any` types (project rule)
- Use TypeScript strict typing
- Follow existing code patterns

## Expected Output
- All tests passing successfully
- Summary of changes made to fix each failing test

## Success Criteria
- All unit tests pass
- All integration tests pass (if applicable)
- All E2E tests pass (if applicable)

## Quality Scores
- **Clarity**: 85%
- **Efficiency**: 90%
- **Structure**: 90%
- **Completeness**: 85%
- **Actionability**: 90%
- **Specificity**: 75%
- **Overall**: 86% (good)

## Original Prompt
```
No estan pasando algunos test de los que armaste, revisa todos los tests
```
