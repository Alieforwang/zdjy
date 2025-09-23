-- 系统SQL查询语句统计
-- 生成时间: 2024年
-- 说明: 本文件包含了系统中所有使用的SQL查询语句

-- ========================================
-- 1. 数据库连接测试
-- ========================================
SELECT 1;

-- ========================================
-- 2. 用户表相关操作
-- ========================================

-- 创建用户表
CREATE TABLE user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入用户数据
INSERT INTO user (username, password, is_admin, created_at) 
VALUES (%s, %s, %s, NOW());

-- 查询所有用户
SELECT id, username, is_admin, created_at 
FROM user 
ORDER BY id ASC;

-- 根据ID查询用户
SELECT id, username, is_admin, created_at 
FROM user 
WHERE id = %s;

-- 根据用户名查询用户
SELECT id, username, is_admin, created_at 
FROM user 
WHERE username = %s;

-- 用户登录验证
SELECT id, password, is_admin FROM user WHERE username = %s;

-- 检查用户名是否存在
SELECT * FROM user WHERE username = %s;

-- 更新用户信息（包含密码）
UPDATE user 
SET username = %s, password = %s, is_admin = %s 
WHERE id = %s;

-- 更新用户信息（不包含密码）
UPDATE user 
SET username = %s, is_admin = %s 
WHERE id = %s;

-- 删除用户
DELETE FROM user WHERE id = %s;

-- 用户注册
INSERT INTO user (username, password) VALUES (%s, %s);

-- ========================================
-- 3. 分析记录表相关操作
-- ========================================

-- 创建分析记录表
CREATE TABLE IF NOT EXISTS analysis_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    file_type VARCHAR(20),
    file_path TEXT,
    result_path TEXT,
    result_folder VARCHAR(255) DEFAULT 'static/@results',
    detect_type VARCHAR(50),
    location VARCHAR(100),
    confidence DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id)
);

-- ========================================
-- 4. 检测统计表相关操作
-- ========================================

-- 创建检测统计表
CREATE TABLE IF NOT EXISTS detection_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    detection_date DATE,
    total_detections INT DEFAULT 0,
    zdjy_ld_count INT DEFAULT 0,
    zdjy_gd_count INT DEFAULT 0,
    avg_confidence DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_date (user_id, detection_date),
    FOREIGN KEY (user_id) REFERENCES user(id)
);

-- ========================================
-- 5. 表检查和创建相关
-- ========================================

-- 检查表是否存在
SELECT COUNT(*)
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name = %s;

-- 禁用外键检查
SET FOREIGN_KEY_CHECKS = 0;

-- 启用外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- ========================================
-- 6. 其他业务相关SQL（来自sql文件）
-- ========================================

-- 删除分析记录表（如果存在）
DROP TABLE IF EXISTS `analysis_records`;

