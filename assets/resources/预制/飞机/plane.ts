import { Vec2 } from 'cc';
export enum PlaneDirection {
    UP = 0,
    RIGHT = 1,
    DOWN = 2,
    LEFT = 3
}
export class plane {
    private towards = PlaneDirection.UP; // 飞机朝向，默认向上
    private position: Array<Vec2> = null; // 飞机位置数组
    constructor(planes: Array<plane> | null = null) {

        if (planes) {
            // 如果传入了已有飞机数组，则随机生成一个飞机
            this.setRandomPlane(planes);
        } else {
            // 默认位置和朝向
            this.setTowards(PlaneDirection.UP);
        }
    }
    getTowards() {
        return this.towards;
    }
    setTowards(value: PlaneDirection) {
        this.towards = value;
        if (this.position&&this.position.length > 0)
            this.position = this.makePosition(this.position[0], value)
    }
    makePosition(value: Vec2, towards: PlaneDirection): Array<Vec2> {
        let position = new Array<Vec2>(10)
        //根据中心点设置飞机位置
        position[0] = value.clone(); // 假设飞机位置为中心点
        // 根据朝向设置顶点位置
        switch (towards) {
            case PlaneDirection.UP:
                position[1] = new Vec2(value.x, value.y + 1);
                position[2] = new Vec2(value.x - 2, value.y);
                position[3] = new Vec2(value.x - 1, value.y);
                position[4] = new Vec2(value.x + 1, value.y);
                position[5] = new Vec2(value.x + 2, value.y);
                position[6] = new Vec2(value.x, value.y - 1);
                position[7] = new Vec2(value.x - 1, value.y - 2);
                position[8] = new Vec2(value.x, value.y - 2);
                position[9] = new Vec2(value.x + 1, value.y - 2);
                break;
            case PlaneDirection.RIGHT:
                position[1] = new Vec2(value.x + 1, value.y);
                position[2] = new Vec2(value.x, value.y + 2);
                position[3] = new Vec2(value.x, value.y + 1);
                position[4] = new Vec2(value.x, value.y - 1);
                position[5] = new Vec2(value.x, value.y - 2);
                position[6] = new Vec2(value.x - 1, value.y);
                position[7] = new Vec2(value.x - 2, value.y + 1);
                position[8] = new Vec2(value.x - 2, value.y);
                position[9] = new Vec2(value.x - 2, value.y - 1);
                break;
            case PlaneDirection.DOWN:
                position[1] = new Vec2(value.x, value.y - 1);
                position[2] = new Vec2(value.x + 2, value.y);
                position[3] = new Vec2(value.x + 1, value.y);
                position[4] = new Vec2(value.x - 1, value.y);
                position[5] = new Vec2(value.x - 2, value.y);
                position[6] = new Vec2(value.x, value.y + 1);
                position[7] = new Vec2(value.x + 1, value.y + 2);
                position[8] = new Vec2(value.x, value.y + 2);
                position[9] = new Vec2(value.x - 1, value.y + 2);
                break;
            case PlaneDirection.LEFT:
                position[1] = new Vec2(value.x - 1, value.y);
                position[2] = new Vec2(value.x, value.y - 2);
                position[3] = new Vec2(value.x, value.y - 1);
                position[4] = new Vec2(value.x, value.y + 1);
                position[5] = new Vec2(value.x, value.y + 2);
                position[6] = new Vec2(value.x + 1, value.y);
                position[7] = new Vec2(value.x + 2, value.y - 1);
                position[8] = new Vec2(value.x + 2, value.y);
                position[9] = new Vec2(value.x + 2, value.y + 1);
                break;
        }
        return position;
    }
    getPosition() {
        return this.position;
    }
    setPosition(position: Array<Vec2>) {
        this.position = position;
    }

    //一个随机飞机
    public setRandomPlane(planes: plane[]) {
        let tryCount = 0;
        const maxTries = 10000;
        let success = false;
        let center = new Vec2(0, 0); // 中心点
        let direction = PlaneDirection.UP; // 默认朝向
        let position = new Array<Vec2>(10);
        while (tryCount < maxTries && !success) {
            // 随机生成中心点
            center = new Vec2(1 + Math.floor(Math.random() * 8), 1 + Math.floor(Math.random() * 8));
            // 随机生成朝向
            direction = Math.floor(Math.random() * 4) as PlaneDirection;
            position = this.makePosition(center, direction);
            // 根据中心点和朝向设置飞机位置
            const valid = this.checkValidity(position);
            if (!valid) {
                tryCount++;
                continue;
            }
            // 检查与已有飞机是否重叠
            let overlap = false;
            for (const other of planes) {
                if (!other.position) continue;
                for (const p1 of position) {
                    for (const p2 of other.position) {
                        if (p1 && p2 && p1.x === p2.x && p1.y === p2.y) {
                            overlap = true;
                            break;
                        }
                    }
                    if (overlap) break;
                }
                if (overlap) break;
            }
            if (!overlap) {
                success = true;
                break;
            }
            tryCount++;
        }
        if (!success) {
            throw new Error('无法生成不重叠的随机飞机');
        }
        else {
            this.setPosition(position);
            this.setTowards(direction);
        }
    }
    //测试是否符合条件
    private checkValidity(position): boolean {
        //检验positon内所有点是否在棋盘内
        for (let i = 0; i < position.length; i++) {
            if (position[i].x < 0 || position[i].x > 9 || position[i].y < 0 || position[i].y > 9) {
                return false;
            }
        }
        return true;
    }
}


