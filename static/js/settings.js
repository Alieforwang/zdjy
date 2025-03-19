document.addEventListener('DOMContentLoaded', function() {
    // 获取所有设置元素
    const themeSelect = document.getElementById('themeSelect');
    const languageSelect = document.getElementById('languageSelect');
    const sensitivitySlider = document.getElementById('sensitivitySlider');
    const sensitivityValue = document.getElementById('sensitivityValue');
    const minSizeSlider = document.getElementById('minSizeSlider');
    const minSizeValue = document.getElementById('minSizeValue');
    const realtimeDetection = document.getElementById('realtimeDetection');
    const cleanupPeriod = document.getElementById('cleanupPeriod');
    const saveBtn = document.getElementById('saveSettings');
    const resetBtn = document.getElementById('resetSettings');

    // 默认设置
    const defaultSettings = {
        theme: 'dark',
        language: 'zh',
        sensitivity: 75,
        minSize: 50,
        realtimeDetection: true,
        cleanupPeriod: '30'
    };

    // 加载设置
    function loadSettings() {
        const settings = JSON.parse(localStorage.getItem('systemSettings')) || defaultSettings;
        
        themeSelect.value = settings.theme;
        languageSelect.value = settings.language;
        sensitivitySlider.value = settings.sensitivity;
        sensitivityValue.textContent = settings.sensitivity + '%';
        minSizeSlider.value = settings.minSize;
        minSizeValue.textContent = settings.minSize + '%';
        realtimeDetection.checked = settings.realtimeDetection;
        cleanupPeriod.value = settings.cleanupPeriod;

        // 应用主题
        document.body.className = settings.theme + '-theme';
    }

    // 保存设置
    function saveSettings() {
        const settings = {
            theme: themeSelect.value,
            language: languageSelect.value,
            sensitivity: parseInt(sensitivitySlider.value),
            minSize: parseInt(minSizeSlider.value),
            realtimeDetection: realtimeDetection.checked,
            cleanupPeriod: cleanupPeriod.value
        };

        localStorage.setItem('systemSettings', JSON.stringify(settings));

        // 显示保存成功提示
        showNotification('设置已保存');

        // 发送设置到服务器
        fetch('/api/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(settings)
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                showNotification('设置保存失败，请重试', 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showNotification('设置保存失败，请重试', 'error');
        });
    }

    // 重置设置
    function resetSettings() {
        if (confirm('确定要恢复默认设置吗？')) {
            localStorage.removeItem('systemSettings');
            loadSettings();
            showNotification('已恢复默认设置');
        }
    }

    // 显示通知
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // 添加CSS动画
        notification.style.animation = 'slideIn 0.5s ease, fadeOut 0.5s ease 2.5s';
        
        // 3秒后移除通知
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // 绑定事件监听器
    sensitivitySlider.addEventListener('input', function() {
        sensitivityValue.textContent = this.value + '%';
    });

    minSizeSlider.addEventListener('input', function() {
        minSizeValue.textContent = this.value + '%';
    });

    saveBtn.addEventListener('click', saveSettings);
    resetBtn.addEventListener('click', resetSettings);

    // 添加CSS样式
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 2rem;
            border-radius: 4px;
            color: white;
            font-size: 0.9rem;
            z-index: 1000;
            opacity: 0;
        }

        .notification.success {
            background: rgba(82, 196, 26, 0.9);
        }

        .notification.error {
            background: rgba(255, 77, 79, 0.9);
        }

        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes fadeOut {
            from {
                opacity: 1;
            }
            to {
                opacity: 0;
            }
        }

        .dark-theme {
            background: #011635;
            color: #e6e6e6;
        }

        .light-theme {
            background: #f0f2f5;
            color: #333;
        }
    `;
    document.head.appendChild(style);

    // 检查登录状态
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

    // 返回主页按钮事件处理
    const backHomeBtn = document.getElementById('backHomeBtn');
    if (backHomeBtn) {
        backHomeBtn.addEventListener('click', function() {
            window.location.href = '/';
        });
    }

    // 初始加载设置
    loadSettings();
}); 