# 数据库配置
DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': '123456',
    'database': 'tiaozhanbei',
    'port': 3369,
    'charset': 'utf8mb4',
    'pool_size': 10,
    'pool_name': 'mysql_pool',
    'pool_reset_session': True,
    'autocommit': True,
    'use_pure': True,
    'connection_timeout': 60,
    'buffered': True,
    'get_warnings': False,
    'raise_on_warnings': False,
    'time_zone': '+8:00'
}

# 高德地图配置
AMAP_CONFIG = {
    'web_key': '9decdfc73fd9e9f474719d5344635a96',
    'js_key': 'bfa29703d862a8c0dd480a3956015990',
    'security_code': '0eabe65c8f32a08b8701a989c93cf45e'
}

# 应用配置
APP_CONFIG = {
    'SECRET_KEY': '123456',  # 用于session加密
    'SESSION_TYPE': 'filesystem',  # session存储类型
    'PERMANENT_SESSION_LIFETIME': 3600,  # session过期时间(秒)
    'UPLOAD_FOLDER': 'static/uploads',  # 上传文件存储目录
    'RESULT_FOLDER': 'static/@results',  # 结果文件存储目录
    'MAX_CONTENT_LENGTH': 16 * 1024 * 1024,  # 最大上传文件大小(16MB)
    'ALLOWED_EXTENSIONS': {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'avi'},  # 允许上传的文件类型
}

# 日志配置
LOG_CONFIG = {
    'filename': 'app.log',
    'level': 'INFO',
    'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
} 