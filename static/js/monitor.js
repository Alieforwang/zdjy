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

// 记录当前选择的摄像头
let currentCameraIndex = 0;
let currentCameraIndex2 = 3;

// 添加浏览器兼容性检测和polyfill
(function() {
    window.cameraSupported = false; // 默认假设不支持摄像头
    
    try {
        // 确保老旧浏览器也能支持navigator.mediaDevices
        if (navigator.mediaDevices === undefined) {
            navigator.mediaDevices = {};
            console.log('初始化mediaDevices对象');
        }
    
        // 一些浏览器实现了部分mediaDevices，我们不能只分配getUserMedia
        // 因为这会覆盖已有的属性
        if (navigator.mediaDevices.getUserMedia === undefined) {
            // 首先获取老版本的getUserMedia
            var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
                               navigator.msGetUserMedia;
    
            if (!getUserMedia) {
                console.error('浏览器不支持getUserMedia');
                navigator.mediaDevices.getUserMedia = function(constraints) {
                    return Promise.reject(new Error('浏览器不支持getUserMedia'));
                };
            } else {
                // 包装老版本API为Promise
                navigator.mediaDevices.getUserMedia = function(constraints) {
                    return new Promise(function(resolve, reject) {
                        getUserMedia.call(navigator, constraints, resolve, reject);
                    });
                };
                window.cameraSupported = true;
            }
            console.log('添加getUserMedia polyfill');
        } else {
            window.cameraSupported = true;
        }
    } catch (e) {
        console.error('设置摄像头API时出错:', e);
        window.cameraSupported = false;
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
        
        // 绘制标签背景 - 将标签放在框的下方而不是上方
        ctx.fillStyle = boxColor.replace(')', ', 0.8)').replace('rgb', 'rgba');
        const label = `${className} ${(confidence * 100).toFixed(1)}%`;
        ctx.font = '12px Arial';
        const labelWidth = ctx.measureText(label).width + 10;
        // 修改标签位置到框的下方
        ctx.fillRect(x1, y2, labelWidth, 20);
        
        // 绘制标签文本 - 同样修改到框的下方
        ctx.fillStyle = 'white';
        ctx.fillText(label, x1 + 5, y2 + 15);
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
function selectCamera(index) {
    // 更新UI按钮状态
    document.querySelectorAll('#cameraBtn0, #cameraBtn1, #cameraBtn2').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`#cameraBtn${index}`).classList.add('active');
    
    // 记录当前摄像头索引
    currentCameraIndex = index;
    
    // 重新启动摄像头
    stopCamera();
    startCamera(index);
    
    // 更新位置信息
    updateLocationInfo(index);
}

// 更新位置信息
function updateLocationInfo(index) {
    const locationElement = document.getElementById('locationInfo');
    if (locationElement) {
        let locationText = '未知位置';
        
        // 根据摄像头索引设置位置信息
        if (index === 0) {
            locationText = '内置摄像头';
        } else if (index === 1) {
            locationText = '外置摄像头1';
        } else if (index === 2) {
            locationText = '外置摄像头2';
        }
        
        locationElement.textContent = locationText;
    }
}

// 启动摄像头
let stream = null;
async function startCamera(deviceIndex = 0) {
    const videoElement = document.getElementById('videoElement');
    if (!videoElement) return;
    
    try {
        // 检查是否有可用摄像头
        if (typeof availableCameras !== 'undefined' && availableCameras.length === 0) {
            console.log('没有检测到摄像头');
            setAIStatusText('无可用摄像头');
            if (document.getElementById('locationInfo')) {
                document.getElementById('locationInfo').textContent = '无摄像头连接';
            }
            return;
        }
        
        // 如果已有流，先停止
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        // 获取视频设备列表
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        // 检查设备索引是否有效
        const isValidIndex = deviceIndex >= 0 && deviceIndex < videoDevices.length;
        
        let constraints = {
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 }
            },
            audio: false
        };
        
        // 如果设备索引有效，使用指定设备
        if (isValidIndex) {
            constraints.video.deviceId = { exact: videoDevices[deviceIndex].deviceId };
            console.log(`使用摄像头设备 ${deviceIndex}: ${videoDevices[deviceIndex].label}`);
        } else {
            // 如果索引无效，使用默认设备并提示
            console.log(`摄像头设备 ${deviceIndex} 不可用，使用默认摄像头`);
            if (deviceIndex > 0) {
                alert(`摄像头 ${deviceIndex} 不可用，请检查设备连接`);
            }
        }
        
        // 请求摄像头访问权限
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // 设置视频源
        videoElement.srcObject = stream;
        
        // 更新UI显示
        updateCameraStatus(true);
        if (document.getElementById('locationInfo')) {
            updateLocationInfo(deviceIndex);
        }
        
        console.log('摄像头已启动');
    } catch (error) {
        console.error('启动摄像头错误:', error);
        setAIStatusText('摄像头访问失败');
        updateCameraStatus(false);
        
        if (document.getElementById('locationInfo')) {
            document.getElementById('locationInfo').textContent = '摄像头连接失败';
        }
        
        // 如果是因为没有权限
        if (error.name === 'NotAllowedError') {
            alert('请允许访问摄像头以使用AI检测功能');
        } else if (error.name === 'OverconstrainedError') {
            // 如果是设备约束问题，尝试使用默认设备
            console.log('摄像头设备约束错误，尝试使用默认摄像头');
            try {
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: true, 
                    audio: false 
                });
                videoElement.srcObject = stream;
                updateCameraStatus(true);
            } catch (e) {
                console.error('默认摄像头也无法启动:', e);
            }
        }
    }
}

