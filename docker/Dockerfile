FROM python:3.8-slim

WORKDIR /app

COPY requirements.txt ./

# 安装OpenCV依赖的系统库
RUN apt-get update && apt-get install -y libgl1 && rm -rf /var/lib/apt/lists/*

# 先升级pip/setuptools/wheel，解决build_meta问题
RUN pip install --upgrade pip setuptools wheel -i https://pypi.tuna.tsinghua.edu.cn/simple
# 使用国内源安装依赖
RUN pip install --no-cache-dir -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

COPY . .

EXPOSE 8888

CMD ["gunicorn", "-c", "docker/gunicorn_config.py", "app:app"]