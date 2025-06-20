@echo off
setlocal enabledelayedexpansion

:: 数据库连接池监控脚本 (Windows版本)
:: 用于监控和修复数据库连接池维护线程的脚本

:: 设置脚本目录
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

:: 设置日志目录和文件
set "LOG_DIR=%SCRIPT_DIR%logs"
set "LOG_FILE=%LOG_DIR%\db_monitor.log"

:: 应用日志文件路径
set "APP_LOG=%SCRIPT_DIR%app.log"

:: 维护状态：0=正常，1=维护超时，2=应用未运行
set MAINTENANCE_STATUS=0

:: 确保日志目录存在
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

:: 日志函数
:log
set "log_level=%~1"
set "message=%~2"
set "timestamp=%date% %time%"
echo [%timestamp%] [%log_level%] %message% >> "%LOG_FILE%"

:: 在严重错误时也输出到控制台
if "%log_level%"=="ERROR" (
    echo [%timestamp%] [%log_level%] %message%
)
goto :EOF

:: 检查应用是否运行
:check_app_running
for /f %%i in ('tasklist /fi "imagename eq python.exe" /fi "windowtitle eq *app.py*" /nh ^| find /c "python.exe"') do set app_count=%%i

if %app_count% EQU 0 (
    call :log "WARNING" "应用未运行，需要启动应用"
    set MAINTENANCE_STATUS=2
    exit /b 1
)

exit /b 0

:: 检查数据库连接池维护线程
:check_maintenance
if not exist "%APP_LOG%" (
    call :log "WARNING" "应用日志文件不存在: %APP_LOG%"
    exit /b 1
)

:: 获取最后一条维护日志的时间
findstr "执行定期数据库连接池维护" "%APP_LOG%" > "%TEMP%\last_maintenance.txt"
for /f "delims=" %%a in ('type "%TEMP%\last_maintenance.txt" ^| find /v "" /n ^| find "[" ^| tail -1') do (
    set "last_maintenance=%%a"
)

if "%last_maintenance%"=="" (
    call :log "WARNING" "找不到数据库连接池维护日志记录"
    set MAINTENANCE_STATUS=1
    exit /b 1
)

:: 提取日志中的时间戳 (这里需要适应Windows日志格式)
for /f "tokens=1,2 delims=[]" %%a in ("!last_maintenance!") do (
    set "maintenance_timestamp=%%b"
)

:: 计算时间差 (Windows批处理无法直接计算时间戳差异，使用PowerShell)
powershell -Command "$timestamp = '%maintenance_timestamp%'; if($timestamp -match '(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})') { $logDate = [datetime]::ParseExact($matches[1], 'yyyy-MM-dd HH:mm:ss', [System.Globalization.CultureInfo]::InvariantCulture); $now = Get-Date; $diff = $now - $logDate; Write-Host $diff.TotalSeconds }" > "%TEMP%\time_diff.txt"
set /p time_diff=<"%TEMP%\time_diff.txt"

:: 如果超过2小时未执行维护
set /a two_hours=7200
if %time_diff% GTR %two_hours% (
    call :log "WARNING" "数据库连接池维护超过2小时未执行，上次执行时间: %maintenance_timestamp%"
    set MAINTENANCE_STATUS=1
    exit /b 1
)

call :log "INFO" "数据库连接池维护正常，上次执行时间: %maintenance_timestamp%"
exit /b 0

:: 强制重置数据库连接池
:force_reset_pool
call :log "INFO" "尝试强制重置数据库连接池..."

set "reset_script=%SCRIPT_DIR%reset_db_pool.py"

