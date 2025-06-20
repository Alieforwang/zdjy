#!/bin/bash
#
# 智能识别系统自动化部署与维护脚本
# 用于Linux环境下的部署、监控和维护
#

# 定义颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # 无颜色

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 定义日志文件
LOG_FILE="$SCRIPT_DIR/maintenance.log"
BACKUP_DIR="$SCRIPT_DIR/backups"
ENV_FILE="$SCRIPT_DIR/.env"
DEPLOY_LOCK="$SCRIPT_DIR/.deploy.lock"

# 创建必要的目录
mkdir -p logs backups tmp static/uploads static/@results

# 日志函数
log() {
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo -e "${message}"
    echo "${message}" | sed 's/\x1b\[[0-9;]*m//g' >> "$LOG_FILE"
}

# 检查系统依赖
check_dependencies() {
    log "${BLUE}检查系统依赖...${NC}"
    
    # 检查Python版本
    if ! command -v python3 &> /dev/null; then
        log "${RED}错误: 未找到Python3. 请安装Python3.${NC}"
        return 1
    fi
    
    python_version=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
    log "${GREEN}Python版本: $python_version${NC}"
    
    # 检查pip
    if ! command -v pip3 &> /dev/null; then
        log "${RED}错误: 未找到pip3. 请安装pip3.${NC}"
        return 1
    fi
    
    # 检查MySQL
    if ! command -v mysql &> /dev/null; then
        log "${YELLOW}警告: 未找到MySQL客户端. 请确保MySQL服务可用.${NC}"
    fi
    
    # 检查Supervisor
    if ! command -v supervisorctl &> /dev/null; then
        log "${YELLOW}警告: 未找到Supervisor. 建议安装Supervisor进行进程管理.${NC}"
    fi
    
    return 0
}

# 创建虚拟环境
setup_virtualenv() {
    log "${BLUE}设置虚拟环境...${NC}"
    
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        log "${GREEN}创建了新的虚拟环境${NC}"
    fi
    
    # 激活虚拟环境
    source venv/bin/activate
    
    # 安装/更新依赖
    pip3 install --upgrade pip
    pip3 install -r requirements.txt
    
    # 安装额外的部署依赖
    pip3 install gunicorn
    
    log "${GREEN}虚拟环境设置完成${NC}"
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
    if ! mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" -e "USE $DB_NAME;" &> /dev/null; then
        log "${RED}错误: 无法连接到数据库. 请检查数据库配置.${NC}"
        return 1
    fi
    
    log "${GREEN}数据库连接正常${NC}"
    return 0
}

# 备份数据库
backup_database() {
    log "${BLUE}备份数据库...${NC}"
    
    # 从config.py提取数据库配置
    DB_HOST=$(grep -oP "'host':\s*'\K[^']*" config.py)
    DB_USER=$(grep -oP "'user':\s*'\K[^']*" config.py)
    DB_PASS=$(grep -oP "'password':\s*'\K[^']*" config.py)
    DB_NAME=$(grep -oP "'database':\s*'\K[^']*" config.py)
    
    # 创建备份目录
    mkdir -p "$BACKUP_DIR"
    
    # 设置备份文件名
    BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_$(date +%Y%m%d_%H%M%S).sql"
    
    # 执行备份
    if ! mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" > "$BACKUP_FILE"; then
        log "${RED}错误: 数据库备份失败${NC}"
        return 1
    fi
    
    # 压缩备份
    gzip "$BACKUP_FILE"
    
    log "${GREEN}数据库备份成功: ${BACKUP_FILE}.gz${NC}"
    
    # 清理旧备份, 只保留最近10个
    find "$BACKUP_DIR" -name "*.sql.gz" -type f -printf "%T@ %p\n" | sort -n | head -n -10 | cut -d' ' -f2- | xargs -r rm
    
    return 0
}

# 创建或更新Supervisor配置
create_supervisor_config() {
    log "${BLUE}创建Supervisor配置...${NC}"
    
    # 检查Supervisor是否安装
    if ! command -v supervisorctl &> /dev/null; then
        log "${YELLOW}警告: 未找到Supervisor. 跳过创建配置.${NC}"
        return 1
    fi
    
    # 创建Supervisor配置文件
    cat > "$SCRIPT_DIR/supervisor.conf" << EOF
[program:zdjy_app]
directory=$SCRIPT_DIR
command=$SCRIPT_DIR/venv/bin/gunicorn -c gunicorn_config.py app:app
autostart=true
autorestart=true
startretries=5
user=$(whoami)
redirect_stderr=true
stdout_logfile=$SCRIPT_DIR/logs/supervisor_stdout.log
stderr_logfile=$SCRIPT_DIR/logs/supervisor_stderr.log
environment=PYTHONUNBUFFERED=1

[program:zdjy_cleanup]
directory=$SCRIPT_DIR
command=$SCRIPT_DIR/venv/bin/python3 -c "import time; from app import clean_old_files; while True: clean_old_files('static/uploads', 7); clean_old_files('static/@results', 7); time.sleep(86400);"
autostart=true
autorestart=true
startretries=3
user=$(whoami)
redirect_stderr=true
stdout_logfile=$SCRIPT_DIR/logs/cleanup_stdout.log
stderr_logfile=$SCRIPT_DIR/logs/cleanup_stderr.log
environment=PYTHONUNBUFFERED=1
EOF
    
    log "${GREEN}Supervisor配置已创建: $SCRIPT_DIR/supervisor.conf${NC}"
    log "${YELLOW}请手动将此配置链接或复制到Supervisor配置目录, 然后重新加载Supervisor${NC}"
    log "${YELLOW}例如: sudo ln -sf $SCRIPT_DIR/supervisor.conf /etc/supervisor/conf.d/zdjy.conf${NC}"
    log "${YELLOW}然后: sudo supervisorctl reread${NC}"
    log "${YELLOW}最后: sudo supervisorctl update${NC}"
    
    return 0
}

