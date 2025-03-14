from flask import Flask, session, jsonify, redirect, url_for, request, render_template, send_from_directory, flash
from flask_cors import CORS
import util.DBUtil as DBM
import os
from werkzeug.utils import secure_filename
from yolov8 import predict_image, YOLOv8
from datetime import timedelta, datetime
import numpy as np
import cv2
from ultralytics import YOLO
import random
import decimal
import json
from config import AMAP_CONFIG, DB_CONFIG, APP_CONFIG, LOG_CONFIG
import concurrent.futures
import threading
import sys
import time
import shutil
import glob
import uuid
import logging
import gc
from functools import wraps
import matplotlib
matplotlib.use('Agg')  # 使用非交互式后端
import matplotlib.pyplot as plt
from matplotlib.ticker import MaxNLocator
import traceback

# 设置环境变量以解决Matplotlib和Ultralytics的临时目录警告
os.environ['MPLCONFIGDIR'] = '/tmp/matplotlib_config'
os.environ['YOLO_CONFIG_DIR'] = '/tmp/ultralytics_config'

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# 确保临时目录存在
for dir_path in ['/tmp/matplotlib_config', '/tmp/ultralytics_config']:
    if not os.path.exists(dir_path):
        os.makedirs(dir_path, exist_ok=True)

# 线程池管理
thread_pool_lock = threading.RLock()  # 使用可重入锁来保护线程池的创建和访问
thread_pool_executor = None  # 初始化为None，在需要时才创建

def get_thread_pool():
    """
    获取线程池，如果线程池不存在或已关闭则创建新的线程池
    """
    global thread_pool_executor, thread_pool_lock
    
    with thread_pool_lock:
        # 如果线程池不存在或已关闭，则创建新的线程池
        if thread_pool_executor is None or thread_pool_executor._shutdown:
            # 2核CPU环境下设置为4个线程比较合适
            thread_pool_executor = concurrent.futures.ThreadPoolExecutor(
                max_workers=4,
                thread_name_prefix="app_worker"
            )
            print("已创建新的线程池")
        
        return thread_pool_executor

# 创建自定义的JSON编码器来处理Decimal类型
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, decimal.Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

# 全局模型变量，避免重复加载模型
global_model = None

def get_model():
    """获取全局模型实例，如果不存在则加载"""
    global global_model
    if global_model is None:
        model_path = os.path.join('models3', 'best.pt')
        if os.path.exists(model_path):
            try:
                # 尝试检测是否有GPU可用
                try:
                    import torch
                    device = 'cuda' if torch.cuda.is_available() else 'cpu'
                    logger.info(f"自动选择设备: {device}")
                except ImportError:
                    device = 'cpu'
                    logger.info("无法导入torch，使用CPU设备")
                
                # 加载模型，允许自动回退到CPU
                global_model = YOLO(model_path)
                logger.info("模型加载成功")
            except Exception as e:
                logger.error(f"模型加载错误: {str(e)}")
    return global_model

app = Flask(__name__)
# 增强CORS配置，适应反向代理环境
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "*"}})

# 使用配置文件中的设置
app.secret_key = APP_CONFIG['SECRET_KEY']

# 添加响应处理钩子，处理反向代理场景下的OPTIONS请求
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# 设置session的配置
app.config['SESSION_TYPE'] = APP_CONFIG['SESSION_TYPE']
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(seconds=APP_CONFIG['PERMANENT_SESSION_LIFETIME'])  # 使用配置的过期时间
app.config['SESSION_COOKIE_SECURE'] = False  # 如果不是HTTPS可以设为False
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = None  # 修改为None以允许跨域请求传递Cookie
app.config['SESSION_COOKIE_PATH'] = '/'  # 确保Cookie适用于整个站点
app.config['SESSION_REFRESH_EACH_REQUEST'] = True  # 每次请求都刷新会话
app.config['SESSION_USE_SIGNER'] = True  # 使用签名保护会话

# 添加自定义JSON编码器
app.json_encoder = DecimalEncoder

# 添加文件上传配置
UPLOAD_FOLDER = APP_CONFIG['UPLOAD_FOLDER']
ALLOWED_EXTENSIONS = APP_CONFIG['ALLOWED_EXTENSIONS']

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['RESULT_FOLDER'] = 'static'
app.config['MAX_CONTENT_LENGTH'] = APP_CONFIG['MAX_CONTENT_LENGTH']  # 设置最大上传大小

# 清理旧文件的函数
def clean_old_files(directory, days_old=7):
    """
    清理指定目录中超过一定天数的文件
    
    Args:
        directory: 要清理的目录路径
        days_old: 超过该天数的文件将被删除，默认为7天
    """
    try:
        logger.info(f"开始清理 {directory} 中超过 {days_old} 天的文件")
        current_time = time.time()
        # 确保目录存在
        if not os.path.exists(directory):
            logger.warning(f"目录 {directory} 不存在，无法清理")
            return
            
        # 遍历目录中的所有文件
        for file_name in os.listdir(directory):
            file_path = os.path.join(directory, file_name)
            
            # 跳过目录
            if os.path.isdir(file_path):
                continue
                
            # 获取文件的最后修改时间
            file_mod_time = os.path.getmtime(file_path)
            # 计算文件存在的天数
            days_existed = (current_time - file_mod_time) / (60 * 60 * 24)
            
            # 如果文件存在超过指定天数，则删除
            if days_existed > days_old:
                try:
                    os.remove(file_path)
                    logger.info(f"已删除旧文件: {file_path}")
                except Exception as e:
                    logger.error(f"删除文件 {file_path} 时出错: {str(e)}")
    except Exception as e:
        logger.error(f"清理目录 {directory} 时出错: {str(e)}")

# 设置定期重置连接池的任务
def setup_db_connection_maintenance():
    """设置数据库连接池维护任务"""
    from util.DBUtil import reset_connection_pool
    import threading
    
    def reset_pool_periodically():
        # 每小时重置一次连接池，避免连接池耗尽问题
        while True:
            try:
                # 睡眠1小时
                time.sleep(3600)
                # 重置连接池
                logger.info("执行定期数据库连接池维护...")
                reset_connection_pool()
                logger.info("数据库连接池重置完成")
            except Exception as e:
                logger.error(f"连接池维护任务出错: {str(e)}")
    
    # 在后台线程中运行
    maintenance_thread = threading.Thread(
        target=reset_pool_periodically,
        daemon=True,  # 设为守护线程，主程序结束时自动退出
        name="db-pool-maintenance"
    )
    maintenance_thread.start()
    logger.info("数据库连接池维护任务已启动")

