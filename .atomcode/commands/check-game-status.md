---
name: check-game-status
description: "Display the current game state machine flow and where the game logic currently is"
---
# Game Status Check

## State Machine Flow
```
ONLOAD (0) → PRE (1) → READY (2) → FIGHT (3) → END (4)
                                         ↓
                                     (restart) → ONLOAD → PRE
```

## Current State Definitions
| State | Value | File | Description |
|-------|-------|------|-------------|
| `GameStatus.ONLOAD` | 0 | `Game.ts` | Initial load |
| `GameStatus.PRE` | 1 | `Game.ts` | Deploy phase — place planes |
| `GameStatus.READY` | 2 | `Game.ts` | Ready to fight — deploy scene shows "开始战斗" button |
| `GameStatus.FIGHT` | 3 | `Game.ts` | Combat — take turns firing |
| `GameStatus.END` | 4 | `Game.ts` | Game over — show winner |

## Observer Events
| State Change | Event Name | Subscribers |
|-------------|------------|-------------|
| → PRE | `gamePre` | `部署.ts` (remove start button if exists) |
| → READY | `gameReady` | `部署.ts` (show "开始战斗" button) |
| → FIGHT | `gameFight` | — |
| → END | `gameEnd` | `部署.ts` (show winner + restart button) |
| → ONLOAD | `gameOnload` | `bg.ts` (background) |

## Key Files
- `assets/脚本/部署/Game.ts` — Core game logic, state machine, board management, AI turns
- `assets/脚本/部署/部署.ts` — Deployment scene UI, game restart
- `assets/脚本/Observers.ts` — Event system (Observer pattern)
- `assets/resources/预制/飞机/plane.ts` — Plane model, random generation, shape definitions
