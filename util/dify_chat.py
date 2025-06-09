import requests
import json
import time
import logging
import re
import uuid
from config import DIFY_CONFIG

# 配置日志
logger = logging.getLogger(__name__)

# 从配置文件获取API配置
API_KEY = DIFY_CONFIG['API_KEY']
url = DIFY_CONFIG['API_URL']

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

# 存储会话ID映射关系
conversation_id_mapping = {}

def is_valid_uuid(value):
    """检查是否是有效的UUID格式"""
    try:
        uuid_obj = uuid.UUID(str(value))
        return True
    except (ValueError, AttributeError, TypeError):
        return False

def send_message_streaming(query, conversation_id=None, debug=False):
    """发送对话消息并以流式方式返回结果"""
    # 准备请求数据
    data = {
        "inputs": {},
        "query": query,
        "response_mode": "streaming",  # 使用流式响应模式
        "user": "abc-123"
    }
    
    # 处理会话ID - Dify要求必须是UUID格式
    dify_conversation_id = None
    
    # 如果前端传入了会话ID
    if conversation_id and conversation_id != "new":
        # 检查是否已经有映射关系
        if conversation_id in conversation_id_mapping:
            dify_conversation_id = conversation_id_mapping[conversation_id]
            logger.info(f"使用映射的Dify会话ID: {dify_conversation_id}")
        else:
            # 检查是否是有效的UUID格式
            if is_valid_uuid(conversation_id):
                dify_conversation_id = conversation_id
                logger.info(f"使用原始UUID格式会话ID: {dify_conversation_id}")
            else:
                logger.info(f"收到非UUID格式会话ID: {conversation_id}，将创建新会话")
                # 不设置会话ID，让Dify创建新的
    
    # 如果有有效的Dify会话ID，添加到请求中
    if dify_conversation_id:
        data["conversation_id"] = dify_conversation_id
    
    # 记录请求详情
    logger.info(f"发送流式请求到Dify: {json.dumps(data, ensure_ascii=False)}")
    
    if debug:
        print(f"\n发送请求: {json.dumps(data, ensure_ascii=False)}")
    
    try:
        # 使用流式请求
        response = requests.post(url, headers=headers, json=data, stream=True, timeout=30)
        
        logger.info(f"Dify流式响应状态码: {response.status_code}")
        
        if debug:
            print(f"状态码: {response.status_code}")
            if response.status_code != 200:
                print(f"响应内容: {response.text}")
                yield {"error": response.text}
                return
        
        if response.status_code == 200:
            # 处理流式响应
            if debug:
                print("\n助手: ", end="", flush=True)
            
            new_dify_conversation_id = None
            
            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    if line.startswith("data: "):
                        data_str = line[6:]  # 移除 "data: " 前缀
                        try:
                            chunk_data = json.loads(data_str)
                            event = chunk_data.get("event")
                            
                            if event in ["message", "agent_message"]:
                                # 处理消息事件
                                answer_chunk = chunk_data.get("answer", "")
                                if answer_chunk:
                                    if debug:
                                        print(answer_chunk, end="", flush=True)
                                    
                                    # 创建一个包含块信息的字典并返回
                                    yield {
                                        "answer_chunk": answer_chunk
                                    }
                                
                                # 获取会话ID
                                if chunk_data.get("conversation_id"):
                                    new_dify_conversation_id = chunk_data.get("conversation_id")
                                    yield {
                                        "conversation_id": new_dify_conversation_id
                                    }
                            
                            elif event == "message_end":
                                # 处理消息结束事件
                                if chunk_data.get("conversation_id"):
                                    new_dify_conversation_id = chunk_data.get("conversation_id")
                                    yield {
                                        "conversation_id": new_dify_conversation_id
                                    }
                                
                                if debug:
                                    metadata = chunk_data.get("metadata", {})
                                    if metadata:
                                        usage = metadata.get("usage", {})
                                        if usage:
                                            print(f"\n\nToken使用量: {usage.get('total_tokens', 0)}")
                            
                            elif event == "error":
                                # 处理错误事件
                                error_msg = chunk_data.get("message", "")
                                logger.error(f"Dify返回错误事件: {error_msg}")
                                if debug:
                                    print(f"\n错误: {error_msg}")
                                yield {"error": error_msg}
                                
                        except json.JSONDecodeError:
                            logger.warning(f"无法解析JSON: {data_str}")
                            if debug:
                                print(f"\n无法解析JSON: {data_str}")
                            yield {"error": f"无法解析JSON: {data_str}"}
            
            # 如果获取到了新的Dify会话ID，更新映射关系
            if new_dify_conversation_id and conversation_id and conversation_id != "new":
                conversation_id_mapping[conversation_id] = new_dify_conversation_id
                logger.info(f"更新会话ID映射: {conversation_id} -> {new_dify_conversation_id}")
        else:
            # 记录错误响应
            error_msg = f"Dify服务返回错误: HTTP {response.status_code}"
            try:
                error_data = response.json()
                if 'message' in error_data:
                    error_msg += f" - {error_data['message']}"
            except:
                try:
                    error_msg += f" - {response.text[:100]}"
                except:
                    pass
            
            logger.error(error_msg)
            if debug:
                print(f"\n错误: {error_msg}")
            
            yield {"error": error_msg}
            
    except requests.exceptions.RequestException as e:
        error_msg = f"连接Dify服务失败: {str(e)}"
        logger.error(error_msg)
        if debug:
            print(f"\n请求异常: {error_msg}")
        yield {"error": error_msg}
    except Exception as e:
        error_msg = f"处理Dify响应时出错: {str(e)}"
        logger.error(error_msg)
        if debug:
            print(f"\n处理异常: {error_msg}")
        yield {"error": error_msg}

