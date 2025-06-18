// weather.js - 处理天气API和MAP图表功能

// 全局错误处理
window.onerror = function(message, source, lineno, colno, error) {
  console.log('Weather.js 全局错误捕获:', message);
  return false; // 允许错误继续传播到控制台
};

// 天气图标映射
const weatherIconMap = {
  '晴': 'fa-sun',
  '多云': 'fa-cloud-sun',
  '阴': 'fa-cloud',
  '小雨': 'fa-cloud-rain',
  '中雨': 'fa-cloud-showers-heavy',
  '大雨': 'fa-cloud-showers-heavy',
  '阵雨': 'fa-cloud-sun-rain',
  '雷阵雨': 'fa-bolt',
  '雨夹雪': 'fa-snowflake',
  '小雪': 'fa-snowflake',
  '中雪': 'fa-snowflake',
  '大雪': 'fa-snowflake',
  '暴雪': 'fa-snowflake',
  '雾': 'fa-smog',
  '霾': 'fa-smog'
};

// 天气数据缓存
let weatherData = null;
let lastWeatherUpdate = 0;

/**
 * 获取天气数据
 * @param {Function} callback - 获取数据后的回调函数
 */
function fetchWeatherData(callback) {
  // 检查缓存，避免频繁请求
  const now = Date.now();
  if (weatherData && (now - lastWeatherUpdate) < window.APP_CONFIG.SYSTEM.WEATHER_REFRESH_INTERVAL) {
    if (callback) callback(weatherData);
    return;
  }

  // 构建API URL
  const apiUrl = window.APP_CONFIG.API.BASE_URL + window.APP_CONFIG.API.ENDPOINTS.WEATHER;
  
  // 添加随机参数防止缓存
  const url = `${apiUrl}?_t=${now}`;
  
  console.log('正在获取天气数据...');
  
  // 发送请求
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP状态码 ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (data.success) {
        console.log('天气数据获取成功:', data.data);
        weatherData = data.data;
        lastWeatherUpdate = now;
        if (callback) callback(weatherData);
      } else {
        console.warn('天气API返回错误:', data.message);
        if (callback) callback(null);
      }
    })
    .catch(error => {
      console.error('获取天气数据出错:', error);
      if (callback) callback(null);
    });
}

/**
 * 更新页面天气显示
 * @param {Object} data - 天气数据
 */
function updateWeatherUI(data) {
  if (!data) return;
  
  try {
    // 获取页面元素
    const iconElement = document.getElementById('weatherIcon');
    const tempElement = document.getElementById('weatherTemp');
    const descElement = document.getElementById('weatherDesc');
    const humidityElement = document.getElementById('weatherHumidity');
    const windElement = document.getElementById('weatherWind');
    
    if (iconElement && tempElement && descElement && humidityElement && windElement) {
      // 获取天气图标类
      const weatherType = data.weather || '晴';
      const iconClass = weatherIconMap[weatherType] || 'fa-sun';
      
      // 添加额外天气图标
      let secondaryIcon = '';
      
      // 根据不同天气类型添加次要图标（可能是云+雨、雪+风等组合）
      if (weatherType.includes('雨') && !weatherType.includes('雷')) {
        secondaryIcon = '<i class="fas fa-cloud-rain secondary-weather-icon"></i>';
      } else if (weatherType.includes('雷')) {
        secondaryIcon = '<i class="fas fa-bolt secondary-weather-icon"></i>';
      } else if (weatherType.includes('雪')) {
        secondaryIcon = '<i class="fas fa-snowflake secondary-weather-icon"></i>';
      } else if (weatherType === '多云') {
        secondaryIcon = '<i class="fas fa-cloud secondary-weather-icon"></i>';
      }
      
      // 更新主天气图标
      iconElement.innerHTML = `<i class="fas ${iconClass}"></i>`;
      
      // 更新温度
      tempElement.textContent = `${data.temp}°C`;
      
      // 更新天气描述与次要图标
      descElement.innerHTML = `${data.weather} ${secondaryIcon}`;
      
      // 更新湿度
      humidityElement.textContent = `${data.humidity}%`;
      
      // 更新风向和风力
      windElement.textContent = `${data.wind_direction}风 ${data.wind_power}级`;
      
      console.log('天气UI更新成功');
      
      // 根据天气类型添加特殊效果
      addWeatherEffects(weatherType);
    } else {
      console.warn('未找到天气显示元素');
      
      // 作为备用，尝试更新天气信息元素
      const weatherElement = document.getElementById('weather-info');
      if (weatherElement) {
        // 获取天气图标类
        const weatherType = data.weather || '晴';
        const iconClass = weatherIconMap[weatherType] || 'fa-sun';
        
        // 构建HTML
        const html = `
          <div class="weather-container">
            <div class="weather-icon">
              <i class="fas ${iconClass}"></i>
            </div>
            <div class="weather-details">
              <div class="weather-top">
                <div class="weather-temp">${data.temp}°C</div>
                <div class="weather-desc">${data.weather}</div>
              </div>
              <div class="weather-info">
                <span><i class="fas fa-tint"></i>湿度: ${data.humidity}%</span>
                <span><i class="fas fa-wind"></i>${data.wind_direction}风 ${data.wind_power}级</span>
              </div>
            </div>
          </div>
        `;
        
        // 更新内容
        weatherElement.innerHTML = html;
        weatherElement.style.display = ''; // 显示元素
        
        // 根据天气类型添加特殊效果
        addWeatherEffects(weatherType);
      }
    }
  } catch (e) {
    console.error('更新天气UI出错:', e);
  }
}

