// config.js - 系统配置文件

// API端点配置
const API_CONFIG = {
  BASE_URL: '', // 相对路径，为空表示当前域
  ENDPOINTS: {
    HISTORY_IMAGES: '/api/history_images',
    LATEST_DETECTIONS: '/api/latest_detections',
    ANALYSIS: '/api/analyze',
    STATS: '/api/stats',
    CHART_DATA: '/api/chart_data',
    WEATHER: '/api/weather' // 添加天气API端点
  }
};

// 图表配置
const CHART_CONFIG = {
  // MAP图表配置
  MAP: {
    colors: ['#7cffb2', '#58d5ff', '#5271ff'],
    smooth: true,
    areaStyle: {
      opacity: 0.1
    }
  },
  // FPS图表配置
  FPS: {
    color: '#ffb258',
    areaStyle: {
      opacity: 0.2
    }
  }
};

// 系统配置
const SYSTEM_CONFIG = {
  AUTO_REFRESH_INTERVAL: 5000, // 数据自动刷新间隔(毫秒)
  IMAGE_DISPLAY_DURATION: 3000, // 图片自动播放间隔(毫秒)
  MAX_LOAD_ATTEMPTS: 3, // 加载失败重试次数
  WEATHER_REFRESH_INTERVAL: 3600000 // 天气刷新间隔，每小时一次
};

// 高德地图API配置
const AMAP_CONFIG = {
  KEY: '9decdfc73fd9e9f474719d5344635a96', // 与后端config.py中的密钥保持一致
  VERSION: '2.0', // 高德地图API版本
  PLUGINS: ['AMap.ToolBar', 'AMap.Scale', 'AMap.OverView', 'AMap.Weather'],
  SECURITY_CODE: '0eabe65c8f32a08b8701a989c93cf45e' // 与后端config.py中的安全密钥保持一致
};

// 导出配置对象
window.APP_CONFIG = {
  API: API_CONFIG,
  CHART: CHART_CONFIG,
  SYSTEM: SYSTEM_CONFIG,
  AMAP: AMAP_CONFIG
};

// 初始化函数，处理配置加载后的操作
window.initConfig = function() {
  // 标记配置已加载
  window.configLoaded = true;
  console.log('配置文件加载成功');
  
  // 触发配置加载完成事件，通知其他模块可以开始初始化
  document.dispatchEvent(new CustomEvent('config-loaded'));
};

// 自动执行初始化
window.initConfig(); 