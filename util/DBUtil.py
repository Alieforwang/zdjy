import mysql.connector
from mysql.connector import Error, pooling
import time
import threading

# 全局连接池实例
connection_pool = None
pool_lock = threading.Lock()

def get_connection_pool(pool_size=5, pool_name="mysql_pool"):
    """获取全局连接池实例，如果不存在则创建"""
    global connection_pool
    
    if connection_pool is None:
        with pool_lock:
            if connection_pool is None:  # 双重检查锁定模式
                try:
                    # 配置连接池
                    pool_config = {
                        "host": "127.0.0.1",
                        "user": "root",
                        "password": "123456",
                        "database": "tiaozhanbei",
                        "pool_size": pool_size,
                        "pool_name": pool_name,
                        "pool_reset_session": True,
                        "autocommit": True,
                        "use_pure": True,  # 使用纯Python实现减少内存消耗
                        "connection_timeout": 30,
                        "buffered": True  # 优化查询性能
                    }
                    
                    connection_pool = pooling.MySQLConnectionPool(**pool_config)
                    print(f"MySQL连接池已创建，大小: {pool_size}")
                except Error as e:
                    print(f"创建连接池错误: {e}")
                    raise Exception(f"无法创建数据库连接池: {str(e)}")
    
    return connection_pool

