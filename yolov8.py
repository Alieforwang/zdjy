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
import argparse

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

def process_camera_feed(model, camera_id=0, conf_threshold=0.25, max_time=None, show_window=False):
    """
    使用YOLOv8模型实时处理摄像头视频流
    
    参数:
    - model: YOLO模型实例
    - camera_id: 摄像头ID (默认为0，表示默认摄像头)
    - conf_threshold: 检测置信度阈值
    - max_time: 最大运行时间(秒)，None表示无限运行
    - show_window: 是否显示实时预览窗口
    
    返回:
    - 最后一帧的检测结果, 最后一帧图像
    """
    try:
        # 初始化摄像头
        logger.info(f"正在初始化摄像头 ID: {camera_id}")
        cap = cv2.VideoCapture(camera_id)
        
        # 检查摄像头是否成功打开
        if not cap.isOpened():
            logger.error(f"无法打开摄像头 ID: {camera_id}")
            return None, None
        
        # 获取视频流信息
        frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        logger.info(f"摄像头分辨率: {frame_width}x{frame_height}, FPS: {fps}")
        
        # 初始化变量
        start_time = time.time()
        last_result = None
        last_frame = None
        frame_count = 0
        
        # 创建显示窗口
        if show_window:
            window_name = f"YOLOv8 Camera Feed (ID: {camera_id})"
            cv2.namedWindow(window_name, cv2.WINDOW_NORMAL)
            cv2.resizeWindow(window_name, 800, 600)
        
        logger.info(f"开始处理摄像头视频流，置信度阈值: {conf_threshold}")
        
        while True:
            # 获取当前时间
            current_time = time.time()
            elapsed_time = current_time - start_time
            
            # 检查是否达到最大运行时间
            if max_time is not None and elapsed_time > max_time:
                logger.info(f"已达到最大运行时间: {max_time}秒")
                break
            
            # 捕获帧
            ret, frame = cap.read()
            
            # 检查是否成功获取帧
            if not ret:
                logger.error("无法从摄像头获取视频帧")
                break
            
            # 保存最后一帧
            last_frame = frame.copy()
            
            # 执行目标检测
            results = model(frame, conf=conf_threshold, verbose=False)
            
            if results and len(results) > 0:
                last_result = results[0]  # 保存最后一个结果
                
                # 在帧上绘制检测结果
                annotated_frame = results[0].plot()
                
                # 记录检测到的目标
                num_detections = len(results[0].boxes)
                if num_detections > 0:
                    # 获取类别和置信度
                    detected_classes = []
                    for i in range(num_detections):
                        box = results[0].boxes[i]
                        cls_id = int(box.cls[0].item())
                        conf = box.conf[0].item()
                        cls_name = results[0].names[cls_id]
                        detected_classes.append(f"{cls_name} ({conf:.2f})")
                    
                    logger.info(f"帧 {frame_count}: 检测到 {num_detections} 个目标: {', '.join(detected_classes)}")
            else:
                annotated_frame = frame
                logger.info(f"帧 {frame_count}: 未检测到目标")
            
            # 显示帧
            if show_window:
                # 添加FPS和时间信息
                fps_text = f"FPS: {1.0/(time.time()-current_time):.1f}" if current_time != start_time else "FPS: --"
                cv2.putText(annotated_frame, fps_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
                
                time_text = f"运行时间: {elapsed_time:.1f}秒"
                cv2.putText(annotated_frame, time_text, (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
                
                # 显示标注后的帧
                cv2.imshow(window_name, annotated_frame)
                
                # 按ESC键退出
                if cv2.waitKey(1) == 27:  # ESC键
                    logger.info("用户按下ESC键，停止处理")
                    break
            
            # 更新帧计数
            frame_count += 1
            
            # 控制处理速率以避免CPU/GPU过载
            if frame_count % 5 == 0:
                # 每处理5帧，强制垃圾回收
                gc.collect()
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
        
        # 计算平均FPS
        if elapsed_time > 0:
            average_fps = frame_count / elapsed_time
            logger.info(f"平均处理速率: {average_fps:.2f} FPS")
        
        # 关闭资源
        cap.release()
        if show_window:
            cv2.destroyAllWindows()
        
        logger.info(f"摄像头处理完成，共处理 {frame_count} 帧")
        
        # 返回最后的结果和帧
        return last_result, last_frame
    
    except Exception as e:
        logger.error(f"处理摄像头视频流时出错: {str(e)}")
        traceback.print_exc()
        
        # 确保资源被释放
        try:
            if 'cap' in locals() and cap.isOpened():
                cap.release()
            if show_window and 'window_name' in locals():
                cv2.destroyAllWindows()
        except:
            pass
        
        return None, None

def camera_inference_demo(weights_path="models/best.pt", camera_id=0, conf=0.25, show_preview=True, max_runtime=None):
    """
    摄像头推理演示函数
    
    参数:
    - weights_path: 模型权重路径
    - camera_id: 摄像头ID
    - conf: 置信度阈值
    - show_preview: 是否显示预览窗口
    - max_runtime: 最大运行时间(秒)
    """
    try:
        # 检查模型文件
        if not os.path.exists(weights_path):
            logger.error(f"模型文件不存在: {weights_path}")
            
            # 尝试查找models目录下的其他pt文件
            if os.path.exists("models"):
                for file in os.listdir("models"):
                    if file.endswith(".pt"):
                        weights_path = os.path.join("models", file)
                        logger.info(f"找到替代模型文件: {weights_path}")
                        break
                else:
                    return
            else:
                return
        
        # 加载模型
        logger.info(f"加载模型: {weights_path}")
        model = YOLO(weights_path)
        
        # 开始摄像头推理
        logger.info(f"开始摄像头推理 (ID: {camera_id}, 置信度阈值: {conf})")
        result, last_frame = process_camera_feed(
            model, 
            camera_id=camera_id, 
            conf_threshold=conf,
            max_time=max_runtime,
            show_window=show_preview
        )
        
        # 处理结果
        if result is not None and last_frame is not None:
            # 保存最后一帧
            output_path = "static/last_camera_frame.jpg"
            annotated_frame = result.plot()
            cv2.imwrite(output_path, annotated_frame)
            logger.info(f"已保存最后一帧带标注的图像到: {output_path}")
            
            # 打印检测结果
            num_detections = len(result.boxes)
            logger.info(f"最终检测结果: 检测到 {num_detections} 个目标")
            
            if num_detections > 0:
                logger.info("检测结果详情:")
                for i in range(num_detections):
                    box = result.boxes[i]
                    cls_id = int(box.cls[0].item())
                    conf = box.conf[0].item()
                    cls_name = result.names[cls_id]
                    x1, y1, x2, y2 = box.xyxy[0].tolist()
                    logger.info(f"  {i+1}. 类别: {cls_name}, 置信度: {conf:.4f}, 位置: ({int(x1)},{int(y1)})-({int(x2)},{int(y2)})")
        else:
            logger.warning("未获得有效的检测结果")
        
    except Exception as e:
        logger.error(f"摄像头推理演示出错: {str(e)}")
        traceback.print_exc()

# 使用示例
if __name__ == "__main__":
    # 这部分代码只在直接运行yolov8.py时执行，被导入时不会执行
    
    # 解析命令行参数
    parser = argparse.ArgumentParser(description='YOLOv8模型推理测试')
    parser.add_argument('--weights', type=str, default="models/best.pt", help='模型权重文件路径')
    parser.add_argument('--image', type=str, default=None, help='要预测的图像文件路径')
    parser.add_argument('--camera', type=int, default=None, help='摄像头ID (0表示默认摄像头)')
    parser.add_argument('--conf', type=float, default=0.25, help='置信度阈值')
    args = parser.parse_args()
    
    weights_path = args.weights
    image_path = args.image
    camera_id = args.camera
    conf_threshold = args.conf
    
    # 确认模型文件是否存在
    if not os.path.exists(weights_path):
        print(f"错误：模型文件不存在: {weights_path}")
        print(f"当前工作目录: {os.getcwd()}")
        print(f"尝试绝对路径: {os.path.abspath(weights_path)}")
        
        # 尝试查找models目录下的其他pt文件
        if os.path.exists("models"):
            print("models目录存在，查找其中的模型文件:")
            for file in os.listdir("models"):
                if file.endswith(".pt"):
                    print(f"找到模型文件: models/{file}")
                    weights_path = os.path.join("models", file)
                    break
    
    # 如果指定了摄像头，启动摄像头推理演示
    if camera_id is not None:
        try:
            print(f"启动摄像头推理演示，摄像头ID: {camera_id}")
            camera_inference_demo(
                weights_path=weights_path,
                camera_id=camera_id,
                conf=conf_threshold,
                show_preview=True,
                max_runtime=None  # 无限运行，直到用户按ESC退出
            )
        except Exception as e:
            print(f"摄像头推理演示失败: {str(e)}")
            traceback.print_exc()
    # 仅在提供了图像路径时才进行预测
    elif image_path and os.path.exists(image_path):
        try:
            print(f"尝试加载模型: {weights_path}")
            model = YOLO(weights_path)
            print(f"开始预测图像: {image_path}")
            predict_image(model, image_path)
            print("预测完成")
        except Exception as e:
            print(f"加载模型或预测时出错: {str(e)}")
            traceback.print_exc()
    else:
        # 如果没有提供图像路径，只测试模型加载
        try:
            print(f"尝试加载模型: {weights_path}")
            model = YOLO(weights_path)
            print(f"模型加载成功。模型类别: {model.names}")
        except Exception as e:
            print(f"加载模型时出错: {str(e)}")
            traceback.print_exc()

class YOLOv8:
    def __init__(self, weights, device='cpu', load_params=None):
        """
        初始化YOLOv8检测器
        :param weights: 模型权重文件路径
        :param device: 使用的设备(cuda 或 cpu)
        :param load_params: 模型加载的额外参数
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
            
            # 检查CUDA是否可用
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
                    self.model.to('cpu')
            else:
                logger.info("模型已加载到CPU设备")
            
            # 记录模型类别映射
            self.original_names = self.model.names.copy() if hasattr(self.model, 'names') else {}
            logger.info(f"模型类别映射: {self.original_names}")
            
            # 创建自定义类别名称映射
            self.custom_names = {}
            
            # 针对占道经营检测的模型，定义自定义类别名称
            if len(self.original_names) == 2:
                self.custom_names = {
                    0: '占道经营-固定摊位',
                    1: '占道经营-流动摊位'
                }
                logger.info(f"已创建自定义类别映射: {self.custom_names}")
            
            logger.info(f"YOLOv8模型加载完成")
            
        except Exception as e:
            logger.error(f"YOLOv8模型加载失败: {str(e)}")
            traceback.print_exc()
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
            
            # 验证图像数据
            if img is None:
                logger.error("输入图像数据为空")
                return None
                
            if not isinstance(img, np.ndarray):
                logger.error(f"图像数据类型不正确: {type(img)}")
                return None
                
            # 检查图像维度
            if len(img.shape) != 3:
                logger.error(f"图像维度不正确: {img.shape}")
                return None
                
            logger.info(f"开始预测，图像尺寸: {img.shape}, 置信度阈值: {conf_threshold}")
            
            # 进行预测
            results = self.model(img, conf=conf_threshold, verbose=False)
            
            # 计算处理时间
            process_time = (cv2.getTickCount() - start_time) / cv2.getTickFrequency()
            logger.info(f"YOLOv8处理时间: {process_time:.4f}秒")
            
            # 检查结果
            if results is None or len(results) == 0:
                logger.warning("模型未返回任何检测结果")
            else:
                logger.info(f"检测到 {len(results)} 个结果")
                
                # 如果有自定义类别名称，应用到结果中
                if self.custom_names:
                    for result in results:
                        if not hasattr(result, 'custom_names'):
                            result.custom_names = self.custom_names
            
            # 返回结果
            return results
            
        except Exception as e:
            logger.error(f"YOLOv8预测失败: {str(e)}")
            traceback.print_exc()
            return None

