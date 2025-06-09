# -*- coding:utf-8 -*-
#
#   author: iflytek
#
#  本demo测试时运行的环境为：Windows + Python3.7
#  本demo测试成功运行时所安装的第三方库及其版本如下：
#   cffi==1.12.3
#   gevent==1.4.0
#   greenlet==0.4.15
#   pycparser==2.19
#   six==1.12.0
#   websocket==0.2.1
#   websocket-client==0.56.0
#   pyaudio==0.2.11
#   合成小语种需要传输小语种文本、使用小语种发音人vcn、tte=unicode以及修改文本编码方式
#  错误码链接：https://www.xfyun.cn/document/error-code （code返回错误码时必看）
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
import websocket
import datetime
import hashlib
import base64
import hmac
import json
from urllib.parse import urlencode
import time
import ssl
from wsgiref.handlers import format_date_time
from datetime import datetime
from time import mktime
import _thread as thread
import os
import pyaudio
import queue


STATUS_FIRST_FRAME = 0  # 第一帧的标识
STATUS_CONTINUE_FRAME = 1  # 中间帧标识
STATUS_LAST_FRAME = 2  # 最后一帧的标识


class Ws_Param(object):
    # 初始化
    def __init__(self, APPID, APIKey, APISecret, Text):
        self.APPID = APPID
        self.APIKey = APIKey
        self.APISecret = APISecret
        self.Text = Text

        # 公共参数(common)
        self.CommonArgs = {"app_id": self.APPID}
        # 业务参数(business)，更多个性化参数可在官网查看
        self.BusinessArgs = {"aue": "raw", "auf": "audio/L16;rate=16000", "vcn": "x4_yezi", "tte": "utf8"}
        self.Data = {"status": 2, "text": str(base64.b64encode(self.Text.encode('utf-8')), "UTF8")}
        #使用小语种须使用以下方式，此处的unicode指的是 utf16小端的编码方式，即"UTF-16LE""
        #self.Data = {"status": 2, "text": str(base64.b64encode(self.Text.encode('utf-16')), "UTF8")}

    # 生成url
    def create_url(self):
        url = 'wss://tts-api.xfyun.cn/v2/tts'
        # 生成RFC1123格式的时间戳
        now = datetime.now()
        date = format_date_time(mktime(now.timetuple()))

        # 拼接字符串
        signature_origin = "host: " + "ws-api.xfyun.cn" + "\n"
        signature_origin += "date: " + date + "\n"
        signature_origin += "GET " + "/v2/tts " + "HTTP/1.1"
        # 进行hmac-sha256进行加密
        signature_sha = hmac.new(self.APISecret.encode('utf-8'), signature_origin.encode('utf-8'),
                                 digestmod=hashlib.sha256).digest()
        signature_sha = base64.b64encode(signature_sha).decode(encoding='utf-8')

        authorization_origin = "api_key=\"%s\", algorithm=\"%s\", headers=\"%s\", signature=\"%s\"" % (
            self.APIKey, "hmac-sha256", "host date request-line", signature_sha)
        authorization = base64.b64encode(authorization_origin.encode('utf-8')).decode(encoding='utf-8')
        # 将请求的鉴权参数组合为字典
        v = {
            "authorization": authorization,
            "date": date,
            "host": "ws-api.xfyun.cn"
        }
        # 拼接鉴权参数，生成url
        url = url + '?' + urlencode(v)
        # print("date: ",date)
        # print("v: ",v)
        # 此处打印出建立连接时候的url,参考本demo的时候可取消上方打印的注释，比对相同参数时生成的url与自己代码生成的url是否一致
        # print('websocket url :', url)
        return url


