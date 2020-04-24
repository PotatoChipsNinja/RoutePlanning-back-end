const callAPI_GET = require('./server').callAPI_GET
const callAPI_POST = require('./server').callAPI_POST

var key = ''

class Result {
    constructor () {
        this.status = false
        this.search = []
        this.route = {
            distance: -1,
            duration: -1,
            path: []
        }
    }

    addSearch (qName, sName, loc) {
        for (let i = 0; i < qName.length; i++) {
            this.search.push({
                q_name: qName[i],
                s_name: sName[i],
                location: loc[i]
            })
        }
    }

    addPath (from, to, distance, duration) {
        this.route.path.push({
            from: from,
            to: to,
            distance: distance,
            duration: duration
        })
    }

    sumUp () {
        this.route.distance = 0
        this.route.duration = 0
        for (let iterator of this.route.path) {
            this.route.distance += iterator.distance
            this.route.duration += iterator.duration
        }
    }

    toString () {
        return JSON.stringify(this)
    }
}

function server (params) {
    // 生成地点名称数组
    names = params.origin + ',' + params.transits + ',' + params.destination
    arrName = names.split(',')
    qName = names.split(',')

    result = new Result()   // 创建结果对象

    if ('location' in params) {
        // 请求指定了坐标
        arrLoc = params.location.split('|')
        city = getLoc([arrName[0]], []) // 以出发点查询城市名
    } else {
        // 没有指定坐标，尝试查询坐标
        arrLoc = []
        city = getLoc(arrName, arrLoc)  // 若全部坐标获取成功则返回城市名，否则返回false
    }

    if (city == false) {
        return result.toString()
    }

    // 求解TSP问题
    last = 0
    visited = [true]
    for (let i = 1; i < arrName.length-1; i++) {
        visited[i] = false
    }
    // 最近邻点法
    for (let i = 0; i < arrName.length-1; i++) {
        // 从ans[i]起
        dist = []
        dura = []
        for (let i = 0; i < arrLoc.length; i++) {
            if (visited[i]) {
                dist[i] = -1
                dura[i] = -1
            }
        }
        direction(params.method, arrLoc, last, city, dist, dura)

        if (i == arrName.length-2) {
            result.addPath(arrName[last], arrName[i+1], dist[i+1], dura[i+1])
        } else {
            selected = -1
            for (let j = 0; j < arrName.length-1; j++) {
                if (!visited[j] && dist[j] != -1) {
                    if (selected == -1 || dura[j] < dura[selected]) {
                        selected = j
                    }
                }
            }
            if (selected == -1) {
                result.route.path = []
                return result.toString()
            } else {
                result.addPath(arrName[last], arrName[selected], dist[selected], dura[selected])
                last = selected
                visited[selected] = true
            }
        }
    }

    // 计算完成，写进返回信息中
    result.addSearch(qName, arrName, arrLoc)
    result.sumUp()
    result.status = true
    return result.toString()
}

function getLoc(arrName, arrLoc) {
    params = {ops: []}
    for (let i = 0; i < arrName.length; i++) {
        params.ops[i] = {url: '/v3/place/text?key=' + key + '&keywords=' + arrName[i]}
    }
    res = callAPI_POST('https://restapi.amap.com/v3/batch?key=' + key, params)

    for (let i = 0; i < arrName.length; i++) {
        if (res[i].body.status == 1 && res[i].body.count != 0) {
            arrLoc[i] = res[i].body.pois[0].location
            arrName[i] = res[i].body.pois[0].name
        } else {
            return false
        }
    }
    return res[0].body.pois[0].cityname
}

function direction (method, arrLoc, index, city, dist, dura) {
    switch (method) {
        case '0':
            // TODO: 查询Cache
            params = {ops: []}
            ht = []     // 哈希表，记录对应关系
            for (let i = 0; i < arrLoc.length; i++) {
                if (dist[i] == null) {
                    params.ops[ht.length] = {url: '/v3/direction/walking?key=' + key + '&origin=' + arrLoc[index] + '&destination=' + arrLoc[i]}
                    ht.push(i)
                }
            }
            res = callAPI_POST('https://restapi.amap.com/v3/batch?key=' + key, params)
            for (let i = 0; i < ht.length; i++) {
                if (res[i].body.status == 1 && res[i].body.count != 0) {
                    dist[ht[i]] = parseInt(res[i].body.route.paths[0].distance)
                    dura[ht[i]] = parseInt(res[i].body.route.paths[0].duration)
                } else {
                    dist[ht[i]] = -1
                    dura[ht[i]] = -1
                }
            }
            break
        case '1':
            // TODO: 查询Cache
            params = {ops: []}
            ht = []     // 哈希表，记录对应关系
            for (let i = 0; i < arrLoc.length; i++) {
                if (dist[i] == null) {
                    params.ops[ht.length] = {url: '/v3/direction/transit/integrated?key=' + key + '&origin=' + arrLoc[index] + '&destination=' + arrLoc[i] + '&city=' + city}
                    ht.push(i)
                }
            }
            res = callAPI_POST('https://restapi.amap.com/v3/batch?key=' + key, params)
            for (let i = 0; i < ht.length; i++) {
                if (res[i].body.status == 1 && res[i].body.count != 0) {
                    dist[ht[i]] = parseInt(res[i].body.route.distance)
                    dura[ht[i]] = parseInt(res[i].body.route.transits[0].duration)
                } else {
                    // 没有查到公交方案，尝试查询步行方案
                    query = {key: key, origin: arrLoc[index], destination: arrLoc[ht[i]]}
                    resWalk = callAPI_GET('https://restapi.amap.com/v3/direction/walking', query)
                    if (resWalk.status == 1 && resWalk.count != 0) {
                        dist[ht[i]] = parseInt(resWalk.route.paths[0].distance)
                        dura[ht[i]] = parseInt(resWalk.route.paths[0].duration)
                    } else {
                        dist[ht[i]] = -1
                        dura[ht[i]] = -1
                    }
                }
            }
            break
        case '2':
            // TODO: 查询Cache
            params = {ops: []}
            ht = []     // 哈希表，记录对应关系
            for (let i = 0; i < arrLoc.length; i++) {
                if (dist[i] == null) {
                    params.ops[ht.length] = {url: '/v3/direction/driving?key=' + key + '&origin=' + arrLoc[index] + '&destination=' + arrLoc[i]}
                    ht.push(i)
                }
            }
            res = callAPI_POST('https://restapi.amap.com/v3/batch?key=' + key, params)
            for (let i = 0; i < ht.length; i++) {
                if (res[i].body.status == 1 && res[i].body.count != 0) {
                    dist[ht[i]] = parseInt(res[i].body.route.paths[0].distance)
                    dura[ht[i]] = parseInt(res[i].body.route.paths[0].duration)
                } else {
                    dist[ht[i]] = -1
                    dura[ht[i]] = -1
                }
            }
            break
        case '3':
            // TODO: 查询Cache
            for (let i = 0; i < arrLoc.length; i++) {
                if (dist[i] == null) {
                    query = {key: key, origin: arrLoc[index], destination: arrLoc[i]}
                    res = callAPI_GET('https://restapi.amap.com/v4/direction/bicycling', query)
                    if (res.errcode == 0 && res.data.paths.length != 0) {
                        dist[i] = parseInt(res.data.paths[0].distance)
                        dura[i] = parseInt(res.data.paths[0].duration)
                    } else {
                        dist[i] = -1
                        dura[i] = -1
                    }
                }
            }
            break
    }
}

function getKey (myKey) {
    key = myKey
}

exports.server = server
exports.getKey = getKey
