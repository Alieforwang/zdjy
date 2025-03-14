// 存储摄像头流和分析状态
const streams = {};
const analyzing = {};
const mediaRecorders = {};
let onlineCameras = 0;
let detectionCount = 0;
let lastMinuteDetections = [];
let frameCount = 0;

// 添加浏览器兼容性检查和polyfill
(function() {
    // 确保老旧浏览器也能支持navigator.mediaDevices
    if (navigator.mediaDevices === undefined) {
        navigator.mediaDevices = {};
        console.log('初始化mediaDevices对象');
    }

    // 一些浏览器实现了部分mediaDevices，我们不能只分配getUserMedia
    // 因为这会覆盖已有的属性
    if (navigator.mediaDevices.getUserMedia === undefined) {
        navigator.mediaDevices.getUserMedia = function(constraints) {
            // 首先获取老版本的getUserMedia
            var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
                              navigator.msGetUserMedia;

            if (!getUserMedia) {
                console.error('浏览器不支持getUserMedia');
                return Promise.reject(new Error('浏览器不支持getUserMedia'));
            }

            // 包装老版本API为Promise
            return new Promise(function(resolve, reject) {
                getUserMedia.call(navigator, constraints, resolve, reject);
            });
        }
        console.log('添加getUserMedia polyfill');
    }
})();

// 检查摄像头权限状态
async function checkCameraPermission() {
    try {
        console.log('检查摄像头权限状态');

        // 检查浏览器是否支持mediaDevices
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('浏览器不支持mediaDevices API');
            alert('您的浏览器不支持摄像头功能，请使用Chrome、Firefox或Edge浏览器');
            return false;
        }

        // 尝试获取权限
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        
        // 获取成功，停止所有轨道
        stream.getTracks().forEach(track => track.stop());
        console.log('摄像头权限已授权');
        return true;
    } catch (error) {
        console.error('摄像头权限检查失败:', error);
        
        // 给用户详细的指导
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            alert('摄像头访问被拒绝。请在浏览器设置中允许访问摄像头。\n\n' +
                  'Chrome: 地址栏左侧 → 点击锁图标 → 网站设置 → 摄像头 → 允许\n' +
                  'Firefox: 地址栏左侧 → 点击锁图标 → 清除设置 → 重新授权\n' +
                  'Edge: 地址栏右侧 → 点击锁图标 → 网站权限 → 允许摄像头');
        } else if (error.name === 'NotFoundError') {
            alert('未检测到摄像头设备，请确认摄像头已连接并正常工作');
        } else {
            alert(`访问摄像头时出错: ${error.message}`);
        }
        return false;
    }
}

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
    console.log(`开始启动摄像头 ID: ${id}`);
    
    // 先检查浏览器是否支持navigator.mediaDevices
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('浏览器不支持mediaDevices API');
        alert('您的浏览器不支持摄像头功能，请使用Chrome、Firefox或Edge浏览器');
        return;
    }
    
    // 检查摄像头权限
    const permissionState = await checkCameraPermission().catch(err => {
        console.error('权限检查出错:', err);
        return false;
    });
    
    if (!permissionState) {
        console.log('未获得摄像头权限，无法启动');
        alert('需要摄像头权限才能继续。请在浏览器设置中允许访问摄像头。');
        return;
    }
    
    try {
        // 获取适合当前设备的视频约束条件
        const constraints = getOptimalConstraints();
        console.log('使用的视频约束:', constraints);
        
        const stream = await navigator.mediaDevices.getUserMedia({ video: constraints });
        
        const video = document.getElementById(`video${id}`);
        if (!video) {
            console.error(`未找到video元素: video${id}`);
            throw new Error(`未找到video元素: video${id}`);
        }
        
        const canvas = document.getElementById(`canvas${id}`);
        if (!canvas) {
            console.error(`未找到canvas元素: canvas${id}`);
            throw new Error(`未找到canvas元素: canvas${id}`);
        }
        
        video.srcObject = stream;
        streams[id] = stream;
        
        // 添加视频加载事件处理
        video.onloadedmetadata = function() {
            console.log(`视频元数据已加载，分辨率: ${video.videoWidth}x${video.videoHeight}`);
            video.play().catch(e => console.error('视频播放失败:', e));
        };
        
        video.onerror = function(e) {
            console.error('视频元素错误:', e);
        };
        
        // 更新按钮状态
        const startBtn = document.getElementById(`startBtn${id}`);
        const stopBtn = document.getElementById(`stopBtn${id}`);
        const captureBtn = document.getElementById(`captureBtn${id}`);
        const recordBtn = document.getElementById(`recordBtn${id}`);
        
        if (startBtn) startBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;
        if (captureBtn) captureBtn.disabled = false;
        if (recordBtn) recordBtn.disabled = false;
        
        // 更新状态显示
        const statusEl = document.getElementById(`status${id}`);
        if (statusEl) {
            statusEl.textContent = '在线';
            statusEl.className = 'status online';
        }
        
        // 更新在线摄像头数量
        onlineCameras++;
        updateOnlineCameras();
        
        // 开始分析视频流
        startAnalyzing(id);
        
    } catch (error) {
        console.error('访问摄像头时出错:', error);
        
        // 根据错误类型提供更详细的错误信息
        if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            alert('摄像头访问被拒绝。请在浏览器设置中允许访问摄像头。');
        } else if (error.name === 'NotFoundError') {
            alert('未检测到摄像头设备，请确认摄像头已连接并正常工作');
        } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
            alert('摄像头可能被其他应用程序占用，请关闭其他使用摄像头的应用后重试');
        } else if (error.name === 'OverconstrainedError') {
            alert('摄像头不支持请求的分辨率，请尝试使用较低的分辨率');
        } else {
            alert(`访问摄像头时出错: ${error.message}`);
        }
    }
}

// 获取最佳视频约束条件
function getOptimalConstraints() {
    // 检测是否为移动设备
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        // 移动设备使用较低分辨率以节省资源
        return { 
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: { ideal: 'environment' } // 优先使用后置摄像头
        };
    } else {
        // 桌面设备使用较高分辨率
        return { 
            width: { ideal: 1280 },
            height: { ideal: 720 }
        };
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