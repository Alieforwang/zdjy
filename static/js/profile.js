// 个人中心页面的JavaScript代码
document.addEventListener('DOMContentLoaded', function() {
    // 初始化界面
    initProfilePage();
    
    // 添加选项卡切换事件
    setupTabSwitching();
    
    // 设置密码表单提交事件
    setupPasswordForm();
    
    // 加载操作日志
    setupLogFilters();
});

// 初始化页面
function initProfilePage() {
    // 获取用户信息
    fetchUserInfo();
    
    // 加载操作日志
    loadOperationLogs();
}

// 设置选项卡切换
function setupTabSwitching() {
    const menuItems = document.querySelectorAll('.menu-item');
    const panels = document.querySelectorAll('.panel');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            // 移除所有激活状态
            menuItems.forEach(i => i.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            
            // 添加当前项的激活状态
            this.classList.add('active');
            const targetPanel = document.getElementById(this.dataset.target);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });
}

// 设置密码表单提交
function setupPasswordForm() {
    const passwordForm = document.getElementById('passwordForm');
    
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            // 表单验证
            if (!currentPassword || !newPassword || !confirmPassword) {
                showNotification('请填写所有密码字段', 'error');
                return;
            }
            
            if (newPassword.length < 6) {
                showNotification('新密码长度必须至少为6位', 'error');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                showNotification('两次输入的新密码不一致', 'error');
                return;
            }
            
            // 发送修改密码请求
            changePassword(currentPassword, newPassword);
        });
    }
}

// 设置日志过滤器
function setupLogFilters() {
    const dateRangeSelect = document.getElementById('dateRange');
    const logTypeSelect = document.getElementById('logType');
    
    if (dateRangeSelect && logTypeSelect) {
        dateRangeSelect.addEventListener('change', function() {
            loadOperationLogs(1);
        });
        
        logTypeSelect.addEventListener('change', function() {
            loadOperationLogs(1);
        });
    }
    
    // 翻页按钮
    const prevPageBtn = document.getElementById('prevLogPage');
    const nextPageBtn = document.getElementById('nextLogPage');
    
    if (prevPageBtn && nextPageBtn) {
        prevPageBtn.addEventListener('click', function() {
            const currentPage = parseInt(document.getElementById('logPageInfo').textContent.split('/')[0].trim());
            if (currentPage > 1) {
                loadOperationLogs(currentPage - 1);
            }
        });
        
        nextPageBtn.addEventListener('click', function() {
            const parts = document.getElementById('logPageInfo').textContent.split('/');
            const currentPage = parseInt(parts[0].trim());
            const totalPages = parseInt(parts[1].trim());
            
            if (currentPage < totalPages) {
                loadOperationLogs(currentPage + 1);
            }
        });
    }
}

// 获取用户信息
function fetchUserInfo() {
    fetch('/api/profile')
        .then(response => {
            if (!response.ok) {
                throw new Error('获取用户信息失败');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // 更新注册时间和最后登录时间
                document.getElementById('createdTime').textContent = formatDate(data.created_at);
                document.getElementById('lastLogin').textContent = formatDate(data.last_login);
            } else {
                showNotification(data.message || '获取用户信息失败', 'error');
            }
        })
        .catch(error => {
            console.error('获取用户信息错误:', error);
            document.getElementById('createdTime').textContent = '获取失败';
            document.getElementById('lastLogin').textContent = '获取失败';
        });
}

// 加载操作日志
function loadOperationLogs(page = 1) {
    const dateRange = document.getElementById('dateRange').value;
    const logType = document.getElementById('logType').value;
    const tableBody = document.getElementById('logTableBody');
    const pageInfo = document.getElementById('logPageInfo');
    const prevPageBtn = document.getElementById('prevLogPage');
    const nextPageBtn = document.getElementById('nextLogPage');
    
    // 显示加载中
    tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">正在加载数据...</td></tr>';
    
    // 请求参数
    const params = new URLSearchParams({
        page: page,
        days: dateRange,
        type: logType
    });
    
    fetch(`/api/profile/logs?${params.toString()}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('获取操作日志失败');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // 清空表格
                tableBody.innerHTML = '';
                
                if (data.logs.length === 0) {
                    tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">没有找到操作日志记录</td></tr>';
                } else {
                    // 渲染日志数据
                    data.logs.forEach(log => {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${formatDate(log.timestamp)}</td>
                            <td>${log.action_type}</td>
                            <td>${log.description}</td>
                            <td>${log.ip_address}</td>
                        `;
                        tableBody.appendChild(row);
                    });
                }
                
                // 更新分页信息
                pageInfo.textContent = `${data.current_page} / ${data.total_pages}`;
                prevPageBtn.disabled = data.current_page <= 1;
                nextPageBtn.disabled = data.current_page >= data.total_pages;
            } else {
                showNotification(data.message || '获取操作日志失败', 'error');
                tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">加载失败</td></tr>';
            }
        })
        .catch(error => {
            console.error('获取操作日志错误:', error);
            tableBody.innerHTML = '<tr><td colspan="4" style="text-align: center;">加载失败</td></tr>';
        });
}

// 修改密码
function changePassword(currentPassword, newPassword) {
    // 显示加载状态
    const submitBtn = document.querySelector('.submit-btn');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = '保存中...';
    submitBtn.disabled = true;
    
    fetch('/api/profile/change_password', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('密码修改成功', 'success');
                // 清空表单
                document.getElementById('passwordForm').reset();
            } else {
                showNotification(data.message || '密码修改失败', 'error');
            }
        })
        .catch(error => {
            console.error('修改密码错误:', error);
            showNotification('密码修改失败，请稍后重试', 'error');
        })
        .finally(() => {
            // 恢复按钮状态
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        });
}

// 显示通知
function showNotification(message, type) {
    // 检查是否已存在通知元素
    let notification = document.getElementById('notification');
    
    if (!notification) {
        // 创建通知元素
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            max-width: 300px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s ease;
            z-index: 1000;
        `;
        document.body.appendChild(notification);
    }
    
    // 设置通知类型样式
    if (type === 'success') {
        notification.style.backgroundColor = '#52c41a';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#f5222d';
    } else {
        notification.style.backgroundColor = '#1890ff';
    }
    
    // 设置通知内容
    notification.textContent = message;
    
    // 显示通知
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
        
        // 3秒后隐藏通知
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
        }, 3000);
    }, 10);
}

// 格式化日期
function formatDate(dateString) {
    if (!dateString) return '无数据';
    
    const date = new Date(dateString);
    
    // 检查日期是否有效
    if (isNaN(date.getTime())) return '无效日期';
    
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
} 