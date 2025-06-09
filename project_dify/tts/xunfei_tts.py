# -*- coding:utf-8 -*-
import websocket
import datetime
import hashlib
import base64
import hmac
import json
from urllib.parse import urlencode
import ssl
from wsgiref.handlers import format_date_time
from datetime import datetime
from time import mktime
import _thread as thread
import os
import io
import logging
import time
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 配置日志
logging.basicConfig(level=logging.ERROR, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 从环境变量读取讯飞TTS凭证信息
TTS_APP_ID = os.environ.get("XUNFEI_TTS_APP_ID", "506341da")
TTS_API_KEY = os.environ.get("XUNFEI_TTS_API_KEY", "6dddc782ff39ecac9da6a255b6ba4713")
TTS_API_SECRET = os.environ.get("XUNFEI_TTS_API_SECRET", "OTEwZjJkNGZmMDVkMTc3NGY4MDYwZjU2")

class MandarinTTS:

    def __init__(self, app_id, api_key, api_secret):
        self.app_id = app_id
        self.api_key = api_key
        self.api_secret = api_secret
        # 使用标准V2接口地址
        self.websocket_url = 'wss://tts-api.xfyun.cn/v2/tts'

        # 从环境变量读取发音人，默认使用xiaoyan
        self.speaker = os.environ.get("XUNFEI_TTS_VOICE", "xiaoyan")

        # 默认参数配置
        self.default_params = {
            'volume': 50,  # 音量大小 (0-100)
            'speed': 50,  # 语速 (0-100)
            'pitch': 50,  # 音高 (0-100)
            'aue': 'raw',  # 音频格式：原始PCM
            'auf': 'audio/L16;rate=16000',  # 采样率16k
            'tte': 'utf8',  # 文本编码
            'reg': '0',     # 英文发音方式
            'rdn': '0',     # 数字发音方式
            'sfl': 1,       # 流式MP3必需参数
        }
        
        # 错误码映射
        self.error_codes = {
            10163: "参数验证错误，可能缺少必传参数或参数不合法",
            10106: "授权校验失败，检查app_id, api_key, api_secret是否正确",
            10104: "引擎不支持，检查接口及发音人参数",
            10110: "验证失败，检查token是否正确",
            10019: "请求超时",
            10160: "引擎服务错误",
            10161: "启动引擎失败",
            10109: "文本长度非法，应小于8000字节",
            11200: "没有权限，检查发音人是否授权"
        }

    def text_to_speech(self, text, **kwargs):
        # 检查文本是否为空
        if not text or len(text.strip()) == 0:
            logger.error("TTS错误: 输入文本为空")
            return None
            
        # 合并参数
        params = self.default_params.copy()
        params.update(kwargs)

        # 准备请求参数
        common_args = {"app_id": self.app_id}
        
        business_args = {
            "aue": params['aue'],
            "auf": params['auf'],
            "vcn": self.speaker if 'vcn' not in kwargs else kwargs['vcn'],
            "speed": params['speed'],
            "volume": params['volume'],
            "pitch": params['pitch'],
            "tte": params['tte'],
            "reg": params['reg'],
            "rdn": params['rdn'],
            "sfl": params['sfl']
        }
        
        # 文本编码
        text_bytes = text.encode('utf-8')
        base64_text = base64.b64encode(text_bytes)
        base64_str = base64_text.decode('utf-8')
        
        data_args = {
            "text": base64_str,
            "status": 2  # 固定值2表示最后一帧
        }
        
        # 构建完整请求
        req_data = {
            "common": common_args,
            "business": business_args,
            "data": data_args
        }
        
        ws_url = self._assemble_ws_auth_url()

        # 状态追踪变量
        self.audio_buffer = io.BytesIO()  # 创建内存缓存
        self.synthesis_complete = False
        self.error_message = None
        self.received_audio = False       # 标记是否收到任何音频数据

        def on_message(ws, message):
            try:
                message_obj = json.loads(message)
                
                if "code" in message_obj:
                    if message_obj["code"] != 0:
                        error_code = message_obj["code"]
                        error_desc = self.error_codes.get(error_code, f"未知错误码: {error_code}")
                        error_msg = f"{error_desc} - {message_obj.get('message', '')}"
                        logger.error(f"TTS服务返回错误: {error_msg}")
                        self.error_message = error_msg
                        return
                
                if "data" in message_obj and message_obj["data"] is not None:
                    if "audio" in message_obj["data"]:
                        audio = message_obj["data"]["audio"]
                        if audio:
                            audio_bytes = base64.b64decode(audio)
                            self.audio_buffer.write(audio_bytes)
                            self.received_audio = True
                    
                    if "status" in message_obj["data"] and message_obj["data"]["status"] == 2:
                        self.synthesis_complete = True
                        
            except Exception as e:
                logger.error(f"解析消息异常: {str(e)}")
                self.error_message = f"解析消息异常: {str(e)}"

        def on_error(ws, error):
            logger.error(f"WebSocket错误: {str(error)}")
            self.error_message = f"WebSocket错误: {str(error)}"

        def on_close(ws, close_status_code, close_msg):
            if not self.synthesis_complete and not self.error_message and not self.received_audio:
                self.error_message = "WebSocket连接已关闭，未收到合成音频"

        def on_open(ws):
            try:
                ws.send(json.dumps(req_data))
            except Exception as e:
                logger.error(f"发送数据时出错: {str(e)}")
                self.error_message = f"发送数据时出错: {str(e)}"
                ws.close()

        # 设置WebSocket超时时间
        websocket.setdefaulttimeout(30)
        # 禁用详细日志
        websocket.enableTrace(False)
        
        try:
            # 创建WebSocketApp对象
            ws = websocket.WebSocketApp(
                ws_url, 
                on_message=on_message,
                on_error=on_error, 
                on_close=on_close,
                on_open=on_open
            )
            
            # 使用单独的线程运行WebSocket客户端
            import threading
            ws_thread = threading.Thread(target=ws.run_forever, kwargs={"sslopt": {"cert_reqs": ssl.CERT_NONE}})
            ws_thread.daemon = True
            
            ws_thread.start()
            
            # 等待合成完成或出现错误
            timeout = 25  # 最长等待15秒
            start_time = time.time()
            while not self.synthesis_complete and not self.error_message and (time.time() - start_time < timeout):
                time.sleep(0.1)
            
            # 如果超时未完成也视为错误
            if not self.synthesis_complete and not self.error_message:
                self.error_message = "语音合成超时"
                logger.error(self.error_message)
            
            # 确保WebSocket连接关闭
            try:
                ws.close()
            except:
                pass
            
            # 等待线程结束
            if time.time() - start_time < timeout:
                ws_thread.join(2.0)  # 最多等待2秒
                
        except Exception as e:
            logger.error(f"WebSocket连接异常: {str(e)}")
            self.error_message = f"WebSocket连接异常: {str(e)}"
            return None

        if self.error_message:
            logger.error(f"语音合成失败: {self.error_message}")
            return None

        # 获取最终的音频数据
        audio_data = self.audio_buffer.getvalue()
        audio_size = len(audio_data)
        
        if audio_size == 0:
            logger.error("语音合成未生成任何音频数据")
            return None
            
        return audio_data

    def _assemble_ws_auth_url(self):
        """组装带认证信息的WebSocket URL"""
        now = datetime.now()
        date = format_date_time(mktime(now.timetuple()))
        host = "ws-api.xfyun.cn"  # 修改为官方示例中的host
        path = "/v2/tts"

        signature_origin = f"host: {host}\ndate: {date}\nGET {path} HTTP/1.1"
        signature_sha = hmac.new(
            self.api_secret.encode('utf-8'),
            signature_origin.encode('utf-8'),
            digestmod=hashlib.sha256
        ).digest()
        signature_sha = base64.b64encode(signature_sha).decode(encoding='utf-8')

        authorization_origin = (
            f'api_key="{self.api_key}", algorithm="hmac-sha256", '
            f'headers="host date request-line", signature="{signature_sha}"'
        )
        authorization = base64.b64encode(authorization_origin.encode('utf-8')).decode(encoding='utf-8')

        values = {
            "host": host,
            "date": date,
            "authorization": authorization
        }

        return self.websocket_url + "?" + urlencode(values)

def tts(text, **kwargs):
    try:
        # 检查文本长度
        if not text:
            logger.error("TTS错误: 输入文本为空")
            return None
            
        # 清理文本，删除特殊字符和过多的标点
        text = text.strip()
        
        # 讯飞TTS API通常有文本长度限制，一般是8000字
        if len(text) > 8000:
            logger.warning(f"文本过长({len(text)}字)，超过讯飞API限制(8000字)，将被截断")
            text = text[:8000]
            
        # 验证参数范围
        if 'volume' in kwargs:
            if not (0 <= kwargs['volume'] <= 100):
                logger.warning(f"音量参数{kwargs['volume']}超出有效范围(0-100)，已调整")
                kwargs['volume'] = max(0, min(100, kwargs['volume']))
                
        if 'speed' in kwargs:
            if not (0 <= kwargs['speed'] <= 100):
                logger.warning(f"语速参数{kwargs['speed']}超出有效范围(0-100)，已调整")
                kwargs['speed'] = max(0, min(100, kwargs['speed']))
                
        if 'pitch' in kwargs:
            if not (0 <= kwargs['pitch'] <= 100):
                logger.warning(f"音调参数{kwargs['pitch']}超出有效范围(0-100)，已调整")
                kwargs['pitch'] = max(0, min(100, kwargs['pitch']))
        
        # 添加重试逻辑
        max_retries = 3
        retry_delay = 1  # 秒
        
        for retry in range(max_retries):
            try:
                tts_e = MandarinTTS(TTS_APP_ID, TTS_API_KEY, TTS_API_SECRET)
                result = tts_e.text_to_speech(text, **kwargs)
                
                if result and len(result) > 0:
                    return result
                else:
                    logger.warning(f"TTS合成未返回音频数据 (尝试 {retry+1}/{max_retries})")
                    if retry < max_retries - 1:
                        time.sleep(retry_delay)
            except Exception as e:
                logger.error(f"TTS合成失败 (尝试 {retry+1}/{max_retries}): {str(e)}")
                if retry < max_retries - 1:
                    time.sleep(retry_delay)
                    
        logger.error(f"TTS处理失败: 已达到最大重试次数 ({max_retries})")
        return None
    except Exception as e:
        logger.error(f"TTS处理异常: {str(e)}")
        return None








