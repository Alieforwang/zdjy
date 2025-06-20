#!/bin/bash
#
# 数据库连接池监控脚本 (Linux版本)
# 用于监控和修复数据库连接池维护线程的脚本
#

# 脚本目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )/"
cd "${SCRIPT_DIR}"

# 日志目录和文件
LOG_DIR="${SCRIPT_DIR}logs"
LOG_FILE="${LOG_DIR}/db_monitor.log"

# 应用日志文件路径
APP_LOG="${SCRIPT_DIR}app.log"

# 维护状态：0=正常，1=维护超时，2=应用未运行
MAINTENANCE_STATUS=0

# 日志函数
log() {
    local log_level=$1
    local message=$2
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    
    # 创建日志目录(如果不存在)
    if [ ! -d "${LOG_DIR}" ]; then
        mkdir -p "${LOG_DIR}"
    fi
    
    echo "[${timestamp}] [${log_level}] ${message}" >> "${LOG_FILE}"
    
    # 在严重错误时也输出到控制台
    if [ "${log_level}" == "ERROR" ]; then
        echo "[${timestamp}] [${log_level}] ${message}"
    fi
}

# 检查应用是否运行
check_app_running() {
    local app_process=$(pgrep -f "python.*app.py" | wc -l)
    
    if [ $app_process -eq 0 ]; then
        log "WARNING" "应用未运行，需要启动应用"
        MAINTENANCE_STATUS=2
        return 1
    fi
    
    return 0
}

# 检查数据库连接池维护线程
check_maintenance() {
    if [ ! -f "${APP_LOG}" ]; then
        log "WARNING" "应用日志文件不存在: ${APP_LOG}"
        return 1
    fi
    
    # 获取最后一条维护日志的时间
    local last_maintenance=$(grep -a "执行定期数据库连接池维护" "${APP_LOG}" | tail -1)
    
    if [ -z "${last_maintenance}" ]; then
        log "WARNING" "找不到数据库连接池维护日志记录"
        MAINTENANCE_STATUS=1
        return 1
    fi
    
    # 提取日志中的时间戳
    local maintenance_timestamp=$(echo "${last_maintenance}" | grep -o '[0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\} [0-9]\{2\}:[0-9]\{2\}:[0-9]\{2\}')
    local maintenance_epoch=$(date -d "${maintenance_timestamp}" +%s)
    local current_epoch=$(date +%s)
    local time_diff=$((current_epoch - maintenance_epoch))
    
    # 如果超过2小时未执行维护
    if [ $time_diff -gt 7200 ]; then
        log "WARNING" "数据库连接池维护超过2小时未执行，上次执行时间: ${maintenance_timestamp}"
        MAINTENANCE_STATUS=1
        return 1
    fi
    
    log "INFO" "数据库连接池维护正常，上次执行时间: ${maintenance_timestamp}"
    return 0
}

