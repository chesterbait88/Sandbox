# Voxel Wreck — Player Flow (living document)

This describes the game **as a player experiences it at the current commit**. Nothing here is drawn ahead of the build. Missing mechanics are listed at the end under "Not yet playable".

## Screens that exist today

There is one screen: the arena. The page opens straight into it. Theme and seed come from the address bar; there is no menu, picker or results screen yet.

```mermaid
flowchart LR
    A[Open the page] --> B[Arena generates<br/>theme + seed from the URL]
    B --> C[Standing on the spawn pad<br/>facing the arena]
    C -->|click the view| D[Mouse look is captured]
    D -->|Esc| C
    D --> E[Walk, sprint, jump, climb dunes]
    E --> E
```

What the player sees: a sunlit voxel desert with rolling dunes and one asphalt road through the middle, a small caption at the top naming the theme and seed, and an optional stats readout (F3).

## The in-round loop as it works now

There is no clock, no score and no weapons yet. The loop is movement only.

```mermaid
flowchart TD
    I[Read keyboard and mouse] --> L[Turn the view]
    L --> M[Accelerate toward the wish direction]
    M --> J{Jump pressed<br/>and on ground?}
    J -->|yes| K[Launch upward]
    J -->|no| G[Apply gravity]
    K --> G
    G --> S[Slide the body against the voxel grid<br/>one axis at a time]
    S --> U{Blocked by a<br/>single step?}
    U -->|yes| V[Step up half a metre]
    U -->|no| W[Stay put on that axis]
    V --> R[Draw the world]
    W --> R
    R --> I
```

## Controls that work

| Key | Action |
| --- | --- |
| Mouse | Look (after clicking the view) |
| W A S D | Move |
| Shift | Sprint |
| Space | Jump |
| Esc | Release the mouse |
| F3 | Toggle the stats readout |

## The arena today

```mermaid
mindmap
  root((Arena))
    Desert Highway
      Sand dunes
      Asphalt road
      Stone under the sand
    Downtown terrain
      Flat asphalt
      Sidewalk grid
    Memorial Park terrain
      Grass hills
      Gravel paths
    Shared
      128 m square, 64 m tall
      Half-metre voxels
      Same seed, same arena
```

All three terrains generate from a seed. No structures stand on any of them yet, so there is nothing to score and nothing to wreck.

## Not yet playable

Mechanics from SPEC.md that do not exist for the player at this commit:

- Any destruction: no weapon fires, swings, throws or places anything, so nothing can be carved.
- Debris, screen shake, flashes, particles, sounds.
- Chain reactions through fuel tanks, propane or transformers (nothing volatile is placed in the world).
- Structures: gas station, diner, billboard, water tower, propane cage, convenience store, office block, parking structure, bus shelter, monument, fountain, gazebo, statue, maintenance shed.
- Scoring, combo multiplier, leveled bonus, milestones and rewards.
- The 3-minute round clock and the round-end slow motion.
- The weapon loadout, weapon switching, the radial picker, ammo and reloading, view models.
- Start menu, world picker, loadout briefing, countdown, pause, results, initials entry, leaderboard.
- Settings (sensitivity, volume, FOV).
- The server: sessions, score submission, leaderboard storage.

## Changelog

- 2026-11-04: Initial snapshot at 580cf52
