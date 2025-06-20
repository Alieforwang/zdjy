#!/bin/bash
set -e

# 为所有脚本文件设置执行权限
echo "设置Docker相关脚本的执行权限..."

# 设置权限
chmod +x run.sh
chmod +x scripts/entrypoint.sh
chmod +x scripts/install_torch.sh

echo "权限设置完成"
echo "现在可以运行 ./run.sh 启动应用" 