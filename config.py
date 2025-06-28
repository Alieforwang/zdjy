import os

# 数据库配置
DB_CONFIG = {
    'host': os.environ.get('MYSQL_HOST', '127.0.0.1'),
    'user': os.environ.get('MYSQL_USER', 'root'),
    'password': os.environ.get('MYSQL_PASSWORD', '123456'),
    'database': os.environ.get('MYSQL_DATABASE', 'tiaozhanbei'),
    'port': int(os.environ.get('MYSQL_PORT', 3306)),
    'charset': 'utf8mb4',
    'pool_size': 30,
    'pool_name': 'mypool',
    'pool_reset_session': True,
    'autocommit': True,
    'use_pure': True,
    'connection_timeout': 30,
    'buffered': True,
    'get_warnings': True,
    'raise_on_warnings': True,
    'time_zone': '+8:00'
}

# 高德地图配置
AMAP_CONFIG = {
    'web_key': '9decdfc73fd9e9f474719d5344635a96',
    'js_key': 'bfa29703d862a8c0dd480a3956015990',
    'security_code': '0eabe65c8f32a08b8701a989c93cf45e',
    'KEY': '9decdfc73fd9e9f474719d5344635a96',
    'SSL_VERIFY': False,  # 是否验证SSL证书
    'REQUEST_TIMEOUT': 10,  # 请求超时时间(秒)
    'MAX_RETRIES': 3,  # 最大重试次数
    'RETRY_BACKOFF_FACTOR': 0.5,  # 重试间隔因子
    'USE_HTTP_FALLBACK': True  # 当HTTPS失败时是否尝试HTTP
}

# 应用配置
APP_CONFIG = {
    'SECRET_KEY': '123456',  # 用于session加密
    'SESSION_TYPE': 'filesystem',  # session存储类型
    'PERMANENT_SESSION_LIFETIME': 3600,  # session过期时间(秒)
    'UPLOAD_FOLDER': 'static/uploads',  # 上传文件存储目录
    'RESULT_FOLDER': 'static/@results',  # 结果文件存储目录
    'TEMP_FOLDER': 'static/temp',  # 临时文件存储目录
    'MAX_CONTENT_LENGTH': 100 * 1024 * 1024,  # 最大上传文件大小(100MB)
    'ALLOWED_EXTENSIONS': {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'avi'},  # 允许上传的文件类型
    'MODEL_PATH': 'models/best.pt',  # 模型文件路径
    'DETECTION_CONFIDENCE_THRESHOLD': 0.25,  # 检测置信度阈值
}

# 日志配置
LOG_CONFIG = {
    'filename': 'app.log',
    'level': 'INFO',
    'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
}

# Dify API配置
DIFY_CONFIG = {
    'API_KEY': 'app-9HGYkNQbCdy7cuCNMEc6xA9g',
    'API_URL': 'http://8.137.48.26:8000/v1/chat-messages',
    'HEADERS': {
        'Content-Type': 'application/json'
    }
} 