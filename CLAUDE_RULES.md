# Development Rules

Follow these rules strictly.

## Scope control
Do NOT add features that are not explicitly requested.

Only implement what is described in the prompt.

If something is unclear, ask before implementing.

## Simplicity
Keep the code minimal and readable.

Avoid unnecessary abstractions or libraries.

Do not add animations, charts, or extra UI components unless explicitly requested.

## Architecture
Use React Native with TypeScript.

Keep the project structure simple.

Prefer functional components.

Avoid complex state management libraries.

## Persistence
Use local storage only.

Do not implement any backend or account system.

## UI principles
Minimal UI.
Dark theme only.
No circular progress ring.
No cards or clutter.

## Timer logic
Never implement the fasting timer by incrementing seconds.

Always calculate fasting time as:

currentUtcTime - lastMealTimestamp

This must work correctly after:
- app restart
- device reboot
- backgrounding
