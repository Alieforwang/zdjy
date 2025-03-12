from flask import Flask, session, jsonify, redirect, url_for, request, render_template, send_from_directory
from flask_cors import CORS
import util.DBUtil as DBM
import os
from werkzeug.utils import secure_filename
from yolov8 import predict_image
from datetime import timedelta, datetime
import numpy as np
import cv2
from ultralytics import YOLO
import random
import decimal
import json
from config import AMAP_CONFIG

# 创建自定义的JSON编码器来处理Decimal类型
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, decimal.Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

app = Flask(__name__)
CORS(app)
app.secret_key = '123456'  # 设置session密钥

# 设置自定义JSON编码器
app.json_encoder = DecimalEncoder

# 设置session的配置
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)  # session有效期7天
app.config['SESSION_COOKIE_SECURE'] = False  # 如果不是HTTPS可以设为False
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# 添加文件上传配置
UPLOAD_FOLDER = 'static/uploads'
RESULT_FOLDER = 'static'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'avi'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# 确保必需的目录存在
def ensure_directories():
    directories = [
        'static',
        'static/uploads',
        'models'
    ]
    for directory in directories:
        os.makedirs(directory, exist_ok=True)

# 在应用启动时创建目录
ensure_directories()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def init_db_user():
    db = DBM.DatabaseManager()
    db.connect()
    # 创建 user 表
    db.create_table("user")


@app.route('/')
def index():
    return render_template('index.html',
                         amap_web_key=AMAP_CONFIG['web_key'],
                         amap_js_key=AMAP_CONFIG['js_key'],
                         amap_security_code=AMAP_CONFIG['security_code'])

@app.route('/login_page')
def login_page():
    return render_template('longin.html')

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
                    
                    session['user_id'] = user_id
                    session['username'] = username
                    session['is_admin'] = user_is_admin
                    
                    # 根据用户类型重定向到不同页面
                    if user_is_admin:
                        return jsonify({'success': True, 'redirect': '/admin'})
                    else:
                        return jsonify({'success': True, 'redirect': '/user'})
                    
            return jsonify({'success': False, 'message': '用户名或密码错误'})
            
        except Exception as e:
            print(f"登录错误: {str(e)}")
            return jsonify({'success': False, 'message': '登录过程出错'})
            
        finally:
            if 'db' in locals():
                db.disconnect()
                
    return jsonify({'success': False, 'message': '不支持的请求方法'})

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('login_page'))

@app.route('/analysis')
def analysis():
    if 'user_id' not in session:
        return redirect(url_for('login_page'))
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

