// 存储摄像头流和分析状态
const streams = {};
const analyzing = {};
const mediaRecorders = {};
let onlineCameras = 0;
let detectionCount = 0;
let lastMinuteDetections = [];
let frameCount = 0;

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    // 检查登录状态
    checkLoginStatus();
    
    // 初始化全屏按钮
    document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);
    
    // 初始化布局切换按钮
    document.getElementById('layoutBtn').addEventListener('click', toggleLayout);
    
    // 更新检测率
    setInterval(updateDetectionRate, 1000);
});

// 检查登录状态
function checkLoginStatus() {
    fetch('/check_login')
        .then(response => response.json())
        .then(data => {
            if (!data.logged_in) {
                window.location.href = '/login';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            window.location.href = '/login';
        });
}

// 启动摄像头
async function startCamera(id) {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        
        const video = document.getElementById(`video${id}`);
        const canvas = document.getElementById(`canvas${id}`);
        
        video.srcObject = stream;
        streams[id] = stream;
        
        // 更新按钮状态
        document.getElementById(`startBtn${id}`).disabled = true;
        document.getElementById(`stopBtn${id}`).disabled = false;
        document.getElementById(`captureBtn${id}`).disabled = false;
        document.getElementById(`recordBtn${id}`).disabled = false;
        
        // 更新状态显示
        document.getElementById(`status${id}`).textContent = '在线';
        document.getElementById(`status${id}`).className = 'status online';
        
        // 更新在线摄像头数量
        onlineCameras++;
        updateOnlineCameras();
        
        // 开始分析视频流
        startAnalyzing(id);
        
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('无法访问摄像头，请检查权限设置');
    }
}

// 停止摄像头
function stopCamera(id) {
    if (streams[id]) {
        streams[id].getTracks().forEach(track => track.stop());
        delete streams[id];
        
        // 停止分析
        analyzing[id] = false;
        
        // 停止录制
        if (mediaRecorders[id]) {
            mediaRecorders[id].stop();
            delete mediaRecorders[id];
        }
        
        // 更新按钮状态
        document.getElementById(`startBtn${id}`).disabled = false;
        document.getElementById(`stopBtn${id}`).disabled = true;
        document.getElementById(`captureBtn${id}`).disabled = true;
        document.getElementById(`recordBtn${id}`).disabled = true;
        
        // 更新状态显示
        document.getElementById(`status${id}`).textContent = '未连接';
        document.getElementById(`status${id}`).className = 'status';
        
        // 清除视频显示
        document.getElementById(`video${id}`).srcObject = null;
        
        // 清除画布
        const canvas = document.getElementById(`canvas${id}`);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 更新在线摄像头数量
        onlineCameras--;
        updateOnlineCameras();
    }
}

// 开始分析视频流
function startAnalyzing(id) {
    const video = document.getElementById(`video${id}`);
    const canvas = document.getElementById(`canvas${id}`);
    const ctx = canvas.getContext('2d');
    
    analyzing[id] = true;
    
    async function analyzeFrame() {
        if (!analyzing[id] || !streams[id]) return;
        
        try {
            // 将视频帧绘制到左侧画布上
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            
            // 将画布转换为 blob
            const blob = await new Promise(resolve => {
                canvas.toBlob(resolve, 'image/jpeg');
            });
            
            // 创建 FormData 对象
            const formData = new FormData();
            formData.append('frame', blob);
            
            // 发送到服务器进行分析
            const response = await fetch('/analyze_frame', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                // 清除之前的标注
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(video, 0, 0);
                
                // 绘制检测结果到左侧画布
                result.detections.forEach(detection => {
                    const [x1, y1, x2, y2] = detection.bbox;
                    const confidence = detection.confidence;
                    const className = detection.class;
                    
                    // 绘制边界框
                    ctx.strokeStyle = '#00ff00';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
                    
                    // 绘制标签背景
                    ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
                    const label = `${className} ${(confidence * 100).toFixed(1)}%`;
                    const labelWidth = ctx.measureText(label).width + 4;
                    ctx.fillRect(x1, y1 - 20, labelWidth, 20);
                    
                    // 绘制标签文本
                    ctx.fillStyle = '#000000';
                    ctx.font = '14px Arial';
                    ctx.fillText(label, x1 + 2, y1 - 5);
                    
                    // 如果检测到目标，添加到警报列表
                    if (confidence > 0.5) {
                        addAlert(id, className, confidence);
                        detectionCount++;
                        lastMinuteDetections.push(Date.now());
                    }
                });
                
                // 绘制检测结果到右侧画布
                const rightCanvas = document.getElementById(`processedCanvas${id}`);
                rightCanvas.width = video.videoWidth;
                rightCanvas.height = video.videoHeight;
                const rightCtx = rightCanvas.getContext('2d');
                rightCtx.clearRect(0, 0, rightCanvas.width, rightCanvas.height);
                rightCtx.drawImage(video, 0, 0);
                
                result.detections.forEach(detection => {
                    const [x1, y1, x2, y2] = detection.bbox;
                    const confidence = detection.confidence;
                    const className = detection.class;
                    
                    // 绘制边界框
                    rightCtx.strokeStyle = '#00ff00';
                    rightCtx.lineWidth = 2;
                    rightCtx.strokeRect(x1, y1, x2 - x1, y2 - y1);
                    
                    // 绘制标签背景
                    rightCtx.fillStyle = 'rgba(0, 255, 0, 0.5)';
                    const label = `${className} ${(confidence * 100).toFixed(1)}%`;
                    const labelWidth = rightCtx.measureText(label).width + 4;
                    rightCtx.fillRect(x1, y1 - 20, labelWidth, 20);
                    
                    // 绘制标签文本
                    rightCtx.fillStyle = '#000000';
                    rightCtx.font = '14px Arial';
                    rightCtx.fillText(label, x1 + 2, y1 - 5);
                });
            }
            
        } catch (error) {
            console.error('Analysis error:', error);
        }
        
        // 继续分析下一帧
        if (analyzing[id]) {
            requestAnimationFrame(analyzeFrame);
        }
    }
    
    // 等待视频加载完成后开始分析
    video.addEventListener('loadeddata', () => {
        analyzeFrame();
    });
}

