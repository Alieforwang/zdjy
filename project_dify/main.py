from asr.voice_input import record_audio_to_bytes, list_audio_devices
from asr.xunfei_asr import asr, RealTimeASRClient
from tts.xunfei_tts import tts
from tts.play_sound import play_audio_bytes
from nlp.dify_chat import send_message, send_message_streaming  # 导入新的流式API
import keyboard
import time
import os
import threading                        
import re
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

if __name__ == "__main__":
    print("程序启动，按住空格开始录音，松开结束录音，按ESC退出")
    
    # 保存会话ID以实现连续对话
    conversation_id = None
    
    print("\n准备就绪! 按住空格键开始录音，松开结束录音，按ESC退出...")
    
    # 创建识别客户端实例但不立即启动
    asr_client = None
    is_recognizing = False                                                                                                                                                                   
    
    # 控制是否使用流式TTS
    use_streaming = True
    
    while True:
        try:
            if keyboard.is_pressed('esc'):
                print("\n退出程序")
                # 停止正在进行的识别
                if asr_client and is_recognizing:
                    asr_client.stop()
                    asr_client.close()
                break

            # 检测空格键按下开始识别
            if keyboard.is_pressed('space') and not is_recognizing:
                print("\n开始录音...")
                
                # 创建并启动实时语音识别客户端
                asr_client = RealTimeASRClient()
                is_recognizing = True
                
                # 启动录音线程
                record_thread = threading.Thread(target=asr_client.start_recording)
                record_thread.daemon = True
                record_thread.start()
                
            # 检测空格键释放结束识别    
            elif not keyboard.is_pressed('space') and is_recognizing:
                print("\n录音结束")
                
                # 停止实时识别
                if asr_client:
                    asr_client.stop()
                    asr_client.close()
                    is_recognizing = False
                    
                    # 处理识别结果
                    if asr_client.current_text.strip():
                        raw_text = asr_client.current_text
                        print("\n识别结果:", raw_text)
                        
                        # 验证识别结果是否有效(不只是标点符号)
                        text_without_punct = re.sub(r'[^\w\s]', '', raw_text).strip()
                        
                        if not text_without_punct:
                            print("警告: 识别结果只包含标点符号，可能未正确识别您的语音")
                            continue
                        
                        # 直接使用识别结果
                        final_text = raw_text
                        
                        print("AI思考中...")
                        
                        if use_streaming:
                            # 使用流式API实现实时回复和语音合成
                            print("AI回复: ", end="", flush=True)
                            full_answer = ""
                            
                            for response_chunk in send_message_streaming(final_text, conversation_id):
                                if "answer_chunk" in response_chunk:
                                    chunk = response_chunk["answer_chunk"]
                                    full_answer += chunk
                                    print(chunk, end="", flush=True)
                                    
                                if "conversation_id" in response_chunk:
                                    conversation_id = response_chunk["conversation_id"]
                                    
                            print()  # 最后换行
                            
                            # 流式回复完成后，使用完整回复进行一次性TTS合成
                            if full_answer:
                                try:
                                    # 限制文本长度，避免TTS请求过大
                                    tts_text = full_answer
                                    if len(tts_text) > 300:
                                        tts_text = tts_text[:300] + "..."
                                        
                                    audio_stream = tts(
                                        text=tts_text, 
                                        volume=50,
                                        speed=50,
                                        aue='raw',
                                        auf='audio/L16;rate=16000',
                                        tte='utf8',
                                        vcn=os.environ.get("XUNFEI_TTS_VOICE", "x4_yezi")
                                    )
                                    
                                    if audio_stream and len(audio_stream) > 0:
                                        play_audio_bytes(audio_stream)
                                except Exception as e:
                                    print(f"TTS处理失败: {e}")
                        else:
                            # 使用传统方式调用AI并处理TTS
                            conversation_id, reply = send_message(final_text, conversation_id)
                            
                            if reply:
                                print(f"AI回复: {reply}")
                                
                                # 添加TTS重试逻辑
                                max_retries = 3
                                for retry in range(max_retries):
                                    try:
                                        audio_stream = tts(
                                            text=reply, 
                                            volume=50,
                                            speed=50,
                                            aue='raw',
                                            auf='audio/L16;rate=16000',
                                            tte='utf8',
                                            vcn=os.environ.get("XUNFEI_TTS_VOICE", "x4_xiaoyan")
                                        )
                                        
                                        if audio_stream and len(audio_stream) > 0:
                                            break
                                        else:
                                            if retry < max_retries - 1:
                                                time.sleep(1)
                                    except Exception as e:
                                        if retry < max_retries - 1:
                                            time.sleep(1)                                                           
                                
                                # 尝试播放音频
                                if audio_stream and len(audio_stream) > 0:
                                    play_audio_bytes(audio_stream)
                            else:
                                print("AI没有回复")
                    else:
                        print("未能识别到语音内容")
                
                print("\n准备就绪，再次按住空格键开始录音...")
            
            # 检测是否切换流式模式
            if keyboard.is_pressed('f2') and not is_recognizing:
                use_streaming = not use_streaming
                print(f"\n流式模式: {'开启' if use_streaming else '关闭'}")
                time.sleep(0.5)  # 避免重复触发
                    
            # 降低CPU占用
            time.sleep(0.1)
            
        except KeyboardInterrupt:
            print("\n程序被用户中断")
            if asr_client and is_recognizing:
                asr_client.stop()
                asr_client.close()
            break
        except Exception as e:
            print(f"发生错误: {e}")
            if asr_client and is_recognizing:
                asr_client.stop()
                asr_client.close()
                is_recognizing = False
            time.sleep(1)  # 错误后等待一段时间再继续

