import requests
import json
import logging
import uuid
import sys
import os

# 添加TTS模块路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from tts.xunfei_tts import tts
from tts.play_sound import play_audio_bytes

# 配置日志
logger = logging.getLogger(__name__)

# 从配置文件获取API配置
API_KEY = "app-9HGYkNQbCdy7cuCNMEc6xA9g"
url = "http://8.137.48.26:8000/v1/chat-messages"

headers = {
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
}

# 存储会话ID映射关系
conversation_id_mapping = {}

# TTS上下文缓存
tts_context = {
    "buffer": "",  # 文本缓冲区
    "buffer_limit": 50,  # 积累多少字符触发TTS合成
    "sentence_end_marks": ["。", "！", "？", ".", "!", "?", "\n"]  # 句子结束标记
}

def is_valid_uuid(value):
    """检查是否是有效的UUID格式"""
    try:
        uuid_obj = uuid.UUID(str(value))
        return True
    except (ValueError, AttributeError, TypeError):
        return False

def should_process_tts_buffer(buffer):
    """判断缓冲区是否应该进行TTS处理"""
    # 如果超过字符限制
    if len(buffer) >= tts_context["buffer_limit"]:
        return True
        
    # 如果包含句子结束标记
    for mark in tts_context["sentence_end_marks"]:
        if mark in buffer:
            return True
            
    return False

def process_tts_buffer(buffer, play=True):
    """处理TTS缓冲区文本"""
    if not buffer.strip():
        return None
        
    try:
        # 清理文本，删除特殊字符
        clean_text = buffer.strip()
        
        # 避免过短的文本片段
        if len(clean_text) < 2:
            logger.info(f"TTS文本片段过短，跳过: '{clean_text}'")
            return None
            
        # 限制文本长度
        if len(clean_text) > 300:
            logger.info(f"TTS文本过长({len(clean_text)}字符)，截断至300字符")
            clean_text = clean_text[:300]
        
        # 调用讯飞TTS
        audio_data = tts(clean_text)
        
        # 如果需要立即播放
        if play and audio_data:
            logger.info(f"播放TTS音频: {len(audio_data)} 字节")
            play_audio_bytes(audio_data)
            
        return audio_data
    except Exception as e:
        logger.error(f"TTS处理失败: {str(e)}")
        return None

def send_message_streaming(query, conversation_id=None, debug=False, tts_enabled=True):
    """发送对话消息并以流式方式返回结果，同时处理TTS"""
    # 清空TTS缓冲区
    tts_context["buffer"] = ""
    
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
                                    
                                    # 创建一个包含块信息的字典
                                    response_data = {
                                        "answer_chunk": answer_chunk
                                    }
                                    
                                    # 如果启用TTS，积累文本进行流式语音合成
                                    if tts_enabled:
                                        # 将文本添加到缓冲区
                                        tts_context["buffer"] += answer_chunk
                                        
                                        # 检查是否应该处理缓冲区
                                        if should_process_tts_buffer(tts_context["buffer"]):
                                            audio_data = process_tts_buffer(tts_context["buffer"], play=True)
                                            # 重置缓冲区
                                            tts_context["buffer"] = ""
                                    
                                    yield response_data
                                
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
                                
                                # 处理剩余的TTS缓冲区
                                if tts_enabled and tts_context["buffer"]:
                                    audio_data = process_tts_buffer(tts_context["buffer"], play=True)
                                    # 重置缓冲区
                                    tts_context["buffer"] = ""
                                
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

def send_message(query, conversation_id=None, debug=False):
    """发送对话消息，支持会话连续性（向后兼容函数）"""
    # 使用流式API但收集完整响应
    full_answer = ""
    new_conversation_id = None
    
    # 默认不使用TTS，因为main.py会单独处理TTS
    for response_chunk in send_message_streaming(query, conversation_id, debug, tts_enabled=False):
        if "answer_chunk" in response_chunk:
            full_answer += response_chunk["answer_chunk"]
        
        if "conversation_id" in response_chunk:
            new_conversation_id = response_chunk["conversation_id"]
    
    # 如果没有获得新的会话ID，保持使用原来的
    if not new_conversation_id:
        new_conversation_id = conversation_id
    
    return new_conversation_id, full_answer

def main():
    print("Dify 对话应用")
    print("=" * 20)
    
    conversation_id = None
    chat_history = []
    debug_mode = False
    tts_enabled = True
    
    print("\n输入'退出'结束对话，输入'调试'切换调试模式，输入'tts'切换语音")
    
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
            
        elif query.lower() in ['tts', '语音']:
            tts_enabled = not tts_enabled
            print(f"\n语音模式: {'开启' if tts_enabled else '关闭'}")
            continue
        
        # 使用流式API
        full_answer = ""
        
        print("\n助手: ", end="", flush=True)
        for response_chunk in send_message_streaming(query, conversation_id, debug_mode, tts_enabled):
            if "answer_chunk" in response_chunk:
                chunk = response_chunk["answer_chunk"]
                full_answer += chunk
                print(chunk, end="", flush=True)
                
            if "conversation_id" in response_chunk:
                conversation_id = response_chunk["conversation_id"]
        
        print()  # 最后换行
        
        # 保存到历史记录
        chat_history.append((query, full_answer if full_answer else "(无回答)"))
        
        if debug_mode and conversation_id:
            print(f"对话ID: {conversation_id}")

if __name__ == "__main__":
    main() 