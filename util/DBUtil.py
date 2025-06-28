import mysql.connector
from mysql.connector import Error, pooling
import time
import threading
import os
import sys

# 尝试导入config模块，如果失败则尝试其他路径
try:
    from config import DB_CONFIG
except ImportError:
    # 添加项目根目录到sys.path
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    try:
        from config import DB_CONFIG
    except ImportError:
        # 如果还是找不到，使用默认配置
        print("警告: 无法导入config.py，使用默认数据库配置")
        DB_CONFIG = {
            'host': '127.0.0.1',
            'user': 'root',
            'password': '123456',
            'database': 'tiaozhanbei',
            'charset': 'utf8mb4',
            'pool_size': 10,
            'pool_name': 'mysql_pool',
            'pool_reset_session': True,
            'autocommit': True,
            'use_pure': True
        }

# 全局连接池实例
connection_pool = None
pool_lock = threading.Lock()
# 添加全局重置标志，防止多次重置
pool_resetting = False

def get_connection_pool(pool_size=10, pool_name="mysql_pool"):
    """获取全局连接池实例，如果不存在则创建"""
    global connection_pool
    
    if connection_pool is None:
        with pool_lock:
            if connection_pool is None:  # 双重检查锁定模式
                try:
                    # 使用配置文件中的连接池配置
                    pool_config = DB_CONFIG.copy()
                    pool_config.update({
                        "pool_size": pool_size,
                        "pool_name": pool_name,
                        "pool_reset_session": True,
                        "autocommit": True
                    })
                    
                    connection_pool = pooling.MySQLConnectionPool(**pool_config)
                    print(f"MySQL连接池已创建，大小: {pool_size}")
                except Error as e:
                    print(f"创建连接池错误: {e}")
                    raise Exception(f"无法创建数据库连接池: {str(e)}")
    
    return connection_pool