// 停止摄像头
function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    
    const videoElement = document.getElementById('videoElement');
    if (videoElement && videoElement.srcObject) {
        videoElement.srcObject = null;
    }
    
    updateCameraStatus(false);
}

// 更新摄像头状态
function updateCameraStatus(isActive) {
    const statusElement = document.getElementById('cameraStatus');
    if (statusElement) {
        statusElement.textContent = isActive ? '已连接' : '未连接';
        statusElement.style.color = isActive ? '#4CAF50' : '#F44336';
    }
    
    // 更新在线摄像头计数
    updateOnlineCameras();
}

// 更新在线摄像头计数
function updateOnlineCameras() {
    const onlineCamerasElement = document.getElementById('onlineCameras');
    if (onlineCamerasElement) {
        let activeCount = 0;
        if (stream) activeCount++;
        
        // 使用后端提供的总摄像头数量
        const totalCameras = typeof cameraCount !== 'undefined' ? cameraCount : 2;
        onlineCamerasElement.textContent = `${activeCount}/${totalCameras}`;
    }
}

// 第二个摄像头窗口的选择函数
function selectCamera2(index) {
    // 更新UI按钮状态
    document.querySelectorAll('#cameraBtn3, #cameraBtn4, #cameraBtn5').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`#cameraBtn${index}`).classList.add('active');
    
    // 记录当前摄像头索引，实际摄像头索引需要映射到实际设备
    // 3->0, 4->1, 5->2
    const actualIndex = index - 3;
    currentCameraIndex2 = index;
    
    // 重新启动摄像头
    stopCamera2();
    startCamera2(actualIndex);
    
    // 更新位置信息
    updateLocationInfo2(index);
}

// 更新第二个摄像头的位置信息
function updateLocationInfo2(index) {
    const locationElement = document.getElementById('locationInfo2');
    if (locationElement) {
        let locationText = '未知位置';
        
        // 根据摄像头索引设置位置信息
        if (index === 3) {
            locationText = '内置摄像头';
        } else if (index === 4) {
            locationText = '外置摄像头1';
        } else if (index === 5) {
            locationText = '外置摄像头2';
        }
        
        locationElement.textContent = locationText;
    }
}

