import { _decorator, Component, Input, Button, Label, Color, Node, Prefab, instantiate, Canvas, input } from 'cc';
const { ccclass, property } = _decorator;
import Game, { GameStatus } from "./Game"
import { planeSprit } from '../../resources/预制/飞机/planeSprit';
import Observers from '../Observers';
import { plane } from '../../resources/预制/飞机/plane';
import { Sprite, SpriteFrame, resources } from 'cc';
import { DIFFICULTY_LEVELS } from './AIStrategy';
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
            // 加载黄色按钮图片资源
            resources.load('yellow_button00', SpriteFrame, (err, spriteFrame) => {
                if (!err && spriteFrame) {
                    const sprite = startBtn.addComponent(Sprite);
                    sprite.spriteFrame = spriteFrame;
                    // 设置按钮的大小
                    const buttonWidth = 400;
                    const buttonHeight = 200;
                    sprite.spriteFrame.getOriginalSize().width = buttonWidth;
                    sprite.spriteFrame.getOriginalSize().height = buttonHeight;
                }
            });
            const btnComp = startBtn.addComponent(Button);
            const labelNode = new Node('Label');
            const label = labelNode.addComponent(Label);
            label.string = '开始战斗';
            labelNode.parent = startBtn;
            startBtn.setPosition(200, 0, 0);
            this.node.addChild(startBtn);

            // —— 难度选择 UI：5 个按钮纵向排列在开战按钮上方 ——
            // 开战按钮在 (200, 0)，难度面板放在其正上方，从 y=600 往下排
            const difficultyContainer = new Node('DifficultyPicker');
            difficultyContainer.setPosition(200, 600, 0);
            this.node.addChild(difficultyContainer);

            const difficultyTitle = new Node('DifficultyTitle');
            const titleLabel = difficultyTitle.addComponent(Label);
            titleLabel.string = '选择 AI 难度';
            titleLabel.fontSize = 40;
            titleLabel.color = Color.WHITE;
            difficultyTitle.setPosition(0, 60, 0);
            difficultyTitle.parent = difficultyContainer;

            // 保存所有难度按钮的 label，用于切换高亮色
            const difficultyLabels: Label[] = [];
            // 默认选中当前 game.aiLevel
            const updateHighlight = () => {
                difficultyLabels.forEach((lbl, idx) => {
                    lbl.color = (DIFFICULTY_LEVELS[idx].level === game.aiLevel) ? Color.YELLOW : Color.WHITE;
                });
            };

            // 5 个按钮横向单行排列，避免遮挡且紧凑
            DIFFICULTY_LEVELS.forEach((diff, idx) => {
                const btnNode = new Node(`DiffBtn_${diff.level}`);
                // 横向间距 180，5 个按钮总宽 900，居中
                btnNode.setPosition(-360 + idx * 180, 0, 0);
                const btn = btnNode.addComponent(Button);
                const lbl = btnNode.addComponent(Label);
                lbl.string = `Lv${diff.level} ${diff.name}`;
                lbl.fontSize = 28;
                lbl.lineHeight = 32;
                difficultyLabels.push(lbl);

                // 悬浮提示：在按钮下方显示该难度描述
                const descNode = new Node(`Desc_${diff.level}`);
                const descLabel = descNode.addComponent(Label);
                descLabel.string = diff.desc;
                descLabel.fontSize = 18;
                descLabel.color = Color.CYAN;
                descNode.setPosition(0, -30, 0);
                descNode.parent = btnNode;
                descNode.active = false;

                btnNode.on(Input.EventType.MOUSE_ENTER, () => { descNode.active = true; });
                btnNode.on(Input.EventType.MOUSE_LEAVE, () => { descNode.active = false; });

                btnNode.on(Input.EventType.TOUCH_END, () => {
                    game.aiLevel = diff.level;
                    updateHighlight();
                    console.log(`AI 难度切换为 Lv${diff.level} ${diff.name}`);
                });

                btnNode.parent = difficultyContainer;
            });
            updateHighlight();

            btnComp.node.on(Input.EventType.TOUCH_END, () => {
                //遍历所有飞机 将飞机所在的点放到myBoard中
                for (let i = 0; i < 3; i++) {
                    const plane = game.myPlanes[i];
                    const position = plane.getPosition();    // 获取飞机的位置
                    for (let j = 0; j < position.length; j++) {
                        const pos = position[j];
                        game.myBoard[pos.x][pos.y] = 1;
                    }
                }
                // 移除按钮 + 难度选择 UI
                startBtn.removeFromParent();
                difficultyContainer.removeFromParent();
                // 重置 AI 状态（开战前清空，确保新策略从零开始）
                game.fight.enemyfired = [];
                game.aiHits = [];
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
            const picker = this.node.getChildByName('DifficultyPicker');
            if (picker) {
                picker.removeFromParent();
            }
        });
        ob.addObserver('gameEnd', () => {
            //弹出提示:游戏结束
            // 创建提示节点
            // 创建可点击的按钮节点
            const gameEndButtonNode = new Node('GameEndButton');
            // 加载黄色按钮图片资源
            resources.load('yellow_button00', SpriteFrame, (err, spriteFrame) => {
                if (!err && spriteFrame) {
                    const sprite = gameEndButtonNode.addComponent(Sprite);
                    sprite.spriteFrame = spriteFrame;    // 设置按钮图片        
                    // 设置按钮的大小
                    const buttonWidth = 400;
                    const buttonHeight = 200;   
                    sprite.spriteFrame.getOriginalSize().width = buttonWidth;
                    sprite.spriteFrame.getOriginalSize().height = buttonHeight;

                }
            })
            const gameEndButton = gameEndButtonNode.addComponent(Button);
            // 设置按钮位置在画面中心
            gameEndButtonNode.setPosition(0, 0, 100);

            // 创建标签节点
            const gameEndLabelNode = new Node('GameEndLabel');
            const gameEndLabel = gameEndLabelNode.addComponent(Label);
            gameEndLabel.string = '游戏结束了!胜利者是:' + game.winner;
            gameEndLabel.fontSize = 76; // 设置字体大小
            gameEndLabel.color = Color.GREEN; // 设置字体颜色为绿色

            // 将标签节点添加到按钮节点下
            gameEndLabelNode.parent = gameEndButtonNode;

            // 将按钮节点添加到当前节点下
            this.node.addChild(gameEndButtonNode);
            //添加点击事件
            gameEndButtonNode.on(Input.EventType.TOUCH_END, () => {
                // 移除提示节点
                gameEndLabelNode.removeFromParent();
                // 重新开始游戏
                game.status = GameStatus.PRE;
                // 重置游戏数据
                game.myBoard = Array.from({ length: game.BOARD_SIZE }, () => Array(game.BOARD_SIZE).fill(0));
                game.enemyBoard = Array.from({ length: game.BOARD_SIZE }, () => Array(game.BOARD_SIZE).fill(0));
                game.enemyPlanes = [];
                // 重置 AI 状态
                game.fight.enemyfired = [];
                game.aiHits = [];

                //移除己方飞机
                for (let i = 0; i < 3; i++) {
                    const planeNode = game.UI.myPlanes[i];
                    planeNode.removeFromParent();
                }
                game.myPlanes = [];
                game.myPlanes.push(new plane());
                game.myPlanes.push(new plane());
                game.myPlanes.push(new plane());
                game.winner = "你!";
                // 重新生成飞机
                this.start();
                // 重新生成敌方飞机
                game.enemyPlanes.push(new plane(game.enemyPlanes));
                game.enemyPlanes.push(new plane(game.enemyPlanes));
                game.enemyPlanes.push(new plane(game.enemyPlanes));
                //将地方飞机占据的位置在地方棋盘上标记为1;
                game.enemyPlanes.forEach(p =>
                    p.getPosition().forEach((pos) => {
                        const x = pos.x;
                        const y = pos.y;
                        if (
                            x >= 0 && x < game.BOARD_SIZE &&
                            y >= 0 && y < game.BOARD_SIZE
                        )
                            game.enemyBoard[x][y] = 1;
                    })
                    //移除地方棋盘
                    //重新绘制己方棋盘
                );

                game.UI.myBoard.allClear()
                game.UI.enemyBoard.allClear()
                game.UI.myBoard.initBoard(game.myBoard)
                //清除敌方棋盘 
                //移除地方飞机
            })
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