class DatabaseManager():
    def __init__(self):
        """
        初始化数据库管理器，使用config.py中的DB_CONFIG配置
        """
        # 使用config.py中的配置值
        self.host = DB_CONFIG['host']
        self.user = DB_CONFIG['user']
        self.password = DB_CONFIG['password']
        self.database = DB_CONFIG['database']
        self.connection = None
        self._use_pool = True  # 默认使用连接池
        self._pool_size = DB_CONFIG['pool_size']   # 使用配置文件中的池大小
        self._connection_lifetime = 1800  # 连接生命周期(30分钟)
        self._last_connection_time = 0  # 上次获取连接的时间
        
        # 初始化时就确保连接池存在
        if self._use_pool:
            get_connection_pool(self._pool_size)

    def _should_reconnect(self):
        """检查是否需要重新获取连接"""
        if not self.connection:
            return True
        
        # 检查连接是否超过生命周期
        current_time = time.time()
        if current_time - self._last_connection_time > self._connection_lifetime:
            return True
            
        # 检查连接是否有效
        try:
            if not hasattr(self.connection, 'is_connected') or not self.connection.is_connected():
                return True
            cursor = self.connection.cursor()
            cursor.execute("SELECT 1")
            cursor.fetchone()
            cursor.close()
            return False
        except:
            return True

    def connect(self):
        """从连接池获取连接或直接创建新连接"""
        try:
            if not self._should_reconnect():
                return
                
            # 先确保旧连接已关闭
            self.disconnect()
            
            if self._use_pool:
                # 从连接池获取连接
                pool = get_connection_pool(self._pool_size)
                # 添加重试逻辑获取连接
                retries = 3
                for attempt in range(retries):
                    try:
                        self.connection = pool.get_connection()
                        self._last_connection_time = time.time()
                        if not hasattr(self.connection, 'is_connected') or not self.connection.is_connected():
                            raise Error("获取的连接无效")
                        break
                    except Error as e:
                        if attempt < retries - 1:
                            print(f"获取连接失败，正在重试 ({attempt+1}/{retries}): {e}")
                            time.sleep(1)  # 等待1秒再重试
                        else:
                            raise  # 重试耗尽，抛出异常
            else:
                # 直接创建连接
                connection_config = {k: v for k, v in DB_CONFIG.items() 
                                  if k not in ['pool_size', 'pool_name', 'pool_reset_session']}
                self.connection = mysql.connector.connect(**connection_config)
                self._last_connection_time = time.time()
                
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
                        connection_config = {k: v for k, v in DB_CONFIG.items() 
                                          if k not in ['pool_size', 'pool_name', 'pool_reset_session']}
                        self.connection = mysql.connector.connect(**connection_config)
                    self._last_connection_time = time.time()
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
                try:
                    if hasattr(self.connection, 'is_connected') and self.connection.is_connected():
                        self.connection.close()
                except:
                    pass  # 忽略关闭时的错误
                finally:
                    self.connection = None
                    self._last_connection_time = 0
        except:
            self.connection = None
            self._last_connection_time = 0

    def query_data(self, query, params=None):
        """执行SELECT查询"""
        if self._should_reconnect():
            self.connect()
        
        cursor = None
        try:
            cursor = self.connection.cursor(buffered=True)
            cursor.execute(query, params or ())
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
                cursor.execute(query, params or ())
                result = cursor.fetchall()
                return result
            except Error as retry_error:
                print(f"重试查询失败: {retry_error}")
                raise Exception(f"数据库查询失败: {str(e)}")
        finally:
            if cursor:
                try:
                    cursor.close()
                except:
                    pass  # 忽略关闭cursor时的错误

    def update_data(self, query, params=None):
        """执行INSERT/UPDATE操作"""
        if self._should_reconnect():
            self.connect()
            
        cursor = None
        try:
            cursor = self.connection.cursor()
            cursor.execute("SET sql_notes = 0")
            
            if not isinstance(query, str):
                query = str(query)
                
            cursor.execute(query, params or ())
            if not self._use_pool and self.connection:
                self.connection.commit()
            affected_rows = cursor.rowcount
            
            cursor.execute("SET sql_notes = 1")
            return affected_rows
        except Error as e:
            print(f"更新执行错误: {e}")
            print(f"更新语句: {query}")
            if params:
                print(f"参数: {params}")
            if not self._use_pool and self.connection:
                try:
                    self.connection.rollback()
                except:
                    pass
            # 尝试重新连接并重试
            try:
                self.disconnect()
                self.connect()
                if cursor:
                    cursor.close()
                cursor = self.connection.cursor()
                cursor.execute("SET sql_notes = 0")
                
                if not isinstance(query, str):
                    query = str(query)
                    
                cursor.execute(query, params or ())
                cursor.execute("SET sql_notes = 1")
                
                if not self._use_pool and self.connection:
                    self.connection.commit()
                affected_rows = cursor.rowcount
                return affected_rows
            except Error as retry_error:
                print(f"重试更新失败: {retry_error}")
                raise Exception(f"数据库更新失败: {str(e)}")
        finally:
            if cursor:
                try:
                    cursor.close()
                except:
                    pass  # 忽略关闭cursor时的错误

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
        if isinstance(query, str):
            return self.update_data(query, params)
        else:
            print(f"警告: 查询不是字符串类型: {type(query)}")
            # 尝试转换为字符串
            try:
                query_str = str(query)
                return self.update_data(query_str, params)
            except Exception as e:
                print(f"转换查询为字符串失败: {str(e)}")
                raise

    def create_tables(self):
        """创建所有必需的表"""
        try:
            # 关闭外键检查，避免创建表时的外键约束问题
            self.update_data("SET FOREIGN_KEY_CHECKS = 0")
            
            # 创建用户表
            user_table_sql = """
                CREATE TABLE IF NOT EXISTS user (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(255) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    is_admin BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """
            try:
                self.execute_query(user_table_sql)
                print("用户表创建或已存在")
            except Exception as e:
                print(f"创建用户表错误: {str(e)}")
            
            # 创建分析记录表
            analysis_table_sql = """
                CREATE TABLE IF NOT EXISTS analysis_records (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    file_type VARCHAR(50),
                    file_path VARCHAR(255),
                    result_path VARCHAR(255),
                    result_folder VARCHAR(255) DEFAULT 'static/@results',
                    detect_type VARCHAR(50),
                    confidence DECIMAL(5,4),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES user(id)
                )
            """
            try:
                self.execute_query(analysis_table_sql)
                print("分析记录表创建或已存在")
            except Exception as e:
                print(f"创建分析记录表错误: {str(e)}")
            
            # 创建检测统计表
            stats_table_sql = """
                CREATE TABLE IF NOT EXISTS detection_stats (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    detection_date DATE NOT NULL,
                    daily_count INT DEFAULT 0,
                    total_count INT DEFAULT 0,
                    FOREIGN KEY (user_id) REFERENCES user(id),
                    UNIQUE KEY unique_user_date (user_id, detection_date)
                )
            """
            try:
                self.execute_query(stats_table_sql)
                print("检测统计表创建或已存在")
            except Exception as e:
                print(f"创建检测统计表错误: {str(e)}")
                
            # 恢复外键检查    
            self.update_data("SET FOREIGN_KEY_CHECKS = 1")
            
            print("数据库表创建成功")
            
        except Exception as e:
            print(f"创建表错误: {str(e)}")
            # 不再抛出异常，让应用继续运行
            # raise e

    def close_all_connections(self):
        """尝试关闭所有连接并清理资源"""
        try:
            # 关闭当前连接
            self.disconnect()
            
            # 尝试关闭连接池中的所有连接
            global connection_pool
            if connection_pool:
                # 尝试获取池中所有连接并关闭
                print("正在关闭连接池中的所有连接...")
                try:
                    # 直接访问连接池的内部队列（不推荐但在清理时有效）
                    if hasattr(connection_pool, '_cnx_queue'):
                        for cnx in list(connection_pool._cnx_queue.queue):
                            try:
                                if hasattr(cnx, 'is_connected') and cnx.is_connected():
                                    cnx.close()
                            except Exception as e:
                                print(f"关闭池中连接时出错: {str(e)}")
                except Exception as e:
                    print(f"清理连接池时出错: {str(e)}")
        except Exception as e:
            print(f"关闭所有连接时出错: {str(e)}")

