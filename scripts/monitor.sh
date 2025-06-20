#!/bin/bash
#
# 智能识别系统监控脚本
# 用于监控系统各项指标并在异常时发送报警
#

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 定义颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # 无颜色

# 定义日志文件
LOG_FILE="$SCRIPT_DIR/logs/monitor.log"
ALERT_LOG="$SCRIPT_DIR/logs/alerts.log"

# 创建日志目录
mkdir -p "$SCRIPT_DIR/logs"

# 配置信息
# 报警阈值
DISK_THRESHOLD=90  # 磁盘使用率阈值（百分比）
MEM_THRESHOLD=90   # 内存使用率阈值（百分比）
CPU_THRESHOLD=90   # CPU使用率阈值（百分比）
LOAD_THRESHOLD=4   # 系统负载阈值
MAX_FAILED_ATTEMPTS=3  # 连续失败尝试次数

# 报警间隔（秒）
ALERT_INTERVAL=1800  # 30分钟

# 读取配置信息（如果存在）
CONFIG_FILE="$SCRIPT_DIR/monitor_config.conf"
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
fi

# 记录日志函数
log() {
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo -e "${message}"
    echo "${message}" | sed 's/\x1b\[[0-9;]*m//g' >> "$LOG_FILE"
}

# 发送报警函数
send_alert() {
    local subject="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # 检查上次报警时间
    if [ -f "$ALERT_LOG" ]; then
        last_alert_time=$(tail -n 1 "$ALERT_LOG" | cut -d'|' -f1)
        last_alert_timestamp=$(date -d "$last_alert_time" +%s)
        current_timestamp=$(date +%s)
        
        # 如果距离上次报警不足指定间隔，跳过
        if [ $((current_timestamp - last_alert_timestamp)) -lt $ALERT_INTERVAL ]; then
            log "${YELLOW}报警被抑制: $subject${NC}"
            return
        fi
    fi
    
    # 记录报警
    echo "$timestamp|$subject|$message" >> "$ALERT_LOG"
    log "${RED}发送报警: $subject${NC}"
    
    # 根据您的需求实现具体的报警方式，例如：
    # 1. 发送邮件
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "【系统报警】$subject" root@localhost
    fi
    
    # 2. 写入系统日志
    if command -v logger &> /dev/null; then
        logger -p user.err -t "zdjy_monitor" "【系统报警】$subject: $message"
    fi
    
    # 3. 显示桌面通知（如果在有GUI的环境中）
    if command -v notify-send &> /dev/null; then
        notify-send -u critical "系统报警" "$subject\n$message"
    fi
}

# 检查磁盘空间
check_disk_space() {
    log "${BLUE}检查磁盘空间...${NC}"
    
    # 获取当前目录所在分区的使用率
    disk_usage=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$disk_usage" -ge "$DISK_THRESHOLD" ]; then
        send_alert "磁盘空间不足" "磁盘使用率已达 ${disk_usage}%, 超过阈值 ${DISK_THRESHOLD}%"
        return 1
    else
        log "${GREEN}磁盘空间正常: ${disk_usage}%${NC}"
        return 0
    fi
}

# 检查内存使用情况
check_memory() {
    log "${BLUE}检查内存使用情况...${NC}"
    
    # 获取内存使用率
    mem_total=$(free -m | awk 'NR==2 {print $2}')
    mem_used=$(free -m | awk 'NR==2 {print $3}')
    mem_usage=$((mem_used * 100 / mem_total))
    
    if [ "$mem_usage" -ge "$MEM_THRESHOLD" ]; then
        send_alert "内存使用率过高" "内存使用率已达 ${mem_usage}%, 超过阈值 ${MEM_THRESHOLD}%"
        return 1
    else
        log "${GREEN}内存使用正常: ${mem_usage}%${NC}"
        return 0
    fi
}

# 检查CPU使用情况
check_cpu() {
    log "${BLUE}检查CPU使用情况...${NC}"
    
    # 获取CPU使用率
    if command -v mpstat &> /dev/null; then
        cpu_idle=$(mpstat 1 1 | awk '$12 ~ /[0-9.]+/ {print 100-$12; exit}')
        cpu_usage=${cpu_idle%.*}
    else
        cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2+$4}')
        cpu_usage=${cpu_usage%.*}
    fi
    
    if [ "$cpu_usage" -ge "$CPU_THRESHOLD" ]; then
        send_alert "CPU使用率过高" "CPU使用率已达 ${cpu_usage}%, 超过阈值 ${CPU_THRESHOLD}%"
        return 1
    else
        log "${GREEN}CPU使用正常: ${cpu_usage}%${NC}"
        return 0
    fi
}

