# Logic Sweep v1.3 — Little Planet (Complete Game)

An offline, no-account Minesweeper-style logic game for all ages. **New in v1.3:** rotate a playable spherical minefield, uncover a grassy world, and solve clues that wrap around its surface. The original v1.2 flat board (Meadow, Sunburst, Orchard, Splash, Neon) remains fully included.

## Play

Open `index.html` in Chrome, Edge, or another modern browser. Keep the `assets/` directory beside it. No internet, installation, registration, external libraries or build process is necessary. The app initially opens **3D Planet**; use **Classic Board** to return to the previous mode. Your choice is remembered locally.

### 3D Planet controls

- **Drag** the globe with mouse or finger to rotate it. Moving the back of the planet to the front is necessary to explore its hidden tiles.
- **Click/tap** a visible tile to dig or flag, depending on the selected tool. **Right-click** any visible tile to flag it directly.
- Or aim the fixed center ring at a tile while rotating and select **Dig at target** / **Flag at target**.
- With the planet canvas focused: **arrow keys** rotate, **Enter** digs at the center, **F** flags at the center, and **Space** uses your current tool. **Mouse wheel** or **+/-** zooms.
- First dig **and all eight immediate neighboring tiles are safe**, even when the field wraps east–west.
- Number clues give the number of mines in surrounding tiles (including diagonals). **Longitude wraps**: the first and last columns are neighbors. The polar tips are decorative; the minefield spans the playable latitude rings.
- **Explorer:** two shield-protected mine mistakes. **Classic:** hitting a mine ends the round.
- **Deduction hint** analyzes visible clues without reading hidden mine positions. Some positions may require guessing. Incorrect flags are not treated as verified mines by the coach; uncovered shield-protected mines are verified.
- Four globe levels: Sprout (12×8, 14 mines), Wanderer (16×10, 30 mines), Explorer (20×12, 51 mines), Legend (24×14, 77 mines). Records are stored locally per level and mode.

### Classic Board

The original five theme choices, four presets, custom board builder, controls, reasoning coach, two game modes, visual effects, sound switch and local record system remain available.

## What kind of 3D is this?

The globe uses a **real spherical coordinate model**, 3D rotations, front-facing surface clipping, shading and per-tile interactions rendered into a Canvas 2D display. It is a lightweight 3D-projected planet—not a full WebGL walkable scene. Each square is independently interactive and follows Minesweeper rules. The scenery is illustrative and does not affect the clue calculations.

## Files

```
index.html
README.md
assets/
  planet.css
  planet.js
  meadow-scene.webp
  earth-0.webp ... earth-3.webp
  grass-0.webp ... grass-3.webp
  meadow-flag.svg
  meadow-mole.svg
```

All files are included in this complete ZIP. No patch instructions or manual code changes.

## GitHub installation

1. Unzip the full package.
2. Open the **existing Logic Sweep** repository (`jkramer-cloud/logic-sweep`, if created).
3. Upload/replace `index.html` and `README.md` at the repository root. Upload `assets/` **including the new `planet.js` and `planet.css`**, retaining the entire folder hierarchy.
4. Commit and visit `https://jkramer-cloud.github.io/logic-sweep/` once GitHub Pages updates.
5. No PlayForge index/catalog change is needed if its existing Logic Sweep link already points to that repository.

Do not upload this game's `index.html` to the PlayForge homepage repository. No repositories were modified by this build.

## Implementation notes

- All data stays in the browser; best times and display preferences do not sync between devices.
- The original flat board and the new globe are independent games. Switching views preserves the current puzzle on each side; the flat-board timer pauses while the globe is active.
- Animations respect the browser's reduced-motion preference for camera auto-focus.
- For screen-reader users, the existing flat grid has individual labeled buttons and remains the preferable accessible mode. The spherical canvas supplies keyboard center-target controls but does not expose every surface tile as a separate semantic element.
- Test on actual school Chromebooks, especially high difficulty and touch input, before broad deployment.
