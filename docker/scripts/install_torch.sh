#!/bin/bash
set -e

# 检测容器中是否有可用的GPU/CUDA
echo "正在检测CUDA环境..."

# 检测系统架构
ARCH=$(uname -m)
echo "系统架构: $ARCH"

# 设置pip镜像源
PIP_INDEX_URL=${PIP_INDEX_URL:-https://pypi.tuna.tsinghua.edu.cn/simple}
echo "使用pip镜像源: $PIP_INDEX_URL"

# 设置apt镜像源
if [ -n "$APT_MIRROR" ]; then
    echo "配置apt镜像源: $APT_MIRROR"
    # 备份原始sources.list
    cp /etc/apt/sources.list /etc/apt/sources.list.bak
    # 替换为指定的镜像源
    sed -i "s/deb.debian.org/${APT_MIRROR}/g" /etc/apt/sources.list
    sed -i "s/security.debian.org/${APT_MIRROR}/g" /etc/apt/sources.list
fi

# 尝试安装nvidia-smi来检查GPU
apt-get update > /dev/null 2>&1
if apt-get install -y --no-install-recommends nvidia-cuda-toolkit > /dev/null 2>&1; then
    HAS_NVIDIA=1
    echo "发现NVIDIA驱动，将安装GPU版本的PyTorch"
else
    HAS_NVIDIA=0
    echo "未发现NVIDIA驱动，将安装CPU版本的PyTorch"
    apt-get clean
fi

# 清理
rm -rf /var/lib/apt/lists/*

# 基于架构和CUDA版本安装PyTorch
install_pytorch_cpu() {
    echo "安装CPU版本PyTorch"
    if [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
        echo "检测到ARM架构，安装适用于ARM的PyTorch..."
        pip install torch==2.0.0 torchvision==0.15.1 -i $PIP_INDEX_URL
    else
        echo "安装x86_64架构的PyTorch CPU版本"
        pip install torch==2.0.0 torchvision==0.15.1 --index-url $PIP_INDEX_URL
    fi
}

install_pytorch_cuda() {
    local cuda_version="$1"
    local cuda_major="$2"
    local cuda_minor="$3"
    
    echo "检测到CUDA版本: ${cuda_version}"
    
    # 根据CUDA版本安装对应的PyTorch版本
    # 由于国内网络访问PyTorch官方index可能较慢，优先使用国内镜像源
    if [ "$cuda_major" -eq 12 ]; then
        # CUDA 12.x
        echo "安装PyTorch 2.3.0 for CUDA 12.1"
        pip install torch==2.3.0 torchvision==0.18.0 -i $PIP_INDEX_URL
    elif [ "$cuda_major" -eq 11 ] && [ "$cuda_minor" -ge 7 ]; then
        # CUDA 11.7+
        echo "安装PyTorch 2.3.0 for CUDA 11.8"
        pip install torch==2.3.0 torchvision==0.18.0 -i $PIP_INDEX_URL
    elif [ "$cuda_major" -eq 11 ] && [ "$cuda_minor" -ge 3 ]; then
        # CUDA 11.3-11.6
        echo "安装PyTorch 2.0.0 for CUDA 11.7"
        pip install torch==2.0.0 torchvision==0.15.1 -i $PIP_INDEX_URL
    elif [ "$cuda_major" -eq 11 ]; then
        # CUDA 11.0-11.2
        echo "安装PyTorch 1.13.1 for CUDA 11.7"
        pip install torch==1.13.1 torchvision==0.14.1 -i $PIP_INDEX_URL
    elif [ "$cuda_major" -eq 10 ]; then
        # CUDA 10.x
        echo "安装PyTorch 1.13.1 for CUDA 10.2"
        pip install torch==1.13.1 torchvision==0.14.1 -i $PIP_INDEX_URL
    else
        # 如果无法确定合适的CUDA版本，使用CUDA 11.3版本的PyTorch，较为通用
        echo "不支持的CUDA版本: ${cuda_version}，将安装PyTorch for CUDA 11.3"
        pip install torch==1.12.1 torchvision==0.13.1 -i $PIP_INDEX_URL
    fi
}

# 检测CUDA是否可用
if [ "$HAS_NVIDIA" -eq 1 ] && nvidia-smi > /dev/null 2>&1; then
    # 尝试获取CUDA版本
    CUDA_VERSION=$(nvidia-smi | grep "CUDA Version" | awk '{print $9}')
    
    if [ -n "$CUDA_VERSION" ]; then
        # 提取主版本号和次版本号
        CUDA_MAJOR_VERSION=$(echo $CUDA_VERSION | cut -d. -f1)
        CUDA_MINOR_VERSION=$(echo $CUDA_VERSION | cut -d. -f2)
        
        # 调用安装函数
        install_pytorch_cuda "$CUDA_VERSION" "$CUDA_MAJOR_VERSION" "$CUDA_MINOR_VERSION"
    else
        echo "无法检测CUDA版本，将使用默认CUDA 11.7版本"
        install_pytorch_cuda "11.7" "11" "7"
    fi
else
    # 无GPU或CUDA不可用，安装CPU版本
    install_pytorch_cpu
fi

# 验证PyTorch安装
echo "验证PyTorch安装..."
python -c "import torch; print('PyTorch版本:', torch.__version__); print('CUDA可用:', torch.cuda.is_available()); print('CUDA版本:', torch.version.cuda if torch.cuda.is_available() else '不可用'); print('设备数量:', torch.cuda.device_count() if torch.cuda.is_available() else 0)"

echo "安装TorchVision、TorchAudio等依赖"
pip install 'ultralytics>=8.0.0' --no-cache-dir -i $PIP_INDEX_URL
pip install 'numpy<2.0.0' --no-cache-dir -i $PIP_INDEX_URL

echo "PyTorch安装完成" 