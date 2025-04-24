#!/bin/bash
#
# 智能识别系统自动化安装脚本
# 用于新的Linux服务器环境准备和安装
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
LOG_FILE="$SCRIPT_DIR/install.log"

# 创建日志函数
log() {
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo -e "${message}"
    echo "${message}" | sed 's/\x1b\[[0-9;]*m//g' >> "$LOG_FILE"
}

# 检查是否以root权限运行
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log "${RED}此脚本需要以root权限运行.${NC}"
        log "${YELLOW}请使用sudo或切换到root用户后重试.${NC}"
        exit 1
    fi
}

# 检测系统类型
detect_os() {
    log "${BLUE}检测操作系统...${NC}"
    
    if [ -f /etc/os-release ]; then
        # freedesktop.org and systemd
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    elif type lsb_release >/dev/null 2>&1; then
        # linuxbase.org
        OS=$(lsb_release -si)
        VER=$(lsb_release -sr)
    elif [ -f /etc/lsb-release ]; then
        # For some versions of Debian/Ubuntu without lsb_release command
        . /etc/lsb-release
        OS=$DISTRIB_ID
        VER=$DISTRIB_RELEASE
    elif [ -f /etc/debian_version ]; then
        # Older Debian/Ubuntu/etc.
        OS=Debian
        VER=$(cat /etc/debian_version)
    else
        # Fall back to uname, e.g. "Linux <version>", also works for BSD, etc.
        OS=$(uname -s)
        VER=$(uname -r)
    fi
    
    log "${GREEN}检测到操作系统: $OS $VER${NC}"
}

# 更新系统并安装依赖
install_dependencies() {
    log "${BLUE}更新系统并安装依赖...${NC}"
    
    case "$OS" in
        *Ubuntu*|*Debian*)
            apt update
            # 添加MySQL的官方APT仓库
            apt install -y gnupg
            wget -c https://dev.mysql.com/get/mysql-apt-config_0.8.24-1_all.deb
            DEBIAN_FRONTEND=noninteractive dpkg -i mysql-apt-config_0.8.24-1_all.deb
            apt update
            
            # 安装系统依赖
            DEBIAN_FRONTEND=noninteractive apt install -y \
            python3 python3-venv python3-dev \
            mysql-server \
            supervisor \
            nginx \
            build-essential \
            libmysqlclient-dev \
            curl wget vim git \
            logrotate \
            unzip \
            libgl1-mesa-glx \
            sysstat \
            netcat \
            bc
            ;;
            
        *CentOS*|*Red*|*Fedora*|*Amazon*)
            yum update -y
            # 添加MySQL仓库
            rpm -Uvh https://dev.mysql.com/get/mysql80-community-release-el7-3.noarch.rpm
            yum install -y epel-release
            
            # 安装系统依赖
            yum install -y \
            python3 python3-devel \
            mysql-community-server \
            supervisor \
            nginx \
            gcc gcc-c++ make \
            mysql-devel \
            curl wget vim git \
            logrotate \
            unzip \
            mesa-libGL \
            sysstat \
            nc \
            bc
            ;;
            
        *)
            log "${RED}不支持的操作系统: $OS${NC}"
            log "${YELLOW}请手动安装以下依赖:${NC}"
            log "${YELLOW}- Python 3.8+ 及 venv 模块${NC}"
            log "${YELLOW}- MySQL 8+${NC}"
            log "${YELLOW}- Supervisor${NC}"
            log "${YELLOW}- Nginx${NC}"
            log "${YELLOW}- Build tools (gcc, make, etc.)${NC}"
            log "${YELLOW}- MySQL development libraries${NC}"
            log "${YELLOW}- Git, curl, wget, vim${NC}"
            log "${YELLOW}- Logrotate${NC}"
            log "${YELLOW}- OpenCV dependencies (libgl1-mesa-glx or equivalent)${NC}"
            log "${YELLOW}- System statistics tools (sysstat)${NC}"
            log "${YELLOW}- Network tools (netcat)${NC}"
            return 1
            ;;
    esac
    
    # 检查依赖安装结果
    if [ $? -ne 0 ]; then
        log "${RED}依赖安装失败${NC}"
        return 1
    fi
    
    log "${GREEN}依赖安装成功${NC}"
    return 0
}

