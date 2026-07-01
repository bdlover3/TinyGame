import { _decorator, Component, Node, Graphics, Color, input, Input, UITransform, EventMouse, Vec2, Vec3, tween, Label } from 'cc';
import Observers from '../../../脚本/Observers';
// Update the path below to the correct location of your 'plane' module
import { plane } from '../飞机/plane';
// If the above path is incorrect, adjust the number of '../' as needed to match your project structure.
import Game, { GameStatus } from "./../../../脚本/部署/Game"
const { ccclass, property } = _decorator;
const ob = Observers.getInstance();
const game = Game.getInstance();
@ccclass('board')
export class board extends Component {
    @property(Node)
    graphicsNode: Node = null!; // 绑定Graphics节点
    @property(Node)
    DragGraphicsNode: Node = null!; // 拖动时的遮罩节点
    private cellSize = 50; // 每个格子的大小
    private graphics = null!; // Graphics组件
    private dragGraphics = null!; // 拖动时的Graphics组件
    private lastcell = new Vec2
    private UIlocation = new Vec2(50, 150);
    onLoad() {
        if (this.node.getParent().name == "己方棋盘") {
            game.UI.myBoard = this
        }
        else {
            game.UI.enemyBoard = this
            this.node.on(Input.EventType.TOUCH_END, this.shoot, this)
        }

        this.graphics = this.graphicsNode.getComponent(Graphics);
        this.graphics.clear(); // 清除旧的绘制
        this.graphics.lineWidth = 3; // 设置线条宽度

        this.dragGraphics = this.DragGraphicsNode.getComponent(Graphics);
        this.dragGraphics.clear(); // 清除旧的绘制
        this.dragGraphics.lineWidth = 3; // 设置线条宽度
        this.dragGraphics.fillColor = new Color(128, 128, 128, 128); // 设置拖动时的填充颜色
        // 初始化棋盘绘制
        // ob.addObserver('drawBoard', this.initBoard.bind(this));
        // 添加点击事件监听=
        ob.addObserver('drawProjection', this.drawProjection.bind(this));

    }

    allClear() {
        this.graphics.clear(); // 清除旧的绘制
        this.dragGraphics.clear(); // 清除旧的绘制
    }
    flash(pos) {
        const x = pos.x * this.cellSize + this.UIlocation.x;
        const y = pos.y * this.cellSize + this.UIlocation.y;
        this.graphics.fillColor = new Color(128, 128, 128, 128);
        this.graphics.rect(x, y, this.cellSize, this.cellSize);
        this.graphics.fill();
        this.graphics.stroke();

        // setTimeout(() => {
        //     // 重新绘制棋盘格线
        //     for (let i = 0; i < 10; i++) {
        //         for (let j = 0; j < 10; j++) {
        //             const gx = i * this.cellSize + this.UIlocation.x;
        //             const gy = j * this.cellSize + this.UIlocation.y;
        //             this.graphics.rect(gx, gy, this.cellSize, this.cellSize);
        //             this.graphics.stroke();
        //         }
        //     }
        // }, 500);
    }
    destroyed(pos): boolean {
        const x = pos.x * this.cellSize + this.UIlocation.x;
        const y = pos.y * this.cellSize + this.UIlocation.y;
        this.graphics.fillColor = new Color(255, 0, 0, 128); // 半透明红色
        this.graphics.rect(x, y, this.cellSize, this.cellSize);
        this.graphics.fill();
        this.graphics.stroke();

        // —— 爆炸特效：在该格子上加载 SVG 爆炸图，缩放后淡出 ——
        this.showExplosion(x, y);
        return true;

    }

    /** 在棋盘坐标 (x, y) 处显示爆炸特效：用 Graphics 画放射状火花 + 缩放淡出 */
    private showExplosion(x: number, y: number): void {
        const node = new Node('Explosion');
        node.setPosition(x + this.cellSize / 2, y + this.cellSize / 2, 10);
        this.graphicsNode.parent.addChild(node);

        const g = node.addComponent(Graphics);
        // 外圈火焰（橙红半透明）
        g.fillColor = new Color(255, 100, 0, 180);
        g.circle(0, 0, 24);
        g.fill();

        // 内圈高亮（黄）
        g.fillColor = new Color(255, 220, 50, 220);
        g.circle(0, 0, 14);
        g.fill();

        // 8 个向外喷射的火焰尖刺
        g.fillColor = new Color(255, 160, 0, 200);
        for (let i = 0; i < 8; i++) {
            const a = (Math.PI * 2 * i) / 8;
            g.moveTo(0, 0);
            g.lineTo(Math.cos(a - 0.25) * 8, Math.sin(a - 0.25) * 8);
            g.lineTo(Math.cos(a) * 28, Math.sin(a) * 28);
            g.lineTo(Math.cos(a + 0.25) * 8, Math.sin(a + 0.25) * 8);
            g.close();
            g.fill();
        }

        // 中心白点
        g.fillColor = new Color(255, 255, 255, 255);
        g.circle(0, 0, 5);
        g.fill();

        // 动画：缩小弹出 → 停留 → 淡出销毁
        node.setScale(1.8, 1.8, 1);
        tween(node)
            .to(0.12, { scale: new Vec3(1.0, 1.0, 1) })
            .delay(0.3)
            .to(0.3, { scale: new Vec3(0.2, 0.2, 1), opacity: 0 })
            .call(() => node.destroy())
            .start();
    }

    shoot(event) {
        if (game.status != GameStatus.FIGHT)
            return
        if (game.fight.turn != 0)
            return
        // 假设 event 是鼠标事件对象，从外部传入
        const mouseLocation = new Vec2(event.getUILocation().x, event.getUILocation().y);

        const pos = this.convertTOCell(mouseLocation);
        if (pos.x < 0 || pos.x > 9 || pos.y < 0 || pos.y > 9)
            return
        game.fight.fire(1, pos)

    }