# 保留原来的函数以保持向后兼容
def send_message(query, conversation_id=None, debug=False):
    """发送对话消息，支持会话连续性"""
    # 准备请求数据
    data = {
        "inputs": {},
        "query": query,
        "response_mode": "streaming",  # 使用流式响应模式，Dify不支持阻塞模式
        "user": "abc-123"
    }
    
    # 处理会话ID - Dify要求必须是UUID格式
    dify_conversation_id = None
    
    # 如果前端传入了会话ID
    if conversation_id and conversation_id != "new":
        # 检查是否已经有映射关系
        if conversation_id in conversation_id_mapping:
            dify_conversation_id = conversation_id_mapping[conversation_id]
            logger.info(f"使用映射的Dify会话ID: {dify_conversation_id}")
        else:
            # 检查是否是有效的UUID格式
            if is_valid_uuid(conversation_id):
                dify_conversation_id = conversation_id
                logger.info(f"使用原始UUID格式会话ID: {dify_conversation_id}")
            else:
                logger.info(f"收到非UUID格式会话ID: {conversation_id}，将创建新会话")
                # 不设置会话ID，让Dify创建新的
    
    # 如果有有效的Dify会话ID，添加到请求中
    if dify_conversation_id:
        data["conversation_id"] = dify_conversation_id
    
    # 记录请求详情
    logger.info(f"发送请求到Dify: {json.dumps(data, ensure_ascii=False)}")
    
    if debug:
        print(f"\n发送请求: {json.dumps(data, ensure_ascii=False)}")
    
    try:
        # 使用流式请求
        response = requests.post(url, headers=headers, json=data, stream=True, timeout=30)
        
        logger.info(f"Dify响应状态码: {response.status_code}")
        
        if debug:
            print(f"状态码: {response.status_code}")
            if response.status_code != 200:
                print(f"响应内容: {response.text}")
        
        if response.status_code == 200:
            # 处理流式响应
            if debug:
                print("\n助手: ", end="", flush=True)
                
            full_answer = ""
            new_dify_conversation_id = None
            
            for line in response.iter_lines():
                if line:
                    line = line.decode('utf-8')
                    if line.startswith("data: "):
                        data_str = line[6:]  # 移除 "data: " 前缀
                        try:
                            chunk_data = json.loads(data_str)
                            event = chunk_data.get("event")
                            
                            if event in ["message", "agent_message"]:
                                # 处理消息事件
                                answer_chunk = chunk_data.get("answer", "")
                                if answer_chunk:
                                    full_answer += answer_chunk
                                    if debug:
                                        print(answer_chunk, end="", flush=True)
                                
                                # 获取会话ID
                                if chunk_data.get("conversation_id"):
                                    new_dify_conversation_id = chunk_data.get("conversation_id")
                                
                            elif event == "message_end":
                                # 处理消息结束事件
                                if chunk_data.get("conversation_id"):
                                    new_dify_conversation_id = chunk_data.get("conversation_id")
                                
                                if debug:
                                    metadata = chunk_data.get("metadata", {})
                                    if metadata:
                                        usage = metadata.get("usage", {})
                                        if usage:
                                            print(f"\n\nToken使用量: {usage.get('total_tokens', 0)}")
                            
                            elif event == "error":
                                # 处理错误事件
                                error_msg = chunk_data.get("message", "")
                                logger.error(f"Dify返回错误事件: {error_msg}")
                                if debug:
                                    print(f"\n错误: {error_msg}")
                                return None, None
                                
                        except json.JSONDecodeError:
                            logger.warning(f"无法解析JSON: {data_str}")
                            if debug:
                                print(f"\n无法解析JSON: {data_str}")
            
            if debug:
                print()  # 换行
            
            # 如果获取到了新的Dify会话ID，更新映射关系
            if new_dify_conversation_id and conversation_id and conversation_id != "new":
                conversation_id_mapping[conversation_id] = new_dify_conversation_id
                logger.info(f"更新会话ID映射: {conversation_id} -> {new_dify_conversation_id}")
            
            # 记录成功响应
            logger.info(f"成功获取回复，Dify会话ID: {new_dify_conversation_id}")
            
            # 返回前端需要的会话ID（保持一致性）和回答
            return conversation_id or new_dify_conversation_id, full_answer
        else:
            # 记录错误响应
            error_msg = f"Dify服务返回错误: HTTP {response.status_code}"
            try:
                error_data = response.json()
                if 'message' in error_data:
                    error_msg += f" - {error_data['message']}"
            except:
                try:
                    error_msg += f" - {response.text[:100]}"
                except:
                    pass
            
            logger.error(error_msg)
            print(f"\n错误: {error_msg}")
            
            return None, None
    except requests.exceptions.RequestException as e:
        error_msg = f"连接Dify服务失败: {str(e)}"
        logger.error(error_msg)
        print(f"\n请求异常: {error_msg}")
        return None, None
    except Exception as e:
        error_msg = f"处理Dify响应时出错: {str(e)}"
        logger.error(error_msg)
        print(f"\n处理异常: {error_msg}")
        return None, None
    
