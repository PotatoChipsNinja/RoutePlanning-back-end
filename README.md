# 行程规划及周边查询后端接口说明

## 一、行程规划接口
### 1. 接口描述
接口URL：`https://routeplan.ml:3001/path`

请求方式：`GET`
> 注：微信小程序强制要求https访问

### 2. 请求参数
| 参数名称 | 必选 | 类型 | 说明 |
| :-: | :-: | :-: | :-: |
| method | 是 | Integer | 交通方式选择，参数值范围为0-3，分别对应步行、公交、驾车、骑行 |
| origin | 是 | String | 出发点 |
| transits | 是 | String | 途经点，以“,”分隔 |
| destination | 是 | String | 目的地 |

### 3. 返回结果参数
| 参数 | 类型 | 说明 |
| :- | :-: | :-: |
| status | Boolean | 返回状态，true为成功，false为失败 |
| search | Array | 搜索结果信息 |
| &rarr;q_name | String | 请求地点名称 |
| &rarr;s_name | String | 搜索到的地点名称 |
| &rarr;location | String | 经纬度，以“,”分隔 |
| route | Object | 规划方案信息 |
| &rarr;distance | Integer | 方案总距离，单位：米 |
| &rarr;duration | Integer | 方案总时间，单位：秒 |
| &rarr;path | Array | 路径信息列表 |
| &rarr;&rarr;from | String | 此段起点 |
| &rarr;&rarr;to | String | 此段终点 |
| &rarr;&rarr;distance | Integer | 此段距离，单位：米 |
| &rarr;&rarr;duration | Integer | 此段时间，单位：秒 |

### 4. 服务示例
直接请求URL：
```
https://routeplan.ml:3001/path?method=2&origin=北京西&transits=清华,北大&destination=北京南
```
小程序发送请求：
``` JavaScript
wx.request({
  url: 'https://routeplan.ml:3001/path',
  data: {
    method: 2,
    origin: '北京西',
    transits: '清华,北大',
    destination: '北京南'
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
  "search": [
    {
      "q_name": "北京西",
      "s_name": "北京西站",
      "location": "116.322056,39.89491"
    },
    {
      "q_name": "清华",
      "s_name": "清华大学",
      "location": "116.326836,40.00366"
    },
    {
      "q_name": "北大",
      "s_name": "北京大学",
      "location": "116.310905,39.992806"
    },
    {
      "q_name": "北京南",
      "s_name": "北京南站",
      "location": "116.378517,39.865246"
    }
  ],
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

## 二、周边查询接口
### 1. 接口描述
接口URL：`https://routeplan.ml:3001/around`

请求方式：`GET`
> 注：微信小程序强制要求https访问

### 2. 请求参数
| 参数名称 | 必选 | 类型 | 说明 |
| :-: | :-: | :-: | :-: |
| location | 是 | String | 中心点经纬度，，以“,”分隔 |
| type | 是 | Integer | 查询类型，参数值范围为0-2，分别对应餐饮服务、购物服务、住宿服务 |
| radius | 否 | Integer | 查询半径，单位：米，默认值为3000 |
| max_count | 否 | Integer | 最多返回结果数量，默认值为10 |

### 3. 返回结果参数
| 参数 | 类型 | 说明 |
| :- | :-: | :-: |
| status | Boolean | 返回状态，true为成功，false为失败 |
| result | Array | 搜索结果信息 |
| &rarr;name | String | 地点名称 |
| &rarr;distance | Integer | 距离 |
| &rarr;address | String | 地址 |
| &rarr;location | String | 经纬度，以“,”分隔 |

### 4. 服务示例
直接请求URL：
```
https://routeplan.ml:3001/around?location=116.322056,39.89491&type=0&max_count=2
```
小程序发送请求：
``` JavaScript
wx.request({
  url: 'https://routeplan.ml:3001/around',
  data: {
    location: '116.322056,39.89491',
    type: 0,
    max_count: 2
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
  "result": [
    {
      "name": "周黑鸭(北京西站)",
      "distance": 31,
      "address": "莲花池东路118号北京西站F2层",
      "location": "116.321688,39.894906"
    },
    {
      "name": "德州扒鸡(北京西站)",
      "distance": 48,
      "address": "莲花池东路118号北京西站F2层",
      "location": "116.321715,39.895259"
    }
  ]
}
```
