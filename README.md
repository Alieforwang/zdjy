# 灵瞳 - YOLOv8-DeepSeek 多模态街景治理实时检测平台

<div align="center">

基于YOLOv8和DeepSeek多模态大模型的街景治理实时检测平台，支持实时视频分析、多模态理解和智能决策。

## 项目特点

- **多模态融合**：结合视觉检测与语言理解能力
- **实时处理**：高效处理视频流，实现实时检测
- **智能分析**：自动识别街景问题并提供处理建议
- **易于部署**：支持Docker一键部署，自动适配CPU/GPU环境

## 快速部署

### 本地环境部署

```bash
# 克隆项目
git clone https://github.com/Alieforwang/zdjy.git
cd zdjy

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# 安装依赖
pip install -r requirements.txt

# 启动应用
python app.py
```

## 系统要求

- **操作系统**：Windows 10/11 或 Linux
- **Python**：3.10+ (推荐 3.13+)
- **硬件**：
  - 最低配置：2核CPU，4GB内存
  - 推荐配置：4核CPU，8GB内存，NVIDIA GPU (CUDA 11.7+)

## 目录结构

```
project/
├── app.py                # 主应用入口
├── config.py             # 配置文件
├── yolov8.py             # YOLOv8检测模块
├── models/               # 模型文件目录
├── static/               # 静态资源
├── templates/            # 前端模板
├── util/                 # 工具函数
└── project_dify/         # AI智能模块
    ├── asr/              # 语音识别
    ├── nlp/              # 自然语言处理
    └── tts/              # 语音合成
```

## 使用说明

1. 访问 http://localhost 打开Web界面
2. 上传图片或视频进行分析
3. 查看检测结果和处理建议

## 开发指南

### 环境设置

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux
venv\Scripts\activate     # Windows

# 安装依赖
pip install -r requirements.txt
```

### 运行开发服务器

```bash
python app.py
```

## 许可证

本项目采用MIT许可证

##  项目简介
- 本研究针对城市占道经营的实时检测与决策支持需求，提出"灵瞳—YOLOv8-DeepSeek"多模态监测平台。
- 平台基于YOLOv8n模型实现93% mAP@0.5和平衡速度166.7 FPS的实时检测，并集成DeepSeek-R1大语言模型提供智能问答及辅助决策。
- 采用Ollama框架与混合精度量化技术实现隐私安全的边缘部署（响应延迟≤287ms），昆明试点验证平台有效提升治理效率，具备良好扩展性。

![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)
![YOLOv8](https://img.shields.io/badge/YOLOv8-93%25%20mAP-orange.svg)
![DeepSeek](https://img.shields.io/badge/DeepSeek-R1--32B-red.svg)
![Performance](https://img.shields.io/badge/Speed-166.7%20FPS-brightgreen.svg)

*基于 YOLOv8 和 DeepSeek-R1 的智能化城市治理解决方案*

[快速开始](#快速开始) • [演示视频](#演示视频) • [完整文档](docs/README.md) • [API文档](docs/api/README.md) • [贡献指南](#贡献指南)

</div>

---

## 🚀 项目简介

**灵瞳** 是一个专为城市占道经营实时检测与决策支持而设计的多模态监测平台。系统基于先进的 YOLOv8n 模型实现 **93% mAP@0.5** 和平衡速度 **166.7 FPS** 的实时检测能力，并深度集成 DeepSeek-R1 大语言模型提供智能问答及辅助决策功能。

### 🎯 核心特性

- **🔍 高精度检测**: YOLOv8n 模型，93% mAP@0.5 检测精度
- **⚡ 实时处理**: 166.7 FPS 处理速度，支持实时视频流
- **🧠 智能决策**: DeepSeek-R1-32B 多模态决策支持引擎
- **🏠 边缘部署**: Ollama + 混合精度量化，响应延迟 ≤287ms
- **🔒 隐私安全**: 本地化部署，符合 GB/T 35273-2020 规范
- **📊 可视化分析**: 实时数据统计与趋势分析
- **🎙️ 多模态交互**: 支持语音识别与语音合成

### 🏆 技术亮点

| 特性 | 指标 |
|------|------|
| 检测精度 | 93% mAP@0.5 |
| 处理速度 | 166.7 FPS |
| 响应延迟 | ≤287ms |
| 支持格式 | 图片、视频、实时流 |
| 部署方式 | 云端 + 边缘 |

---

## 🛠️ 技术栈

<div align="center">

| 类别 | 技术 |
|------|------|
| **后端框架** | Flask + Gunicorn |
| **前端技术** | HTML5 + CSS3 + JavaScript |
| **深度学习** | YOLOv8 + PyTorch |
| **计算机视觉** | OpenCV + Ultralytics |
| **大语言模型** | DeepSeek-R1-32B |
| **数据库** | MySQL 5.7+ |
| **语音技术** | 讯飞语音识别/合成 |
| **部署工具** | Docker + Ollama |

</div>

---

## 📋 系统要求

### 最低配置
- **Python**: 3.10+ (推荐 3.13+)
- **内存**: 2GB+ (推荐 8GB+)
- **存储**: 5GB+ 可用空间
- **数据库**: MySQL 5.7+

### 推荐配置
- **GPU**: NVIDIA GPU (CUDA 支持)
- **内存**: 16GB+
- **CPU**: 4核心+
- **网络**: 稳定互联网连接

### 包管理器
- **uv** (推荐): 比 pip 快 10-100x 的现代 Python 包管理器
- **pip**: 传统包管理器 (备选方案)

---

## 🚀 快速开始

### 方式一：使用 uv (推荐)

```bash
# 1. 安装 uv
curl -LsSf https://astral.sh/uv/install.sh | sh  # Linux/Mac
# 或 PowerShell (Windows): iwr https://astral.sh/uv/install.ps1 | iex

