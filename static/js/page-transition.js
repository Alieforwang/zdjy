/**
 * 高科技感页面过渡动画管理器
 * 为系统添加平滑的页面加载体验
 */

// 全局变量，确保只定义一次
if (typeof window.loadingTexts === 'undefined') {
  window.loadingTexts = [
    '正在加载系统组件',
    '初始化数据传输协议',
    '建立安全连接',
    '解析矩阵数据结构',
    '激活智能分析引擎',
    '数据同步中',
    '加载神经网络模型',
    '优化算法运行参数',
    '启动智能分析模块',
    '初始化地理信息系统',
    '配置环境变量',
    '验证数据完整性',
    '启动告警系统',
    '启动日志记录',
    '系统初始化完成'
  ];
}

// 创建高科技风格预加载动画DOM元素
function createPreloaderElement() {
  // 如果已存在则不重复创建
  if (document.querySelector('.page-preloader')) {
    return document.querySelector('.page-preloader');
  }

  const preloaderEl = document.createElement('div');
  preloaderEl.className = 'page-preloader active'; // 默认激活
  preloaderEl.style.backgroundColor = 'rgba(0, 21, 41, 0.95)'; // 深蓝色背景
  
  // 添加数字雨效果 - 矩阵风格
  const digitalRainContainer = document.createElement('div');
  digitalRainContainer.className = 'digital-rain';
  digitalRainContainer.style.position = 'absolute';
  digitalRainContainer.style.top = '0';
  digitalRainContainer.style.left = '0';
  digitalRainContainer.style.width = '100%';
  digitalRainContainer.style.height = '100%';
  digitalRainContainer.style.overflow = 'hidden';
  digitalRainContainer.style.zIndex = '1';
  
  // 创建30列数字雨 (减少列数提高性能)
  for (let i = 0; i < 30; i++) {
    const column = document.createElement('div');
    column.className = 'rain-column';
    column.style.position = 'absolute';
    column.style.top = '-200px';
    column.style.color = 'rgba(24, 144, 255, 0.5)';
    column.style.fontSize = '1.2rem';
    column.style.fontFamily = 'monospace';
    column.style.whiteSpace = 'pre'; // 使用pre来保留换行符
    column.style.lineHeight = '1.2em'; // 添加行高控制
    column.style.userSelect = 'none';
    column.style.textShadow = '0 0 5px rgba(24, 144, 255, 0.8)';
    column.style.left = Math.random() * 100 + '%';
    column.style.animationDuration = Math.random() * 2 + 1 + 's'; // 加快动画速度
    column.style.animationDelay = Math.random() + 's';
    column.style.animationName = 'digital-rain-fall';
    column.style.animationTimingFunction = 'linear';
    column.style.animationIterationCount = 'infinite';
    
    // 随机字符（纵向排列）
    let rainText = '';
    for (let j = 0; j < 20; j++) {
      rainText += Math.round(Math.random()) + '\n'; // 每个数字后添加换行符
    }
    column.textContent = rainText;
    
    digitalRainContainer.appendChild(column);
  }
  
  preloaderEl.appendChild(digitalRainContainer);
  
  // 中央加载内容区域
  const contentContainer = document.createElement('div');
  contentContainer.className = 'preloader-content';
  contentContainer.style.position = 'relative';
  contentContainer.style.zIndex = '2';
  
  // 二进制装饰元素
  const binaryDecor = document.createElement('div');
  binaryDecor.className = 'binary-decor';
  binaryDecor.style.fontFamily = 'monospace';
  binaryDecor.style.color = 'rgba(24, 144, 255, 0.7)';
  binaryDecor.style.fontSize = '12px';
  binaryDecor.style.marginBottom = '20px';
  binaryDecor.style.textShadow = '0 0 5px rgba(24, 144, 255, 0.8)';
  binaryDecor.style.whiteSpace = 'pre'; // 保留换行符
  binaryDecor.style.textAlign = 'center'; // 居中显示
  binaryDecor.style.lineHeight = '1em'; // 设置行高
  
  // 生成垂直排列的二进制数
  let binaryText = '';
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 6; j++) {
      binaryText += Math.round(Math.random());
    }
    binaryText += '\n'; // 每行结束添加换行符
  }
  binaryDecor.textContent = binaryText;
  
  contentContainer.appendChild(binaryDecor);
  
  // 加载文本
  const loadingText = document.createElement('div');
  loadingText.className = 'loading-text';
  loadingText.style.fontFamily = 'Arial, sans-serif';
  loadingText.style.color = 'rgba(255, 255, 255, 0.9)';
  loadingText.style.fontSize = '18px';
  loadingText.style.margin = '20px 0';
  loadingText.style.textShadow = '0 0 10px rgba(24, 144, 255, 0.5)';
  
  // 初始文本
  const initTextSpan = document.createElement('span');
  initTextSpan.textContent = '系统初始化中';
  loadingText.appendChild(initTextSpan);
  
  contentContainer.appendChild(loadingText);
  
  // 进度条容器
  const progressContainer = document.createElement('div');
  progressContainer.className = 'progress-container';
  progressContainer.style.width = '100%';
  progressContainer.style.height = '4px';
  progressContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
  progressContainer.style.borderRadius = '2px';
  progressContainer.style.overflow = 'hidden';
  progressContainer.style.marginTop = '20px';
  
  // 进度条
  const progressBar = document.createElement('div');
  progressBar.className = 'progress-bar';
  progressBar.style.width = '0%';
  progressBar.style.height = '100%';
  progressBar.style.backgroundColor = '#1890ff';
  progressBar.style.borderRadius = '2px';
  progressBar.style.transition = 'width 0.2s ease'; // 加快过渡速度
  
  progressContainer.appendChild(progressBar);
  contentContainer.appendChild(progressContainer);
  
  preloaderEl.appendChild(contentContainer);
  
  // 将预加载器添加到body
  document.body.appendChild(preloaderEl);
  
  // 添加页面过渡的CSS
  addTransitionCSS();
  
  return preloaderEl;
}