# 注册清理函数
def cleanup_resources():
    """在程序退出时清理资源"""
    logger.info("开始清理资源...")
    try:
        # 尝试重置连接池
        from util.DBUtil import reset_connection_pool
        reset_connection_pool()
        logger.info("数据库连接池已重置")
    except Exception as e:
        logger.error(f"重置数据库连接池时出错: {str(e)}")
    
    try:
        # 清理上传的临时文件
        clean_old_files('static/uploads', days_old=1)
    except Exception as e:
        logger.error(f"清理上传文件时出错: {str(e)}")
    
    try:
        # 清理分析结果图片
        clean_old_files('static/results', days_old=7)
    except Exception as e:
        logger.error(f"清理结果文件时出错: {str(e)}")
        
    logger.info("资源清理完成")

# 注册退出时的清理函数
import atexit
atexit.register(cleanup_resources)

# 在全局范围中定义函数，但不调用
def session_regenerate():
    """重新生成会话ID同时保留会话内容"""
    from flask.sessions import SecureCookieSession
    if session and isinstance(session, SecureCookieSession):
        # 备份旧的会话数据
        old_data = dict(session)
        # 轮换会话ID
        session.clear()
        # 恢复旧数据
        for k, v in old_data.items():
            session[k] = v
        session.modified = True

