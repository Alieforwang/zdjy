# 使用Python 3.9作为基础镜像
FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    MPLCONFIGDIR=/tmp/matplotlib_config \
    YOLO_CONFIG_DIR=/tmp/ultralytics_config

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    default-mysql-client \
    && rm -rf /var/lib/apt/lists/*

# 创建必要的目录
RUN mkdir -p /app/static/uploads /app/static/@results /app/static/temp /tmp/matplotlib_config /tmp/ultralytics_config /app/logs /app/sessions

# 复制项目文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制启动脚本并设置权限
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# 复制项目代码
COPY . .

# 设置权限
RUN chmod +x /app/monitor.sh /app/deploy.sh /app/install.sh /app/db_monitor.sh /app/crontab_setup.sh

# 暴露端口
EXPOSE 8888

# 设置启动脚本
ENTRYPOINT ["/entrypoint.sh"]

# 启动命令
CMD ["gunicorn", "-c", "gunicorn_config.py", "app:app"] 