# 配置MySQL
configure_mysql() {
    log "${BLUE}配置MySQL...${NC}"
    
    # 启动MySQL服务
    case "$OS" in
        *Ubuntu*|*Debian*)
            systemctl enable mysql
            systemctl start mysql
            ;;
        *CentOS*|*Red*|*Fedora*|*Amazon*)
            systemctl enable mysqld
            systemctl start mysqld
            ;;
        *)
            log "${YELLOW}请手动启动MySQL服务${NC}"
            ;;
    esac
    
    # 检查MySQL是否正常运行
    if ! systemctl is-active --quiet mysql && ! systemctl is-active --quiet mysqld; then
        log "${RED}MySQL服务启动失败${NC}"
        return 1
    fi
    
    # 从config.py提取MySQL配置
    DB_HOST=$(grep -oP "'host':\s*'\K[^']*" config.py)
    DB_USER=$(grep -oP "'user':\s*'\K[^']*" config.py)
    DB_PASS=$(grep -oP "'password':\s*'\K[^']*" config.py)
    DB_NAME=$(grep -oP "'database':\s*'\K[^']*" config.py)
    
    # CentOS默认生成随机密码，需要先获取它
    if [[ "$OS" == *CentOS* || "$OS" == *Red* || "$OS" == *Fedora* || "$OS" == *Amazon* ]]; then
        log "${YELLOW}CentOS/RHEL/Fedora系统需要先重置MySQL root密码${NC}"
        TEMP_PASS=$(grep 'temporary password' /var/log/mysqld.log | awk '{print $NF}')
        if [ -n "$TEMP_PASS" ]; then
            log "${YELLOW}检测到MySQL临时密码: $TEMP_PASS${NC}"
            log "${YELLOW}请使用此密码手动登录MySQL并更改密码${NC}"
            log "${YELLOW}命令: mysql -u root -p${NC}"
            log "${YELLOW}然后执行: ALTER USER 'root'@'localhost' IDENTIFIED BY '$DB_PASS';${NC}"
            return 0
        fi
    fi
    
    # 尝试使用root账户不带密码登录
    if mysql -u root -e "SELECT 1" &>/dev/null; then
        # 创建数据库和用户
        mysql -u root << EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DB_USER'@'$DB_HOST' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'$DB_HOST';
ALTER USER 'root'@'localhost' IDENTIFIED BY '$DB_PASS';
FLUSH PRIVILEGES;
EOF
        if [ $? -eq 0 ]; then
            log "${GREEN}MySQL数据库和用户创建成功${NC}"
        else
            log "${RED}MySQL数据库和用户创建失败${NC}"
            return 1
        fi
    else
        log "${YELLOW}无法自动配置MySQL，请手动执行以下操作:${NC}"
        log "${YELLOW}1. 登录MySQL${NC}"
        log "${YELLOW}2. 创建数据库: CREATE DATABASE IF NOT EXISTS $DB_NAME DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;${NC}"
        log "${YELLOW}3. 创建用户: CREATE USER IF NOT EXISTS '$DB_USER'@'$DB_HOST' IDENTIFIED BY '$DB_PASS';${NC}"
        log "${YELLOW}4. 授权: GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'$DB_HOST';${NC}"
        log "${YELLOW}5. 刷新权限: FLUSH PRIVILEGES;${NC}"
    fi
    
    # 导入数据库结构
    if [ -f "tiaozhanbei2025、4、11.sql" ]; then
        log "${BLUE}导入数据库结构...${NC}"
        if mysql -u "$DB_USER" -p"$DB_PASS" "$DB_NAME" < "tiaozhanbei2025、4、11.sql"; then
            log "${GREEN}数据库结构导入成功${NC}"
        else
            log "${RED}数据库结构导入失败${NC}"
            log "${YELLOW}请手动导入数据库结构: mysql -u $DB_USER -p $DB_NAME < tiaozhanbei2025、4、11.sql${NC}"
        fi
    else
        log "${YELLOW}未找到数据库结构文件，请手动导入数据${NC}"
    fi
    
    return 0
}

