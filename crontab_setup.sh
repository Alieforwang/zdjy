#!/bin/bash
#
# 智能识别系统定时任务设置脚本
# 用于配置系统维护和监控的定时任务
#

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# 定义颜色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # 无颜色

# 创建临时文件
TEMP_CRON=$(mktemp)

# 导出当前的crontab配置
crontab -l > "$TEMP_CRON" 2>/dev/null || echo "# 智能识别系统定时任务" > "$TEMP_CRON"

# 添加定时任务（如果不存在）
add_cron_job() {
    local job="$1"
    local comment="$2"
    
    # 检查任务是否已存在
    if ! grep -F "$job" "$TEMP_CRON" &>/dev/null; then
        echo "" >> "$TEMP_CRON"
        echo "# $comment" >> "$TEMP_CRON"
        echo "$job" >> "$TEMP_CRON"
        echo -e "${GREEN}已添加定时任务: ${comment}${NC}"
    else
        echo -e "${YELLOW}定时任务已存在: ${comment}${NC}"
    fi
}

# 每天凌晨2点执行数据库备份
add_cron_job "0 2 * * * $SCRIPT_DIR/deploy.sh backup > $SCRIPT_DIR/logs/backup.log 2>&1" "每天凌晨2点备份数据库"

# 每天凌晨3点清理旧文件
add_cron_job "0 3 * * * $SCRIPT_DIR/deploy.sh cleanup > $SCRIPT_DIR/logs/cleanup.log 2>&1" "每天凌晨3点清理旧文件"

# 每小时检查系统健康状态
add_cron_job "0 * * * * $SCRIPT_DIR/deploy.sh check > $SCRIPT_DIR/logs/health_check.log 2>&1" "每小时检查系统健康状态"

# 每周日凌晨1点重启应用
add_cron_job "0 1 * * 0 supervisorctl restart zdjy_app > $SCRIPT_DIR/logs/restart.log 2>&1" "每周日凌晨1点重启应用"

# 每天8次记录系统资源使用情况
add_cron_job "0 */3 * * * top -b -n 1 | head -n 20 >> $SCRIPT_DIR/logs/system_stats.log 2>&1" "每3小时记录系统资源使用情况"

# 每5分钟检查应用是否运行
add_cron_job "*/5 * * * * if ! pgrep -f \"gunicorn.*app:app\" > /dev/null; then supervisorctl start zdjy_app; fi" "每5分钟检查应用是否运行"

# 应用新的crontab配置
if crontab "$TEMP_CRON"; then
    echo -e "${GREEN}定时任务设置成功!${NC}"
else
    echo -e "${RED}定时任务设置失败!${NC}"
    exit 1
fi

# 显示当前的crontab配置
echo -e "${BLUE}当前的定时任务配置:${NC}"
crontab -l

# 清理临时文件
rm -f "$TEMP_CRON"

echo -e "${GREEN}定时任务设置完成!${NC}"
echo -e "${YELLOW}提示: 请确保deploy.sh脚本有执行权限${NC}"
echo -e "${YELLOW}可以使用以下命令赋予执行权限: chmod +x $SCRIPT_DIR/deploy.sh${NC}" 