class DatabaseManager():
    def __init__(self, host='localhost', user='root', password='252525zyh', database='tiaozhanbei'):
        self.host = "127.0.0.1"
        self.user = "root"
        self.password = "123456"
        self.database = "tiaozhanbei"
        self.connection = None
        self._use_pool = True  # 默认使用连接池
        self._pool_size = 3    # 默认池大小，适合低内存环境
        
        # 初始化时就确保连接池存在
        if self._use_pool:
            get_connection_pool(self._pool_size)

    def connect(self):
        """从连接池获取连接或直接创建新连接"""
        try:
            if self.connection and hasattr(self.connection, 'is_connected') and self.connection.is_connected():
                return
                
            if self._use_pool:
                # 从连接池获取连接
                pool = get_connection_pool(self._pool_size)
                self.connection = pool.get_connection()
                if hasattr(self.connection, 'is_connected') and self.connection.is_connected():
                    return
            else:
                # 直接创建连接
                self.connection = mysql.connector.connect(
                    host=self.host,
                    user=self.user,
                    password=self.password,
                    database=self.database,
                    use_pure=True,  # 使用纯Python实现减少内存消耗
                    autocommit=True
                )
                
        except Error as e:
            print(f"数据库连接错误: {e}")
            # 连接失败时重试
            max_retries = 3
            for i in range(max_retries):
                try:
                    print(f"尝试重新连接 ({i+1}/{max_retries})...")
                    time.sleep(1)  # 等待1秒再重试
                    if self._use_pool:
                        pool = get_connection_pool(self._pool_size)
                        self.connection = pool.get_connection()
                    else:
                        self.connection = mysql.connector.connect(
                            host=self.host,
                            user=self.user,
                            password=self.password,
                            database=self.database,
                            use_pure=True,
                            autocommit=True
                        )
                    if hasattr(self.connection, 'is_connected') and self.connection.is_connected():
                        print("重新连接成功")
                        return
                except Error as retry_error:
                    print(f"重试连接失败: {retry_error}")
            raise Exception(f"数据库连接失败，已重试{max_retries}次: {str(e)}")

    def disconnect(self):
        """关闭连接，如果使用连接池则将连接归还池中"""
        try:
            if self.connection:
                if hasattr(self.connection, 'is_connected') and self.connection.is_connected():
                    if self._use_pool:
                        self.connection.close()  # 将连接归还池中
                    else:
                        self.connection.close()  # 直接关闭连接
                self.connection = None
        except Error as e:
            print(f"关闭数据库连接错误: {e}")

    def query_data(self, query, params=None):
        """执行SELECT查询"""
        if not self.connection or not hasattr(self.connection, 'is_connected') or not self.connection.is_connected():
            self.connect()
        
        cursor = None
        try:
            cursor = self.connection.cursor(buffered=True)
            cursor.execute(query, params)
            result = cursor.fetchall()
            return result
        except Error as e:
            print(f"查询执行错误: {e}")
            print(f"查询语句: {query}")
            if params:
                print(f"参数: {params}")
            # 尝试重新连接并重试
            try:
                self.disconnect()
                self.connect()
                if cursor:
                    cursor.close()
                cursor = self.connection.cursor(buffered=True)
                cursor.execute(query, params)
                result = cursor.fetchall()
                return result
            except Error as retry_error:
                print(f"重试查询失败: {retry_error}")
                raise Exception(f"数据库查询失败: {str(e)}")
        finally:
            if cursor:
                cursor.close()

    def update_data(self, query, params=None):
        """执行INSERT/UPDATE操作"""
        if not self.connection or not hasattr(self.connection, 'is_connected') or not self.connection.is_connected():
            self.connect()
            
        cursor = None
        try:
            cursor = self.connection.cursor()
            cursor.execute(query, params)
            if not self._use_pool:  # 如果使用连接池，autocommit已启用
                self.connection.commit()
            affected_rows = cursor.rowcount
            return affected_rows
        except Error as e:
            print(f"更新执行错误: {e}")
            print(f"更新语句: {query}")
            if params:
                print(f"参数: {params}")
            if not self._use_pool:
                self.connection.rollback()
            # 尝试重新连接并重试
            try:
                self.disconnect()
                self.connect()
                if cursor:
                    cursor.close()
                cursor = self.connection.cursor()
                cursor.execute(query, params)
                if not self._use_pool:
                    self.connection.commit()
                affected_rows = cursor.rowcount
                return affected_rows
            except Error as retry_error:
                print(f"重试更新失败: {retry_error}")
                raise Exception(f"数据库更新失败: {str(e)}")
        finally:
            if cursor:
                cursor.close()

    def delete_data(self, query, params=None):
        """执行DELETE操作"""
        return self.update_data(query, params)
    
    def create_table(self, table_name):
        # 检查表是否存在的SQL语句
        check_table_exists_query = """
        SELECT COUNT(*)
        FROM information_schema.tables 
        WHERE table_schema = %s AND table_name = %s;
        """
        params = (self.database, table_name)
        
        # 查询表是否存在
        result = self.query_data(check_table_exists_query, params)
        
        if result and result[0][0] == 0:
            # 如果表不存在，根据表名创建不同的表
            if table_name == "user":
                create_table_query = """
                CREATE TABLE user (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(255) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    is_admin BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """
            else:
                raise ValueError(f"未定义表 '{table_name}' 的创建语句")
                
            # 调用update_data函数来创建表
            self.update_data(create_table_query, None)
            print(f"表 '{table_name}' 已创建")
        else:
            print(f"表 '{table_name}' 已存在")

    def execute_query(self, query, params=None):
        """执行任意SQL查询，可用于创建表等DDL操作"""
        return self.update_data(query, params)

    def create_tables(self):
        """创建所有必需的表"""
        try:
            # 创建用户表
            self.execute_query("""
                CREATE TABLE IF NOT EXISTS user (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(255) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    is_admin BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # 创建分析记录表
            self.execute_query("""
                CREATE TABLE IF NOT EXISTS analysis_records (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    file_type VARCHAR(50),
                    file_path VARCHAR(255),
                    result_path VARCHAR(255),
                    detect_type VARCHAR(50),
                    location VARCHAR(255),
                    confidence DECIMAL(5,4),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES user(id)
                )
            """)
            
            # 创建检测统计表
            self.execute_query("""
                CREATE TABLE IF NOT EXISTS detection_stats (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    detection_date DATE NOT NULL,
                    daily_count INT DEFAULT 0,
                    total_count INT DEFAULT 0,
                    FOREIGN KEY (user_id) REFERENCES user(id),
                    UNIQUE KEY unique_user_date (user_id, detection_date)
                )
            """)
            
            print("数据库表创建成功")
            
        except Exception as e:
            print(f"创建表错误: {str(e)}")
            raise e

    def close_all_connections(self):
        """关闭所有数据库连接(开发/测试环境使用)"""
        global connection_pool
        if connection_pool:
            try:
                # 尝试关闭所有连接池中的连接
                for cnx in connection_pool._cnx_queue.queue:
                    if hasattr(cnx, 'is_connected') and cnx.is_connected():
                        cnx.close()
                print("已关闭所有连接池中的连接")
            except Exception as e:
                print(f"关闭连接池中的连接时出错: {e}")
        
        # 重置连接池
        connection_pool = None