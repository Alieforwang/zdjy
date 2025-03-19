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
    '优化算法运行参数'
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
  
  // 创建50列数字雨
  for (let i = 0; i < 50; i++) {
    const column = document.createElement('div');
    column.className = 'rain-column';
    column.style.position = 'absolute';
    column.style.top = '-200px';
    column.style.color = 'rgba(24, 144, 255, 0.5)';
    column.style.fontSize = '1.2rem';
    column.style.fontFamily = 'monospace';
    column.style.whiteSpace = 'nowrap';
    column.style.userSelect = 'none';
    column.style.textShadow = '0 0 5px rgba(24, 144, 255, 0.8)';
    column.style.left = Math.random() * 100 + '%';
    column.style.animationDuration = Math.random() * 3 + 2 + 's';
    column.style.animationDelay = Math.random() + 's';
    column.style.animationName = 'digital-rain-fall';
    column.style.animationTimingFunction = 'linear';
    column.style.animationIterationCount = 'infinite';
    
    // 随机字符
    let rainText = '';
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    for (let j = 0; j < 20; j++) {
      rainText += chars.charAt(Math.floor(Math.random() * chars.length)) + '<br>';
    }
    column.innerHTML = rainText;
    
    digitalRainContainer.appendChild(column);
  }
  
  preloaderEl.appendChild(digitalRainContainer);
  
  // 添加线路动画
  const circuitLines = document.createElement('div');
  circuitLines.className = 'circuit-lines';
  circuitLines.style.position = 'absolute';
  circuitLines.style.top = '0';
  circuitLines.style.left = '0';
  circuitLines.style.width = '100%';
  circuitLines.style.height = '100%';
  circuitLines.style.zIndex = '2';
  
  // 创建更多的线路
  for (let i = 0; i < 12; i++) {
    const line = document.createElement('div');
    line.className = 'circuit-line';
    line.style.position = 'absolute';
    
    // 创建更复杂的线路布局
    if (i % 4 === 0) {
      // 水平线
      line.style.left = Math.random() * 80 + 10 + '%';
      line.style.top = Math.random() * 80 + 10 + '%';
      line.style.width = Math.random() * 20 + 5 + '%';
      line.style.height = '2px';
      line.style.background = 'linear-gradient(90deg, rgba(24, 144, 255, 0), rgba(24, 144, 255, 0.8), rgba(24, 144, 255, 0))';
    } else if (i % 4 === 1) {
      // 垂直线
      line.style.left = Math.random() * 80 + 10 + '%';
      line.style.top = Math.random() * 80 + 10 + '%';
      line.style.width = '2px';
      line.style.height = Math.random() * 20 + 5 + '%';
      line.style.background = 'linear-gradient(180deg, rgba(24, 144, 255, 0), rgba(24, 144, 255, 0.8), rgba(24, 144, 255, 0))';
    } else if (i % 4 === 2) {
      // 左上到右下对角线
      line.style.left = Math.random() * 70 + '%';
      line.style.top = Math.random() * 70 + '%';
      line.style.width = Math.random() * 15 + 5 + '%';
      line.style.height = '2px';
      line.style.background = 'linear-gradient(90deg, rgba(24, 144, 255, 0), rgba(24, 144, 255, 0.8), rgba(24, 144, 255, 0))';
      line.style.transform = 'rotate(45deg)';
    } else {
      // 左下到右上对角线
      line.style.left = Math.random() * 70 + '%';
      line.style.top = Math.random() * 70 + '%';
      line.style.width = Math.random() * 15 + 5 + '%';
      line.style.height = '2px';
      line.style.background = 'linear-gradient(90deg, rgba(24, 144, 255, 0), rgba(24, 144, 255, 0.8), rgba(24, 144, 255, 0))';
      line.style.transform = 'rotate(-45deg)';
    }
    
    line.style.opacity = '0';
    line.style.animation = 'circuit-line-animate ' + (Math.random() * 3 + 2) + 's linear ' + (Math.random() * 2) + 's infinite';
    circuitLines.appendChild(line);
  }
  
  preloaderEl.appendChild(circuitLines);
  
  // 添加扫描线效果
  const scanlineContainer = document.createElement('div');
  scanlineContainer.className = 'scanline-container';
  scanlineContainer.style.position = 'absolute';
  scanlineContainer.style.top = '0';
  scanlineContainer.style.left = '0';
  scanlineContainer.style.width = '100%';
  scanlineContainer.style.height = '100%';
  scanlineContainer.style.overflow = 'hidden';
  scanlineContainer.style.zIndex = '3';
  scanlineContainer.style.pointerEvents = 'none';
  
  // 水平扫描线
  const horizontalScanline = document.createElement('div');
  horizontalScanline.className = 'horizontal-scanline';
  horizontalScanline.style.position = 'absolute';
  horizontalScanline.style.left = '0';
  horizontalScanline.style.width = '100%';
  horizontalScanline.style.height = '2px';
  horizontalScanline.style.background = 'linear-gradient(90deg, rgba(24,144,255,0), rgba(24,144,255,0.8), rgba(24,144,255,0))';
  horizontalScanline.style.boxShadow = '0 0 10px rgba(24,144,255,0.8)';
  horizontalScanline.style.zIndex = '3';
  horizontalScanline.style.animation = 'scanline-horizontal 3s linear infinite';
  
  // 垂直扫描线
  const verticalScanline = document.createElement('div');
  verticalScanline.className = 'vertical-scanline';
  verticalScanline.style.position = 'absolute';
  verticalScanline.style.top = '0';
  verticalScanline.style.width = '2px';
  verticalScanline.style.height = '100%';
  verticalScanline.style.background = 'linear-gradient(180deg, rgba(24,144,255,0), rgba(24,144,255,0.8), rgba(24,144,255,0))';
  verticalScanline.style.boxShadow = '0 0 10px rgba(24,144,255,0.8)';
  verticalScanline.style.zIndex = '3';
  verticalScanline.style.animation = 'scanline-vertical 4s linear 1s infinite';
  
  scanlineContainer.appendChild(horizontalScanline);
  scanlineContainer.appendChild(verticalScanline);
  preloaderEl.appendChild(scanlineContainer);
  
  // 添加HUD风格边框
  const hudBorder = document.createElement('div');
  hudBorder.className = 'hud-border';
  hudBorder.style.position = 'absolute';
  hudBorder.style.top = '20px';
  hudBorder.style.left = '20px';
  hudBorder.style.right = '20px';
  hudBorder.style.bottom = '20px';
  hudBorder.style.border = '2px solid rgba(24, 144, 255, 0.3)';
  hudBorder.style.borderRadius = '10px';
  hudBorder.style.boxShadow = '0 0 15px rgba(24, 144, 255, 0.2)';
  hudBorder.style.zIndex = '4';
  hudBorder.style.pointerEvents = 'none';
  
  // 在边框四角添加装饰性角标
  const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
  corners.forEach(position => {
    const corner = document.createElement('div');
    corner.className = `hud-corner ${position}`;
    corner.style.position = 'absolute';
    corner.style.width = '30px';
    corner.style.height = '30px';
    corner.style.borderColor = 'rgba(24, 144, 255, 0.6)';
    corner.style.borderStyle = 'solid';
    
    if (position === 'top-left') {
      corner.style.top = '-2px';
      corner.style.left = '-2px';
      corner.style.borderWidth = '2px 0 0 2px';
      corner.style.borderRadius = '5px 0 0 0';
    } else if (position === 'top-right') {
      corner.style.top = '-2px';
      corner.style.right = '-2px';
      corner.style.borderWidth = '2px 2px 0 0';
      corner.style.borderRadius = '0 5px 0 0';
    } else if (position === 'bottom-left') {
      corner.style.bottom = '-2px';
      corner.style.left = '-2px';
      corner.style.borderWidth = '0 0 2px 2px';
      corner.style.borderRadius = '0 0 0 5px';
    } else {
      corner.style.bottom = '-2px';
      corner.style.right = '-2px';
      corner.style.borderWidth = '0 2px 2px 0';
      corner.style.borderRadius = '0 0 5px 0';
    }
    
    hudBorder.appendChild(corner);
  });
  
  preloaderEl.appendChild(hudBorder);
  
  // 添加主要内容
  const contentEl = document.createElement('div');
  contentEl.className = 'preloader-content';
  contentEl.style.position = 'relative';
  contentEl.style.zIndex = '5';
  contentEl.style.textAlign = 'center';
  contentEl.style.display = 'flex';
  contentEl.style.flexDirection = 'column';
  contentEl.style.alignItems = 'center';
  contentEl.style.justifyContent = 'center';
  contentEl.style.height = '100%';
  
  // 添加HUD样式标题
  const titleEl = document.createElement('div');
  titleEl.className = 'hud-title';
  titleEl.style.fontSize = '2rem';
  titleEl.style.fontWeight = 'bold';
  titleEl.style.color = 'rgba(24, 144, 255, 0.9)';
  titleEl.style.textShadow = '0 0 10px rgba(24, 144, 255, 0.5)';
  titleEl.style.letterSpacing = '3px';
  titleEl.style.marginBottom = '2rem';
  titleEl.style.textTransform = 'uppercase';
  titleEl.style.position = 'relative';
  titleEl.innerHTML = 'SYSTEM LOADING';
  
  // 添加标题修饰
  const titleDecorLeft = document.createElement('span');
  titleDecorLeft.style.position = 'absolute';
  titleDecorLeft.style.left = '-40px';
  titleDecorLeft.style.top = '50%';
  titleDecorLeft.style.width = '30px';
  titleDecorLeft.style.height = '2px';
  titleDecorLeft.style.background = 'linear-gradient(90deg, rgba(24,144,255,0), rgba(24,144,255,0.8))';
  titleDecorLeft.style.transform = 'translateY(-50%)';
  
  const titleDecorRight = document.createElement('span');
  titleDecorRight.style.position = 'absolute';
  titleDecorRight.style.right = '-40px';
  titleDecorRight.style.top = '50%';
  titleDecorRight.style.width = '30px';
  titleDecorRight.style.height = '2px';
  titleDecorRight.style.background = 'linear-gradient(90deg, rgba(24,144,255,0.8), rgba(24,144,255,0))';
  titleDecorRight.style.transform = 'translateY(-50%)';
  
  titleEl.appendChild(titleDecorLeft);
  titleEl.appendChild(titleDecorRight);
  
  // 添加加载文字 - 科技风格
  const textEl = document.createElement('div');
  textEl.className = 'loading-text';
  textEl.textContent = '正在初始化系统...';
  textEl.style.color = '#ffffff';
  textEl.style.fontSize = '1rem';
  textEl.style.fontFamily = 'monospace';
  textEl.style.marginBottom = '2rem';
  textEl.style.textAlign = 'center';
  textEl.style.textShadow = '0 0 10px rgba(255, 255, 255, 0.5)';
  textEl.style.padding = '0 20px';
  
  // 添加二进制装饰效果
  const binaryDecor = document.createElement('div');
  binaryDecor.className = 'binary-decor';
  binaryDecor.style.fontSize = '0.7rem';
  binaryDecor.style.color = 'rgba(24, 144, 255, 0.4)';
  binaryDecor.style.fontFamily = 'monospace';
  binaryDecor.style.marginTop = '5px';
  binaryDecor.style.letterSpacing = '2px';
  // 生成随机二进制数字
  let binaryText = '';
  for (let i = 0; i < 32; i++) {
    binaryText += Math.round(Math.random());
  }
  binaryDecor.textContent = binaryText;
  textEl.appendChild(binaryDecor);
  
  // 创建高科技进度条
  const progressContainer = document.createElement('div');
  progressContainer.className = 'progress-container';
  progressContainer.style.width = '280px';
  progressContainer.style.height = '8px';
  progressContainer.style.margin = '0 auto';
  progressContainer.style.backgroundColor = 'rgba(0, 30, 60, 0.5)';
  progressContainer.style.borderRadius = '4px';
  progressContainer.style.overflow = 'hidden';
  progressContainer.style.position = 'relative';
  
  // 添加进度条发光边框
  progressContainer.style.boxShadow = '0 0 5px rgba(0, 255, 170, 0.3)';
  progressContainer.style.border = '1px solid rgba(0, 255, 170, 0.3)';
  
  // 进度条
  const progressBar = document.createElement('div');
  progressBar.className = 'progress-bar';
  progressBar.style.height = '100%';
  progressBar.style.width = '0%';
  progressBar.style.background = 'linear-gradient(90deg, #1890ff, #40a9ff)';
  progressBar.style.borderRadius = '4px';
  progressBar.style.transition = 'width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
  progressBar.style.position = 'relative';
  progressBar.style.zIndex = '1';
  
  // 进度条扫描线效果
  const progressGlow = document.createElement('div');
  progressGlow.className = 'progress-glow';
  progressGlow.style.position = 'absolute';
  progressGlow.style.top = '0';
  progressGlow.style.left = '0';
  progressGlow.style.width = '30px';
  progressGlow.style.height = '100%';
  progressGlow.style.background = 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.8), rgba(255,255,255,0))';
  progressGlow.style.animation = 'progress-glow 1.5s ease-in-out infinite';
  progressGlow.style.zIndex = '2';
  
  // 添加目前百分比数字
  const percentEl = document.createElement('div');
  percentEl.className = 'percent-text';
  percentEl.style.position = 'absolute';
  percentEl.style.right = '-50px';
  percentEl.style.top = '0';
  percentEl.style.color = 'rgba(24, 144, 255, 0.9)';
  percentEl.style.fontSize = '0.8rem';
  percentEl.style.fontFamily = 'monospace';
  percentEl.textContent = '0%';
  
  progressContainer.appendChild(progressBar);
  progressBar.appendChild(progressGlow);
  progressContainer.appendChild(percentEl);
  
  // 添加数据标签
  const dataLabels = document.createElement('div');
  dataLabels.className = 'data-labels';
  dataLabels.style.display = 'flex';
  dataLabels.style.justifyContent = 'space-between';
  dataLabels.style.width = '280px';
  dataLabels.style.margin = '10px auto 0';
  dataLabels.style.fontSize = '0.7rem';
  dataLabels.style.fontFamily = 'monospace';
  dataLabels.style.color = 'rgba(24, 144, 255, 0.7)';
  
  const startLabel = document.createElement('div');
  startLabel.textContent = 'INIT';
  
  const middleLabel = document.createElement('div');
  middleLabel.textContent = 'SYNC';
  
  const endLabel = document.createElement('div');
  endLabel.textContent = 'READY';
  
  dataLabels.appendChild(startLabel);
  dataLabels.appendChild(middleLabel);
  dataLabels.appendChild(endLabel);
  
  contentEl.appendChild(titleEl);
  contentEl.appendChild(textEl);
  contentEl.appendChild(progressContainer);
  contentEl.appendChild(dataLabels);
  
  preloaderEl.appendChild(contentEl);
  
  // 添加CSS动画
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes digital-rain-fall {
      0% { transform: translateY(-100%); }
      100% { transform: translateY(100vh); }
    }
    
    @keyframes circuit-line-animate {
      0% { opacity: 0; transform: translateX(-100%); }
      50% { opacity: 1; }
      100% { opacity: 0; transform: translateX(100%); }
    }
    
    @keyframes scanline-horizontal {
      0% { top: -5px; opacity: 0; }
      10% { opacity: 0.8; }
      90% { opacity: 0.8; }
      100% { top: 100%; opacity: 0; }
    }
    
    @keyframes scanline-vertical {
      0% { left: -5px; opacity: 0; }
      10% { opacity: 0.8; }
      90% { opacity: 0.8; }
      100% { left: 100%; opacity: 0; }
    }
    
    @keyframes progress-glow {
      0% { left: -30px; }
      100% { left: 100%; }
    }
    
    @keyframes glitch {
      0% { transform: translate(0); }
      20% { transform: translate(-2px, 2px); }
      40% { transform: translate(-2px, -2px); }
      60% { transform: translate(2px, 2px); }
      80% { transform: translate(2px, -2px); }
      100% { transform: translate(0); }
    }
    
    @keyframes noise {
      0%, 3%, 5%, 42%, 44%, 100% { opacity: 1; transform: scaleY(1); }
      4.3% { opacity: 1; transform: scaleY(4); }
      43% { opacity: 1; transform: scaleX(10) scaleY(0.1); }
    }
    
    @keyframes rotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
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
      transition: opacity 0.8s cubic-bezier(0.19, 1, 0.22, 1);
      will-change: opacity;
      overflow: hidden;
    }
    
    .page-preloader.fade-out {
      opacity: 0;
    }
    
    .percent-text {
      transition: all 0.3s ease;
    }
    
    .binary-decor {
      overflow: hidden;
      display: inline-block;
      white-space: nowrap;
      animation: glitch 5s infinite;
    }
    
    .hud-title {
      position: relative;
      overflow: hidden;
    }
    
    .hud-title::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 255, 170, 0.1);
      animation: noise 2s linear infinite;
      pointer-events: none;
      opacity: 0.3;
    }
    
    .hud-corner {
      animation: pulse 2s infinite alternate;
    }
    
    @keyframes pulse {
      0% { opacity: 0.6; }
      100% { opacity: 1; }
    }
  `;
  
  document.head.appendChild(styleEl);
  document.body.appendChild(preloaderEl);
  return preloaderEl;
}

// 添加页面过渡切换效果
function setupPageTransition() {
  document.addEventListener('click', function(e) {
    // 只拦截内部链接点击
    const link = e.target.closest('a');
    if (link && link.href && link.href.indexOf(window.location.origin) === 0 && !link.target && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      
      // 记录目标URL
      const targetUrl = link.href;
      
      // 创建过渡动画元素
      const transitionEl = document.createElement('div');
      transitionEl.className = 'page-transition-overlay';
      transitionEl.style.position = 'fixed';
      transitionEl.style.top = '0';
      transitionEl.style.left = '0';
      transitionEl.style.width = '100%';
      transitionEl.style.height = '100%';
      transitionEl.style.backgroundColor = 'rgba(0, 21, 41, 0.95)';
      transitionEl.style.zIndex = '99999';
      transitionEl.style.opacity = '0';
      transitionEl.style.transition = 'opacity 0.4s ease';
      transitionEl.style.display = 'flex';
      transitionEl.style.justifyContent = 'center';
      transitionEl.style.alignItems = 'center';
      
      // 添加像素化效果
      const pixelateEl = document.createElement('div');
      pixelateEl.className = 'pixelate-effect';
      pixelateEl.style.position = 'absolute';
      pixelateEl.style.top = '0';
      pixelateEl.style.left = '0';
      pixelateEl.style.width = '100%';
      pixelateEl.style.height = '100%';
      pixelateEl.style.backgroundImage = 'url(' + createScreenshot() + ')';
      pixelateEl.style.backgroundSize = 'cover';
      pixelateEl.style.backgroundPosition = 'center';
      pixelateEl.style.opacity = '1';
      pixelateEl.style.transition = 'all 0.8s ease';
      pixelateEl.style.filter = 'blur(0)';
      
      // 添加技术感文本
      const techText = document.createElement('div');
      techText.className = 'tech-text';
      techText.style.color = 'rgba(0, 255, 170, 0.9)';
      techText.style.fontSize = '1rem';
      techText.style.fontFamily = 'monospace';
      techText.style.position = 'absolute';
      techText.style.top = '50%';
      techText.style.left = '50%';
      techText.style.transform = 'translate(-50%, -50%)';
      techText.style.textAlign = 'center';
      techText.style.opacity = '0';
      techText.style.transition = 'opacity 0.5s ease';
      techText.style.textShadow = '0 0 10px rgba(0, 255, 170, 0.5)';
      techText.style.zIndex = '2';
      techText.innerHTML = 'INITIALIZING TRANSFER...';
      
      transitionEl.appendChild(pixelateEl);
      transitionEl.appendChild(techText);
      document.body.appendChild(transitionEl);
      
      // 开始过渡动画
      setTimeout(() => {
        transitionEl.style.opacity = '1';
        pixelateEl.style.filter = 'blur(10px) saturate(1.5)';
        techText.style.opacity = '1';
        
        // 模拟系统加载
        setTimeout(() => {
          techText.innerHTML = 'PREPARING DATA...';
          setTimeout(() => {
            techText.innerHTML = 'REDIRECTING...';
            setTimeout(() => {
              // 导航到新页面
              window.location.href = targetUrl;
            }, 500);
          }, 600);
        }, 600);
      }, 50);
    }
  });
}

// 创建屏幕截图（简化版，实际上只是一个空白图）
function createScreenshot() {
  // 实际项目中可以使用html2canvas等库获取真实截图
  // 这里简化处理，返回一个1x1像素的透明图片
  return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
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
    }, 800);
  }
}

// 更新加载进度
function updateLoadingProgress(progress) {
  const progressBar = document.querySelector('.progress-bar');
  const percentText = document.querySelector('.percent-text');
  
  if (progressBar) {
    // 使用缓动函数使进度条更加丝滑
    progressBar.style.width = progress + '%';
    
    // 更新百分比文本
    if (percentText) {
      percentText.textContent = Math.round(progress) + '%';
    }
  }
}

// 模拟加载进度
function simulateLoading() {
  const textEl = document.querySelector('.loading-text');
  const binaryEl = document.querySelector('.binary-decor');
  let progress = 0;
  let textChangeCount = 0;
  
  // 定时更新文字和二进制装饰
  const textInterval = setInterval(function() {
    if (textEl && textChangeCount < 5) {
      // 更新主文本
      const randomIndex = Math.floor(Math.random() * window.loadingTexts.length);
      textEl.firstChild.textContent = window.loadingTexts[randomIndex];
      
      // 更新二进制装饰
      if (binaryEl) {
        let binaryText = '';
        for (let i = 0; i < 32; i++) {
          binaryText += Math.round(Math.random());
        }
        binaryEl.textContent = binaryText;
      }
      
      textChangeCount++;
    } else {
      clearInterval(textInterval);
    }
  }, 1200);
  
  // 进度条动画 - 使用非线性进度增长，更加自然
  const progressInterval = setInterval(function() {
    const remainingProgress = 100 - progress;
    const increment = Math.min(
      remainingProgress * 0.1, // 最大增量为剩余进度的10%
      Math.floor(Math.random() * 6) + 2 // 随机增量，但不会太大
    );
    
    progress += increment;
    
    if (progress >= 100) {
      progress = 100;
      clearInterval(progressInterval);
      clearInterval(textInterval);
      
      // 显示完成状态
      if (textEl) {
        textEl.firstChild.textContent = '系统初始化完成';
        if (binaryEl) {
          binaryEl.textContent = '1'.repeat(32);
        }
      }
      
      // 完成加载
      setTimeout(hidePreloader, 800);
    }
    
    updateLoadingProgress(progress);
  }, 250);
}

// 初始化预加载系统
document.addEventListener('DOMContentLoaded', function() {
  // 创建预加载器
  createPreloaderElement();
  document.body.style.overflow = 'hidden'; // 防止滚动
  
  // 设置页面过渡
  setupPageTransition();
  
  // 开始模拟加载进度
  simulateLoading();
  
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
          binaryEl.textContent = '1'.repeat(32);
        }
      }
      
      setTimeout(hidePreloader, 800);
    }
  });
}); 