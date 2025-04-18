import redis
import json
import time
import threading
import sys
import os
import logging

# 尝试导入config模块，如果失败则尝试其他路径
try:
    from config import REDIS_CONFIG
except ImportError:
    # 添加项目根目录到sys.path
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
    try:
        from config import REDIS_CONFIG
    except ImportError:
        # 如果还是找不到，使用默认配置
        print("警告: 无法导入config.py中的REDIS_CONFIG，使用默认Redis配置")
        REDIS_CONFIG = {
            'host': '127.0.0.1',
            'port': 6379,
            'db': 0,
            'password': None,
            'socket_timeout': 5,
            'socket_connect_timeout': 5,
            'retry_on_timeout': True,
            'health_check_interval': 30
        }

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# 全局Redis连接实例
redis_client = None
redis_lock = threading.Lock()

# 添加内存缓存作为Redis不可用时的降级方案
class MemoryCache:
    """内存缓存类，用作Redis不可用时的备选方案"""
    
    def __init__(self):
        """初始化内存缓存"""
        self._cache = {}
        self._expires = {}
    
    def set(self, key, value, ex=None, nx=False):
        """
        设置缓存值
        
        Args:
            key: 键
            value: 值
            ex: 过期时间（秒）
            nx: 如果为True，则只在键不存在时设置值
        
        Returns:
            bool: 操作是否成功
        """
        # 如果启用了nx并且键已存在，则不设置
        if nx and key in self._cache:
            if key in self._expires:
                if time.time() > self._expires[key]:
                    # 已过期，可以设置
                    pass
                else:
                    # 未过期，不设置
                    return False
            else:
                # 无过期时间且存在，不设置
                return False
                
        self._cache[key] = value
        if ex is not None:
            self._expires[key] = time.time() + ex
        return True
    
    def get(self, key):
        """
        获取缓存值
        
        Args:
            key: 键
        
        Returns:
            缓存的值，如果不存在或已过期则返回None
        """
        # 检查是否存在且未过期
        if key in self._cache:
            if key in self._expires:
                if time.time() > self._expires[key]:
                    # 已过期，删除并返回None
                    del self._cache[key]
                    del self._expires[key]
                    return None
            return self._cache[key]
        return None
    
    def delete(self, *keys):
        """
        删除缓存值
        
        Args:
            keys: 要删除的键列表
        
        Returns:
            int: 删除的键数量
        """
        count = 0
        for key in keys:
            if key in self._cache:
                del self._cache[key]
                if key in self._expires:
                    del self._expires[key]
                count += 1
        return count
    
    def exists(self, key):
        """
        检查键是否存在且未过期
        
        Args:
            key: 键
        
        Returns:
            bool: 键是否存在且未过期
        """
        if key in self._cache:
            if key in self._expires:
                if time.time() > self._expires[key]:
                    # 已过期，删除并返回False
                    del self._cache[key]
                    del self._expires[key]
                    return False
            return True
        return False
    
    def expire(self, key, seconds):
        """
        设置键的过期时间
        
        Args:
            key: 键
            seconds: 过期时间（秒）
        
        Returns:
            bool: 操作是否成功
        """
        if key in self._cache:
            self._expires[key] = time.time() + seconds
            return True
        return False
    
    def ttl(self, key):
        """
        获取键的剩余生存时间
        
        Args:
            key: 键
        
        Returns:
            int: 剩余秒数，-1表示永不过期，-2表示键不存在
        """
        if key not in self._cache:
            return -2
        if key not in self._expires:
            return -1
        remaining = self._expires[key] - time.time()
        return max(0, int(remaining))
    
    def keys(self, pattern="*"):
        """
        获取匹配模式的键
        
        Args:
            pattern: 匹配模式，支持简单的*通配符
        
        Returns:
            list: 匹配的键列表
        """
        import re
        # 将*转换为正则表达式
        regex_pattern = pattern.replace("*", ".*")
        regex = re.compile(f"^{regex_pattern}$")
        
        # 匹配键并过滤过期键
        result = []
        for key in list(self._cache.keys()):
            if regex.match(key):
                if key in self._expires:
                    if time.time() > self._expires[key]:
                        # 已过期，删除
                        del self._cache[key]
                        del self._expires[key]
                        continue
                result.append(key.encode('utf-8'))  # 返回bytes类型，与Redis一致
        
        return result
    
    def ping(self):
        """
        检查内存缓存是否可用
        
        Returns:
            bool: 始终返回True
        """
        return True
    
    def close(self):
        """清空缓存"""
        self._cache.clear()
        self._expires.clear()
        
    # 添加更多兼容Redis的方法
    def flushall(self):
        """清空所有缓存，兼容Redis"""
        self._cache.clear()
        self._expires.clear()
        return True
        
    def flushdb(self):
        """清空当前数据库，兼容Redis"""
        return self.flushall()
    
    def info(self):
        """返回缓存信息，兼容Redis"""
        return {
            "memory_cache": True,
            "used_memory": sys.getsizeof(self._cache) + sys.getsizeof(self._expires),
            "keys": len(self._cache)
        }
        
    def save(self):
        """保存数据，兼容Redis"""
        return True  # 内存缓存无需保存

