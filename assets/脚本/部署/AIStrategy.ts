/**
 * @File   : AIStrategy.ts
 * @description: 5 档难度的电脑玩家开火策略。每个策略接收当前已知信息（我方棋盘状态、已开火记录、击中记录），
 *               返回下一个开火坐标 {x, y}。
 * @Author : AtomCode
 */

import { Vec2 } from 'cc';

/** 单次开火目标 */
export interface FireTarget {
    x: number;
    y: number;
}

/** AI 决策上下文：策略根据这些信息决定下一步打哪里 */
export interface AIContext {
    /** 我方棋盘：0=空 1=有飞机 2=已摧毁（AI 视角下 1 表示「可能还有飞机」） */
    myBoard: number[][];
    /** 已经开过火的格子坐标数组 [x, y] */
    enemyfired: number[][];
    /** 已经命中的格子坐标数组（用于追击逻辑） */
    hits: number[][];
    /** 棋盘大小 */
    BOARD_SIZE: number;
}

/** 0=未开火 1=未命中（miss） 2=命中（hit） 3=已摧毁（destroyed） */
export type CellState = 0 | 1 | 2 | 3;

/**
 * 所有 AI 策略的基类。提供共享工具方法。
 */
export abstract class AIStrategy {
    /** 难度等级 1-5 */
    abstract readonly level: number;
    /** 难度名称（中文） */
    abstract readonly name: string;

    /** 主入口：返回下一步开火坐标 */
    abstract chooseTarget(ctx: AIContext): FireTarget;

    // ===== 共享工具 =====

    /** 判断坐标是否在棋盘内 */
    protected inBounds(x: number, y: number, size: number): boolean {
        return x >= 0 && x < size && y >= 0 && y < size;
    }

    /** 判断坐标是否已开过火 */
    protected alreadyFired(x: number, y: number, fired: number[][]): boolean {
        return fired.some(p => p[0] === x && p[1] === y);
    }

    /** 获取所有未开火的格子 */
    protected unfiredCells(ctx: AIContext): FireTarget[] {
        const cells: FireTarget[] = [];
        for (let x = 0; x < ctx.BOARD_SIZE; x++) {
            for (let y = 0; y < ctx.BOARD_SIZE; y++) {
                if (!this.alreadyFired(x, y, ctx.enemyfired)) {
                    cells.push({ x, y });
                }
            }
        }
        return cells;
    }

    /** 从数组中随机取一个元素 */
    protected randomPick<T>(arr: T[]): T {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    /** 获取某格子的四邻（上下左右，仅返回棋盘内且未开火的） */
    protected neighbors(x: number, y: number, ctx: AIContext): FireTarget[] {
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        const result: FireTarget[] = [];
        for (const [dx, dy] of dirs) {
            const nx = x + dx, ny = y + dy;
            if (this.inBounds(nx, ny, ctx.BOARD_SIZE) && !this.alreadyFired(nx, ny, ctx.enemyfired)) {
                result.push({ x: nx, y: ny });
            }
        }
        return result;
    }
}

// ============================================================
// 难度 1：萌新 — 纯随机，不记忆、不追击
// ============================================================
export class AIRookie extends AIStrategy {
    readonly level = 1;
    readonly name = '萌新';

    chooseTarget(ctx: AIContext): FireTarget {
        return this.randomPick(this.unfiredCells(ctx));
    }
}

// ============================================================
// 难度 2：新手 — 随机为主，击中后 30% 概率追击四邻
// ============================================================
export class AINovice extends AIStrategy {
    readonly level = 2;
    readonly name = '新手';

    chooseTarget(ctx: AIContext): FireTarget {
        // 若有命中记录且随机数 < 0.3，追击最后一个命中点周围
        if (ctx.hits.length > 0 && Math.random() < 0.3) {
            const last = ctx.hits[ctx.hits.length - 1];
            const candidates = this.neighbors(last[0], last[1], ctx);
            if (candidates.length > 0) return this.randomPick(candidates);
        }
        return this.randomPick(this.unfiredCells(ctx));
    }
}

// ============================================================
// 难度 3：老兵 — Hunt/Target 模式
//   Hunt 阶段：棋盘奇偶分块扫描（飞机至少占 2 格，奇偶扫描不会漏）
//   Target 阶段：击中后追击四邻，直到该区域无未开火格
// ============================================================
export class AIVeteran extends AIStrategy {
    readonly level = 3;
    readonly name = '老兵';

