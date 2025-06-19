#!/bin/bash
# Docker 快速操作脚本

# 确保在项目根目录
cd "$(dirname "$0")"

# 显示帮助信息
show_help() {
    echo "智能识别系统 Docker 快速操作脚本"
    echo ""
    echo "用法: ./docker.sh [命令]"
    echo ""
    echo "可用命令:"
    echo "  start      启动所有服务"
    echo "  stop       停止所有服务"
    echo "  restart    重启所有服务"
    echo "  status     查看服务状态"
    echo "  logs       查看应用日志"
    echo "  build      重新构建镜像"
    echo "  help       显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  ./docker.sh start"
}

# 检查Docker和Docker Compose是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo "错误: Docker未安装。请先安装Docker: https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        if ! docker compose version &> /dev/null; then
            echo "错误: Docker Compose未安装。请先安装Docker Compose: https://docs.docker.com/compose/install/"
            exit 1
        fi
    fi
}

# 启动服务
start_services() {
    echo "启动所有服务..."
    cd docker && docker-compose up -d
    echo "服务已启动, 访问 http://localhost:8888"
}

# 停止服务
stop_services() {
    echo "停止所有服务..."
    cd docker && docker-compose down
    echo "服务已停止"
}

# 重启服务
restart_services() {
    echo "重启所有服务..."
    cd docker && docker-compose restart
    echo "服务已重启"
}

# 查看服务状态
check_status() {
    echo "服务状态:"
    cd docker && docker-compose ps
}

# 查看日志
view_logs() {
    echo "应用日志:"
    cd docker && docker-compose logs -f app
}

# 构建镜像
build_images() {
    echo "构建Docker镜像..."
    cd docker && docker-compose build --no-cache
    echo "镜像构建完成"
}

# 主函数
main() {
    check_docker
    
    case "$1" in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        status)
            check_status
            ;;
        logs)
            view_logs
            ;;
        build)
            build_images
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@" 