/**
 * 添加天气特效
 * @param {string} weatherType - 天气类型
 */
function addWeatherEffects(weatherType) {
  try {
    // 获取天气图标元素
    const iconElement = document.getElementById('weatherIcon');
    if (!iconElement) return;
    
    // 移除现有的所有特殊样式类
    iconElement.classList.remove(
      'weather-sunny', 'weather-cloudy', 'weather-rainy', 
      'weather-snowy', 'weather-stormy', 'weather-foggy'
    );
    
    // 根据天气类型添加特殊样式
    if (weatherType.includes('晴') && !weatherType.includes('云')) {
      iconElement.classList.add('weather-sunny');
    } else if (weatherType.includes('云') || weatherType.includes('阴')) {
      iconElement.classList.add('weather-cloudy');
    } else if (weatherType.includes('雨') && !weatherType.includes('雷')) {
      iconElement.classList.add('weather-rainy');
    } else if (weatherType.includes('雪')) {
      iconElement.classList.add('weather-snowy');
    } else if (weatherType.includes('雷')) {
      iconElement.classList.add('weather-stormy');
    } else if (weatherType.includes('雾') || weatherType.includes('霾')) {
      iconElement.classList.add('weather-foggy');
    }
  } catch (e) {
    console.error('添加天气特效出错:', e);
  }
}

/**
 * 更新MAP图表
 * @param {Object} chart - ECharts实例
 * @param {Array} data - 可选数据数组
 */
function updateMAPChart(chart, data = null) {
  try {
    if (!chart) {
      console.warn('MAP图表未初始化');
      return;
    }
    
    // 获取当前时间
    const now = new Date();
    const timeStr = now.getHours() + ':' + 
        now.getMinutes().toString().padStart(2, '0') + ':' + 
        now.getSeconds().toString().padStart(2, '0');
    
    let option = chart.getOption();
    
    // 如果选项不存在，创建初始选项
    if (!option || !option.xAxis || !option.series || !option.series[0]) {
      option = {
        title: {
          text: '平均精确度: 85%',
          textStyle: {
            color: '#fff',
            fontSize: 10,
            fontWeight: 'normal'
          },
          left: 'center',
          top: 5
        },
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(0,42,84,0.8)',
          borderColor: 'rgba(255,255,255,0.2)',
          textStyle: { color: '#fff' }
        },
        grid: {
          top: 30,
          right: 20,
          bottom: 30,
          left: 60,
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: [],
          axisLabel: {
            color: '#fff',
            fontSize: 10
          },
          axisLine: {
            lineStyle: {
              color: 'rgba(255,255,255,0.2)'
            }
          }
        },
        yAxis: {
          type: 'value',
          min: 70,
          max: 100,
          axisLabel: {
            color: '#fff',
            fontSize: 10
          },
          axisLine: {
            lineStyle: {
              color: 'rgba(255,255,255,0.2)'
            }
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(255,255,255,0.1)'
            }
          }
        },
        series: [{
          type: 'line',
          name: 'MAP',
          data: [],
          lineStyle: {
            color: '#58d5ff',
            width: 2
          },
          symbol: 'circle',
          symbolSize: 6,
          itemStyle: {
            color: '#58d5ff'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(88, 213, 255, 0.3)' },
              { offset: 1, color: 'rgba(88, 213, 255, 0.1)' }
            ])
          }
        }]
      };
    }
    
    // 生成随机MAP值或使用提供的数据
    const mapValue = data ? data : (Math.floor(Math.random() * 15) + 75);
    
    // 添加新数据点
    option.xAxis.data.push(timeStr);
    option.series[0].data.push(mapValue);
    
    // 保持固定数量的数据点，移除最旧的
    if (option.xAxis.data.length > 30) {
      option.xAxis.data.shift();
      option.series[0].data.shift();
    }
    
    // 计算平均MAP
    const avgMAP = Math.round(
      option.series[0].data.reduce((sum, value) => sum + value, 0) / 
      option.series[0].data.length
    );
    
    // 更新图表
    chart.setOption({
      title: {
        text: `平均精确度: ${avgMAP}%`
      },
      xAxis: {
        data: option.xAxis.data
      },
      series: [{
        data: option.series[0].data
      }]
    });
  } catch (e) {
    console.error('更新MAP图表出错:', e);
  }
}

// 初始化函数
function initWeatherModule() {
  console.log('初始化天气模块...');
  
  // 获取并显示天气数据
  fetchWeatherData(updateWeatherUI);
  
  // 设置定期更新
  setInterval(() => {
    fetchWeatherData(updateWeatherUI);
  }, window.APP_CONFIG.SYSTEM.WEATHER_REFRESH_INTERVAL);
  
  // 暴露全局API
  window.weatherAPI = {
    fetchWeatherData,
    updateWeatherUI,
    updateMAPChart
  };
  
  console.log('天气模块初始化完成');
}

// 当页面加载完成和配置加载完成后初始化
if (document.readyState === 'complete' && window.APP_CONFIG) {
  initWeatherModule();
} else {
  window.addEventListener('load', () => {
    // 等待配置加载完成
    if (window.APP_CONFIG) {
      initWeatherModule();
    } else {
      document.addEventListener('config-loaded', initWeatherModule);
    }
  });
} 