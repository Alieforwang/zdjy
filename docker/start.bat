@echo off
echo 灵瞳YOLOv8-DeepSeek多模态街景治理实时检测平台 - Windows启动脚本
echo.

REM 创建必要的目录结构
echo 创建必要的目录结构...
mkdir nginx\conf.d nginx\ssl nginx\logs nginx\html 2>nul
mkdir ..\models 2>nul
mkdir ..\scripts\init 2>nul

REM 生成Nginx配置
echo 创建Nginx配置...
(
echo server {
echo     listen 80;
echo     server_name localhost;
echo.
echo     location / {
echo         proxy_pass http://app:8888;
echo         proxy_set_header Host $host;
echo         proxy_set_header X-Real-IP $remote_addr;
echo         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
echo         proxy_set_header X-Forwarded-Proto $scheme;
echo.
echo         # WebSocket支持
echo         proxy_http_version 1.1;
echo         proxy_set_header Upgrade $http_upgrade;
echo         proxy_set_header Connection "upgrade";
echo     }
echo.
echo     # 静态文件缓存
echo     location /static/ {
echo         proxy_pass http://app:8888/static/;
echo         proxy_set_header Host $host;
echo         proxy_cache_valid 200 302 30m;
echo         proxy_cache_valid 404 5m;
echo         expires 1h;
echo     }
echo }
) > nginx\conf.d\default.conf

REM 检查模型文件
echo 检查模型文件...
if not exist "..\models\best.pt" (
    echo 警告: 未找到YOLOv8模型文件 (models/best.pt)
    echo 您需要手动将模型文件放置到models目录中
    echo 或者运行以下命令下载演示模型: curl -L https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt -o ../models/best.pt
)

REM 创建.env文件
echo 创建环境变量配置...
(
echo # Docker配置
echo COMPOSE_PROJECT_NAME=zdjy
echo.
echo # GPU配置
echo GPU_MODE=Dockerfile
echo NVIDIA_DRIVER=none
echo NVIDIA_COUNT=0
echo NVIDIA_CAPABILITIES=
echo NVIDIA_VISIBLE_DEVICES=none
echo.
echo # 镜像源配置
echo PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple
echo APT_MIRROR=mirrors.tuna.tsinghua.edu.cn
echo.
echo # 数据库配置
echo DB_HOST=mysql
echo DB_USER=root
echo DB_PASSWORD=123456
echo DB_NAME=tiaozhanbei
echo MYSQL_ROOT_PASSWORD=123456
echo MYSQL_DATABASE=tiaozhanbei
echo MYSQL_USER=zdjy
echo MYSQL_PASSWORD=zdjy123
echo.
echo # 服务端口配置
echo HTTP_PORT=80
echo HTTPS_PORT=443
echo APP_PORT=8888
echo MYSQL_PORT=3306
) > .env

REM 启动服务
echo 启动服务...
docker compose up -d

echo.
echo 部署完成!
echo.
echo 应用访问地址: http://localhost
echo.
echo 常用命令:
echo   - 查看所有容器状态:  docker compose ps
echo   - 查看应用日志:      docker compose logs -f app
echo   - 停止所有服务:      docker compose down
echo   - 重启应用:          docker compose restart app
echo.
pause 