// 第二个摄像头窗口的启动函数
let stream2 = null;
async function startCamera2(deviceIndex = 0) {
    const videoElement = document.getElementById('videoElement2');
    if (!videoElement) return;
    
    try {
        // 检查是否有可用摄像头
        if (typeof availableCameras !== 'undefined' && availableCameras.length === 0) {
            console.log('没有检测到摄像头');
            setAIStatusText2('无可用摄像头');
            if (document.getElementById('locationInfo2')) {
                document.getElementById('locationInfo2').textContent = '无摄像头连接';
            }
            return;
        }
        
        // 如果已有流，先停止
        if (stream2) {
            stream2.getTracks().forEach(track => track.stop());
        }
        
        // 获取视频设备列表
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        // 检查设备索引是否有效
        const isValidIndex = deviceIndex >= 0 && deviceIndex < videoDevices.length;
        
        let constraints = {
            video: {
                width: { ideal: 640 },
                height: { ideal: 480 }
            },
            audio: false
        };
        
        // 如果设备索引有效，使用指定设备
        if (isValidIndex) {
            constraints.video.deviceId = { exact: videoDevices[deviceIndex].deviceId };
            console.log(`使用摄像头设备 ${deviceIndex}: ${videoDevices[deviceIndex].label}`);
        } else {
            // 如果索引无效，使用默认设备并提示
            console.log(`摄像头设备 ${deviceIndex} 不可用，使用默认摄像头`);
            if (deviceIndex > 0) {
                alert(`摄像头 ${deviceIndex} 不可用，请检查设备连接`);
            }
        }
        
        // 请求摄像头访问权限
        stream2 = await navigator.mediaDevices.getUserMedia(constraints);
        
        // 设置视频源
        videoElement.srcObject = stream2;
        
        // 更新UI显示
        updateCameraStatus2(true);
        if (document.getElementById('locationInfo2')) {
            updateLocationInfo2(deviceIndex + 3);
        }
        
        console.log('第二个摄像头已启动');
    } catch (error) {
        console.error('启动第二个摄像头错误:', error);
        setAIStatusText2('摄像头访问失败');
        updateCameraStatus2(false);
        
        if (document.getElementById('locationInfo2')) {
            document.getElementById('locationInfo2').textContent = '摄像头连接失败';
        }
        
        // 如果是因为没有权限
        if (error.name === 'NotAllowedError') {
            alert('请允许访问摄像头以使用AI检测功能');
        } else if (error.name === 'OverconstrainedError') {
            // 如果是设备约束问题，尝试使用默认设备
            console.log('摄像头设备约束错误，尝试使用默认摄像头');
            try {
                stream2 = await navigator.mediaDevices.getUserMedia({ 
                    video: true, 
                    audio: false 
                });
                videoElement.srcObject = stream2;
                updateCameraStatus2(true);
            } catch (e) {
                console.error('默认摄像头也无法启动:', e);
            }
        }
    }
}

// 停止第二个摄像头
function stopCamera2() {
    if (stream2) {
        stream2.getTracks().forEach(track => track.stop());
        stream2 = null;
    }
    
    const videoElement = document.getElementById('videoElement2');
    if (videoElement && videoElement.srcObject) {
        videoElement.srcObject = null;
    }
    
    updateCameraStatus2(false);
}

// 更新第二个摄像头状态
function updateCameraStatus2(isActive) {
    const statusElement = document.getElementById('cameraStatus2');
    if (statusElement) {
        statusElement.textContent = isActive ? '已连接' : '未连接';
        statusElement.style.color = isActive ? '#4CAF50' : '#F44336';
    }
    
    // 更新在线摄像头计数
    updateOnlineCameras();
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

// 页面加载完成后自动检测并选择摄像头
document.addEventListener('DOMContentLoaded', function() {
    console.log('页面加载完成，检测摄像头');
    
    // 默认选择第一个摄像头
    if (document.getElementById('cameraBtn0')) {
        document.getElementById('cameraBtn0').classList.add('active');
    }
    
    // 默认选择第二个摄像头窗口的摄像头
    if (document.getElementById('cameraBtn3')) {
        document.getElementById('cameraBtn3').classList.add('active');
    }
    
    // 启动默认摄像头
    startCamera(0);
    startCamera2(0);
});

// 枚举视频设备
async function enumerateVideoDevices() {
    try {
        console.log('枚举视频设备...');
        
        // 检查是否支持mediaDevices
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
            console.error('浏览器不支持枚举设备');
            return;
        }
        
        // 首先请求摄像头权限，否则可能无法获取设备名称
        const hasPermission = await checkCameraPermission();
        if (!hasPermission) {
            console.warn('无法枚举设备：摄像头权限被拒绝');
            return;
        }
        
        // 获取所有媒体设备
        const devices = await navigator.mediaDevices.enumerateDevices();
        
        // 过滤出视频输入设备
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        console.log('找到视频设备:', videoDevices.length);
        videoDevices.forEach((device, index) => {
            console.log(`设备 ${index}: ID = ${device.deviceId.substr(0, 10)}..., 标签 = ${device.label || '无标签'}`);
        });
        
        // 更新设备选择按钮
        updateCameraButtons(videoDevices);
        
        return videoDevices;
    } catch (error) {
        console.error('枚举视频设备出错:', error);
        return [];
    }
}

