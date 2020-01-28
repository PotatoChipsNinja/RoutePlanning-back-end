const fs = require('fs')
const querystring = require('querystring')
const request = require('urllib-sync').request
const calc = require('./algorithm').calc

const key = '6a9eb8bf6ec83bb67c50ba0540799c76'

class Result {
    constructor () {
        this.status = false
        this.route = {
            distance: -1,
            duration: -1,
            path: []
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

    result = new Result()   // 保存返回结果
    arrDistance = []        // 保存任意两点间距离
    arrDuration = []        // 保存任意两点间时间

    // 尝试请求数据
    if (getData(params.method, arrName, arrDistance, arrDuration)) {
        // 数据获取成功，计算不对称TSP问题
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

function writeLog (msg) {
    time = new Date()
    yy = time.getFullYear()
    mm = ('0' + (time.getMonth() + 1)).slice(-2)
    dd = ('0' + time.getDate()).slice(-2)
    fileName = fileName = './logs/' + yy + mm + dd + '.log'
    msg = '[' + time.toLocaleString() + '] ' + msg + '\n\n'
    fs.mkdir('./logs', function () {})
    fs.appendFileSync(fileName, msg)
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

    return true
}

function callAPI (url, params) {
    url += '?' + querystring.stringify(params)
    return JSON.parse(request(url).data.toString())
}

function callAPI_POST (url, params) {
    options = {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        content: JSON.stringify(params)
    }
    return JSON.parse(request(url, options).data.toString())
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
                    res = callAPI('https://restapi.amap.com/v4/direction/bicycling', query)
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

exports.server = server
exports.writeLog = writeLog