# 添加一个定期清理连接池的函数
def reset_connection_pool():
    """重置全局连接池，关闭所有连接并创建新的连接池"""
    global connection_pool, pool_lock, pool_resetting
    
    # 如果已经在重置中，则立即返回
    if pool_resetting:
        print("警告: 连接池已经在重置中，跳过本次重置操作")
        return False
        
    # 设置超时机制
    timeout = 30  # 最多等待30秒
    start_time = time.time()
    
    # 尝试获取锁，带超时
    acquired = pool_lock.acquire(timeout=5)  # 最多等待5秒获取锁
    if not acquired:
        print("警告: 无法获取连接池锁，跳过重置操作")
        return False
    
    try:
        # 设置正在重置标志
        pool_resetting = True
        
        if connection_pool:
            try:
                print("正在重置数据库连接池...")
                
                # 创建临时连接池以保障服务
                temp_config = DB_CONFIG.copy()
                temp_config.update({
                    "pool_size": 5,
                    "pool_name": "temp_mysql_pool"
                })
                
                try:
                    temp_pool = pooling.MySQLConnectionPool(**temp_config)
                    print("已创建临时连接池")
                except Error as e:
                    print(f"创建临时连接池失败: {str(e)}")
                    temp_pool = None
                
                # 尝试关闭池中所有连接，使用超时机制
                if hasattr(connection_pool, '_cnx_queue'):
                    connection_count = 0
                    connection_closed = 0
                    
                    # 将队列转为列表处理，避免在迭代过程中修改队列
                    connections_to_close = list(connection_pool._cnx_queue.queue)
                    connection_count = len(connections_to_close)
                    
                    for cnx in connections_to_close:
                        # 检查是否超时
                        if time.time() - start_time > timeout:
                            print(f"警告: 关闭连接超时，已处理 {connection_closed}/{connection_count} 个连接")
                            break
                            
                        try:
                            if hasattr(cnx, 'is_connected') and cnx.is_connected():
                                cnx.close()
                                connection_closed += 1
                        except Exception as e:
                            print(f"关闭连接失败: {str(e)}")
                    
                    print(f"已关闭 {connection_closed}/{connection_count} 个连接")
                
                # 清空连接池引用，让垃圾回收器处理它
                connection_pool = None
                
                # 强制垃圾回收
                import gc
                gc.collect()
                
                # 重新创建连接池
                pool_size = DB_CONFIG.get('pool_size', 10)
                new_pool = pooling.MySQLConnectionPool(**DB_CONFIG)
                connection_pool = new_pool
                print(f"数据库连接池已重置，新池大小: {pool_size}")
                
                # 如果创建了临时池，关闭它
                if temp_pool:
                    if hasattr(temp_pool, '_cnx_queue'):
                        for cnx in list(temp_pool._cnx_queue.queue):
                            try:
                                if hasattr(cnx, 'is_connected') and cnx.is_connected():
                                    cnx.close()
                            except:
                                pass
                    print("临时连接池已释放")
                
                return True
            except Exception as e:
                print(f"重置连接池时出错: {str(e)}")
                # 确保出错时仍然创建新连接池
                try:
                    connection_pool = pooling.MySQLConnectionPool(**DB_CONFIG)
                    print("尽管出错，仍然重新创建了连接池")
                except:
                    print("无法恢复连接池，请检查数据库服务")
                return False
    finally:
        # 重置标志并释放锁
        pool_resetting = False
        pool_lock.release()
        print(f"连接池重置操作完成，总耗时: {time.time() - start_time:.2f}秒")
    
    return False

# 用户管理相关方法
def get_all_users(self):
    """
    获取所有用户的列表
    
    返回值:
        用户列表，每个用户包含id、username、is_admin和created_at字段
    """
    try:
        query = """
            SELECT id, username, is_admin, created_at 
            FROM user 
            ORDER BY id ASC
        """
        results = self.execute_query(query)
        
        users = []
        for row in results:
            users.append({
                'id': row[0],
                'username': row[1],
                'is_admin': bool(row[2]),
                'created_at': row[3]
            })
        
        return users
    except Exception as e:
        self.logger.error(f"获取用户列表错误: {str(e)}")
        raise Exception(f"获取用户列表错误: {str(e)}")