// 更新摄像头选择按钮
function updateCameraButtons(videoDevices) {
    // 对于第一个摄像头窗口的按钮
    const buttons1 = [
        document.getElementById('cameraBtn0'),
        document.getElementById('cameraBtn1'), 
        document.getElementById('cameraBtn2')
    ];
    
    // 对于第二个摄像头窗口的按钮
    const buttons2 = [
        document.getElementById('cameraBtn3'),
        document.getElementById('cameraBtn4'), 
        document.getElementById('cameraBtn5')
    ];
    
    // 如果没有发现摄像头
    if (videoDevices.length === 0) {
        console.warn('未发现摄像头设备');
        // 禁用所有按钮，除了默认的
        buttons1.forEach((btn, index) => {
            if (btn && index > 0) {
                btn.disabled = true;
                btn.title = '未找到此摄像头';
            }
        });
        buttons2.forEach((btn, index) => {
            if (btn && index > 0) {
                btn.disabled = true;
                btn.title = '未找到此摄像头';
            }
        });
        return;
    }
    
    // 根据实际设备数量启用按钮
    videoDevices.forEach((device, index) => {
        // 第一个摄像头窗口最多显示三个摄像头
        if (index < 3 && buttons1[index]) {
            buttons1[index].disabled = false;
            buttons1[index].title = device.label || `摄像头 ${index+1}`;
        }
        
        // 第二个摄像头窗口也最多三个，但按钮索引从3开始
        if (index < 3 && buttons2[index]) {
            buttons2[index].disabled = false;
            buttons2[index].title = device.label || `摄像头 ${index+1}`;
        }
    });
    
    // 禁用超出实际设备数量的按钮
    for (let i = videoDevices.length; i < 3; i++) {
        if (buttons1[i]) {
            buttons1[i].disabled = true;
            buttons1[i].title = '未找到此摄像头';
        }
        if (buttons2[i]) {
            buttons2[i].disabled = true;
            buttons2[i].title = '未找到此摄像头';
        }
    }
}

// 处理第二个摄像头当前帧
function processCameraFrame2() {
    if (!streams[3]) {
        console.error('摄像头2未启动');
        return;
    }
    
    const video = document.getElementById('video3');
    
    // 创建一个临时canvas用于捕获视频帧
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
    
    // 将canvas内容转为base64
    const imageData = tempCanvas.toDataURL('image/jpeg');
    
    // 显示加载状态
    const aiStatus = document.getElementById('aiStatus2');
    if (aiStatus) {
        aiStatus.textContent = "正在分析...";
        aiStatus.style.color = "#1890ff";
    }
    
    const status2El = document.getElementById('status4');
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
            image: imageData,
            camera_id: 2  // 指定是第二个摄像头
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
                const canvas = document.getElementById('canvas3');
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
                addAlert(2, type, data.detections[0]?.confidence || 0.8);
                
                // 保存检测结果到数据库
                saveDetectionResult(data, 2);  // 传入摄像头ID
            }
            
            // 更新检测类型显示
            updateDetectionTypeDisplay2(data.detect_type);
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