# 添加请求前处理器，确保会话在每次请求时都被刷新
@app.before_request
def make_session_permanent():
    # 在请求上下文中添加regenerate方法
    import types
    if hasattr(session, '_get_current_object') and not hasattr(session, 'regenerate'):
        try:
            session.regenerate = types.MethodType(session_regenerate, session)
        except Exception as e:
            logger.error(f"添加session.regenerate方法出错: {str(e)}")
    
    # 使会话永久化，并在每次访问时重置过期时间
    if 'user_id' in session:
        session.permanent = True
        session.modified = True  # 强制刷新会话
        # 更新登录时间以保持会话新鲜
        if 'login_time' in session:
            # 如果已经过期近1天，则更新登录时间
            login_time = datetime.strptime(session['login_time'], '%Y-%m-%d %H:%M:%S')
            if (datetime.now() - login_time).days >= 1:
                session['login_time'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                print(f"更新会话登录时间: {session['login_time']}")
        else:
            # 如果没有登录时间，初始化它
            session['login_time'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            print(f"初始化会话登录时间: {session['login_time']}")

# 确保必需的目录存在
def ensure_directories():
    """确保所有必需的目录都存在"""
    directories = [
        'static',
        'static/uploads',
        'static/results',
        'models',
        'sessions',
        'tmp'
    ]
    for directory in directories:
        try:
            if not os.path.exists(directory):
                os.makedirs(directory, exist_ok=True)
                logger.info(f"创建目录: {directory}")
            else:
                logger.info(f"目录已存在: {directory}")
        except Exception as e:
            logger.error(f"创建目录 {directory} 时出错: {str(e)}")
    
    # 创建默认图片，用于加载失败时显示
    default_image_path = 'static/default_result.jpg'
    if not os.path.exists(default_image_path):
        try:
            # 创建一个简单的默认图像
            img = np.ones((400, 600, 3), dtype=np.uint8) * 240  # 浅灰色背景
            # 添加文本
            cv2.putText(img, "无法加载图像", (150, 200), cv2.FONT_HERSHEY_SIMPLEX, 1, (100, 100, 100), 2)
            cv2.imwrite(default_image_path, img)
            logger.info(f"创建默认图像: {default_image_path}")
        except Exception as e:
            logger.error(f"创建默认图像时出错: {str(e)}")

# 在应用启动时创建目录
ensure_directories()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def init_db_user():
    db = DBM.DatabaseManager()
    db.connect()
    # 创建 user 表
    db.create_table("user")

# 创建模型实例 - 使用CPU设备而非CUDA
model = YOLOv8(weights='models/best.pt', device='cpu', load_params={'weights_only': True})

@app.route('/')
def index():
    # 检查用户是否已登录
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    
    # 根据用户类型重定向到相应页面
    if session.get('is_admin', False):
        return redirect(url_for('admin_home'))
    else:
        return redirect(url_for('user_home'))

@app.route('/login_page')
def login_page():
    return render_template('login.html')

@app.route('/register_input')
def register_input():
    return render_template('register.html')

@app.route('/register', methods=['POST'])
def register():
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        phone = data.get('phone')

        try:
            db = DBM.DatabaseManager()
            
            # 检查用户名是否已存在
            check_query = "SELECT * FROM user WHERE username = %s"
            result = db.query_data(check_query, (username,))
            
            if result and len(result) > 0:
                return jsonify({'success': False, 'message': '用户名已存在'})

            # 插入新用户
            insert_query = "INSERT INTO user (username, password) VALUES (%s, %s)"
            db.update_data(insert_query, (username, password))
            
            return jsonify({'success': True, 'message': '注册成功'})

        except Exception as e:
            print(f"注册错误: {str(e)}")
            return jsonify({'success': False, 'message': '注册过程出错'})
        finally:
            db.disconnect()

    return jsonify({'success': False, 'message': '不支持的请求方法'})

@app.route('/get_user_status')
def get_user_status():
    if 'username' in session:
        return jsonify({'logged_in': True, 'username': session['username']})
    else:
        return jsonify({'logged_in': False})

@app.route('/login', methods=['GET', 'POST'])
def login():
    # 对于GET请求，重定向到登录页面
    if request.method == 'GET':
        return redirect(url_for('login_page'))
    
    # 处理POST请求的登录逻辑
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        is_admin = data.get('isAdmin', False)
        
        try:
            db = DBM.DatabaseManager()
            db.connect()
            
            # 查询用户
            query = "SELECT id, password, is_admin FROM user WHERE username = %s"
            result = db.query_data(query, (username,))
            
            if result and len(result) > 0:
                user_id, stored_password, user_is_admin = result[0]
                
                if password == stored_password:
                    # 如果尝试管理员登录但不是管理员用户
                    if is_admin and not user_is_admin:
                        return jsonify({'success': False, 'message': '您不是管理员用户'})
                    
                    # 如果是普通用户登录但尝试以管理员身份登录
                    if not is_admin and user_is_admin:
                        return jsonify({'success': False, 'message': '请使用管理员登录入口'})
                    
                    # 清除任何可能存在的旧会话数据
                    session.clear()
                    
                    # 设置会话为永久的，并遵守配置的生存期
                    session.permanent = True
                    session['user_id'] = user_id
                    session['username'] = username
                    session['is_admin'] = user_is_admin
                    session['login_time'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    session['login_ip'] = request.remote_addr
                    session.modified = True
                    
                    # 记录登录成功
                    logger.info(f"用户 {username} 登录成功，IP: {request.remote_addr}")
                    
                    # 根据用户类型重定向到不同页面
                    if user_is_admin:
                        return jsonify({'success': True, 'redirect': '/admin'})
                    else:
                        return jsonify({'success': True, 'redirect': '/user'})
                    
            # 登录失败记录
            logger.warning(f"登录失败: 用户名 {username}，IP: {request.remote_addr}")
            return jsonify({'success': False, 'message': '用户名或密码错误'})
            
        except Exception as e:
            logger.error(f"登录错误: {str(e)}")
            return jsonify({'success': False, 'message': '登录过程出错'})
            
        finally:
            if 'db' in locals():
                db.disconnect()
    
    # 不应该到达这里，但作为保险
    return jsonify({'success': False, 'message': '不支持的请求方法'})

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login_page'))

@app.route('/analysis')
def analysis():
    # 直接检查会话状态
    if 'user_id' not in session:
        # 记录未登录访问尝试
        logger.warning(f"未登录用户尝试访问分析页面，IP: {request.remote_addr}")
        # 在重定向前尝试强制刷新会话
        try:
            session.modified = True
            # 尝试调用regenerate方法，但要处理它可能不存在的情况
            if hasattr(session, 'regenerate'):
                try:
                    session.regenerate()
                except Exception as e:
                    logger.error(f"重新生成会话时出错: {str(e)}")
        except Exception:
            pass  # 忽略可能的错误
        return redirect(url_for('login_page'))
    
    # 显式刷新会话以确保不会过期
    session.modified = True
    
    # 记录成功访问日志
    logger.info(f"用户 {session.get('username')} 访问分析页面")
    
    # 直接渲染模板，不使用前端重定向
    return render_template('analysis.html', is_admin=session.get('is_admin', False))

@app.route('/monitor')
def monitor():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    return render_template('monitor.html', is_admin=session.get('is_admin', False))

@app.route('/history')
def history():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    return render_template('history.html', is_admin=session.get('is_admin', False))

@app.route("/gw/list")
def get_gwlist():
  gw_key = request.args.get("query")
  res =  selectgw(gw_key)
#   print(res)
  return jsonify(res)

@app.route('/delete_job/<int:job_id>', methods=['DELETE'])
def delete_job(job_id):
    db = DBM.DatabaseManager()
    db.connect()
    db.delete_data("DELETE FROM gw_list WHERE id = %s", (job_id,))
    print("DELETE FROM gw_list WHERE id = {}".format(job_id))
    return jsonify({"message": "Job deleted successfully!"})

@app.route('/api/analyze', methods=['POST'])
def upload_analyze():
    """
    处理上传的图片并进行分析
    """
    thread_pool = get_thread_pool()
    
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file:
        # 创建一个唯一的文件名
        filename = secure_filename(file.filename)
        timestamp = int(time.time())
        unique_filename = f"{os.path.splitext(filename)[0]}_{timestamp}_{random.randint(1000, 9999)}{os.path.splitext(filename)[1]}"
        
        # 保存上传的文件
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(filepath)
        
        try:
            # 在后台线程中处理图像和清理旧文件
            thread_pool.submit(clean_old_files, app.config['UPLOAD_FOLDER'], 7)
            thread_pool.submit(clean_old_files, app.config['RESULT_FOLDER'], 7)
            
            # 使用新的YOLOv8模型实例进行预测
            logger.info(f"开始分析图像: {filepath}")
            results = model.predict(filepath, conf_threshold=0.25)
            
            if results is None or len(results) == 0:
                return jsonify({"error": "No detection results"}), 400
            
            result = results[0]  # 获取第一个结果
            
            # 提取边界框和类别
            boxes = result.boxes.xyxy.cpu().numpy()
            classes = result.boxes.cls.cpu().numpy()
            confs = result.boxes.conf.cpu().numpy()
            
            # 将结果保存为图像
            result_img = result.plot()
            result_filename = f"result_{unique_filename}"
            result_path = os.path.join(app.config['RESULT_FOLDER'], result_filename)
            cv2.imwrite(result_path, result_img)
            
            # 准备响应数据
            detections = []
            for i in range(len(boxes)):
                box = boxes[i]
                cls_id = int(classes[i])
                conf = float(confs[i])
                
                detections.append({
                    "box": [float(x) for x in box],
                    "class": cls_id,
                    "confidence": conf,
                    "name": "占道经营" if cls_id == 0 else f"未知类别-{cls_id}"
                })
                
            # 创建数据库连接并保存分析结果
            try:
                db = DBM.DatabaseManager()
                db.connect()
                
                # 获取当前用户ID
                user_id = session.get('user_id')
                if not user_id:
                    user_id = 1  # 默认用户ID，如果没有登录
                
                # 保存分析记录
                insert_query = """
                INSERT INTO analysis_records 
                (user_id, file_type, file_path, result_path, detect_type, confidence, created_at) 
                VALUES (%s, %s, %s, %s, %s, %s, NOW())
                """
                
                # 设置默认值
                file_type = 'image'
                detect_type = 'zdjy_ld'  # 默认为流动摊位
                avg_confidence = 0.0
                
                # 计算平均置信度
                if detections:
                    avg_confidence = sum(d["confidence"] for d in detections) / len(detections)
                
                # 执行插入
                db.update_data(
                    insert_query, 
                    (user_id, file_type, filepath, result_path, detect_type, avg_confidence)
                )
                
                db.disconnect()
                
            except Exception as e:
                logger.error(f"保存分析结果到数据库时出错: {str(e)}")
                # 继续处理，不因数据库错误而中断整个分析过程
            
            return jsonify({
                "success": True,
                "message": "图像分析完成",
                "result_image": url_for('get_result', filename=result_filename),
                "uploaded_image": url_for('get_upload', filename=unique_filename),
                "detections": detections,
                "detection_count": len(detections)
            })
            
        except Exception as e:
            logger.error(f"图像分析错误: {str(e)}")
            traceback.print_exc()
            return jsonify({"error": str(e)}), 500

@app.route('/static/<path:filename>')
def serve_static(filename):
    """提供静态文件访问，包括默认图片"""
    try:
        # 如果是默认图片，直接返回
        if filename == 'default_result.jpg':
            return send_from_directory('static', filename)
            
        # 检查文件是否存在
        file_path = os.path.join('static', filename)
        if not os.path.exists(file_path):
            logger.warning(f"请求的文件不存在: {filename}")
            # 如果文件不存在，返回默认图片
            return send_from_directory('static', 'default_result.jpg')
            
        # 根据文件类型设置正确的Content-Type
        content_type = None
        if filename.endswith('.mp4'):
            content_type = 'video/mp4'
        elif filename.endswith(('.jpg', '.jpeg')):
            content_type = 'image/jpeg'
        elif filename.endswith('.png'):
            content_type = 'image/png'
        elif filename.endswith('.gif'):
            content_type = 'image/gif'
            
        response = send_from_directory('static', filename)
        if content_type:
            response.headers['Content-Type'] = content_type
        return response
        
    except Exception as e:
        logger.error(f"提供静态文件时出错: {str(e)}")
        # 发生错误时返回默认图片
        return send_from_directory('static', 'default_result.jpg')

@app.route('/get_result/<path:filename>')
def get_result(filename):
    """提供结果图像的静态文件访问"""
    return send_from_directory(app.config['RESULT_FOLDER'], filename)

@app.route('/get_upload/<path:filename>')
def get_upload(filename):
    """提供上传图像的静态文件访问"""
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# 添加获取历史记录的接口
@app.route('/api/history', methods=['GET'])
def get_history():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '请先登录'}), 401
    
    try:
        days = request.args.get('days', '7')
        type_filter = request.args.get('type', 'all')
        page = int(request.args.get('page', '1'))
        per_page = int(request.args.get('page_size', '8'))  # 从请求参数中获取page_size，默认为8
        
        db = DBM.DatabaseManager()
        db.connect()
        
        # 构建查询条件
        conditions = ['user_id = %s']
        params = [session['user_id']]
        
        if days != 'all':
            conditions.append('created_at >= DATE_SUB(NOW(), INTERVAL %s DAY)')
            params.append(days)
        
        if type_filter != 'all':
            conditions.append('detect_type = %s')
            # 根据类型值映射到对应的中文名称
            type_mapping = {
                'zdjy_ld': 'zdjy_ld',  # 使用与数据库中相同的值
                'zdjy_gd': 'zdjy_gd'   # 使用与数据库中相同的值
            }
            params.append(type_mapping.get(type_filter, type_filter))
        
        # 获取总记录数
        where_clause = ' AND '.join(conditions)
        count_query = f'SELECT COUNT(*) FROM analysis_records WHERE {where_clause}'
        total_result = db.query_data(count_query, tuple(params))
        total_records = int(total_result[0][0]) if total_result else 0
        
        # 获取分页数据
        offset = (page - 1) * per_page
        query = f'''
            SELECT * FROM analysis_records 
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        '''
        records_result = db.query_data(query, tuple(params + [per_page, offset]))
        
        records = []
        if records_result:
            for row in records_result:
                # 修改文件路径的处理
                file_path = row[3]  # 原始文件路径
                result_path = row[4]  # 结果文件路径
                
                # 确保路径以 /static/ 开头，但避免重复添加
                if not file_path.startswith('/static/'):
                    file_path = f'/static/uploads/{os.path.basename(file_path)}'
                
                # 处理结果路径，避免重复添加/static/
                if result_path.startswith('static/'):
                    result_path = f'/{result_path}'
                elif not result_path.startswith('/'):
                    result_path = f'/{result_path}'
                
                records.append({
                    'id': int(row[0]),
                    'detect_time': row[8].strftime('%Y-%m-%d %H:%M:%S'),
                    'type': row[5] or '未知',
                    'location': row[6] or '未指定',
                    'confidence': float(row[7]) if row[7] else None,
                    'file_path': file_path,
                    'result_path': result_path,
                    'file_type': row[2]  # 添加文件类型
                })
        
        db.disconnect()
        
        # 计算总页数，确保结果是int类型
        total_pages = (total_records + per_page - 1) // per_page
        
        return jsonify({
            'success': True,
            'data': records,
            'total': total_records,
            'pages': total_pages
        })
        
    except Exception as e:
        print(f"获取历史记录错误: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/check_login')
def check_login():
    # 增强版会话检查
    try:
        if 'user_id' in session:
            # 确保会话被标记为已修改，以更新过期时间
            session.modified = True
            
            # 检查登录时间，计算剩余有效期
            login_time = session.get('login_time')
            current_time = datetime.now()
            
            if login_time:
                login_datetime = datetime.strptime(login_time, '%Y-%m-%d %H:%M:%S')
                time_elapsed = current_time - login_datetime
                time_remaining = app.config['PERMANENT_SESSION_LIFETIME'] - time_elapsed
                days_remaining = time_remaining.days
                
                # 如果会话即将过期，刷新会话的创建时间
                if days_remaining < 1:
                    session['login_time'] = current_time.strftime('%Y-%m-%d %H:%M:%S')
                    print(f"会话即将过期，已刷新: {session['login_time']}")
                    days_remaining = app.config['PERMANENT_SESSION_LIFETIME'].days
                
                # 记录日志以便调试
                logger.info(f"用户 {session.get('username')} 的会话有效，剩余 {days_remaining} 天")
                
                return jsonify({
                    'logged_in': True,
                    'username': session.get('username', ''),
                    'user_id': session.get('user_id'),
                    'is_admin': session.get('is_admin', False),
                    'session_expires_in_days': days_remaining
                })
            
            # 如果没有登录时间但有用户ID，仍然认为会话有效
            logger.info(f"用户 {session.get('username')} 的会话有效，但没有登录时间记录")
            return jsonify({
                'logged_in': True,
                'username': session.get('username', ''),
                'user_id': session.get('user_id'),
                'is_admin': session.get('is_admin', False)
            })
        
        # 如果会话中没有用户ID，返回未登录状态
        logger.info("用户未登录或会话已过期")
        return jsonify({
            'logged_in': False,
            'message': '用户未登录或 session 已过期'
        })
    except Exception as e:
        # 捕获并记录可能的异常
        logger.error(f"检查登录状态时出错: {str(e)}")
        # 异常情况下仍然返回未登录状态，确保前端能继续工作
        return jsonify({
            'logged_in': False,
            'message': f'检查登录状态时出错: {str(e)}'
        })

@app.route('/download_result/<path:filename>')
def download_result(filename):
    try:
        # 确保文件名安全
        safe_filename = os.path.basename(filename)
        
        # 检查文件是否存在于静态目录中
        static_path = os.path.join('static', safe_filename)
        if os.path.exists(static_path):
            return send_from_directory('static', safe_filename, as_attachment=True)
        else:
            # 确保错误信息返回格式正确
            return jsonify({'success': False, 'message': f'找不到文件 {safe_filename}'}), 404
    except Exception as e:
        print(f"下载错误: {e}")
        return jsonify({'success': False, 'message': '下载失败'}), 500

@app.route('/api/latest_result', methods=['GET'])
def get_latest_result():
    """获取用户最新的分析记录，使用简化逻辑降低出错风险"""
    # 检查登录状态
    if 'user_id' not in session:
        logger.warning(f"未登录用户尝试访问最新结果API: {request.remote_addr}")
        return jsonify({'success': False, 'message': '请先登录'}), 401
    
    try:
        # 创建一个默认的返回结果
        default_result = {
            'success': False,
            'message': '没有分析记录',
            'data': {
                'file_type': 'image',
                'file_path': '/static/default_result.jpg',
                'result_image': '/static/default_result.jpg',
                'is_video': False,
                'detect_type': 'unknown',
                'confidence': None
            }
        }
        
        # 尝试从数据库获取数据
        logger.info(f"用户 {session.get('username')} 请求最新结果数据")
        
        # 创建数据库连接
        db = DBM.DatabaseManager()
        db.connect()
        
        # 获取用户ID
        user_id = session.get('user_id')
        if not user_id:
            logger.error("会话中有用户ID但获取失败")
            return jsonify(default_result), 500
        
        try:
            # 简化查询
            query = "SELECT * FROM analysis_records WHERE user_id = %s ORDER BY created_at DESC LIMIT 1"
            result = db.query_data(query, (user_id,))
            
            # 检查结果
            if not result or len(result) == 0:
                logger.info(f"用户 {session.get('username')} 没有分析记录")
                db.disconnect()
                return jsonify(default_result)

            # 解析记录
            record = result[0]
            logger.info(f"找到记录: ID={record[0] if len(record) > 0 else 'unknown'}")
            
            # 安全地提取数据
            try:
                # 准备返回数据
                response_data = {
                    'success': True,
                    'data': {
                        'file_type': 'image',  # 默认为图像
                        'file_path': '/static/default_result.jpg',  # 默认图片
                        'result_image': '/static/default_result.jpg',  # 默认图片
                        'is_video': False,
                        'detect_type': 'unknown',
                        'confidence': None
                    }
                }
                
                # 逐个安全地获取字段
                if len(record) > 2 and record[2]:
                    response_data['data']['file_type'] = str(record[2])
                    response_data['data']['is_video'] = (str(record[2]) == 'video')
                
                if len(record) > 3 and record[3]:
                    file_path = str(record[3])
                    # 确保路径格式正确
                    if file_path:
                        if not file_path.startswith('/static/'):
                            file_path = f'/static/uploads/{os.path.basename(file_path)}'
                        response_data['data']['file_path'] = file_path
                
                if len(record) > 4 and record[4]:
                    result_path = str(record[4])
                    # 确保路径格式正确
                    if result_path:
                        if result_path.startswith('static/'):
                            result_path = f'/{result_path}'
                        elif not result_path.startswith('/'):
                            result_path = f'/{result_path}'
                        response_data['data']['result_image'] = result_path
                
                if len(record) > 5 and record[5]:
                    response_data['data']['detect_type'] = str(record[5])
                
                if len(record) > 7 and record[7] is not None:
                    try:
                        response_data['data']['confidence'] = float(record[7])
                    except (ValueError, TypeError):
                        logger.warning(f"无法转换置信度为浮点数: {record[7]}")
                
                # 安全关闭数据库连接
                db.disconnect()
                
                # 返回数据
                return jsonify(response_data)
                
            except Exception as e:
                logger.error(f"处理记录数据时出错: {str(e)}")
                db.disconnect()
                return jsonify(default_result)
                
        except Exception as e:
            logger.error(f"查询数据库时出错: {str(e)}")
            db.disconnect()
            return jsonify(default_result)
            
    except Exception as e:
        # 记录详细的异常信息
        error_msg = f"获取最新结果时出现未处理异常: {str(e)}"
        logger.error(error_msg)
        logger.error(traceback.format_exc())
        
        # 返回简化的错误响应，避免泄露敏感信息
        return jsonify({
            'success': False,
            'message': '服务器处理请求时出错',
            'data': {
                'file_type': 'image',
                'file_path': '/static/default_result.jpg',
                'result_image': '/static/default_result.jpg',
                'is_video': False,
                'detect_type': 'unknown',
                'confidence': None
            }
        }), 500

@app.route('/api/stats')
def get_stats():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '未登录'})
        
    try:
        db = DBM.DatabaseManager()
        
        # 获取今日日期
        today = datetime.now().date()
        yesterday = today - timedelta(days=1)
        
        # 获取今日检测数据
        today_query = """
        SELECT COUNT(*) as count
        FROM analysis_records
        WHERE user_id = %s AND DATE(created_at) = %s
        """
        today_result = db.query_data(today_query, (session['user_id'], today))
        # 转换为int类型
        today_count = int(today_result[0][0]) if today_result else 0
        
        # 获取昨日检测数据（用于计算趋势）
        yesterday_query = """
        SELECT COUNT(*) as count
        FROM analysis_records
        WHERE user_id = %s AND DATE(created_at) = %s
        """
        yesterday_result = db.query_data(yesterday_query, (session['user_id'], yesterday))
        yesterday_count = int(yesterday_result[0][0]) if yesterday_result else 0
        
        # 计算今日趋势
        today_trend = calculate_trend(today_count, yesterday_count)
        
        # 获取处理率数据
        process_rate_query = """
        SELECT 
            COUNT(CASE WHEN confidence >= 0.7 THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) as process_rate
        FROM analysis_records
        WHERE user_id = %s AND DATE(created_at) = %s
        """
        process_rate_result = db.query_data(process_rate_query, (session['user_id'], today))
        # 转换为float类型
        if process_rate_result and process_rate_result[0][0]:
            process_rate = float(process_rate_result[0][0])
            process_rate = round(process_rate, 1)
        else:
            process_rate = 0.0
        
        # 获取昨日处理率
        yesterday_rate_result = db.query_data(process_rate_query, (session['user_id'], yesterday))
        # 转换为float类型
        if yesterday_rate_result and yesterday_rate_result[0][0]:
            yesterday_rate = float(yesterday_rate_result[0][0])
        else:
            yesterday_rate = 0.0
        
        # 计算处理率趋势
        process_rate_trend = calculate_trend(process_rate, yesterday_rate)
        
        # 计算平均响应时间（示例：使用记录创建时间间隔的平均值）
        avg_response_query = """
        SELECT AVG(TIMESTAMPDIFF(SECOND, lag_time, created_at)) as avg_response
        FROM (
            SELECT 
                created_at,
                LAG(created_at) OVER (ORDER BY created_at) as lag_time
            FROM analysis_records
            WHERE user_id = %s AND DATE(created_at) = %s
        ) as subquery
        WHERE lag_time IS NOT NULL
        """
        avg_response_result = db.query_data(avg_response_query, (session['user_id'], today))
        # 转换为float类型
        if avg_response_result and avg_response_result[0][0]:
            avg_response = float(avg_response_result[0][0]) / 60
            avg_response = round(avg_response, 1)
        else:
            avg_response = 0.0
        
        # 获取昨日平均响应时间
        yesterday_response_result = db.query_data(avg_response_query, (session['user_id'], yesterday))
        # 转换为float类型
        if yesterday_response_result and yesterday_response_result[0][0]:
            yesterday_response = float(yesterday_response_result[0][0]) / 60
        else:
            yesterday_response = 0.0
        
        # 计算响应时间趋势（响应时间降低为正趋势）
        avg_response_trend = calculate_trend(yesterday_response - avg_response, 0)
        
        # 获取累计处理数据
        total_query = """
        SELECT COUNT(*) as count
        FROM analysis_records
        WHERE user_id = %s
        """
        total_result = db.query_data(total_query, (session['user_id'],))
        # 转换为int类型
        total_count = int(total_result[0][0]) if total_result else 0
        
        # 计算总体趋势（与前一周比较）
        last_week_query = """
        SELECT COUNT(*) as count
        FROM analysis_records
        WHERE user_id = %s AND created_at >= %s AND created_at < %s
        """
        week_start = today - timedelta(days=7)
        last_week_start = week_start - timedelta(days=7)
        current_week_result = db.query_data(last_week_query, (session['user_id'], week_start, today))
        last_week_result = db.query_data(last_week_query, (session['user_id'], last_week_start, week_start))
        
        # 转换为int类型
        current_week_count = int(current_week_result[0][0]) if current_week_result else 0
        last_week_count = int(last_week_result[0][0]) if last_week_result else 0
        total_trend = calculate_trend(current_week_count, last_week_count)
        
        db.disconnect()
        
        return jsonify({
            'success': True,
            'today_count': today_count,
            'today_trend': float(today_trend),
            'process_rate': process_rate,
            'process_rate_trend': float(process_rate_trend),
            'avg_response': avg_response,
            'avg_response_trend': float(avg_response_trend),
            'total_count': total_count,
            'total_trend': float(total_trend)
        })
        
    except Exception as e:
        print(f"获取统计数据错误: {str(e)}")
        return jsonify({'success': False, 'message': str(e)})

