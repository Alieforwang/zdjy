#!/bin/bash
set -e

# 定义颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}灵瞳YOLOv8-DeepSeek多模态街景治理实时检测平台 - Docker部署脚本${NC}"
echo ""

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: Docker 未安装，请先安装Docker${NC}"
    echo "参考: https://docs.docker.com/get-docker/"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}错误: Docker Compose 未安装，请先安装Docker Compose${NC}"
    echo "参考: https://docs.docker.com/compose/install/"
    exit 1
fi

# 检查NVIDIA驱动
HAS_NVIDIA=false
if command -v nvidia-smi &> /dev/null; then
    if nvidia-smi &> /dev/null; then
        HAS_NVIDIA=true
        NVIDIA_VERSION=$(nvidia-smi --query-gpu=driver_version --format=csv,noheader,nounits | head -n 1)
        echo -e "${GREEN}检测到NVIDIA驱动版本: ${NVIDIA_VERSION}${NC}"
    else
        echo -e "${YELLOW}发现nvidia-smi命令但无法执行，可能驱动未正确安装${NC}"
    fi
else
    echo -e "${YELLOW}未检测到NVIDIA驱动${NC}"
fi

# 检查NVIDIA Container Toolkit
HAS_NVIDIA_DOCKER=false
if command -v nvidia-docker &> /dev/null || command -v nvidia-container-toolkit &> /dev/null; then
    HAS_NVIDIA_DOCKER=true
    echo -e "${GREEN}检测到NVIDIA Container Toolkit${NC}"
else 
    echo -e "${YELLOW}未检测到NVIDIA Container Toolkit${NC}"
fi

# 询问是否使用GPU
USE_GPU=false
GPU_OPTION="n"

if [ "$HAS_NVIDIA" = true ] && [ "$HAS_NVIDIA_DOCKER" = true ]; then
    echo ""
    read -p "是否使用GPU加速? (y/n, 默认: y): " GPU_OPTION
    GPU_OPTION=${GPU_OPTION:-y}
    
    if [ "$GPU_OPTION" = "y" ] || [ "$GPU_OPTION" = "Y" ]; then
        USE_GPU=true
        echo -e "${GREEN}将使用GPU版本部署${NC}"
    else
        echo -e "${YELLOW}将使用CPU版本部署${NC}"
    fi
else
    echo -e "${YELLOW}未满足GPU部署条件，将使用CPU版本部署${NC}"
    if [ "$HAS_NVIDIA" = false ]; then
        echo "  - 未检测到NVIDIA驱动"
    fi 
    if [ "$HAS_NVIDIA_DOCKER" = false ]; then
        echo "  - 未检测到NVIDIA Container Toolkit"
    fi
fi

# 确认模型文件存在
if [ ! -d "../models" ]; then
    echo -e "${YELLOW}警告: 未找到models目录，将创建新目录${NC}"
    mkdir -p ../models
fi

if [ ! -f "../models/best.pt" ]; then
    echo -e "${YELLOW}警告: 未找到模型文件 (models/best.pt)${NC}"
    echo "请确保将模型文件放置在'models'目录中，或稍后手动添加"
fi

# 停止可能已运行的容器
echo ""
echo "停止可能正在运行的容器..."
docker-compose down 2>/dev/null || true

# 构建和启动容器
echo ""
echo "开始部署应用..."

if [ "$USE_GPU" = true ]; then
    # 使用GPU版本
    export GPU_MODE="Dockerfile.gpu"
    export NVIDIA_DRIVER="nvidia"
    export NVIDIA_COUNT="all"
    export NVIDIA_CAPABILITIES="gpu"
    export NVIDIA_VISIBLE_DEVICES="all"
    
    echo "启动GPU版本..."
else
    # 使用CPU版本
    export GPU_MODE="Dockerfile"
    export NVIDIA_DRIVER="none"
    export NVIDIA_COUNT="0"
    export NVIDIA_CAPABILITIES=""
    export NVIDIA_VISIBLE_DEVICES="none"
    
    echo "启动CPU版本..."
fi

# 执行构建和部署
docker-compose up -d --build

# 检查是否成功启动
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}部署成功!${NC}"
    echo ""
    echo "应用访问地址: http://localhost:8888"
    echo ""
    echo "常用命令:"
    echo "  - 查看日志: docker-compose logs -f app"
    echo "  - 停止服务: docker-compose down"
    echo "  - 重启服务: docker-compose restart app"
    echo ""
    
    if [ "$USE_GPU" = true ]; then
        # 验证GPU是否在容器中可用
        echo "验证GPU是否在容器中可用..."
        sleep 5
        if docker-compose exec app python -c "import torch; print('GPU可用:', torch.cuda.is_available()); print('GPU数量:', torch.cuda.device_count() if torch.cuda.is_available() else 0)" 2>/dev/null; then
            echo -e "${GREEN}GPU配置成功!${NC}"
        else
            echo -e "${YELLOW}无法验证GPU状态，请稍后手动检查${NC}"
        fi
    fi
else
    echo ""
    echo -e "${RED}部署失败，请检查错误信息${NC}"
fi