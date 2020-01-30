const callAPI_GET = require('./server').callAPI_GET
const callAPI_POST = require('./server').callAPI_POST
const calc = require('./algorithm').calc

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

    result = new Result()   // 保存返回结果
    arrDistance = []        // 保存任意两点间距离
    arrDuration = []        // 保存任意两点间时间

    // 尝试请求数据
    arrLoc = getData(params.method, arrName, arrDistance, arrDuration)
    if (arrLoc != false) {
        // 数据获取成功
        result.addSearch(qName, arrName, arrLoc)

        // 计算不对称TSP问题
        ans = calc(arrDuration, arrName.length)
        for (let i = 0; i < ans.length-1; i++) {
            result.addPath(arrName[ans[i]], arrName[ans[i+1]], arrDistance[ans[i]][ans[i+1]], arrDuration[ans[i]][ans[i+1]])
        }

        // 核算总距离和时间
        result.sumUp()
        result.status = true
    }

    return result.toString()
}

function getData (method, arrName, arrDistance, arrDuration) {
    // 获取坐标
    arrLoc = []
    city = getLoc(arrName, arrLoc)
    if (city == false) {
        return false
    }

    // 获取任意两点间距离和时间
    for (let i = 0; i < arrName.length; i++) {
        arrDistance[i] = []
        arrDuration[i] = []
        if (!direction(method, arrLoc, i, city, arrDistance[i], arrDuration[i])) {
            return false
        }
    }

    return arrLoc
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
            params = {ops: []}
            for (let j = 0; j < arrLoc.length; j++) {
                params.ops[j] = {url: '/v3/direction/walking?key=' + key + '&origin=' + arrLoc[index] + '&destination=' + arrLoc[j]}
            }
            res = callAPI_POST('https://restapi.amap.com/v3/batch?key=' + key, params)
            for (let j = 0; j < arrName.length; j++) {
                if (arrLoc[index] != arrLoc[j]) {
                    if (res[j].body.status == 1 && res[j].body.count != 0) {
                        dist[j] = parseInt(res[j].body.route.paths[0].distance)
                        dura[j] = parseInt(res[j].body.route.paths[0].duration)
                    } else {
                        return false
                    }
                } else {
                    dist[j] = 0
                    dura[j] = 0
                }
            }
            break
        case '1':
            params = {ops: []}
            for (let j = 0; j < arrLoc.length; j++) {
                params.ops[j] = {url: '/v3/direction/transit/integrated?key=' + key + '&origin=' + arrLoc[index] + '&destination=' + arrLoc[j] + '&city=' + city}
            }
            res = callAPI_POST('https://restapi.amap.com/v3/batch?key=' + key, params)
            for (let j = 0; j < arrName.length; j++) {
                if (arrLoc[index] != arrLoc[j]) {
                    if (res[j].body.status == 1 && res[j].body.count != 0) {
                        dist[j] = parseInt(res[j].body.route.distance)
                        dura[j] = parseInt(res[j].body.route.transits[0].duration)
                    } else {
                        return false
                    }
                } else {
                    dist[j] = 0
                    dura[j] = 0
                }
            }
            break
        case '2':
            params = {ops: []}
            for (let j = 0; j < arrLoc.length; j++) {
                params.ops[j] = {url: '/v3/direction/driving?key=' + key + '&origin=' + arrLoc[index] + '&destination=' + arrLoc[j]}
            }
            res = callAPI_POST('https://restapi.amap.com/v3/batch?key=' + key, params)
            for (let j = 0; j < arrName.length; j++) {
                if (arrLoc[index] != arrLoc[j]) {
                    if (res[j].body.status == 1 && res[j].body.count != 0) {
                        dist[j] = parseInt(res[j].body.route.paths[0].distance)
                        dura[j] = parseInt(res[j].body.route.paths[0].duration)
                    } else {
                        return false
                    }
                } else {
                    dist[j] = 0
                    dura[j] = 0
                }
            }
            break
        case '3':
            for (let j = 0; j < arrLoc.length; j++) {
                if (arrLoc[index] != arrLoc[j]) {
                    query = {key: key, origin: arrLoc[index], destination: arrLoc[j]}
                    res = callAPI_GET('https://restapi.amap.com/v4/direction/bicycling', query)
                    if (res.errcode == 0 && res.data.paths.length != 0) {
                        dist[j] = parseInt(res.data.paths[0].distance)
                        dura[j] = parseInt(res.data.paths[0].duration)
                    } else {
                        return false
                    }
                } else {
                    dist[j] = 0
                    dura[j] = 0
                }
            }
            break
    }
    return true
}

function getKey (myKey) {
    key = myKey
}

exports.server = server
exports.getKey = getKey
