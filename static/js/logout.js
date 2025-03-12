function logout() {
    // 添加退出确认
    if (confirm('确定要退出登录吗？')) {
        // 可以在这里添加清除session或本地存储的逻辑
        
        // 跳转到登录页面
        window.location.href = 'denglu/1,1.html';
    }
} 