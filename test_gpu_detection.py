#!/usr/bin/env python
# -*- coding: utf-8 -*-

import sys
import torch
from yolov8 import YOLOv8
import logging

# 设置日志
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("GPU-Test")

def test_device_detection():
    print("\n========== YOLOv8 GPU检测测试 ==========")
    
    # 检查Torch是否可以识别GPU
    cuda_available = torch.cuda.is_available()
    print(f"✓ CUDA可用性检查: {'可用✓' if cuda_available else '不可用✗'}")
    
    if cuda_available:
        print(f"✓ 可用GPU数量: {torch.cuda.device_count()}")
        for i in range(torch.cuda.device_count()):
            print(f"  GPU #{i}: {torch.cuda.get_device_name(i)}")
    
    # 测试YOLOv8类的设备选择逻辑
    print("\n测试YOLOv8类的设备自动选择功能:")
    try:
        # 有意请求GPU，让类内部判断是否可用
        model = YOLOv8(weights='models/best.pt', device='cuda', load_params={'weights_only': True})
        print(f"✓ 模型成功加载 - 会自动选择{'GPU' if cuda_available else 'CPU'}")
    except Exception as e:
        print(f"✗ 模型加载失败: {str(e)}")
    
    print("\n========================================")
    return cuda_available

if __name__ == "__main__":
    test_device_detection() 