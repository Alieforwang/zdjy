#!/bin/bash
set -e

# 定义颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}################################################################################${NC}"
echo -e "${GREEN}#                                                                              #${NC}"
echo -e "${GREEN}#              灵瞳YOLOv8-DeepSeek多模态街景治理实时检测平台                   #${NC}"
echo -e "${GREEN}#                         全自动部署脚本 v1.0                                  #${NC}"
echo -e "${GREEN}#                                                                              #${NC}"
echo -e "${GREEN}################################################################################${NC}"
echo ""

# 创建必要的目录结构
echo -e "${BLUE}[1/8] 创建必要的目录结构${NC}"
mkdir -p nginx/conf.d nginx/ssl nginx/logs nginx/html
mkdir -p ../models
mkdir -p ../scripts/init

# 检测基本环境
echo -e "${BLUE}[2/8] 检测系统环境${NC}"

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Docker未安装，尝试自动安装...${NC}"
    
    # 检测操作系统
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
        
        # 根据不同的操作系统安装Docker
        if [[ "$OS" == *"Ubuntu"* ]]; then
            echo -e "${BLUE}检测到Ubuntu系统，安装Docker...${NC}"
            sudo apt-get update
            sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
            sudo add-apt-repository "deb [arch=$(dpkg --print-architecture)] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
            sudo apt-get update
            sudo apt-get install -y docker-ce docker-ce-cli containerd.io
        elif [[ "$OS" == *"Debian"* ]]; then
            echo -e "${BLUE}检测到Debian系统，安装Docker...${NC}"
            sudo apt-get update
            sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
            curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
            sudo apt-get update
            sudo apt-get install -y docker-ce docker-ce-cli containerd.io
        elif [[ "$OS" == *"CentOS"* ]]; then
            echo -e "${BLUE}检测到CentOS系统，安装Docker...${NC}"
            sudo yum install -y yum-utils
            sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
            sudo yum install -y docker-ce docker-ce-cli containerd.io
            sudo systemctl start docker
        else
            echo -e "${RED}不支持的操作系统: $OS${NC}"
            echo "请参考Docker官方文档手动安装: https://docs.docker.com/engine/install/"
            exit 1
        fi
        
        # 启动Docker服务
        sudo systemctl enable docker
        sudo systemctl start docker
        
        # 将当前用户添加到docker组
        sudo usermod -aG docker $USER
        echo -e "${GREEN}Docker安装完成，可能需要重新登录以应用组权限${NC}"
    else
        echo -e "${RED}无法检测操作系统，请手动安装Docker${NC}"
        echo "参考: https://docs.docker.com/engine/install/"
        exit 1
    fi
else
    echo -e "${GREEN}Docker已安装: $(docker --version)${NC}"
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Docker Compose未安装，尝试自动安装...${NC}"
    
    # 安装最新版Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    # 检查是否安装成功
    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}Docker Compose安装失败${NC}"
        echo "请参考Docker Compose官方文档手动安装: https://docs.docker.com/compose/install/"
        exit 1
    fi
    
    echo -e "${GREEN}Docker Compose安装完成${NC}"
else
    echo -e "${GREEN}Docker Compose已安装: $(docker-compose --version)${NC}"
fi

# 检测NVIDIA驱动和CUDA
echo -e "${BLUE}[3/8] 检测GPU环境${NC}"

# 检查NVIDIA驱动
HAS_NVIDIA=false
if command -v nvidia-smi &> /dev/null; then
    if nvidia-smi &> /dev/null; then
        HAS_NVIDIA=true
        NVIDIA_VERSION=$(nvidia-smi --query-gpu=driver_version --format=csv,noheader,nounits | head -n 1)
        CUDA_VERSION=$(nvidia-smi --query-gpu=cuda_version --format=csv,noheader,nounits | head -n 1 | tr -d '.')
        echo -e "${GREEN}检测到NVIDIA驱动版本: ${NVIDIA_VERSION}${NC}"
        echo -e "${GREEN}CUDA版本: ${CUDA_VERSION:0:2}.${CUDA_VERSION:2:1}${NC}"
        GPU_NAME=$(nvidia-smi --query-gpu=name --format=csv,noheader,nounits | head -n 1)
        echo -e "${GREEN}GPU型号: ${GPU_NAME}${NC}"
    else
        echo -e "${YELLOW}发现nvidia-smi命令但无法执行，可能驱动未正确安装${NC}"
    fi
