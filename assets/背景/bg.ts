import { _decorator, Component, Node, UITransform } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('bg')
export class bg extends Component {
    start() {
        this.node.setSiblingIndex (0); // 确保背景在最底层
    }

    update(deltaTime: number) {
        const speed = 100; // pixels per second
        const node = this.node;
        node.position = node.position.add3f(-speed * deltaTime, 0, 0);

        if (node.position.x <= -1000) {
            node.position = node.position.add3f(990 , 0, 0);
        }
    }
}