def calculate_trend(current, previous):
    """计算趋势变化百分比"""
    if not previous:
        return 0.0
    change = ((current - previous) / previous) * 100
    return round(change, 1)

@app.route('/settings')
def settings():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    return render_template('settings.html', is_admin=session.get('is_admin', False))

@app.route('/about')
def about():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    return render_template('about.html', is_admin=session.get('is_admin', False))

@app.route('/analyze_frame', methods=['POST'])
def analyze_frame():
    if 'frame' not in request.files:
        return jsonify({'success': False, 'message': '没有收到帧数据'})
    
    try:
        frame_file = request.files['frame']
        frame_data = frame_file.read()
        
        # 将二进制数据转换为numpy数组
        nparr = np.frombuffer(frame_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # 使用全局模型进行预测
        model = get_model()
        if model is None:
            return jsonify({'success': False, 'message': '模型加载失败'})
        
        # 如果图像太大，调整大小以减少内存使用
        height, width = frame.shape[:2]
        if height > 1000 or width > 1000:
            scale = min(1000 / height, 1000 / width)
            new_size = (int(width * scale), int(height * scale))
            frame = cv2.resize(frame, new_size, interpolation=cv2.INTER_AREA)
            
        # 进行预测
        results = model.predict(
            source=frame,
            save=False,
            conf=0.25
        )[0]
        
        # 获取检测结果
        detections = []
        if hasattr(results, 'boxes') and len(results.boxes) > 0:
            for box in results.boxes:
                x1, y1, x2, y2 = map(float, box.xyxy[0])
                confidence = float(box.conf[0])
                cls = int(box.cls[0])
                class_name = results.names[cls]
                
                detections.append({
                    'bbox': [x1, y1, x2, y2],
                    'class': class_name,
                    'confidence': confidence
                })
        
        return jsonify({
            'success': True,
            'detections': detections
        })
        
    except Exception as e:
        print(f"分析帧错误: {str(e)}")
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/analysis/chart-data', methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'])
def get_chart_data():
    # 处理OPTIONS请求，用于CORS预检
    if request.method == 'OPTIONS':
        return '', 200
        
    # 增强版会话验证 - 检查用户是否已登录
    if 'user_id' not in session:
        logger.warning(f"未授权访问图表数据API: {request.remote_addr}")
        # 明确返回401状态码，使前端知道需要重新登录
        return jsonify({
            'success': False,
            'message': '会话已过期，请重新登录',
            'trend': {'dates': [], 'counts': []}, 
            'distribution': []
        }), 401
    
    # 记录合法API访问
    logger.info(f"用户 {session.get('username')} 访问图表数据API")
    # 显式刷新会话，确保会话持续有效
    session.modified = True
        
    try:
        db = DBM.DatabaseManager()
        db.connect()
        
        # 获取趋势数据（最近7天）
        trend_query = """
        SELECT 
            DATE(created_at) as date,
            COUNT(*) as count
        FROM analysis_records 
        WHERE user_id = %s 
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date
        """
        trend_results = db.query_data(trend_query, (session['user_id'],))
        
        # 处理趋势数据
        dates = []
        counts = []
        
        for row in trend_results:
            if row[0] is not None:  # 确保日期不为空
                date = row[0].strftime('%Y-%m-%d')
                count = int(row[1])  # 将可能的Decimal转为int
                dates.append(date)
                counts.append(count)
        
        # 获取类型分布数据
        distribution_query = """
        SELECT 
            COALESCE(detect_type, 'other') as type,
            COUNT(*) as count
        FROM analysis_records 
        WHERE user_id = %s
        GROUP BY detect_type
        """
        distribution_results = db.query_data(distribution_query, (session['user_id'],))
        
        # 处理分布数据
        distribution_data = []
        
        for row in distribution_results:
            detect_type = row[0] or 'other'
            count = int(row[1])  # 将可能的Decimal转为int
            
            # 转换类型名称为更友好的显示名称
            type_name = detect_type
            if detect_type == 'zdjy_ld':
                type_name = '流动摊位'
            elif detect_type == 'zdjy_gd':
                type_name = '固定摊位'
            elif detect_type == 'other':
                type_name = '其他'
                
            distribution_data.append({
                'type': type_name,
                'count': count,
                'original_type': detect_type  # 保留原始类型用于颜色匹配
            })
        
        db.disconnect()
        
        return jsonify({
            'trend': {
                'dates': dates,
                'counts': counts
            },
            'distribution': distribution_data
        })
        
    except Exception as e:
        logger.error(f"获取图表数据错误: {str(e)}")
        # 返回空数据而不是错误状态，让前端能够正常显示
        return jsonify({
            'trend': {'dates': [], 'counts': []},
            'distribution': []
        })