# 日志轮转配置
setup_logrotate() {
    log "${BLUE}设置日志轮转...${NC}"
    
    # 创建logrotate配置
    cat > "$SCRIPT_DIR/logrotate.conf" << EOF
$SCRIPT_DIR/logs/*.log $SCRIPT_DIR/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 $(whoami) $(whoami)
    sharedscripts
    postrotate
        [ -e $SCRIPT_DIR/gunicorn.pid ] && kill -USR1 \$(cat $SCRIPT_DIR/gunicorn.pid)
    endscript
}
EOF
    
    log "${GREEN}Logrotate配置已创建: $SCRIPT_DIR/logrotate.conf${NC}"
    log "${YELLOW}请手动将此配置链接或复制到logrotate配置目录${NC}"
    log "${YELLOW}例如: sudo ln -sf $SCRIPT_DIR/logrotate.conf /etc/logrotate.d/zdjy${NC}"
    
    return 0
}

# 清理临时文件和旧数据
cleanup_old_files() {
    log "${BLUE}清理临时文件和旧数据...${NC}"
    
    # 清理上传目录中超过7天的文件
    find "$SCRIPT_DIR/static/uploads" -type f -mtime +7 -delete
    
    # 清理结果目录中超过7天的文件
    find "$SCRIPT_DIR/static/@results" -type f -mtime +7 -delete
    
    # 清理临时目录
    find "$SCRIPT_DIR/tmp" -type f -mtime +1 -delete
    
    # 清理会话文件
    find "$SCRIPT_DIR/sessions" -type f -mtime +1 -delete
    
    # 清理日志文件
    find "$SCRIPT_DIR/logs" -name "*.log.*" -type f -mtime +30 -delete
    
    log "${GREEN}旧文件清理完成${NC}"
    return 0
}

# 系统健康检查
check_system_health() {
    log "${BLUE}系统健康检查...${NC}"
    
    # 检查磁盘空间
    disk_usage=$(df -h . | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -gt 85 ]; then
        log "${RED}警告: 磁盘空间使用率高: ${disk_usage}%${NC}"
    else
        log "${GREEN}磁盘空间正常: ${disk_usage}%${NC}"
    fi
    
    # 检查内存使用情况
    free_memory=$(free -m | awk 'NR==2 {print $4}')
    if [ "$free_memory" -lt 500 ]; then
        log "${RED}警告: 可用内存低: ${free_memory}MB${NC}"
    else
        log "${GREEN}内存使用正常: 可用${free_memory}MB${NC}"
    fi
    
    # 检查应用是否运行
    if pgrep -f "gunicorn.*app:app" > /dev/null; then
        log "${GREEN}应用运行正常${NC}"
    else
        log "${RED}警告: 应用未运行${NC}"
    fi
    
    # 检查数据库连接
    check_database
    
    return 0
}

# 部署应用
deploy_app() {
    log "${BLUE}开始部署应用...${NC}"
    
    # 检查部署锁
    if [ -f "$DEPLOY_LOCK" ]; then
        lock_time=$(cat "$DEPLOY_LOCK")
        current_time=$(date +%s)
        elapsed=$((current_time - lock_time))
        
        # 如果锁定时间不超过30分钟，则退出
        if [ "$elapsed" -lt 1800 ]; then
            log "${RED}另一个部署进程正在运行，已退出。${NC}"
            return 1
        else
            log "${YELLOW}检测到过期的部署锁，将继续部署流程。${NC}"
            rm -f "$DEPLOY_LOCK"
        fi
    fi
    
    # 创建部署锁
    date +%s > "$DEPLOY_LOCK"
    
    # 执行依赖检查
    check_dependencies || { rm -f "$DEPLOY_LOCK"; return 1; }
    
    # 创建备份
    backup_database || { rm -f "$DEPLOY_LOCK"; return 1; }
    
    # 设置虚拟环境并安装依赖
    setup_virtualenv || { rm -f "$DEPLOY_LOCK"; return 1; }
    
    # 更新Supervisor配置
    create_supervisor_config
    
    # 设置日志轮转
    setup_logrotate
    
    # 移除部署锁
    rm -f "$DEPLOY_LOCK"
    
    log "${GREEN}应用部署完成${NC}"
    log "${YELLOW}请使用以下命令重启应用:${NC}"
    log "${YELLOW}supervisorctl restart zdjy_app${NC}"
    
    return 0
}

# 显示帮助信息
show_help() {
    echo -e "${BLUE}智能识别系统自动化部署与维护脚本${NC}"
    echo
    echo "用法: $0 [选项]"
    echo
    echo "选项:"
    echo "  deploy         部署或更新应用"
    echo "  backup         备份数据库"
    echo "  check          检查系统健康状态"
    echo "  cleanup        清理旧文件和临时数据"
    echo "  logs           查看应用日志"
    echo "  help           显示此帮助信息"
    echo
}

# 主函数
main() {
    # 如果没有参数，显示帮助
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    
    # 处理命令行参数
    case "$1" in
        deploy)
            deploy_app
            ;;
        backup)
            backup_database
            ;;
        check)
            check_system_health
            ;;
        cleanup)
            cleanup_old_files
            ;;
        logs)
            if [ -f "$SCRIPT_DIR/error.log" ]; then
                tail -n 100 "$SCRIPT_DIR/error.log"
            else
                log "${RED}错误日志文件不存在${NC}"
            fi
            ;;
        help)
            show_help
            ;;
        *)
            echo -e "${RED}未知选项: $1${NC}"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@" 