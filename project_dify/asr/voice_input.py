import keyboard
import pyaudio
import numpy as np
import time
import wave
import os

def list_audio_devices():
    """列出所有可用的音频输入设备"""
    p = pyaudio.PyAudio()
    info = "\n可用的音频输入设备:\n"
    
    for i in range(p.get_device_count()):
        device_info = p.get_device_info_by_index(i)
        if device_info.get('maxInputChannels') > 0:  # 只显示输入设备
            info += f"设备 {i}: {device_info.get('name')}\n"
    
    p.terminate()
    return info

def record_audio_to_bytes(record_seconds=10, device_index=None, save_file=False):
    """
    录制音频并返回字节数据
    
    参数:
    - record_seconds: 最大录制时间（秒）
    - device_index: 要使用的输入设备索引，None表示使用默认设备
    - save_file: 是否将录音保存为WAV文件（调试用）
    """
    CHUNK = 1024
    FORMAT = pyaudio.paInt16
    CHANNELS = 1
    RATE = 16000  # 讯飞ASR要求16kHz采样率
    SILENCE_THRESHOLD = 100  # 降低静音阈值，使其更容易检测到声音

    p = pyaudio.PyAudio()
    
    # 只有当没有指定设备时才尝试自动选择
    if device_index is None:
        print("尝试自动选择麦克风设备...")
        # 优先选择实际的麦克风设备，避免选择Microsoft声音映射器
        for i in range(p.get_device_count()):
            device_info = p.get_device_info_by_index(i)
            if device_info.get('maxInputChannels') > 0:
                device_name = device_info.get('name', '').lower()
                # 避开Microsoft声音映射器，优先选择实际的麦克风
                if ('麦克风' in device_name) and ('microsoft' not in device_name) and ('映射' not in device_name):
                    device_index = i
                    print(f"已选择麦克风设备: {device_info.get('name')}")
                    break
        
        # 如果还是没找到合适的设备，尝试寻找任何带有"mic"的设备
        if device_index is None:
            for i in range(p.get_device_count()):
                device_info = p.get_device_info_by_index(i)
                if device_info.get('maxInputChannels') > 0:
                    device_name = device_info.get('name', '').lower()
                    if 'mic' in device_name and 'microsoft' not in device_name:
                        device_index = i
                        print(f"已选择麦克风设备: {device_info.get('name')}")
                        break
        
        # 如果仍然没有找到，默认使用索引为1的设备(通常是实际麦克风)
        if device_index is None:
            device_index = 1  # 大多数系统中1号设备是实际麦克风
            try:
                device_name = p.get_device_info_by_index(device_index).get('name', '')
                print(f"使用默认麦克风设备: {device_name}")
            except:
                print("无法获取默认设备信息，将使用系统默认麦克风")
                device_index = None
    else:
        try:
            device_name = p.get_device_info_by_index(device_index).get('name', '')
            print(f"使用指定麦克风设备: {device_name}")
        except:
            print(f"无法获取设备 {device_index} 的信息，将尝试使用")
    
    try:
        stream = p.open(format=FORMAT,
                        channels=CHANNELS,
                        rate=RATE,
                        input=True,
                        input_device_index=device_index,
                        frames_per_buffer=CHUNK)
        
        print("正在录音...(音量大小监测中)")
        frames = []
        silence_count = 0
        start_time = time.time()
        
        # 检测开始录音时是否有声音输入
        has_sound = False
        max_volume = 0
        
        while keyboard.is_pressed('space') and (time.time() - start_time < record_seconds):
            data = stream.read(CHUNK, exception_on_overflow=False)
            frames.append(data)
            
            # 检测音量
            audio_data = np.frombuffer(data, dtype=np.int16)
            volume = np.abs(audio_data).mean()
            
            # 记录最大音量，帮助调试
            if volume > max_volume:
                max_volume = volume
            
            if volume > SILENCE_THRESHOLD:
                has_sound = True
                silence_count = 0
                # 可视化音量，帮助用户了解是否在录音
                volume_bar = '#' * int(volume / 50)
                print(f"\r音量: {volume:.0f} {volume_bar}", end='')
            else:
                silence_count += 1
        
        print("\n录音完成")
        print(f"最大检测音量: {max_volume:.0f} (阈值: {SILENCE_THRESHOLD})")
        
        if not has_sound:
            print("警告: 未检测到声音输入，请检查麦克风是否正常工作")
            print("尝试降低声音检测阈值或选择其他麦克风设备")
            
        stream.stop_stream()
        stream.close()
        p.terminate()
        
        audio_data = b''.join(frames)
        
        # 如果需要保存WAV文件用于调试
        if save_file and len(audio_data) > 0:
            timestamp = time.strftime("%Y%m%d-%H%M%S")
            filename = f"recording_{timestamp}.wav"
            
            # 确保asr目录下有temp文件夹用于存放临时录音
            temp_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp")
            os.makedirs(temp_dir, exist_ok=True)
            
            filepath = os.path.join(temp_dir, filename)
            
            with wave.open(filepath, 'wb') as wf:
                wf.setnchannels(CHANNELS)
                wf.setsampwidth(p.get_sample_size(FORMAT))
                wf.setframerate(RATE)
                wf.writeframes(audio_data)
            
            print(f"录音已保存到: {filepath}")
        
        return audio_data
    
    except Exception as e:
        print(f"录音出错: {e}")
        if p:
            p.terminate()
        return b''  # 返回空字节





