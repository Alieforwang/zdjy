// 初始化图表
let detectionTrendChart;
let typeDistributionChart;
let detection3DChart;  // 新增：3D检测热力图
let completionLiquidChart;  // 新增：检测完成率水球图
let typeRadarChart;  // 新增：占道经营类型雷达图
let accuracyTrendChart;  // 新增：检测精度变化曲线图

// 颜色配置 - 更新为更适合深蓝色主题的颜色
const violationTypeToColor = {
    'zdjy_ld': '#1890ff',  // 流动摊位 - 蓝色
    'zdjy_gd': '#52c41a'   // 固定摊位 - 绿色
};

// 类型映射
const typeMapping = {
    'zdjy_ld': '流动摊位',
    'zdjy_gd': '固定摊位',
    'zdjy_ld_zdjy_gd': '混合摊位'
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

// 处理未捕获的Promise拒绝
window.addEventListener('unhandledrejection', function(event) {
    console.warn('未处理的Promise拒绝:', event.reason);
    // 避免在控制台显示"runtime.lastError"错误
    if (event.reason && event.reason.message && 
        event.reason.message.includes('message port closed')) {
        event.preventDefault();  // 阻止默认处理
    }
});

// 页面卸载前清理所有挂起的请求
window.addEventListener('beforeunload', function() {
    // 如果正在上传，标记为中止
    if (window.isUploading) {
        window.isUploading = false;
    }
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
    console.log('初始化图表');
    
    // 初始化图表实例
    detectionTrendChart = echarts.init(document.getElementById('detectionTrendChart'));
    typeDistributionChart = echarts.init(document.getElementById('typeDistributionChart'));
    detection3DChart = echarts.init(document.getElementById('detection3DChart'));
    completionLiquidChart = echarts.init(document.getElementById('completionLiquidChart'));
    typeRadarChart = echarts.init(document.getElementById('typeRadarChart'));
    accuracyTrendChart = echarts.init(document.getElementById('accuracyTrendChart'));
    
    // 设置基本的图表选项
    // 趋势图默认选项
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
    
    // 分布图默认选项
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
    
    // 3D热力图默认选项
    const option3D = {
        title: {
            text: '检测点分布',
            textStyle: {
                color: '#fff',
                fontSize: 14
            },
            left: 'center'
        },
        tooltip: {},
        visualMap: {
            show: true,
            dimension: 2,
            min: 0,
            max: 30,
            inRange: {
                color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
            }
        },
        xAxis3D: {
            type: 'value',
            name: '经度',
            nameTextStyle: {
                color: '#fff'
            },
            axisLabel: {
                color: '#fff'
            }
        },
        yAxis3D: {
            type: 'value',
            name: '纬度',
            nameTextStyle: {
                color: '#fff'
            },
            axisLabel: {
                color: '#fff'
            }
        },
        zAxis3D: {
            type: 'value',
            name: '检测数',
            nameTextStyle: {
                color: '#fff'
            },
            axisLabel: {
                color: '#fff'
            }
        },
        grid3D: {
            viewControl: {
                autoRotate: true,
                autoRotateSpeed: 10,
                distance: 150
            },
            light: {
                main: {
                    intensity: 1.2
                },
                ambient: {
                    intensity: 0.3
                }
            }
        },
        series: [{
            type: 'bar3D',
            data: generateMockLocationData(),
            shading: 'lambert',
            itemStyle: {
                opacity: 0.8
            },
            emphasis: {
                itemStyle: {
                    color: '#fff200'
                }
            }
        }]
    };
    
    // 设置3D热力图选项
    detection3DChart.setOption(option3D);
    
    // 水球图默认选项
    const liquidOption = {
        title: {
            text: '本月完成率',
            textStyle: {
                color: '#fff',
                fontSize: 14
            },
            left: 'center'
        },
        series: [{
            type: 'liquidFill',
            data: [0.75, 0.68, 0.61],
            color: ['#1890ff', '#71c5ff', '#a8dfff'],
            backgroundStyle: {
                color: 'rgba(0, 20, 50, 0.8)'
            },
            radius: '75%',
            center: ['50%', '50%'],
            label: {
                normal: {
            textStyle: {
                        color: '#fff',
                        fontSize: 40,
                        fontWeight: 'bold'
                    }
                }
            },
            outline: {
                borderDistance: 5,
                itemStyle: {
                    borderWidth: 5,
                    borderColor: 'rgba(20, 70, 140, 0.8)',
                    shadowColor: 'rgba(0, 0, 0, 0.8)',
                    shadowBlur: 20
                }
            }
        }]
    };
    
    // 设置水球图选项
    completionLiquidChart.setOption(liquidOption);
    
    // 雷达图默认选项
    const radarOption = {
        title: {
            text: '占道经营类型对比',
            textStyle: {
                color: '#fff',
                fontSize: 14
            },
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            },
            formatter: function(params) {
                const value = params[0].value;
                const name = params[0].name;
                return `${name}<br/>数量: ${value}`;
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '8%',
            top: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: ['流动摊位', '固定摊位'],
            axisLabel: {
                color: '#e6e6e6'
            },
            axisLine: {
                lineStyle: {
                    color: '#3a5178'
                }
            }
        },
        yAxis: {
            type: 'value',
            name: '数量',
            minInterval: 1,
            axisLabel: {
                color: '#e6e6e6'
            },
            axisLine: {
                lineStyle: {
                    color: '#3a5178'
                }
            },
            splitLine: {
                lineStyle: {
                    color: 'rgba(58, 81, 120, 0.3)'
                }
            }
        },
        series: [{
            name: '数量',
            type: 'bar',
            data: [0, 0],
            barWidth: '40%',
            itemStyle: {
                color: function(params) {
                    return params.dataIndex === 0 ? '#1890ff' : '#52c41a';
                },
                borderRadius: [5, 5, 0, 0]
            },
            label: {
                show: true,
                position: 'top',
                formatter: '{c}',
                color: '#e6e6e6'
            }
        }]
    };
    
    // 设置雷达图选项
    typeRadarChart.setOption(radarOption);
    
    // 精度变化曲线图默认选项
    const accuracyOption = {
        title: {
            text: '近7天检测精度变化',
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
            formatter: '{b}<br/>{a0}: {c0}%<br/>{a1}: {c1}%'
        },
        legend: {
            data: ['流动摊位', '固定摊位'],
            bottom: 0,
            textStyle: {
                color: '#e6e6e6'
            }
        },
        grid: {
            top: 60,
            left: '5%',
            right: '5%',
            bottom: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: generateLast7Days(),
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
            name: '精度(%)',
            nameTextStyle: {
                color: '#b7c4d5'
            },
            min: 70,
            max: 100,
            axisLabel: {
                color: '#b7c4d5',
                formatter: '{value}%'
            },
            splitLine: {
                lineStyle: {
                    color: 'rgba(35, 54, 86, 0.3)'
                }
            }
        },
        series: [
            {
                name: '流动摊位',
            type: 'line',
                data: generateRandomAccuracy(),
            smooth: true,
                symbolSize: 6,
                itemStyle: {
                    color: '#1890ff'
                },
            lineStyle: {
                width: 3,
                    color: '#1890ff'
                }
            },
            {
                name: '固定摊位',
                type: 'line',
                data: generateRandomAccuracy(),
                smooth: true,
                symbolSize: 6,
            itemStyle: {
                    color: '#52c41a'
                },
                lineStyle: {
                    width: 3,
                    color: '#52c41a'
                }
            }
        ]
    };
    
    // 设置精度变化曲线图选项
    accuracyTrendChart.setOption(accuracyOption);
    
    // 添加窗口大小调整监听
    window.addEventListener('resize', function() {
        if (detectionTrendChart) {
            detectionTrendChart.resize();
        }
        if (typeDistributionChart) {
            typeDistributionChart.resize();
        }
        if (detection3DChart) {
            detection3DChart.resize();
        }
        if (completionLiquidChart) {
            completionLiquidChart.resize();
        }
        if (typeRadarChart) {
            typeRadarChart.resize();
        }
        if (accuracyTrendChart) {
            accuracyTrendChart.resize();
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
        if (detection3DChart) {
            detection3DChart.resize();
        }
        if (completionLiquidChart) {
            completionLiquidChart.resize();
        }
        if (typeRadarChart) {
            typeRadarChart.resize();
        }
        if (accuracyTrendChart) {
            accuracyTrendChart.resize();
        }
    }, 200);
}

// 生成模拟位置数据
function generateMockLocationData() {
    const data = [];
    // 生成10x10网格的模拟数据
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
            // 随机生成高度(检测数量)
            const height = Math.round(Math.random() * 25) + 5;
            data.push([i, j, height]);
        }
    }
    return data;
}

// 生成过去7天的日期
function generateLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date.getMonth() + 1 + '/' + date.getDate());
    }
    return days;
}

