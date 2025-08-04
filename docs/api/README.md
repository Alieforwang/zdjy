# 🚀 API 文档

<div align="center">

![API](https://img.shields.io/badge/API-RESTful-blue.svg)
![Version](https://img.shields.io/badge/版本-v1.0-green.svg)
![Status](https://img.shields.io/badge/状态-稳定-brightgreen.svg)

*完整的API接口文档和使用指南*

</div>

---

## 📖 API 概述

灵瞳平台提供完整的RESTful API，支持：
- 🔍 **检测服务**: 图片/视频检测
- 📊 **数据分析**: 统计查询和报告
- 🤖 **智能助手**: AI对话和决策支持
- 👥 **用户管理**: 认证和权限控制
- 📝 **历史记录**: 检测结果查询

---

## 🌐 基础信息

### 服务端点
```
生产环境: https://api.zdjy.example.com/v1
测试环境: https://test-api.zdjy.example.com/v1
本地开发: http://localhost:5000/api/v1
```

### 认证方式
```http
Authorization: Bearer YOUR_API_TOKEN
Content-Type: application/json
```

### 响应格式
```json
{
  "success": true,
  "data": {
    // 响应数据
  },
  "message": "操作成功",
  "timestamp": "2025-01-04T10:30:00Z",
  "request_id": "req_123456789"
}
```

---

## 🔍 检测服务 API

### 1. 图片检测

**POST** `/detection/image`

上传图片进行占道经营检测。

#### 请求参数
```json
{
  "image": "base64_encoded_image_data",
  "confidence_threshold": 0.25,
  "return_image": true,
  "save_result": true
}
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "detection_id": "det_123456789",
    "results": [
      {
        "class": "占道经营-固定摊位",
        "confidence": 0.95,
        "bbox": [100, 150, 300, 400],
        "area": 40000
      }
    ],
    "total_count": 1,
    "processing_time": 0.15,
    "result_image": "base64_encoded_result_image"
  },
  "message": "检测完成"
}
```

#### cURL 示例
```bash
curl -X POST \
  http://localhost:5000/api/v1/detection/image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
    "confidence_threshold": 0.25
  }'
```

### 2. 视频检测

**POST** `/detection/video`

上传视频文件进行批量检测。

#### 请求参数 (multipart/form-data)
```
file: video_file.mp4
confidence_threshold: 0.25
frame_interval: 30  // 每30帧检测一次
save_result: true
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "task_id": "task_123456789",
    "status": "processing",
    "estimated_time": 120,
    "frames_total": 1800,
    "callback_url": "/api/v1/detection/video/task_123456789/status"
  },
  "message": "视频处理已开始"
}
```

### 3. 实时流检测

**WebSocket** `/ws/detection/stream`

实时视频流检测WebSocket连接。

#### 连接示例
```javascript
const ws = new WebSocket('ws://localhost:5000/ws/detection/stream');

// 发送配置
ws.send(JSON.stringify({
  type: 'config',
  confidence_threshold: 0.25,
  return_frames: true
}));

// 发送视频帧
ws.send(JSON.stringify({
  type: 'frame',
  data: base64_frame_data,
  timestamp: Date.now()
}));

// 接收检测结果
ws.onmessage = function(event) {
  const result = JSON.parse(event.data);
  console.log('检测结果:', result);
};
```

---

## 📊 数据分析 API

### 1. 统计概览

**GET** `/analytics/overview`

获取系统总体统计数据。

#### 查询参数
```
start_date: 2025-01-01
end_date: 2025-01-04
group_by: day|hour|week|month
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "total_detections": 1250,
    "accuracy_rate": 0.93,
    "avg_processing_time": 0.18,
    "top_locations": [
      {"name": "市中心广场", "count": 156},
      {"name": "商业街", "count": 98}
    ],
    "detection_trends": [
      {"date": "2025-01-01", "count": 45},
      {"date": "2025-01-02", "count": 67}
    ]
  }
}
```

### 2. 检测历史

**GET** `/analytics/history`

查询检测历史记录。

#### 查询参数
```
page: 1
limit: 20
start_date: 2025-01-01
end_date: 2025-01-04
class_filter: 占道经营-固定摊位
confidence_min: 0.5
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "det_123456789",
        "timestamp": "2025-01-04T10:30:00Z",
        "image_url": "/static/uploads/image_123.jpg",
        "result_url": "/static/@results/result_123.jpg",
        "detections": [
          {
            "class": "占道经营-固定摊位",
            "confidence": 0.95,
            "bbox": [100, 150, 300, 400]
          }
        ],
        "location": "市中心广场",
        "user_id": "user_456"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1250,
      "pages": 63
    }
  }
}
```

---

## 🤖 智能助手 API

### 1. 对话接口

**POST** `/ai/chat`

与DeepSeek智能助手进行对话。

#### 请求参数
```json
{
  "message": "这种摊位属于什么类型的占道经营？",
  "context": {
    "detection_id": "det_123456789",
    "image_url": "/static/uploads/image_123.jpg"
  },
  "session_id": "session_789",
  "stream": false
}
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "response": "根据图片分析，这是一个固定摊位类型的占道经营。建议按照《城市管理条例》第15条进行规范化管理...",
    "session_id": "session_789",
    "message_id": "msg_456789",
    "tokens_used": 156,
    "response_time": 0.8
  }
}
```

### 2. 流式对话

**POST** `/ai/chat/stream`

流式对话接口，实时返回AI回复。

```javascript
fetch('/api/v1/ai/chat/stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_TOKEN'
  },
  body: JSON.stringify({
    message: "分析一下今天的检测数据",
    stream: true
  })
})
.then(response => {
  const reader = response.body.getReader();
  return new ReadableStream({
    start(controller) {
      function pump() {
        return reader.read().then(({ done, value }) => {
          if (done) {
            controller.close();
            return;
          }
          controller.enqueue(value);
          return pump();
        });
      }
      return pump();
    }
  });
});
```

---

## 👥 用户管理 API

### 1. 用户登录

**POST** `/auth/login`

用户身份验证。

#### 请求参数
```json
{
  "username": "admin",
  "password": "your_password",
  "remember": true
}
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600,
    "user": {
      "id": "user_123",
      "username": "admin",
      "role": "administrator",
      "permissions": ["detect", "analyze", "manage"]
    }
  }
}
```

### 2. 用户信息

**GET** `/auth/profile`

获取当前用户信息。

#### 响应示例
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "username": "admin",
    "email": "admin@example.com",
    "role": "administrator",
    "created_at": "2024-01-01T00:00:00Z",
    "last_login": "2025-01-04T10:30:00Z",
    "detection_count": 1250,
    "api_quota": {
      "used": 850,
      "limit": 10000,
      "reset_date": "2025-02-01T00:00:00Z"
    }
  }
}
```

---

## 📈 系统监控 API

### 1. 系统状态

**GET** `/system/health`

获取系统健康状态。

#### 响应示例
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-04T10:30:00Z",
    "services": {
      "database": "healthy",
      "ai_model": "healthy",
      "storage": "healthy",
      "cache": "healthy"
    },
    "metrics": {
      "cpu_usage": 0.35,
      "memory_usage": 0.68,
      "disk_usage": 0.25,
      "active_connections": 12
    },
    "version": "1.0.0",
    "uptime": 86400
  }
}
```

### 2. 性能指标

**GET** `/system/metrics`

获取系统性能指标。

#### 响应示例
```json
{
  "success": true,
  "data": {
    "detection_performance": {
      "avg_processing_time": 0.18,
      "requests_per_second": 45.6,
      "accuracy_rate": 0.93
    },
    "resource_usage": {
      "cpu_cores": 8,
      "memory_total": "16GB",
      "memory_used": "6.8GB",
      "gpu_memory_used": "4.2GB"
    },
    "api_statistics": {
      "total_requests": 125000,
      "success_rate": 0.998,
      "avg_response_time": 0.25
    }
  }
}
```

---

## 🔒 错误处理

### 错误响应格式
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "请求参数无效",
    "details": {
      "field": "confidence_threshold",
      "reason": "值必须在0-1之间"
    }
  },
  "timestamp": "2025-01-04T10:30:00Z",
  "request_id": "req_123456789"
}
```

### 常见错误码
| 错误码 | HTTP状态码 | 描述 |
|--------|-----------|------|
| `INVALID_REQUEST` | 400 | 请求参数无效 |
| `UNAUTHORIZED` | 401 | 未授权访问 |
| `FORBIDDEN` | 403 | 权限不足 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `RATE_LIMITED` | 429 | 请求频率超限 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |
| `MODEL_ERROR` | 502 | AI模型服务错误 |
| `SERVICE_UNAVAILABLE` | 503 | 服务暂不可用 |

---

## 📚 SDK 和示例

### Python SDK

```python
from zdjy_client import ZDJYClient

