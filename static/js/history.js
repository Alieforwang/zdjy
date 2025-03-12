document.addEventListener('DOMContentLoaded', function() {
    let currentPage = 1;
    const pageSize = 8;  // 设置每页显示6条数据
    
    // 类型映射
    const typeMapping = {
        'zdjy_ld': '流动摊位',
        'zdjy_gd': '固定摊位'
    };
    
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
                        const displayType = typeMapping[record.type] || '未知';
                        
                        tr.innerHTML = `
                            <td>${new Date(record.detect_time).toLocaleString()}</td>
                            <td>${displayType}</td>
                            <td>${record.location || '未指定'}</td>
                            <td>${record.confidence ? (record.confidence * 100).toFixed(1) + '%' : '未知'}</td>
                            <td>
                                <button class="view-btn" onclick="viewDetail('${record.file_path}', '${record.result_path}', ${record.file_type === 'video'})">
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
    
    // 查看详情函数
    window.viewDetail = function(originalPath, resultPath, isVideo) {
        const modal = document.getElementById('detailModal');
        const detailContent = document.getElementById('detailContent');
        
        // 确保路径正确，但避免重复的/static/
        const originalUrl = originalPath.startsWith('/') ? originalPath : `/${originalPath}`;
        
        // 处理结果路径，确保格式正确且不重复
        let resultUrl = resultPath;
        // 如果路径不是以/开头，添加/
        if (!resultPath.startsWith('/')) {
            resultUrl = `/${resultPath}`;
        }
        
        console.log("显示详情：", {originalUrl, resultUrl, isVideo});
        
        detailContent.innerHTML = `
            <div class="detail-container">
                <div class="detail-section">
                    <h4>原始${isVideo ? '视频' : '图片'}</h4>
                    ${isVideo ? 
                        `<video src="${originalUrl}" controls class="detail-media">
                            您的浏览器不支持视频播放
                        </video>` :
                        `<img src="${originalUrl}" class="detail-media" alt="原始图片">`
                    }
                </div>
                <div class="detail-section">
                    <h4>分析结果</h4>
                    ${isVideo ? 
                        `<video src="${resultUrl}" controls class="detail-media">
                            您的浏览器不支持视频播放
                        </video>` :
                        `<img src="${resultUrl}" class="detail-media" alt="分析结果"
                             onerror="this.onerror=null; this.src='/static/images/view8.png'; this.alt='加载失败';">`
                    }
                </div>
                <div class="detail-actions">
                    <button onclick="downloadResult('${resultUrl.split('/').pop()}')">
                        下载分析结果
                    </button>
                </div>
            </div>
        `;
        
        modal.style.display = 'flex';
        modal.classList.add('show');
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
    
    // 关闭弹窗
    document.querySelector('.close-btn').addEventListener('click', () => {
        const modal = document.getElementById('detailModal');
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    });
    
    // 初始加载
    loadHistory();
}); 