// 生成随机精度数据（75%-95%之间）
function generateRandomAccuracy() {
    const accuracy = [];
    for (let i = 0; i < 7; i++) {
        accuracy.push((75 + Math.random() * 20).toFixed(1));
    }
    return accuracy;
}

// 显示图表加载状态
function showLoadingState() {
    // 添加加载状态到所有图表
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
    
    detection3DChart.showLoading({
        text: '加载中...',
        color: '#40a9ff',
        textColor: '#fff',
        maskColor: 'rgba(0, 0, 0, 0.2)',
        zlevel: 0
    });
    
    completionLiquidChart.showLoading({
        text: '加载中...',
        color: '#40a9ff',
        textColor: '#fff',
        maskColor: 'rgba(0, 0, 0, 0.2)',
        zlevel: 0
    });
    
    typeRadarChart.showLoading({
        text: '加载中...',
        color: '#40a9ff',
        textColor: '#fff',
        maskColor: 'rgba(0, 0, 0, 0.2)',
        zlevel: 0
    });
    
    accuracyTrendChart.showLoading({
        text: '加载中...',
        color: '#40a9ff',
        textColor: '#fff',
        maskColor: 'rgba(0, 0, 0, 0.2)',
        zlevel: 0
    });
}

// 隐藏图表加载状态
function hideLoadingState() {
    detectionTrendChart.hideLoading();
    typeDistributionChart.hideLoading();
    detection3DChart.hideLoading();
    completionLiquidChart.hideLoading();
    typeRadarChart.hideLoading();
    accuracyTrendChart.hideLoading();
}

