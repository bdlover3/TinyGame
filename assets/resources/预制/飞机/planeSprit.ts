import { _decorator, Component, EventMouse, UITransform, Vec3, Input, input, Vec2, EventTouch } from 'cc';
import Observers from '../../../脚本/Observers'
import { plane, PlaneDirection } from "./plane"
import Game, { GameStatus } from 'db://assets/脚本/部署/Game';
const { ccclass, property } = _decorator;
const ob = Observers.getInstance();
const game = Game.getInstance();
@ccclass('plane')
export class planeSprit extends Component {
    private plane: plane = new plane();
    private isMoving = false;
    private _isDrag = false;
    private setTowards(value: PlaneDirection) {
        this.plane.setTowards(value);
        // 修改飞机精灵方向
        switch (value) {
            case PlaneDirection.UP:
                this.node.setRotationFromEuler(0, 0, 0);
                break;
            case PlaneDirection.RIGHT:
                this.node.setRotationFromEuler(0, 0, -90);
                break;
            case PlaneDirection.DOWN:
                this.node.setRotationFromEuler(0, 0, -180);
                break;
            case PlaneDirection.LEFT:
                this.node.setRotationFromEuler(0, 0, 90);
                break;
        }
    }
    setPlane(plane) {
        this.plane = plane
        this.setTowards(plane.getTowards())
    }

    onLoad() {
        // 只监听本节点的点击
        this.node.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
this.node.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
this.node.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onDestroy() {
        this.node.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
this.node.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
this.node.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    private onTouchStart(event: EventTouch) {

        if (game.status != GameStatus.PRE && game.status != GameStatus.READY)
            return
        // 判断是否为点击（不拖动）
        this.isMoving = true;
        this._isDrag = false;
    }

    private onTouchMove(event: EventTouch) {


        if (game.status != GameStatus.PRE && game.status != GameStatus.READY)
            return
        if (!this.isMoving) return;
        // 获取鼠标在父节点坐标系下的位置
        const uiTransform = this.node.parent!.getComponent(UITransform)!;
        const mousePos = event.getUILocation();
        const localPos = uiTransform.convertToNodeSpaceAR(new Vec3(mousePos.x, mousePos.y, 100));
        this.node.setPosition(localPos);
        this.plane.setPosition([new Vec2(localPos.x, localPos.y)]);
        // 触发showPlaneDashedLine事件 发送(1)当前节点位置和(2)当前节点的朝向=
        ob.notify('drawProjection', event.getUILocation(), this.plane);
        this._isDrag = true;

        //todo 临时将z提升 避免被两外两架飞机截取事件
    }

    private onTouchEnd(event: EventTouch) {
        if (game.status != GameStatus.PRE && game.status != GameStatus.READY)
            return

        this.node.setPosition(this.node.position.x, this.node.position.y, 3);
        if (this.isMoving) {
            if (!this._isDrag) {
                // 只有点击时才旋转
                this.setTowards((this.plane.getTowards() + 1) % 4); // 顺时针旋转    
                if (this.plane.getPosition())
                    ob.notify('drawProjection', event.getUILocation(), this.plane, true);
            }
        }

        this.isMoving = false;
        this._isDrag = false;

    }

}


