# -*- encoding:utf-8 -*-
import hashlib
import hmac
import base64
import json, time, threading
import logging
import pyaudio
from websocket import create_connection
from urllib.parse import quote
import keyboard

# 配置日志
logging.basicConfig(level=logging.ERROR, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 语音识别服务凭证信息
XUNFEI_APP_ID = "506341da"  
XUNFEI_API_KEY = "711523167504dd0a9925dffb34dbb96f"
XUNFEI_API_SECRET = "OTEwZjJkNGZmMDVkMTc3NGY4MDYwZjU2"

class RealTimeASRClient():
    def __init__(self, result_callback=None):
        # 添加结果回调函数
        self.result_callback = result_callback
        
        # 初始化WebSocket连接
        base_url = "ws://rtasr.xfyun.cn/v1/ws"
        ts = str(int(time.time()))
        tt = (XUNFEI_APP_ID + ts).encode('utf-8')
        md5 = hashlib.md5()
        md5.update(tt)
        baseString = md5.hexdigest()
        baseString = bytes(baseString, encoding='utf-8')

        apiKey = XUNFEI_API_KEY.encode('utf-8')
        signa = hmac.new(apiKey, baseString, hashlib.sha1).digest()
        signa = base64.b64encode(signa)
        signa = str(signa, 'utf-8')
        self.end_tag = "{\"end\": true}"

        # 创建WebSocket连接
        self.ws = create_connection(base_url + "?appid=" + XUNFEI_APP_ID + "&ts=" + ts + "&signa=" + quote(signa))
        self.trecv = threading.Thread(target=self.recv)
        self.trecv.daemon = True
        self.trecv.start()
        
        # 初始化音频输入设备
        self.p = pyaudio.PyAudio()
        self.stream = self.p.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=16000,  # 讯飞要求16kHz采样率
            input=True,
            frames_per_buffer=1280  # 每次读取1280字节
        )
        self.is_recording = True
        # 存储当前识别文本
        self.current_text = ""
        # 存储最佳识别结果（不含标点符号的长文本）
        self.best_text = ""
        # 最佳结果的字符长度
        self.best_text_length = 0
        # 结果匹配时间
        self.best_text_time = 0
        # 重置所有文本
        self.reset_texts()

    def reset_texts(self):
        """重置所有文本状态"""
        self.current_text = ""
        self.best_text = ""
        self.best_text_length = 0
        self.best_text_time = 0

    def start_recording(self):
        """实时采集麦克风音频并发送"""
        # 重置文本状态
        self.reset_texts()
        
        while self.is_recording:
            try:
                # 实时读取麦克风数据
                chunk = self.stream.read(1280, exception_on_overflow=False)
                # 发送音频数据块
                self.ws.send(chunk)
                time.sleep(0.04)  # 保持数据流稳定
            except Exception as e:
                logger.error(f"音频采集异常: {str(e)}")
                break

    def recv(self):
        """接收并处理识别结果"""
        try:
            while self.ws.connected:
                result = str(self.ws.recv())
                if len(result) == 0:
                    break
                    
                result_dict = json.loads(result)
                
                # 解析结果
                if result_dict["action"] == "started":
                    pass
                    
                elif result_dict["action"] == "result":
                    # 提取并打印识别文本
                    text = result_dict.get("data", "")
                    if text:
                        # 解析data字段中的文本内容
                        try:
                            data = json.loads(text)
                            if isinstance(data, dict) and "cn" in data and "st" in data["cn"]:
                                st_data = data["cn"]["st"]
                                if "rt" in st_data:
                                    # 构建完整文本
                                    full_text = ""
                                    for rt_item in st_data["rt"]:
                                        if "ws" in rt_item:
                                            for ws_item in rt_item["ws"]:
                                                if "cw" in ws_item:
                                                    for cw in ws_item["cw"]:
                                                        if "w" in cw:
                                                            full_text += cw["w"]
                                    
                                    # 更新当前识别文本
                                    if full_text:
                                        self.current_text = full_text
                                        print(f"\r识别结果: {full_text}", end='', flush=True)
                                        
                                        # 保存最佳识别结果（排除仅有标点符号的文本）
                                        import re
                                        text_without_punct = re.sub(r'[^\w\s]', '', full_text).strip()
                                        
                                        # 只有非空文本且有意义的内容才更新最佳结果
                                        if text_without_punct and len(text_without_punct) > 1:
                                            # 使用长度和更新时间来确定最佳结果
                                            if len(text_without_punct) > self.best_text_length:
                                                self.best_text = full_text
                                                self.best_text_length = len(text_without_punct)
                                                self.best_text_time = time.time()
                                        
                                        # 调用回调函数
                                        if self.result_callback:
                                            self.result_callback(full_text)
                        except:
                            # 简单显示原始结果
                            print(f"\r识别结果: {text}", end='', flush=True)
                        
                elif result_dict["action"] == "error":
                    logger.error(f"错误: {result_dict.get('desc', '未知错误')}")
                    self.close()
                    
        except Exception as e:
            logger.error(f"接收异常: {str(e)}")

    def stop(self):
        """停止录音并关闭连接"""
        self.is_recording = False
        time.sleep(0.5)  # 等待最后一段音频发送
        
        # 发送结束标记
        self.ws.send(bytes(self.end_tag.encode('utf-8')))
        self.stream.stop_stream()
        self.stream.close()
        self.p.terminate()
        
        # 如果有最佳结果，则使用最佳结果更新当前文本
        if self.best_text and len(self.best_text) > 1:
            # 检查是否最后返回的是标点符号
            import re
            current_text_without_punct = re.sub(r'[^\w\s]', '', self.current_text).strip()
            
            # 如果当前结果只是标点符号或明显短于最佳结果，则使用最佳结果
            if (not current_text_without_punct or 
                len(current_text_without_punct) < self.best_text_length * 0.5):
                self.current_text = self.best_text

    def close(self):
        """关闭WebSocket连接"""
        self.ws.close()