# 配置Nginx
configure_nginx() {
    log "${BLUE}配置Nginx...${NC}"
    
    # 创建Nginx配置文件
    cat > /etc/nginx/conf.d/zdjy.conf << EOF
server {
    listen 80;
    server_name _;

    client_max_body_size 16M;
    
    location / {
        proxy_pass http://127.0.0.1:8888;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /static/ {
        alias $SCRIPT_DIR/static/;
        expires 30d;
    }
}
EOF

    # 测试Nginx配置
    nginx -t
    if [ $? -ne 0 ]; then
        log "${RED}Nginx配置验证失败${NC}"
        return 1
    fi
    
    # 启用和启动Nginx
    systemctl enable nginx
    systemctl restart nginx
    
    if ! systemctl is-active --quiet nginx; then
        log "${RED}Nginx启动失败${NC}"
        return 1
    fi
    
    log "${GREEN}Nginx配置成功${NC}"
    return 0
}

# 配置Supervisor
configure_supervisor() {
    log "${BLUE}配置Supervisor...${NC}"
    
    # 创建Supervisor配置文件
    cat > /etc/supervisor/conf.d/zdjy.conf << EOF
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

    # 如果Supervisor目录不存在，尝试CentOS路径
    if [ ! -d "/etc/supervisor/conf.d" ]; then
        mkdir -p /etc/supervisord.d/
        mv /etc/supervisor/conf.d/zdjy.conf /etc/supervisord.d/zdjy.ini
        
        # 对于CentOS/RHEL系统
        systemctl enable supervisord
        systemctl restart supervisord
    else
        # 对于Debian/Ubuntu系统
        systemctl enable supervisor
        systemctl restart supervisor
    fi
    
    log "${GREEN}Supervisor配置完成${NC}"
    
    return 0
}

# 配置Logrotate
configure_logrotate() {
    log "${BLUE}配置Logrotate...${NC}"
    
    # 创建Logrotate配置
    cat > /etc/logrotate.d/zdjy << EOF
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
    
    log "${GREEN}Logrotate配置完成${NC}"
    return 0
}

# 设置虚拟环境和安装Python依赖
setup_python_env() {
    log "${BLUE}设置Python虚拟环境...${NC}"
    
    # 创建虚拟环境
    python3 -m venv "$SCRIPT_DIR/venv"
    
    # 激活虚拟环境
    source "$SCRIPT_DIR/venv/bin/activate"
    
    # 安装pip和wheel
    pip install --upgrade pip wheel
    
    # 安装项目依赖
    pip install -r requirements.txt
    
    # 安装部署工具
    pip install gunicorn
    
    if [ $? -ne 0 ]; then
        log "${RED}Python依赖安装失败${NC}"
        return 1
    fi
    
    log "${GREEN}Python虚拟环境设置完成${NC}"
    return 0
}

# 设置目录权限
setup_permissions() {
    log "${BLUE}设置目录权限...${NC}"
    
    # 创建必要的目录
    mkdir -p "$SCRIPT_DIR/logs"
    mkdir -p "$SCRIPT_DIR/static/uploads"
    mkdir -p "$SCRIPT_DIR/static/@results"
    mkdir -p "$SCRIPT_DIR/tmp"
    mkdir -p "$SCRIPT_DIR/sessions"
    mkdir -p "$SCRIPT_DIR/backups"
    
    # 设置权限
    chmod -R 755 "$SCRIPT_DIR"
    chmod -R 777 "$SCRIPT_DIR/static/uploads"
    chmod -R 777 "$SCRIPT_DIR/static/@results"
    chmod -R 777 "$SCRIPT_DIR/logs"
    chmod -R 777 "$SCRIPT_DIR/tmp"
    chmod -R 777 "$SCRIPT_DIR/sessions"
    chmod -R 777 "$SCRIPT_DIR/backups"
    
    # 设置授权给当前用户
    chown -R $(whoami):$(whoami) "$SCRIPT_DIR"
    
    # 设置shell脚本的执行权限
    chmod +x "$SCRIPT_DIR/deploy.sh"
    chmod +x "$SCRIPT_DIR/monitor.sh"
    chmod +x "$SCRIPT_DIR/crontab_setup.sh"
    
    log "${GREEN}目录权限设置完成${NC}"
    return 0
}

