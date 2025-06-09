import pyaudio
import wave
import io
import os
import time
import logging

# 配置日志
logger = logging.getLogger(__name__)

def play_audio_bytes(pcm_bytes, sample_rate=16000, channels=1, bit_depth=16, chunk_size=2048):
    """
    播放音频字节数据
    
    Args:
        pcm_bytes: 音频PCM原始字节数据
        sample_rate: 采样率，默认16000
        channels: 声道数，默认1（单声道）
        bit_depth: 位深度，默认16位
        chunk_size: 分块大小，默认2048字节
    """
    # 检查音频数据
    if not pcm_bytes:
        logger.error("错误: 未收到音频数据")
        return
    
    if len(pcm_bytes) < 100:
        logger.warning(f"音频数据过小 ({len(pcm_bytes)} 字节)，可能无法播放")
    
    # 尝试通过PyAudio播放
    p = None
    stream = None
    
    try:
        p = pyaudio.PyAudio()
        
        # 获取正确的格式
        format_mapping = {
            8: pyaudio.paInt8,
            16: pyaudio.paInt16,
            24: pyaudio.paInt24,
            32: pyaudio.paInt32
        }
        audio_format = format_mapping.get(bit_depth, pyaudio.paInt16)
        
        # 打开音频流
        stream = p.open(format=audio_format,
                      channels=channels,
                      rate=sample_rate,
                      output=True)

        # 分块播放
        played_bytes = 0
        for i in range(0, len(pcm_bytes), chunk_size):
            chunk = pcm_bytes[i:i + chunk_size]
            stream.write(chunk)
            played_bytes += len(chunk)
            
        logger.info(f"音频播放完成: {played_bytes}/{len(pcm_bytes)} 字节")
            
        # 确保所有音频数据都播放完毕
        stream.stop_stream()
        
    except Exception as e:
        logger.error(f"音频播放错误: {e}")
    finally:
        # 确保资源释放
        try:
            if stream:
                if stream.is_active():
                    stream.stop_stream()
                stream.close()
        except Exception as e:
            logger.error(f"关闭音频流出错: {e}")
            
        try:
            if p:
                p.terminate()
        except Exception as e:
            logger.error(f"终止PyAudio出错: {e}")


