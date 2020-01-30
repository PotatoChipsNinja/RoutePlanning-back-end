const fs = require('fs')
const querystring = require('querystring')
const request = require('urllib-sync').request

function getKey () {
    key = ''
    try {
        key = fs.readFileSync('key').toString()
        require('./path').getKey(key)
        require('./around').getKey(key)
    } catch (err) {
        return false
    }
    return !(key == '')
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

function callAPI_GET (url, params) {
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

exports.getKey = getKey
exports.writeLog = writeLog
exports.callAPI_GET = callAPI_GET
exports.callAPI_POST = callAPI_POST
