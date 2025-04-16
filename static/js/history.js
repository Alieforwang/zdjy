document.addEventListener('DOMContentLoaded', function() {
    let currentPage = 1;
    const pageSize = 8;  // 设置每页显示条数
    
    // 类型映射
    const typeMapping = {
        'zdjy_ld': '流动摊位',
        'zdjy_gd': '固定摊位',
        'zdjy_ld_zdjy_gd': '混合摊位'
    };
    
    // 导出历史记录
    function exportHistory() {
        const dateFilter = document.getElementById('dateFilter').value;
        const typeFilter = document.getElementById('typeFilter').value;
        
        // 使用window.location跳转到导出API，同时传递筛选参数
        window.location.href = `/api/history/export?days=${dateFilter}&type=${typeFilter}`;
    }
    
    // 加载历史记录
    function loadHistory() {
        const dateFilter = document.getElementById('dateFilter').value;
        const typeFilter = document.getElementById('typeFilter').value;
        
        fetch(`/api/history?days=${dateFilter}&type=${typeFilter}&page=${currentPage}&page_size=${pageSize}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const tbody = document.getElementById('historyTableBody');
                    tbody.innerHTML = '';
                    
                    data.data.forEach(record => {
                        const tr = document.createElement('tr');
                        
                        // 修复路径格式，确保使用单引号，避免双引号嵌套问题
                        const filePath = record.file_path.replace(/\\/g, '/');
                        const resultPath = record.result_path.replace(/\\/g, '/');
                        
                        tr.innerHTML = `
                            <td>${new Date(record.detect_time).toLocaleString()}</td>
                            <td>${record.type}</td>
                            <td>${record.location || '未指定'}</td>
                            <td>${record.confidence ? (record.confidence * 100).toFixed(1) + '%' : '未知'}</td>
                            <td>
                                <button class="view-btn" onclick="viewDetail('${filePath}', '${resultPath}', ${record.file_type === 'video'})">
                                    查看详情
                                </button>
                            </td>
                        `;
                        tbody.appendChild(tr);
                    });
                    
                    // 更新分页信息
                    const totalPages = Math.ceil(data.total / pageSize);
                    document.getElementById('pageInfo').textContent = `第 ${currentPage} 页 / 共 ${totalPages} 页`;
                    document.getElementById('prevPage').disabled = currentPage <= 1;
                    document.getElementById('nextPage').disabled = currentPage >= totalPages;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('加载数据失败，请刷新页面重试');
            });
    }
    
    // 绑定筛选器变化事件
    document.getElementById('dateFilter').addEventListener('change', () => {
        currentPage = 1;
        loadHistory();
    });
    
    document.getElementById('typeFilter').addEventListener('change', () => {
        currentPage = 1;
        loadHistory();
    });
    
    // 绑定导出按钮事件
    document.getElementById('exportBtn').addEventListener('click', exportHistory);
    
    // 绑定分页按钮事件
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadHistory();
        }
    });
    
    document.getElementById('nextPage').addEventListener('click', () => {
        currentPage++;
        loadHistory();
    });
    
    // 显示详情
    window.viewDetail = function(originalUrl, resultUrl, isVideo) {
        console.log('显示详情：', {originalUrl, resultUrl, isVideo});
        
        // 确保路径使用正斜杠
        originalUrl = originalUrl.replace(/\\/g, '/');
        resultUrl = resultUrl.replace(/\\/g, '/');
        
        // 处理原始图片路径
        if (originalUrl.startsWith('static/')) {
            originalUrl = '/' + originalUrl;
        }
        
        // 确保原始图片路径包含/static/uploads/
        if (!originalUrl.includes('/uploads/') && !originalUrl.includes('/static/uploads/')) {
            originalUrl = originalUrl.replace('/static/', '/static/uploads/');
        }
        
        // 处理结果图片路径
        if (resultUrl.startsWith('static')) {
            resultUrl = '/' + resultUrl;
        }
        
        // 修复 staticesult_ 前缀问题 - 改为正确的static/result_格式
        if (resultUrl.includes('staticesult_')) {
            resultUrl = resultUrl.replace('staticesult_', '/static/result_');
        } else if (resultUrl.includes('/static\\result_')) {
            resultUrl = resultUrl.replace('/static\\result_', '/static/result_');
        } else if (resultUrl.includes('\\result_')) {
            resultUrl = resultUrl.replace('\\result_', '/result_');
        }
        
        // 如果结果URL是默认路径，使用default_result.jpg
        if (resultUrl === '/static/results.jpg') {
            resultUrl = '/static/default_result.jpg';
        }
        
        // 确保结果图片路径是在/static/而不是/static/uploads/
        if (resultUrl.includes('/static/uploads/result_')) {
            resultUrl = resultUrl.replace('/static/uploads/result_', '/static/result_');
        }
        
        // 修复/static/@results/static/这样的重复路径问题
        if (resultUrl.includes('/static/@results/static/')) {
            resultUrl = resultUrl.replace('/static/@results/static/', '/static/@results/');
        }
        
        // 添加时间戳防止缓存
        const timestamp = new Date().getTime();
        const originalUrlWithTimestamp = `${originalUrl}?t=${timestamp}`;
        const resultUrlWithTimestamp = `${resultUrl}?t=${timestamp}`;
        
        console.log('处理后的URL: ', {
            original: originalUrlWithTimestamp,
            result: resultUrlWithTimestamp
        });
        
        // 更新模态框内容
        const detailContent = document.getElementById('detailContent');
        if (!detailContent) {
            console.error('未找到detailContent元素！');
            return;
        }
        
        if (isVideo) {
            detailContent.innerHTML = `
                <div class="detail-container">
                    <div class="detail-section">
                        <h4>原始视频</h4>
                        <video src="${originalUrlWithTimestamp}" controls class="detail-media">
                            您的浏览器不支持视频播放
                        </video>
                    </div>
                    <div class="detail-section">
                        <h4>分析结果</h4>
                        <video src="${resultUrlWithTimestamp}" controls class="detail-media">
                            您的浏览器不支持视频播放
                        </video>
                    </div>
                    <div class="detail-actions">
                        <button onclick="downloadResult('${resultUrl.split('/').pop().split('?')[0]}')">
                            下载分析结果
                        </button>
                    </div>
                </div>
            `;
        } else {
            detailContent.innerHTML = `
                <div class="detail-container">
                    <div class="detail-section">
                        <h4>原始图片</h4>
                        <img src="${originalUrlWithTimestamp}" class="detail-media" alt="原始图片" onerror="this.src='/static/@results/default_result.jpg'; console.error('原始图片加载失败：${originalUrl}');">
                    </div>
                    <div class="detail-section">
                        <h4>分析结果</h4>
                        <img src="${resultUrlWithTimestamp}" class="detail-media" alt="分析结果" onerror="this.src='/static/@results/default_result.jpg'; console.error('结果图片加载失败：${resultUrl}');">
                    </div>
                    <div class="detail-actions">
                        <button onclick="downloadResult('${resultUrl.split('/').pop().split('?')[0]}')">
                            下载分析结果
                        </button>
                    </div>
                </div>
            `;
        }
        
        // 显示模态框
        const modal = document.getElementById('detailModal');
        if (!modal) {
            console.error('未找到detailModal元素！');
            return;
        }
        
        modal.style.display = 'flex';
        modal.classList.add('show');
        
        // 添加关闭按钮事件
        const closeBtn = document.querySelector('.close-btn');
        if (closeBtn) {
            closeBtn.onclick = function() {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            };
        }
        
        // 点击模态框外部关闭
        window.onclick = function(event) {
            if (event.target == modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }
        };
    };
    
    // 下载结果函数
    window.downloadResult = function(filename) {
        // 检查文件名格式
        if (!filename) {
            console.error("无效的文件名");
            return;
        }
        
        // 从完整路径中获取文件名，去除任何路径前缀
        if (filename.includes('/')) {
            filename = filename.split('/').pop();
        }
        
        console.log("下载文件:", filename);
        window.location.href = `/download_result/${filename}`;
    };
    
    // 初始加载
    loadHistory();
}); 