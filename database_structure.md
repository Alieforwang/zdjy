# 数据库结构文档

## 概述

本系统采用混合数据库架构，包含MySQL和SQLite两种数据库：
- **MySQL**: 主要用于用户管理、分析记录、检测统计等核心业务数据
- **SQLite**: 用于检测结果、操作日志等实时数据存储

## 目录

- [MySQL数据库结构](#mysql数据库结构)
  - [analysis_records - 分析记录表](#analysis_records---分析记录表)
  - [detection_results - 检测结果表](#detection_results---检测结果表mysql)
  - [detection_stats - 检测统计表](#detection_stats---检测统计表)
  - [login_logs - 登录日志表](#login_logs---登录日志表)
  - [operation_logs - 操作日志表](#operation_logs---操作日志表mysql)
  - [tasks - 任务表](#tasks---任务表)
  - [user - 用户表](#user---用户表)
  - [user_settings - 用户设置表](#user_settings---用户设置表)
  - [users - 用户表(备用)](#users---用户表备用)
  - [videos - 视频表](#videos---视频表)
- [SQLite数据库结构](#sqlite数据库结构)
  - [detection_results - 检测结果表](#detection_results---检测结果表sqlite)
  - [operation_logs - 操作日志表](#operation_logs---操作日志表sqlite)
  - [analysis_records - 分析记录表](#analysis_records---分析记录表sqlite)

---

## MySQL数据库结构

### analysis_records - 分析记录表

存储图像/视频分析的历史记录。

```sql
CREATE TABLE `analysis_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `file_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `file_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `result_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `result_folder` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT 'static/@results',
  `detect_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NULL DEFAULT NULL,
  `confidence` decimal(5, 4) NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `analysis_records_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = DYNAMIC;
```

**字段说明:**
- `id`: 主键，自增ID
- `user_id`: 用户ID，外键关联user表
- `file_type`: 文件类型(image/video)
- `file_path`: 原始文件路径
- `result_path`: 结果文件路径
- `result_folder`: 结果文件夹路径
- `detect_type`: 检测类型(zdjy_ld/zdjy_gd等)
- `location`: 位置信息
- `confidence`: 置信度(0-1)
- `created_at`: 创建时间

### detection_results - 检测结果表(MySQL)

存储实时检测的详细结果。

```sql
CREATE TABLE `detection_results` (
  `id` int NOT NULL AUTO_INCREMENT,
  `result_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `user_id` int NULL DEFAULT NULL,
  `camera_id` int NOT NULL,
  `detection_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `confidence` float NULL DEFAULT NULL,
  `detection_count` int NULL DEFAULT NULL,
  `result_image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `created_at` datetime NULL DEFAULT NULL,
  `detection_details` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `result_id`(`result_id` ASC) USING BTREE,
  INDEX `idx_detection_results_created_at`(`created_at` ASC) USING BTREE,
  INDEX `idx_detection_results_user_id`(`user_id` ASC) USING BTREE,
  INDEX `idx_detection_results_detection_type`(`detection_type` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;
```

**字段说明:**
- `id`: 主键，自增ID
- `result_id`: 结果唯一标识符
- `user_id`: 用户ID
- `camera_id`: 摄像头ID
- `detection_type`: 检测类型
- `confidence`: 置信度
- `detection_count`: 检测数量
- `result_image`: 结果图像路径
- `created_at`: 创建时间
- `detection_details`: 检测详情(JSON格式)

### detection_stats - 检测统计表

存储用户每日检测统计数据。

```sql
CREATE TABLE `detection_stats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `detection_date` date NOT NULL,
  `daily_count` int NULL DEFAULT 0,
  `total_count` int NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_user_date`(`user_id` ASC, `detection_date` ASC) USING BTREE,
  CONSTRAINT `detection_stats_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = DYNAMIC;
```

**字段说明:**
- `id`: 主键，自增ID
- `user_id`: 用户ID，外键关联user表
- `detection_date`: 检测日期
- `daily_count`: 当日检测次数
- `total_count`: 累计检测次数

### login_logs - 登录日志表

记录用户登录历史。

```sql
CREATE TABLE `login_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `login_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `login_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;
```

**字段说明:**
- `id`: 主键，自增ID
- `user_id`: 用户ID，外键关联user表
- `login_time`: 登录时间
- `ip_address`: IP地址
- `user_agent`: 用户代理信息

### operation_logs - 操作日志表(MySQL)

记录用户操作历史。

```sql
CREATE TABLE `operation_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL,
  `operation_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `operation_details` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `created_at` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_operation_logs_created_at`(`created_at` ASC) USING BTREE,
  INDEX `idx_operation_logs_user_id`(`user_id` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;
```

**字段说明:**
- `id`: 主键，自增ID
- `user_id`: 用户ID
- `operation_type`: 操作类型
- `operation_details`: 操作详情
- `created_at`: 创建时间

### tasks - 任务表

存储用户任务信息。

```sql
CREATE TABLE `tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;
```

**字段说明:**
- `id`: 主键，自增ID
- `user_id`: 用户ID，外键关联user表
- `title`: 任务标题
- `description`: 任务描述
- `status`: 任务状态(pending/completed等)
- `created_at`: 创建时间

### user - 用户表

主要的用户信息表。

```sql
CREATE TABLE `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `is_admin` tinyint(1) NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = DYNAMIC;
```

**字段说明:**
- `id`: 主键，自增ID
- `username`: 用户名，唯一
- `password`: 密码(加密存储)
- `is_admin`: 是否管理员(0/1)
- `created_at`: 创建时间

### user_settings - 用户设置表

存储用户个性化设置。

```sql
CREATE TABLE `user_settings` (
  `user_id` int NOT NULL,
  `theme` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'dark',
  `language` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'zh',
  `sensitivity` int NULL DEFAULT 75,
  `min_size` int NULL DEFAULT 50,
  `realtime_detection` tinyint(1) NULL DEFAULT 1,
  `cleanup_period` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT '30',
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;
```

**字段说明:**
- `user_id`: 用户ID，主键
- `theme`: 主题设置(dark/light)
- `language`: 语言设置(zh/en)
- `sensitivity`: 检测敏感度(0-100)
- `min_size`: 最小检测尺寸
- `realtime_detection`: 是否启用实时检测
- `cleanup_period`: 清理周期(天数)
- `update_time`: 更新时间

### users - 用户表(备用)

备用用户表，功能类似user表。

```sql
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `password` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `email` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `created_at` datetime NULL DEFAULT NULL,
  `last_login` datetime NULL DEFAULT NULL,
  `is_admin` tinyint(1) NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;
```

**字段说明:**
- `id`: 主键，自增ID
- `username`: 用户名，唯一
- `password`: 密码
- `email`: 邮箱地址
- `created_at`: 创建时间
- `last_login`: 最后登录时间
- `is_admin`: 是否管理员

### videos - 视频表

存储上传的视频文件信息。

```sql
CREATE TABLE `videos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NULL DEFAULT NULL,
  `filename` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `filepath` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `upload_date` datetime NULL DEFAULT NULL,
  `processed` tinyint(1) NULL DEFAULT 0,
  `duration` float NULL DEFAULT NULL,
  `frame_count` int NULL DEFAULT NULL,
  `uploaded_by` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `filename`(`filename` ASC) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `videos_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE RESTRICT
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = DYNAMIC;
```

**字段说明:**
- `id`: 主键，自增ID
- `user_id`: 用户ID，外键关联users表
- `filename`: 文件名，唯一
- `filepath`: 文件路径
- `upload_date`: 上传日期
- `processed`: 是否已处理
- `duration`: 视频时长
- `frame_count`: 帧数
- `uploaded_by`: 上传者

---

## SQLite数据库结构

### detection_results - 检测结果表(SQLite)

用于存储实时检测结果的SQLite版本。

```sql
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

-- 索引
CREATE INDEX IF NOT EXISTS idx_detection_results_created_at ON detection_results (created_at);
CREATE INDEX IF NOT EXISTS idx_detection_results_user_id ON detection_results (user_id);
CREATE INDEX IF NOT EXISTS idx_detection_results_detection_type ON detection_results (detection_type);
```

**字段说明:**
- `id`: 主键，自增ID
- `result_id`: 结果唯一标识符
- `user_id`: 用户ID
- `camera_id`: 摄像头ID
- `detection_type`: 检测类型
- `confidence`: 置信度
- `detection_count`: 检测数量
- `result_image`: 结果图像路径
- `created_at`: 创建时间
- `detection_details`: 检测详情(JSON格式)

### operation_logs - 操作日志表(SQLite)

用于记录操作日志的SQLite版本。

```sql
CREATE TABLE IF NOT EXISTS operation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    operation_type TEXT,
    operation_details TEXT,
    created_at TEXT
);
```

**字段说明:**
- `id`: 主键，自增ID
- `user_id`: 用户ID
- `operation_type`: 操作类型
- `operation_details`: 操作详情
- `created_at`: 创建时间

### analysis_records - 分析记录表(SQLite)

用于存储分析记录的SQLite版本。

```sql
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
```

**字段说明:**
- `id`: 主键，自增ID
- `user_id`: 用户ID
- `file_type`: 文件类型
- `file_path`: 文件路径
- `result_path`: 结果路径
- `result_folder`: 结果文件夹
- `detect_type`: 检测类型
- `location`: 位置信息
- `confidence`: 置信度
- `created_at`: 创建时间

---

## 数据库架构说明

### 技术特点

1. **混合架构**: 结合MySQL和SQLite的优势
   - MySQL: 处理复杂关系和大量数据
   - SQLite: 处理轻量级实时数据

2. **索引优化**: 关键字段建立索引提升查询性能
   - 时间字段索引: 支持时间范围查询
   - 用户ID索引: 支持用户数据快速检索
   - 检测类型索引: 支持分类统计

3. **外键约束**: 保证数据完整性
   - 用户相关表通过user_id关联
   - 级联删除和更新策略

4. **字符集支持**: 使用utf8mb4支持完整Unicode字符集

### 使用场景

- **用户管理**: user表存储用户基本信息
- **检测分析**: analysis_records记录分析历史
- **实时监控**: detection_results存储实时检测结果
- **统计分析**: detection_stats提供统计数据
- **日志审计**: login_logs和operation_logs记录操作历史
- **任务管理**: tasks表管理用户任务
- **个性化设置**: user_settings存储用户偏好
- **文件管理**: videos表管理上传的视频文件

### 数据流向

1. 用户注册/登录 → user表
2. 文件上传分析 → analysis_records表
3. 实时检测 → detection_results表(SQLite)
4. 统计汇总 → detection_stats表
5. 操作记录 → operation_logs表
6. 登录记录 → login_logs表

---

*文档生成时间: 2025年*
*数据库版本: MySQL 8.0.39, SQLite 3.x*