@app.route('/upload_analyze', methods=['POST'])
def upload_analyze():
    if 'file' not in request.files:
        print("错误: 请求中没有文件")
        return jsonify({'success': False, 'message': '没有文件'}), 400
    
    if 'user_id' not in session:
        print("错误: 用户未登录")
        return jsonify({'success': False, 'message': '请先登录'}), 401
    
    try:
        file = request.files['file']
        if file.filename == '':
            print("错误: 未选择文件")
            return jsonify({'success': False, 'message': '未选择文件'}), 400
        
        if file and allowed_file(file.filename):
            # 确保目录存在
            ensure_directories()
            
            # 清理之前的上传文件
            upload_dir = app.config['UPLOAD_FOLDER']
            for old_file in os.listdir(upload_dir):
                old_file_path = os.path.join(upload_dir, old_file)
                if os.path.isfile(old_file_path):
                    try:
                        os.remove(old_file_path)
                    except Exception as e:
                        print(f"警告: 无法删除旧文件 {old_file_path}: {str(e)}")
            
            # 生成带随机数的文件名，避免缓存问题
            import random
            import time
            random_suffix = f"{int(time.time())}_{random.randint(1000, 9999)}"
            filename = secure_filename(file.filename)
            base_name, ext = os.path.splitext(filename)
            unique_filename = f"{base_name}_{random_suffix}{ext}"
            filepath = os.path.join(upload_dir, unique_filename)
            
            # 保存新文件
            file.save(filepath)
            print(f"上传文件已保存为: {filepath}")
            
            # 验证文件是否成功保存
            if not os.path.exists(filepath):
                print(f"错误: 文件保存失败 {filepath}")
                return jsonify({'success': False, 'message': '文件保存失败'}), 500
            
            # 清理之前的结果文件
            for result_file in ['static/results.jpg', 'static/results.mp4', 'static/results.avi']:
                if os.path.exists(result_file):
                    try:
                        os.remove(result_file)
                    except Exception as e:
                        print(f"警告: 无法删除旧结果文件 {result_file}: {str(e)}")
            
            # 调用模型进行预测
            model_path = os.path.join('models3', 'best.pt')
            if not os.path.exists(model_path):
                print(f"错误: 模型文件不存在 {model_path}")
                return jsonify({'success': False, 'message': '模型文件不存在'}), 500
            
            try:
                results, is_video = predict_image(model_path, filepath)
            except Exception as e:
                print(f"预测错误: {str(e)}")
                return jsonify({'success': False, 'message': f'图像分析失败: {str(e)}'}), 500
            
            # 根据文件类型确定结果路径和MIME类型
            if is_video:
                result_path = 'static/results.mp4'
                mime_type = 'video/mp4'
            else:
                result_path = 'static/results.jpg'
                mime_type = 'image/jpeg'
            
            if not os.path.exists(result_path):
                print(f"错误: 生成结果文件失败 {result_path}")
                return jsonify({'success': False, 'message': '生成结果文件失败'}), 500
            
            # 保存分析记录到数据库
            db = DBM.DatabaseManager()
            db.connect()
            
            # 获取检测结果信息
            detect_type = "未知"
            confidence = 0.0
            location = "未指定"
            
            if hasattr(results, 'boxes') and len(results.boxes) > 0:
                # 获取置信度最高的检测结果
                best_box = results.boxes[0]
                confidence = float(best_box.conf[0])
                cls = int(best_box.cls[0])
                class_name = results.names[cls]
                
                # 根据模型输出的类别名称映射到系统使用的类型值
                type_mapping = {
                    'ld': 'zdjy_ld',  # 流动摊位
                    'gd': 'zdjy_gd'   # 固定摊位
                }
                detect_type = type_mapping.get(class_name, class_name)
            
            # 插入记录
            insert_query = """
            INSERT INTO analysis_records 
            (user_id, file_type, file_path, result_path, detect_type, location, confidence)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """
            params = (
                session['user_id'],
                'video' if is_video else 'image',
                filepath,
                result_path,
                detect_type,
                location,
                confidence
            )
            
            try:
                db.update_data(insert_query, params)
            except Exception as e:
                print(f"数据库插入错误: {str(e)}")
                # 继续执行，不要因为数据库错误而阻止用户获取结果
            
            # 更新统计数据
            try:
                today = datetime.now().date()
                
                # 获取当前统计数据
                get_current_stats = """
                SELECT daily_count, total_count 
                FROM detection_stats 
                WHERE user_id = %s AND detection_date = %s
                """
                current_stats = db.query_data(get_current_stats, (session['user_id'], today))
                
                if current_stats:
                    # 更新现有记录
                    update_stats = """
                    UPDATE detection_stats 
                    SET daily_count = daily_count + 1,
                        total_count = total_count + 1
                    WHERE user_id = %s AND detection_date = %s
                    """
                    db.update_data(update_stats, (session['user_id'], today))
                else:
                    # 获取历史总数
                    get_total = """
                    SELECT COALESCE(MAX(total_count), 0) 
                    FROM detection_stats 
                    WHERE user_id = %s
                    """
                    total_result = db.query_data(get_total, (session['user_id'],))
                    previous_total = total_result[0][0] if total_result else 0
                    
                    # 插入新记录
                    insert_stats = """
                    INSERT INTO detection_stats 
                    (user_id, detection_date, daily_count, total_count)
                    VALUES (%s, %s, 1, %s)
                    """
                    db.update_data(insert_stats, (session['user_id'], today, previous_total + 1))
                
                # 获取更新后的统计数据
                get_updated_stats = """
                SELECT daily_count, total_count 
                FROM detection_stats 
                WHERE user_id = %s AND detection_date = %s
                """
                stats_result = db.query_data(get_updated_stats, (session['user_id'], today))
                
                daily_count = stats_result[0][0] if stats_result else 1
                total_count = stats_result[0][1] if stats_result else 1
            except Exception as e:
                print(f"统计数据更新错误: {str(e)}")
                daily_count = 0
                total_count = 0
            
            db.disconnect()
            
            print(f"文件分析成功完成: {filepath} -> {result_path}")
            return jsonify({
                'success': True,
                'message': '分析完成',
                'original_image': f'/static/uploads/{unique_filename}',
                'result_image': f'/{result_path}',
                'is_video': is_video,
                'stats': {
                    'daily_count': daily_count,
                    'total_count': total_count
                }
            })
        else:
            print(f"错误: 不支持的文件类型 {file.filename}")
            allowed_extensions_str = ', '.join(ALLOWED_EXTENSIONS)
            return jsonify({'success': False, 'message': f'不支持的文件类型，请上传 {allowed_extensions_str} 格式'}), 400
            
    except Exception as e:
        print(f"分析错误: {str(e)}")
        return jsonify({'success': False, 'message': f'分析过程出错: {str(e)}'}), 500