    chooseTarget(ctx: AIContext): FireTarget {
        // Target 阶段：有命中且周围还有未开火格 → 追击
        if (ctx.hits.length > 0) {
            // 找所有命中点周围可开火的格子
            const targets: FireTarget[] = [];
            for (const [hx, hy] of ctx.hits) {
                for (const n of this.neighbors(hx, hy, ctx)) {
                    targets.push(n);
                }
            }
            if (targets.length > 0) return this.randomPick(targets);
        }

        // Hunt 阶段：奇偶扫描（扫描棋盘上 (x+y)%2 === 0 的格子）
        const parity = (ctx.enemyfired.length) % 2; // 简单交替奇偶，提高覆盖速度
        const candidates = this.unfiredCells(ctx).filter(c => (c.x + c.y) % 2 === parity);
        if (candidates.length > 0) return this.randomPick(candidates);
        // 奇偶格用完，退回全棋盘随机
        return this.randomPick(this.unfiredCells(ctx));
    }
}

// ============================================================
// 难度 4：高手 — 概率密度图
//   对每个未开火格子，统计「假设在该处放一架飞机，与已知命中/未命中信息不冲突」的
//   飞机摆放方式数，选密度最高的格子开火。
//   简化版：用飞机的 4 种朝向 × 中心点位置遍历，统计每格被多少种合法摆法覆盖。
// ============================================================
export class AIExpert extends AIStrategy {
    readonly level = 4;
    readonly name = '高手';

    /** 飞机相对中心的 9 个偏移（4 种朝向，UP 为基准） */
    private readonly SHAPES: number[][][] = [
        // UP: 中心 + 顶点 + 机翼 + 尾翼
        [[0, 0], [0, 1], [-2, 0], [-1, 0], [1, 0], [2, 0], [0, -1], [-1, -2], [0, -2], [1, -2]],
        // RIGHT
        [[0, 0], [1, 0], [0, 2], [0, 1], [0, -1], [0, -2], [-1, 0], [-2, 1], [-2, 0], [-2, -1]],
        // DOWN
        [[0, 0], [0, -1], [2, 0], [1, 0], [-1, 0], [-2, 0], [0, 1], [1, 2], [0, 2], [-1, 2]],
        // LEFT
        [[0, 0], [-1, 0], [0, -2], [0, -1], [0, 1], [0, 2], [1, 0], [2, -1], [2, 0], [2, 1]],
    ];

    chooseTarget(ctx: AIContext): FireTarget {
        const density: number[][] = Array.from({ length: ctx.BOARD_SIZE }, () =>
            Array(ctx.BOARD_SIZE).fill(0)
        );

        // 预计算每个格子状态：0 未开火，1 miss，2 hit
        const state: CellState[][] = Array.from({ length: ctx.BOARD_SIZE }, () =>
            Array(ctx.BOARD_SIZE).fill(0)
        );
        for (const [x, y] of ctx.enemyfired) {
            state[x][y] = ctx.myBoard[x][y] === 2 ? 3 : 1; // 2 在 myBoard 表示已摧毁
            if (ctx.myBoard[x][y] === 1) state[x][y] = 2; // 还有飞机
        }

        // 遍历所有可能的飞机摆放（中心点 × 4 方向）
        for (let cx = 0; cx < ctx.BOARD_SIZE; cx++) {
            for (let cy = 0; cy < ctx.BOARD_SIZE; cy++) {
                for (const shape of this.SHAPES) {
                    // 检查该摆法是否合法（所有格在棋盘内且与已知信息不冲突）
                    let valid = true;
                    const cells: number[][] = [];
                    for (const [dx, dy] of shape) {
                        const x = cx + dx, y = cy + dy;
                        if (!this.inBounds(x, y, ctx.BOARD_SIZE)) { valid = false; break; }
                        // 若该格已 miss，则飞机不能在此摆
                        if (state[x][y] === 1) { valid = false; break; }
                        cells.push([x, y]);
                    }
                    // 该摆法必须覆盖所有已知 hit 点（否则不可能是真实飞机位置）
                    if (valid && ctx.hits.length > 0) {
                        for (const [hx, hy] of ctx.hits) {
                            if (!cells.some(c => c[0] === hx && c[1] === hy)) { valid = false; break; }
                        }
                    }
                    if (valid) {
                        // 该摆法合法，给它覆盖的每个未开火格 +1
                        for (const [x, y] of cells) {
                            if (state[x][y] === 0) density[x][y]++;
                        }
                    }
                }
            }
        }

        // 选密度最高的格子（密度相同则随机选一个）
        let best = -1;
        const bestCells: FireTarget[] = [];
        for (let x = 0; x < ctx.BOARD_SIZE; x++) {
            for (let y = 0; y < ctx.BOARD_SIZE; y++) {
                if (this.alreadyFired(x, y, ctx.enemyfired)) continue;
                if (density[x][y] > best) {
                    best = density[x][y];
                    bestCells.length = 0;
                    bestCells.push({ x, y });
                } else if (density[x][y] === best) {
                    bestCells.push({ x, y });
                }
            }
        }
        if (bestCells.length > 0) return this.randomPick(bestCells);

        // fallback
        return this.randomPick(this.unfiredCells(ctx));
    }
}

// ============================================================
// 难度 5：战神 — 概率密度 + 形状先验锁定
//   在难度 4 基础上，一旦击中，立刻用密度图反向推断最可能的飞机中心点和朝向，
//   优先打掉推断出的整架飞机剩余格子。
// ============================================================
export class AIMaster extends AIStrategy {
    readonly level = 5;
    readonly name = '战神';

