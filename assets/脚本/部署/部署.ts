import { _decorator, Component, assetManager, Button, Label, Color, Node, Prefab, instantiate, Canvas } from 'cc';
const { ccclass, property } = _decorator;
import Game, { GameStatus } from "./Game"
import { planeSprit } from '../../resources/预制/飞机/planeSprit';
import Observers from '../Observers';
const ob = Observers.getInstance()
const game: Game = Game.getInstance()
@ccclass('部署')
export class NewComponent extends Component {
    @property({ type: Prefab })
    private planePrefab: Prefab = null
    protected onLoad(): void {

        ob.addObserver('gameReady', () => {
            // 创建开始战斗按钮
            const startBtn = new Node('StartFightBtn');
            const btnComp = startBtn.addComponent(Button);
            const labelNode = new Node('Label');
            const label = labelNode.addComponent(Label);
            label.string = '开始战斗';
            labelNode.parent = startBtn;
            startBtn.setPosition(200, 0, 0);
            this.node.addChild(startBtn);

            btnComp.node.on(Button.EventType.CLICK, () => {
                // 移除按钮
                startBtn.removeFromParent();
                // 生成敌方棋盘
                game.UI.enemyBoard.initBoard(game.enemyBoard);
                // 变更状态
                game.status = GameStatus.FIGHT;
            });
        });
        ob.addObserver('gamePre', () => {
            const startBtn = this.node.getChildByName('StartFightBtn');
            if (startBtn) {
                startBtn.removeFromParent();
            }
        });
    }
    start() {

        //绘制己方棋盘
        game.UI.myBoard.initBoard(game.myBoard)
        //绘制三架飞机 
        const planeNodes: Node[] = [];
        for (let i = 0; i < 3; i++) {
            const planeNode = instantiate(this.planePrefab);
            // 计算Y坐标：两上一下排列
            // 右侧画面中心，假设父节点锚点在中心
            planeNode.setPosition(100 + (i % 2) * 250, -200 + 200 * (i == 2 ? 1 : 0), 0); // 350为右侧合适的X坐标，可根据实际调整
            // 将 planeNode 中的 plane 指向 game.myPlanes[i]
            (planeNode.getComponentInChildren("plane") as planeSprit).setPlane(game.myPlanes[i]);
            this.node.addChild(planeNode);
            game.UI.myPlanes[i] = planeNode
            planeNodes.push(planeNode);
        }



    }


    update(deltaTime: number) {

    }
}

