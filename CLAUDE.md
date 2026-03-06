## REPO BOUNDARIES — READ FIRST
This is the PerfectASIN extension repo: ~/projects/perfectasin-extension/
- Extension ID: mijefckkcmoohngednoefjelimbnjdme
- GitHub: danielmajestic/perfectasin-extension
- ALL extension work goes here

~/projects/titleperfect/ is FROZEN. It is the old TitlePerfect repo.
- NEVER commit to titleperfect for PerfectASIN work
- NEVER edit files in titleperfect thinking they are PerfectASIN
- The two repos are SEPARATE Chrome extensions with DIFFERENT extension IDs
- Backend is SHARED at ~/projects/titleperfect/backend/ — that is the ONLY part of titleperfect that is still active

# TitlePerfect Project

## Tech Stack
- Chrome Extension (Manifest V3) with React + TypeScript + Tailwind
- FastAPI backend with Python 3.11
- Anthropic Claude API (NOT OpenAI) - model: claude-sonnet-4-20250514
- Deployment: GCP Cloud Run

## Important Rules
1. Always use Anthropic/Claude API, never OpenAI
2. Use Windows-compatible paths (backslashes)
3. Environment variable: ANTHROPIC_API_KEY

## Current Phase
Building from PRD v2.2 - currently on Phase 16.4 (Popup UI)

## Workflow Protocols

### Before Starting Any Feature
1. Run `/superpowers:brainstorm` to structure thinking
2. Confirm scope with Dan before coding
3. Break into small, testable chunks

### During Development
1. Small commits, fast iterations - don't build everything at once
2. Build one thing → test → commit → next thing
3. After changes, run the app and check for errors
4. If stuck for more than 5 minutes, suggest Dan bring the issue to Claude.ai for debugging

### Before Ending Any Session
1. Summarize what was built
2. List what's next (next 2-3 tasks)
3. Note any blockers or decisions needed
4. Remind Dan to copy summary for continuity

## Vibe Coding Cheats (Use These!)

| Situation | Action |
|-----------|--------|
| Starting new feature | Run `/superpowers:brainstorm` first |
| Complex refactor | Run `/superpowers:write-plan` first |
| Multiple tasks planned | Run `/superpowers:execute-plan` for batched work |
| Hit a weird error | Suggest Dan screenshot to Claude.ai |
| Session ending | Always provide summary + next steps |

## Dan's Preferences
- Bootstrap-minded but willing to invest for ROI
- Mobile-first lifestyle (iPhone 14, often working from car)
- Prefers direct answers, minimal fluff
- Likes tables and structured information
- Values efficiency - don't over-engineer

## Communication Style
- Be direct and concise
- Use tables when comparing options
- Give copy-paste ready commands when possible
- Flag blockers early, don't spin wheels
- Remind Dan of cheats/protocols when they'd help

## DEV RULES

### Commit hygiene
- Always run `git status` before committing to verify all modified files are staged
- Run `git diff --stat` after commit to confirm what actually shipped
- If you edited multiple files, `git add .` is safer than `git add <single file>`

## Related Projects (Same Owner)
- PerfectASIN Suite (parent project - Title Perfect is first tool)
- Bullet Perfect (next after Title Perfect)
- CrushingItApp (voice-driven AI workflow OS)
- StarMeOke (parked - voice cloning karaoke)
