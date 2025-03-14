// 初始化图表
let detectionTrendChart;
let typeDistributionChart;

// 颜色配置 - 更新为更适合深蓝色主题的颜色
const violationTypeToColor = {
    'zdjy_ld': '#1890ff',  // 流动摊位 - 更亮的蓝色
    'zdjy_gd': '#52c41a',  // 固定摊位 - 绿色
    'other': '#faad14'     // 其他 - 黄色
};

// 类型映射
const typeMapping = {
    'zdjy_ld': '流动摊位',
    'zdjy_gd': '固定摊位',
    'other': '其他'
};

// 实用函数 - 防抖与节流
// 防抖: 确保函数在一段时间内只执行一次
function debounce(func, wait = 300) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// 节流: 确保函数在一段时间内最多执行一次
function throttle(func, limit = 300) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 全局错误处理器
window.addEventListener('error', function(event) {
    console.error('全局错误:', event.message, event.filename, event.lineno);
    // 如果处于上传状态并发生错误，重置上传状态
    if (window.isUploading) {
        window.isUploading = false;
        const resultArea = document.getElementById('resultArea');
        if (resultArea) {
            resultArea.innerHTML = '<div class="error">操作过程中发生错误，请重试</div>';
        }
    }
    return false;
});

// 初始化页面
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    
    // 先检查登录状态
    fetch('/check_login', {
        method: 'GET',
        credentials: 'include'
    })
        .then(response => response.json())
        .then(data => {
            if (!data.logged_in) {
                console.error('会话已过期，重定向到登录页面');
                // 使用replace而不是assign，确保用户不能使用后退返回到未登录状态的页面
                window.location.replace('/login_page');
            } else {
                console.log('用户已登录:', data.username);
                
                // 在localStorage中保存登录状态作为备份
                localStorage.setItem('user_logged_in', 'true');
                localStorage.setItem('username', data.username);
                localStorage.setItem('login_timestamp', new Date().getTime());
                
                // 初始化所有功能
                try {
                    initCharts();
                    loadStats(); // 加载统计数据
                    initUpload();
                    loadLatestResult(); // 加载最新的分析结果
                    fetchChartData();
                    startStatsUpdate();
                } catch (error) {
                    console.error('初始化功能时出错:', error);
                    // 显示友好的错误消息
                    showErrorMessage('初始化页面时出错，请刷新页面重试');
                }
            }
        })
        .catch(error => {
            console.error('检查登录状态出错:', error);
            
            // 检查localStorage中的备份登录状态
            const isLoggedIn = localStorage.getItem('user_logged_in') === 'true';
            const loginTime = parseInt(localStorage.getItem('login_timestamp') || '0');
            const now = new Date().getTime();
            const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);
            
            // 如果本地存储显示用户在24小时内登录过，允许继续使用
            if (isLoggedIn && hoursSinceLogin < 24) {
                console.log('会话检查失败，但本地存储显示用户已登录');
                try {
                    initCharts();
                    loadStats();
                    initUpload();
                    loadLatestResult();
                    fetchChartData();
                    startStatsUpdate();
                } catch (e) {
                    console.error('使用本地登录状态初始化时出错:', e);
                }
            } else {
                // 如果没有本地登录状态或已过期，重定向到登录页面
                window.location.replace('/login_page');
            }
        });
});

