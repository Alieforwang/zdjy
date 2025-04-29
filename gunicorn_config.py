# Gunicorn 配置文件 - 优化用于2核2G内存环境
import multiprocessing
import os

# 设置环境变量以解决Matplotlib和Ultralytics的临时目录警告
os.environ['MPLCONFIGDIR'] = '/tmp/matplotlib_config'
os.environ['YOLO_CONFIG_DIR'] = '/tmp/ultralytics_config'

# 绑定地址和端口
bind = "0.0.0.0:8888"

# 工作进程数量 - 对于2核心服务器，2个进程已经足够
# 因为我们在应用内使用了多线程，所以减少工作进程数以避免资源争用
workers = multiprocessing.cpu_count() * 2 + 1
# 使用gevent处理并发
worker_class = "gthread"
worker_connections = 200

# 工作进程启动时预加载应用，避免每个进程单独加载模型
preload_app = True

# 超时设置 - 增加处理大视频文件的超时时间
timeout = 600
keepalive = 2

# 内存优化设置
# 处理一定数量的请求后重启工作进程，避免内存泄漏
max_requests = 200  # 减少以更频繁地回收内存
max_requests_jitter = 50
# 减少每个工作进程的最大请求数
worker_max_requests = 200

# 日志设置
accesslog = "access.log"
errorlog = "error.log"
loglevel = "info"  # 生产环境使用warning级别减少日志量

# 守护进程和PID文件
daemon = True
pidfile = "gunicorn.pid"

# 不使用预加载缓存，为线程处理留出更多内存
preload = False

# 优化临时文件处理
worker_tmp_dir = "/dev/shm"

# 资源使用限制
limit_request_line = 4096
limit_request_fields = 100
limit_request_field_size = 8190

# 请求主体大小限制 - 允许上传大视频文件（100MB）
# 注意：此配置需要确保在Flask应用中也设置了相应的MAX_CONTENT_LENGTH
max_request_line = 0
limit_request_body = 104857600  # 100MB in bytes

# 每个工作进程的线程数
threads = 4

# 最大等待请求数
backlog = 2048

# 进程启动前回调函数
def on_starting(server):
    """服务启动前运行"""
    print("服务器正在启动...")
    
    # 预清理可能存在的临时文件
    import os
    import shutil
    
    try:
        # 清理上传文件夹，只保留最新的10个文件
        upload_dir = 'static/uploads'
        if os.path.exists(upload_dir):
            files = sorted(
                [os.path.join(upload_dir, f) for f in os.listdir(upload_dir) 
                 if os.path.isfile(os.path.join(upload_dir, f))],
                key=os.path.getmtime
            )
            # 如果超过10个文件，删除旧文件
            if len(files) > 10:
                for old_file in files[:-10]:
                    try:
                        os.remove(old_file)
                        print(f"已清理旧文件: {old_file}")
                    except:
                        pass
    except:
        pass

def post_fork(server, worker):
    """工作进程创建后运行，优化每个工作进程的内存使用"""
    from datetime import datetime
    print(f"工作进程 {worker.pid} 已启动，时间: {datetime.now()}")
    
    # 强制进行垃圾回收
    import gc
    gc.collect()
    
    # 设置更积极的垃圾回收阈值
    gc.set_threshold(100, 5, 5)  # 默认是(700, 10, 10)

def worker_exit(server, worker):
    """工作进程退出时运行，确保资源被释放"""
    print(f"工作进程 {worker.pid} 正在退出...")
    
    # 清理资源
    import gc
    gc.collect()
    
    # 尝试清理可能存在的线程池
    import threading
    import sys
    
    # 尝试找到并关闭所有ThreadPoolExecutor
    for obj in gc.get_objects():
        if "ThreadPoolExecutor" in str(type(obj)):
            try:
                if hasattr(obj, 'shutdown') and callable(obj.shutdown):
                    obj.shutdown(wait=False)
                    print(f"已关闭一个线程池")
            except:
                pass

# 优雅的处理SIGTERM信号 - 无缝重启
graceful_timeout = 120

# 子进程重启时处理（用于处理内存泄漏）
def child_exit(server, worker):
    print(f"工作进程 {worker.pid} 已退出")
    
    # 强制清理所有可能的资源
    import gc
    gc.collect() 