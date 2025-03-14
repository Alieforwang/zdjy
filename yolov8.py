from ultralytics import YOLO
import cv2
import numpy as np
import os
import gc
import time
import concurrent.futures
import threading
import queue
import logging
import traceback
import torch

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

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

def predict_image(model, file_path):
    """
    使用给定的模型实例对图片或视频进行推理并保存结果
    
    参数:
    - model: 已加载的YOLO模型实例
    - file_path: 要处理的图片或视频文件路径
    
    返回:
    - 预测结果和文件类型标识(是否为视频)
    """
    try:
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
            
            # 处理分辨率过高的情况
            max_dimension = 1280
            if width > max_dimension or height > max_dimension:
                # 等比例缩放
                scale = min(max_dimension / width, max_dimension / height)
                width = int(width * scale)
                height = int(height * scale)
                print(f"视频分辨率过高，已调整为: {width}x{height}")
            
            print(f"视频信息: {width}x{height} @ {fps}fps, 总帧数: {total_frames}")
            
            # 创建输出视频
            output_path = 'static/results.mp4'
            if os.path.exists(output_path):
                os.remove(output_path)
            
            # 尝试不同的编码器
            fourcc_options = [
                ('avc1', '.mp4'),  # H.264 for MP4
                ('XVID', '.avi'),  # XVID for AVI
                ('MJPG', '.avi')   # Motion JPEG for AVI
            ]
            
            out = None
            for codec, ext in fourcc_options:
                try:
                    temp_path = f'static/results{ext}'
                    fourcc = cv2.VideoWriter_fourcc(*codec)
                    out = cv2.VideoWriter(temp_path, fourcc, fps, (width, height))
                    if out.isOpened():
                        output_path = temp_path
                        break
                except Exception as e:
                    print(f"尝试编码器 {codec} 失败: {e}")
                    if out:
                        out.release()
            
            if not out or not out.isOpened():
                raise Exception("无法创建输出视频文件，所有编码器均失败")
            
            try:
                print(f"开始处理视频: {file_path}")
                
                # 计算处理间隔 - 视频过长时跳帧处理
                if total_frames > 500:  # 对于长视频，增加采样间隔
                    process_interval = max(1, total_frames // 300)
                else:
                    process_interval = 1
                    
                # 创建帧处理线程池
                # 在低内存环境下，最多使用2-3个线程处理帧
                max_workers = min(3, os.cpu_count() or 2)  
                frame_executor = None
                try:
                    frame_executor = concurrent.futures.ThreadPoolExecutor(
                        max_workers=max_workers,
                        thread_name_prefix="frame_worker"
                    )
                    
                    # 使用队列来管理帧处理结果，确保按顺序写入
                    result_queue = queue.Queue(maxsize=max_workers * 2)
                    stop_event = threading.Event()
                    
                    # 处理线程计数器
                    processed_count = {'value': 0, 'lock': threading.Lock()}
                    
                    # 帧处理函数
                    def process_frame(frame_idx, frame):
                        try:
                            # 降低分辨率以提高处理速度
                            if width > max_dimension or height > max_dimension:
                                frame = cv2.resize(frame, (width, height), interpolation=cv2.INTER_AREA)
                            
                            # 对当前帧进行预测
                            frame_results = model.predict(
                                source=frame,
                                save=False,
                                conf=0.25
                            )[0]
                            
                            # 在帧上绘制检测结果
                            annotated_frame = frame_results.plot()
                            
                            # 确保帧是BGR格式，并保持原始颜色
                            if len(annotated_frame.shape) == 2:
                                annotated_frame = cv2.cvtColor(annotated_frame, cv2.COLOR_GRAY2BGR)
                            elif annotated_frame.shape[2] == 4:
                                annotated_frame = cv2.cvtColor(annotated_frame, cv2.COLOR_RGBA2BGR)
                            
                            # 将处理结果放入队列，包含帧索引以确保顺序写入
                            result_queue.put((frame_idx, annotated_frame))
                            
                            # 增加处理计数
                            with processed_count['lock']:
                                processed_count['value'] += 1
                                
                            # 清理内存
                            del frame_results
                            return True
                        except Exception as e:
                            print(f"处理第 {frame_idx} 帧时出错: {e}")
                            return False
                    
                    # 将帧结果按顺序写入视频的消费者线程
                    def writer_thread():
                        next_frame_idx = 0
                        frame_buffer = {}  # 缓存未按顺序到达的帧
                        
                        while not stop_event.is_set() or not result_queue.empty() or frame_buffer:
                            try:
                                # 尝试获取下一个处理结果，有超时以避免无限等待
                                frame_idx, annotated_frame = result_queue.get(timeout=0.5)
                                
                                # 如果是当前需要的帧，直接写入
                                if frame_idx == next_frame_idx:
                                    out.write(annotated_frame)
                                    next_frame_idx += 1
                                    
                                    # 检查缓存中是否有后续帧可以写入
                                    while next_frame_idx in frame_buffer:
                                        out.write(frame_buffer.pop(next_frame_idx))
                                        next_frame_idx += 1
                                else:
                                    # 否则缓存这一帧
                                    frame_buffer[frame_idx] = annotated_frame
                                
                                # 报告进度
                                if next_frame_idx % 10 == 0:
                                    current_percent = (next_frame_idx / total_frames) * 100
                                    print(f"视频处理进度: {current_percent:.1f}%")
                                
                                # 释放队列项
                                result_queue.task_done()
                                
                            except queue.Empty:
                                # 队列为空，继续等待
                                continue
                            except Exception as e:
                                print(f"写入线程错误: {e}")
                                continue
                    
                    # 启动写入线程
                    writer = threading.Thread(target=writer_thread, daemon=True)
                    writer.start()
                    
                    # 主线程读取视频帧并提交处理任务
                    futures = []
                    frame_count = 0
                    
                    while cap.isOpened():
                        ret, frame = cap.read()
                        if not ret:
                            break
                        
                        # 只处理特定间隔的帧
                        if frame_count % process_interval == 0:
                            # 提交帧处理任务
                            future = frame_executor.submit(process_frame, frame_count, frame.copy())
                            futures.append(future)
                            
                            # 控制内存使用 - 限制并发任务数量
                            while len(futures) >= max_workers * 2:
                                # 等待一些任务完成
                                done, futures = concurrent.futures.wait(
                                    futures, 
                                    return_when=concurrent.futures.FIRST_COMPLETED
                                )
                                # 检查已完成任务的结果
                                for future in done:
                                    try:
                                        future.result()  # 获取结果，检查是否有异常
                                    except Exception as e:
                                        print(f"任务执行错误: {e}")
                        
                        frame_count += 1
                    
                    # 等待所有提交的任务完成
                    for future in concurrent.futures.as_completed(futures):
                        try:
                            future.result()
                        except Exception as e:
                            print(f"任务执行错误: {e}")
                    
                    # 通知写入线程结束
                    stop_event.set()
                    
                    # 等待写入线程完成
                    if writer.is_alive():
                        writer.join(timeout=30)  # 最多等待30秒
                    
                    print(f"视频处理完成，共处理 {processed_count['value']}/{total_frames} 帧")
                    
                finally:
                    # 确保释放线程池资源
                    if frame_executor:
                        try:
                            frame_executor.shutdown(wait=True)
                            print("视频处理线程池已关闭")
                        except Exception as e:
                            print(f"关闭视频处理线程池出错: {str(e)}")
                
            finally:
                # 释放资源
                cap.release()
                out.release()
                print(f"视频资源已释放")
            
            # 验证输出文件
            if not os.path.exists(output_path):
                raise Exception(f"视频文件未生成: {output_path}")
            if os.path.getsize(output_path) == 0:
                raise Exception(f"生成的视频文件大小为0: {output_path}")
            
            print(f"视频文件已成功生成: {output_path}")
            
            # 尝试处理结果
            try:
                results = model.predict(
                    source=file_path,
                    save=False,
                    conf=0.25
                )[0]
            except Exception as e:
                print(f"获取视频预测结果时出错: {e}")
                # 创建一个空结果
                from ultralytics.engine.results import Results
                results = Results()
                
        else:
            # 处理图片 - 检查图片大小并调整
            img = cv2.imread(file_path)
            if img is None:
                raise Exception(f"无法读取图像: {file_path}")
                
            # 调整大图像的大小
            max_dimension = 1280
            height, width = img.shape[:2]
            if width > max_dimension or height > max_dimension:
                # 等比例缩放
                scale = min(max_dimension / width, max_dimension / height)
                new_width, new_height = int(width * scale), int(height * scale)
                img = cv2.resize(img, (new_width, new_height), interpolation=cv2.INTER_AREA)
                print(f"图像已调整大小: {width}x{height} -> {new_width}x{new_height}")
                # 保存调整后的图像
                cv2.imwrite(file_path, img)
            
            # 设置图片输出路径
            output_path = 'static/results.jpg'
            
            # 进行预测
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
        
        # 强制进行垃圾回收
        gc.collect()
        
        return results, is_video
        
    except Exception as e:
        print(f"预测过程出错: {str(e)}")
        raise e

# 使用示例
if __name__ == "__main__":
    weights_path = "weights/best.pt"  # 替换为实际的模型路径
    image_path = "tiaozhanbei/ceshitu/7.jpg"    # 替换为实际的图片路径
    model = YOLO(weights_path)
    predict_image(model, image_path)

class YOLOv8:
    def __init__(self, weights, device='cpu', load_params=None):
        """
        初始化YOLOv8检测器
        :param weights: 模型权重文件路径
        :param device: 使用的设备(cuda 或 cpu)
        :param load_params: 模型加载的额外参数，例如 {'weights_only': True}
        """
        try:
            # 设置默认加载参数
            if load_params is None:
                load_params = {'weights_only': True}
            
            # 记录模型加载开始
            logger.info(f"开始加载YOLOv8模型，权重文件: {weights}, 设备: {device}")
            
            # 确保模型文件存在
            if not os.path.exists(weights):
                logger.error(f"模型文件不存在: {weights}")
                raise FileNotFoundError(f"模型文件不存在: {weights}")
            
            # 检查CUDA是否可用，如果请求CUDA但不可用，则回退到CPU
            if device == 'cuda' and not torch.cuda.is_available():
                logger.warning("CUDA请求但不可用，回退到CPU设备")
                device = 'cpu'
            
            # 加载模型
            self.model = YOLO(weights)
            
            # 将模型移动到指定设备
            if device != 'cpu':
                try:
                    self.model.to(device)
                    logger.info(f"模型已成功加载到 {device} 设备")
                except Exception as e:
                    logger.warning(f"无法将模型加载到 {device}，回退到CPU: {str(e)}")
                    device = 'cpu'
                    # 如果移动到GPU失败，确保模型在CPU上
                    self.model.to('cpu')
            else:
                logger.info("模型已加载到CPU设备")
            
            # 记录模型加载完成
            logger.info(f"YOLOv8模型加载完成")
            
        except Exception as e:
            logger.error(f"YOLOv8模型加载失败: {str(e)}")
            raise

    def predict(self, img, conf_threshold=0.25):
        """
        使用YOLOv8进行目标检测
        :param img: 输入图像(OpenCV格式)或图像文件路径
        :param conf_threshold: 置信度阈值
        :return: 检测结果
        """
        try:
            start_time = cv2.getTickCount()
            
            # 如果输入是字符串路径，则加载图像
            if isinstance(img, str):
                if not os.path.exists(img):
                    logger.error(f"图像文件不存在: {img}")
                    return None
                logger.info(f"加载图像文件: {img}")
                img = cv2.imread(img)
                if img is None:
                    logger.error(f"无法读取图像文件: {img}")
                    return None
            
            # 进行预测
            results = self.model(img, conf=conf_threshold, verbose=False)
            
            # 计算处理时间
            process_time = (cv2.getTickCount() - start_time) / cv2.getTickFrequency()
            logger.info(f"YOLOv8处理时间: {process_time:.4f}秒")
            
            # 返回结果
            return results
            
        except Exception as e:
            logger.error(f"YOLOv8预测失败: {str(e)}")
            traceback.print_exc()
            return None