# 2. 克隆项目
git clone https://github.com/your-username/zdjy.git
cd zdjy

# 3. 一键安装依赖
uv sync

# 4. 激活环境
source .venv/bin/activate  # Linux/Mac
# 或 .venv\Scripts\activate  # Windows

# 5. 配置数据库 (见下方配置说明)

# 6. 启动应用
python app.py
```

### 方式二：传统安装

```bash
# 1. 克隆项目
git clone https://github.com/your-username/zdjy.git
cd zdjy

# 2. 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 3. 安装依赖
pip install -r requirements.txt

# 4. 启动应用
python app.py
```

### 🔧 配置说明

1. **数据库配置**
```sql
CREATE DATABASE tiaozhanbei CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. **修改配置文件**
```python
# config.py
DB_CONFIG = {
    'host': 'your_host',
    'user': 'your_username',
    'password': 'your_password',
    'database': 'tiaozhanbei',
    'port': 3306
}
```

3. **AI模型配置**
```python
# 下载YOLOv8模型文件到models目录
# 配置DeepSeek API密钥（如使用云端API）
# 或配置本地Ollama服务（推荐）
```

---

## 📚 功能模块

### 🎯 核心功能

| 模块 | 功能描述 | 状态 |
|------|----------|------|
| **实时检测** | 图片/视频/流媒体检测 | ✅ 已完成 |
| **数据分析** | 检测趋势与统计分析 | ✅ 已完成 |
| **智能问答** | DeepSeek-R1 决策支持 | ✅ 已完成 |
| **语音交互** | 语音识别与合成 | ✅ 已完成 |
| **用户管理** | 权限控制与认证 | ✅ 已完成 |
| **历史记录** | 检测结果存储查询 | ✅ 已完成 |

### 🤖 智能助手系统

基于 **DeepSeek-R1** 构建的多模态决策支持引擎，采用"感知-认知-决策"三阶段架构：

#### 🧠 AI技术架构
- **视觉感知层**: YOLOv8n目标检测模型，实现93% mAP@0.5精度
- **语言理解层**: DeepSeek-R1-32B大语言模型，支持多模态理解
- **决策支持层**: 基于知识图谱的智能推理引擎
- **交互界面层**: 语音识别(ASR) + 语音合成(TTS) + Web界面

#### 🔧 核心功能
- **📖 法规解读**: 城市管理法规智能解读与条文检索
- **🏷️ 分类标准**: 占道经营分类与识别标准自动匹配
- **💡 治理建议**: 个性化治理措施推荐与执法指导
- **📊 数据解读**: 检测数据智能分析与可视化报告
- **🔮 趋势预测**: 基于历史数据的趋势预测与风险评估
- **🎙️ 语音交互**: 支持语音问答，提升现场执法效率

---

## 🎬 系统演示视频 {#演示视频}

<div align="center">

