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
    msg = '[' + new Date().toLocaleString() + '] ' + msg + '\n\n'
    fs.appendFileSync('./log', msg)
}

function getData (method, arrName, arrDistance, arrDuration) {
    // 获取坐标
    arrLoc = []
    for (const key in arrName) {
        loc = search(arrName[key])
        if (loc == false) {
            return false
        }
        arrLoc[key] = loc
    }

    // 获取任意两点间距离和时间
    for (let i = 0; i < arrName.length; i++) {
        arrDistance[i] = []
        arrDuration[i] = []
        for (let j = 0; j < arrName.length; j++) {
            if (i != j) {
                res = direction(method, arrLoc[i], arrLoc[j])
                if (res == false) {
                    return false
                }
                arrDistance[i][j] = parseInt(res.distance)
                arrDuration[i][j] = parseInt(res.duration)
            } else {
                arrDistance[i][j] = 0
                arrDuration[i][j] = 0
            }
        }
    }

    return true
}

function callAPI (url, params) {
    url += '?' + querystring.stringify(params)
    return JSON.parse(request(url).data.toString())
}

function search (keywords) {
    res = callAPI('https://restapi.amap.com/v3/place/text', {key: key, keywords: keywords})
    if (res.status && res.count != 0) {
        return res.pois[0].location
    } else {
        return false
    }
}

function direction (method, origin, destination) {
    query = {key: key, origin: origin, destination: destination}
    switch (method) {
        case '0':
            res = callAPI('https://restapi.amap.com/v3/direction/walking', query)
            if (res.status == 1 && res.count != 0) {
                return {distance: res.route.paths[0].distance, duration: res.route.paths[0].duration}
            }
            break
        case '1':
            res = callAPI('https://restapi.amap.com/v3/direction/transit/integrated', query)
            if (res.status == 1 && res.count != 0) {
                return {distance: res.route.distance, duration: res.route.transits[0].duration}
            }
            break
        case '2':
            res = callAPI('https://restapi.amap.com/v3/direction/driving', query)
            if (res.status == 1 && res.count != 0) {
                return {distance: res.route.paths[0].distance, duration: res.route.paths[0].duration}
            }
            break
        case '3':
            res = callAPI('https://restapi.amap.com/v4/direction/bicycling', query)
            if (res.errcode == 0 && res.data.paths.length != 0) {
                return {distance: res.data.paths[0].distance, duration: res.data.paths[0].duration}
            }
            break
    }
    return false
}

exports.server = server
exports.writeLog = writeLog