    convertTOCell(location: Vec2) {
        let mouseCell = new Vec2
        // 将世界坐标转换为本地UI坐标
        if (this.node.getParent().name == "己方棋盘")
            mouseCell.x = Math.floor((location.x - this.UIlocation.x) / this.cellSize)
        else
            mouseCell.x = Math.floor((location.x - this.UIlocation.x - 669) / this.cellSize)
        mouseCell.y = Math.floor((location.y - this.UIlocation.y) / this.cellSize)
        return mouseCell

    }
    drawProjection(location, plane: plane, istouch?) {
        if (game.status != GameStatus.PRE && game.status != GameStatus.READY)
            return
        if (this.node.getParent().name != "己方棋盘")
            return

        const mouseCell = this.convertTOCell(location)
        if (istouch) {
            if ((plane.getPosition().length < 10)) {
                return
            }
        }
        else {
            if (this.lastcell === mouseCell)
                return
        }

        this.lastcell = mouseCell
        const position = istouch ? plane.getPosition() : plane.makePosition(mouseCell, plane.getTowards())
        //遍历position 如果positon所有点都在棋盘内,则在每个positon所在的格子绘制半透明灰色
        const boardSize = 10;
        const allInBoard = position.every(
            (pos: Vec2) =>
                pos.x >= 0 && pos.x < boardSize && pos.y >= 0 && pos.y < boardSize
        ) && game.myPlanes.every(
            (otherPlane: plane) => {
                if (plane == otherPlane)
                    return true;
                const otherPos = otherPlane.getPosition?.();
                if (!otherPos) return true;
                // 检查当前位置与已有飞机是否有重叠
                return position.every(
                    (p: Vec2) => !otherPos.some((op: Vec2) => op.x === p.x && op.y === p.y)
                );
            }
        );

        this.dragGraphics.clear();
        if (allInBoard) {
            this.dragGraphics.fillColor = new Color(128, 128, 128, 128);
            for (const pos of position) {
                const x = pos.x * this.cellSize + this.UIlocation.x;
                const y = pos.y * this.cellSize + this.UIlocation.y;
                this.dragGraphics.rect(x, y, this.cellSize, this.cellSize);
                this.dragGraphics.fill();
                this.dragGraphics.stroke();
            }
            plane.setPosition(position)
        }
        else
            plane.setPosition(null)

        for (const otherPlane of game.myPlanes) {
            if (otherPlane === plane) continue;
            const otherPos = otherPlane.getPosition?.();
            if (otherPos && otherPos.length === 10) {
                this.dragGraphics.fillColor = new Color(210, 180, 140, 128); // 半透明土黄色
                for (const pos of otherPos) {
                    const x = pos.x * this.cellSize + this.UIlocation.x;
                    const y = pos.y * this.cellSize + this.UIlocation.y;
                    this.dragGraphics.rect(x, y, this.cellSize, this.cellSize);
                    this.dragGraphics.fill();
                    this.dragGraphics.stroke();
                }
            }
        }

        const allReady = game.myPlanes.every(
            (p: plane) => {
                const pos = p.getPosition?.();
                return pos && pos.length === 10;
            }
        );
        //确认是否已经可以开始游戏
        if (allReady) {
            game.status = GameStatus.READY;
        }
        else {
            game.status = GameStatus.PRE
        }


    }

    initBoard(board) {
        // 初始化棋盘数据
        board = board ? board : Array.from({ length: 10 }, () => Array(10).fill(0));
        const boardSize = board.length;

        //在棋盘左侧 新建label 添加从下到上数字类的纵坐标  在棋盘下方 新建label 添加从左到右字母类的横坐标 与棋盘board的格子对应
        // 清除旧的坐标Label
        this.node.children.forEach(child => {
            if (child.name.startsWith('coord-label-')) {
                child.destroy();
            }
        });

        // 纵坐标（数字，从下到上）
        for (let i = 0; i < boardSize; i++) {
            const labelNode = new Node(`coord-label-y-${i}`);
            labelNode.name = `coord-label-y-${i}`;
            const label = labelNode.addComponent(Label);
            label.string = `${10 - boardSize + i} `;
            label.fontSize = 20;
            label.color = new Color(0, 0, 0, 255);
            // 设置位置：左侧，y与格子对齐
            labelNode.setPosition(
                30 - 667, // 距离棋盘左侧一定距离
                i * this.cellSize + 100 + this.cellSize / 2 - 375 + this.UIlocation.x
            );
            this.node.addChild(labelNode);
        }
        // 横坐标（字母，从左到右）
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let j = 0; j < boardSize; j++) {
            const labelNode = new Node(`coord-label-x-${j}`);
            labelNode.name = `coord-label-x-${j}`;
            const label = labelNode.addComponent(Label);
            label.string = letters[j];
            label.fontSize = 20;
            label.color = new Color(0, 0, 0, 255);
            // 设置位置：下方，x与格子对齐
            labelNode.setPosition(
                j * this.cellSize + this.UIlocation.x + this.cellSize / 2 - 667, // 距离棋盘下方一定距离
                80 - 375 + this.UIlocation.x// 棋盘下方
            );
            this.node.addChild(labelNode);
        }
        // 绘制棋盘
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                const x = i * this.cellSize + this.UIlocation.x;
                const y = j * this.cellSize + this.UIlocation.y;
                this.graphics.rect(x, y, this.cellSize, this.cellSize);
                this.graphics.stroke();
            }
        }

    }
    update(deltaTime: number) {
    }

}