### 📺 完整功能演示
[![完整功能演示](https://img.youtube.com/vi/YOUR_VIDEO_ID/maxresdefault.jpg)](https://www.youtube.com/watch?v=YOUR_VIDEO_ID)
*点击观看完整功能演示视频*

### 🎯 实时检测演示
[![实时检测演示](docs/videos/detection-demo-thumbnail.jpg)](docs/videos/real-time-detection.mp4)
*实时检测功能演示 - 展示YOLOv8模型的检测效果*

### 🤖 智能助手演示
[![智能助手演示](docs/videos/ai-assistant-thumbnail.jpg)](docs/videos/ai-assistant-demo.mp4)
*DeepSeek-R1智能助手对话演示*

### 📊 数据分析演示
[![数据分析演示](docs/videos/analytics-thumbnail.jpg)](docs/videos/data-analysis-demo.mp4)
*可视化数据分析与报表生成*

> 💡 **提示**: 如果视频无法播放，请访问 [项目文档](docs/README.md) 查看详细的功能说明和使用指南。

</div>

---

## 🔧 开发指南

### 开发环境设置

```bash
# 安装完整开发环境
uv sync --extra dev --extra docs

# 代码格式化
black .

# 代码风格检查
flake8 .

# 类型检查
mypy .

# 运行测试
pytest --cov=zdjy --cov-report=html
```

### 常用命令

```bash
# 依赖管理
uv add package_name          # 添加依赖
uv add --dev package_name    # 添加开发依赖
uv remove package_name       # 移除依赖
uv sync --upgrade           # 更新所有依赖

# 项目管理
uv tree                     # 查看依赖树
uv pip list --outdated     # 检查过期依赖
```

### 项目结构

```
zdjy/
├── 📁 app.py                 # 🚀 主应用入口
├── 📁 config.py              # ⚙️ 配置文件
├── 📁 pyproject.toml         # 📦 项目配置
├── 📁 requirements.txt       # 📋 依赖列表
├── 📁 uv.lock               # 🔒 版本锁定
├── 📁 models/               # 🧠 AI模型文件
├── 📁 static/               # 🎨 静态资源
├── 📁 templates/            # 📄 HTML模板
├── 📁 util/                 # 🔧 工具函数
└── 📁 project_dify/         # 🤖 智能模块
    ├── 📁 asr/              # 🎙️ 语音识别
    ├── 📁 nlp/              # 💬 自然语言处理
    └── 📁 tts/              # 🔊 语音合成
```

---

## 🚀 部署指南

### 生产环境部署

```bash
# 使用Gunicorn部署
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app

# 使用Nginx反向代理（可选）
# 配置SSL证书和域名
```

### 低内存服务器部署

适用于 **2核2G** 内存的服务器:

```bash
# 克隆项目
git clone https://github.com/Alieforwang/zdjy.git
cd zdjy

# 创建虚拟环境
python -m venv venv
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 启动应用
python app.py
```

---

## 📈 性能优化

### 内存优化策略

- **模型单例**: 全局单例模型实例
- **连接池**: 数据库连接池优化
- **图像处理**: 流式处理减少内存占用
- **缓存机制**: 智能缓存策略

### GPU 加速

```bash
# 安装GPU版本
uv sync --extra gpu

# 验证CUDA支持
python -c "import torch; print(torch.cuda.is_available())"
```

---

## 🤝 贡献指南

我们欢迎所有形式的贡献！请查看 [贡献指南](CONTRIBUTING.md) 了解详细信息。

### 贡献流程

1. **Fork** 项目到您的账户
2. **创建** 功能分支: `git checkout -b feature/amazing-feature`
3. **提交** 更改: `git commit -m 'Add amazing feature'`
4. **推送** 分支: `git push origin feature/amazing-feature`
5. **创建** Pull Request

### 开发规范

- 遵循 [PEP 8](https://pep8.org/) 编码规范
- 添加必要的测试用例
- 更新相关文档
- 确保所有测试通过

---

## 📜 许可证

本项目采用 [MIT License](LICENSE) 开源协议。

---

## 🙏 致谢

- [YOLOv8](https://github.com/ultralytics/ultralytics) - 目标检测框架
- [DeepSeek](https://github.com/deepseek-ai) - 大语言模型
- [Flask](https://flask.palletsprojects.com/) - Web框架
- [OpenCV](https://opencv.org/) - 计算机视觉库

---

## 📞 联系我们

- **作者**: Alieforwang
- **邮箱**: 154425450+Alieforwang@users.noreply.github.com
- **项目主页**: [GitHub Repository](https://github.com/Alieforwang/zdjy)
- **问题反馈**: [Issues](https://github.com/Alieforwang/zdjy/issues)
- **功能请求**: [Feature Requests](https://github.com/Alieforwang/zdjy/issues/new?template=feature_request.md)

---

## 📊 项目统计

![GitHub stars](https://img.shields.io/github/stars/Alieforwang/zdjy?style=social)
![GitHub forks](https://img.shields.io/github/forks/Alieforwang/zdjy?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/Alieforwang/zdjy?style=social)

---

<div align="center">

**⭐ 如果这个项目对您有帮助，请给我们一个星标！**

Made with ❤️ by [Alieforwang](https://github.com/Alieforwang)

</div>