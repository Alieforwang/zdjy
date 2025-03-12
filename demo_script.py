import cv2
import numpy as np
from ultralytics import YOLO
import time
from flask import Flask, render_template, Response
import threading
import os

class SmartMonitorSystem:
    def __init__(self):
        self.model = YOLO('models3/best.pt')  # 加载预训练模型
        self.camera = None
        self.processing = False
        self.detection_results = []
        self.fps = 0
        self.frame_count = 0
        self.start_time = time.time()

    def initialize_camera(self, source=0):
        """初始化摄像头"""
        print("正在初始化摄像头...")
        self.camera = cv2.VideoCapture(source)
        if not self.camera.isOpened():
            raise Exception("无法打开摄像头或视频源")
        print("摄像头初始化成功！")

    def start_detection(self):
        """开始实时检测"""
        print("开始实时目标检测...")
        self.processing = True
        while self.processing:
            ret, frame = self.camera.read()
            if not ret:
                break

            # 执行目标检测
            results = self.model.predict(source=frame, conf=0.25)[0]
            
            # 在图像上绘制检测结果
            annotated_frame = results.plot()
            
            # 计算FPS
            self.frame_count += 1
            elapsed_time = time.time() - self.start_time
            if elapsed_time > 1:
                self.fps = self.frame_count / elapsed_time
                self.frame_count = 0
                self.start_time = time.time()

            # 添加FPS显示
            cv2.putText(annotated_frame, f"FPS: {self.fps:.2f}", 
                       (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

            # 保存检测结果
            detected_objects = []
            for box in results.boxes:
                cls = int(box.cls[0])
                conf = float(box.conf[0])
                detected_objects.append({
                    'class': cls,
                    'confidence': conf,
                    'box': box.xyxy[0].tolist()
                })
            
            self.detection_results.append({
                'timestamp': time.time(),
                'objects': detected_objects
            })

            # 显示结果
            cv2.imshow('Smart Monitor System Demo', annotated_frame)
            
            # 按'q'退出
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    def stop_detection(self):
        """停止检测"""
        self.processing = False
        if self.camera is not None:
            self.camera.release()
        cv2.destroyAllWindows()
        print("检测已停止")

    def generate_report(self):
        """生成检测报告"""
        print("\n=== 检测报告 ===")
        total_detections = len(self.detection_results)
        print(f"总检测帧数: {total_detections}")
        
        if total_detections > 0:
            total_objects = sum(len(result['objects']) for result in self.detection_results)
            avg_objects = total_objects / total_detections
            print(f"平均每帧检测到的目标数: {avg_objects:.2f}")
            print(f"平均FPS: {self.fps:.2f}")

def main():
    """主函数 - 系统演示"""
    try:
        # 初始化系统
        print("=== 智能监控系统演示 ===")
        system = SmartMonitorSystem()
        
        # 选择输入源
        source = input("请选择输入源 (0:摄像头, 或输入视频文件路径): ")
        source = 0 if source == '0' else source
        
        # 初始化摄像头
        system.initialize_camera(source)
        
        # 开始检测
        print("\n按 'q' 键停止检测")
        system.start_detection()
        
        # 生成报告
        system.generate_report()
        
    except Exception as e:
        print(f"错误: {str(e)}")
    finally:
        # 清理资源
        system.stop_detection()

if __name__ == "__main__":
    main() 