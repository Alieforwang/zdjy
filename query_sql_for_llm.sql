-- 系统查询SQL语句集合
-- 用于大模型生成SQL和后续工作流数据库查询工具使用
-- 生成时间: 2024年

-- ========================================
-- 1. 数据库连接测试查询
-- ========================================
SELECT 1;

-- ========================================
-- 2. 用户信息查询
-- ========================================

-- 查询所有用户信息
SELECT id, username, is_admin, created_at 
FROM user 
ORDER BY id ASC;

-- 根据用户ID查询用户信息
SELECT id, username, is_admin, created_at 
FROM user 
WHERE id = %s;

-- 根据用户名查询用户信息
SELECT id, username, is_admin, created_at 
FROM user 
WHERE username = %s;

-- 用户登录验证查询
SELECT id, password, is_admin 
FROM user 
WHERE username = %s;

-- 检查用户名是否存在
SELECT * 
FROM user 
WHERE username = %s;

-- ========================================
-- 3. 分析记录查询
-- ========================================

-- 查询所有分析记录
SELECT id, user_id, file_type, file_path, result_path, result_folder, detect_type, location, confidence, created_at
FROM analysis_records
ORDER BY created_at DESC;

-- 根据用户ID查询分析记录
SELECT id, user_id, file_type, file_path, result_path, result_folder, detect_type, location, confidence, created_at
FROM analysis_records
WHERE user_id = %s
ORDER BY created_at DESC;

-- 根据检测类型查询分析记录
SELECT id, user_id, file_type, file_path, result_path, result_folder, detect_type, location, confidence, created_at
FROM analysis_records
WHERE detect_type = %s
ORDER BY created_at DESC;

-- 根据时间范围查询分析记录
SELECT id, user_id, file_type, file_path, result_path, result_folder, detect_type, location, confidence, created_at
FROM analysis_records
WHERE created_at BETWEEN %s AND %s
ORDER BY created_at DESC;

-- 查询用户的最新分析记录
SELECT id, user_id, file_type, file_path, result_path, result_folder, detect_type, location, confidence, created_at
FROM analysis_records
WHERE user_id = %s
ORDER BY created_at DESC
LIMIT %s;

-- ========================================
-- 4. 检测统计查询
-- ========================================

-- 查询所有检测统计数据
SELECT id, user_id, detection_date, total_detections, zdjy_ld_count, zdjy_gd_count, avg_confidence, created_at, updated_at
FROM detection_stats
ORDER BY detection_date DESC;

-- 根据用户ID查询检测统计
SELECT id, user_id, detection_date, total_detections, zdjy_ld_count, zdjy_gd_count, avg_confidence, created_at, updated_at
FROM detection_stats
WHERE user_id = %s
ORDER BY detection_date DESC;

-- 查询指定日期的检测统计
SELECT id, user_id, detection_date, total_detections, zdjy_ld_count, zdjy_gd_count, avg_confidence, created_at, updated_at
FROM detection_stats
WHERE detection_date = %s;

-- 查询用户在指定日期的检测统计
SELECT id, user_id, detection_date, total_detections, zdjy_ld_count, zdjy_gd_count, avg_confidence, created_at, updated_at
FROM detection_stats
WHERE user_id = %s AND detection_date = %s;

-- ========================================
-- 5. 表结构查询
-- ========================================

-- 检查表是否存在
SELECT COUNT(*)
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name = %s;

-- 查询数据库中所有表
SELECT table_name
FROM information_schema.tables
WHERE table_schema = DATABASE();

-- 查询表的列信息
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = DATABASE()
AND table_name = %s;

-- ========================================
-- 6. SQLite查询（用于检测结果）
-- ========================================

-- 查询所有检测结果
SELECT id, result_id, user_id, camera_id, detection_type, confidence, detection_count, result_image, created_at, detection_details
FROM detection_results
ORDER BY created_at DESC;

-- 根据用户ID查询检测结果
SELECT id, result_id, user_id, camera_id, detection_type, confidence, detection_count, result_image, created_at, detection_details
FROM detection_results
WHERE user_id = ?
ORDER BY created_at DESC;

-- 根据检测类型查询结果
SELECT id, result_id, user_id, camera_id, detection_type, confidence, detection_count, result_image, created_at, detection_details
FROM detection_results
WHERE detection_type = ?
ORDER BY created_at DESC;

-- 查询操作日志
SELECT id, user_id, operation_type, operation_details, created_at
FROM operation_logs
ORDER BY created_at DESC;

-- 根据用户ID查询操作日志
SELECT id, user_id, operation_type, operation_details, created_at
FROM operation_logs
WHERE user_id = ?
ORDER BY created_at DESC;

-- ========================================
-- 7. 统计分析查询
-- ========================================

-- 统计用户总数
SELECT COUNT(*) as total_users
FROM user;

-- 统计管理员用户数
SELECT COUNT(*) as admin_count
FROM user
WHERE is_admin = 1;

-- 统计分析记录总数
SELECT COUNT(*) as total_records
FROM analysis_records;

-- 按检测类型统计分析记录
SELECT detect_type, COUNT(*) as count
FROM analysis_records
GROUP BY detect_type;

-- 按用户统计分析记录数
SELECT user_id, COUNT(*) as record_count
FROM analysis_records
GROUP BY user_id
ORDER BY record_count DESC;

-- 查询平均置信度
SELECT AVG(confidence) as avg_confidence
FROM analysis_records
WHERE confidence IS NOT NULL;

-- 按日期统计分析记录
SELECT DATE(created_at) as analysis_date, COUNT(*) as daily_count
FROM analysis_records
GROUP BY DATE(created_at)
ORDER BY analysis_date DESC;

-- ========================================
-- 8. 复合查询
-- ========================================

-- 查询用户及其分析记录统计
SELECT u.id, u.username, u.is_admin, u.created_at, COUNT(ar.id) as record_count
FROM user u
LEFT JOIN analysis_records ar ON u.id = ar.user_id
GROUP BY u.id, u.username, u.is_admin, u.created_at
ORDER BY record_count DESC;

-- 查询最近的分析记录及用户信息
SELECT ar.id, ar.file_type, ar.detect_type, ar.confidence, ar.created_at, u.username
FROM analysis_records ar
JOIN user u ON ar.user_id = u.id
ORDER BY ar.created_at DESC
LIMIT %s;

-- 查询高置信度的检测记录
SELECT ar.id, ar.file_type, ar.detect_type, ar.confidence, ar.created_at, u.username
FROM analysis_records ar
JOIN user u ON ar.user_id = u.id
WHERE ar.confidence > %s
ORDER BY ar.confidence DESC;

-- ========================================
-- 说明
-- ========================================
-- 本文件包含系统中所有的查询SQL语句，专门用于：
-- 1. 大模型生成SQL查询
-- 2. 工作流中的数据库查询工具
-- 3. 数据分析和统计
--
-- 参数说明：
-- %s - MySQL参数占位符
-- ? - SQLite参数占位符
--
-- 主要查询类别：
-- - 用户管理查询
-- - 分析记录查询  
-- - 检测统计查询
-- - 系统元数据查询
-- - 统计分析查询
-- - 复合关联查询