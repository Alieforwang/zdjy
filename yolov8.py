from ultralytics import YOLO
import cv2
import numpy as np
import os

def Predict():
    # 直接使用预训练模型创建模型.
    model = YOLO('yolov8n.pt')
    model.train(**{'cfg': 'ultralytics/cfg/exp1.yaml', 'data': 'dataset/data.yaml'})

    # 使用yaml配置文件来创建模型,并导入预训练权重.
    model = YOLO('ultralytics/cfg/models3/v8/yolov8n-CoordConv.yaml')
    model.train(cfg="ultralytics/cfg/default.yaml",data="ultralytics/datasets/traffic.yaml",
                epochs=200,batch=2,workers=2)

    # 模型验证
    model = YOLO('runs/detect/yolov8n_exp/weights/best.pt')
    model.val(**{'data': 'dataset/data.yaml'})
    #
    # 模型推理
    model = YOLO('runs/detect/zdjy_model_optimized_nano3/weights/best.pt')
    model.predict(source='1.jpg', **{'save': True})

def predict_image(model_path, file_path):
    """
    使用指定的模型对图片或视频进行推理并保存结果
    """
    try:
        # 加载模型
        model = YOLO(model_path)
        
        # 验证源文件是否存在
        if not os.path.exists(file_path):
            raise Exception(f"源文件不存在: {file_path}")
        
        # 检查文件类型
        is_video = file_path.lower().endswith(('.mp4', '.avi', '.mov'))
        
        # 确保输出目录存在
        os.makedirs('static', exist_ok=True)
        
        if is_video:
            # 处理视频
            cap = cv2.VideoCapture(file_path)
            if not cap.isOpened():
                raise Exception("无法打开视频文件")
            
            # 获取视频信息
            fps = int(cap.get(cv2.CAP_PROP_FPS))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            print(f"视频信息: {width}x{height} @ {fps}fps, 总帧数: {total_frames}")
            
            # 创建输出视频
            output_path = 'static/results.mp4'
            if os.path.exists(output_path):
                os.remove(output_path)
            
            # 使用 H264 编码器
            fourcc = cv2.VideoWriter_fourcc(*'H264')
            if os.name == 'nt':  # Windows
                fourcc = cv2.VideoWriter_fourcc(*'avc1')
            
            out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
            
            if not out.isOpened():
                # 如果 H264/avc1 不可用，尝试使用 XVID
                output_path = 'static/results.avi'
                fourcc = cv2.VideoWriter_fourcc(*'XVID')
                out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
                
                if not out.isOpened():
                    raise Exception("无法创建输出视频文件")
            
            try:
                print(f"开始处理视频: {file_path}")
                frame_count = 0
                processed_frames = 0
                
                # 计算处理间隔
                if total_frames > 1000:
                    process_interval = total_frames // 1000
                else:
                    process_interval = 1
                
                while cap.isOpened():
                    ret, frame = cap.read()
                    if not ret:
                        break
                    
                    # 只处理特定间隔的帧
                    if frame_count % process_interval == 0:
                        print(f"处理第 {frame_count + 1}/{total_frames} 帧 ({(frame_count + 1) / total_frames * 100:.1f}%)")
                        
                        # 对当前帧进行预测
                        results = model.predict(
                            source=frame,
                            save=False,
                            conf=0.25
                        )[0]
                        
                        # 在帧上绘制检测结果
                        annotated_frame = results.plot()
                        
                        # 确保帧是BGR格式，并保持原始颜色
                        if len(annotated_frame.shape) == 2:
                            annotated_frame = cv2.cvtColor(annotated_frame, cv2.COLOR_GRAY2BGR)
                        elif annotated_frame.shape[2] == 4:
                            # 保持透明度
                            annotated_frame = cv2.cvtColor(annotated_frame, cv2.COLOR_RGBA2BGR)
                        
                        # 写入处理后的帧
                        out.write(annotated_frame)
                        processed_frames += 1
                    
                    frame_count += 1
                    
                print(f"视频处理完成，共处理 {processed_frames} 帧")
                
            finally:
                # 释放资源
                cap.release()
                out.release()
                print(f"资源已释放")
            
            # 验证输出文件
            if not os.path.exists(output_path):
                raise Exception(f"视频文件未生成: {output_path}")
            if os.path.getsize(output_path) == 0:
                raise Exception(f"生成的视频文件大小为0: {output_path}")
            
            print(f"视频文件已成功生成: {output_path}")
            
        else:
            # 处理图片
            output_path = 'static/results.jpg'
            
            # 确保图片文件可以被正常读取
            try:
                img = cv2.imread(file_path)
                if img is None:
                    raise Exception(f"无法读取图片文件: {file_path}")
            except Exception as e:
                raise Exception(f"图片读取失败: {str(e)}")
                
            results = model.predict(
                source=file_path,
                save=False,
                conf=0.25
            )[0]
            
            # 使用YOLO的绘制函数
            annotated_image = results.plot()
            
            # 保存处理后的图片
            cv2.imwrite(output_path, annotated_image)
            
            # 验证输出文件
            if not os.path.exists(output_path):
                raise Exception("图片文件未生成")
            if os.path.getsize(output_path) == 0:
                raise Exception("生成的图片文件大小为0")
            
            print(f"图片文件已成功生成: {output_path}")
        
        return results, is_video
        
    except Exception as e:
        print(f"预测过程出错: {str(e)}")
        raise e

# 使用示例
if __name__ == "__main__":
    weights_path = "weights/best.pt"  # 替换为实际的模型路径
    image_path = "tiaozhanbei/ceshitu/7.jpg"    # 替换为实际的图片路径
    predict_image(weights_path, image_path)

