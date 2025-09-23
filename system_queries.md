# 系统SQL查询语句集合

> 用于大模型生成SQL和后续工作流数据库查询工具使用  
> 生成时间: 2024年

## 目录

- [1. 数据库连接测试查询](#1-数据库连接测试查询)
- [2. 用户信息查询](#2-用户信息查询)
- [3. 分析记录查询](#3-分析记录查询)
- [4. 检测统计查询](#4-检测统计查询)
- [5. 表结构查询](#5-表结构查询)
- [6. SQLite查询](#6-sqlite查询)
- [7. 统计分析查询](#7-统计分析查询)
- [8. 复合查询](#8-复合查询)

---

## 1. 数据库连接测试查询

### 1.1 基础连接测试
```sql
SELECT 1;
```

---

## 2. 用户信息查询

### 2.1 查询所有用户信息
```sql
SELECT id, username, is_admin, created_at 
FROM user 
ORDER BY id ASC;
```

### 2.2 根据用户ID查询用户信息
```sql
SELECT id, username, is_admin, created_at 
FROM user 
WHERE id = %s;
```

### 2.3 根据用户名查询用户信息
```sql
SELECT id, username, is_admin, created_at 
FROM user 
WHERE username = %s;
```

### 2.4 用户登录验证查询
```sql
SELECT id, password, is_admin 
FROM user 
WHERE username = %s;
```

### 2.5 检查用户名是否存在
```sql
SELECT * 
FROM user 
WHERE username = %s;
```

---

## 3. 分析记录查询

### 3.1 查询所有分析记录
```sql
SELECT id, user_id, file_type, file_path, result_path, result_folder, detect_type, location, confidence, created_at
FROM analysis_records
ORDER BY created_at DESC;
```

### 3.2 根据用户ID查询分析记录
```sql
SELECT id, user_id, file_type, file_path, result_path, result_folder, detect_type, location, confidence, created_at
FROM analysis_records
WHERE user_id = %s
ORDER BY created_at DESC;
```

### 3.3 根据检测类型查询分析记录
```sql
SELECT id, user_id, file_type, file_path, result_path, result_folder, detect_type, location, confidence, created_at
FROM analysis_records
WHERE detect_type = %s
ORDER BY created_at DESC;
```

### 3.4 根据时间范围查询分析记录
```sql
SELECT id, user_id, file_type, file_path, result_path, result_folder, detect_type, location, confidence, created_at
FROM analysis_records
WHERE created_at BETWEEN %s AND %s
ORDER BY created_at DESC;
```

### 3.5 查询用户的最新分析记录
```sql
SELECT id, user_id, file_type, file_path, result_path, result_folder, detect_type, location, confidence, created_at
FROM analysis_records
WHERE user_id = %s
ORDER BY created_at DESC
LIMIT %s;
```

---

## 4. 检测统计查询

### 4.1 查询所有检测统计数据
```sql
SELECT id, user_id, detection_date, total_detections, zdjy_ld_count, zdjy_gd_count, avg_confidence, created_at, updated_at
FROM detection_stats
ORDER BY detection_date DESC;
```

### 4.2 根据用户ID查询检测统计
```sql
SELECT id, user_id, detection_date, total_detections, zdjy_ld_count, zdjy_gd_count, avg_confidence, created_at, updated_at
FROM detection_stats
WHERE user_id = %s
ORDER BY detection_date DESC;
```

### 4.3 查询指定日期的检测统计
```sql
SELECT id, user_id, detection_date, total_detections, zdjy_ld_count, zdjy_gd_count, avg_confidence, created_at, updated_at
FROM detection_stats
WHERE detection_date = %s;
```

### 4.4 查询用户在指定日期的检测统计
```sql
SELECT id, user_id, detection_date, total_detections, zdjy_ld_count, zdjy_gd_count, avg_confidence, created_at, updated_at
FROM detection_stats
WHERE user_id = %s AND detection_date = %s;
```

---

## 5. 表结构查询

### 5.1 检查表是否存在
```sql
SELECT COUNT(*)
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name = %s;
```

### 5.2 查询数据库中所有表
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = DATABASE();
```

### 5.3 查询表的列信息
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = DATABASE()
AND table_name = %s;
```

---

## 6. SQLite查询

> 用于检测结果数据库（SQLite）

### 6.1 查询所有检测结果
```sql
SELECT id, result_id, user_id, camera_id, detection_type, confidence, detection_count, result_image, created_at, detection_details
FROM detection_results
ORDER BY created_at DESC;
```

### 6.2 根据用户ID查询检测结果
```sql
SELECT id, result_id, user_id, camera_id, detection_type, confidence, detection_count, result_image, created_at, detection_details
FROM detection_results
WHERE user_id = ?
ORDER BY created_at DESC;
```

### 6.3 根据检测类型查询结果
```sql
SELECT id, result_id, user_id, camera_id, detection_type, confidence, detection_count, result_image, created_at, detection_details
FROM detection_results
WHERE detection_type = ?
ORDER BY created_at DESC;
```

### 6.4 查询操作日志
```sql
SELECT id, user_id, operation_type, operation_details, created_at
FROM operation_logs
ORDER BY created_at DESC;
```

### 6.5 根据用户ID查询操作日志
```sql
SELECT id, user_id, operation_type, operation_details, created_at
FROM operation_logs
WHERE user_id = ?
ORDER BY created_at DESC;
```

---

## 7. 统计分析查询

### 7.1 统计用户总数
```sql
SELECT COUNT(*) as total_users
FROM user;
```

### 7.2 统计管理员用户数
```sql
SELECT COUNT(*) as admin_count
FROM user
WHERE is_admin = 1;
```

### 7.3 统计分析记录总数
```sql
SELECT COUNT(*) as total_records
FROM analysis_records;
```

### 7.4 按检测类型统计分析记录
```sql
SELECT detect_type, COUNT(*) as count
FROM analysis_records
GROUP BY detect_type;
```

### 7.5 按用户统计分析记录数
```sql
SELECT user_id, COUNT(*) as record_count
FROM analysis_records
GROUP BY user_id
ORDER BY record_count DESC;
```

### 7.6 查询平均置信度
```sql
SELECT AVG(confidence) as avg_confidence
FROM analysis_records
WHERE confidence IS NOT NULL;
```

### 7.7 按日期统计分析记录
```sql
SELECT DATE(created_at) as analysis_date, COUNT(*) as daily_count
FROM analysis_records
GROUP BY DATE(created_at)
ORDER BY analysis_date DESC;
```

---

## 8. 复合查询

### 8.1 查询用户及其分析记录统计
```sql
SELECT u.id, u.username, u.is_admin, u.created_at, COUNT(ar.id) as record_count
FROM user u
LEFT JOIN analysis_records ar ON u.id = ar.user_id
GROUP BY u.id, u.username, u.is_admin, u.created_at
ORDER BY record_count DESC;
```

### 8.2 查询最近的分析记录及用户信息
```sql
SELECT ar.id, ar.file_type, ar.detect_type, ar.confidence, ar.created_at, u.username
FROM analysis_records ar
JOIN user u ON ar.user_id = u.id
ORDER BY ar.created_at DESC
LIMIT %s;
```

### 8.3 查询高置信度的检测记录
```sql
SELECT ar.id, ar.file_type, ar.detect_type, ar.confidence, ar.created_at, u.username
FROM analysis_records ar
JOIN user u ON ar.user_id = u.id
WHERE ar.confidence > %s
ORDER BY ar.confidence DESC;
```

---

## 技术说明

### 参数占位符
- `%s` - MySQL参数占位符
- `?` - SQLite参数占位符

### 数据库架构
本系统采用混合数据库架构：
- **MySQL** - 主要业务数据（用户、分析记录、统计数据）
- **SQLite** - 检测结果和操作日志

### 主要查询类别
1. **用户管理查询** - 用户认证、权限管理
2. **分析记录查询** - 检测分析结果管理
3. **检测统计查询** - 数据统计和报表
4. **系统元数据查询** - 表结构和系统信息
5. **统计分析查询** - 数据分析和洞察
6. **复合关联查询** - 多表联合查询

### 使用场景
- 大模型SQL生成训练数据
- 工作流数据库查询工具
- 系统数据分析和统计
- API接口数据查询

---

**总计查询语句数量**: 40+ 个  
**覆盖功能模块**: 8 个  
**支持数据库**: MySQL + SQLite