// 获取图表数据
function fetchChartData() {
    showLoadingState();
    console.log('获取图表数据...');
    
    // 从API获取数据
    fetch('/api/analysis/chart-data', {
        method: 'GET',
        credentials: 'include'
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                console.error('获取图表数据失败：未授权');
                window.location.replace('/login_page');
            } else {
                console.error('获取图表数据失败：', response.status);
                throw new Error('获取图表数据失败');
            }
        }
        return response.json();
    })
    .then(data => {
        console.log('获取到的图表数据:', data);
        
        // 更新趋势图数据
        updateTrendChart(data.trend);
        
        // 更新分布图数据
        updateDistributionChart(data.distribution);
        
        // 更新3D热力图数据
        updateLocationChart(data.location);
        
        // 更新水球图数据
        updateCompletionChart(data.completion);
        
        // 更新类型对比图数据
        updateTypeComparisonChart(data.comparison);
        
        // 更新精度变化曲线图
        updateAccuracyChart(data.accuracy);
        
        // 隐藏加载状态
        hideLoadingState();
    })
    .catch(error => {
        console.error('获取图表数据错误:', error);
        
        // 显示错误信息
        showErrorMessage('获取图表数据失败，将使用默认数据');
        
        // 创建默认空数据
        const emptyData = {
            trend: {
                dates: generateLast7Days(),
                counts: Array(7).fill(0),
                ld_counts: Array(7).fill(0),
                gd_counts: Array(7).fill(0)
            },
            distribution: [
                {type: '流动摊位', count: 0, original_type: 'zdjy_ld'},
                {type: '固定摊位', count: 0, original_type: 'zdjy_gd'}
            ],
            location: {
                data: []
            },
            completion: {
                rate: 0.5
            },
            comparison: {
                categories: ['流动摊位', '固定摊位'],
                values: [50, 50],
                percentages: [50, 50]
            },
            accuracy: {
                dates: generateLast7Days(),
                ld_accuracy: Array(7).fill(80),
                gd_accuracy: Array(7).fill(80)
            }
        };
        
        // 使用默认数据更新图表
        updateTrendChart(emptyData.trend);
        updateDistributionChart(emptyData.distribution);
        updateLocationChart(emptyData.location);
        updateCompletionChart(emptyData.completion);
        updateTypeComparisonChart(emptyData.comparison);
        updateAccuracyChart(emptyData.accuracy);
        
        // 隐藏加载状态
        hideLoadingState();
    });
}