@app.route('/static/<path:filename>')
def serve_static(filename):
    response = send_from_directory('static', filename)
    if filename.endswith('.mp4'):
        response.headers['Content-Type'] = 'video/mp4'
    return response

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
    if 'user_id' in session:
        return jsonify({
            'logged_in': True,
            'username': session.get('username', ''),
            'user_id': session.get('user_id'),
            'is_admin': session.get('is_admin', False)
        })
    return jsonify({
        'logged_in': False,
        'message': '用户未登录或 session 已过期'
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
    if 'user_id' not in session:
        return jsonify({'success': False, 'message': '请先登录'}), 401
        
    try:
        db = DBM.DatabaseManager()
        db.connect()
        
        # 获取当前用户最新的分析记录
        query = """
        SELECT * FROM analysis_records 
        WHERE user_id = %s 
        ORDER BY created_at DESC 
        LIMIT 1
        """
        result = db.query_data(query, (session['user_id'],))
        
        if result and len(result) > 0:
            record = result[0]
            # 确保confidence是float类型
            confidence = float(record[7]) if record[7] is not None else None
            
            return jsonify({
                'success': True,
                'data': {
                    'file_type': record[2],
                    'file_path': f'/static/uploads/{os.path.basename(record[3])}',
                    'result_image': f'/{record[4]}',
                    'is_video': record[2] == 'video',
                    'detect_type': record[5],
                    'confidence': confidence
                }
            })
        else:
            return jsonify({'success': False, 'message': '没有分析记录'})
            
    except Exception as e:
        print(f"获取最新结果错误: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500
    finally:
        db.disconnect()

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
        
        # 加载模型
        model_path = os.path.join('models3', 'best.pt')
        if not os.path.exists(model_path):
            return jsonify({'success': False, 'message': '模型文件不存在'})
            
        model = YOLO(model_path)
        
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

@app.route('/api/analysis/chart-data')
def get_chart_data():
    if 'user_id' not in session:
        return jsonify({'trend': {'dates': [], 'counts': []}, 'distribution': []}), 401
        
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
        print(f"获取图表数据错误: {str(e)}")
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
    if 'user_id' not in session or not session.get('is_admin'):
        return redirect(url_for('login_page'))
    return render_template('user_management.html')

@app.route('/api/users', methods=['GET'])
def get_users():
    if 'user_id' not in session or not session.get('is_admin'):
        return jsonify({'success': False, 'message': '未登录或无权限'})
    
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
        return jsonify({'success': False, 'message': '未登录或无权限'})
    
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        is_admin = data.get('is_admin', False)
        
        if not username or not password:
            return jsonify({'success': False, 'message': '用户名和密码不能为空'})
        
        db = DBM.DatabaseManager()
        db.connect()
        
        # 检查用户名是否已存在
        existing_user = db.query_data('SELECT id FROM user WHERE username = %s', (username,))
        if existing_user:
            db.disconnect()
            return jsonify({'success': False, 'message': '用户名已存在'})
        
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
        return jsonify({'success': False, 'message': '未登录或无权限'})
    
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        is_admin = data.get('is_admin', False)
        
        if not username:
            return jsonify({'success': False, 'message': '用户名不能为空'})
        
        db = DBM.DatabaseManager()
        db.connect()
        
        # 检查用户名是否已被其他用户使用
        existing_user = db.query_data(
            'SELECT id FROM user WHERE username = %s AND id != %s',
            (username, user_id)
        )
        if existing_user:
            db.disconnect()
            return jsonify({'success': False, 'message': '用户名已存在'})
        
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
        return jsonify({'success': False, 'message': '未登录或无权限'})
    
    try:
        # 不允许删除自己
        if user_id == session['user_id']:
            return jsonify({'success': False, 'message': '不能删除当前登录用户'})
        
        db = DBM.DatabaseManager()
        db.connect()
        
        # 检查用户是否存在
        user = db.query_data('SELECT id FROM user WHERE id = %s', (user_id,))
        if not user:
            db.disconnect()
            return jsonify({'success': False, 'message': '用户不存在'})
        
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

if __name__ == '__main__':
    try:
        # 创建数据库表
        db = DBM.DatabaseManager()
        db.connect()
        print("数据库连接成功")
        
        # 创建必要的表
        db.create_tables()
        print("数据库表创建成功")
        
        # 检查是否存在默认管理员用户
        result = db.query_data("SELECT COUNT(*) FROM user WHERE username = 'admin'")
        if result and result[0][0] == 0:
            # 创建默认管理员用户
            db.update_data(
                "INSERT INTO user (username, password, is_admin) VALUES (%s, %s, %s)",
                ("admin", "admin", True)
            )
            print("创建默认管理员用户成功")
        
        db.disconnect()
        print("数据库初始化完成")
        
        # 启动应用
        app.run(debug=True, port=8888)
    except Exception as e:
        print(f"启动错误: {str(e)}")