else
    echo -e "${YELLOW}未检测到NVIDIA驱动，将使用CPU模式${NC}"
fi

# 检查NVIDIA Container Toolkit
HAS_NVIDIA_DOCKER=false
if command -v nvidia-docker &> /dev/null || grep -q "nvidia-container-runtime" <<< "$(docker info 2>&1)"; then
    HAS_NVIDIA_DOCKER=true
    echo -e "${GREEN}检测到NVIDIA Container Toolkit${NC}"
elif [ "$HAS_NVIDIA" = true ]; then
    echo -e "${YELLOW}检测到NVIDIA GPU，但未安装NVIDIA Container Toolkit，尝试自动安装...${NC}"
    
    # 检测操作系统
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        
        # 根据不同的操作系统安装NVIDIA Container Toolkit
        if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
            echo -e "${BLUE}在${OS}上安装NVIDIA Container Toolkit...${NC}"
            distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
            curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
            curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list
            sudo apt-get update
            sudo apt-get install -y nvidia-docker2
            sudo systemctl restart docker
            HAS_NVIDIA_DOCKER=true
            echo -e "${GREEN}NVIDIA Container Toolkit安装完成${NC}"
        elif [[ "$OS" == *"CentOS"* ]]; then
            echo -e "${BLUE}在${OS}上安装NVIDIA Container Toolkit...${NC}"
            distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
            sudo yum-config-manager --add-repo https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.repo
            sudo yum install -y nvidia-docker2
            sudo systemctl restart docker
            HAS_NVIDIA_DOCKER=true
            echo -e "${GREEN}NVIDIA Container Toolkit安装完成${NC}"
        else
            echo -e "${YELLOW}不支持的操作系统: $OS，无法自动安装NVIDIA Container Toolkit${NC}"
            echo "参考: https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html"
        fi
    else
        echo -e "${YELLOW}无法检测操作系统，无法自动安装NVIDIA Container Toolkit${NC}"
    fi
else
    echo -e "${YELLOW}未检测到NVIDIA GPU，不需要安装NVIDIA Container Toolkit${NC}"
fi

# 确定是否使用GPU版本
USE_GPU=false
if [ "$HAS_NVIDIA" = true ] && [ "$HAS_NVIDIA_DOCKER" = true ]; then
    USE_GPU=true
    echo -e "${GREEN}将使用GPU版本部署${NC}"
else
    echo -e "${YELLOW}将使用CPU版本部署${NC}"
fi

# 创建配置文件
echo -e "${BLUE}[4/8] 生成配置文件${NC}"