// 更新第二个AI分析窗口的检测类型显示
function updateDetectionTypeDisplay2(detectType) {
    const videoStatus4 = safeGetElement('videoStatus4');
    if (!videoStatus4) return;
    
    if (detectType === 'zdjy_ld') {
        videoStatus4.textContent = "检测到流动摊位";
        videoStatus4.style.backgroundColor = 'rgba(255, 77, 79, 0.8)';
    } else if (detectType === 'zdjy_gd') {
        videoStatus4.textContent = "检测到固定摊位";
        videoStatus4.style.backgroundColor = 'rgba(82, 196, 26, 0.8)';
    } else {
        videoStatus4.textContent = "未检测到摊位";
        videoStatus4.style.backgroundColor = 'rgba(24, 144, 255, 0.8)';
    }
}

// 保存检测结果到数据库 (修改为支持指定摄像头ID)
function saveDetectionResult(data, cameraId = 1) {
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
            camera_id: cameraId, // 使用传入的摄像头ID
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

// 添加图像上传回退方案
function enableImageUploadFallback() {
    // 如果已存在回退界面，则不重复创建
    if (document.querySelector('.camera-fallback')) {
        return;
    }
    
    const fallbackDiv = document.createElement('div');
    fallbackDiv.className = 'camera-fallback';
    fallbackDiv.innerHTML = `
        <div class="fallback-message">
            <h3>摄像头不可用</h3>
            <p>您的浏览器不支持摄像头功能或摄像头访问被禁止。</p>
            <p>您可以：</p>
            <ul>
                <li>使用Chrome、Firefox或Edge浏览器</li>
                <li>检查浏览器摄像头权限设置</li>
                <li>使用下方的图片上传功能进行分析</li>
            </ul>
        </div>
        <div class="fallback-upload">
            <input type="file" id="fallbackImageUpload" accept="image/*" style="display:none">
            <button class="fallback-upload-btn" onclick="document.getElementById('fallbackImageUpload').click()">
                上传图片进行分析
            </button>
            <div id="fallbackUploadStatus"></div>
        </div>
    `;
    
    // 添加到页面
    const videoContainers = document.querySelectorAll('.video-container');
    if (videoContainers.length > 0) {
        videoContainers.forEach(container => {
            const clonedFallback = fallbackDiv.cloneNode(true);
            container.appendChild(clonedFallback);
        });
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .camera-fallback {
                background: rgba(0, 0, 0, 0.7);
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                color: white;
                text-align: center;
            }
            .fallback-message h3 {
                color: #ff4d4f;
                margin-top: 0;
            }
            .fallback-message ul {
                text-align: left;
                display: inline-block;
            }
            .fallback-upload {
                margin-top: 20px;
            }
            .fallback-upload-btn {
                background: #1890ff;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.3s;
            }
            .fallback-upload-btn:hover {
                background: #40a9ff;
                box-shadow: 0 0 10px rgba(24, 144, 255, 0.5);
            }
            #fallbackUploadStatus {
                margin-top: 10px;
                font-style: italic;
            }
        `;
        document.head.appendChild(style);
        
        // 添加上传图片事件监听
        document.querySelectorAll('#fallbackImageUpload').forEach(input => {
            input.addEventListener('change', function(e) {
                if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    const formData = new FormData();
                    formData.append('file', file);
                    
                    const statusElements = document.querySelectorAll('#fallbackUploadStatus');
                    statusElements.forEach(el => {
                        el.textContent = '正在上传并分析...';
                    });
                    
                    fetch('/api/analyze', {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === 'success') {
                            statusElements.forEach(el => {
                                el.textContent = '分析完成';
                            });
                            
                            // 显示分析结果
                            if (data.result_image) {
                                const resultImg = new Image();
                                resultImg.src = data.result_image;
                                resultImg.style.maxWidth = '100%';
                                const resultContainer = document.querySelector('#analysisResult');
                                if (resultContainer) {
                                    resultContainer.innerHTML = '';
                                    resultContainer.appendChild(resultImg);
                                    
                                    // 添加检测信息
                                    if (data.detection_count > 0) {
                                        const infoDiv = document.createElement('div');
                                        infoDiv.className = 'detection-info';
                                        infoDiv.innerHTML = `
                                            <p>检测到${data.detection_count}个目标</p>
                                            <p>类型: ${data.detect_type === 'zdjy_ld' ? '流动摊位' : '固定摊位'}</p>
                                            <p>置信度: ${Math.round((data.detections[0]?.confidence || 0) * 100)}%</p>
                                        `;
                                        resultContainer.appendChild(infoDiv);
                                    } else {
                                        const infoDiv = document.createElement('div');
                                        infoDiv.className = 'detection-info';
                                        infoDiv.innerHTML = '<p>未检测到目标</p>';
                                        resultContainer.appendChild(infoDiv);
                                    }
                                }
                            }
                        } else {
                            statusElements.forEach(el => {
                                el.textContent = '分析失败: ' + (data.message || '未知错误');
                            });
                        }
                    })
                    .catch(error => {
                        statusElements.forEach(el => {
                            el.textContent = '上传错误: ' + error.message;
                        });
                    });
                }
            });
        });
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成，准备初始化摄像头...');
    
    // 检测浏览器是否支持摄像头
    if (!window.cameraSupported) {
        console.warn('此浏览器不支持摄像头功能，启用回退方案');
        
        // 添加页面提示
        const alertDiv = document.createElement('div');
        alertDiv.className = 'browser-alert';
        alertDiv.innerHTML = `
            <strong>提示:</strong> 您的浏览器不支持摄像头功能。
            请使用最新版本的Chrome、Firefox或Edge浏览器以获得最佳体验。
        `;
        document.body.insertBefore(alertDiv, document.body.firstChild);
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .browser-alert {
                background-color: #fffbe6;
                border: 1px solid #ffe58f;
                padding: 10px 15px;
                margin-bottom: 15px;
                border-radius: 4px;
                color: #876800;
                text-align: center;
                position: sticky;
                top: 0;
                z-index: 1000;
            }
        `;
        document.head.appendChild(style);
    }
    
    // 其他初始化代码...
});

