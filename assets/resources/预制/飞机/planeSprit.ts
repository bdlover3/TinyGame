import { _decorator, Component, EventMouse, UITransform, Vec3, Input, input, Vec2 } from 'cc';
import Observers from '../../../脚本/Observers'
import { plane, PlaneDirection } from "./plane"
const { ccclass, property } = _decorator;
const ob = Observers.getInstance();

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
        input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
    }

    onDestroy() {
        input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        input.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
    }

    private onMouseDown(event: EventMouse) {
        // 判断是否为点击（不拖动）
        this.isMoving = true;
        this._isDrag = false;
    }

    private onMouseMove(event: EventMouse) {

        if (!this.isMoving) return;
        // 获取鼠标在父节点坐标系下的位置
        const uiTransform = this.node.parent!.getComponent(UITransform)!;
        const mousePos = event.getUILocation();
        const localPos = uiTransform.convertToNodeSpaceAR(new Vec3(mousePos.x, mousePos.y, 0));
        this.node.setPosition(localPos);
        this.plane.setPosition([new Vec2(localPos.x, localPos.y)]);
        // 触发showPlaneDashedLine事件 发送(1)当前节点位置和(2)当前节点的朝向=
        ob.notify('drawProjection', this.plane);
        this._isDrag = true;
    }

    private onMouseUp(event: EventMouse) {

        if (this.isMoving) {
            if (!this._isDrag) {
                // 只有点击时才旋转
                this.setTowards((this.plane.getTowards() + 1) % 4); // 顺时针旋转    
                if (this.plane.getPosition())
                    ob.notify('drawProjection', this.plane, true);
            }
        }

        ob.notify('stopDrag');
        this.isMoving = false;
        this._isDrag = false;

    }

}


