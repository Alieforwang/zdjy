document.addEventListener('DOMContentLoaded', function() {
    // 添加滚动动画效果
    const sections = document.querySelectorAll('.about-section');
    
    // 创建Intersection Observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target); // 动画只播放一次
            }
        });
    }, {
        threshold: 0.1 // 当元素10%可见时触发
    });

    // 观察所有section
    sections.forEach(section => {
        observer.observe(section);
    });

    // 为功能卡片添加悬停效果
    const featureItems = document.querySelectorAll('.feature-item');
    featureItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            const icon = item.querySelector('.feature-icon');
            icon.style.transform = 'scale(1.2) rotate(5deg)';
        });

        item.addEventListener('mouseleave', () => {
            const icon = item.querySelector('.feature-icon');
            icon.style.transform = 'scale(1) rotate(0deg)';
        });
    });

    // 为团队成员卡片添加点击效果
    const teamMembers = document.querySelectorAll('.member');
    teamMembers.forEach(member => {
        member.addEventListener('click', () => {
            member.classList.add('pulse');
            setTimeout(() => {
                member.classList.remove('pulse');
            }, 500);
        });
    });

    // 为联系方式添加复制功能
    const contactItems = document.querySelectorAll('.contact-item');
    contactItems.forEach(item => {
        item.addEventListener('click', () => {
            const text = item.querySelector('span:last-child').textContent;
            navigator.clipboard.writeText(text).then(() => {
                // 创建提示元素
                const tooltip = document.createElement('div');
                tooltip.className = 'copy-tooltip';
                tooltip.textContent = '已复制到剪贴板';
                item.appendChild(tooltip);

                // 2秒后移除提示
                setTimeout(() => {
                    tooltip.remove();
                }, 2000);
            }).catch(err => {
                console.error('复制失败:', err);
            });
        });
    });

    // 添加CSS动画样式
    const style = document.createElement('style');
    style.textContent = `
        .about-section {
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.8s ease;
        }

        .about-section.fade-in {
            opacity: 1;
            transform: translateY(0);
        }

        .feature-icon {
            transition: transform 0.3s ease;
        }

        .member.pulse {
            animation: pulse 0.5s ease;
        }

        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }

        .copy-tooltip {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(64, 169, 255, 0.9);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            font-size: 0.9rem;
            pointer-events: none;
            animation: fadeInOut 2s ease;
        }

        @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-50%, 10px); }
            20% { opacity: 1; transform: translate(-50%, 0); }
            80% { opacity: 1; transform: translate(-50%, 0); }
            100% { opacity: 0; transform: translate(-50%, -10px); }
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
    document.getElementById('backHomeBtn').addEventListener('click', function() {
        window.location.href = '/';
    });
}); 