// 显示错误消息函数
function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.position = 'fixed';
    errorDiv.style.top = '20px';
    errorDiv.style.left = '50%';
    errorDiv.style.transform = 'translateX(-50%)';
    errorDiv.style.padding = '10px 20px';
    errorDiv.style.background = 'rgba(255, 0, 0, 0.8)';
    errorDiv.style.color = 'white';
    errorDiv.style.borderRadius = '5px';
    errorDiv.style.zIndex = '9999';
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    // 5秒后自动移除
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// 初始化图表
function initCharts() {
    // 检测趋势图
    detectionTrendChart = echarts.init(document.getElementById('detectionTrendChart'));
    
    // 配置趋势图初始选项
    const trendOption = {
        title: {
            text: '近7天检测趋势',
            textStyle: {
                fontSize: 16,
                fontWeight: 'normal',
                color: '#e6e6e6'
            },
            left: 'center',
            top: 0
        },
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(1, 22, 53, 0.9)',
            borderColor: '#40a9ff',
            textStyle: {
                color: '#fff'
            }
        },
        xAxis: {
            type: 'category',
            data: [],
            axisLabel: {
                color: '#b7c4d5'
            },
            axisLine: {
                lineStyle: {
                    color: '#233656'
                }
            },
            axisTick: {
                show: false
            }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                color: '#b7c4d5'
            },
            splitLine: {
                lineStyle: {
                    color: 'rgba(35, 54, 86, 0.3)'
                }
            }
        },
        grid: {
            top: 60,
            left: '5%',
            right: '5%',
            bottom: '10%',
            containLabel: true
        },
        series: [{
            name: '检测数量',
            type: 'line',
            data: [],
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
            showSymbol: true,
            lineStyle: {
                width: 3,
                color: '#40a9ff'
            },
            itemStyle: {
                color: '#40a9ff',
                borderColor: '#fff',
                borderWidth: 2
            },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(64, 169, 255, 0.6)' },
                    { offset: 1, color: 'rgba(64, 169, 255, 0.0)' }
                ])
            }
        }]
    };
    
    // 设置趋势图选项
    detectionTrendChart.setOption(trendOption);
    
    // 类型分布图
    typeDistributionChart = echarts.init(document.getElementById('typeDistributionChart'));
    
    // 配置分布图初始选项
    const distributionOption = {
        title: {
            text: '类型分布',
            textStyle: {
                fontSize: 16,
                fontWeight: 'normal',
                color: '#e6e6e6'
            },
            left: 'center',
            top: 0
        },
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(1, 22, 53, 0.9)',
            borderColor: '#40a9ff',
            textStyle: {
                color: '#fff'
            },
            formatter: '{b}: {c} ({d}%)'
        },
        legend: {
            orient: 'horizontal',
            bottom: 0,
            left: 'center',
            itemWidth: 15,
            itemHeight: 10,
            textStyle: {
                color: '#b7c4d5',
                fontSize: 12
            }
        },
        series: [{
            name: '类型分布',
            type: 'pie',
            radius: ['35%', '70%'],
            center: ['50%', '50%'],
            avoidLabelOverlap: true,
            itemStyle: {
                borderRadius: 5,
                borderColor: '#011635',
                borderWidth: 2
            },
            label: {
                show: false
            },
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                },
                label: {
                    show: true,
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: '#fff'
                }
            },
            labelLine: {
                show: false
            },
            data: []
        }]
    };
    
    // 设置分布图选项
    typeDistributionChart.setOption(distributionOption);
    
    // 添加窗口大小调整监听
    window.addEventListener('resize', function() {
        if (detectionTrendChart) {
            detectionTrendChart.resize();
        }
        if (typeDistributionChart) {
            typeDistributionChart.resize();
        }
    });
    
    // 延时触发一次调整，确保完全加载
    setTimeout(() => {
        if (detectionTrendChart) {
            detectionTrendChart.resize();
        }
        if (typeDistributionChart) {
            typeDistributionChart.resize();
        }
    }, 200);
}

