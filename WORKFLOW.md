# Team Git & GitHub Collaboration Workflow

This document outlines the standard branching model, commit conventions, code review process, and issue tracking workflow for the Data Product team. Adhering to these standards ensures code quality, predictable releases, maintainable git history, and seamless collaboration.

---

## 1. Branching Strategy

Our team uses a **Feature Branch Workflow** centered around the `main` branch.

### 1.1 Branch Hierarchy & Lifecycle
- **`main`**:
  - Contains **production-ready / releasable code only**.
  - Direct commits to `main` are strictly prohibited.
  - Changes are merged into `main` solely via Pull Requests (PRs) after passing code reviews and automated checks.
- **Feature & Task Branches**:
  - All new work (features, bug fixes, documentation, refactoring) must be developed in dedicated short-lived branches.
  - Branches must branch off from the latest `main` branch.
  - Branches must be deleted immediately after their corresponding Pull Request is merged to prevent branch rot.

### 1.2 Branch Naming Conventions
All branch names must follow the format:
```
[type]/[short-description]
```
Where `[type]` is one of the standard prefixes:
- `feature/` : New analytical features, data pipeline steps, or modules (e.g., `feature/data-ingestion`, `feature/rag-pipeline`)
- `fix/` : Bug fixes in code, data pipelines, or queries (e.g., `fix/validation-logic`, `fix/db-connection-timeout`)
- `docs/` : Documentation updates or data dictionary additions (e.g., `docs/data-dictionary`, `docs/architecture-overview`)
- `refactor/` : Code restructuring without changing external behavior (e.g., `refactor/chunking-pipeline`)
- `chore/` : Tooling, dependency updates, or configuration adjustments (e.g., `chore/update-requirements`, `chore/setup-ci`)

---

## 2. Commit Message Convention

To maintain a clean git history and enable automated changelog generation, all commits must adhere to the **Conventional Commits** standard.

### 2.1 Commit Message Format
```
[type]: [description]

[optional body explaining why and details]
```

### 2.2 Allowed Commit Types
- `feat` : A new feature, pipeline enhancement, or data transformation.
- `fix` : A bug fix in existing code or pipeline logic.
- `docs` : Documentation additions, updates, or docstrings.
- `refactor` : Code changes that neither fix a bug nor add a feature.
- `test` : Adding missing tests or correcting existing tests.
- `chore` : Build tools, package dependencies, or repository configurations.

### 2.3 Commit Message Examples
```git
feat: add data validation function

Validates incoming CSV files for schema completeness and encoding.
Checks column names, data types, and row counts before processing.
```
```git
docs: document branching strategy for team
```
```git
chore: update requirements.txt with validation library
```

---

## 3. Pull Request (PR) & Code Review Process

Pull Requests are the gatekeepers of quality, correctness, and system reliability.

### 3.1 PR Requirements
- Every PR must target `main` from a dedicated feature/fix branch.
- PRs require at least **one peer approval** prior to merging.
- PR descriptions must be descriptive and follow the team PR template.

### 3.2 PR Description Template
```markdown
## Summary
Brief description of the change and the motivation behind it.

## What Changed
- List key functional and architectural modifications.
- Mention dependencies or configuration updates.

## Related Issue
Closes #[issue-number] (or Fixes #[issue-number])

## Testing
Explanation of how the changes were tested (unit tests, manual pipeline run, sample data verification).
```

### 3.3 Code Review Focus Areas
Reviewers must inspect and evaluate:
1. **Correctness**: Does the logic accurately implement the task requirements?
2. **Data Integrity & Robustness**: Are edge cases, null values, malformed inputs, and data validation handled?
3. **Clarity & Maintainability**: Is the code clean, readable, modular, and self-documenting?
4. **Test Coverage**: Are sufficient unit tests / validation checks included?
5. **Commit History**: Are commit messages clear, atomic, and compliant with commit conventions?

---

## 4. Issue Tracking & Sprint Workflow

All engineering tasks originate from and are tracked in GitHub Issues.

### 4.1 Issue Lifecycle
1. **Create Issue**: Every feature, bug, or task begins with a well-defined GitHub Issue before code is written.
2. **Assignee & Labels**: Each issue must have an assigned owner and appropriate labels (e.g., `feature`, `bug`, `documentation`, `data-pipeline`).
3. **Development**: A feature branch is created adhering to the naming convention.
4. **Linking**: When opening a Pull Request, link the issue using `Closes #<id>` or `Fixes #<id>`.
5. **Closure**: GitHub will automatically close the linked issue upon merging the PR into `main`.