def get_user_by_id(self, user_id):
    """
    根据ID获取用户信息
    
    参数:
        user_id: 用户ID
    
    返回值:
        包含用户信息的字典，如果用户不存在则返回None
    """
    try:
        query = """
            SELECT id, username, is_admin, created_at 
            FROM user 
            WHERE id = %s
        """
        results = self.execute_query(query, (user_id,))
        
        if results:
            row = results[0]
            return {
                'id': row[0],
                'username': row[1],
                'is_admin': bool(row[2]),
                'created_at': row[3]
            }
        
        return None
    except Exception as e:
        self.logger.error(f"根据ID获取用户错误: {str(e)}")
        raise Exception(f"根据ID获取用户错误: {str(e)}")

def get_user_by_username(self, username):
    """
    根据用户名获取用户信息
    
    参数:
        username: 用户名
    
    返回值:
        包含用户信息的字典，如果用户不存在则返回None
    """
    try:
        query = """
            SELECT id, username, is_admin, created_at 
            FROM user 
            WHERE username = %s
        """
        results = self.execute_query(query, (username,))
        
        if results:
            row = results[0]
            return {
                'id': row[0],
                'username': row[1],
                'is_admin': bool(row[2]),
                'created_at': row[3]
            }
        
        return None
    except Exception as e:
        self.logger.error(f"根据用户名获取用户错误: {str(e)}")
        raise Exception(f"根据用户名获取用户错误: {str(e)}")

def create_user(self, username, password, is_admin=False):
    """
    创建新用户
    
    参数:
        username: 用户名
        password: 密码（明文，将会被加密）
        is_admin: 是否为管理员用户，默认为False
    
    返回值:
        新创建用户的ID
    """
    try:
        # 密码加密
        hashed_password = self.hash_password(password)
        
        query = """
            INSERT INTO user (username, password, is_admin, created_at) 
            VALUES (%s, %s, %s, NOW())
        """
        
        # 执行插入操作
        cursor = self.execute_update(query, (username, hashed_password, is_admin))
        user_id = cursor.lastrowid
        
        return user_id
    except Exception as e:
        self.logger.error(f"创建用户错误: {str(e)}")
        raise Exception(f"创建用户错误: {str(e)}")

def update_user(self, user_id, username, password=None, is_admin=False):
    """
    更新用户信息
    
    参数:
        user_id: 用户ID
        username: 新的用户名
        password: 新的密码（如果不提供则不更新密码）
        is_admin: 是否为管理员用户
    
    返回值:
        是否更新成功
    """
    try:
        # 如果提供了新密码，则更新用户名、密码和管理员状态
        if password:
            hashed_password = self.hash_password(password)
            query = """
                UPDATE user 
                SET username = %s, password = %s, is_admin = %s 
                WHERE id = %s
            """
            self.execute_update(query, (username, hashed_password, is_admin, user_id))
        # 否则只更新用户名和管理员状态
        else:
            query = """
                UPDATE user 
                SET username = %s, is_admin = %s 
                WHERE id = %s
            """
            self.execute_update(query, (username, is_admin, user_id))
        
        return True
    except Exception as e:
        self.logger.error(f"更新用户错误: {str(e)}")
        raise Exception(f"更新用户错误: {str(e)}")

def delete_user(self, user_id):
    """
    删除用户
    
    参数:
        user_id: 要删除的用户ID
    
    返回值:
        是否删除成功
    """
    try:
        query = "DELETE FROM user WHERE id = %s"
        self.execute_update(query, (user_id,))
        return True
    except Exception as e:
        self.logger.error(f"删除用户错误: {str(e)}")
        raise Exception(f"删除用户错误: {str(e)}")

def hash_password(self, password):
    """
    对密码进行哈希加密
    
    参数:
        password: 明文密码
    
    返回值:
        加密后的密码
    """
    import hashlib
    # 简单的MD5加密，实际应用中应使用更安全的算法如bcrypt
    return hashlib.md5(password.encode()).hexdigest()

def verify_password(self, password, stored_password):
    """
    验证密码是否匹配
    
    参数:
        password: 用户输入的明文密码
        stored_password: 数据库中存储的密码（可能是哈希值）
    
    返回值:
        密码是否匹配
    """
    # 如果数据库中的密码是明文存储的（不建议），直接比较
    if len(stored_password) < 32:  # 不是MD5哈希
        return password == stored_password
    
    # 如果是哈希存储，对输入密码进行哈希后比较
    import hashlib
    hashed_input = hashlib.md5(password.encode()).hexdigest()
    return hashed_input == stored_password