// 获取图表数据
async function fetchChartData() {
    // 添加加载状态
    detectionTrendChart.showLoading({
        text: '加载中...',
        color: '#40a9ff',
        textColor: '#fff',
        maskColor: 'rgba(0, 0, 0, 0.2)',
        zlevel: 0
    });
    
    typeDistributionChart.showLoading({
        text: '加载中...',
        color: '#40a9ff',
        textColor: '#fff',
        maskColor: 'rgba(0, 0, 0, 0.2)',
        zlevel: 0
    });

    fetch('/api/analysis/chart-data', {
        method: 'GET',  // 明确指定使用GET方法
        headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'  // 明确表明这是AJAX请求
        },
        credentials: 'include'  // 改为include确保在跨域情况下也发送cookies
    })
        .then(response => {
            if (!response.ok) {
                // 特别处理401未授权状态（会话过期）
                if (response.status === 401) {
                    console.error('会话已过期，需要重新登录');
                    
                    // 确保用户知道会话过期
                    showErrorMessage('您的会话已过期，即将跳转到登录页面');
                    
                    // 延迟3秒后跳转，让用户有时间看到消息
                    setTimeout(() => {
                        // 清除localStorage中的登录状态
                        localStorage.removeItem('user_logged_in');
                        localStorage.removeItem('username');
                        localStorage.removeItem('login_timestamp');
                        
                        // 重定向到登录页面
                        window.location.replace('/login_page');
                    }, 3000);
                    
                    throw new Error('会话已过期');
                }
                throw new Error('网络响应不正常: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            // 隐藏加载状态
            detectionTrendChart.hideLoading();
            typeDistributionChart.hideLoading();
            
            console.log('获取到图表数据:', data);
            
            // 检查是否有会话过期消息
            if (data.success === false && data.message && data.message.includes('会话已过期')) {
                console.error('会话已过期，需要重新登录');
                showErrorMessage('您的会话已过期，即将跳转到登录页面');
                setTimeout(() => {
                    window.location.replace('/login_page');
                }, 3000);
                return;
            }
            
            if (data && data.trend && data.distribution) {
                // 更新趋势图
                updateTrendChart(data.trend);
                
                // 更新分布图
                updateDistributionChart(data.distribution);
            } else {
                console.warn('获取到的图表数据格式不正确:', data);
                // 显示空数据状态
                showEmptyDataState();
            }
        })
        .catch(error => {
            // 隐藏加载状态
            detectionTrendChart.hideLoading();
            typeDistributionChart.hideLoading();
            
            console.error('获取图表数据失败:', error);
            
            // 如果不是会话过期错误，显示一般错误状态
            if (!error.message.includes('会话已过期')) {
                // 显示错误状态
                showErrorState(error.message);
                // 展示用户友好的错误消息
                showErrorMessage('加载图表数据失败，请刷新页面重试');
            }
        });
}

// 显示空数据状态
function showEmptyDataState() {
    detectionTrendChart.setOption({
        title: {
            text: '暂无数据',
            left: 'center',
            top: 'center',
            textStyle: {
                fontSize: 16,
                color: '#909399'
            }
        },
        series: [{
            type: 'line',
            data: []
        }]
    });
    
    typeDistributionChart.setOption({
        title: {
            text: '暂无数据',
            left: 'center',
            top: 'center',
            textStyle: {
                fontSize: 16,
                color: '#909399'
            }
        },
        series: [{
            type: 'pie',
            data: []
        }]
    });
}

// 显示错误状态
function showErrorState(message) {
    const errorText = message || '加载数据失败';
    
    detectionTrendChart.setOption({
        title: {
            text: errorText,
            left: 'center',
            top: 'center',
            textStyle: {
                fontSize: 16,
                color: '#f56c6c'
            }
        },
        series: [{
            type: 'line',
            data: []
        }]
    });
    
    typeDistributionChart.setOption({
        title: {
            text: errorText,
            left: 'center',
            top: 'center',
            textStyle: {
                fontSize: 16,
                color: '#f56c6c'
            }
        },
        series: [{
            type: 'pie',
            data: []
        }]
    });
}

// 更新趋势图
function updateTrendChart(trendData) {
    if (!trendData || !trendData.dates || !trendData.counts || trendData.dates.length === 0) {
        showEmptyDataState();
        return;
    }
    
    const option = {
        title: {
            text: '近7天检测趋势',
            textStyle: {
                fontSize: 16,
                fontWeight: 'normal',
                color: '#e6e6e6'
            },
            left: 'center',
            top: 0
        },
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(1, 22, 53, 0.9)',
            borderColor: '#40a9ff',
            textStyle: {
                color: '#fff'
            },
            formatter: function(params) {
                const param = params[0];
                return `${param.axisValue}<br />检测数量: <b>${param.value}</b>`;
            }
        },
        xAxis: {
            type: 'category',
            data: trendData.dates,
            axisLabel: {
                color: '#b7c4d5',
                formatter: function(value) {
                    // 只显示月份和日期
                    return value.substring(5);
                }
            },
            axisLine: {
                lineStyle: {
                    color: '#233656'
                }
            },
            axisTick: {
                show: false
            }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                color: '#b7c4d5'
            },
            splitLine: {
                lineStyle: {
                    color: 'rgba(35, 54, 86, 0.3)'
                }
            }
        },
        grid: {
            top: '60',
            left: '5%',
            right: '5%',
            bottom: '10%',
            containLabel: true
        },
        series: [{
            name: '检测数量',
            data: trendData.counts,
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 8,
            showSymbol: true,
            lineStyle: {
                width: 3,
                color: '#40a9ff'
            },
            itemStyle: {
                color: '#40a9ff',
                borderColor: '#fff',
                borderWidth: 2
            },
            emphasis: {
                itemStyle: {
                    color: '#40a9ff',
                    borderColor: '#fff',
                    borderWidth: 3,
                    shadowColor: 'rgba(64, 169, 255, 0.5)',
                    shadowBlur: 10
                }
            },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(64, 169, 255, 0.6)' },
                    { offset: 1, color: 'rgba(64, 169, 255, 0.0)' }
                ])
            },
            animation: true,
            animationDuration: 2000,
            animationEasing: 'cubicOut'
        }]
    };
    
    detectionTrendChart.setOption(option);
}