#添加一个用于ai界面用户输入语音转文字的函数
def voice_to_text(audio_data):
    """将语音数据转换为文字"""
    # 使用讯飞语音识别
    text = xunfei_asr.asr(audio_data)
    return text




def main():
    print("Dify 对话应用")
    print("=" * 20)
    
    conversation_id = None
    chat_history = []
    debug_mode = False
    
    print("\n输入'退出'结束对话，输入'调试'切换调试模式")
    
    while True:
        query = input("\n用户: ")
        
        if query.lower() in ['退出', 'exit', 'quit']:
            break
            
        elif query.lower() in ['历史', 'history']:
            print("\n===== 对话历史 =====")
            for i, (q, a) in enumerate(chat_history, 1):
                print(f"\n[{i}] 用户: {q}")
                print(f"[{i}] 助手: {a if a else '(无回答)'}")
            print("=" * 20)
            continue
            
        elif query.lower() in ['调试', 'debug']:
            debug_mode = not debug_mode
            print(f"\n调试模式: {'开启' if debug_mode else '关闭'}")
            continue
        
        # 调用API
        conversation_id, answer = send_message(query, conversation_id, debug_mode)
        
        if conversation_id:
            # 保存到历史记录
            chat_history.append((query, answer if answer else "(无回答)"))
            
            if debug_mode:
                print(f"对话ID: {conversation_id}")

if __name__ == "__main__":
    main() 