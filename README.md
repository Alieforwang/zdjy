# 智能摊位检测系统

## 项目简介
本系统是一个基于深度学习的智能摊位检测系统，能够自动识别和分析流动摊位和固定摊位。系统采用YOLOv8目标检测模型，提供实时检测、历史记录查询、数据分析等功能。

## 主要功能
- 📷 实时图像/视频检测
- 📊 数据统计与分析
- 📝 历史记录管理
- 🗺️ 地理位置展示
- 👥 用户权限管理
- 📈 可视化数据展示

## 系统要求
- Python 3.8+
- MySQL 5.7+
- CUDA支持（推荐用于GPU加速）


## 安装步骤

1. 克隆项目到本地
```bash
git clone [项目地址]
cd [项目目录]
```

2. 创建并激活虚拟环境（推荐）
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

3. 安装依赖包
```bash
pip install -r requirements.txt
```

4. 配置数据库
- 创建MySQL数据库
- 修改配置文件中的数据库连接信息

5. 初始化系统
```bash
python app.py
```

## 目录结构
```
├── app.py              # 主应用程序
├── config.py           # 配置文件
├── requirements.txt    # 依赖包列表
├── static/            # 静态文件目录
│   ├── css/          # CSS样式文件
│   ├── js/           # JavaScript文件
│   ├── images/       # 图片资源
│   └── uploads/      # 上传文件目录
├── templates/         # HTML模板文件
├── models/           # 模型文件目录
└── util/             # 工具函数目录
```

## 使用说明

### 系统登录
- 默认管理员账号：admin
- 默认密码：admin

### 主要功能模块
1. **实时检测**
   - 支持图片上传检测
   - 支持视频文件检测
   - 支持实时视频流检测

2. **数据分析**
   - 检测趋势分析
   - 类型分布统计
   - 置信度分析

3. **历史记录**
   - 检测结果查询
   - 结果图片/视频查看
   - 数据导出功能

4. **系统管理**
   - 用户管理
   - 权限配置
   - 系统设置

## 技术栈
- 后端：Flask
- 前端：HTML5 + CSS3 + JavaScript
- 数据库：MySQL
- 深度学习：YOLOv8
- 图像处理：OpenCV

## 注意事项
1. 首次运行时请确保已正确配置数据库连接信息
2. 确保系统有足够的存储空间用于保存上传的图片和视频文件
3. 建议使用支持GPU的环境以获得更好的检测性能
4. 定期清理uploads目录下的临时文件

## 常见问题
1. 如遇到数据库连接错误，请检查数据库配置信息
2. 如遇到模型加载错误，请确认models目录下是否存在模型文件
3. 上传文件失败时，请检查目录权限和存储空间

## 更新日志
### v1.0.0
- 初始版本发布
- 支持基础的摊位检测功能
- 实现用户管理系统
- 添加数据分析功能

## 联系方式
如有任何问题或建议，请联系系统管理员。

# 智能识别系统 - 低内存环境部署指南

本文档提供了在2核心2G内存服务器上优化部署智能识别系统的详细步骤。

## 系统要求

- CPU: 2核心
- 内存: 2GB
- 操作系统: Linux (推荐Ubuntu 18.04或更高版本)
- Python 3.7+
- MySQL 5.7+

## 快速部署

1. 克隆代码仓库到服务器上
```bash
git clone <代码仓库URL>
cd zdjy
```

2. 执行部署脚本
```bash
chmod +x deploy.sh
./deploy.sh
```

3. 安装为系统服务（推荐）
```bash
sudo cp zdjy.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable zdjy
sudo systemctl start zdjy
```

4. 启动内存监控（可选，但建议开启）
```bash
nohup ./monitor_memory.sh > /dev/null 2>&1 &
```

## 性能优化设置

### 内存优化

系统已经进行了以下内存优化：

1. **模型加载优化**
   - 使用全局单例模型实例，避免重复加载
   - 根据需要加载模型，按需延迟初始化

2. **数据库连接池**
   - 使用连接池管理数据库连接
   - 设置适当的连接池大小（默认3个连接）
   - 连接自动重用和超时处理

3. **图像处理优化**
   - 大图像自动缩放处理
   - 视频处理时自动选择性跳帧
   - 定期执行垃圾回收释放内存

4. **服务器配置优化**
   - 使用Gunicorn多工作进程
   - 工作进程定期自动重启，避免内存泄漏
   - gevent高并发支持

### 自动化运维

1. **内存监控**
   - `monitor_memory.sh`脚本自动监控内存使用率
   - 当内存使用率超过85%时自动重启服务

2. **日志管理**
   - 系统日志和访问日志分离存储
   - 日志级别设为warning减少I/O和磁盘占用

## 手动启动与停止

如果不使用系统服务，可以手动管理应用：

```bash
# 启动应用
./start.sh

# 停止应用（如果使用Gunicorn）
kill -TERM $(cat gunicorn.pid)
```

## 更新和维护

1. **更新代码**
```bash
git pull
```

2. **重启服务**
```bash
sudo systemctl restart zdjy
```

3. **查看日志**
```bash
# 应用日志
tail -f error.log

# 内存监控日志
tail -f logs/memory_monitor.log
```

## 目录结构

```
zdjy/
├── app.py              # 主应用文件
├── util/               # 工具模块
│   └── DBUtil.py       # 数据库工具类
├── yolov8.py           # 模型预测工具
├── static/             # 静态文件目录
│   └── uploads/        # 上传文件目录
├── models/             # 模型文件目录
├── templates/          # 前端模板目录
├── gunicorn_config.py  # Gunicorn配置文件
├── zdjy.service        # 系统服务文件
├── start.sh            # 启动脚本
├── monitor_memory.sh   # 内存监控脚本
└── deploy.sh           # 部署脚本
```

## 故障排除

### 应用无法启动
- 检查日志文件 `error.log` 查看详细错误信息
- 确保模型文件已放置在 `models` 目录中
- 检查数据库连接配置是否正确

### 内存使用率过高
- 通过 `free -m` 命令查看内存使用情况
- 检查 `logs/memory_monitor.log` 日志
- 如内存持续高占用，考虑减少Gunicorn工作进程数量

### 图像处理性能问题
- 检查上传的图像是否过大，系统会自动调整图像大小
- 长视频处理会采用跳帧策略，不会处理每一帧

## 注意事项

1. **安全建议**
   - 请修改默认管理员密码
   - 建议启用HTTPS
   - 限制上传文件大小

2. **优化建议**
   - 定期清理 `static/uploads` 目录下的临时文件
   - 定期备份数据库
   - 如系统长期运行出现内存问题，可设置每天凌晨自动重启服务

3. **模型优化**
   - 考虑使用更轻量级的模型版本
   - 为不同硬件环境准备不同规模的模型 