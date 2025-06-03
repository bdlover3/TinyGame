
import Observers from 'db://assets/脚本/Observers';

const ob = Observers.getInstance();
import { plane } from '../../resources/预制/飞机/plane';
import { Enum } from 'cc';

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
    private BOARD_SIZE = 10;
    myBoard: number[][] = []
    enemyBoard: number[][] = [];
    myPlanes = new Array<plane>()
    enemyPlanes = new Array<plane>()
    fight = {
        //开火顺序,首先由我方开火
        turn: 0,

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
    fire(target, pos) {
        console.log(this.enemyBoard)
        if (target == 1) {
            if (this.enemyBoard[pos.x][pos.y] == CellDetail.EMPTY) {
                console.log(this.UI.enemyBoard)
                this.UI.enemyBoard.flash(pos)
            }
            else {
                if (this.enemyBoard[pos.x][pos.y] == CellDetail.HASPLANE) {
                    this.enemyBoard[pos.x][pos.y] = CellDetail.DESTROYED
                    this.UI.enemyBoard.destroyed(pos)
                }
            }
        }
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

