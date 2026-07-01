---
name: add-plane
description: "Template for adding a new plane type to the game — generates position logic, random placement, and board registration"
user_invocable: true
disable_model_invocation: false
---
You help add a new plane type to the TinyGame airplane battle game.

## Instructions

When the user asks to add a new plane type, follow this template:

### 1. Define Plane Shape
Add a new direction case to `makePosition()` in `assets/resources/预制/飞机/plane.ts`.
The plane occupies 10 `Vec2` cells: position[0] is center, positions[1-9] form the shape.

### 2. Update Plane Count
Update `Game.ts`:
- The `constructor` creates 3 planes for each side — adjust if needed
- The `deploy.ts` restart logic also creates 3 planes — keep in sync

### 3. Add Prefab (if needed)
If the new plane needs a different visual, create a new prefab in `assets/resources/预制/飞机/`.

### 4. Update Random Placement
The `setRandomPlane` method already handles overlap checking — the new shape is automatically compatible.

### Validation Checklist
- [ ] All 10 positions are within 0-9 board range
- [ ] No overlap with existing planes (test with `setRandomPlane` with existing `planes[]`)
- [ ] `getPosition()` returns correct cells for all 4 directions
- [ ] Board cells marked as `CellDetail.HASPLANE = 1` for new plane positions