# 设置定时任务
setup_cron_jobs() {
    log "${BLUE}设置定时任务...${NC}"
    
    # 执行crontab设置脚本
    if [ -f "$SCRIPT_DIR/crontab_setup.sh" ]; then
        bash "$SCRIPT_DIR/crontab_setup.sh"
    else
        log "${RED}未找到crontab设置脚本${NC}"
        return 1
    fi
    
    log "${GREEN}定时任务设置完成${NC}"
    return 0
}

# 启动应用
start_application() {
    log "${BLUE}启动应用...${NC}"
    
    # 使用Supervisor启动应用
    if command -v supervisorctl &> /dev/null; then
        supervisorctl reread
        supervisorctl update
        supervisorctl restart zdjy_app
        
        # 检查应用是否成功启动
        sleep 5
        if supervisorctl status zdjy_app | grep -q "RUNNING"; then
            log "${GREEN}应用启动成功${NC}"
        else
            log "${RED}应用启动失败，请检查日志${NC}"
            supervisorctl status zdjy_app
            return 1
        fi
    else
        log "${RED}未找到supervisorctl命令，无法启动应用${NC}"
        log "${YELLOW}请手动启动应用: gunicorn -c gunicorn_config.py app:app${NC}"
        return 1
    fi
    
    return 0
}

# 显示安装总结
display_summary() {
    log "${GREEN}====================${NC}"
    log "${GREEN}智能识别系统安装完成${NC}"
    log "${GREEN}====================${NC}"
    
    # 获取服务器IP地址
    SERVER_IP=$(hostname -I | awk '{print $1}')
    
    log "${BLUE}系统信息:${NC}"
    log "- 操作系统: $OS $VER"
    log "- 服务器IP: $SERVER_IP"
    log "- 应用目录: $SCRIPT_DIR"
    
    log "${BLUE}服务访问:${NC}"
    log "- Web访问地址: http://$SERVER_IP/"
    log "- 后台管理: http://$SERVER_IP/admin"
    
    log "${BLUE}维护命令:${NC}"
    log "- 检查状态: supervisorctl status zdjy_app"
    log "- 重启应用: supervisorctl restart zdjy_app"
    log "- 查看日志: tail -f $SCRIPT_DIR/logs/supervisor_stdout.log"
    log "- 运行维护脚本: bash $SCRIPT_DIR/deploy.sh"
    log "- 备份数据库: bash $SCRIPT_DIR/deploy.sh backup"
    
    log "${GREEN}安装日志已保存到: $LOG_FILE${NC}"
}

# 主函数
main() {
    log "${GREEN}======= 智能识别系统安装开始 =======${NC}"
    
    # 检查是否以root权限运行
    check_root
    
    # 检测操作系统
    detect_os
    
    # 安装系统依赖
    install_dependencies || { log "${RED}依赖安装失败，终止安装${NC}"; exit 1; }
    
    # 配置MySQL
    configure_mysql || log "${YELLOW}MySQL配置有问题，可能需要手动配置${NC}"
    
    # 设置Python环境
    setup_python_env || { log "${RED}Python环境设置失败，终止安装${NC}"; exit 1; }
    
    # 设置目录权限
    setup_permissions
    
    # 配置Nginx
    configure_nginx || log "${YELLOW}Nginx配置失败，可能需要手动配置${NC}"
    
    # 配置Supervisor
    configure_supervisor || log "${YELLOW}Supervisor配置失败，可能需要手动配置${NC}"
    
    # 配置Logrotate
    configure_logrotate
    
    # 设置定时任务
    setup_cron_jobs || log "${YELLOW}定时任务设置失败，可能需要手动配置${NC}"
    
    # 启动应用
    start_application || log "${YELLOW}应用启动失败，请手动启动${NC}"
    
    # 显示安装总结
    display_summary
    
    log "${GREEN}======= 智能识别系统安装结束 =======${NC}"
}

# 执行主函数
main 