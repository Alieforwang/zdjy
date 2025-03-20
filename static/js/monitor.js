// 存储摄像头流和分析状态
const streams = {};
const analyzing = {};
const mediaRecorders = {};
let onlineCameras = 0;
let detectionCount = 0;
let lastMinuteDetections = [];
let frameCount = 0;
let isCameraMode = true;  // 默认处于摄像头模式
let cameraInterval = null; // 用于摄像头模式的定时器
let currentCameraId = 0;  // 当前选中的摄像头ID，默认为内置摄像头

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

// 处理当前摄像头帧
function processCameraFrame() {
    if (!streams[1]) {
        console.error('摄像头未启动');
        return;
    }
    
    const video = document.getElementById('video1');
    
    // 创建一个临时canvas用于捕获视频帧
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    
    // 将canvas内容转为base64
    const imageData = tempCanvas.toDataURL('image/jpeg');
    
    // 显示加载状态
    const aiStatus = document.getElementById('aiStatus');
    if (aiStatus) {
        aiStatus.textContent = "正在分析...";
        aiStatus.style.color = "#1890ff";
    }
    
    const status2El = document.getElementById('status2');
    if (status2El) {
        status2El.textContent = "分析中";
        status2El.className = "status online";
    }
    
    // 发送到服务器进行分析
    fetch('/process_camera_frame', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            image: imageData
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // 更新分析结果
            let detectionCountValue = data.detection_count || 0;
            
            if (aiStatus) {
                aiStatus.textContent = `检测到${detectionCountValue}个目标`;
            }
            
            if (status2El) {
                status2El.textContent = `已完成分析`;
            }
            
            // 显示结果图像
            const resultImage = new Image();
            resultImage.onload = function() {
                const canvas = document.getElementById('canvas1');
                if (!canvas) return;
                
                canvas.width = resultImage.width;
                canvas.height = resultImage.height;
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(resultImage, 0, 0, canvas.width, canvas.height);
                
                // 设置检测框和标签
                drawDetectionBoxes(canvas, data.detections);
            };
            
            // 使用服务器返回的结果图像URL
            if (data.result_image) {
                resultImage.src = data.result_image;
            }
            
            // 更新检测计数
            detectionCount += data.detection_count;
            const now = new Date();
            lastMinuteDetections.push({
                time: now,
                count: data.detection_count
            });
            
            // 只有检测到占道经营时才添加警报并保存到数据库
            if (data.detection_count > 0) {
                const type = data.detect_type === 'zdjy_ld' ? '流动摊位' : '固定摊位';
                addAlert(1, type, data.detections[0]?.confidence || 0.8);
                
                // 保存检测结果到数据库
                saveDetectionResult(data);
            }
            
            // 更新检测类型显示
            updateDetectionTypeDisplay(data.detect_type);
        } else {
            if (aiStatus) {
                aiStatus.textContent = `分析失败: ${data.message}`;
                aiStatus.style.color = "#ff4d4f";
            }
            
            if (status2El) {
                status2El.textContent = "分析失败";
                status2El.className = "status";
            }
        }
    })
    .catch(error => {
        console.error('分析错误:', error);
        
        if (aiStatus) {
            aiStatus.textContent = "分析出错";
            aiStatus.style.color = "#ff4d4f";
        }
        
        if (status2El) {
            status2El.textContent = "错误";
            status2El.className = "status";
        }
    });
}

// 保存检测结果到数据库
function saveDetectionResult(data) {
    // 确保只有当检测到占道经营时才保存
    if (!data || !data.detection_count || data.detection_count <= 0) {
        console.log('未检测到占道经营，不保存数据');
        return;
    }
    
    console.log('检测到占道经营，准备保存结果');
    
    // 发送保存请求
    fetch('/save_detection_result', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            detection_data: data,
            timestamp: new Date().toISOString(),
            camera_id: 1, // 假设当前摄像头ID为1
            detection_type: data.detect_type,
            confidence: data.detections[0]?.confidence || 0
        })
    })
    .then(response => response.json())
    .then(result => {
        if (result.status === 'success') {
            console.log('检测结果保存成功:', result.message);
        } else {
            console.error('检测结果保存失败:', result.message);
        }
    })
    .catch(error => {
        console.error('保存检测结果时出错:', error);
    });
}

