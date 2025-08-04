# 📦 安装指南

<div align="center">

![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)
![Platform](https://img.shields.io/badge/平台-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey.svg)
![Status](https://img.shields.io/badge/状态-稳定-green.svg)

*详细的安装步骤和环境配置指南*

</div>

---

## 📋 系统要求

### 最低配置
| 组件 | 要求 |
|------|------|
| **操作系统** | Windows 10+, Ubuntu 18.04+, macOS 10.15+ |
| **Python** | 3.10+ (推荐 3.13+) |
| **内存** | 2GB+ (推荐 8GB+) |
| **存储** | 5GB+ 可用空间 |
| **网络** | 稳定的互联网连接 |

### 推荐配置
| 组件 | 推荐配置 |
|------|----------|
| **CPU** | 4核心+ (支持GPU加速) |
| **GPU** | NVIDIA GPU (CUDA 11.8+) |
| **内存** | 16GB+ |
| **存储** | SSD 20GB+ |
| **数据库** | MySQL 5.7+ 或 8.0+ |

---

## 🚀 快速安装 (推荐)

### 方式一：使用 uv (最快)

```bash
# 1. 安装 uv 包管理器
# Windows (PowerShell)
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Linux/macOS
curl -LsSf https://astral.sh/uv/install.sh | sh

# 2. 克隆项目
git clone https://github.com/Alieforwang/zdjy.git
cd zdjy

# 3. 一键安装所有依赖
uv sync

# 4. 激活虚拟环境
# Windows
.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate
```

### 验证安装
```bash
# 验证核心依赖
python -c "import flask, cv2, ultralytics, numpy; print('✅ 核心依赖安装成功')"

# 检查uv版本
uv --version

# 查看已安装包
uv pip list
```

---

## 📦 详细安装步骤

### Step 1: 环境准备

#### 1.1 Python 环境
```bash
# 检查Python版本
python --version

# 如果版本过低，请安装新版本
# Windows: 下载 https://www.python.org/downloads/
# Ubuntu: sudo apt update && sudo apt install python3.11
# macOS: brew install python@3.11
```

#### 1.2 Git 安装
```bash
# 验证Git
git --version

# 如果未安装：
# Windows: 下载 https://git-scm.com/download/win
# Ubuntu: sudo apt install git
# macOS: xcode-select --install
```

### Step 2: 克隆项目

```bash
# 克隆主仓库
git clone https://github.com/Alieforwang/zdjy.git

# 进入项目目录
cd zdjy

# 检查项目结构
ls -la
```

### Step 3: 依赖安装

#### 3.1 使用 uv (推荐)

```bash
# 创建虚拟环境
uv venv

# 激活虚拟环境
# Windows
.venv\Scripts\activate
# Linux/macOS
source .venv/bin/activate

# 安装基础依赖
uv sync

# 安装开发依赖 (可选)
uv sync --extra dev

# 安装GPU支持 (如果有NVIDIA GPU)
uv sync --extra gpu
```

#### 3.2 使用 pip (备选)

```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows
venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

# 升级pip
pip install --upgrade pip

# 安装依赖
pip install -r requirements.txt
```

### Step 4: 数据库配置

#### 4.1 安装 MySQL

**Windows:**
```bash
# 下载并安装 MySQL Community Server
# https://dev.mysql.com/downloads/mysql/

# 或使用 Chocolatey
choco install mysql
```

**Ubuntu:**
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

**macOS:**
```bash
# 使用 Homebrew
brew install mysql
brew services start mysql
```

#### 4.2 创建数据库

```sql
-- 登录MySQL
mysql -u root -p

-- 创建数据库
CREATE DATABASE tiaozhanbei CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户 (可选)
CREATE USER 'zdjy_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON tiaozhanbei.* TO 'zdjy_user'@'localhost';
FLUSH PRIVILEGES;

-- 退出
EXIT;
```

#### 4.3 配置连接

编辑 `config.py` 文件：

```python
DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',  # 或 'zdjy_user'
    'password': 'your_password',
    'database': 'tiaozhanbei',
    'port': 3306,
    'charset': 'utf8mb4',
}
```

### Step 5: 模型文件

#### 5.1 下载预训练模型

```bash
# 创建模型目录
mkdir -p models

# 下载YOLOv8模型 (如果没有自定义模型)
# 系统会自动下载，或手动下载：
wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt -O models/best.pt
```

#### 5.2 验证模型

```python
# 测试模型加载
python -c "
from ultralytics import YOLO
model = YOLO('models/best.pt')
print('✅ 模型加载成功')
"
```

---

## 🔧 高级配置

### GPU 加速配置

#### NVIDIA GPU + CUDA

```bash
# 检查GPU
nvidia-smi

# 安装CUDA版本的PyTorch (如果使用uv)
uv sync --extra gpu

# 或使用pip
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# 验证CUDA支持
python -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}')"
```

### 讯飞语音配置

编辑 `config.py` 中的讯飞配置：

```python
XUNFEI_CONFIG = {
    'APP_ID': 'your_app_id',
    'ASR_API_KEY': 'your_asr_key',
    'ASR_API_SECRET': 'your_asr_secret',
    'TTS_API_KEY': 'your_tts_key',
    'TTS_API_SECRET': 'your_tts_secret',
}
```

### DeepSeek 配置

编辑 Dify 配置：

```python
DIFY_CONFIG = {
    'API_KEY': 'your_dify_api_key',
    'API_URL': 'http://your_dify_server:8000/v1/chat-messages',
}
```

---

## ✅ 安装验证

### 完整功能测试

```bash
# 1. 激活环境
source .venv/bin/activate  # Linux/macOS
# 或 .venv\Scripts\activate  # Windows

# 2. 运行测试脚本
python -c "
import sys
print(f'Python版本: {sys.version}')

# 测试核心依赖
try:
    import flask
    import cv2
    import ultralytics
    import numpy as np
    import mysql.connector
    print('✅ 所有核心依赖安装成功')
except ImportError as e:
    print(f'❌ 依赖缺失: {e}')

# 测试数据库连接
try:
    from config import DB_CONFIG
    import mysql.connector
    conn = mysql.connector.connect(**DB_CONFIG)
    conn.close()
    print('✅ 数据库连接成功')
except Exception as e:
    print(f'❌ 数据库连接失败: {e}')
"

# 3. 启动应用测试
python app.py
```

### 性能测试

```bash
# GPU性能测试 (如果有GPU)
python -c "
import torch
if torch.cuda.is_available():
    print(f'GPU: {torch.cuda.get_device_name(0)}')
    print(f'显存: {torch.cuda.get_device_properties(0).total_memory // 1024**3}GB')
    print('✅ GPU可用')
else:
    print('⚠️  GPU不可用，将使用CPU')
"

# 模型加载测试
python -c "
from ultralytics import YOLO
import time
start = time.time()
model = YOLO('models/best.pt')
load_time = time.time() - start
print(f'✅ 模型加载耗时: {load_time:.2f}秒')
"
```

---

## 🐛 常见问题

### 安装问题

**Q1: uv 安装失败**
```bash
# 方案1: 使用代理
export https_proxy=http://proxy.example.com:8080
curl -LsSf https://astral.sh/uv/install.sh | sh

# 方案2: 手动下载
wget https://github.com/astral-sh/uv/releases/latest/download/uv-x86_64-unknown-linux-gnu.tar.gz
tar -xzf uv-x86_64-unknown-linux-gnu.tar.gz
sudo mv uv /usr/local/bin/
```

**Q2: 依赖冲突**
```bash
# 清理环境重新安装
rm -rf .venv
uv venv
uv sync
```

**Q3: MySQL连接错误**
```bash
# 检查MySQL服务状态
sudo systemctl status mysql  # Linux
brew services list | grep mysql  # macOS

# 重置MySQL密码
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'new_password';
FLUSH PRIVILEGES;
```

### 权限问题

**Windows:**
```bash
# 以管理员身份运行PowerShell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Linux/macOS:**
```bash
# 确保有足够权限
sudo chown -R $USER:$USER ~/.local/share/uv
chmod -R 755 ~/.local/share/uv
```

---

## 📚 下一步

安装完成后，建议您：

1. 📖 阅读 [快速开始指南](quickstart.md)
2. 🎬 观看 [演示视频](../videos/README.md)
3. 🔧 查看 [配置说明](configuration.md)
4. 🚀 开始 [开发指南](development.md)

---

<div align="center">

**🎉 恭喜！安装完成，开始体验灵瞳智能检测平台**

如遇问题，请查看 [FAQ](faq.md) 或 [提交Issue](https://github.com/Alieforwang/zdjy/issues)

</div>