// 添加警报
function addAlert(cameraId, type, confidence) {
    const alertList = document.getElementById('alertList');
    const alertDiv = document.createElement('div');
    alertDiv.className = 'alert-item';
    
    const time = new Date().toLocaleTimeString();
    alertDiv.innerHTML = `
        <div class="alert-header">
            <span class="alert-time">${time}</span>
            <span class="alert-camera">监控点 ${String.fromCharCode(64 + cameraId)}</span>
        </div>
        <div class="alert-content">
            检测到${type}（置信度：${(confidence * 100).toFixed(1)}%）
        </div>
    `;
    
    // 将新警报添加到列表顶部
    alertList.insertBefore(alertDiv, alertList.firstChild);
    
    // 限制显示最近的10条警报
    while (alertList.children.length > 10) {
                alertList.removeChild(alertList.lastChild);
            }
        }

// 更新检测率
function updateDetectionRate() {
    const now = Date.now();
    // 移除超过一分钟的检测记录
    lastMinuteDetections = lastMinuteDetections.filter(time => now - time <= 60000);
    
    const rate = lastMinuteDetections.length;
    document.getElementById('detectionRate').textContent = `${rate}次/分钟`;
}

// 更新在线摄像头数量
function updateOnlineCameras() {
    document.getElementById('onlineCameras').textContent = `${onlineCameras}/4`;
}

// 截图功能
function captureImage(id) {
    const video = document.getElementById(`video${id}`);
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    // 创建下载链接
    const link = document.createElement('a');
    link.download = `capture_${id}_${new Date().toISOString()}.jpg`;
    link.href = canvas.toDataURL('image/jpeg');
    link.click();
}

// 录制功能
function toggleRecording(id) {
    const video = document.getElementById(`video${id}`);
    const recordBtn = document.getElementById(`recordBtn${id}`);
    
    if (!mediaRecorders[id]) {
        // 开始录制
        const stream = video.srcObject;
        const mediaRecorder = new MediaRecorder(stream);
        const chunks = [];
        
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data);
            }
        };
        
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `recording_${id}_${new Date().toISOString()}.webm`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        };
        
        mediaRecorder.start();
        mediaRecorders[id] = mediaRecorder;
        recordBtn.style.color = 'red';
    } else {
        // 停止录制
        mediaRecorders[id].stop();
        delete mediaRecorders[id];
        recordBtn.style.color = '';
    }
}

// 切换全屏
function toggleFullscreen(videoId) {
    const video = document.getElementById(videoId);
    if (!document.fullscreenElement) {
        video.requestFullscreen().catch(err => {
            console.error(`Error attempting to enable full-screen mode: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
    
    // 确保视频在全屏时正常显示
    video.style.display = 'block';
}

// 切换布局
function toggleLayout() {
    const grid = document.getElementById('monitorGrid');
    grid.classList.toggle('single-view');
}

// 处理后视频的截图功能
function captureProcessedImage(id) {
    const video = document.getElementById(`processedVideo${id}`);
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    // 创建下载链接
    const link = document.createElement('a');
    link.download = `processed_capture_${id}_${new Date().toISOString()}.jpg`;
    link.href = canvas.toDataURL('image/jpeg');
    link.click();
}

// 处理后视频的录制功能
function toggleProcessedRecording(id) {
    const video = document.getElementById(`processedVideo${id}`);
    const recordBtn = document.getElementById(`recordProcessedBtn${id}`);
    
    if (!mediaRecorders[id]) {
        // 开始录制
        const stream = video.srcObject;
        const mediaRecorder = new MediaRecorder(stream);
        const chunks = [];
        
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data);
            }
        };
        
        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `processed_recording_${id}_${new Date().toISOString()}.webm`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
        };
        
        mediaRecorder.start();
        mediaRecorders[id] = mediaRecorder;
        recordBtn.style.color = 'red';
    } else {
        // 停止录制
        mediaRecorders[id].stop();
        delete mediaRecorders[id];
        recordBtn.style.color = '';
    }
} 