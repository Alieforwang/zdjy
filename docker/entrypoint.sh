#!/bin/bash
set -e

# 创建必要的目录
mkdir -p /app/static/uploads /app/static/@results /app/static/temp /app/logs /app/sessions

# 检查数据库连接
echo "等待MySQL服务启动..."
until mysql -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" >/dev/null 2>&1; do
  echo "MySQL未就绪 - 等待..."
  sleep 2
done
echo "MySQL已就绪"

# 加载模型文件
echo "检查模型文件..."
if [ ! -f "/app/models/best.pt" ]; then
  echo "警告: 未发现模型文件 models/best.pt"
fi

# 替换配置文件中的数据库配置
if [ -f "/app/config.py" ]; then
  echo "更新数据库配置..."
  sed -i "s/'host': '[^']*'/'host': '$DB_HOST'/g" /app/config.py
  sed -i "s/'user': '[^']*'/'user': '$DB_USER'/g" /app/config.py
  sed -i "s/'password': '[^']*'/'password': '$DB_PASSWORD'/g" /app/config.py
  sed -i "s/'database': '[^']*'/'database': '$DB_NAME'/g" /app/config.py
fi

# 启动应用
echo "启动应用..."
exec "$@" 