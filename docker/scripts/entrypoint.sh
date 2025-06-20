#!/bin/bash
set -e

# 输出系统信息
echo "========================================"
echo "GPU检测报告"
echo "========================================"

# 检查CUDA可用性
if command -v nvidia-smi &> /dev/null; then
    echo "NVIDIA GPU可用:"
    nvidia-smi
    
    # 检查PyTorch CUDA可用性
    if python -c "import torch; exit(0) if torch.cuda.is_available() else exit(1)" &> /dev/null; then
        echo "PyTorch已启用CUDA支持"
        echo "CUDA设备数量: $(python -c "import torch; print(torch.cuda.device_count())")"
        echo "当前CUDA设备: $(python -c "import torch; print(torch.cuda.get_device_name(0) if torch.cuda.device_count() > 0 else 'None')")"
    else
        echo "警告: PyTorch未启用CUDA支持，尽管系统检测到NVIDIA GPU"
    fi
else
    echo "未检测到NVIDIA GPU，使用CPU模式"
    echo "PyTorch版本: $(python -c "import torch; print(torch.__version__)")"
fi

echo "========================================"

# 等待MySQL服务准备就绪
if [ -n "$DB_HOST" ]; then
    echo "等待MySQL服务准备就绪..."
    MAX_TRIES=30
    TRIES=0
    until mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" &> /dev/null || [ $TRIES -eq $MAX_TRIES ]; do
        echo "等待MySQL连接... ($TRIES/$MAX_TRIES)"
        sleep 3
        TRIES=$((TRIES+1))
    done
    
    if [ $TRIES -eq $MAX_TRIES ]; then
        echo "无法连接到MySQL，退出"
        exit 1
    fi
    
    echo "MySQL服务已准备就绪"
fi

# 检查必要的目录
for dir in "/app/static/uploads" "/app/static/@results" "/app/static/temp" "/app/logs" "/app/sessions"; do
    if [ ! -d "$dir" ]; then
        echo "创建目录: $dir"
        mkdir -p "$dir"
    fi
done

# 检查models目录是否存在最新模型文件
if [ ! -d "/app/models" ] || [ ! -f "/app/models/best.pt" ]; then
    echo "警告: 在'/app/models'中未找到YOLOv8模型文件。请确保挂载了包含'best.pt'文件的models卷。"
fi

# 执行其他初始化脚本（如果存在）
for init_script in /app/scripts/init/*.sh; do
    if [ -f "$init_script" ]; then
        echo "执行初始化脚本: $init_script"
        bash "$init_script"
    fi
done

# 确认环境变量已设置
echo "确认环境设置完成"

# 执行传递给entrypoint的命令
exec "$@" 