# 单例模式获取内存缓存实例
memory_cache_instance = None

def get_memory_cache():
    """获取内存缓存单例实例"""
    global memory_cache_instance
    
    if memory_cache_instance is None:
        memory_cache_instance = MemoryCache()
    
    return memory_cache_instance

# 修改获取Redis客户端函数，添加故障转移到内存缓存
def get_redis_client():
    """获取全局Redis客户端实例，如果不存在则创建"""
    global redis_client
    
    if redis_client is None:
        with redis_lock:
            if redis_client is None:  # 双重检查锁定模式
                try:
                    # 使用配置文件中的Redis配置
                    redis_client = redis.Redis(**REDIS_CONFIG)
                    # 测试连接
                    redis_client.ping()
                    logger.info("Redis连接创建成功")
                except Exception as e:
                    logger.error(f"创建Redis连接错误: {e}")
                    logger.warning("Redis连接失败，将使用内存缓存作为降级方案")
                    # Redis不可用，使用内存缓存
                    redis_client = get_memory_cache()
                    
    return redis_client

class RedisManager:
    """Redis管理器，封装常用的Redis操作"""
    
    def __init__(self):
        """初始化Redis管理器"""
        self.client = get_redis_client()
        self._using_memory_cache = isinstance(self.client, MemoryCache)
        
    def reconnect(self):
        """重新连接Redis"""
        global redis_client
        with redis_lock:
            try:
                if redis_client and not isinstance(redis_client, MemoryCache):
                    try:
                        redis_client.close()
                    except:
                        pass
                redis_client = None
                self.client = get_redis_client()
                self._using_memory_cache = isinstance(self.client, MemoryCache)
                return self.client is not None
            except Exception as e:
                logger.error(f"Redis重新连接失败: {e}")
                return False
    
    def is_connected(self):
        """检查Redis连接是否可用"""
        if self.client is None:
            return False
        try:
            return self.client.ping()
        except:
            return False
    
    def is_using_memory_cache(self):
        """检查是否正在使用内存缓存作为降级方案"""
        return self._using_memory_cache
        
    def set_value(self, key, value, ex=None):
        """
        设置键值对，可选过期时间
        
        Args:
            key (str): 键名
            value (str|dict|list): 值（非字符串会被JSON序列化）
            ex (int, optional): 过期时间（秒）
        
        Returns:
            bool: 操作是否成功
        """
        if self.client is None:
            logger.warning("Redis客户端未连接，无法设置值")
            return False
            
        try:
            # 如果value不是字符串类型，进行JSON序列化
            if not isinstance(value, str):
                value = json.dumps(value, ensure_ascii=False)
                
            return self.client.set(key, value, ex=ex)
        except Exception as e:
            logger.error(f"Redis设置键值对错误: {e}")
            try:
                self.reconnect()
                if self.client:
                    if not isinstance(value, str):
                        value = json.dumps(value, ensure_ascii=False)
                    return self.client.set(key, value, ex=ex)
            except Exception as retry_error:
                logger.error(f"Redis重试设置键值对错误: {retry_error}")
            return False
    
    def get_value(self, key, default=None):
        """
        获取键值
        
        Args:
            key (str): 键名
            default: 默认值，当键不存在时返回
            
        Returns:
            返回键对应的值，如果是JSON格式会自动反序列化
        """
        if self.client is None:
            logger.warning("Redis客户端未连接，无法获取值")
            return default
            
        try:
            value = self.client.get(key)
            if value is None:
                return default
                
            # 尝试JSON反序列化
            try:
                return json.loads(value)
            except:
                # 如果不是JSON格式，返回原始值
                return value.decode('utf-8') if isinstance(value, bytes) else value
        except Exception as e:
            logger.error(f"Redis获取键值错误: {e}")
            try:
                self.reconnect()
                if self.client:
                    value = self.client.get(key)
                    if value is None:
                        return default
                    try:
                        return json.loads(value)
                    except:
                        return value.decode('utf-8') if isinstance(value, bytes) else value
            except Exception as retry_error:
                logger.error(f"Redis重试获取键值错误: {retry_error}")
            return default
    
    def delete_key(self, key):
        """
        删除键
        
        Args:
            key (str): 键名
            
        Returns:
            int: 删除的键数量
        """
        if self.client is None:
            logger.warning("Redis客户端未连接，无法删除键")
            return 0
            
        try:
            return self.client.delete(key)
        except Exception as e:
            logger.error(f"Redis删除键错误: {e}")
            try:
                self.reconnect()
                if self.client:
                    return self.client.delete(key)
            except Exception as retry_error:
                logger.error(f"Redis重试删除键错误: {retry_error}")
            return 0
    
    def exists(self, key):
        """
        检查键是否存在
        
        Args:
            key (str): 键名
            
        Returns:
            bool: 键是否存在
        """
        if self.client is None:
            logger.warning("Redis客户端未连接，无法检查键是否存在")
            return False
            
        try:
            return bool(self.client.exists(key))
        except Exception as e:
            logger.error(f"Redis检查键存在错误: {e}")
            try:
                self.reconnect()
                if self.client:
                    return bool(self.client.exists(key))
            except Exception as retry_error:
                logger.error(f"Redis重试检查键存在错误: {retry_error}")
            return False
    
    def set_expire(self, key, seconds):
        """
        设置键的过期时间
        
        Args:
            key (str): 键名
            seconds (int): 过期时间（秒）
            
        Returns:
            bool: 操作是否成功
        """
        if self.client is None:
            logger.warning("Redis客户端未连接，无法设置过期时间")
            return False
            
        try:
            return self.client.expire(key, seconds)
        except Exception as e:
            logger.error(f"Redis设置过期时间错误: {e}")
            try:
                self.reconnect()
                if self.client:
                    return self.client.expire(key, seconds)
            except Exception as retry_error:
                logger.error(f"Redis重试设置过期时间错误: {retry_error}")
            return False
    
    def get_ttl(self, key):
        """
        获取键的剩余生存时间
        
        Args:
            key (str): 键名
            
        Returns:
            int: 剩余秒数，-1表示永不过期，-2表示键不存在
        """
        if self.client is None:
            logger.warning("Redis客户端未连接，无法获取剩余生存时间")
            return -2
            
        try:
            return self.client.ttl(key)
        except Exception as e:
            logger.error(f"Redis获取剩余生存时间错误: {e}")
            try:
                self.reconnect()
                if self.client:
                    return self.client.ttl(key)
            except Exception as retry_error:
                logger.error(f"Redis重试获取剩余生存时间错误: {retry_error}")
            return -2
    
    def acquire_lock(self, lock_name, acquire_timeout=10, lock_timeout=10):
        """
        获取分布式锁
        
        Args:
            lock_name (str): 锁名称
            acquire_timeout (int): 获取锁的超时时间（秒）
            lock_timeout (int): 锁的有效期（秒）
            
        Returns:
            str|None: 锁的标识符，如果获取失败则返回None
        """
        if self.client is None:
            logger.warning("Redis客户端未连接，无法获取分布式锁")
            return None
            
        identifier = str(time.time()) + "-" + str(threading.current_thread().ident)
        lock_key = f"lock:{lock_name}"
        end = time.time() + acquire_timeout
        
        while time.time() < end:
            try:
                if self.client.set(lock_key, identifier, nx=True, ex=lock_timeout):
                    return identifier
            except Exception as e:
                logger.error(f"Redis获取分布式锁错误: {e}")
                try:
                    self.reconnect()
                except:
                    pass
            
            time.sleep(0.1)
        
        return None
    
    def release_lock(self, lock_name, identifier):
        """
        释放分布式锁
        
        Args:
            lock_name (str): 锁名称
            identifier (str): 锁的标识符
            
        Returns:
            bool: 操作是否成功
        """
        if self.client is None:
            logger.warning("Redis客户端未连接，无法释放分布式锁")
            return False
            
        lock_key = f"lock:{lock_name}"
        try:
            # 确保只删除自己持有的锁
            current_identifier = self.client.get(lock_key)
            if current_identifier and current_identifier.decode('utf-8') == identifier:
                return bool(self.client.delete(lock_key))
            return False
        except Exception as e:
            logger.error(f"Redis释放分布式锁错误: {e}")
            try:
                self.reconnect()
                if self.client:
                    current_identifier = self.client.get(lock_key)
                    if current_identifier and current_identifier.decode('utf-8') == identifier:
                        return bool(self.client.delete(lock_key))
            except Exception as retry_error:
                logger.error(f"Redis重试释放分布式锁错误: {retry_error}")
            return False
    
    def close(self):
        """关闭Redis连接"""
        if self.client:
            try:
                self.client.close()
            except Exception as e:
                logger.error(f"关闭Redis连接错误: {e}")

# 单例模式获取Redis管理器实例
redis_manager_instance = None

def get_redis_manager():
    """获取Redis管理器单例实例"""
    global redis_manager_instance
    
    if redis_manager_instance is None:
        redis_manager_instance = RedisManager()
    
    return redis_manager_instance 