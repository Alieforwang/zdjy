# ⚡ 快速开始指南

<div align="center">

![Time](https://img.shields.io/badge/所需时间-5分钟-blue.svg)
![Difficulty](https://img.shields.io/badge/难度-简单-green.svg)
![Prerequisites](https://img.shields.io/badge/前置条件-Python%203.10+-orange.svg)

*5分钟快速体验灵瞳智能检测平台*

</div>

---

## 🎯 快速体验流程

### Step 1: 环境准备 (1分钟)

```bash
# 确保Python版本符合要求
python --version  # 需要 3.10+

# 克隆项目
git clone https://github.com/Alieforwang/zdjy.git
cd zdjy
```

### Step 2: 一键安装 (2分钟)

```bash
# 使用uv快速安装 (推荐)
curl -LsSf https://astral.sh/uv/install.sh | sh  # 安装uv
uv sync  # 安装所有依赖

# 激活环境
source .venv/bin/activate  # Linux/macOS
# 或 .venv\Scripts\activate  # Windows
```

### Step 3: 基础配置 (1分钟)

```bash
# 复制配置模板
cp config.py.example config.py  # 如果有模板文件

# 或直接编辑 config.py 中的数据库配置
# 暂时可以使用SQLite进行快速测试
```

### Step 4: 启动系统 (30秒)

```bash
# 启动应用
python app.py
```

### Step 5: 访问测试 (30秒)

```bash
# 浏览器访问
http://localhost:5000

# 默认登录信息
用户名: admin
密码: admin
```

---

## 🎯 核心功能快速测试

### 1. 图片检测测试

1. **上传测试图片**
   - 点击"实时检测"
   - 选择一张包含街景的图片
   - 观察检测结果

2. **查看检测结果**
   - 检测框和置信度
   - 类别标签显示
   - 处理时间统计

### 2. 智能助手测试

1. **打开AI助手**
   - 点击"智能助手"页面
   - 输入问题：`这种摊位属于什么类型？`

2. **测试对话功能**
   - 询问法规解读
   - 请求治理建议
   - 数据分析解读

### 3. 数据分析测试

1. **查看统计数据**
   - 访问"数据分析"页面
   - 观察检测趋势图表
   - 查看类型分布统计

2. **历史记录查询**
   - 访问"历史记录"页面
   - 筛选检测结果
   - 下载检测报告

---

## 🎬 视频教程

观看5分钟快速上手视频：

[![快速开始教程](../videos/quickstart-thumbnail.jpg)](../videos/quickstart-tutorial.mp4)

---

## 🐛 可能遇到的问题

### 问题1: 端口被占用
```bash
# 解决方案：更改端口
export FLASK_PORT=5001
python app.py
```

### 问题2: 依赖安装失败
```bash
# 方案1: 使用pip备选方案
pip install -r requirements.txt

# 方案2: 使用国内镜像
uv sync -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### 问题3: 数据库连接错误
```bash
# 临时解决：使用SQLite
# 修改 config.py 中的数据库配置为SQLite
```

---

## 🎯 测试数据

### 示例图片

下载测试图片进行检测：

```bash
# 下载示例图片
mkdir test_images
cd test_images

# 下载街景测试图片
curl -O https://example.com/street_sample1.jpg
curl -O https://example.com/street_sample2.jpg
curl -O https://example.com/vendor_sample.jpg
```

### API测试

使用curl测试API接口：

```bash
# 健康检查
curl http://localhost:5000/api/v1/system/health

# 图片检测API
curl -X POST \
  http://localhost:5000/api/v1/detection/image \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,/9j/4AAQ...",
    "confidence_threshold": 0.25
  }'
```

---

## 📊 性能验证

### 基准测试

运行内置的性能测试：

```python
# 模型加载速度测试
python -c "
import time
from ultralytics import YOLO

start = time.time()
model = YOLO('models/best.pt')
load_time = time.time() - start
print(f'模型加载时间: {load_time:.2f}秒')

# 单次检测速度测试
import cv2
import numpy as np

# 创建测试图片
test_img = np.random.randint(0, 255, (640, 640, 3), dtype=np.uint8)

start = time.time()
results = model(test_img)
detect_time = time.time() - start
print(f'检测时间: {detect_time:.3f}秒')
print(f'FPS: {1/detect_time:.1f}')
"
```

### 内存使用检查

```python
# 内存使用情况
python -c "
import psutil
import os

process = psutil.Process(os.getpid())
memory_info = process.memory_info()
print(f'内存使用: {memory_info.rss / 1024 / 1024:.2f} MB')

# GPU内存 (如果有GPU)
try:
    import torch
    if torch.cuda.is_available():
        print(f'GPU内存: {torch.cuda.memory_allocated() / 1024**3:.2f} GB')
except:
    print('GPU不可用')
"
```

---

## 🚀 下一步操作

完成快速体验后，建议您：

### 深度使用
1. 📖 [详细安装指南](installation.md) - 完整的生产环境配置
2. 🔧 [配置说明](configuration.md) - 高级配置和优化
3. 🎬 [功能教程](tutorials.md) - 详细的功能使用教程

### 开发集成
1. 🚀 [API文档](../api/README.md) - 接口开发指南
2. 🔧 [开发指南](development.md) - 二次开发和定制
3. 📊 [架构文档](architecture.md) - 系统架构和设计

### 生产部署
1. 🐳 [Docker部署](docker-deployment.md) - 容器化部署方案
2. 🌐 [生产环境](production-deployment.md) - 生产级部署配置
3. 📈 [性能优化](performance-optimization.md) - 性能调优指南

---

## 💬 获得帮助

如果在快速开始过程中遇到任何问题：

- 🔍 查看 [常见问题](faq.md)
- 🐛 [提交Issue](https://github.com/Alieforwang/zdjy/issues)
- 💬 [技术讨论](https://github.com/Alieforwang/zdjy/discussions)
- 📧 邮件联系：154425450+Alieforwang@users.noreply.github.com

---

<div align="center">

**🎉 恭喜！您已成功完成快速体验**

**下一步：深入了解系统功能和配置优化**

</div>