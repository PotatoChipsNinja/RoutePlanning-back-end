const callAPI_GET = require('./server').callAPI_GET

var key = ''

class Result {
    constructor () {
        this.status = false
        this.result = []
    }

    addResult (name, distance, address, location) {
        this.result.push({
            name: name,
            distance: distance,
            address: address,
            location: location
        })
    }

    toString () {
        return JSON.stringify(this)
    }
}

function server (params) {
    // 设置参数
    location = params.location
    switch (params.type) {
        case '0':
            types = '050000'
            break
        case '1':
            types = '060000'
            break
        case '2':
            types = '100000'
            break
    }
    radius = params.radius == undefined ? 3000 : params.radius
    offset = params.max_count == undefined ? 10 : params.max_count

    res = callAPI_GET('https://restapi.amap.com/v3/place/around', {key: key, location:location, types: types, radius: radius, offset: offset})
    console.log(res)
    result = new Result()
    if (res.status == 1 && res.count != 0) {
        for (let i = 0; i < res.pois.length; i++) {
            result.addResult(res.pois[i].name, parseInt(res.pois[i].distance), res.pois[i].address, res.pois[i].location)
        }
        result.status = true
    }
    return result.toString()
}

function getKey (myKey) {
    key = myKey
}

exports.server = server
exports.getKey = getKey
