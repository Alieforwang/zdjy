# Docker一键部署指南

本项目支持Docker一键部署，自动适配Linux/Windows环境，无需复杂配置。

## 快速部署

### Linux环境

```bash
# 步骤1：初始化环境（仅首次运行需要）
cd docker
chmod +x setup.sh
./setup.sh

# 步骤2：启动所有服务
docker compose up -d
```

### Windows环境

```bash
# 进入docker目录
cd docker

# 运行启动脚本
start.bat
```

Windows脚本会自动完成以下操作：
1. 创建必要的目录结构
2. 生成Nginx配置文件
3. 检查模型文件是否存在
4. 创建环境变量配置
5. 启动Docker服务

## 自动化功能

- **环境自适应**: 根据操作系统自动选择合适的部署方式
- **国内镜像源**: 使用清华源加速下载依赖
- **Nginx反向代理**: 自动配置反向代理，支持WebSocket
- **一键启动**: 一条命令启动所有服务

## 目录结构

```
docker/
├── Dockerfile          # CPU版本构建文件
├── Dockerfile.gpu      # GPU版本构建文件
├── docker-compose.yml  # Docker Compose配置文件
├── setup.sh            # Linux环境初始化脚本
├── start.bat           # Windows环境启动脚本
├── .env                # 环境变量配置文件
└── scripts/
    ├── entrypoint.sh   # 容器启动脚本
    └── install_torch.sh # PyTorch安装脚本
```

## 常用命令

```bash
# 查看所有容器状态
docker compose ps

# 查看应用日志
docker compose logs -f app

# 停止所有服务
docker compose down

# 重启应用
docker compose restart app
```

## GPU支持

系统会自动检测环境是否有GPU，并选择合适的PyTorch版本：

| CUDA版本 | PyTorch版本 |
|---------|------------|
| CUDA 11.8 | PyTorch 2.0.1+cu118 |
| CUDA 12.1 | PyTorch 2.1.0+cu121 |
| 无CUDA    | PyTorch 2.1.0 CPU版本 |

## 配置选项

所有配置选项都在`.env`文件中，可以根据需要修改：

- `PIP_INDEX_URL`: pip镜像源地址
- `APT_MIRROR`: apt镜像源地址
- `DB_PASSWORD`: 数据库密码
- `HTTP_PORT`: HTTP端口（默认80）

## 数据持久化

所有数据都存储在Docker卷中，确保数据安全：

- MySQL数据: `mysql-data`
- 应用数据: `app-data`

## 注意事项

1. 确保`models/best.pt`模型文件存在，否则应用将无法正常工作
2. 如需配置HTTPS，请将证书放置在`nginx/ssl`目录下，并修改Nginx配置
3. Windows环境下需要安装Docker Desktop并启用WSL2支持