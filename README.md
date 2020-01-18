# 行程规划后端接口说明
## 接口描述
接口URL：`https://routeplan.ml:3001/path`

请求方式：`GET`
> 注：微信小程序强制要求https访问

## 请求参数
| 参数名称 | 必选 | 类型 | 说明 |
| :-: | :-: | :-: | :-: |
| method | 是 | Integer | 交通方式选择，参数值范围为0-3，分别对应步行、公交、驾车、骑行 |
| origin | 是 | String | 出发点 |
| transits | 是 | String | 途经点，以“,”为分隔 |
| destination | 是 | String | 目的地 |

## 返回结果参数
| 参数 | 类型 | 说明 |
| :- | :-: | :-: |
| status | Boolean | 返回状态，true为成功，false为失败 |
| route | Object | 规划方案信息 |
| &rarr;distance | Integer | 方案总距离，单位：米 |
| &rarr;duration | Integer | 方案总时间，单位：秒 |
| &rarr;path | Array | 路径信息列表 |
| &rarr;&rarr;from | string | 此段起点 |
| &rarr;&rarr;to | string | 此段终点 |
| &rarr;&rarr;distance | Integer | 此段距离，单位：米 |
| &rarr;&rarr;duration | Integer | 此段时间，单位：秒 |

## 服务示例
直接请求URL：
```
https://routeplan.ml:3001/path?method=2&origin=北京西站&transits=清华大学,北京大学&destination=北京南站
```
小程序发送请求：
``` JavaScript
wx.request({
  url: 'https://routeplan.ml:3001/path',
  data: {
    method: 2,
    origin: '北京西站',
    transits: ['清华大学', '北京大学'],
    destination: '北京南站'
  },
  method: "GET",
  success(res) {
    //返回结果内容在res.data中
    console.log(res.data)
  }
})
```
返回结果：
``` JSON
{
    "status": true,
    "route": {
        "distance": 40575,
        "duration": 7654,
        "path": [
            {
                "from": "北京西站",
                "to": "北京大学",
                "distance": 15104,
                "duration": 2289
            },
            {
                "from": "北京大学",
                "to": "清华大学",
                "distance": 3782,
                "duration": 881
            },
            {
                "from": "清华大学",
                "to": "北京南站",
                "distance": 21689,
                "duration": 4484
            }
        ]
    }
}
```