// 绘制检测框和标签
function drawDetectionBoxes(canvas, detections) {
    if (!detections || detections.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    
    detections.forEach(detection => {
        const [x1, y1, x2, y2] = detection.box;
        const confidence = detection.confidence;
        const className = detection.class_name;
        const classType = detection.class_type;
        
        // 根据类型设置不同的颜色
        let boxColor = '#ff4d4f'; // 默认红色
        if (classType === 'zdjy_gd') {
            boxColor = '#52c41a'; // 固定摊位使用绿色
        } else if (classType === 'zdjy_ld') {
            boxColor = '#ff4d4f'; // 流动摊位使用红色
        } else {
            boxColor = '#1890ff'; // 其他类型使用蓝色
        }
        
        // 绘制边界框
        ctx.strokeStyle = boxColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        
        // 绘制半透明填充
        ctx.fillStyle = boxColor.replace(')', ', 0.2)').replace('rgb', 'rgba');
        ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
        
        // 绘制标签背景
        ctx.fillStyle = boxColor.replace(')', ', 0.8)').replace('rgb', 'rgba');
        const label = `${className} ${(confidence * 100).toFixed(1)}%`;
        ctx.font = '12px Arial';
        const labelWidth = ctx.measureText(label).width + 10;
        ctx.fillRect(x1, y1 - 20, labelWidth, 20);
        
        // 绘制标签文本
        ctx.fillStyle = 'white';
        ctx.fillText(label, x1 + 5, y1 - 5);
    });
}

// 更新检测类型显示
function updateDetectionTypeDisplay(detectType) {
    const videoStatus2 = safeGetElement('videoStatus2');
    if (!videoStatus2) return;
    
    if (detectType === 'zdjy_ld') {
        videoStatus2.textContent = "检测到流动摊位";
        videoStatus2.style.backgroundColor = 'rgba(255, 77, 79, 0.8)';
    } else if (detectType === 'zdjy_gd') {
        videoStatus2.textContent = "检测到固定摊位";
        videoStatus2.style.backgroundColor = 'rgba(82, 196, 26, 0.8)';
    } else {
        videoStatus2.textContent = "未检测到摊位";
        videoStatus2.style.backgroundColor = 'rgba(24, 144, 255, 0.8)';
    }
}

// 选择摄像头
async function selectCamera(cameraId) {
    try {
        console.log(`选择摄像头: ${cameraId}`);
        
        // 如果当前有摄像头在运行，先停止它
        if (streams[1]) {
            await stopCamera(1);
        }
        
        // 更新当前摄像头ID
        currentCameraId = cameraId;
        
        // 高亮显示选中的按钮
        document.querySelectorAll('.camera-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const selectedBtn = document.getElementById(`cameraBtn${cameraId}`);
        if (selectedBtn) {
            selectedBtn.classList.add('active');
        }
        
        // 更新摄像头名称显示
        const videoName1 = document.getElementById('videoName1');
        if (videoName1) {
            if (cameraId === 0) {
                videoName1.textContent = '内置摄像头';
            } else if (cameraId === 1) {
                videoName1.textContent = '外置摄像头1';
            } else if (cameraId === 2) {
                videoName1.textContent = '外置摄像头2';
            }
        }
        
        // 启动选中的摄像头
        await startCamera(1, cameraId);
        
        // 启动AI分析
        setTimeout(() => {
            processCameraFrame();
        }, 1000);
        
    } catch (error) {
        console.error('选择摄像头出错:', error);
        alert(`选择摄像头出错: ${error.message}`);
    }
}

// 启动摄像头（修改为支持指定设备索引）
async function startCamera(id, deviceIndex = 0) {
    console.log(`开始启动摄像头 ID: ${id}, 设备索引: ${deviceIndex}`);
    
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
        // 获取摄像头列表
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        console.log('检测到摄像头设备:', videoDevices.map(d => d.label || `设备 ${d.deviceId.substr(0, 8)}...`));
        
        if (videoDevices.length === 0) {
            throw new Error('未检测到任何摄像头设备');
        }
        
        // 确保选择的设备索引在有效范围内
        if (deviceIndex >= videoDevices.length) {
            console.warn(`请求的设备索引 ${deviceIndex} 超出范围，降级到使用第一个可用设备`);
            deviceIndex = 0;
        }
        
        // 获取选定设备的ID
        const selectedDevice = videoDevices[deviceIndex];
        console.log(`选择摄像头设备: ${selectedDevice.label || `设备 ${selectedDevice.deviceId.substr(0, 8)}...`}`);
        
        // 获取适合当前设备的视频约束条件
        const constraints = getOptimalConstraints();
        // 添加设备ID到约束条件
        constraints.deviceId = { exact: selectedDevice.deviceId };
        
        console.log('使用的视频约束:', constraints);
        
        const stream = await navigator.mediaDevices.getUserMedia({ video: constraints });
        
        const video = safeGetElement(`video${id}`);
        if (!video) {
            console.error(`未找到video元素: video${id}`);
            throw new Error(`未找到video元素: video${id}`);
        }
        
        const canvas = safeGetElement(`canvas1`);
        if (!canvas) {
            console.error(`未找到canvas元素: canvas1`);
            throw new Error(`未找到canvas元素: canvas1`);
        }
        
        video.srcObject = stream;
        streams[id] = stream;
        
        // 添加视频加载事件处理
        video.onloadedmetadata = function() {
            console.log(`视频元数据已加载，分辨率: ${video.videoWidth}x${video.videoHeight}`);
            video.play().catch(e => console.error('视频播放失败:', e));
            
            // 不需要在这里设置定时分析，因为已经在页面加载时设置了
        };
        
        video.onerror = function(e) {
            console.error('视频元素错误:', e);
        };
        
        // 更新按钮状态
        const startBtn = safeGetElement(`startBtn1`);
        const stopBtn = safeGetElement(`stopBtn1`);
        
        if (startBtn) startBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;
        
        // 更新状态显示
        const statusEl = safeGetElement(`status${id}`);
        if (statusEl) {
            statusEl.textContent = '在线';
            statusEl.className = 'status online';
        }
        
        // 更新在线摄像头数量
        onlineCameras++;
        updateOnlineCameras();
        
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
        
        // 安全地更新按钮状态
        const startBtn = safeGetElement(`startBtn${id}`);
        const stopBtn = safeGetElement(`stopBtn${id}`);
        const captureBtn = safeGetElement(`captureBtn${id}`);
        
        if (startBtn) startBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;
        if (captureBtn) captureBtn.disabled = true;
        
        // 安全地更新状态显示
        const statusEl = safeGetElement(`status${id}`);
        if (statusEl) {
            statusEl.textContent = '未连接';
            statusEl.className = 'status';
        }
        
        // 清除视频显示
        const video = safeGetElement(`video${id}`);
        if (video) {
            video.srcObject = null;
        }
        
        // 清除画布
        const canvas = safeGetElement(`canvas${id}`);
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        
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

// 更新在线摄像头数量
function updateOnlineCameras() {
    const onlineCamerasEl = safeGetElement('onlineCameras');
    if (onlineCamerasEl) {
        onlineCamerasEl.textContent = `${onlineCameras}/1`;
    }
}

// 添加警报
function addAlert(cameraId, type, confidence) {
    const alertList = safeGetElement('alertList');
    if (!alertList) return;
    
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
    lastMinuteDetections = lastMinuteDetections.filter(detection => {
        return (now - detection.time.getTime()) <= 60000;
    });
    
    const rate = lastMinuteDetections.reduce((sum, detection) => sum + detection.count, 0);
    
    const detectionRateEl = safeGetElement('detectionRate');
    if (detectionRateEl) {
        detectionRateEl.textContent = `${rate}次/分钟`;
    }
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

// 安全获取DOM元素的函数，避免空引用错误
function safeGetElement(id) {
    const element = document.getElementById(id);
    // 只在开发环境下输出警告，不影响生产环境
    if (!element && window.location.hostname === 'localhost') {
        console.warn(` 找不到元素: ${id}`);
    }
    return element;
}

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

// 切换AI分析状态
function toggleAI() {
    try {
        // 使用safeGetElement避免null错误
        const aiBtn = safeGetElement('aiBtn');
        const aiStatus = safeGetElement('aiStatus');
        
        // 如果找不到aiBtn元素，直接返回
        if (!aiBtn) {
            console.log(" 找不到aiBtn元素，无法切换AI分析状态");
            return;
        }
        
        const isActive = aiBtn.classList.contains('active');
        
        if (isActive) {
            // 停止AI分析
            aiBtn.classList.remove('active');
            if (aiStatus) {
                aiStatus.textContent = "AI已停止";
                aiStatus.style.color = "#a0a0a0";
            }
        } else {
            // 启动AI分析
            aiBtn.classList.add('active');
            if (aiStatus) {
                aiStatus.textContent = "AI已启动";
                aiStatus.style.color = "#1890ff";
            }
            
            // 立即进行一次分析
            processCameraFrame();
        }
    } catch (error) {
        console.error(' 启动AI推理出错:', error);
    }
}

// 全局错误处理器
window.onerror = function(message, source, lineno, colno, error) {
    console.error('全局错误:', message, '| 位置:', source, lineno, colno);
    return false; // 允许默认错误处理
};

// 添加异常监视器
window.addEventListener('unhandledrejection', function(event) {
    console.error('未处理的Promise拒绝:', event.reason);
});

// 监测页面状态
function checkPageStatus() {
    // 检查关键元素
    const video1 = safeGetElement('video1');
    const canvas1 = safeGetElement('canvas1');
    
    if (!video1) {
        console.error('页面关键元素缺失: video1');
    }
    
    if (!canvas1) {
        console.error('页面关键元素缺失: canvas1');
    }
    
    // 检查摄像头状态
    if (streams[1]) {
        console.log('摄像头状态: 已连接');
    } else {
        console.log('摄像头状态: 未连接');
    }
}

// 添加更新视频列表的函数
function loadVideoList() {
    try {
        console.log('开始加载视频列表...');
        
        fetch('/api/videos')
            .then(response => response.json())
            .then(data => {
                console.log('获取视频列表:', data);
                
                const videoListEl = document.getElementById('videoList');
                if (!videoListEl) {
                    // 视频列表元素不存在时静默忽略，不输出错误
                    return;
                }
                
                if (data.status === 'success' && data.data.length > 0) {
                    videoListEl.innerHTML = '';
                    
                    data.data.forEach(video => {
                        const item = document.createElement('div');
                        item.className = 'video-item';
                        item.innerHTML = `
                            <div class="video-thumb">
                                <img src="${video.thumb || '/static/img/video-placeholder.jpg'}" alt="${video.name}">
                                <span class="video-duration">${video.duration || '00:00'}</span>
                            </div>
                            <div class="video-info">
                                <div class="video-name">${video.name}</div>
                                <div class="video-date">${video.date}</div>
                            </div>
                        `;
                        
                        item.addEventListener('click', () => {
                            // 处理视频点击事件
                            // ...
                        });
                        
                        videoListEl.appendChild(item);
                    });
                } else {
                    videoListEl.innerHTML = '<div class="no-videos">暂无录制视频</div>';
                }
            })
            .catch(err => {
                console.error('加载视频列表出错:', err);
            });
    } catch (err) {
        console.error('加载视频列表函数出错:', err);
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('页面加载完成，开始初始化...');
        
        // 安全获取DOM元素的辅助函数
        function safeGetElement(id) {
            const el = document.getElementById(id);
            if (!el) console.warn(`找不到元素: ${id}`);
            return el;
        }
        
        // 初始化页面
        loadVideoList();
        
        // 初始化摄像头选择按钮
        const cameraBtn0 = safeGetElement('cameraBtn0');
        if (cameraBtn0) {
            cameraBtn0.classList.add('active'); // 默认选中内置摄像头
        }
        
        console.log('开始加载视频列表...');
        
        // 在页面加载后延迟2秒启动定时分析，给摄像头足够的启动时间
        setTimeout(() => {
            try {
                // 设置定时分析，每2秒分析一次
                setInterval(() => {
                    if (streams[1]) {  // 确保摄像头已启动
                        processCameraFrame();
                    }
                }, 2000);
            } catch (e) {
                console.error(' 设置定时分析出错:', e);
            }
        }, 2000);

        // 在页面加载后检查页面状态
        setTimeout(checkPageStatus, 1000);
        
        // 自动开启AI推理
        setTimeout(() => {
            try {
                // 直接调用processCameraFrame，而不是toggleAI
                processCameraFrame();
            } catch (err) {
                console.error('启动分析出错:', err);
            }
        }, 3000);
    } catch (err) {
        console.error('页面初始化出错:', err);
    }
}); 