// 在startMonitorCamera函数中添加兼容性检测
async function startMonitorCamera(videoElement, constraints, cameraIndex, statusElement) {
    if (!window.cameraSupported) {
        console.error('此浏览器不支持摄像头API');
        if (statusElement) {
            statusElement.textContent = "摄像头API不可用";
            statusElement.className = "status offline";
        }
        return null;
    }
    
    try {
        console.log('请求摄像头访问权限:', JSON.stringify(constraints));
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (videoElement) {
            videoElement.srcObject = stream;
            try {
                await videoElement.play();
            } catch (playError) {
                console.error('视频播放失败:', playError);
            }
        }
        
        // 更新界面状态
        if (statusElement) {
            statusElement.textContent = "在线";
            statusElement.className = "status online";
        }
        
        // 存储流信息
        streams[cameraIndex] = stream;
        return stream;
    } catch (error) {
        console.error(`获取摄像头${cameraIndex}失败:`, error);
        if (statusElement) {
            statusElement.textContent = "离线";
            statusElement.className = "status offline";
        }
        
        // 尝试不指定deviceId获取摄像头
        console.log('尝试不指定deviceId获取摄像头...');
        return tryFallbackAccess(videoElement, cameraIndex, statusElement);
    }
}

// 添加回退访问摄像头的方法
async function tryFallbackAccess(videoElement, cameraIndex, statusElement) {
    if (!window.cameraSupported) {
        return null;
    }
    
    try {
        // 尝试用最简单的参数请求任意摄像头
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
        });
        
        if (videoElement) {
            videoElement.srcObject = fallbackStream;
            try {
                await videoElement.play();
            } catch (playError) {
                console.error('视频播放失败:', playError);
                throw playError;
            }
        }
        
        // 更新界面状态
        if (statusElement) {
            statusElement.textContent = "在线(回退模式)";
            statusElement.className = "status online";
        }
        
        // 存储流信息
        streams[cameraIndex] = fallbackStream;
        return fallbackStream;
    } catch (error) {
        console.error(`回退方法获取摄像头失败:`, error);
        
        if (statusElement) {
            statusElement.textContent = "不可用";
            statusElement.className = "status offline";
        }
        
        // 启用图片上传回退方案
        enableImageUploadFallback();
        
        return null;
    }
} 