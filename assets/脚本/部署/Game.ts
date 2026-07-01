
import Observers from 'db://assets/脚本/Observers';

const ob = Observers.getInstance();
import { plane } from '../../resources/预制/飞机/plane';
import { Enum, Vec2 } from 'cc';
import { AIStrategy, AIContext, FireTarget, createAIStrategy } from './AIStrategy';

export enum GameStatus {
    ONLOAD = 0,
    PRE = 1,
    READY = 2,
    FIGHT = 3,
    END = 4
}
enum CellDetail {
    EMPTY = 0,
    HASPLANE = 1,
    DESTROYED = 2
}
export default class Game {
    private static instance: Game;
    BOARD_SIZE = 10;
    myBoard: number[][] = []
    enemyBoard: number[][] = [];
    myPlanes = new Array<plane>()
    enemyPlanes = new Array<plane>()
    winner = "你!"
    /** 当前 AI 难度等级 1-5，默认 1（萌新） */
    aiLevel = 1
    /** 已命中格子记录 [x, y]（供 AI 追击算法使用） */
    aiHits: number[][] = [] as number[][]
    /** 当前 AI 策略实例（每次开局按 aiLevel 创建） */
    private aiStrategy: AIStrategy | null = null
    fight = {
        //开火顺序,首先由我方开火
        turn: 0,
        enemyfired: [] as number[][],
        fire: (target, pos) => {
            console.log(`[开火] target=${target} pos=(${pos.x},${pos.y})`)
            //如果是向敌方开火,则判断是否击中
            if (target == 1) {
                if (this.enemyBoard[pos.x][pos.y] == CellDetail.EMPTY) {
                    this.UI.enemyBoard.flash(pos)
                }
                else {
                    if (this.enemyBoard[pos.x][pos.y] == CellDetail.HASPLANE) {
                        this.enemyBoard[pos.x][pos.y] = CellDetail.DESTROYED
                        this.UI.enemyBoard.destroyed(pos)
                    }
                }
                //遍历enemyboard 如果没有1了 则游戏结束
                if (this.enemyBoard.every((row) => row.every((cell) => cell != CellDetail.HASPLANE))) {
                    this.winner = "你!"
                    this.status = GameStatus.END
                }
                else {
                    this.fight.turn = 1
                    setTimeout(() => {
                        // —— AI 开火：按当前难度策略选择目标 ——
                        // 懒初始化策略实例（若 aiLevel 变化或首次创建）
                        if (!this.aiStrategy || this.aiStrategy.level !== this.aiLevel) {
                            this.aiStrategy = createAIStrategy(this.aiLevel);
                        }
                        const ctx: AIContext = {
                            myBoard: this.myBoard,
                            enemyfired: this.fight.enemyfired,
                            hits: this.aiHits,
                            BOARD_SIZE: this.BOARD_SIZE,
                        };
                        const target: FireTarget = this.aiStrategy.chooseTarget(ctx);
                        let x = target.x, y = target.y;
                        // 防御：若策略返回的格子已开过火（理论不应发生），退回随机
                        if (this.fight.enemyfired.some((p) => p[0] == x && p[1] == y)) {
                            while (this.fight.enemyfired.some((p) => p[0] == x && p[1] == y)) {
                                x = Math.floor(Math.random() * 10);
                                y = Math.floor(Math.random() * 10);
                            }
                        }
                        this.fight.enemyfired.push([x, y])
                        console.log(`[AI L${this.aiLevel}] fire at (${x},${y})`)
                        if (this.myBoard[x][y] == CellDetail.EMPTY) {
                            this.UI.myBoard.flash(new Vec2(x, y))
                        }
                        else {
                            if (this.myBoard[x][y] == CellDetail.HASPLANE) {
                                this.myBoard[x][y] = CellDetail.DESTROYED
                                this.UI.myBoard.destroyed(new Vec2(x, y))
                                // 记录命中点，供追击算法使用
                                this.aiHits.push([x, y])
                            }
                        }
                        this.fight.turn = 0
                        //遍历myboard 如果全是2 则游戏结束
                        if (this.myBoard.every((row) => row.every((cell) => cell != CellDetail.HASPLANE))) {
                            this.status = GameStatus.END
                            this.winner = "敌方!"
                        }
                    }, 500);
                }
            }
            else {

            }
        }
    }
    UI = {
        myBoard: null,
        enemyBoard: null,
        myPlanes: [],
        enemyPlans: []
    }
    public static getInstance(): Game {
        if (!Game.instance) {
            Game.instance = new Game();
        }
        return Game.instance;
    }

    private _status = GameStatus.ONLOAD;
    get status() {
        return this._status;
    }
    set status(value: GameStatus) {
        if (this._status !== value) {
            this._status = value;
            switch (value) {
                case GameStatus.PRE:
                    ob.notify("gamePre", null);
                    break;
                case GameStatus.READY:
                    ob.notify("gameReady", null);
                    break;
                case GameStatus.FIGHT:
                    ob.notify("gameFight", null);
                    break;
                case GameStatus.END:
                    ob.notify("gameEnd", null);
                    break;
                case GameStatus.ONLOAD:
                    ob.notify("gameOnload", null);
                    break;
            }
        }
    }

    constructor() {
        // 初始化游戏逻辑
        console.log("Game initialized");
        this.myBoard = Array.from({ length: this.BOARD_SIZE }, () => Array(this.BOARD_SIZE).fill(0));
        this.enemyBoard = Array.from({ length: this.BOARD_SIZE }, () => Array(this.BOARD_SIZE).fill(0));
        // 随机生成敌方飞机位置和方向
        this.enemyPlanes.push(new plane(this.enemyPlanes));
        this.enemyPlanes.push(new plane(this.enemyPlanes));
        this.enemyPlanes.push(new plane(this.enemyPlanes));
        //将地方飞机占据的位置在地方棋盘上标记为1;
        this.enemyPlanes.forEach(p =>
            p.getPosition().forEach((pos) => {
                const x = pos.x;
                const y = pos.y;
                if (
                    x >= 0 && x < this.BOARD_SIZE &&
                    y >= 0 && y < this.BOARD_SIZE
                )
                    this.enemyBoard[x][y] = 1;
            }
            )
        );
        //生成棋盘
        // ob.notify("drawBoard", this.myBoard)

        //创建我方飞机 全停放到飞机场
        this.myPlanes.push(new plane());
        this.myPlanes.push(new plane());
        this.myPlanes.push(new plane());
        this.status = GameStatus.PRE
    }
}