// 添加必要的CSS
function addTransitionCSS() {
  if (document.getElementById('page-transition-css')) return;
  
  const style = document.createElement('style');
  style.id = 'page-transition-css';
  style.textContent = `
    @keyframes digital-rain-fall {
      0% { transform: translateY(-100%); }
      100% { transform: translateY(100vh); }
    }
    
    .page-preloader {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      transition: opacity 0.3s cubic-bezier(0.19, 1, 0.22, 1);
      will-change: opacity;
      overflow: hidden;
    }
    
    .page-preloader.fade-out {
      opacity: 0;
    }
    
    .rain-column {
      writing-mode: vertical-rl; /* 添加垂直文本模式，使数字真正垂直排列 */
      filter: blur(0.5px); /* 添加轻微模糊效果，增强视觉效果 */
      letter-spacing: 2px; /* 让字符间距更加明显 */
    }
  `;
  
  document.head.appendChild(style);
}

// 模拟加载进度
function simulateLoading() {
  const textEl = document.querySelector('.loading-text');
  const binaryEl = document.querySelector('.binary-decor');
  let progress = 0;
  let textChangeCount = 0;
  
  // 定时更新文字和二进制装饰
  const textInterval = setInterval(function() {
    if (textEl && textChangeCount < 2) {  // 减少文本切换次数到2次
      // 更新主文本
      const randomIndex = Math.floor(Math.random() * window.loadingTexts.length);
      textEl.firstChild.textContent = window.loadingTexts[randomIndex];
      
      // 更新二进制装饰（垂直排列）
      if (binaryEl) {
        let binaryText = '';
        for (let i = 0; i < 5; i++) {
          for (let j = 0; j < 6; j++) {
            binaryText += Math.round(Math.random());
          }
          binaryText += '\n'; // 每行结束添加换行符
        }
        binaryEl.textContent = binaryText;
      }
      
      textChangeCount++;
    } else {
      clearInterval(textInterval);
    }
  }, 500);  // 减少文本切换间隔到500毫秒
  
  // 更新进度条
  const progressInterval = setInterval(function() {
    progress += 20;  // 增加每次进度增长的幅度
    updateLoadingProgress(progress);
    
    if (progress >= 100) {
      clearInterval(progressInterval);
      
      // 更新最终文本和二进制装饰为全1（保持垂直排列）
      if (textEl) {
        textEl.firstChild.textContent = '系统初始化完成';
      }
      
      if (binaryEl) {
        let finalBinaryText = '';
        for (let i = 0; i < 5; i++) {
          finalBinaryText += '111111\n';
        }
        binaryEl.textContent = finalBinaryText.trim();
      }
      
      // 完成加载后短暂延迟然后隐藏
      setTimeout(hidePreloader, 200);  // 减少完成后的延迟到200毫秒
    }
  }, 150);  // 减少进度条更新间隔到150毫秒，4秒内完成20*5=100%的进度
}