// 更新趋势图
function updateTrendChart(trendData) {
    if (!trendData || !trendData.dates || !trendData.counts) {
        console.error('趋势数据无效');
        return;
    }
    
    // 分别获取总体趋势和流动/固定摊位的数据
    const dates = trendData.dates;
    const counts = trendData.counts;
    
    // 构建图表选项
    const option = {
        xAxis: {
            data: dates
        },
        series: [{
            name: '检测数量',
            data: counts
        }]
    };
    
    // 更新图表
    if (detectionTrendChart) {
    detectionTrendChart.setOption(option);
    }
}

// 更新分布图
function updateDistributionChart(distributionData) {
    if (!distributionData || distributionData.length === 0) {
        console.warn('分布数据无效或为空，使用默认数据');
        // 使用默认数据,只包含两种类型
        distributionData = [
            {type: '流动摊位', count: 0, original_type: 'zdjy_ld'},
            {type: '固定摊位', count: 0, original_type: 'zdjy_gd'}
        ];
    }
    
    // 准备饼图数据
    const pieData = distributionData.map(item => {
        return {
            name: item.type,
            value: item.count || 0, // 确保count不为null或undefined
            itemStyle: {
                color: violationTypeToColor[item.original_type] || violationTypeToColor.zdjy_ld
            }
        };
    });
    
    // 构建图表选项
    const option = {
        title: {
            text: '占道经营类型分布',
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
            formatter: '{b}: {c} ({d}%)'
        },
        legend: {
            orient: 'horizontal',
            bottom: 0,
            left: 'center',
            data: distributionData.map(item => item.type),
            textStyle: {
                color: '#e6e6e6'
            }
        },
        series: [{
            name: '占道经营类型',
            type: 'pie',
            radius: ['35%', '70%'],
            center: ['50%', '50%'],
            data: pieData,
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            }
        }]
    };
    
    // 更新图表
    if (typeDistributionChart) {
        typeDistributionChart.setOption(option);
    }
}

// 更新3D热力图
function updateLocationChart(locationData) {
    if (!locationData || !locationData.data) {
        console.error('位置数据无效');
        return;
    }
    
    const data3D = locationData.data;
    
    // 找出最大值以设置合适的可视化映射
    let maxValue = 10;
    if (data3D.length > 0) {
        maxValue = Math.max(...data3D.map(item => item[2]));
        maxValue = Math.max(maxValue, 10); // 确保值不会太小
    }
    
    // 构建图表选项
    const option = {
        visualMap: {
            max: maxValue
        },
        series: [{
            data: data3D
        }]
    };
    
    // 更新图表
    if (detection3DChart) {
        detection3DChart.setOption(option);
    }
}

// 更新水球图
function updateCompletionChart(completionData) {
    if (!completionData || completionData.rate === undefined) {
        console.error('完成率数据无效');
        return;
    }
    
    // 获取完成率，确保在0-1之间
    let rate = Math.min(1, Math.max(0, completionData.rate));
    
    // 设置三层水波，每层略有不同
    const value1 = rate;
    const value2 = Math.max(0, rate - 0.05);
    const value3 = Math.max(0, rate - 0.1);
    
    // 构建图表选项
    const option = {
        series: [{
            type: 'liquidFill',
            data: [value1, value2, value3],
            label: {
                normal: {
                    formatter: (rate * 100).toFixed(0) + '%'
                }
            }
        }]
    };
    
    // 更新图表
    if (completionLiquidChart) {
        completionLiquidChart.setOption(option);
    }
}