// 更新分布图
function updateDistributionChart(distributionData) {
    if (!distributionData || distributionData.length === 0) {
        showEmptyDataState();
        return;
    }
    
    const data = distributionData.map(item => {
        const type = item.type;
        const originalType = item.original_type || 'other';
        const colorKey = violationTypeToColor[originalType] ? originalType : 'other';
        
        return {
            name: type,
            value: item.count,
            itemStyle: {
                color: violationTypeToColor[colorKey]
            }
        };
    });
    
    const option = {
        title: {
            text: '类型分布',
            textStyle: {
                fontSize: 16,
                fontWeight: 'normal',
                color: '#e6e6e6'
            },
            left: 'center',
            top: 0
        },
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(1, 22, 53, 0.9)',
            borderColor: '#40a9ff',
            textStyle: {
                color: '#fff'
            },
            formatter: function(params) {
                return `${params.name}<br />数量: <b>${params.value}</b> (${params.percent}%)`;
            }
        },
        legend: {
            type: 'scroll',
            orient: 'horizontal',
            bottom: 0,
            left: 'center',
            itemWidth: 15,
            itemHeight: 10,
            icon: 'roundRect',
            textStyle: {
                color: '#b7c4d5',
                fontSize: 12
            },
            pageTextStyle: {
                color: '#b7c4d5'
            },
            pageIconColor: '#40a9ff',
            pageIconInactiveColor: '#233656'
        },
        series: [{
            name: '类型分布',
            type: 'pie',
            radius: ['35%', '70%'],
            center: ['50%', '50%'],
            avoidLabelOverlap: true,
            itemStyle: {
                borderRadius: 5,
                borderColor: '#011635',
                borderWidth: 2
            },
            label: {
                show: false
            },
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                },
                label: {
                    show: true,
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: '#fff'
                }
            },
            labelLine: {
                show: false
            },
            data: data,
            animationType: 'scale',
            animationEasing: 'elasticOut',
            animationDelay: function (idx) {
                return Math.random() * 200;
            },
            animation: true,
            animationDuration: 2000
        }]
    };
    
    typeDistributionChart.setOption(option);
}

