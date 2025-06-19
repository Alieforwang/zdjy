# Docker部署指南

本目录包含使用Docker快速部署项目的相关文件。

## 前置条件

- 安装Docker: [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)
- 安装Docker Compose: [https://docs.docker.com/compose/install/](https://docs.docker.com/compose/install/)
- 确保项目的`models`目录中有`best.pt`模型文件

## 目录结构

```
docker/
├── Dockerfile        # 用于构建Docker镜像
├── docker-compose.yml # 定义服务、网络和卷
├── entrypoint.sh     # 容器启动脚本
└── README.md         # 本说明文档
```

## 快速开始

1. 在项目根目录下运行以下命令启动服务：

```bash
cd docker
docker-compose up -d
```

2. 访问应用：

```
http://localhost:8888
```

3. 查看日志：

```bash
docker-compose logs -f app
```

4. 停止服务：

```bash
docker-compose down
```

## 数据持久化

所有重要数据都存储在Docker卷中，包括：

- MySQL数据：`mysql_data`
- 上传的文件：`app_uploads`
- 结果文件：`app_results`
- 会话数据：`app_sessions`
- 应用日志：`app_logs`

## 环境变量

可以通过修改`docker-compose.yml`文件中的`environment`部分来配置环境变量。

## 故障排除

1. 如果数据库连接失败，检查MySQL服务是否正常运行：

```bash
docker-compose ps mysql
```

2. 如果应用无法访问，检查应用日志：

```bash
docker-compose logs app
```

3. 如果需要重新构建镜像：

```bash
docker-compose build --no-cache
```

## 注意事项

- 首次运行时会自动导入SQL文件进行数据库初始化
- 模型文件需要手动放置在`models`目录下
- 应用运行在8888端口，可以在`docker-compose.yml`中修改端口映射 