:: 检查重置脚本是否存在，不存在则创建
if not exist "%reset_script%" (
    call :log "INFO" "创建数据库连接池重置脚本: %reset_script%"
    (
        echo #!/usr/bin/env python
        echo # -*- coding: utf-8 -*-
        echo.
        echo """
        echo 数据库连接池重置脚本
        echo 用于强制重置数据库连接池
        echo """
        echo.
        echo import sys
        echo import os
        echo import logging
        echo import importlib.util
        echo import traceback
        echo.
        echo # 配置日志
        echo log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__^)^), "logs"^)
        echo if not os.path.exists(log_dir^):
        echo     os.makedirs(log_dir^)
        echo.
        echo logging.basicConfig(
        echo     filename=os.path.join(log_dir, "db_reset.log"^),
        echo     level=logging.INFO,
        echo     format='%%(asctime^)s - %%(name^)s - %%(levelname^)s - %%(message^)s'
        echo ^)
        echo.
        echo try:
        echo     # 尝试导入应用的数据库模块
        echo     sys.path.insert(0, os.path.dirname(os.path.abspath(__file__^)^)^)
        echo     
        echo     # 尝试不同的可能模块路径
        echo     possible_modules = [
        echo         "app.database", 
        echo         "database", 
        echo         "app.db", 
        echo         "db",
        echo         "app.core.database",
        echo         "core.database"
        echo     ]
        echo     
        echo     db_module = None
        echo     for module_name in possible_modules:
        echo         try:
        echo             db_module = importlib.import_module(module_name^)
        echo             logging.info(f"成功导入数据库模块: {module_name}"^)
        echo             break
        echo         except ImportError:
        echo             continue
        echo     
        echo     if db_module is None:
        echo         logging.error("无法找到数据库模块"^)
        echo         sys.exit(1^)
        echo     
        echo     # 尝试重置连接池
        echo     if hasattr(db_module, "reset_pool"^):
        echo         db_module.reset_pool(^)
        echo         logging.info("已重置数据库连接池"^)
        echo     elif hasattr(db_module, "engine"^):
        echo         if hasattr(db_module.engine, "dispose"^):
        echo             db_module.engine.dispose(^)
        echo             logging.info("已重置数据库引擎连接池"^)
        echo         else:
        echo             logging.error("数据库引擎没有dispose方法"^)
        echo     else:
        echo         logging.error("找不到数据库连接池或重置方法"^)
        echo         sys.exit(1^)
        echo     
        echo     print("数据库连接池重置成功"^)
        echo     sys.exit(0^)
        echo except Exception as e:
        echo     logging.error(f"重置数据库连接池时出错: {str(e^)}"^)
        echo     logging.error(traceback.format_exc(^)^)
        echo     print(f"错误: {str(e^)}"^)
        echo     sys.exit(1^)
    ) > "%reset_script%"
)

:: 检查是否有虚拟环境
if exist "%SCRIPT_DIR%venv\Scripts\activate.bat" (
    call "%SCRIPT_DIR%venv\Scripts\activate.bat"
    call :log "INFO" "已激活Python虚拟环境"
)

:: 执行重置脚本
python "%reset_script%" > "%TEMP%\reset_output.txt" 2>&1
set reset_result=%errorlevel%

if %reset_result% EQU 0 (
    type "%TEMP%\reset_output.txt" > nul
    call :log "INFO" "数据库连接池重置成功"
    exit /b 0
) else (
    type "%TEMP%\reset_output.txt" > nul
    call :log "ERROR" "数据库连接池重置失败"
    exit /b 1
)

:: 重启应用
:restart_app
call :log "INFO" "尝试重启应用..."

:: 检查是否有启动脚本
if exist "%SCRIPT_DIR%start.bat" (
    call :log "INFO" "使用start.bat重启应用"
    start /B cmd /c call "%SCRIPT_DIR%start.bat" > nul 2>&1
    
    :: 等待应用启动
    timeout /t 5 > nul
    call :check_app_running
    if %errorlevel% EQU 0 (
        call :log "INFO" "应用已成功重启"
        exit /b 0
    ) else (
        call :log "ERROR" "使用start.bat重启应用失败"
    )
)

:: 如果没有启动脚本或启动脚本失败，尝试直接启动应用
call :log "INFO" "尝试直接启动应用"

:: 检查是否有虚拟环境
if exist "%SCRIPT_DIR%venv\Scripts\activate.bat" (
    call "%SCRIPT_DIR%venv\Scripts\activate.bat"
    call :log "INFO" "已激活Python虚拟环境"
)

:: 启动应用
cd /d "%SCRIPT_DIR%"
start /B cmd /c python app.py > nul 2>&1

:: 等待应用启动
timeout /t 5 > nul
call :check_app_running
if %errorlevel% EQU 0 (
    call :log "INFO" "应用已成功启动"
    exit /b 0
) else (
    call :log "ERROR" "直接启动应用失败"
    exit /b 1
)

:: 清理旧日志
:cleanup_logs
call :log "INFO" "清理7天前的旧日志文件"
forfiles /p "%LOG_DIR%" /s /m *.log /d -7 /c "cmd /c del @path" 2>nul
exit /b 0

:: 主函数
:main
call :log "INFO" "开始监控数据库连接池维护线程"

:: 检查应用是否运行
call :check_app_running

:: 如果应用正在运行，检查维护线程
if %MAINTENANCE_STATUS% EQU 0 (
    call :check_maintenance
)

:: 根据状态执行操作
if %MAINTENANCE_STATUS% EQU 0 (
    call :log "INFO" "数据库连接池维护正常，无需操作"
) else if %MAINTENANCE_STATUS% EQU 1 (
    call :log "WARNING" "尝试强制重置数据库连接池"
    call :force_reset_pool
    if %errorlevel% NEQ 0 (
        call :log "ERROR" "重置数据库连接池失败，尝试重启应用"
        call :restart_app
    )
) else if %MAINTENANCE_STATUS% EQU 2 (
    call :log "WARNING" "尝试重启应用"
    call :restart_app
) else (
    call :log "ERROR" "未知的维护状态: %MAINTENANCE_STATUS%"
)

:: 清理旧日志
call :cleanup_logs

call :log "INFO" "数据库连接池监控完成"
exit /b 0

:: 执行主函数
call :main
endlocal 