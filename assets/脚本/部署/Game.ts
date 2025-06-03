
import Observers from 'db://assets/脚本/Observers';

const ob = Observers.getInstance();
import { plane } from '../../resources/预制/飞机/plane';


export default class Game {
    private static instance: Game;
    private BOARD_SIZE = 10;
    myBoard: number[][] = []
    enemyBoard: number[][] = [];
    myPlanes = new Array<plane>()
    enemyPlanes = new Array<plane>()
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
    }
}

