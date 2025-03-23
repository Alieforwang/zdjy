// 用户管理页面的JavaScript代码
document.addEventListener('DOMContentLoaded', function() {
    // 全局变量
    let userData = [];
    const itemsPerPage = 10;
    let currentPage = 1;
    let totalPages = 1;
    let currentUserId = null;
    
    // DOM元素
    const userTable = document.getElementById('userTable');
    const tableBody = document.getElementById('tableBody');
    const searchInput = document.getElementById('searchInput');
    const addUserBtn = document.getElementById('addUserBtn');
    const exportBtn = document.getElementById('exportBtn');
    const userModal = document.getElementById('userModal');
    const confirmModal = document.getElementById('confirmModal');
    const userForm = document.getElementById('userForm');
    const modalTitle = document.getElementById('modalTitle');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    const confirmMessage = document.getElementById('confirmMessage');
    
    // 初始化页面
    initPage();
    
    // 导出用户数据
    function exportUserData() {
        // 使用window.location跳转到导出API
        window.location.href = '/api/users/export';
    }
    
    // 加载用户数据
    function loadUserData() {
        // 显示加载提示
        tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">正在加载数据...</td></tr>';
        
        // 发起API请求获取用户数据
        fetch('/api/users')
            .then(response => {
                if (!response.ok) {
                    throw new Error('获取用户数据失败: ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    userData = data.users;
                    totalPages = Math.ceil(userData.length / itemsPerPage);
                    renderTable();
                    updatePagination();
                } else {
                    showError('获取用户数据失败: ' + data.message);
                }
            })
            .catch(error => {
                showError('获取用户数据失败: ' + error.message);
            });
    }
    
    // 渲染用户表格
    function renderTable() {
        const searchTerm = searchInput.value.toLowerCase();
        // 过滤数据
        const filteredData = userData.filter(user => 
            user.username.toLowerCase().includes(searchTerm)
        );
        
        totalPages = Math.ceil(filteredData.length / itemsPerPage);
        
        // 如果当前页超出范围，则重置到第一页
        if (currentPage > totalPages) {
            currentPage = 1;
        }
        
        // 计算当前页的数据
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const currentPageData = filteredData.slice(startIndex, endIndex);
        
        // 清空表格
        tableBody.innerHTML = '';
        
        // 如果没有数据，显示提示
        if (currentPageData.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">没有找到匹配的用户数据</td></tr>';
            return;
        }
        
        // 渲染数据
        currentPageData.forEach(user => {
            const row = document.createElement('tr');
            
            // 格式化创建时间
            const createdDate = new Date(user.created_at);
            const formattedDate = createdDate.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            
            // 设置用户角色展示
            const roleClass = user.is_admin ? 'role-admin' : 'role-user';
            const roleName = user.is_admin ? '管理员' : '普通用户';
            
            row.innerHTML = `
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td><span class="user-role ${roleClass}">${roleName}</span></td>
                <td>${formattedDate}</td>
                <td class="table-actions">
                    <button class="edit-btn" data-id="${user.id}">编辑</button>
                    <button class="delete-btn" data-id="${user.id}">删除</button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // 添加事件监听器到按钮
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', handleEditUser);
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', handleDeleteUser);
        });
        
        // 更新分页信息
        updatePagination();
    }
    
    // 更新分页控件
    function updatePagination() {
        pageInfo.textContent = `${currentPage} / ${totalPages || 1}`;
        
        // 禁用/启用分页按钮
        prevPageBtn.disabled = currentPage <= 1;
        nextPageBtn.disabled = currentPage >= totalPages;
    }
    
    // 处理页面跳转
    function handlePageChange(direction) {
        if (direction === 'prev' && currentPage > 1) {
            currentPage--;
        } else if (direction === 'next' && currentPage < totalPages) {
            currentPage++;
        }
        
        renderTable();
    }
    
    // 处理添加用户
    function handleAddUser() {
        // 重置表单
        userForm.reset();
        document.getElementById('passwordGroup').style.display = 'block';
        document.getElementById('userId').value = '';
        currentUserId = null;
        
        // 更新模态框标题
        modalTitle.textContent = '添加用户';
        
        // 显示模态框
        userModal.style.display = 'flex';
    }
    
    // 处理编辑用户
    function handleEditUser(event) {
        const userId = event.target.dataset.id;
        currentUserId = userId;
        
        // 查找用户数据
        const user = userData.find(u => u.id.toString() === userId);
        
        if (user) {
            // 填充表单
            document.getElementById('userId').value = user.id;
            document.getElementById('username').value = user.username;
            document.getElementById('isAdmin').checked = user.is_admin;
            
            // 编辑时不需要输入密码
            document.getElementById('passwordGroup').style.display = 'none';
            
            // 更新模态框标题
            modalTitle.textContent = '编辑用户';
            
            // 显示模态框
            userModal.style.display = 'flex';
        } else {
            showError('未找到用户数据');
        }
    }
    
    // 处理删除用户
    function handleDeleteUser(event) {
        const userId = event.target.dataset.id;
        currentUserId = userId;
        
        // 查找用户数据
        const user = userData.find(u => u.id.toString() === userId);
        
        if (user) {
            // 更新确认消息
            confirmMessage.textContent = `确定要删除用户 "${user.username}" 吗？此操作不可恢复。`;
            
            // 显示确认模态框
            confirmModal.style.display = 'flex';
        } else {
            showError('未找到用户数据');
        }
    }
    
    // 提交用户表单
    function submitUserForm(event) {
        event.preventDefault();
        
        // 获取表单数据
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password')?.value;
        const isAdmin = document.getElementById('isAdmin').checked;
        
        // 基本验证
        if (!username) {
            showError('用户名不能为空');
            return;
        }
        
        // 如果是新用户，密码不能为空
        if (!currentUserId && !password) {
            showError('密码不能为空');
            return;
        }
        
        // 准备数据
        const formData = {
            username: username,
            is_admin: isAdmin
        };
        
        // 如果是添加新用户或更改了密码，则包含密码字段
        if (password) {
            formData.password = password;
        }
        
        // 确定API路径和方法
        let url = '/api/users';
        let method = 'POST';
        
        if (currentUserId) {
            url = `/api/users/${currentUserId}`;
            method = 'PUT';
        }
        
        // 发送请求
        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('操作失败: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // 关闭模态框
                closeModal(userModal);
                
                // 重新加载数据
                loadUserData();
                
                // 显示成功消息
                showMessage(currentUserId ? '用户已成功更新' : '用户已成功添加');
            } else {
                showError(data.message || '操作失败');
            }
        })
        .catch(error => {
            showError('操作失败: ' + error.message);
        });
    }
    
    // 确认删除用户
    function confirmDeleteUser() {
        if (!currentUserId) {
            showError('未找到用户ID');
            return;
        }
        
        // 发送删除请求
        fetch(`/api/users/${currentUserId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('删除失败: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // 关闭模态框
                closeModal(confirmModal);
                
                // 重新加载数据
                loadUserData();
                
                // 显示成功消息
                showMessage('用户已成功删除');
            } else {
                showError(data.message || '删除失败');
            }
        })
        .catch(error => {
            showError('删除失败: ' + error.message);
        });
    }
    
    // 关闭模态框
    function closeModal(modal) {
        modal.style.display = 'none';
    }
    
    // 显示错误消息
    function showError(message) {
        alert('错误: ' + message);
    }
    
    // 显示成功消息
    function showMessage(message) {
        alert(message);
    }
    
    // 初始化页面
    function initPage() {
        // 加载用户数据
        loadUserData();
        
        // 绑定事件
        searchInput.addEventListener('input', function() {
            currentPage = 1;
            renderTable();
            updatePagination();
        });
        
        // 分页按钮事件
        prevPageBtn.addEventListener('click', function() {
            handlePageChange(-1);
        });
        
        nextPageBtn.addEventListener('click', function() {
            handlePageChange(1);
        });
        
        // 添加用户按钮事件
        addUserBtn.addEventListener('click', handleAddUser);
        
        // 导出按钮事件
        exportBtn.addEventListener('click', exportUserData);
        
        // 关闭模态框事件
        document.querySelectorAll('.close-btn, .cancel-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const modal = this.closest('.modal');
                closeModal(modal);
            });
        });
        
        // 表单提交事件
        userForm.addEventListener('submit', submitUserForm);
        
        // 确认删除事件
        document.getElementById('confirmDelete').addEventListener('click', confirmDeleteUser);
    }
}); 