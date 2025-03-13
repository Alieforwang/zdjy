#!/bin/bash
# 部署脚本 - 用于在2核2G内存服务器上部署应用

echo "=== 开始部署智能识别系统 ==="

# 创建虚拟环境（如果不存在）
if [ ! -d "venv" ]; then
    echo "创建Python虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
source venv/bin/activate

# 内存优化 - 清理缓存
echo "优化系统内存..."
sync
echo 3 > /proc/sys/vm/drop_caches

# 安装依赖
echo "安装必要的依赖..."
pip install --no-cache-dir -r requirements.txt

# 确保必要目录存在
echo "创建必要的目录..."
mkdir -p static/uploads
mkdir -p models
mkdir -p logs

# 检查并创建数据库
echo "初始化数据库..."
python -c "
import util.DBUtil as DBM
db = DBM.DatabaseManager()
db.connect()
db.create_tables()
result = db.query_data(\"SELECT COUNT(*) FROM user WHERE username = 'admin'\")
if result and result[0][0] == 0:
    db.update_data(\"INSERT INTO user (username, password, is_admin) VALUES (%s, %s, %s)\", (\"admin\", \"admin\", True))
    print('创建默认管理员用户成功')
db.disconnect()
"

# 检查Gunicorn是否已安装
if ! pip show gunicorn > /dev/null; then
    echo "安装Gunicorn..."
    pip install gunicorn gevent
fi

# 创建系统服务文件
echo "创建系统服务..."
cat > zdjy.service << EOL
[Unit]
Description=智能识别系统服务
After=network.target

[Service]
User=$(whoami)
WorkingDirectory=$(pwd)
ExecStart=$(which gunicorn) -c gunicorn_config.py app:app
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=zdjy
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
EOL

echo "服务文件已创建: $(pwd)/zdjy.service"
echo "要安装系统服务，请以root权限运行: sudo cp $(pwd)/zdjy.service /etc/systemd/system/ && sudo systemctl daemon-reload && sudo systemctl enable zdjy"

# 创建内存监控脚本
echo "创建内存监控脚本..."
cat > monitor_memory.sh << EOL
#!/bin/bash
# 内存监控脚本 - 当内存使用率超过阈值时自动重启服务

THRESHOLD=85
LOG_FILE="logs/memory_monitor.log"

while true; do
    # 获取内存使用率
    MEM_USAGE=\$(free | grep Mem | awk '{print \$3/\$2 * 100.0}' | cut -d. -f1)
    
    # 记录到日志
    echo "\$(date): 内存使用率: \${MEM_USAGE}%" >> \$LOG_FILE
    
    # 如果内存使用率超过阈值
    if [ \$MEM_USAGE -gt \$THRESHOLD ]; then
        echo "\$(date): 内存使用率超过阈值(\${THRESHOLD}%)，正在重启服务..." >> \$LOG_FILE
        
        # 清理系统缓存
        sync
        echo 3 > /proc/sys/vm/drop_caches
        
        # 重启服务
        sudo systemctl restart zdjy
        
        echo "\$(date): 服务已重启" >> \$LOG_FILE
        
        # 重启后等待一段时间再继续监控
        sleep 300
    fi
    
    # 每分钟检查一次
    sleep 60
done
EOL

chmod +x monitor_memory.sh
echo "内存监控脚本已创建: $(pwd)/monitor_memory.sh"

# 创建启动脚本
echo "创建启动脚本..."
cat > start.sh << EOL
#!/bin/bash
# 启动应用

# 激活虚拟环境
source venv/bin/activate

# 清理系统缓存
sync
echo 3 > /proc/sys/vm/drop_caches

# 启动应用
exec gunicorn -c gunicorn_config.py app:app
EOL

chmod +x start.sh
echo "启动脚本已创建: $(pwd)/start.sh"

# 创建优化的requirements.txt
echo "创建优化的依赖文件..."
cat > requirements.txt << EOL
flask==2.0.1
flask-cors==3.0.10
mysql-connector-python==8.0.27
Werkzeug==2.0.2
numpy==1.19.5
opencv-python-headless==4.5.3.56
ultralytics==0.7.0
gunicorn==20.1.0
gevent==21.12.0
EOL

echo "requirements.txt 已更新"

echo "=== 部署完成 ==="
echo "你可以通过以下方式启动应用:"
echo "1. 使用Gunicorn: ./start.sh"
echo "2. 作为系统服务: sudo systemctl start zdjy"
echo ""
echo "重要提示: 请确保数据库已正确配置，并且模型文件已放置在models目录中" 