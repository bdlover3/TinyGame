import { _decorator, Component, Node, Graphics, Label, Color, input, Input, UITransform, EventMouse, Vec2 } from 'cc';
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
    onLoad() {
        if (this.node.getParent().name == "己方棋盘") {
            game.UI.myBoard = this
        }
        else {
            game.UI.enemyBoard = this
            this.node.on(Input.EventType.MOUSE_DOWN,this.shoot,this)
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
    flash(pos)
    {
        const x = pos.x * this.cellSize + 50;
        const y = pos.y * this.cellSize + 150;
        this.graphics.fillColor = new Color(128, 128, 128, 128);
        this.graphics.rect(x, y, this.cellSize, this.cellSize);
        this.graphics.fill();
        this.graphics.stroke();

        setTimeout(() => {
            this.graphics.clear();
            // 重新绘制棋盘格线
            for (let i = 0; i < 10; i++) {
                for (let j = 0; j < 10; j++) {
                    const gx = i * this.cellSize + 50;
                    const gy = j * this.cellSize + 150;
                    this.graphics.rect(gx, gy, this.cellSize, this.cellSize);
                    this.graphics.stroke();
                }
            }
        }, 500);
    }
    destroyed(pos): boolean {
        const x = pos.x * this.cellSize + 50;
        const y = pos.y * this.cellSize + 150;
        this.graphics.fillColor = new Color(255, 0, 0, 128); // 半透明红色
        this.graphics.rect(x, y, this.cellSize, this.cellSize);
        this.graphics.fill();
        this.graphics.stroke();
        return true;
        
    }

    shoot(event){
        if(game.status!= GameStatus.FIGHT)
            return
        if (game.fight.turn != 0)
            return
        const pos = this.convertTOCell(event.getLocation())
        game.fire(1,pos)

    }

    convertTOCell(location) {
        let mouseCell = new Vec2
        mouseCell.x = Math.floor((location.x - 50) / this.cellSize)
        mouseCell.y = Math.floor((location.y - 150) / this.cellSize)
        return mouseCell

    }
    drawProjection(location, plane: plane, isclick?) {
        if (game.status != GameStatus.PRE && game.status != GameStatus.READY)
            return
        if (this.node.getParent().name != "己方棋盘")
            return

        const mouseCell = this.convertTOCell(location)
        if (isclick) {
            if ((plane.getPosition().length < 10)) {
                return
            }
        }
        else {
            if (this.lastcell === mouseCell)
                return
        }

        this.lastcell = mouseCell
        const position = isclick ? plane.getPosition() : plane.makePosition(mouseCell, plane.getTowards())
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
                const x = pos.x * this.cellSize + 50;
                const y = pos.y * this.cellSize + 150;
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
                    const x = pos.x * this.cellSize + 50;
                    const y = pos.y * this.cellSize + 150;
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
                i * this.cellSize + 100 + this.cellSize / 2 - 375 + 50
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
                j * this.cellSize + 50 + this.cellSize / 2 - 667, // 距离棋盘下方一定距离
                80 - 375 + 50// 棋盘下方
            );
            this.node.addChild(labelNode);
        }
        // 绘制棋盘
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                const x = i * this.cellSize + 50;
                const y = j * this.cellSize + 150;
                this.graphics.rect(x, y, this.cellSize, this.cellSize);
                this.graphics.stroke();
            }
        }

    }
    update(deltaTime: number) {
    }

}