# 兼容main.py中的调用方式
def asr(audio_bytes: bytes) -> str:
    """
    讯飞语音识别函数，处理音频数据并返回识别文本
    
    参数:
    - audio_bytes: 音频字节数据
    
    返回:
    - 识别的文本结果
    """
    try:
        if not audio_bytes or len(audio_bytes) < 100:
            logger.warning(f"音频数据过短或为空: {len(audio_bytes)} 字节")
            return ""
            
        # 创建讯飞语音识别实例并进行识别
        # 避免循环导入
        app_id = XUNFEI_APP_ID
        api_key = XUNFEI_API_KEY
        api_secret = XUNFEI_API_SECRET
        
        import _thread as thread
        import time, ssl, base64, json, hashlib, hmac
        import websocket
        from datetime import datetime
        from time import mktime
        from urllib.parse import urlencode
        
        # 定义状态常量
        STATUS_FIRST_FRAME = 0
        STATUS_CONTINUE_FRAME = 1
        STATUS_LAST_FRAME = 2
        
        # 使用内部类避免循环导入问题
        class XunfeiRecognizer:
            def __init__(self, app_id, api_key, api_secret):
                self.APPID = app_id
                self.APIKey = api_key
                self.APISecret = api_secret
                self.result = ""
                self.error_msg = None
                self.is_finished = False
                self.audio_data = None

            def create_url(self):
                # 使用官方文档中的地址
                url = 'wss://rtasr.xfyun.cn/v1/ws'
                
                # 构建鉴权参数
                ts = str(int(time.time()))
                tt = (self.APPID + ts).encode('utf-8')
                md5 = hashlib.md5()
                md5.update(tt)
                baseString = md5.hexdigest()
                baseString = bytes(baseString, encoding='utf-8')
                
                # 使用官方要求的HMAC-SHA1算法
                apiKey = self.APIKey.encode('utf-8')
                signa = hmac.new(apiKey, baseString, hashlib.sha1).digest()
                signa = base64.b64encode(signa).decode('utf-8')
                
                # 构建请求参数
                v = {
                    "appid": self.APPID,
                    "ts": ts,
                    "signa": signa
                }
                
                # 返回完整的URL
                return url + '?' + urlencode(v)

            def on_message(self, ws, message):
                try:
                    message_obj = json.loads(message)
                    
                    # 获取消息类型和代码
                    action = message_obj.get("action", "")
                    code = message_obj.get("code", "-1")
                    
                    # 如果是错误消息
                    if action == "error":
                        error_msg = f"讯飞服务返回错误: {code}"
                        if "desc" in message_obj:
                            error_msg += f", 描述: {message_obj['desc']}"
                        logger.error(error_msg)
                        self.error_msg = error_msg
                        ws.close()
                        return
                    
                    # 处理握手成功消息
                    if action == "started" and code == "0":
                        return  # 不要关闭连接，继续处理
                    
                    # 处理识别结果
                    if action == "result" and code == "0":
                        # 解析data字段，它是一个JSON字符串
                        if "data" in message_obj:
                            try:
                                # 解析JSON字符串
                                data = json.loads(message_obj["data"])
                                
                                # 检查是否有翻译结果
                                if isinstance(data, dict) and "biz" in data and data["biz"] == "trans":
                                    # 处理翻译结果
                                    if "src" in data:
                                        self.result = data["src"]
                                # 检查常规识别结果
                                elif isinstance(data, dict) and "cn" in data:
                                    # 确保cn和st是字典
                                    cn_data = data["cn"]
                                    if isinstance(cn_data, dict) and "st" in cn_data:
                                        st_data = cn_data["st"]
                                        if isinstance(st_data, dict) and "rt" in st_data:
                                            # 构建文本
                                            text = ""
                                            for rt_item in st_data["rt"]:
                                                if isinstance(rt_item, dict) and "ws" in rt_item:
                                                    for ws_item in rt_item["ws"]:
                                                        if isinstance(ws_item, dict) and "cw" in ws_item:
                                                            for cw in ws_item["cw"]:
                                                                if isinstance(cw, dict) and "w" in cw:
                                                                    text += cw["w"]
                                            
                                            # 更新结果
                                            if text:
                                                self.result = text
                                        else:
                                            logger.warning(f"st_data中无rt字段或非字典: {st_data}")
                                    else:
                                        logger.warning(f"cn_data中无st字段或非字典: {cn_data}")
                                else:
                                    # 尝试直接从数据中提取可能的文本结果
                                    data_str = str(data)
                                    if "w" in data_str:
                                        import re
                                        # 尝试用正则表达式提取w字段的值
                                        matches = re.findall(r'"w"\s*:\s*"([^"]*)"', data_str)
                                        if matches:
                                            text = "".join(matches)
                                            self.result = text
                            except Exception as e:
                                logger.error(f"解析识别结果出错: {e}")
                                # 尝试直接从原始数据中提取文本
                                try:
                                    data_str = message_obj["data"]
                                    import re
                                    # 尝试用正则表达式提取w字段的值
                                    matches = re.findall(r'"w"\s*:\s*"([^"]*)"', data_str)
                                    if matches:
                                        text = "".join(matches)
                                        self.result = text
                                except Exception as inner_e:
                                    logger.error(f"尝试直接提取文本也失败: {inner_e}")
                                
                    # 如果是结束消息或服务端断开连接
                    is_end = False
                    if action == "end":
                        is_end = True
                    elif action == "result":
                        # 检查data字符串是否包含status=2的标志
                        try:
                            if "status\":2" in message_obj.get("data", "") or "\"ls\":true" in message_obj.get("data", ""):
                                is_end = True
                        except:
                            pass
                        
                    if is_end:
                        self.is_finished = True
                        
                except Exception as e:
                    logger.error(f"处理消息时出错: {e}")
                    self.error_msg = f"处理消息时出错: {e}"

            def on_error(self, ws, error):
                """处理WebSocket错误"""
                logger.error(f"WebSocket错误: {error}")
                self.error_msg = f"WebSocket错误: {error}"

            def on_close(self, ws, close_status_code=None, close_reason=None):
                """处理WebSocket连接关闭"""
                self.is_finished = True

            def on_open(self, ws):
                """处理WebSocket连接打开"""
                def run(*args):
                    try:
                        status = STATUS_FIRST_FRAME
                        frameSize = 1280  # 官方推荐每40ms发送1280字节
                        intervel = 0.04   # 40ms发送一次

                        audio_data = self.audio_data
                        length = len(audio_data)
                        offset = 0

                        while True:
                            if offset + frameSize >= length:
                                buf = audio_data[offset:length]
                                status = STATUS_LAST_FRAME
                            else:
                                buf = audio_data[offset:offset + frameSize]

                            # 实时语音转写API要求音频采用base64编码
                            audio = base64.b64encode(buf).decode()

                            # 构建数据帧
                            data = {
                                "data": {
                                    "status": status,
                                    "format": "audio/L16;rate=16000",
                                    "audio": audio,
                                    "encoding": "raw"
                                }
                            }
                            
                            ws.send(json.dumps(data))
                            
                            if status == STATUS_LAST_FRAME:
                                # 发送结束标志
                                ws.send(json.dumps({"end": True}))
                                break
                            
                            offset += frameSize
                            status = STATUS_CONTINUE_FRAME
                            time.sleep(intervel)
                    except Exception as e:
                        logger.error(f"发送音频数据时出错: {e}")
                        self.error_msg = f"发送音频数据时出错: {e}"

                thread.start_new_thread(run, ())

            def recognize(self, audio_data: bytes) -> str:
                if not audio_data or len(audio_data) < 100:
                    logger.warning(f"音频数据过短或为空: {len(audio_data)} 字节")
                    return ""
                    
                self.result = ""
                self.error_msg = None
                self.is_finished = False
                self.audio_data = audio_data
                url = self.create_url()
                
                # 创建WebSocket连接
                ws = websocket.WebSocketApp(
                    url,
                    on_message=lambda ws, msg: self.on_message(ws, msg),
                    on_error=lambda ws, err: self.on_error(ws, err),
                    on_close=lambda ws, code, reason: self.on_close(ws, code, reason),
                    on_open=lambda ws: self.on_open(ws)
                )
                
                # 添加try-except块处理连接异常
                try:
                    # 在单独的线程中运行WebSocket客户端
                    ws_thread = thread.start_new_thread(lambda: ws.run_forever(sslopt={"cert_reqs": ssl.CERT_NONE}), ())
                    
                    # 等待连接关闭或超时
                    timeout = 15  # 超时时间增加到15秒
                    start_time = time.time()
                    while not self.is_finished and time.time() - start_time < timeout:
                        time.sleep(0.1)
                        
                    # 如果超时但连接仍然活跃，尝试关闭
                    if ws.keep_running:
                        ws.close()
                        
                except Exception as e:
                    logger.error(f"WebSocket连接错误: {e}")
                    self.error_msg = f"WebSocket连接错误: {e}"
                    
                if self.error_msg:
                    return f"[识别错误: {self.error_msg}]"
                    
                if not self.result:
                    return "未能识别语音内容"
                    
                return self.result
        
        # 执行识别
        recognizer = XunfeiRecognizer(app_id, api_key, api_secret)
        result = recognizer.recognize(audio_bytes)
        return result
    except Exception as e:
        logger.error(f"ASR处理过程中出错: {e}")
        return f"[ASR错误: {str(e)}]"

if __name__ == '__main__':
    client = RealTimeASRClient()
    
    try:
        # 启动录音线程
        record_thread = threading.Thread(target=client.start_recording)
        record_thread.daemon = True
        record_thread.start()
        
        # 主线程等待用户中断
        while client.is_recording:
            time.sleep(0.1)
            
    except KeyboardInterrupt:
        client.stop()
        client.close()