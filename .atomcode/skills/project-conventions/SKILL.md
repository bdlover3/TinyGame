---
name: project-conventions
description: "Project conventions and coding style for TinyGame (Cocos Creator + TypeScript)"
user_invocable: false
disable_model_invocation: true
---

# TinyGame Project Conventions

## Language
- **Code**: TypeScript (Cocos Creator 3.x)
- **Comments**: Chinese (中文注释) for logic explanations, English for API docs
- **Variables**: English identifiers preferred; Chinese/Pinyin identifiers (e.g. `飞机`, `棋盘`, `开始按钮`) are legacy and should be preserved

## Architecture
- **Singleton**: Game logic via `Game.getInstance()`, events via `Observers.getInstance()`
- **Observer Pattern**: Use `Observers.addObserver()` / `notify()` for cross-component communication
- **Components**: Each Cocos Creator component in its own `.ts` file, decorated with `@ccclass`

## Code Style
- **Enums**: PascalCase (`GameStatus.ONLOAD`, `PlaneDirection.UP`, `CellDetail.EMPTY`)
- **Classes**: PascalCase (`Game`, `Observers`, `plane`, `bg`)
- **Methods**: camelCase (`getInstance`, `addObserver`, `setRandomPlane`)
- **Board coordinates**: `x` for row, `y` for column (0-9 range, 10x10 grid)
- **Plane positions**: `Vec2[]` array of 10 cells, position[0] is the center

## File Organization
- `assets/脚本/` — game logic scripts
- `assets/resources/预制/` — prefabs + their code
- `assets/背景/` — background logic
- Scene files (`.scene`) — one per game screen (首页/部署/战斗/结束)

## Game State Flow
```
ONLOAD → PRE (部署飞机) → READY (准备战斗) → FIGHT (开火) → END (结算)
                                                         ↓
                                                    (restart) → PRE
```

## Naming Conventions for New Files
- Scene scripts: `assets/脚本/<场景名>/<场景名>.ts`
- Prefab scripts: `assets/resources/预制/<预制名>/<预制名>.ts`
- UI sprites: `assets/uipack/`