// 更新类型对比图数据
function updateTypeComparisonChart(comparisonData) {
    if (!comparisonData || !comparisonData.values || !comparisonData.categories) {
        console.error('类型对比数据无效');
        return;
    }
    
    // 获取基础数据
    const categories = comparisonData.categories;
    const values = comparisonData.values;
    const percentages = comparisonData.percentages || values.map(value => 0);
    
    // 更新柱状图
    const option = {
        xAxis: {
            data: categories
        },
        series: [{
            data: values.map((value, index) => ({
                value: value,
                itemStyle: {
                    color: index === 0 ? '#1890ff' : '#52c41a'
                }
            }))
        }]
    };
    
    // 更新图表
    if (typeRadarChart) {
        typeRadarChart.setOption(option);
    }
}

// 更新精度变化曲线图数据
function updateAccuracyChart(accuracyData) {
    if (!accuracyData || !accuracyData.dates || !accuracyData.ld_accuracy || !accuracyData.gd_accuracy) {
        console.error('精度数据无效');
        return;
    }
    
    // 构建图表选项
    const option = {
        xAxis: {
            data: accuracyData.dates
        },
        series: [
            {
                name: '流动摊位',
                data: accuracyData.ld_accuracy
            },
            {
                name: '固定摊位',
                data: accuracyData.gd_accuracy
            }
        ]
    };
    
    // 更新图表
    if (accuracyTrendChart) {
        accuracyTrendChart.setOption(option);
    }
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
    
    // 检查文件大小（限制为90MB）
    const maxSize = 90 * 1024 * 1024; // 90MB
    if (file.size > maxSize) {
        window.isUploading = false;
        const resultArea = document.getElementById('resultArea');
        if (resultArea) {
            resultArea.innerHTML = '<div class="error">文件太大，请上传小于90MB的文件</div>';
        }
        if (uploadText) {
            uploadText.textContent = "拖拽文件到此处或点击上传";
        }
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
        window.isUploading = false;
        
        if (uploadText) {
            uploadText.textContent = "拖拽文件到此处或点击上传";
        }
        
        if (data.success) {
            console.log('检测结果:', data);
            console.log('检测类型:', data.detect_type);  // 添加调试日志
            
            // 更新检测类型显示
            const currentDetectionType = document.getElementById('currentDetectionType');
            if (currentDetectionType) {
                const typeText = data.detect_type === 'zdjy_ld' ? '流动摊位' : '固定摊位';
                currentDetectionType.textContent = typeText;
                currentDetectionType.className = data.detect_type;
            }
            
            // 创建图片容器
            const imageContainer = document.createElement('div');
            imageContainer.className = 'image-container';
            imageContainer.style.position = 'relative';
            
            // 创建原始图片元素
            const img = document.createElement('img');
            img.className = 'result-image';
            img.src = data.result_image + '?t=' + new Date().getTime();
            img.alt = '分析结果';
            img.onerror = function() {
                this.onerror = null;
                this.src = '/static/@results/default_result.jpg';
                this.alt = '加载失败';
            };
            
            // 创建Canvas元素
            const canvas = document.createElement('canvas');
            canvas.className = 'detection-canvas';
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.pointerEvents = 'none';
            
            // 等待图片加载完成后设置Canvas尺寸并绘制检测框
            img.onload = function() {
                canvas.width = this.width;
                canvas.height = this.height;
                
                // 绘制检测框
                const ctx = canvas.getContext('2d');
                ctx.lineWidth = 2;
                ctx.font = '14px Arial';
                
                data.detections.forEach(detection => {
                    // 将归一化坐标转换为实际像素坐标
                    const x = detection.x * this.width;
                    const y = detection.y * this.height;
                    const width = detection.width * this.width;
                    const height = detection.height * this.height;
                    
                    // 根据类别设置不同的颜色
                    let color;
                    if (detection.class === 'zdjy_ld') {
                        color = '#ff4d4f'; // 流动摊位用红色
                    } else if (detection.class === 'zdjy_gd') {
                        color = '#52c41a'; // 固定摊位用绿色
                    } else {
                        color = '#1890ff'; // 其他类别用蓝色
                    }
                    
                    // 绘制边界框
                    ctx.strokeStyle = color;
                    ctx.strokeRect(x, y, width, height);
                    
                    // 绘制标签背景
                    let label;
                    if (detection.class === 'zdjy_ld') {
                        label = `流动摊位 ${(detection.confidence * 100).toFixed(1)}%`;
                    } else if (detection.class === 'zdjy_gd') {
                        label = `固定摊位 ${(detection.confidence * 100).toFixed(1)}%`;
                    } else {
                        label = `${detection.class} ${(detection.confidence * 100).toFixed(1)}%`;
                    }
                    
                    const labelWidth = ctx.measureText(label).width + 8;
                    const labelHeight = 20;
                    
                    ctx.fillStyle = color;
                    ctx.fillRect(x, y - labelHeight, labelWidth, labelHeight);
                    
                    // 绘制标签文本
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(label, x + 4, y - 5);
                });
            };
            
            // 组装DOM
            imageContainer.appendChild(img);
            imageContainer.appendChild(canvas);
            
            // 显示分析结果，修正视频版本的HTML字符串
            if (data.is_video) {
                // 视频结果
                resultArea.innerHTML = `
                    <div class="result-content">
                        <div class="detection-info">
                            <div class="detection-result-title">
                                <div>检测结果: <span class="type-name ${data.detect_type}">${data.detect_type === 'zdjy_ld' ? '流动摊位' : '固定摊位'}</span></div>
                                <div class="target-count">发现 ${data.detection_count} 个目标</div>
                            </div>
                            <div class="detection-details">
                                ${data.detections.map(d => `
                                    <div class="detection-item ${d.class || ''}">
                                        <span class="detection-name">${d.class === 'zdjy_ld' ? '流动摊位' : d.class === 'zdjy_gd' ? '固定摊位' : d.class_name || d.class || '未知类型'}</span>
                                        <span class="detection-confidence">(置信度: ${(d.confidence * 100).toFixed(1)}%)</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="image-container">
                            <video src="${data.result_image}" class="result-image" controls onerror="handleVideoError(this)">
                                您的浏览器不支持视频播放。
                            </video>
                        </div>
                        <div class="download-section">
                            <button class="download-btn" onclick="downloadResult('${data.result_image.split('/').pop()}')">
                                <span class="download-icon">⬇️</span>
                                下载分析结果
                            </button>
                        </div>
                    </div>
                `;
            } else {
                // 图片结果
                resultArea.innerHTML = `
                    <div class="result-content">
                        <div class="detection-info">
                            <div class="detection-result-title">
                                <div>检测结果: <span class="type-name ${data.detect_type}">${data.detect_type === 'zdjy_ld' ? '流动摊位' : '固定摊位'}</span></div>
                                <div class="target-count">发现 ${data.detection_count} 个目标</div>
                            </div>
                            <div class="detection-details">
                                ${data.detections.map(d => `
                                    <div class="detection-item ${d.class || ''}">
                                        <span class="detection-name">${d.class === 'zdjy_ld' ? '流动摊位' : d.class === 'zdjy_gd' ? '固定摊位' : d.class_name || d.class || '未知类型'}</span>
                                        <span class="detection-confidence">(置信度: ${(d.confidence * 100).toFixed(1)}%)</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="image-container">
                            <img src="${data.result_image}" class="result-image" alt="分析结果" onerror="handleImageError(this)">
                            ${canvas.outerHTML}
                        </div>
                        <div class="download-section">
                            <button class="download-btn" onclick="downloadResult('${data.result_image.split('/').pop()}')">
                                <span class="download-icon">⬇️</span>
                                下载分析结果
                            </button>
                        </div>
                    </div>
                `;
            }
            
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
        credentials: 'include'  // 确保发送cookies以维持会话
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('获取到最新分析结果:', data);
                console.log('检测类型:', data.data.detect_type);  // 添加调试日志
                
                // 更新检测类型显示
                const currentDetectionType = document.getElementById('currentDetectionType');
                if (currentDetectionType) {
                    const typeText = data.data.detect_type === 'zdjy_ld' ? '流动摊位' : '固定摊位';
                    currentDetectionType.textContent = typeText;
                    currentDetectionType.className = data.data.detect_type;
                }
                
                // 显示预览图
                const previewContainer = document.getElementById('previewContainer');
                const imagePreview = document.getElementById('imagePreview');
                const videoPreview = document.getElementById('videoPreview');
                const uploadHint = document.getElementById('uploadHint');
                
                if (previewContainer && imagePreview && videoPreview && uploadHint) {
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
                }
                
                // 显示分析结果
                const resultArea = document.getElementById('resultArea');
                const resultImage = data.data.result_image;
                
                // 确保文件名正确处理
                let filename = resultImage.split('/').pop();
                // 移除查询参数
                if (filename.includes('?')) {
                    filename = filename.split('?')[0];
                }
                
                // 根据是否是视频生成不同的结果HTML
                if (data.data.is_video) {
                    // 视频结果
                    resultArea.innerHTML = `
                        <div class="result-content">
                            <div class="detection-info">
                                <div class="detection-result-title">
                                    <div>检测结果: <span class="type-name ${data.data.detect_type}">${data.data.detect_type === 'zdjy_ld' ? '流动摊位' : '固定摊位'}</span></div>
                                    <div class="target-count">发现 ${data.data.detection_count} 个目标</div>
                                </div>
                                <div class="detection-details">
                                    ${data.data.detections.map(d => `
                                        <div class="detection-item ${d.class || ''}">
                                            <span class="detection-name">${typeMapping[d.class] || d.class_name || d.class || '未知类型'}</span>
                                            <span class="detection-confidence">(置信度: ${(d.confidence * 100).toFixed(1)}%)</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            <div class="image-container">
                                <video src="${resultImage}" 
                                       class="result-image" 
                                       controls
                                       preload="auto"
                                       onerror="handleVideoError(this)"
                                       playsinline>
                                    您的浏览器不支持视频播放。
                                </video>
                            </div>
                            <div class="download-section">
                                <button class="download-btn" onclick="downloadResult('${filename}')">
                                    <span class="download-icon">⬇️</span>
                                    下载分析结果
                                </button>
                            </div>
                        </div>
                    `;
                } else {
                    // 图片结果
                    resultArea.innerHTML = `
                        <div class="result-content">
                            <div class="detection-info">
                                <div class="detection-result-title">
                                    <div>检测结果: <span class="type-name ${data.data.detect_type}">${data.data.detect_type === 'zdjy_ld' ? '流动摊位' : '固定摊位'}</span></div>
                                    <div class="target-count">发现 ${data.data.detection_count} 个目标</div>
                                </div>
                                <div class="detection-details">
                                    ${data.data.detections.map(d => `
                                        <div class="detection-item ${d.class || ''}">
                                            <span class="detection-name">${typeMapping[d.class] || d.class_name || d.class || '未知类型'}</span>
                                            <span class="detection-confidence">(置信度: ${(d.confidence * 100).toFixed(1)}%)</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            <div class="image-container">
                                <img src="${resultImage}" 
                                     class="result-image" 
                                     alt="分析结果"
                                     onerror="this.onerror=null; this.src='/static/img/error.png'; this.alt='加载失败';">
                            </div>
                            <div class="download-section">
                                <button class="download-btn" onclick="downloadResult('${filename}')">
                                    <span class="download-icon">⬇️</span>
                                    下载分析结果
                                </button>
                            </div>
                        </div>
                    `;
                }
                
                console.log('最新分析结果加载成功，图片路径:', resultImage);
            } else {
                console.log('无最新分析结果:', data.message);
                const resultArea = document.getElementById('resultArea');
                if (resultArea) {
                    resultArea.innerHTML = '<div class="empty-result"><span class="empty-icon">📊</span><p>暂无分析记录，请上传图片或视频进行分析</p></div>';
                }
            }
        })
        .catch(error => {
            console.error('加载最新分析结果出错:', error);
            const resultArea = document.getElementById('resultArea');
            if (resultArea) {
                resultArea.innerHTML = '<div class="empty-result"><span class="empty-icon">⚠️</span><p>加载分析记录时出错</p></div>';
            }
        });
}

// 修改图片错误处理函数
function handleImageError(img, maxRetries) {
    console.log('图片加载错误处理开始，当前图片路径:', img.src);
    if (img.retryCount === undefined) {
        img.retryCount = 0;
    }
    
    if (img.retryCount < (maxRetries || 1)) {
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
            img.src = `/static/@results/default_result.jpg?t=${timestamp}`;
            console.log('已将图片路径更改为默认图片:', img.src);
        }
    } else {
        console.error('图片加载失败，已达到最大重试次数');
        img.style.display = 'none';
        img.parentElement.innerHTML = '<div class="error-message">图片加载失败</div>';
    }
}

// 处理视频加载错误
function handleVideoError(video) {
    console.log('视频加载错误处理开始，当前视频路径:', video.src);
    video.onerror = null; // 防止无限循环
    
    // 添加时间戳避免缓存问题
    const originalSrc = video.src.split('?')[0];
    const newSrc = `${originalSrc}?t=${new Date().getTime()}`;
    
    // 尝试使用绝对路径
    if (!originalSrc.startsWith('http')) {
        const absolutePath = window.location.origin + (originalSrc.startsWith('/') ? '' : '/') + originalSrc;
        video.src = absolutePath + `?t=${new Date().getTime()}`;
        console.log('尝试使用绝对路径:', video.src);
        
        // 设置一个标志，记录已经尝试过的解决方案
        video.dataset.retryWithAbsolutePath = 'true';
        
        // 重新加载视频
        video.load();
        return;
    }
    
    // 显示错误信息，但保留视频元素，让用户可以重试
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <p>视频加载失败</p>
        <button onclick="retryVideo(this.parentElement.previousElementSibling)">重试加载</button>
    `;
    
    // 如果已有错误消息，则不重复添加
    if (!video.parentElement.querySelector('.error-message')) {
        video.parentElement.appendChild(errorDiv);
    }
}

// 重试加载视频
function retryVideo(video) {
    if (!video) return;
    
    // 添加时间戳避免缓存
    const src = video.src.split('?')[0] + '?t=' + new Date().getTime();
    console.log('重试加载视频:', src);
    
    video.src = src;
    video.load(); // 重新加载视频
    
    // 添加事件监听器以在加载完成时记录成功信息
    video.onloadeddata = function() {
        console.log('视频加载成功:', video.src);
    };
    
    // 移除错误信息
    const errorMessage = video.parentElement.querySelector('.error-message');
    if (errorMessage) {
        errorMessage.remove();
    }
}

// 下载结果文件
function downloadResult(filename) {
    // 检查文件名格式，进行清理以确保跨平台兼容性
    if (!filename) {
        console.error("无效的文件名");
        return;
    }
    
    // 从完整路径中获取文件名，去除任何路径前缀
    if (filename.includes('/')) {
        filename = filename.split('/').pop();
    } else if (filename.includes('\\')) {
        // 处理Windows风格的路径分隔符
        filename = filename.split('\\').pop();
    }
    
    // 移除查询参数
    if (filename.includes('?')) {
        filename = filename.split('?')[0];
    }
    
    console.log("下载文件:", filename);
    
    // 添加时间戳避免缓存问题
    const downloadUrl = `/download_result/${filename}?t=${new Date().getTime()}`;
    window.location.href = downloadUrl;
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
                    <div class="result-content">
                        <div class="detection-info">
                            <div class="detection-result-title">
                                <div>检测结果: <span class="type-name ${data.data.detect_type}">${data.data.detect_type === 'zdjy_ld' ? '流动摊位' : '固定摊位'}</span></div>
                                <div class="target-count">发现 ${data.data.detection_count} 个目标</div>
                            </div>
                            <div class="detection-details">
                                ${data.data.detections.map(d => `
                                    <div class="detection-item ${d.class || ''}">
                                        <span class="detection-name">${typeMapping[d.class] || d.class_name || d.class || '未知类型'}</span>
                                        <span class="detection-confidence">(置信度: ${(d.confidence * 100).toFixed(1)}%)</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="image-container">
                            ${data.data.is_video ? 
                                `<video src="${data.data.result_image}" 
                                        class="result-image" 
                                        controls
                                        preload="auto"
                                        onerror="handleVideoError(this)"
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