// 更新加载进度
function updateLoadingProgress(percentage) {
  const progressBar = document.querySelector('.progress-bar');
  if (progressBar) {
    progressBar.style.width = percentage + '%';
  }
}

// 隐藏预加载动画
function hidePreloader() {
  const preloaderEl = document.querySelector('.page-preloader');
  if (preloaderEl) {
    preloaderEl.classList.add('fade-out');
    
    // 动画结束后移除元素
    setTimeout(function() {
      preloaderEl.style.display = 'none';
      document.body.style.overflow = ''; // 恢复滚动
    }, 300); // 从800毫秒减少到300毫秒
  }
}

// 设置页面过渡
function setupPageTransition() {
  // 为所有链接添加转场效果
  document.querySelectorAll('a').forEach(function(link) {
    // 排除外部链接和特殊链接
    if (link.hostname === window.location.hostname && 
        !link.hasAttribute('data-no-transition') && 
        !link.getAttribute('href').startsWith('#') &&
        !link.getAttribute('target')) {
      
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const href = this.getAttribute('href');
        
        // 先显示加载动画
        createPreloaderElement();
        document.body.style.overflow = 'hidden'; // 防止滚动
        simulateLoading();
        
        // 延迟后跳转
        setTimeout(function() {
          window.location.href = href;
        }, 800); // 留够时间给加载动画
      });
    }
  });
}

// 初始化预加载系统
document.addEventListener('DOMContentLoaded', function() {
  // 创建预加载器
  createPreloaderElement();
  document.body.style.overflow = 'hidden'; // 防止滚动
  
  // 设置页面过渡
  setupPageTransition();
  
  // 开始模拟加载进度 - 添加小延迟让DOM有时间渲染
  setTimeout(() => {
    simulateLoading();
  }, 10); // 使用最小延迟
  
  // 检测实际页面加载
  window.addEventListener('load', function() {
    // 如果页面已经加载完成但预加载器还在显示，强制完成预加载
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar && progressBar.style.width !== '100%') {
      // 更新进度条到100%
      updateLoadingProgress(100);
      
      // 更新文本
      const textEl = document.querySelector('.loading-text');
      if (textEl) {
        textEl.firstChild.textContent = '系统初始化完成';
        const binaryEl = document.querySelector('.binary-decor');
        if (binaryEl) {
          // 垂直排列的全1二进制
          let finalBinaryText = '';
          for (let i = 0; i < 5; i++) {
            finalBinaryText += '111111\n';
          }
          binaryEl.textContent = finalBinaryText.trim();
        }
      }
      
      // 200毫秒后隐藏预加载器
      setTimeout(hidePreloader, 200);
    }
  });
}); 