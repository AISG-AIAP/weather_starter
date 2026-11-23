# Module 1: Getting Started with Claude Code

## Setup

1. **Install the desktop app.** Open developer mode from the Help menu to bypass the usual account registration, then install the Claude `.dmg`.
2. **Install the CLI.** Install Claude Code via npm.
3. **Configure settings.** Create `~/.claude/settings.json`.
4. **Run the setup.** Navigate to your working directory and run `claude`. Complete the setup process when prompted.

## Prompting: Role and Vocabulary

The first AI example covered in this module: use precise engineering vocabulary and a role keyword to keep the model's behaviour consistent across the whole chat.

## Follow-up: VS Code Integration

Install the Claude Code extension and sign in.
# Module 2: Prompting Techniques

## N-shot Prompting

Give the agent *n* examples of the task, so it learns the expected pattern before doing the real work.

## Iterative Prompting

Ask the agent to tackle a task one layer at a time, rather than all at once.

## Plan Mode

Use plan mode to prototype an approach first, and review it before letting the agent work on the task.

# Module 3: Context Engineering

## Context Rot

Context rot is the decline in output quality that happens as the context window fills up.

## Persisting Context

To counter context rot, store contextual information in `AGENTS.md` (or `CLAUDE.md`) so it persists across sessions.

- Run `/init` to generate a `CLAUDE.md`.
- Refine the generated file with the prompt below.
- For a simple walkthrough, see [A Complete Guide to AGENTS.md](https://www.aihero.dev/a-complete-guide-to-agents-md).

### Refactoring Prompt

```
I want you to refactor my AGENTS.md file to follow progressive disclosure principles.

Follow these steps:

1. **Find contradictions**: Identify any instructions that conflict with each other. For each contradiction, ask me which version I want to keep.

2. **Identify the essentials**: Extract only what belongs in the root AGENTS.md:
   - One-sentence project description
   - Package manager (if not npm)
   - Non-standard build/typecheck commands
   - Anything truly relevant to every single task

3. **Group the rest**: Organize remaining instructions into logical categories (e.g., TypeScript conventions, testing patterns, API design, Git workflow). For each group, create a separate markdown file.

4. **Create the file structure**: Output:
   - A minimal root AGENTS.md with markdown links to the separate files
   - Each separate file with its relevant instructions
   - A suggested docs/ folder structure

5. **Flag for deletion**: Identify any instructions that are:
   - Redundant (the agent already knows this)
   - Too vague to be actionable
   - Overly obvious (like "write clean code")
```

## How Agents Find Context

The agent uses search to find relevant information in the folder it works in, so search quality directly affects the quality of the context it has.

Embedding-based search is an advanced option that requires additional infrastructure.