# 添加新的路由处理AI回复的语音合成
@app.route('/api/tts_response', methods=['POST'])
def tts_response():
    try:
        # 获取请求数据
        data = request.json
        if not data or 'text' not in data:
            return jsonify({'error': '请求缺少文本参数'}), 400
        
        text = data['text']
        voice = data.get('voice', 'xiaoyan')  # 默认使用xiaoyan音色
        
        # 文本分句处理
        sentences = split_text_into_sentences(text)
        
        # 创建一个生成器来流式传输音频数据
        def generate_audio():
            for i, sentence in enumerate(sentences):
                if not sentence.strip():
                    continue
                    
                # 处理文本，删除特殊字符和过多的标点
                clean_text = clean_sentence_for_tts(sentence)
                if not clean_text:
                    continue
                
                # 调用讯飞TTS生成语音
                audio_data = tts(clean_text, vcn=voice)
                if not audio_data:
                    continue
                
                # 创建JSON事件数据
                event_data = {
                    'audio': base64.b64encode(audio_data).decode('utf-8'),
                    'text': sentence,
                    'index': i
                }
                
                # 发送事件
                yield f"data: {json.dumps(event_data)}\n\n"
                
            # 发送完成事件
            yield f"data: {json.dumps({'done': True})}\n\n"
        
        # 返回流式响应
        return Response(stream_with_context(generate_audio()), 
                      content_type='text/event-stream')
                      
    except Exception as e:
        app.logger.error(f"TTS响应处理错误: {str(e)}")
        return jsonify({'error': str(e)}), 500

# 辅助函数：文本分句
def split_text_into_sentences(text):
    # 改进句子分割正则表达式，识别中英文标点符号
    pattern = r'[^!?.。！？…]+[!?.。！？…]+'
    sentences = re.findall(pattern, text)
    
    # 处理可能剩余的文本（没有结束标点的最后一部分）
    if sentences:
        matched_text = ''.join(sentences)
        if len(matched_text) < len(text):
            remainder = text[len(matched_text):].strip()
            if remainder:
                sentences.append(remainder)
    else:
        # 如果没有匹配到句子，将整个文本作为一个句子
        if text.strip():
            sentences = [text.strip()]
    
    # 合并短句
    min_length = 15
    merged = []
    current = ""
    
    for s in sentences:
        if len(current) + len(s) < min_length:
            current += s
        else:
            if current:
                merged.append(current)
            current = s
            
    if current:
        merged.append(current)
        
    return merged

# 辅助函数：清理文本用于TTS
def clean_sentence_for_tts(text):
    # 清理文本，保留中文、英文、数字和常用标点
    clean_text = re.sub(r'[^\u4e00-\u9fa5a-zA-Z0-9.,，。!?！？;:；：、""''()（）《》<>【】\s]', '', text)
    # 删除重复的标点符号
    clean_text = re.sub(r'([.,，。!?！？;:；：])\1+', r'\1', clean_text)
    return clean_text.strip()











