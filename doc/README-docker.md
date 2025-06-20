# Docker快速部署指南

本项目可使用Docker进行快速部署，无需手动配置环境。

## 项目Docker结构

```
项目根目录/
├── docker/                    # Docker配置目录
│   ├── Dockerfile            # 用于构建Docker镜像
│   ├── docker-compose.yml    # 定义服务、网络和卷
│   ├── entrypoint.sh         # 容器启动脚本
│   └── README.md             # Docker使用说明
├── docker.sh                 # Linux下的Docker快速操作脚本
└── docker.bat                # Windows下的Docker快速操作脚本
```

## 快速开始

### Windows用户

1. 安装Docker Desktop for Windows：[https://docs.docker.com/desktop/install/windows-install/](https://docs.docker.com/desktop/install/windows-install/)
2. 打开命令提示符或PowerShell，进入项目根目录
3. 执行以下命令启动服务：

```
docker.bat start
```

### Linux/MacOS用户

1. 安装Docker和Docker Compose
2. 进入项目根目录
3. 添加执行权限并启动服务：

```bash
chmod +x docker.sh
./docker.sh start
```

## 可用命令

- `start`: 启动所有服务
- `stop`: 停止所有服务
- `restart`: 重启所有服务
- `status`: 查看服务状态
- `logs`: 查看应用日志
- `build`: 重新构建镜像

## 访问应用

服务启动后，可通过浏览器访问：

```
http://localhost:8888
```

## 数据持久化

所有重要数据（数据库、上传文件、结果文件等）都存储在Docker卷中，确保容器重启或删除后数据不会丢失。

## 注意事项

1. 首次运行时请确保`models`目录中有`best.pt`模型文件
2. 默认使用MySQL 8.0作为数据库
3. 服务启动时会自动导入数据库初始化SQL文件

## 故障排除

如遇问题，请查看日志：

```
# Windows
docker.bat logs

# Linux/MacOS
./docker.sh logs
```

## 高级配置

如需调整配置，可编辑`docker/docker-compose.yml`文件中的环境变量和端口映射。 