# 强制重置数据库连接池
force_reset_pool() {
    log "INFO" "尝试强制重置数据库连接池..."
    
    local reset_script="${SCRIPT_DIR}reset_db_pool.py"
    
    # 检查重置脚本是否存在，不存在则创建
    if [ ! -f "${reset_script}" ]; then
        log "INFO" "创建数据库连接池重置脚本: ${reset_script}"
        cat > "${reset_script}" << 'EOF'
#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
数据库连接池重置脚本
用于强制重置数据库连接池
"""

import sys
import os
import logging
import importlib.util
import traceback

# 配置日志
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

logging.basicConfig(
    filename=os.path.join(log_dir, "db_reset.log"),
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

try:
    # 尝试导入应用的数据库模块
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    
    # 尝试不同的可能模块路径
    possible_modules = [
        "app.database", 
        "database", 
        "app.db", 
        "db",
        "app.core.database",
        "core.database"
    ]
    
    db_module = None
    for module_name in possible_modules:
        try:
            db_module = importlib.import_module(module_name)
            logging.info(f"成功导入数据库模块: {module_name}")
            break
        except ImportError:
            continue
    
    if db_module is None:
        logging.error("无法找到数据库模块")
        sys.exit(1)
    
    # 尝试重置连接池
    if hasattr(db_module, "reset_pool"):
        db_module.reset_pool()
        logging.info("已重置数据库连接池")
    elif hasattr(db_module, "engine"):
        if hasattr(db_module.engine, "dispose"):
            db_module.engine.dispose()
            logging.info("已重置数据库引擎连接池")
        else:
            logging.error("数据库引擎没有dispose方法")
    else:
        logging.error("找不到数据库连接池或重置方法")
        sys.exit(1)
    
    print("数据库连接池重置成功")
    sys.exit(0)
except Exception as e:
    logging.error(f"重置数据库连接池时出错: {str(e)}")
    logging.error(traceback.format_exc())
    print(f"错误: {str(e)}")
    sys.exit(1)
EOF
        chmod +x "${reset_script}"
    fi
    
    # 检查是否有虚拟环境
    if [ -d "${SCRIPT_DIR}venv" ]; then
        source "${SCRIPT_DIR}venv/bin/activate"
        log "INFO" "已激活Python虚拟环境"
    fi
    
    # 执行重置脚本
    reset_output=$(python "${reset_script}" 2>&1)
    reset_result=$?
    
    if [ $reset_result -eq 0 ]; then
        log "INFO" "数据库连接池重置成功: ${reset_output}"
        return 0
    else
        log "ERROR" "数据库连接池重置失败: ${reset_output}"
        return 1
    fi
}

# 重启应用
restart_app() {
    log "INFO" "尝试重启应用..."
    
    # 检查是否有启动脚本
    if [ -f "${SCRIPT_DIR}start.sh" ]; then
        log "INFO" "使用start.sh重启应用"
        bash "${SCRIPT_DIR}start.sh" > /dev/null 2>&1 &
        
        # 等待应用启动
        sleep 5
        check_app_running
        if [ $? -eq 0 ]; then
            log "INFO" "应用已成功重启"
            return 0
        else
            log "ERROR" "使用start.sh重启应用失败"
        fi
    fi
    
    # 如果没有启动脚本或启动脚本失败，尝试直接启动应用
    log "INFO" "尝试直接启动应用"
    
    # 检查是否有虚拟环境
    if [ -d "${SCRIPT_DIR}venv" ]; then
        source "${SCRIPT_DIR}venv/bin/activate"
        log "INFO" "已激活Python虚拟环境"
    fi
    
    # 启动应用
    cd "${SCRIPT_DIR}"
    nohup python app.py > /dev/null 2>&1 &
    
    # 等待应用启动
    sleep 5
    check_app_running
    if [ $? -eq 0 ]; then
        log "INFO" "应用已成功启动"
        return 0
    else
        log "ERROR" "直接启动应用失败"
        return 1
    fi
}

# 清理旧日志
cleanup_logs() {
    log "INFO" "清理7天前的旧日志文件"
    find "${LOG_DIR}" -type f -name "*.log" -mtime +7 -exec rm {} \;
}

# 主函数
main() {
    log "INFO" "开始监控数据库连接池维护线程"
    
    # 检查应用是否运行
    check_app_running
    
    # 如果应用正在运行，检查维护线程
    if [ $MAINTENANCE_STATUS -eq 0 ]; then
        check_maintenance
    fi
    
    # 根据状态执行操作
    case $MAINTENANCE_STATUS in
        0)
            log "INFO" "数据库连接池维护正常，无需操作"
            ;;
        1)
            log "WARNING" "尝试强制重置数据库连接池"
            force_reset_pool
            if [ $? -ne 0 ]; then
                log "ERROR" "重置数据库连接池失败，尝试重启应用"
                restart_app
            fi
            ;;
        2)
            log "WARNING" "尝试重启应用"
            restart_app
            ;;
        *)
            log "ERROR" "未知的维护状态: ${MAINTENANCE_STATUS}"
            ;;
    esac
    
    # 清理旧日志
    cleanup_logs
    
    log "INFO" "数据库连接池监控完成"
}

# 执行主函数
main

exit 0 