# 检查系统负载
check_load() {
    log "${BLUE}检查系统负载...${NC}"
    
    # 获取系统负载
    load=$(uptime | awk -F'[a-z]:' '{print $2}' | awk -F',' '{print $1}' | tr -d ' ')
    load_int=${load%.*}
    
    if (( $(echo "$load > $LOAD_THRESHOLD" | bc -l) )); then
        send_alert "系统负载过高" "系统负载已达 ${load}, 超过阈值 ${LOAD_THRESHOLD}"
        return 1
    else
        log "${GREEN}系统负载正常: ${load}${NC}"
        return 0
    fi
}

# 检查应用是否运行
check_app_running() {
    log "${BLUE}检查应用是否运行...${NC}"
    
    if pgrep -f "gunicorn.*app:app" > /dev/null; then
        log "${GREEN}应用运行正常${NC}"
        return 0
    else
        send_alert "应用未运行" "智能识别系统未运行，尝试重启"
        
        # 尝试重启应用
        if command -v supervisorctl &> /dev/null; then
            supervisorctl restart zdjy_app
            
            # 等待5秒检查是否启动成功
            sleep 5
            
            if pgrep -f "gunicorn.*app:app" > /dev/null; then
                send_alert "应用重启成功" "智能识别系统已成功重启"
                return 0
            else
                send_alert "应用重启失败" "智能识别系统重启失败，请手动检查"
                return 1
            fi
        else
            send_alert "无法重启应用" "未找到supervisorctl，无法自动重启应用"
            return 1
        fi
    fi
}

# 检查数据库连接
check_database() {
    log "${BLUE}检查数据库连接...${NC}"
    
    # 从config.py提取数据库配置
    DB_HOST=$(grep -oP "'host':\s*'\K[^']*" config.py)
    DB_USER=$(grep -oP "'user':\s*'\K[^']*" config.py)
    DB_PASS=$(grep -oP "'password':\s*'\K[^']*" config.py)
    DB_NAME=$(grep -oP "'database':\s*'\K[^']*" config.py)
    
    # 测试数据库连接
    if ! mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -e "USE $DB_NAME; SELECT 1;" &> /dev/null; then
        send_alert "数据库连接失败" "无法连接到数据库，请检查MySQL服务是否运行"
        return 1
    else
        log "${GREEN}数据库连接正常${NC}"
        return 0
    fi
}

# 检查端口是否开放
check_port() {
    local port=8888  # 默认端口
    log "${BLUE}检查端口 $port 是否开放...${NC}"
    
    # 从gunicorn_config.py提取端口配置
    if [ -f "gunicorn_config.py" ]; then
        custom_port=$(grep -oP 'bind\s*=\s*"[^:]+:\K\d+' gunicorn_config.py)
        if [ -n "$custom_port" ]; then
            port=$custom_port
        fi
    fi
    
    # 检查端口是否开放
    if nc -z localhost $port &>/dev/null; then
        log "${GREEN}端口 $port 开放正常${NC}"
        return 0
    else
        send_alert "端口未开放" "应用端口 $port 未开放，请检查应用是否正常运行"
        return 1
    fi
}

# 检查日志文件大小
check_log_files() {
    log "${BLUE}检查日志文件大小...${NC}"
    
    # 获取所有日志文件
    log_files=$(find "$SCRIPT_DIR/logs" -name "*.log" -type f)
    
    # 检查每个日志文件的大小
    for file in $log_files; do
        file_size=$(du -m "$file" | cut -f1)
        
        # 如果文件大于500MB，发送报警
        if [ "$file_size" -gt 500 ]; then
            log_name=$(basename "$file")
            send_alert "日志文件过大" "日志文件 $log_name 大小为 ${file_size}MB，建议清理"
        fi
    done
    
    return 0
}

# 运行所有检查
run_checks() {
    log "${BLUE}开始系统监控检查...${NC}"
    
    failed_checks=0
    
    check_disk_space || ((failed_checks++))
    check_memory || ((failed_checks++))
    check_cpu || ((failed_checks++))
    check_load || ((failed_checks++))
    check_app_running || ((failed_checks++))
    check_database || ((failed_checks++))
    check_port || ((failed_checks++))
    check_log_files
    
    if [ "$failed_checks" -gt 0 ]; then
        log "${RED}监控检查完成，有 $failed_checks 项检查失败${NC}"
    else
        log "${GREEN}监控检查完成，所有项目正常${NC}"
    fi
}

# 清理旧的监控日志
cleanup_logs() {
    # 保留最近30天的日志
    find "$SCRIPT_DIR/logs" -name "monitor*.log*" -type f -mtime +30 -delete
    find "$SCRIPT_DIR/logs" -name "alerts*.log*" -type f -mtime +30 -delete
}

# 主函数
main() {
    # 显示开始信息
    log "${GREEN}======= 智能识别系统监控开始 =======${NC}"
    
    # 运行监控检查
    run_checks
    
    # 清理旧日志
    cleanup_logs
    
    # 显示结束信息
    log "${GREEN}======= 智能识别系统监控结束 =======${NC}"
}

# 执行主函数
main 