# 初始化客户端
client = ZDJYClient(
    base_url='http://localhost:5000/api/v1',
    token='your_api_token'
)

# 图片检测
result = client.detect_image(
    image_path='test.jpg',
    confidence_threshold=0.25
)

# 查询历史
history = client.get_detection_history(
    start_date='2025-01-01',
    limit=10
)

# AI对话
response = client.chat(
    message='这种摊位应该如何管理？',
    context={'detection_id': 'det_123'}
)
```

### JavaScript SDK

```javascript
import { ZDJYClient } from 'zdjy-js-sdk';

const client = new ZDJYClient({
  baseURL: 'http://localhost:5000/api/v1',
  token: 'your_api_token'
});

// 图片检测
const result = await client.detectImage({
  image: imageFile,
  confidenceThreshold: 0.25
});

// 实时流检测
const stream = client.createDetectionStream({
  confidenceThreshold: 0.25,
  onResult: (result) => {
    console.log('检测结果:', result);
  }
});
```

---

## 📞 技术支持

- **API文档**: [在线文档](https://api-docs.zdjy.example.com)
- **SDK下载**: [GitHub Releases](https://github.com/Alieforwang/zdjy/releases)
- **问题反馈**: [提交Issue](https://github.com/Alieforwang/zdjy/issues)
- **技术交流**: [Discussions](https://github.com/Alieforwang/zdjy/discussions)

---

<div align="center">

**🚀 强大的API接口，助力智能化应用开发**

*持续更新，敬请关注*

</div>