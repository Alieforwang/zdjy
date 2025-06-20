#!/bin/bash
set -e

echo "=========================================="
echo "自动检测环境并启动适合的Docker配置"
echo "=========================================="

# 检测系统架构
ARCH=$(uname -m)
echo "系统架构: $ARCH"

# 检测是否有NVIDIA GPU
if command -v nvidia-smi &> /dev/null; then
    echo "检测到NVIDIA GPU:"
    nvidia-smi --query-gpu=name,driver_version,memory.total --format=csv,noheader
    
    # 检测nvidia-docker是否安装
    if command -v nvidia-docker &> /dev/null || docker info | grep -q "Runtimes:.*nvidia" || grep -q "nvidia-container-runtime" <<< "$(docker info 2>&1)"; then
        echo "检测到NVIDIA Docker Runtime"
        USE_GPU=true
    else
        echo "警告: 检测到NVIDIA GPU，但未发现NVIDIA Docker Runtime"
        echo "尝试使用GPU版本，但可能无法正常工作"
        echo "请考虑安装NVIDIA Docker: https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html"
        USE_GPU=true
    fi
else
    echo "未检测到NVIDIA GPU，使用CPU版本"
    USE_GPU=false
fi

# 创建init目录(如果不存在)
mkdir -p ../scripts/init

echo "=========================================="
echo "开始构建和启动容器..."

# 根据是否有GPU选择不同的配置文件
if [ "$USE_GPU" = true ]; then
    echo "使用GPU配置..."
    docker-compose -f docker-compose.gpu.yml up -d
else
    echo "使用CPU配置..."
    docker-compose -f docker-compose.yml up -d
fi

echo "=========================================="
echo "容器已启动，查看日志:"
echo "docker-compose logs -f app"
echo ""
echo "访问应用: http://localhost:8888"
echo "==========================================" 