@app.route('/admin')
def admin_home():
    if 'user_id' not in session or not session.get('is_admin'):
        return redirect(url_for('login_page'))
    return render_template('index.html', is_admin=True)

@app.route('/user')
def user_home():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    return render_template('index.html', is_admin=False)

@app.route('/user_management')
def user_management():
    # 检查用户是否已登录
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    
    # 检查用户是否有管理员权限
    is_admin = session.get('is_admin', False)
    if not is_admin:
        flash('您没有权限访问此页面')
        return redirect(url_for('index'))
    
    return render_template('user_management.html', is_admin=is_admin)

@app.route('/api/users', methods=['GET'])
def get_users():
    if 'user_id' not in session or not session.get('is_admin'):
        return jsonify({'success': False, 'message': '未登录或无权限'}), 401
    
    try:
        db = DBM.DatabaseManager()
        db.connect()
        users = db.query_data('SELECT id, username, is_admin, created_at FROM user')
        db.disconnect()
        
        return jsonify({
            'success': True,
            'users': [{
                'id': user[0],
                'username': user[1],
                'is_admin': bool(user[2]),
                'created_at': user[3].isoformat() if user[3] else None
            } for user in users]
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/users', methods=['POST'])
def add_user():
    if 'user_id' not in session or not session.get('is_admin'):
        return jsonify({'success': False, 'message': '未登录或无权限'}), 401
    
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        is_admin = data.get('is_admin', False)
        
        if not username or not password:
            return jsonify({'success': False, 'message': '用户名和密码不能为空'}), 400
        
        db = DBM.DatabaseManager()
        db.connect()
        
        # 检查用户名是否已存在
        existing_user = db.query_data('SELECT id FROM user WHERE username = %s', (username,))
        if existing_user:
            db.disconnect()
            return jsonify({'success': False, 'message': '用户名已存在'}), 400
        
        # 添加新用户
        db.update_data(
            'INSERT INTO user (username, password, is_admin) VALUES (%s, %s, %s)',
            (username, password, is_admin)
        )
        db.disconnect()
        
        return jsonify({'success': True, 'message': '用户添加成功'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    if 'user_id' not in session or not session.get('is_admin'):
        return jsonify({'success': False, 'message': '未登录或无权限'}), 401
    
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        is_admin = data.get('is_admin', False)
        
        if not username:
            return jsonify({'success': False, 'message': '用户名不能为空'}), 400
        
        db = DBM.DatabaseManager()
        db.connect()
        
        # 检查用户名是否已被其他用户使用
        existing_user = db.query_data(
            'SELECT id FROM user WHERE username = %s AND id != %s',
            (username, user_id)
        )
        if existing_user:
            db.disconnect()
            return jsonify({'success': False, 'message': '用户名已存在'}), 400
        
        # 更新用户信息
        if password:
            db.update_data(
                'UPDATE user SET username = %s, password = %s, is_admin = %s WHERE id = %s',
                (username, password, is_admin, user_id)
            )
        else:
            db.update_data(
                'UPDATE user SET username = %s, is_admin = %s WHERE id = %s',
                (username, is_admin, user_id)
            )
        
        db.disconnect()
        return jsonify({'success': True, 'message': '用户更新成功'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    if 'user_id' not in session or not session.get('is_admin'):
        return jsonify({'success': False, 'message': '未登录或无权限'}), 401
    
    try:
        # 不允许删除自己
        if user_id == session['user_id']:
            return jsonify({'success': False, 'message': '不能删除当前登录用户'}), 400
        
        db = DBM.DatabaseManager()
        db.connect()
        
        # 检查用户是否存在
        user = db.query_data('SELECT id FROM user WHERE id = %s', (user_id,))
        if not user:
            db.disconnect()
            return jsonify({'success': False, 'message': '用户不存在'}), 404
        
        # 删除用户
        db.delete_data('DELETE FROM user WHERE id = %s', (user_id,))
        db.disconnect()
        
        return jsonify({'success': True, 'message': '用户删除成功'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    return render_template('dashboard.html')

@app.route('/api/dashboard/stats')
def get_dashboard_stats():
    try:
        # 生成过去7天的趋势数据
        today = datetime.now()
        trend_data = {
            'dates': [(today - timedelta(days=i)).strftime('%m-%d') for i in range(6, -1, -1)],
            'values': [random.randint(100, 500) for _ in range(7)]
        }

        # 生成类型分布数据
        types = ['垃圾堆积', '车辆违停', '施工占道', '店外经营', '非机动车乱停']
        distribution_data = [
            {'name': t, 'value': random.randint(50, 200), 'confidence': random.uniform(0.85, 0.98)}
            for t in types
        ]

        # 生成每小时数据
        hours = [f'{i:02d}:00' for i in range(24)]
        hourly_data = {
            'hours': hours,
            'counts': [random.randint(10, 50) for _ in range(24)],
            'confidence': [random.uniform(0.85, 0.98) for _ in range(24)]
        }

        # 生成昆明市各区的热力图数据
        districts_center = {
            '五华区': [102.707262, 25.043635],
            '盘龙区': [102.752029, 25.116534],
            '官渡区': [102.749026, 24.950231],
            '西山区': [102.664376, 25.038607],
            '呈贡区': [102.821663, 24.885645],
            '晋宁区': [102.595682, 24.669446],
            '东川区': [103.187824, 26.082873]
        }

        location_data = []
        for district, center in districts_center.items():
            # 在每个区域生成10-30个随机点
            num_points = random.randint(10, 30)
            for _ in range(num_points):
                # 在区域中心周围随机生成点
                lng = center[0] + random.uniform(-0.05, 0.05)
                lat = center[1] + random.uniform(-0.05, 0.05)
                location_data.append({
                    'name': district,
                    'longitude': lng,
                    'latitude': lat,
                    'count': random.randint(1, 100)
                })

        # 生成系统状态数据
        system_data = {
            'total_detections': sum(trend_data['values']),
            'avg_confidence': sum(d['confidence'] for d in distribution_data) / len(distribution_data),
            'active_users': random.randint(10, 50)
        }

        return jsonify({
            'success': True,
            'trend': trend_data,
            'distribution': distribution_data,
            'hourly': hourly_data,
            'location': location_data,
            'system': system_data
        })

    except Exception as e:
        print(f"获取大屏数据错误: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

# 应用关闭时清理线程池资源
@app.teardown_appcontext
def shutdown_thread_pool(exception=None):
    # 不需要立即关闭线程池，允许它完成正在处理的任务
    # 系统关闭时会由cleanup_resources函数处理
    pass

# 初始化应用
def init_app():
    """初始化应用配置和资源"""
    try:
        # 设置数据库连接池维护
        setup_db_connection_maintenance()
        logger.info("数据库连接池维护任务已设置")
        
        # 确保必要的目录存在
        for directory in ['static/uploads', 'static/results', 'sessions']:
            if not os.path.exists(directory):
                os.makedirs(directory)
                logger.info(f"创建目录: {directory}")
    except Exception as e:
        logger.error(f"初始化应用时出错: {str(e)}")

# 应用启动时调用初始化
init_app()

# 个人中心路由
@app.route('/profile')
def profile():
    # 检查用户是否已登录
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
    
    # 获取is_admin属性
    is_admin = session.get('is_admin', False)
    
    return render_template('profile.html', is_admin=is_admin)

# 个人中心API - 获取用户信息
@app.route('/api/profile')
def get_profile():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '用户未登录'}), 401
    
    try:
        db = DBM.DatabaseManager()
        db.connect()
        
        # 获取用户信息
        query = "SELECT id, username, is_admin, created_at FROM user WHERE id = %s"
        result = db.query_data(query, (session['user_id'],))
        
        if not result:
            return jsonify({'success': False, 'message': '用户不存在'}), 404
        
        # 获取最后登录时间（模拟数据，实际应从登录记录表获取）
        last_login = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        user_data = {
            'success': True,
            'user_id': result[0][0],
            'username': result[0][1],
            'is_admin': bool(result[0][2]),
            'created_at': result[0][3].isoformat() if result[0][3] else None,
            'last_login': last_login
        }
        
        db.disconnect()
        return jsonify(user_data)
    
    except Exception as e:
        logger.error(f"获取用户信息失败: {str(e)}")
        return jsonify({'success': False, 'message': f'获取用户信息失败: {str(e)}'}), 500

# 个人中心API - 修改密码
@app.route('/api/profile/change_password', methods=['POST'])
def change_password():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '用户未登录'}), 401
    
    try:
        data = request.get_json()
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({'success': False, 'message': '密码不能为空'}), 400
        
        if len(new_password) < 6:
            return jsonify({'success': False, 'message': '新密码长度必须至少为6位'}), 400
        
        db = DBM.DatabaseManager()
        db.connect()
        
        # 验证当前密码
        query = "SELECT password FROM user WHERE id = %s"
        result = db.query_data(query, (session['user_id'],))
        
        if not result:
            return jsonify({'success': False, 'message': '用户不存在'}), 404
        
        stored_password = result[0][0]
        
        # 验证当前密码是否正确
        if not compare_passwords(current_password, stored_password):
            return jsonify({'success': False, 'message': '当前密码不正确'}), 400
        
        # 更新密码
        hashed_password = hash_password(new_password)
        update_query = "UPDATE user SET password = %s WHERE id = %s"
        db.update_data(update_query, (hashed_password, session['user_id']))
        
        db.disconnect()
        
        # 记录密码变更操作
        logger.info(f"用户 {session.get('username')} 修改了密码，IP: {request.remote_addr}")
        
        return jsonify({'success': True, 'message': '密码修改成功'})
    
    except Exception as e:
        logger.error(f"修改密码失败: {str(e)}")
        return jsonify({'success': False, 'message': f'修改密码失败: {str(e)}'}), 500

# 个人中心API - 获取操作日志
@app.route('/api/profile/logs')
def get_operation_logs():
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '用户未登录'}), 401
    
    try:
        # 获取查询参数
        page = int(request.args.get('page', 1))
        days = int(request.args.get('days', 7))
        log_type = request.args.get('type', 'all')
        
        # 每页显示数量
        per_page = 10
        
        # 计算偏移量
        offset = (page - 1) * per_page
        
        # 构建示例日志数据（实际应从日志表获取）
        # 这里使用模拟数据，实际项目中应从数据库获取真实日志
        logs = []
        log_types = ['登录', '检测', '分析', '查询']
        descriptions = [
            '用户登录系统',
            '执行占道经营检测任务',
            '分析历史数据',
            '查询统计报表',
            '修改用户密码',
            '导出数据报表'
        ]
        
        # 生成随机日志数据
        import random
        from datetime import datetime, timedelta
        
        # 计算日期范围
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # 总日志数量（实际应从数据库查询）
        total_logs = 35
        
        # 根据日志类型筛选
        filtered_logs = []
        for i in range(total_logs):
            # 随机生成日志时间
            log_date = start_date + timedelta(
                seconds=random.randint(0, int((end_date - start_date).total_seconds()))
            )
            
            # 随机生成日志类型
            action_type = random.choice(log_types)
            
            # 如果指定了日志类型且不匹配，则跳过
            if log_type != 'all' and log_type != action_type.lower():
                continue
                
            # 随机生成描述
            description = random.choice(descriptions)
            
            # 随机生成IP地址
            ip = f"192.168.{random.randint(1, 255)}.{random.randint(1, 255)}"
            
            filtered_logs.append({
                'timestamp': log_date.strftime('%Y-%m-%d %H:%M:%S'),
                'action_type': action_type,
                'description': description,
                'ip_address': ip
            })
        
        # 按时间排序（降序）
        filtered_logs.sort(key=lambda x: x['timestamp'], reverse=True)
        
        # 计算总页数
        total_pages = max(1, (len(filtered_logs) + per_page - 1) // per_page)
        
        # 确保页码在有效范围内
        if page < 1:
            page = 1
        elif page > total_pages:
            page = total_pages
        
        # 获取当前页的日志
        page_logs = filtered_logs[offset:offset + per_page]
        
        return jsonify({
            'success': True,
            'logs': page_logs,
            'current_page': page,
            'total_pages': total_pages,
            'total_logs': len(filtered_logs)
        })
    
    except Exception as e:
        logger.error(f"获取操作日志失败: {str(e)}")
        return jsonify({'success': False, 'message': f'获取操作日志失败: {str(e)}'}), 500

if __name__ == '__main__':
    try:
        # 创建数据库表
        db = DBM.DatabaseManager()
        try:
            db.connect()
            logger.info("数据库连接成功")
            
            # 创建必要的表
            try:
                db.create_tables()
                logger.info("数据库表创建成功")
            except Exception as table_error:
                logger.error(f"创建数据库表时出错: {str(table_error)}")
                logger.error(f"错误详情: {traceback.format_exc()}")
                # 继续程序执行，因为表可能已经存在
            
            # 检查是否存在默认管理员用户
            try:
                result = db.query_data("SELECT COUNT(*) FROM user WHERE username = 'admin'")
                if result and result[0][0] == 0:
                    # 创建默认管理员用户
                    db.update_data(
                        "INSERT INTO user (username, password, is_admin) VALUES (%s, %s, %s)",
                        ("admin", "admin", True)
                    )
                    logger.info("创建默认管理员用户成功")
            except Exception as user_error:
                logger.error(f"检查或创建管理员用户时出错: {str(user_error)}")
                # 继续执行，可能是表结构问题
        except Exception as db_error:
            logger.error(f"数据库连接或初始化错误: {str(db_error)}")
        finally:
            try:
                if 'db' in locals() and db.connection:
                    db.disconnect()
            except:
                pass
            
        logger.info("数据库初始化完成")
        
        # 服务器配置优化，适合低内存环境
        from werkzeug.serving import run_simple
        run_simple('0.0.0.0', 8888, app, threaded=True, processes=1)
        # 不再使用app.run，因为它不适合生产环境
        # app.run(debug=True, port=8888)
    except Exception as e:
        logger.error(f"启动错误: {str(e)}")
        logger.error(f"错误详情: {traceback.format_exc()}")
    finally:
        # 确保清理资源
        try:
            cleanup_resources()
        except Exception as cleanup_error:
            logger.error(f"清理资源时出错: {str(cleanup_error)}")

# Gunicorn配置 - 部署时使用
# 在终端运行: gunicorn -c gunicorn_config.py app:app
"""
# 创建文件 gunicorn_config.py 包含以下内容:
bind = "0.0.0.0:8888"
workers = 2  # 对应2核CPU
worker_class = "gevent"  # 使用gevent处理并发
worker_connections = 500
timeout = 60
keepalive = 2

# 内存优化
max_requests = 500
max_requests_jitter = 50

# 日志设置
accesslog = "access.log"
errorlog = "error.log"
loglevel = "warning"
"""