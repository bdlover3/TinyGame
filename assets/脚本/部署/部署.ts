import { _decorator, Component, assetManager, Button, Label, Color, Node, Prefab, instantiate, Canvas } from 'cc';
const { ccclass, property } = _decorator;
import Game from "./Game"
import { planeSprit } from '../../resources/预制/飞机/planeSprit';


const game: Game = Game.getInstance()
@ccclass('部署')
export class NewComponent extends Component {
    @property({ type: Prefab })
    private planePrefab: Prefab = null
    protected onLoad(): void {
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

