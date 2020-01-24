const express = require('express')
const https = require('https')
const http = require('http')
const url = require('url')
const fs = require('fs')
const server = require('./server').server
const writeLog = require('./server').writeLog

const app = express()
const port = 3000       // HTTP端口
const SSLport = 3001    // HTTPS端口
// 证书信息
const options = {
    key: fs.readFileSync('/etc/letsencrypt/live/routeplan.ml/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/routeplan.ml/fullchain.pem')
}

http.createServer(app).listen(port, () => console.log(`HTTP server is listening on port ${port}`))
https.createServer(options, app).listen(SSLport, () => console.log(`HTTPS server is listening on port ${SSLport}`))

app.get('/path', function (req, res) {
    try {
        reqTime = new Date()
        console.log('[' + new Date().toLocaleString() + '] A request received.')
        result = server(url.parse(req.url, true).query)
        res.send(result)
        resTime = new Date()
        writeLog('ACTIVE' +
            '\nrequestTime = ' + reqTime.toLocaleString() +
            '\nresponseTime = ' + resTime.toLocaleString() +
            '\ninterval = ' + (resTime.getTime() - reqTime.getTime()).toString() + 'ms' +
            '\nquery = ' + JSON.stringify(url.parse(req.url, true).query) +
            '\nresult = ' + result)
    } catch (err) {
        console.log('[' + new Date().toLocaleString() + '] An error occurred.')
        writeLog('ERROR\n' + err.stack)
        res.status(500).send('Internal Error')
    }
})

app.get('/log', function (req, res) {
    time = new Date()
    res.redirect('/log/' + time.getFullYear() + '/' + (time.getMonth()+1) + '/' + time.getDate())
})

app.get('/log/:yy/:mm/:dd', function (req, res) {
    yy = req.params.yy
    mm = ('0' + req.params.mm).slice(-2)
    dd = ('0' + req.params.dd).slice(-2)
    fileName = 'logs/' + yy + mm + dd + '.log'
    fs.readFile(fileName, function(err, content) {
        if (!err) {
            res.send('<pre>' + content + '</pre>')
        }
        res.end()
    })
})

app.use(function (req, res) {
    res.status(404).send("Invalid Request<br>Please refer to <a href='https://github.com/PotatoChipsNinja/RoutePlanning-back-end/blob/master/README.md'>here</a> for request rules.")
})