// 加载统计数据
async function loadStats() {
    try {
        const response = await fetch('/api/stats', {
            method: 'GET',
            credentials: 'include',  // 确保发送cookies以维持会话
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        const data = await response.json();
        
        if (data) {
            // 更新今日检测数据
            document.getElementById('todayCount').textContent = data.today_count || '0';
            document.getElementById('todayTrend').textContent = formatTrend(data.today_trend);
            document.getElementById('todayTrend').className = `card-trend ${getTrendClass(data.today_trend)}`;
            
            // 更新处理率数据
            document.getElementById('processRate').textContent = `${data.process_rate || '0'}%`;
            document.getElementById('processRateTrend').textContent = formatTrend(data.process_rate_trend);
            document.getElementById('processRateTrend').className = `card-trend ${getTrendClass(data.process_rate_trend)}`;
            
            // 更新平均响应时间数据
            document.getElementById('avgResponse').textContent = `${data.avg_response || '0'}分钟`;
            document.getElementById('avgResponseTrend').textContent = formatTrend(data.avg_response_trend);
            document.getElementById('avgResponseTrend').className = `card-trend ${getTrendClass(data.avg_response_trend)}`;
            
            // 更新累计处理数据
            document.getElementById('totalCount').textContent = data.total_count || '0';
            document.getElementById('totalTrend').textContent = formatTrend(data.total_trend);
            document.getElementById('totalTrend').className = `card-trend ${getTrendClass(data.total_trend)}`;
        }
    } catch (error) {
        console.error('加载统计数据失败:', error);
    }
}

// 格式化趋势显示
function formatTrend(value) {
    if (!value) return '--';
    const absValue = Math.abs(value);
    return value > 0 ? `↑ ${absValue}%` : `↓ ${absValue}%`;
}

// 获取趋势样式类
function getTrendClass(value) {
    if (!value) return '';
    return value > 0 ? 'up' : 'down';
}

// 定期更新统计数据
function startStatsUpdate() {
    loadStats(); // 立即加载一次
    setInterval(loadStats, 60000); // 每分钟更新一次
}

// 处理文件上传的函数
function handleFiles(files) {
    // 防止重复上传
    if (window.isUploading) {
        console.log('上传已在进行中，忽略请求');
        return;
    }
    
    window.isUploading = true;
    console.log('开始处理文件上传...');
    
    // 更新上传提示文字
    const uploadText = document.getElementById('uploadText');
    if (uploadText) {
        uploadText.textContent = "文件正在上传中...";
    }
    
    const file = files[0]; // 只处理第一个文件
    if (!file) {
        window.isUploading = false;
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    const resultArea = document.getElementById('resultArea');
    resultArea.innerHTML = '<div class="loading">正在分析中...<div class="spinner"></div></div>';
    
    // 预览图片
    const previewContainer = document.getElementById('previewContainer');
    const imagePreview = document.getElementById('imagePreview');
    const videoPreview = document.getElementById('videoPreview');
    const uploadHint = document.getElementById('uploadHint');
    
    // 显示预览
    if (file.type.startsWith('image/')) {
        imagePreview.src = URL.createObjectURL(file);
        imagePreview.style.display = 'block';
        videoPreview.style.display = 'none';
        previewContainer.style.display = 'block';
        uploadHint.style.display = 'none';
        console.log('显示图片预览');
    } else if (file.type.startsWith('video/')) {
        videoPreview.src = URL.createObjectURL(file);
        videoPreview.style.display = 'block';
        imagePreview.style.display = 'none';
        previewContainer.style.display = 'block';
        uploadHint.style.display = 'none';
        console.log('显示视频预览');
    }
    
    console.log('发送上传请求...');
    fetch('/api/analyze', {
        method: 'POST',
        body: formData,
        credentials: 'include'  // 确保发送cookies以维持会话
    })
    .then(response => {
        console.log('服务器响应状态:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('上传响应:', data);
        window.isUploading = false; // 重置上传标志
        
        // 恢复上传提示文字
        if (uploadText) {
            uploadText.textContent = "拖拽文件到此处或点击上传";
        }
        
        if (data.success) {
            // 显示分析结果
            resultArea.innerHTML = `
                <div class="result-images">
                    <div class="image-container">
                        ${data.is_video ? 
                            `<video src="${data.result_image}?t=${new Date().getTime()}" 
                                    class="result-image" 
                                    controls
                                    preload="auto"
                                    playsinline>
                                您的浏览器不支持视频播放。
                            </video>` :
                            `<img src="${data.result_image}?t=${new Date().getTime()}" 
                                  class="result-image" 
                                  alt="分析结果"
                                  onerror="this.onerror=null; this.src='/static/img/error.png'; this.alt='加载失败';">`
                        }
                    </div>
                    <div class="download-section">
                        <button class="download-btn" onclick="downloadResult('${data.result_image.split('/').pop()}')">
                            <span class="download-icon">⬇️</span>
                            下载分析结果
                        </button>
                    </div>
                </div>
            `;
            
            // 上传成功后重新加载统计数据
            loadStats();
            fetchChartData();
        } else {
            resultArea.innerHTML = `<div class="error">${data.message || '分析失败'}</div>`;
        }
    })
    .catch(error => {
        console.error('上传错误:', error);
        window.isUploading = false; // 重置上传标志
        
        // 恢复上传提示文字
        if (uploadText) {
            uploadText.textContent = "拖拽文件到此处或点击上传";
        }
        
        resultArea.innerHTML = '<div class="error">上传或分析过程出错</div>';
    });
}

// 初始化上传功能
function initUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const previewContainer = document.getElementById('previewContainer');
    const uploadHint = document.getElementById('uploadHint');
    
    if (!uploadArea || !fileInput) {
        console.error('上传元素未找到');
        return;
    }
    
    // 清除之前可能存在的事件监听器，防止重复触发
    const newUploadArea = uploadArea.cloneNode(true);
    uploadArea.parentNode.replaceChild(newUploadArea, uploadArea);
    const newFileInput = fileInput.cloneNode(true);
    fileInput.parentNode.replaceChild(newFileInput, fileInput);
    
    // 重新获取DOM引用
    const refreshedUploadArea = document.getElementById('uploadArea');
    const refreshedFileInput = document.getElementById('fileInput');
    
    // 使用防抖处理文件上传，并增加延迟
    const debouncedHandleFiles = debounce((files) => {
        console.log('触发文件处理');
        handleFiles(files);
    }, 500);  // 防抖延迟到500毫秒

    // 简化点击处理逻辑
    refreshedUploadArea.onclick = function(e) {
        // 如果正在上传，不允许再次点击
        if (window.isUploading) {
            console.log('正在上传中，忽略点击');
            return;
        }
        
        console.log('点击上传区域');
        e.preventDefault();
        refreshedFileInput.click();
    };

    refreshedUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        refreshedUploadArea.classList.add('dragover');
    });

    refreshedUploadArea.addEventListener('dragleave', () => {
        refreshedUploadArea.classList.remove('dragover');
    });

    refreshedUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        refreshedUploadArea.classList.remove('dragover');
        
        // 如果正在上传，不处理拖放
        if (window.isUploading) {
            return;
        }
        
        console.log('拖放文件');
        debouncedHandleFiles(e.dataTransfer.files);
    });

    // 单独处理文件输入变化
    refreshedFileInput.onchange = function(e) {
        console.log('文件输入变化');
        e.stopPropagation();
        
        if (refreshedFileInput.files && refreshedFileInput.files.length > 0) {
            console.log(`选择了${refreshedFileInput.files.length}个文件`);
            debouncedHandleFiles(refreshedFileInput.files);
        }
    };
    
    // 页面加载时初始化上传状态
    window.isUploading = false;
    
    // 添加进入点日志
    console.log('上传功能初始化完成');
}