# 音频播放器类
class AudioPlayer:
    def __init__(self, rate=16000, channels=1, chunk_size=1024):
        self.rate = rate
        self.channels = channels
        self.chunk_size = chunk_size
        self.p = pyaudio.PyAudio()
        self.stream = None
        self.audio_queue = queue.Queue()
        self.is_playing = False
        
    def start(self):
        try:
            self.stream = self.p.open(
                format=pyaudio.paInt16,
                channels=self.channels,
                rate=self.rate,
                output=True,
                frames_per_buffer=self.chunk_size
            )
            self.is_playing = True
            thread.start_new_thread(self._play_audio, ())
        except Exception as e:
            print(f"Error starting audio player: {e}")
            self.is_playing = False
        
    def _play_audio(self):
        while self.is_playing:
            try:
                audio_chunk = self.audio_queue.get(timeout=1)
                if self.stream and self.stream.is_active():
                    self.stream.write(audio_chunk)
            except queue.Empty:
                time.sleep(0.1)
            except Exception as e:
                print(f"Error playing audio: {e}")
                break
                
    def add_audio(self, audio_data):
        if self.is_playing:
            self.audio_queue.put(audio_data)
        
    def stop(self):
        self.is_playing = False
        try:
            if self.stream:
                if self.stream.is_active():
                    self.stream.stop_stream()
                self.stream.close()
                self.stream = None
            if self.p:
                self.p.terminate()
                self.p = None
        except Exception as e:
            print(f"Error stopping audio player: {e}")


# 全局变量
audio_player = None
ws_connection_closed = False

def on_message(ws, message):
    global audio_player, ws_connection_closed
    
    # 如果连接已关闭，不处理消息
    if ws_connection_closed:
        return
        
    try:
        message = json.loads(message)
        code = message["code"]
        sid = message["sid"]
        audio = message["data"]["audio"]
        audio_data = base64.b64decode(audio)
        status = message["data"]["status"]
        
        if code != 0:
            errMsg = message["message"]
            print(f"sid:{sid} call error:{errMsg} code is:{code}")
        else:
            # 流式播放音频
            if audio_player and audio_player.is_playing:
                audio_player.add_audio(audio_data)
            
            # 同时保存到文件
            with open('./demo.pcm', 'ab') as f:
                f.write(audio_data)
                
        # 如果是最后一帧，标记连接将关闭
        if status == 2:
            print("ws is closed")
            ws_connection_closed = True
            # 安全关闭连接
            try:
                ws.close()
            except:
                pass

    except Exception as e:
        print(f"receive msg, but parse exception: {e}")


# 收到websocket错误的处理
def on_error(ws, error):
    global ws_connection_closed
    print(f"### error: {error}")
    ws_connection_closed = True


# 收到websocket关闭的处理
def on_close(ws, close_status_code=None, close_reason=None):
    global audio_player, ws_connection_closed
    print("### closed ###")
    ws_connection_closed = True
    
    # 停止音频播放
    if audio_player:
        audio_player.stop()
        audio_player = None


# 收到websocket连接建立的处理
def on_open(ws):
    global audio_player, ws_connection_closed
    
    # 重置连接状态
    ws_connection_closed = False
    
    # 初始化并启动音频播放器
    audio_player = AudioPlayer()
    audio_player.start()
    
    def run(*args):
        try:
            d = {"common": wsParam.CommonArgs,
                 "business": wsParam.BusinessArgs,
                 "data": wsParam.Data,
                 }
            d = json.dumps(d)
            print("------>开始发送文本数据")
            ws.send(d)
            if os.path.exists('./demo.pcm'):
                os.remove('./demo.pcm')
        except Exception as e:
            print(f"Error in run thread: {e}")
            global ws_connection_closed
            ws_connection_closed = True
            try:
                ws.close()
            except:
                pass

    thread.start_new_thread(run, ())


if __name__ == "__main__":
    # 测试时候在此处正确填写相关信息即可运行
    wsParam = Ws_Param(APPID='506341da', APISecret='OTEwZjJkNGZmMDVkMTc3NGY4MDYwZjU2',
                       APIKey='6dddc782ff39ecac9da6a255b6ba4713',
                       Text="这是一个流式语音合成示例")
    websocket.enableTrace(False)
    wsUrl = wsParam.create_url()
    
    # 注意: 不同版本的websocket-client库可能有不同的参数要求
    try:
        ws = websocket.WebSocketApp(wsUrl, 
                                   on_message=on_message, 
                                   on_error=on_error, 
                                   on_close=on_close,
                                   on_open=on_open)
        ws.run_forever(sslopt={"cert_reqs": ssl.CERT_NONE})
    except Exception as e:
        print(f"WebSocket error: {e}")
        if audio_player:
            audio_player.stop()
            audio_player = None
