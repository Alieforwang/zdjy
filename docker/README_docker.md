# docker目录说明

- Dockerfile：项目Docker镜像构建文件，生产环境推荐用gunicorn+gevent。
- gunicorn_config.py：Gunicorn生产环境配置，适合2核CPU。
- .dockerignore：构建镜像时忽略无关文件。
- docker-compose.yml：一键编排应用和MySQL数据库。

## 构建镜像

在项目根目录执行：

```bash
docker build -f docker/Dockerfile -t your_app_name .
```

## 运行容器（MySQL配置）

可通过环境变量注入MySQL连接信息：

- MYSQL_HOST
- MYSQL_USER
- MYSQL_PASSWORD
- MYSQL_DATABASE
- MYSQL_PORT

### 示例：docker run

```bash
docker run -d -p 8888:8888 \
  -e MYSQL_HOST=your_mysql_host \
  -e MYSQL_USER=your_user \
  -e MYSQL_PASSWORD=your_password \
  -e MYSQL_DATABASE=your_db \
  --name your_app_name your_app_name
```

### 示例：docker-compose.yml

已内置于docker目录，内容如下：

```yaml
services:
  app:
    build:
      context: ..
      dockerfile: docker/Dockerfile
    ports:
      - "8888:8888"
    environment:
      MYSQL_HOST: mysql
      MYSQL_USER: root
      MYSQL_PASSWORD: 123456
      MYSQL_DATABASE: tiaozhanbei
    depends_on:
      - mysql
    # 如需GPU支持，取消下方注释
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - driver: nvidia
    #           count: all
    #           capabilities: [gpu]
    # environment:
    #   NVIDIA_VISIBLE_DEVICES: all
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: 123456
      MYSQL_DATABASE: tiaozhanbei
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ../sql:/docker-entrypoint-initdb.d
volumes:
  mysql_data:
```

### 自动导入数据库数据

- `../sql` 目录下的所有 `.sql` 文件会在MySQL容器**首次启动且数据卷为空时**自动导入。
- 如果MySQL已有数据（数据卷不为空），不会重复导入。如需重新导入：

```bash
docker-compose down
# 危险：会清空所有MySQL数据
# 删除数据卷（卷名以实际为准，一般为"项目目录名_mysql_data"）
docker volume rm zdjy_mysql_data
# 重新启动
docker-compose up -d
```

### 启动服务

#### 1. 使用docker-compose启动（推荐）

```bash
cd docker
# 启动服务（端口映射8888:8888）
docker-compose up -d
```

#### 2. 使用物理机NVIDIA显卡（GPU）加速

- 需已安装NVIDIA驱动和nvidia-docker（nvidia-container-toolkit）。
- 在docker-compose.yml的app服务下添加如下内容（compose v2+）：

```yaml
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
    environment:
      NVIDIA_VISIBLE_DEVICES: all
```

- 启动命令同上。

#### 3. 单独用docker run启动并用GPU

```bash
docker run -d \
  --gpus all \
  -p 8888:8888 \
  -e MYSQL_HOST=你的mysql主机 \
  -e MYSQL_USER=你的用户名 \
  -e MYSQL_PASSWORD=你的密码 \
  -e MYSQL_DATABASE=你的数据库 \
  --name your_app_name \
  your_app_name
```

#### 4. 检查容器内GPU可用性

```bash
docker exec -it your_app_name bash
python -c "import torch; print(torch.cuda.is_available())"
# 或
python -c "import tensorflow as tf; print(tf.config.list_physical_devices('GPU'))"
```

### 常用命令

- 启动服务：
  ```bash
  docker-compose up -d
  ```
- 停止服务：
  ```bash
  docker-compose down
  ```
- 查看日志：
  ```bash
  docker-compose logs -f
  ```

访问：http://localhost:8888 