// 加载最新的分析结果
function loadLatestResult() {
    console.log('加载最新分析结果...');
    fetch('/api/latest_result', {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
        .then(response => {
            if (!response.ok) {
                console.error(`API响应错误: ${response.status} - ${response.statusText}`);
                if (response.status === 401) {
                    throw new Error('用户未登录，请刷新页面并重新登录');
                } else if (response.status === 500) {
                    throw new Error('服务器内部错误，请稍后再试');
                } else {
                    throw new Error(`请求失败(${response.status})`);
                }
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                const resultArea = document.getElementById('resultArea');
                if (!resultArea) {
                    console.error('未找到resultArea元素');
                    return;
                }
                
                if (!data.data || !data.data.result_image) {
                    console.error('返回的数据不完整:', data);
                    resultArea.innerHTML = '<div class="error-message">数据不完整，无法显示结果</div>';
                    return;
                }
                
                // 处理图片路径 - 检查是否有效路径
                let resultImage = data.data.result_image;
                
                // 确保路径以/开头
                if (!resultImage.startsWith('/')) {
                    resultImage = '/' + resultImage;
                }
                
                // 检查是否是static目录下的图片，如果是，可能是一个错误的路径
                if (resultImage.startsWith('/static/results.jpg')) {
                    console.warn('检测到可能错误的图片路径，改用默认图片');
                    resultImage = '/static/default_result.jpg';
                }
                
                // 添加时间戳防止缓存
                const timestamp = new Date().getTime();
                resultImage = `${resultImage}?t=${timestamp}`;
                
                console.log('处理后的图片路径:', resultImage);
                
                resultArea.innerHTML = `
                    <div class="result-images">
                        <div class="image-container">
                            ${data.data.is_video ? 
                                `<video src="${resultImage}" 
                                        class="result-image" 
                                        controls>
                                    您的浏览器不支持视频播放。
                                </video>` :
                                `<img src="${resultImage}" 
                                      class="result-image" 
                                      alt="分析结果"
                                      onerror="handleImageError(this, 1)">`
                            }
                        </div>
                        <div class="download-section">
                            <button class="download-btn" onclick="downloadResult('${resultImage.split('/').pop().split('?')[0]}')">
                                <span class="download-icon">⬇️</span>
                                下载分析结果
                            </button>
                        </div>
                    </div>
                    <div class="confidence-info">
                        <div class="confidence-label">检测类型：${data.data.detect_type || '未知'}</div>
                        <div class="confidence-label">置信度：${data.data.confidence ? (data.data.confidence * 100).toFixed(2) + '%' : '未知'}</div>
                    </div>
                `;
                
                console.log('最新分析结果加载成功，图片路径:', resultImage);
            } else {
                console.log('无最新分析结果:', data.message);
                const resultArea = document.getElementById('resultArea');
                if (resultArea) {
                    resultArea.innerHTML = '<div class="empty-state">暂无分析记录，请上传图片进行分析</div>';
                }
            }
        })
        .catch(error => {
            console.error('加载最新结果失败:', error);
            const resultArea = document.getElementById('resultArea');
            if (resultArea) {
                resultArea.innerHTML = `<div class="error-message">
                    <div class="error-icon">❌</div>
                    <div class="error-text">加载分析结果失败: ${error.message || '未知错误'}</div>
                    <div class="error-hint">请刷新页面或稍后再试</div>
                </div>`;
            }
        });
}

// 修改图片错误处理函数
function handleImageError(img, maxRetries) {
    console.log('图片加载错误处理开始，当前图片路径:', img.src);
    if (img.retryCount === undefined) {
        img.retryCount = 0;
    }
    
    if (img.retryCount < maxRetries) {
        img.retryCount++;
        console.log('图片加载失败，尝试加载默认图片');
        // 使用绝对路径和时间戳防止缓存
        const timestamp = new Date().getTime();
        // 检查当前路径是否已经是默认图片
        if (img.src.includes('default_result.jpg')) {
            console.error('默认图片也无法加载，显示错误信息');
            img.style.display = 'none';
            img.parentElement.innerHTML = '<div class="error-message">图片加载失败</div>';
        } else {
            img.src = `/static/default_result.jpg?t=${timestamp}`;
            console.log('已将图片路径更改为默认图片:', img.src);
        }
    } else {
        console.error('图片加载失败，已达到最大重试次数');
        img.style.display = 'none';
        img.parentElement.innerHTML = '<div class="error-message">图片加载失败</div>';
    }
}

// 下载结果文件
function downloadResult(filename) {
    window.location.href = `/download_result/${filename}`;
}

// 添加恢复最近结果的函数
function restoreLatestResult() {
    return fetch('/api/latest_result')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.data) {
                // 恢复预览
                const previewContainer = document.getElementById('previewContainer');
                const imagePreview = document.getElementById('imagePreview');
                const videoPreview = document.getElementById('videoPreview');
                const uploadHint = document.getElementById('uploadHint');
                
                previewContainer.style.display = 'block';
                uploadHint.style.display = 'none';
                
                if (data.data.is_video) {
                    videoPreview.src = data.data.file_path;
                    videoPreview.style.display = 'block';
                    imagePreview.style.display = 'none';
                } else {
                    imagePreview.src = data.data.file_path;
                    imagePreview.style.display = 'block';
                    videoPreview.style.display = 'none';
                }
                
                // 恢复分析结果
                const resultArea = document.getElementById('resultArea');
                resultArea.innerHTML = `
                    <div class="result-images">
                        <div class="image-container">
                            ${data.data.is_video ? 
                                `<video src="${data.data.result_image}" 
                                        class="result-image" 
                                        controls
                                        preload="auto"
                                        playsinline>
                                    您的浏览器不支持视频播放。
                                </video>` :
                                `<img src="${data.data.result_image}" 
                                      class="result-image" 
                                      alt="分析结果"
                                      onerror="this.onerror=null; this.src='/static/img/error.png'; this.alt='加载失败';">`
                            }
                        </div>
                        <div class="download-section">
                            <button class="download-btn" onclick="downloadResult('${data.data.result_image.split('/').pop()}')">
                                <span class="download-icon">⬇️</span>
                                下载分析结果
                            </button>
                        </div>
                    </div>
                `;
                return true; // 表示有最近的结果
            }
            return false; // 表示没有最近的结果
        })
        .catch(error => {
            console.error('Error:', error);
            return false;
        });
}

