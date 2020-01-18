/*
定起点、定终点、不对称TSP问题
w为存储任意两点间耗时邻接矩阵，n为w阶数
0号位置为起点，n-1号位置为终点
返回值为整型数组，如[0, 2, 1, 3]表示路径0->2->1->3
*/

function calc (w, n) {
    ans = [0]
    visited = [true]
    for (let i = 1; i < n-1; i++) {
        visited[i] = false
    }
    // 最近邻点法
    for (let i = 0; i < n-2; i++) {
        selected = -1
        for (let j = 0; j < n-1; j++) {
            if (!visited[j]) {
                if (selected == -1 || w[ans[i]][j] < w[ans[i]][selected]) {
                    selected = j
                }
            }
        }
        ans[i+1] = selected
        visited[selected] = true
    }
    ans[n-1] = n-1
    return ans
}

exports.calc = calc