    private readonly SHAPES: number[][][] = [
        [[0, 0], [0, 1], [-2, 0], [-1, 0], [1, 0], [2, 0], [0, -1], [-1, -2], [0, -2], [1, -2]],
        [[0, 0], [1, 0], [0, 2], [0, 1], [0, -1], [0, -2], [-1, 0], [-2, 1], [-2, 0], [-2, -1]],
        [[0, 0], [0, -1], [2, 0], [1, 0], [-1, 0], [-2, 0], [0, 1], [1, 2], [0, 2], [-1, 2]],
        [[0, 0], [-1, 0], [0, -2], [0, -1], [0, 1], [0, 2], [1, 0], [2, -1], [2, 0], [2, 1]],
    ];

    chooseTarget(ctx: AIContext): FireTarget {
        // —— Target 模式：有命中时，锁定最可能的飞机摆法，优先打未摧毁的格子 ——
        if (ctx.hits.length > 0) {
            const lockTarget = this.lockOnPlane(ctx);
            if (lockTarget) return lockTarget;
        }

        // —— Hunt 模式：用密度图选最优开火点 ——
        return new AIExpert().chooseTarget(ctx);
    }

    /**
     * 反向推断：找出能同时覆盖所有 hit 点的合法摆法，
     * 返回该摆法下尚未摧毁的格子中「离已 hit 格子最近」的那个。
     */
    private lockOnPlane(ctx: AIContext): FireTarget | null {
        const state: CellState[][] = Array.from({ length: ctx.BOARD_SIZE }, () =>
            Array(ctx.BOARD_SIZE).fill(0)
        );
        for (const [x, y] of ctx.enemyfired) {
            if (ctx.myBoard[x][y] === 1) state[x][y] = 2;
            else if (ctx.myBoard[x][y] === 2) state[x][y] = 3;
            else state[x][y] = 1;
        }

        // 收集所有合法且覆盖全部 hit 点的摆法
        const candidates: { cells: number[][]; score: number }[] = [];
        for (let cx = 0; cx < ctx.BOARD_SIZE; cx++) {
            for (let cy = 0; cy < ctx.BOARD_SIZE; cy++) {
                for (const shape of this.SHAPES) {
                    let valid = true;
                    const cells: number[][] = [];
                    for (const [dx, dy] of shape) {
                        const x = cx + dx, y = cy + dy;
                        if (!this.inBounds(x, y, ctx.BOARD_SIZE)) { valid = false; break; }
                        if (state[x][y] === 1) { valid = false; break; } // 与 miss 冲突
                        cells.push([x, y]);
                    }
                    if (!valid) continue;
                    // 必须覆盖所有 hit 点
                    const coversAllHits = ctx.hits.every(h =>
                        cells.some(c => c[0] === h[0] && c[1] === h[1])
                    );
                    if (!coversAllHits) continue;
                    // 不能与已摧毁的 miss 格冲突（已检查）

                    // 计算得分：该摆法覆盖的 hit 数 × 10 + 覆盖的未开火格数
                    let score = 0;
                    for (const [x, y] of cells) {
                        if (state[x][y] === 2) score += 10;     // 已 hit
                        else if (state[x][y] === 0) score += 1; // 未开火
                    }
                    candidates.push({ cells, score });
                }
            }
        }

        if (candidates.length === 0) return null;
        // 按得分降序，取最优摆法
        candidates.sort((a, b) => b.score - a.score);
        const best = candidates[0];

        // 从最优摆法的未开火格中，选离任一 hit 格曼哈顿距离最近的
        let bestCell: FireTarget | null = null;
        let minDist = Infinity;
        for (const [x, y] of best.cells) {
            if (this.alreadyFired(x, y, ctx.enemyfired)) continue;
            for (const [hx, hy] of ctx.hits) {
                const d = Math.abs(x - hx) + Math.abs(y - hy);
                if (d < minDist) { minDist = d; bestCell = { x, y }; }
            }
        }
        return bestCell;
    }
}

// ============================================================
// 工厂：根据难度等级 1-5 返回对应策略实例
// ============================================================
export function createAIStrategy(level: number): AIStrategy {
    switch (level) {
        case 1: return new AIRookie();
        case 2: return new AINovice();
        case 3: return new AIVeteran();
        case 4: return new AIExpert();
        case 5: return new AIMaster();
        default: return new AIRookie();
    }
}

/** 所有难度等级（用于 UI 展示） */
export const DIFFICULTY_LEVELS: { level: number; name: string; desc: string }[] = [
    { level: 1, name: '萌新', desc: '纯随机开火，不会追击' },
    { level: 2, name: '新手', desc: '随机为主，偶尔追击命中点周围' },
    { level: 3, name: '老兵', desc: 'Hunt/Target 模式，奇偶扫描 + 击中追击' },
    { level: 4, name: '高手', desc: '概率密度图，永远选最优开火点' },
    { level: 5, name: '战神', desc: '密度图 + 飞机形状先验，击中即锁定整架飞机' },
];