-- 创建分析记录表（完整版本）
CREATE TABLE `analysis_records`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `file_type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `file_path` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `result_path` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `result_folder` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'static/@results',
  `detect_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `location` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `confidence` decimal(5, 4) NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `analysis_records_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 14 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- 插入分析记录示例数据
INSERT INTO `analysis_records` VALUES (1, 1, 'image', 'static/uploads\\image_005_random_resized_crop.jpg', 'results.jpg', 'static/@results', 'zdjy_ld', '未指定', 0.8467, '2025-03-12 13:56:39');
INSERT INTO `analysis_records` VALUES (2, 1, 'image', 'static/uploads\\image_005_random_resized_crop.jpg', 'results.jpg', 'static/@results', 'zdjy_ld', '未指定', 0.8467, '2025-03-12 13:57:05');
INSERT INTO `analysis_records` VALUES (3, 1, 'image', 'static/uploads\\image_005_random_resized_crop.jpg', 'results.jpg', 'static/@results', 'zdjy_ld', '未指定', 0.8467, '2025-03-12 13:57:05');
INSERT INTO `analysis_records` VALUES (4, 1, 'image', 'static/uploads\\image_005_color_jitter_1741759341_6588.jpg', 'results.jpg', 'static/@results', 'zdjy_ld', '未指定', 0.7377, '2025-03-12 14:02:23');
INSERT INTO `analysis_records` VALUES (5, 1, 'image', 'static/uploads\\image_002_color_jitter_1741759662_4279.jpg', 'results.jpg', 'static/@results', 'zdjy_ld', '未指定', 0.6617, '2025-03-12 14:07:45');
INSERT INTO `analysis_records` VALUES (6, 1, 'image', 'static/uploads\\image_001_random_rotation_1741759904_1523.jpg', 'results.jpg', 'static/@results', 'zdjy_ld', '未指定', 0.8652, '2025-03-12 14:11:46');
INSERT INTO `analysis_records` VALUES (7, 1, 'image', 'static/uploads\\image_002_color_jitter_1741760384_9923.jpg', 'results.jpg', 'static/@results', 'zdjy_ld', '未指定', 0.6617, '2025-03-12 14:19:46');
INSERT INTO `analysis_records` VALUES (8, 1, 'image', 'static/uploads\\image_005_random_resized_crop_1741760523_3401.jpg', 'results.jpg', 'static/@results', 'zdjy_ld', '未指定', 0.8467, '2025-03-12 14:22:05');
INSERT INTO `analysis_records` VALUES (9, 1, 'image', 'static/uploads\\image_006_add_gaussian_noise_1741760536_5337.jpg', 'results.jpg', 'static/@results', 'zdjy_gd', '未指定', 0.8628, '2025-03-12 14:22:17');
INSERT INTO `analysis_records` VALUES (10, 1, 'image', 'static/uploads\\image_003_random_horizontal_flip_1741760832_7342.jpg', 'results.jpg', 'static/@results', 'zdjy_ld', '未指定', 0.8228, '2025-03-12 14:27:14');
INSERT INTO `analysis_records` VALUES (11, 1, 'image', 'static/uploads\\image_004_random_rotation_1741871371_4042.jpg', 'results.jpg', 'static/@results', 'zdjy_ld', '未指定', 0.8068, '2025-03-13 21:09:36');
INSERT INTO `analysis_records` VALUES (12, 1, 'image', 'static/uploads\\image_005_color_jitter_1741872033_7645.jpg', 'results.jpg', 'static/@results', 'zdjy_ld', '未指定', 0.7377, '2025-03-13 21:20:41');
INSERT INTO `analysis_records` VALUES (13, 1, 'image', 'static/uploads\\image_005_random_resized_crop_1741872060_7710.jpg', 'results.jpg', 'static/@results', 'zdjy_ld', '未指定', 0.8467, '2025-03-13 21:21:09');

-- ========================================
-- 7. SQLite相关SQL（用于检测结果存储）
-- ========================================

-- 创建检测结果表（SQLite）
CREATE TABLE IF NOT EXISTS detection_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    result_id TEXT NOT NULL UNIQUE,
    user_id INTEGER,
    camera_id INTEGER NOT NULL,
    detection_type TEXT,
    confidence REAL,
    detection_count INTEGER,
    result_image TEXT,
    created_at TEXT,
    detection_details TEXT
);

-- 创建检测结果索引
CREATE INDEX IF NOT EXISTS idx_detection_results_created_at ON detection_results (created_at);
CREATE INDEX IF NOT EXISTS idx_detection_results_user_id ON detection_results (user_id);
CREATE INDEX IF NOT EXISTS idx_detection_results_detection_type ON detection_results (detection_type);

-- 创建操作日志表（SQLite）
CREATE TABLE IF NOT EXISTS operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    operation_type TEXT,
    operation_details TEXT,
    created_at TEXT
);

-- 创建分析记录表（SQLite版本）
CREATE TABLE IF NOT EXISTS analysis_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    file_type TEXT,
    file_path TEXT,
    result_path TEXT,
    result_folder TEXT DEFAULT 'static/@results',
    detect_type TEXT,
    location TEXT,
    confidence REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- 8. 其他业务查询
-- ========================================

-- 删除工作记录（来自app.py）
DELETE FROM gw_list WHERE id = %s;

-- ========================================
-- 说明
-- ========================================
-- 本文件包含了系统中所有的SQL查询语句，包括：
-- 1. 用户管理相关的增删改查操作
-- 2. 分析记录的存储和查询
-- 3. 检测统计数据的管理
-- 4. 数据库表的创建和维护
-- 5. SQLite数据库的相关操作
-- 6. 系统业务逻辑中的其他查询
--
-- 这些SQL语句分布在以下文件中：
-- - util/DBUtil.py: 数据库工具类，包含用户管理和基础数据库操作
-- - app.py: 主应用文件，包含业务逻辑相关的SQL查询
-- - sql/2025.4.11.sql: 数据库初始化脚本
--
-- 数据库类型：
-- - 主要使用MySQL数据库存储用户和分析记录
-- - 部分功能使用SQLite数据库存储检测结果和日志