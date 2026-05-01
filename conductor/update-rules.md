# Plan: Enable Conductor File Commits

## Objective
Update project and global configurations to allow the `conductor/` directory to be tracked and committed to Git.

## Implementation Steps
- [ ] Remove `conductor/` from `.gitignore`.
- [ ] Remove rules explicitly forbidding `conductor/` commits from `conductor/workflow.md`.
- [ ] Remove rules explicitly forbidding `conductor/` commits from `~/.gemini/GEMINI.md`.
- [ ] Stage `conductor/` directory in Git (if not already staged).