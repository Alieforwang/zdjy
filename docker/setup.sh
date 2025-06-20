#!/bin/bash
set -e

# 定义颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}灵瞳YOLOv8-DeepSeek多模态街景治理实时检测平台 - 环境初始化${NC}"
echo ""

# 创建必要的目录结构
echo -e "${BLUE}创建必要的目录结构...${NC}"
mkdir -p nginx/conf.d nginx/ssl nginx/logs nginx/html
mkdir -p ../models
mkdir -p ../scripts/init

# 生成Nginx配置
echo -e "${BLUE}创建Nginx配置...${NC}"
cat > nginx/conf.d/default.conf << EOF
server {
    listen 80;
    server_name localhost;
    
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
EOF

# 检查模型文件
echo -e "${BLUE}检查模型文件...${NC}"
if [ ! -f "../models/best.pt" ]; then
    echo -e "${YELLOW}警告: 未找到YOLOv8模型文件 (models/best.pt)${NC}"
    echo "您需要手动将模型文件放置到models目录中"
    echo -e "或者运行以下命令下载演示模型: ${BLUE}curl -L https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt -o ../models/best.pt${NC}"
fi

# 自动检测GPU环境
echo -e "${BLUE}检测GPU环境...${NC}"
docker compose --profile init up detect-gpu

# 如果生成了GPU环境配置文件，则合并到.env
if [ -f ".env.gpu" ]; then
    echo -e "${BLUE}应用GPU环境配置...${NC}"
    cat .env.gpu >> .env
    rm .env.gpu
fi

echo -e "${GREEN}环境初始化完成!${NC}"
echo ""
echo -e "现在可以使用 ${BLUE}docker compose up -d${NC} 命令启动项目" 