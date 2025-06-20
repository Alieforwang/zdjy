@echo off
REM Docker 快速操作脚本 - Windows版本

SETLOCAL

REM 显示帮助信息
:show_help
IF "%1"=="" (
    ECHO 灵瞳YOLOv8-DeepSeek多模态街景治理实时检测平台Docker 快速操作脚本
    ECHO.
    ECHO 用法: docker.bat [命令]
    ECHO.
    ECHO 可用命令:
    ECHO   start      启动所有服务
    ECHO   stop       停止所有服务
    ECHO   restart    重启所有服务
    ECHO   status     查看服务状态
    ECHO   logs       查看应用日志
    ECHO   build      重新构建镜像
    ECHO   help       显示此帮助信息
    ECHO.
    ECHO 示例:
    ECHO   docker.bat start
    EXIT /B 1
)

REM 检查Docker和Docker Compose是否安装
:check_docker
WHERE docker >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    ECHO 错误: Docker未安装。请先安装Docker: https://docs.docker.com/get-docker/
    EXIT /B 1
)

REM 检查docker-compose或新版docker compose命令
WHERE docker-compose >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    docker compose version >nul 2>&1
    IF %ERRORLEVEL% NEQ 0 (
        ECHO 错误: Docker Compose未安装。请先安装Docker Compose: https://docs.docker.com/compose/install/
        EXIT /B 1
    )
)

REM 处理命令
IF "%1"=="start" GOTO start_services
IF "%1"=="stop" GOTO stop_services
IF "%1"=="restart" GOTO restart_services
IF "%1"=="status" GOTO check_status
IF "%1"=="logs" GOTO view_logs
IF "%1"=="build" GOTO build_images
IF "%1"=="help" GOTO show_help
IF "%1"=="--help" GOTO show_help
IF "%1"=="-h" GOTO show_help

ECHO 未知命令: %1
GOTO show_help

REM 启动服务
:start_services
ECHO 启动所有服务...
cd docker && docker-compose up -d
ECHO 服务已启动, 访问 http://localhost:8888
GOTO end

REM 停止服务
:stop_services
ECHO 停止所有服务...
cd docker && docker-compose down
ECHO 服务已停止
GOTO end

REM 重启服务
:restart_services
ECHO 重启所有服务...
cd docker && docker-compose restart
ECHO 服务已重启
GOTO end

REM 查看服务状态
:check_status
ECHO 服务状态:
cd docker && docker-compose ps
GOTO end

REM 查看日志
:view_logs
ECHO 应用日志:
cd docker && docker-compose logs -f app
GOTO end

REM 构建镜像
:build_images
ECHO 构建Docker镜像...
cd docker && docker-compose build --no-cache
ECHO 镜像构建完成
GOTO end

:end
ENDLOCAL 