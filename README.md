<div align="center">

#  灵瞳 - 智能城市治理监测平台

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-blue.svg" alt="Python">
  <img src="https://img.shields.io/badge/Flask-2.0+-green.svg" alt="Flask">
  <img src="https://img.shields.io/badge/YOLOv8-Latest-orange.svg" alt="YOLOv8">
  <img src="https://img.shields.io/badge/DeepSeek--R1-32B-red.svg" alt="DeepSeek">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License">
  <img src="https://img.shields.io/github/stars/Alieforwang/zdjy?style=social" alt="GitHub stars">
</p>

*基于 YOLOv8 和 DeepSeek-R1 的智能化城市治理解决方案*

[快速开始](#-快速开始) • [功能演示](#-功能演示) • [技术文档](#-技术文档) • [部署指南](#-部署指南) • [贡献指南](#-贡献指南)

</div>

---

## 📖 项目简介

**灵瞳** 是一个专为城市占道经营实时检测与决策支持而设计的多模态监测平台。系统基于先进的 YOLOv8n 模型实现高精度实时检测，并深度集成 DeepSeek-R1 大语言模型提供智能问答及辅助决策功能。

> 🌐 **在线演示平台**: [https://lingtong.lingtongai.dpdns.org/](https://lingtong.lingtongai.dpdns.org/) <mcreference link="https://www.bilibili.com/video/BV1oMKZz9EyT?vd_source=8c03bd3b8e2a1e43b6b6fa9327ff1b7b" index="0">0</mcreference>

### 🎯 核心特性

- **🔍 高精度检测**: YOLOv8n 模型，93% mAP@0.5 检测精度
- **⚡ 实时处理**: 166.7 FPS 处理速度，支持实时视频流
- **🧠 智能决策**: DeepSeek-R1-32B 多模态决策支持引擎
- **🏠 边缘部署**: Ollama + 混合精度量化，响应延迟 ≤287ms
- **🔒 隐私安全**: 本地化部署，符合 GB/T 35273-2020 规范
- **📊 可视化分析**: 实时数据统计与趋势分析
- **🎙️ 多模态交互**: 支持语音识别与语音合成

### 🏆 技术指标

| 指标 | 数值 | 说明 |
|------|------|------|
| 检测精度 | 93% mAP@0.5 | YOLOv8n 模型性能 |
| 处理速度 | 166.7 FPS | 实时视频流处理 |
| 响应延迟 | ≤287ms | AI 决策响应时间 |
| 支持格式 | 图片/视频/流 | 多种输入格式 |
| 部署方式 | 云端+边缘 | 灵活部署选择 |

---

## 🛠️ 技术栈

<div align="center">

| 类别 | 技术栈 |
|------|--------|
| **后端框架** | Flask + Gunicorn |
| **前端技术** | HTML5 + CSS3 + JavaScript |
| **深度学习** | YOLOv8 + PyTorch |
| **计算机视觉** | OpenCV + Ultralytics |
| **大语言模型** | DeepSeek-R1-32B |
| **数据库** | MySQL 5.7+ + SQLite |
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
git clone https://github.com/Alieforwang/zdjy.git
cd zdjy

# 3. 一键安装依赖
uv sync

# 4. 激活环境
source .venv/bin/activate  # Linux/Mac
# 或 .venv\Scripts\activate  # Windows

# 5. 配置数据库
mysql -u root -p -e "CREATE DATABASE tiaozhanbei CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 6. 启动应用
python app.py
```

### 方式二：传统安装

```bash
# 1. 克隆项目
git clone https://github.com/Alieforwang/zdjy.git
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
```python
# config.py
DB_CONFIG = {
    'host': 'localhost',
    'user': 'your_username',
    'password': 'your_password',
    'database': 'tiaozhanbei',
    'port': 3306
}
```

2. **AI模型配置**
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

## 🎬 功能演示

本项目基于YOLOv8目标检测模型，融合DeepSeek大语言模型与讯飞语音识别/语音合成技术，构建面向城市场景的智能监测平台。系统支持图像上传识别、视频流实时检测、违规行为预警、数据可视化展示与AI问答交互，服务于占道经营等城市治理需求。

### 📺 完整功能演示
**云南交通职业技术学院-20251630-展示视频**
- 🎬 [观看完整演示视频](https://www.bilibili.com/video/BV1oMKZz9EyT?vd_source=8c03bd3b8e2a1e43b6b6fa9327ff1b7b)
- 🌐 [在线体验平台](https://lingtong.lingtongai.dpdns.org/)

### 🎯 核心功能展示

#### 🔍 **实时检测功能**
- **高精度检测**: YOLOv8n模型，93% mAP@0.5检测精度
- **实时处理**: 166.7 FPS处理速度，支持实时视频流
- **多格式支持**: 图片、视频、摄像头实时流检测

#### 🤖 **智能助手功能**
- **多模态理解**: DeepSeek-R1大语言模型驱动
- **语音交互**: 讯飞语音识别与合成技术
- **智能问答**: 法规解读、治理建议、数据分析

#### 📊 **数据分析功能**
- **可视化展示**: 实时数据统计与趋势分析
- **智能报告**: 自动生成检测报告和分析结果
- **历史记录**: 完整的检测历史和数据追踪

> 💡 **提示**: 更多详细功能说明请访问 [项目文档](docs/README.md) 或直接体验 [在线演示平台](https://lingtong.lingtongai.dpdns.org/)

---

## 📁 项目结构

```
zdjy/
├── 📄 app.py                 # 🚀 主应用入口
├── 📄 config.py              # ⚙️ 配置文件
├── 📄 pyproject.toml         # 📦 项目配置
├── 📄 requirements.txt       # 📋 依赖列表
├── 📄 uv.lock               # 🔒 版本锁定
├── 📁 models/               # 🧠 AI模型文件
├── 📁 static/               # 🎨 静态资源
├── 📁 templates/            # 📄 HTML模板
├── 📁 util/                 # 🔧 工具函数
├── 📁 sql/                  # 🗄️ 数据库脚本
└── 📁 project_dify/         # 🤖 智能模块
    ├── 📁 asr/              # 🎙️ 语音识别
    ├── 📁 nlp/              # 💬 自然语言处理
    └── 📁 tts/              # 🔊 语音合成
```

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

### 📈 性能优化

#### 内存优化策略
- **模型单例**: 全局单例模型实例
- **连接池**: 数据库连接池优化
- **图像处理**: 流式处理减少内存占用
- **缓存机制**: 智能缓存策略

#### GPU 加速
```bash
# 安装GPU版本
uv sync --extra gpu

# 验证CUDA支持
python -c "import torch; print(torch.cuda.is_available())"
```

---

## 📚 技术文档

- [完整文档](docs/README.md)
- [API文档](docs/api/README.md)
- [数据库结构](database_structure.md)
- [SQL查询集合](system_queries.md)
- [部署指南](docs/deployment.md)

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