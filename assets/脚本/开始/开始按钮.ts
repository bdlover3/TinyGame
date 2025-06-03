import { _decorator, Component, director, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('开始按钮脚本')
export class NewComponent extends Component {
    start() {
        this.node.on(Node.EventType.MOUSE_DOWN,()=>{
            console.log("测")
            director.loadScene("部署")
    })

    }

    update(deltaTime: number) {
        
    }
}