# 生成Nginx配置
echo -e "${BLUE}创建Nginx配置${NC}"
cat > nginx/conf.d/default.conf << EOF
server {
    listen 80;
    server_name localhost;

    # 重定向到HTTPS
    # return 301 https://\$host\$request_uri;
    
    location / {
        proxy_pass http://app:8888;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # 静态文件缓存
    location /static/ {
        proxy_pass http://app:8888/static/;
        proxy_set_header Host \$host;
        proxy_cache_valid 200 302 30m;
        proxy_cache_valid 404 5m;
        expires 1h;
    }
}

# 取消注释以启用HTTPS
# server {
#     listen 443 ssl;
#     server_name localhost;
#
#     ssl_certificate /etc/nginx/ssl/cert.pem;
#     ssl_certificate_key /etc/nginx/ssl/key.pem;
#
#     ssl_session_cache shared:SSL:10m;
#     ssl_session_timeout 10m;
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_prefer_server_ciphers on;
#
#     location / {
#         proxy_pass http://app:8888;
#         proxy_set_header Host \$host;
#         proxy_set_header X-Real-IP \$remote_addr;
#         proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto \$scheme;
#         
#         # WebSocket支持
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade \$http_upgrade;
#         proxy_set_header Connection "upgrade";
#     }
# }
EOF

# 创建.env文件
echo -e "${BLUE}创建环境变量文件${NC}"
cat > .env << EOF
# Docker配置
COMPOSE_PROJECT_NAME=zdjy

# GPU配置
GPU_MODE=$([ "$USE_GPU" = true ] && echo "Dockerfile.gpu" || echo "Dockerfile")
NVIDIA_DRIVER=$([ "$USE_GPU" = true ] && echo "nvidia" || echo "none")
NVIDIA_COUNT=$([ "$USE_GPU" = true ] && echo "all" || echo "0")
NVIDIA_CAPABILITIES=$([ "$USE_GPU" = true ] && echo "gpu" || echo "")
NVIDIA_VISIBLE_DEVICES=$([ "$USE_GPU" = true ] && echo "all" || echo "none")

# 镜像源配置
PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple
APT_MIRROR=mirrors.tuna.tsinghua.edu.cn

# 数据库配置
DB_HOST=mysql
DB_USER=root
DB_PASSWORD=123456
DB_NAME=tiaozhanbei
MYSQL_ROOT_PASSWORD=123456
MYSQL_DATABASE=tiaozhanbei
MYSQL_USER=zdjy
MYSQL_PASSWORD=zdjy123

# 服务端口配置
HTTP_PORT=80
HTTPS_PORT=443
APP_PORT=8888
MYSQL_PORT=3306
EOF

echo -e "${GREEN}配置文件生成完成${NC}"

# 检查模型文件
echo -e "${BLUE}[5/8] 检查模型文件${NC}"
if [ ! -f "../models/best.pt" ]; then
    echo -e "${YELLOW}警告: 未找到YOLOv8模型文件 (models/best.pt)${NC}"
    echo "您需要手动将模型文件放置到models目录中"
    echo -e "或者运行以下命令下载演示模型: ${BLUE}curl -L https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt -o ../models/best.pt${NC}"
fi

# 停止可能已运行的容器
echo -e "${BLUE}[6/8] 停止已运行的容器${NC}"
docker-compose down 2>/dev/null || true

# 构建和启动容器
echo -e "${BLUE}[7/8] 构建和启动容器${NC}"
docker-compose up -d --build

echo -e "${BLUE}[8/8] 验证部署${NC}"

# 等待服务启动
echo -e "等待服务启动..."
sleep 10

# 检查容器状态
if [ $(docker-compose ps -q | wc -l) -eq 3 ]; then
    echo -e "${GREEN}所有容器已成功启动${NC}"
    
    # 验证应用是否正常访问
    if curl -s --head http://localhost:80 | grep "200 OK" > /dev/null 2>&1; then
        echo -e "${GREEN}HTTP服务运行正常${NC}"
    else
        echo -e "${YELLOW}警告: HTTP服务可能未正常运行，请手动验证${NC}"
    fi
    
    # 验证GPU
    if [ "$USE_GPU" = true ]; then
        echo -e "验证GPU是否在容器中可用..."
        if docker-compose exec app python -c "import torch; print('GPU可用:', torch.cuda.is_available()); print('GPU数量:', torch.cuda.device_count() if torch.cuda.is_available() else 0)" | grep "GPU可用: True" > /dev/null; then
            echo -e "${GREEN}GPU配置成功!${NC}"
        else
            echo -e "${YELLOW}无法验证GPU状态，请稍后手动检查${NC}"
        fi
    fi
else
    echo -e "${RED}一些容器未能正常启动，请检查错误${NC}"
    docker-compose ps
    docker-compose logs app
fi

# 部署完成
echo ""
echo -e "${GREEN}################################################################################${NC}"
echo -e "${GREEN}#                          部署完成!                                           #${NC}"
echo -e "${GREEN}################################################################################${NC}"
echo ""
echo -e "应用访问地址: ${BLUE}http://localhost${NC}"
echo ""
echo -e "常用命令:"
echo -e "  - 查看所有容器状态:  ${BLUE}docker-compose ps${NC}"
echo -e "  - 查看应用日志:      ${BLUE}docker-compose logs -f app${NC}"
echo -e "  - 停止所有服务:      ${BLUE}docker-compose down${NC}"
echo -e "  - 重启应用:          ${BLUE}docker-compose restart app${NC}"
echo -e "  - 重建并启动:        ${BLUE}docker-compose up -d --build${NC}"
echo ""
echo -e "${YELLOW}注意: 如果您刚安装了Docker，可能需要重新登录以应用组权限${NC}" 