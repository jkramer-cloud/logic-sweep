# Logic Sweep — Worlds Update (v1.1)

An original, self-contained Minesweeper-style browser game that practices **deductive reasoning, pattern recognition, probability, and risk assessment** through play. Designed for middle school and general audiences; no grades, sign-ins, tracking or mandatory quizzes.

## Play

- **Online (once GitHub Pages is enabled):** https://jkramer-cloud.github.io/logic-sweep/
- **Offline:** Download this repository and open `index.html` in a modern browser.

## Features

- Four presets: Starter (8×8, 10 mines), Skilled (12×12, 24 mines), Expert (16×16, 46 mines), and Master (24×16, 80 mines), plus custom boards.
- **Classic** mode, where a mine ends the round, and **Explorer** mode, with two protective shields.
- Optional **Deduction Coach** that reasons from the board's visible number clues. Minesweeper can still require a guess; the coach does not reveal hidden information or guarantee a guess-free round.
- First move is safe; flag suspected mines, reveal tiles, and use number chording.
- Four illustrated worlds: **Sunburst** (bright default), **Orchard**, **Splash**, **Neon**.
- Progress bar, sound toggle, timer, best-time records, win and loss effects.
- Mouse, touch, keyboard-accessible controls. Respects reduced-motion preferences.
- Settings and records stored locally in the browser; no syncing between devices.

## Host this repository with GitHub Pages

1. Create a new public GitHub repository named `logic-sweep` (or choose a different name and update its link wherever the game is listed).
2. Upload **`index.html` and `README.md`** from this ZIP into the repository root. Keep the file named `index.html`.
3. In **Settings → Pages**, set **Deploy from a branch**, **main**, **/(root)**, then save.
4. Test `https://jkramer-cloud.github.io/logic-sweep/` after GitHub Pages finishes deploying.
5. Only then upload the **separate PlayForge update package** to `jkramer-cloud/jkramer-cloud.github.io`.

## Teacher note

The learning is built into the rules, not a separate worksheet: students use nearby number clues to identify certain safe and mined tiles, and decide what to do when information is incomplete. A wrong guess in Classic is part of the original game design. Explorer offers a less punishing first experience.

## Privacy and deployment

The game runs client-side with no third-party dependencies, analytics, login or account requirement. Browser-local saved records and world choice can be lost if site data is cleared. GitHub Pages delivers the files over the internet when hosted; the game itself can also run offline.

## Version

v1.1, November 23, 2026. This is a standalone game repository. PlayForge is a separate catalog repository and is not required for gameplay.
