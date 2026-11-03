A small `alertdialog` that asks before anything irreversible, such as deleting a session.

- Width 360–400, `radius-dialog`, `sheet` ground, `shadow-modal`, scrim at 0.7.
- An error-tinted icon disc, a question as the title ("Delete this session?"), and one sentence naming exactly what is lost.
- Two buttons: the safe action (outline, "Keep it") gets initial focus; the destructive one sits right.
- Use only for destructive or irreversible actions. Never for confirming saves.