// 保存状态到 localStorage
function saveToLocalStorage(uploadPreview, analysisResult) {
    const state = {
        uploadPreview: uploadPreview,
        analysisResult: analysisResult,
        timestamp: new Date().getTime()
    };
    localStorage.setItem('analysisState', JSON.stringify(state));
}

// 从 localStorage 恢复状态
function restoreFromLocalStorage() {
    const state = localStorage.getItem('analysisState');
    if (state) {
        const { uploadPreview, analysisResult, timestamp } = JSON.parse(state);
        
        // 检查状态是否在24小时内
        const now = new Date().getTime();
        const hoursDiff = (now - timestamp) / (1000 * 60 * 60);
        
        if (hoursDiff <= 24) {
            // 恢复上传预览
            if (uploadPreview) {
                const previewContainer = document.getElementById('previewContainer');
                const imagePreview = document.getElementById('imagePreview');
                const videoPreview = document.getElementById('videoPreview');
                const uploadHint = document.getElementById('uploadHint');
                
                previewContainer.style.display = 'block';
                uploadHint.style.display = 'none';
                
                if (uploadPreview.isVideo) {
                    videoPreview.src = uploadPreview.src;
                    videoPreview.style.display = 'block';
                    imagePreview.style.display = 'none';
                } else {
                    imagePreview.src = uploadPreview.src;
                    imagePreview.style.display = 'block';
                    videoPreview.style.display = 'none';
                }
            }
            
            // 恢复分析结果
            if (analysisResult) {
                const resultArea = document.getElementById('resultArea');
                resultArea.innerHTML = analysisResult;
            }
        } else {
            // 如果状态超过24小时，清除它
            localStorage.removeItem('analysisState');
        }
    }
}