/*
 Navicat Premium Data Transfer

 Source Server         : stu
 Source Server Type    : MySQL
 Source Server Version : 80039 (8.0.39)
 Source Host           : localhost:3306
 Source Schema         : tiaozhanbei

 Target Server Type    : MySQL
 Target Server Version : 80039 (8.0.39)
 File Encoding         : 65001

 Date: 19/03/2025 21:13:56
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for analysis_records
-- ----------------------------
DROP TABLE IF EXISTS `analysis_records`;
CREATE TABLE `analysis_records`  (
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
) ENGINE = InnoDB AUTO_INCREMENT = 489 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of analysis_records
-- ----------------------------
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
INSERT INTO `analysis_records` VALUES (14, 1, 'image', 'static/uploads\\image_006_random_vertical_flip_1741872086_5107.jpg', 'results.jpg', 'static/@results', 'zdjy_gd', '未指定', 0.8937, '2025-03-13 21:21:28');
INSERT INTO `analysis_records` VALUES (15, 1, 'image', 'static/uploads\\image_015_random_horizontal_flip_1741872097_2882.jpg', 'results.jpg', 'static/@results', 'zdjy_gd', '未指定', 0.8230, '2025-03-13 21:21:39');
INSERT INTO `analysis_records` VALUES (16, 1, 'image', 'static/uploads\\image_024_add_gaussian_noise_1741872108_3383.jpg', 'results.jpg', 'static/@results', 'zdjy_ld', '未指定', 0.8376, '2025-03-13 21:21:50');
INSERT INTO `analysis_records` VALUES (17, 1, 'image', 'static/uploads\\image_027_add_gaussian_noise_1741872121_2469.jpg', 'results.jpg', 'static/@results', 'zdjy_gd', '未指定', 0.7387, '2025-03-13 21:22:03');
INSERT INTO `analysis_records` VALUES (18, 1, 'image', 'static/uploads\\2b303d34b61a3e92e8fe5cbb52577b6_1742109170_5539.jpg', 'static\\result_2b303d34b61a3e92e8fe5cbb52577b6_1742109170_5539.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7440, '2025-03-16 15:12:53');
INSERT INTO `analysis_records` VALUES (19, 1, 'image', 'static/uploads\\2b5778119ee7489d5a032e36e739bbb_1742110231_9818.jpg', 'static\\result_2b5778119ee7489d5a032e36e739bbb_1742110231_9818.jpg', 'static/@results', 'zdjy_ld', NULL, 0.5486, '2025-03-16 15:30:31');
INSERT INTO `analysis_records` VALUES (20, 1, 'image', 'static/uploads\\2b303d34b61a3e92e8fe5cbb52577b6_1742111790_2399.jpg', 'static\\result_2b303d34b61a3e92e8fe5cbb52577b6_1742111790_2399.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7440, '2025-03-16 15:56:30');
INSERT INTO `analysis_records` VALUES (21, 1, 'image', 'static/uploads\\2b5778119ee7489d5a032e36e739bbb_1742112118_3475.jpg', 'static\\result_2b5778119ee7489d5a032e36e739bbb_1742112118_3475.jpg', 'static/@results', 'zdjy_ld', NULL, 0.5486, '2025-03-16 16:01:58');
INSERT INTO `analysis_records` VALUES (22, 1, 'image', 'static/uploads\\2d057d1212e9ba234a5318606396ac4_1742112886_2549.jpg', 'static\\result_2d057d1212e9ba234a5318606396ac4_1742112886_2549.jpg', 'static/@results', 'zdjy_ld', NULL, 0.5152, '2025-03-16 16:14:48');
INSERT INTO `analysis_records` VALUES (23, 1, 'image', 'static/uploads\\3f1e0cc02ce3406f62a26576b3fd03e_1742130341_9348.jpg', 'static\\result_3f1e0cc02ce3406f62a26576b3fd03e_1742130341_9348.jpg', 'static/@results', 'zdjy_ld', NULL, 0.8283, '2025-03-16 21:05:43');
INSERT INTO `analysis_records` VALUES (24, 1, 'image', 'static/uploads\\742f04d52955a32985e5163a5c52374_1742130905_1919.jpg', 'static\\result_742f04d52955a32985e5163a5c52374_1742130905_1919.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7176, '2025-03-16 21:15:06');
INSERT INTO `analysis_records` VALUES (25, 1, 'image', 'static/uploads\\9b6fe2cec0e3c2471245a3f11f007d6_1742131026_1573.jpg', 'static\\result_9b6fe2cec0e3c2471245a3f11f007d6_1742131026_1573.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7089, '2025-03-16 21:17:07');
INSERT INTO `analysis_records` VALUES (26, 1, 'image', 'static/uploads\\2d057d1212e9ba234a5318606396ac4_1742131308_7243.jpg', 'static\\result_2d057d1212e9ba234a5318606396ac4_1742131308_7243.jpg', 'static/@results', 'zdjy_ld', NULL, 0.5152, '2025-03-16 21:21:49');
INSERT INTO `analysis_records` VALUES (27, 1, 'image', 'static/uploads\\1a375bd321dd5ca9b794a010b9d07b4_1742136243_7168.jpg', 'static\\result_1a375bd321dd5ca9b794a010b9d07b4_1742136243_7168.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6025, '2025-03-16 22:44:03');
INSERT INTO `analysis_records` VALUES (28, 1, 'image', 'static/uploads\\98ba574f3d2dab955a22ebd3462a736_1742136302_1158.jpg', 'static\\result_98ba574f3d2dab955a22ebd3462a736_1742136302_1158.jpg', 'static/@results', 'zdjy_ld', NULL, 0.8253, '2025-03-16 22:45:02');
INSERT INTO `analysis_records` VALUES (29, 1, 'image', 'static/uploads\\2b36a8b3755ef3b46576516d7de62f1_1742136676_9247.jpg', 'static\\result_2b36a8b3755ef3b46576516d7de62f1_1742136676_9247.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7436, '2025-03-16 22:51:17');
INSERT INTO `analysis_records` VALUES (30, 1, 'image', 'static/uploads\\1a375bd321dd5ca9b794a010b9d07b4_1742199416_2216.jpg', 'static\\result_1a375bd321dd5ca9b794a010b9d07b4_1742199416_2216.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6025, '2025-03-17 16:16:58');
INSERT INTO `analysis_records` VALUES (31, 1, 'image', 'static/uploads\\1f63521bdce3e9682d586515b29d601_1742199653_9718.jpg', 'static\\result_1f63521bdce3e9682d586515b29d601_1742199653_9718.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7339, '2025-03-17 16:20:54');
INSERT INTO `analysis_records` VALUES (32, 1, 'image', 'static/uploads\\f6fdd9a1e20f4b8b64bbe7543253bfd_1742201037_2639.jpg', 'result_f6fdd9a1e20f4b8b64bbe7543253bfd_1742201037_2639.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7157, '2025-03-17 16:43:58');
INSERT INTO `analysis_records` VALUES (33, 1, 'image', 'static/uploads\\9b9fbef3b17e49f89c293076690f5a1_1742201306_1598.jpg', 'result_9b9fbef3b17e49f89c293076690f5a1_1742201306_1598.jpg', 'static/@results', 'zdjy_ld', NULL, 0.4709, '2025-03-17 16:48:27');
INSERT INTO `analysis_records` VALUES (34, 1, 'image', 'static/uploads\\IMG20241216185356_1742201323_7675.jpg', 'result_IMG20241216185356_1742201323_7675.jpg', 'static/@results', 'zdjy_ld', NULL, 0.5258, '2025-03-17 16:48:43');
INSERT INTO `analysis_records` VALUES (35, 1, 'image', 'static/uploads\\IMG20241216180712_1742201377_6886.jpg', 'result_IMG20241216180712_1742201377_6886.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6499, '2025-03-17 16:49:37');
INSERT INTO `analysis_records` VALUES (36, 1, 'image', 'static/uploads\\IMG20241216181843_1742201390_2122.jpg', 'result_IMG20241216181843_1742201390_2122.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7971, '2025-03-17 16:49:51');
INSERT INTO `analysis_records` VALUES (37, 1, 'image', 'static/uploads\\IMG20241216180841_1742201410_5110.jpg', 'result_IMG20241216180841_1742201410_5110.jpg', 'static/@results', 'zdjy_ld', NULL, 0.8582, '2025-03-17 16:50:11');
INSERT INTO `analysis_records` VALUES (38, 1, 'image', 'static/uploads\\fe9cc4b89e0496db4f84b09bd73f45f_1742201437_4234.jpg', 'result_fe9cc4b89e0496db4f84b09bd73f45f_1742201437_4234.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7929, '2025-03-17 16:50:37');
INSERT INTO `analysis_records` VALUES (39, 1, 'image', 'static/uploads\\805d0fd8a9bba2d7e56cd4b738cb791_1742202069_2209.jpg', 'result_805d0fd8a9bba2d7e56cd4b738cb791_1742202069_2209.jpg', 'static/@results', 'zdjy_ld', NULL, 0.4451, '2025-03-17 17:01:10');
INSERT INTO `analysis_records` VALUES (40, 1, 'image', 'static/uploads\\144a51b80558e99e2b1f11f41e77550_1742202350_8705.jpg', 'result_144a51b80558e99e2b1f11f41e77550_1742202350_8705.jpg', 'static/@results', 'zdjy_ld', NULL, 0.8056, '2025-03-17 17:05:51');
INSERT INTO `analysis_records` VALUES (41, 1, 'image', 'static/uploads\\14e875dc57738b73884e1c8a6a81293_1742202546_2043.jpg', 'result_14e875dc57738b73884e1c8a6a81293_1742202546_2043.jpg', 'static/@results', 'zdjy_gd', NULL, 0.6059, '2025-03-17 17:09:07');
INSERT INTO `analysis_records` VALUES (42, 1, 'image', 'static/uploads\\6d631a0e0f1e670ca026d9ded2f243a_1742202593_3889.jpg', 'result_6d631a0e0f1e670ca026d9ded2f243a_1742202593_3889.jpg', 'static/@results', 'zdjy_gd', NULL, 0.8244, '2025-03-17 17:09:53');
INSERT INTO `analysis_records` VALUES (43, 1, 'image', 'static/uploads\\3f1e0cc02ce3406f62a26576b3fd03e_1742202696_6795.jpg', 'result_3f1e0cc02ce3406f62a26576b3fd03e_1742202696_6795.jpg', 'static/@results', 'zdjy_gd', NULL, 0.8283, '2025-03-17 17:11:36');
INSERT INTO `analysis_records` VALUES (44, 1, 'image', 'static/uploads\\1f63521bdce3e9682d586515b29d601_1742202774_5403.jpg', 'result_1f63521bdce3e9682d586515b29d601_1742202774_5403.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7339, '2025-03-17 17:12:55');
INSERT INTO `analysis_records` VALUES (45, 1, 'image', 'static/uploads\\51797c36615790597f2fdb9b4f987fd_1742203261_2686.jpg', 'result_51797c36615790597f2fdb9b4f987fd_1742203261_2686.jpg', 'static/@results', 'zdjy_ld', NULL, 0.5642, '2025-03-17 17:21:03');
INSERT INTO `analysis_records` VALUES (46, 1, 'image', 'static/uploads\\144a51b80558e99e2b1f11f41e77550_1742203392_9269.jpg', 'result_144a51b80558e99e2b1f11f41e77550_1742203392_9269.jpg', 'static/@results', 'zdjy_ld', NULL, 0.8056, '2025-03-17 17:23:14');
INSERT INTO `analysis_records` VALUES (47, 1, 'image', 'static/uploads\\6c77fcd644e81e7afd62ce4a222f472_1742203454_8528.jpg', 'result_6c77fcd644e81e7afd62ce4a222f472_1742203454_8528.jpg', 'static/@results', 'zdjy_gd', NULL, 0.3498, '2025-03-17 17:24:15');
INSERT INTO `analysis_records` VALUES (48, 1, 'image', 'static/uploads\\6d631a0e0f1e670ca026d9ded2f243a_1742203818_8764.jpg', 'result_6d631a0e0f1e670ca026d9ded2f243a_1742203818_8764.jpg', 'static/@results', 'zdjy_gd', NULL, 0.8244, '2025-03-17 17:30:19');
INSERT INTO `analysis_records` VALUES (49, 1, 'image', 'static/uploads\\82c3c634d46c6bde3d16353d043030c_1742204242_8869.jpg', 'result_82c3c634d46c6bde3d16353d043030c_1742204242_8869.jpg', 'static/@results', 'zdjy_gd', NULL, 0.7595, '2025-03-17 17:37:23');
INSERT INTO `analysis_records` VALUES (50, 1, 'image', 'static/uploads\\99a01895aca79a6c51b4041eb2ae607_1742204277_2454.jpg', 'result_99a01895aca79a6c51b4041eb2ae607_1742204277_2454.jpg', 'static/@results', 'zdjy_gd', NULL, 0.5924, '2025-03-17 17:37:58');
INSERT INTO `analysis_records` VALUES (51, 1, 'image', 'static/uploads\\7bc3a6e0be40e756073481562b79163_1742206137_2736.jpg', 'result_7bc3a6e0be40e756073481562b79163_1742206137_2736.jpg', 'static/@results', 'zdjy_ld', NULL, 0.8247, '2025-03-17 18:08:58');
INSERT INTO `analysis_records` VALUES (52, 1, 'image', 'static/uploads\\f24d1c94f277ca0cfc0ebb5965682d9_1742206176_7357.jpg', 'result_f24d1c94f277ca0cfc0ebb5965682d9_1742206176_7357.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6346, '2025-03-17 18:09:36');
INSERT INTO `analysis_records` VALUES (53, 1, 'image', 'static/uploads\\IMG20241216190726_1742206279_4771.jpg', 'result_IMG20241216190726_1742206279_4771.jpg', 'static/@results', 'zdjy_ld', NULL, 0.5762, '2025-03-17 18:11:19');
INSERT INTO `analysis_records` VALUES (54, 1, 'image', 'static/uploads\\2b303d34b61a3e92e8fe5cbb52577b6_1742206758_6816.jpg', 'result_2b303d34b61a3e92e8fe5cbb52577b6_1742206758_6816.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7440, '2025-03-17 18:19:19');
INSERT INTO `analysis_records` VALUES (55, 1, 'image', 'static/uploads\\8ebfa0bdd8b9b9f969e01e7813f8386_1742207127_9800.jpg', 'result_8ebfa0bdd8b9b9f969e01e7813f8386_1742207127_9800.jpg', 'static/@results', 'zdjy_ld', NULL, 0.5163, '2025-03-17 18:25:29');
INSERT INTO `analysis_records` VALUES (56, 1, 'image', 'static/uploads\\7aae7dba5b23fe992e884cbf3546896_1742207282_6415.jpg', 'result_7aae7dba5b23fe992e884cbf3546896_1742207282_6415.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7194, '2025-03-17 18:28:03');
INSERT INTO `analysis_records` VALUES (57, 1, 'image', 'static/uploads\\2ac85781c96a17b7aae1ec0f2561e06_1742207291_1648.jpg', 'result_2ac85781c96a17b7aae1ec0f2561e06_1742207291_1648.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6391, '2025-03-17 18:28:11');
INSERT INTO `analysis_records` VALUES (58, 1, 'image', 'static/uploads\\0270e4b093cd6ec9843bb5ed5855968_1742207298_1595.jpg', 'result_0270e4b093cd6ec9843bb5ed5855968_1742207298_1595.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7990, '2025-03-17 18:28:18');
INSERT INTO `analysis_records` VALUES (59, 1, 'image', 'static/uploads\\17fa323dde3ef22604ebc20554b6c73_1742207329_1220.jpg', 'result_17fa323dde3ef22604ebc20554b6c73_1742207329_1220.jpg', 'static/@results', 'zdjy_gd', NULL, 0.6664, '2025-03-17 18:28:49');
INSERT INTO `analysis_records` VALUES (60, 1, 'image', 'static/uploads\\99a01895aca79a6c51b4041eb2ae607_1742207688_6033.jpg', 'result_99a01895aca79a6c51b4041eb2ae607_1742207688_6033.jpg', 'static/@results', 'zdjy_ld', NULL, 0.5924, '2025-03-17 18:34:49');
INSERT INTO `analysis_records` VALUES (61, 1, 'image', 'static/uploads\\08149ed88e792236eca0575b41e138a_1742207701_7258.jpg', 'result_08149ed88e792236eca0575b41e138a_1742207701_7258.jpg', 'static/@results', 'zdjy_ld', NULL, 0.5752, '2025-03-17 18:35:01');
INSERT INTO `analysis_records` VALUES (62, 1, 'image', 'static/uploads\\87e67ee4fae4314341febb3be7c8aa8_1742207748_6203.jpg', 'result_87e67ee4fae4314341febb3be7c8aa8_1742207748_6203.jpg', 'static/@results', 'zdjy_ld', NULL, 0.4918, '2025-03-17 18:35:48');
INSERT INTO `analysis_records` VALUES (63, 1, 'image', 'static/uploads\\51797c36615790597f2fdb9b4f987fd_1742207765_1249.jpg', 'result_51797c36615790597f2fdb9b4f987fd_1742207765_1249.jpg', 'static/@results', 'zdjy_gd', NULL, 0.5642, '2025-03-17 18:36:05');
INSERT INTO `analysis_records` VALUES (64, 1, 'image', 'static/uploads\\5f21231d410b77ffde1dcf5204d013e_1742207790_3212.jpg', 'result_5f21231d410b77ffde1dcf5204d013e_1742207790_3212.jpg', 'static/@results', 'zdjy_ld', NULL, 0.5119, '2025-03-17 18:36:30');
INSERT INTO `analysis_records` VALUES (65, 1, 'image', 'static/uploads\\2d8a9771814e56819c72dbece609a04_1742211669_3897.jpg', 'result_2d8a9771814e56819c72dbece609a04_1742211669_3897.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6243, '2025-03-17 19:41:13');
INSERT INTO `analysis_records` VALUES (66, 1, 'image', 'static/uploads\\2b303d34b61a3e92e8fe5cbb52577b6_1742346125_9524.jpg', 'result_2b303d34b61a3e92e8fe5cbb52577b6_1742346125_9524.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7440, '2025-03-19 09:02:09');
INSERT INTO `analysis_records` VALUES (67, 1, 'image', 'static/uploads\\2d057d1212e9ba234a5318606396ac4_1742346150_2779.jpg', 'result_2d057d1212e9ba234a5318606396ac4_1742346150_2779.jpg', 'static/@results', 'zdjy_ld', NULL, 0.5152, '2025-03-19 09:02:30');
INSERT INTO `analysis_records` VALUES (68, 1, 'image', 'static/uploads\\99a01895aca79a6c51b4041eb2ae607_1742346167_6901.jpg', 'result_99a01895aca79a6c51b4041eb2ae607_1742346167_6901.jpg', 'static/@results', 'zdjy_ld', NULL, 0.5924, '2025-03-19 09:02:47');
INSERT INTO `analysis_records` VALUES (69, 1, 'image', 'static/uploads\\14e875dc57738b73884e1c8a6a81293_1742346204_4580.jpg', 'result_14e875dc57738b73884e1c8a6a81293_1742346204_4580.jpg', 'static/@results', 'zdjy_gd', NULL, 0.6059, '2025-03-19 09:03:24');
INSERT INTO `analysis_records` VALUES (70, 1, 'image', 'static/uploads\\742f04d52955a32985e5163a5c52374_1742346220_4466.jpg', 'result_742f04d52955a32985e5163a5c52374_1742346220_4466.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7176, '2025-03-19 09:03:41');
INSERT INTO `analysis_records` VALUES (71, 1, 'image', 'static/uploads\\6d631a0e0f1e670ca026d9ded2f243a_1742346236_8385.jpg', 'result_6d631a0e0f1e670ca026d9ded2f243a_1742346236_8385.jpg', 'static/@results', 'zdjy_ld', NULL, 0.8244, '2025-03-19 09:03:57');
INSERT INTO `analysis_records` VALUES (72, 1, 'image', 'static/uploads\\9aab8a9583e612878ace656dc3c2850_1742346253_4747.jpg', 'result_9aab8a9583e612878ace656dc3c2850_1742346253_4747.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6644, '2025-03-19 09:04:13');
INSERT INTO `analysis_records` VALUES (73, 1, 'image', 'static/uploads\\82a07a749512f1a673ec6fecdef551f_1742346278_6158.jpg', 'result_82a07a749512f1a673ec6fecdef551f_1742346278_6158.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7860, '2025-03-19 09:04:38');
INSERT INTO `analysis_records` VALUES (74, 1, 'image', 'static/uploads\\11fe160848cc32d6c185ca0f9515cab_1742346433_8662.jpg', 'result_11fe160848cc32d6c185ca0f9515cab_1742346433_8662.jpg', 'static/@results', 'zdjy_ld', NULL, 0.3748, '2025-03-19 09:07:13');
INSERT INTO `analysis_records` VALUES (75, 1, 'image', 'static/uploads\\8ebfa0bdd8b9b9f969e01e7813f8386_1742346447_9463.jpg', 'result_8ebfa0bdd8b9b9f969e01e7813f8386_1742346447_9463.jpg', 'static/@results', 'zdjy_ld', NULL, 0.5163, '2025-03-19 09:07:28');
INSERT INTO `analysis_records` VALUES (76, 1, 'image', 'static/uploads\\7aae7dba5b23fe992e884cbf3546896_1742348304_2914.jpg', 'result_7aae7dba5b23fe992e884cbf3546896_1742348304_2914.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7194, '2025-03-19 09:38:25');
INSERT INTO `analysis_records` VALUES (77, 1, 'image', 'static/uploads\\14e875dc57738b73884e1c8a6a81293_1742348338_4656.jpg', 'result_14e875dc57738b73884e1c8a6a81293_1742348338_4656.jpg', 'static/@results', 'zdjy_gd', NULL, 0.6059, '2025-03-19 09:38:59');
INSERT INTO `analysis_records` VALUES (78, 1, 'camera', 'static/uploads\\camera_1742348536_4793.jpg', 'result_camera_1742348536_4793.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:42:18');
INSERT INTO `analysis_records` VALUES (79, 1, 'camera', 'static/uploads\\camera_1742348537_7532.jpg', 'result_camera_1742348537_7532.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:42:18');
INSERT INTO `analysis_records` VALUES (80, 1, 'camera', 'static/uploads\\camera_1742348538_1754.jpg', 'result_camera_1742348538_1754.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:42:19');
INSERT INTO `analysis_records` VALUES (81, 1, 'camera', 'static/uploads\\camera_1742348539_5281.jpg', 'result_camera_1742348539_5281.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:42:20');
INSERT INTO `analysis_records` VALUES (82, 1, 'camera', 'static/uploads\\camera_1742348540_5036.jpg', 'result_camera_1742348540_5036.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:42:21');
INSERT INTO `analysis_records` VALUES (83, 1, 'camera', 'static/uploads\\camera_1742348541_6643.jpg', 'result_camera_1742348541_6643.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:42:22');
INSERT INTO `analysis_records` VALUES (84, 1, 'camera', 'static/uploads\\camera_1742348542_5490.jpg', 'result_camera_1742348542_5490.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:42:22');
INSERT INTO `analysis_records` VALUES (85, 1, 'camera', 'static/uploads\\camera_1742348543_5724.jpg', 'result_camera_1742348543_5724.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:42:24');
INSERT INTO `analysis_records` VALUES (86, 1, 'camera', 'static/uploads\\camera_1742348544_8078.jpg', 'result_camera_1742348544_8078.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:42:25');
INSERT INTO `analysis_records` VALUES (87, 1, 'camera', 'static/uploads\\camera_1742348545_4591.jpg', 'result_camera_1742348545_4591.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:42:26');
INSERT INTO `analysis_records` VALUES (88, 1, 'camera', 'static/uploads\\camera_1742348546_4573.jpg', 'result_camera_1742348546_4573.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:42:27');
INSERT INTO `analysis_records` VALUES (89, 1, 'camera', 'static/uploads\\camera_1742348547_7632.jpg', 'result_camera_1742348547_7632.jpg', 'static/@results', 'zdjy_ld', NULL, 0.5687, '2025-03-19 09:42:28');
INSERT INTO `analysis_records` VALUES (90, 1, 'camera', 'static/uploads\\camera_1742348548_4366.jpg', 'result_camera_1742348548_4366.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7774, '2025-03-19 09:42:29');
INSERT INTO `analysis_records` VALUES (91, 1, 'camera', 'static/uploads\\camera_1742348549_4865.jpg', 'result_camera_1742348549_4865.jpg', 'static/@results', 'zdjy_ld', NULL, 0.5627, '2025-03-19 09:42:29');
INSERT INTO `analysis_records` VALUES (92, 1, 'camera', 'static/uploads\\camera_1742348550_1449.jpg', 'result_camera_1742348550_1449.jpg', 'static/@results', 'zdjy_ld', NULL, 0.5122, '2025-03-19 09:42:31');
INSERT INTO `analysis_records` VALUES (93, 1, 'camera', 'static/uploads\\camera_1742348551_7761.jpg', 'result_camera_1742348551_7761.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6957, '2025-03-19 09:42:32');
INSERT INTO `analysis_records` VALUES (94, 1, 'camera', 'static/uploads\\camera_1742348552_8583.jpg', 'result_camera_1742348552_8583.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6673, '2025-03-19 09:42:33');
INSERT INTO `analysis_records` VALUES (95, 1, 'camera', 'static/uploads\\camera_1742348553_9171.jpg', 'result_camera_1742348553_9171.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7376, '2025-03-19 09:42:34');
INSERT INTO `analysis_records` VALUES (96, 1, 'camera', 'static/uploads\\camera_1742348554_6722.jpg', 'result_camera_1742348554_6722.jpg', 'static/@results', 'zdjy_ld', NULL, 0.2914, '2025-03-19 09:42:35');
INSERT INTO `analysis_records` VALUES (97, 1, 'camera', 'static/uploads\\camera_1742348555_4316.jpg', 'result_camera_1742348555_4316.jpg', 'static/@results', 'zdjy_ld', NULL, 0.4841, '2025-03-19 09:42:35');
INSERT INTO `analysis_records` VALUES (98, 1, 'camera', 'static/uploads\\camera_1742348556_4812.jpg', 'result_camera_1742348556_4812.jpg', 'static/@results', 'zdjy_ld', NULL, 0.5582, '2025-03-19 09:42:37');
INSERT INTO `analysis_records` VALUES (99, 1, 'camera', 'static/uploads\\camera_1742348557_4296.jpg', 'result_camera_1742348557_4296.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:42:38');
INSERT INTO `analysis_records` VALUES (100, 1, 'camera', 'static/uploads\\camera_1742348558_2984.jpg', 'result_camera_1742348558_2984.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7924, '2025-03-19 09:42:38');
INSERT INTO `analysis_records` VALUES (101, 1, 'camera', 'static/uploads\\camera_1742348559_2573.jpg', 'result_camera_1742348559_2573.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7902, '2025-03-19 09:42:40');
INSERT INTO `analysis_records` VALUES (102, 1, 'camera', 'static/uploads\\camera_1742348560_9647.jpg', 'result_camera_1742348560_9647.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7296, '2025-03-19 09:42:41');
INSERT INTO `analysis_records` VALUES (103, 1, 'camera', 'static/uploads\\camera_1742348561_1929.jpg', 'result_camera_1742348561_1929.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6271, '2025-03-19 09:42:42');
INSERT INTO `analysis_records` VALUES (104, 1, 'camera', 'static/uploads\\camera_1742348562_6132.jpg', 'result_camera_1742348562_6132.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6931, '2025-03-19 09:42:43');
INSERT INTO `analysis_records` VALUES (105, 1, 'camera', 'static/uploads\\camera_1742348563_9705.jpg', 'result_camera_1742348563_9705.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6544, '2025-03-19 09:42:44');
INSERT INTO `analysis_records` VALUES (106, 1, 'camera', 'static/uploads\\camera_1742348564_5446.jpg', 'result_camera_1742348564_5446.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7422, '2025-03-19 09:42:45');
INSERT INTO `analysis_records` VALUES (107, 1, 'camera', 'static/uploads\\camera_1742348565_2156.jpg', 'result_camera_1742348565_2156.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7095, '2025-03-19 09:42:46');
INSERT INTO `analysis_records` VALUES (108, 1, 'camera', 'static/uploads\\camera_1742348566_5762.jpg', 'result_camera_1742348566_5762.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6794, '2025-03-19 09:42:46');
INSERT INTO `analysis_records` VALUES (109, 1, 'camera', 'static/uploads\\camera_1742348567_2981.jpg', 'result_camera_1742348567_2981.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7674, '2025-03-19 09:42:48');
INSERT INTO `analysis_records` VALUES (110, 1, 'camera', 'static/uploads\\camera_1742348568_1592.jpg', 'result_camera_1742348568_1592.jpg', 'static/@results', 'zdjy_ld', NULL, 0.3890, '2025-03-19 09:42:49');
INSERT INTO `analysis_records` VALUES (111, 1, 'camera', 'static/uploads\\camera_1742348569_6809.jpg', 'result_camera_1742348569_6809.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6670, '2025-03-19 09:42:50');
INSERT INTO `analysis_records` VALUES (112, 1, 'camera', 'static/uploads\\camera_1742348570_6572.jpg', 'result_camera_1742348570_6572.jpg', 'static/@results', 'zdjy_ld', NULL, 0.8080, '2025-03-19 09:42:50');
INSERT INTO `analysis_records` VALUES (113, 1, 'camera', 'static/uploads\\camera_1742348571_5692.jpg', 'result_camera_1742348571_5692.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:42:52');
INSERT INTO `analysis_records` VALUES (114, 1, 'camera', 'static/uploads\\camera_1742348572_9227.jpg', 'result_camera_1742348572_9227.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:42:53');
INSERT INTO `analysis_records` VALUES (115, 1, 'camera', 'static/uploads\\camera_1742348591_6474.jpg', 'result_camera_1742348591_6474.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:43:11');
INSERT INTO `analysis_records` VALUES (116, 1, 'camera', 'static/uploads\\camera_1742348592_6861.jpg', 'result_camera_1742348592_6861.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:43:12');
INSERT INTO `analysis_records` VALUES (117, 1, 'camera', 'static/uploads\\camera_1742348593_5622.jpg', 'result_camera_1742348593_5622.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:43:13');
INSERT INTO `analysis_records` VALUES (118, 1, 'camera', 'static/uploads\\camera_1742348594_7489.jpg', 'result_camera_1742348594_7489.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:43:14');
INSERT INTO `analysis_records` VALUES (119, 1, 'camera', 'static/uploads\\camera_1742348595_9242.jpg', 'result_camera_1742348595_9242.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:43:15');
INSERT INTO `analysis_records` VALUES (120, 1, 'camera', 'static/uploads\\camera_1742348596_2524.jpg', 'result_camera_1742348596_2524.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:43:16');
INSERT INTO `analysis_records` VALUES (121, 1, 'camera', 'static/uploads\\camera_1742348597_2856.jpg', 'result_camera_1742348597_2856.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:43:17');
INSERT INTO `analysis_records` VALUES (122, 1, 'camera', 'static/uploads\\camera_1742348598_2797.jpg', 'result_camera_1742348598_2797.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:43:18');
INSERT INTO `analysis_records` VALUES (123, 1, 'camera', 'static/uploads\\camera_1742348599_6123.jpg', 'result_camera_1742348599_6123.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:43:19');
INSERT INTO `analysis_records` VALUES (124, 1, 'camera', 'static/uploads\\camera_1742348600_9844.jpg', 'result_camera_1742348600_9844.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:43:20');
INSERT INTO `analysis_records` VALUES (125, 1, 'camera', 'static/uploads\\camera_1742348601_5965.jpg', 'result_camera_1742348601_5965.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:43:21');
INSERT INTO `analysis_records` VALUES (126, 1, 'camera', 'static/uploads\\camera_1742348602_5625.jpg', 'result_camera_1742348602_5625.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:43:22');
INSERT INTO `analysis_records` VALUES (127, 1, 'camera', 'static/uploads\\camera_1742348603_9228.jpg', 'result_camera_1742348603_9228.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:43:23');
INSERT INTO `analysis_records` VALUES (128, 1, 'image', 'static/uploads\\8f15c092da9fdfc21a6826247b660e7_1742348666_6053.jpg', 'result_8f15c092da9fdfc21a6826247b660e7_1742348666_6053.jpg', 'static/@results', 'zdjy_ld', NULL, 0.5762, '2025-03-19 09:44:27');
INSERT INTO `analysis_records` VALUES (129, 1, 'camera', 'static/uploads\\camera_1742348780_9865.jpg', 'result_camera_1742348780_9865.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:46:23');
INSERT INTO `analysis_records` VALUES (130, 1, 'camera', 'static/uploads\\camera_1742348781_6044.jpg', 'result_camera_1742348781_6044.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:46:23');
INSERT INTO `analysis_records` VALUES (131, 1, 'camera', 'static/uploads\\camera_1742348782_8946.jpg', 'result_camera_1742348782_8946.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:46:23');
INSERT INTO `analysis_records` VALUES (132, 1, 'camera', 'static/uploads\\camera_1742348782_3708.jpg', 'result_camera_1742348782_3708.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:46:24');
INSERT INTO `analysis_records` VALUES (133, 1, 'camera', 'static/uploads\\camera_1742348783_7770.jpg', 'result_camera_1742348783_7770.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:46:24');
INSERT INTO `analysis_records` VALUES (134, 1, 'camera', 'static/uploads\\camera_1742348784_9456.jpg', 'result_camera_1742348784_9456.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:46:24');
INSERT INTO `analysis_records` VALUES (135, 1, 'camera', 'static/uploads\\camera_1742348784_3473.jpg', 'result_camera_1742348784_3473.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:46:25');
INSERT INTO `analysis_records` VALUES (136, 1, 'camera', 'static/uploads\\camera_1742348785_7365.jpg', 'result_camera_1742348785_7365.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:46:26');
INSERT INTO `analysis_records` VALUES (137, 1, 'camera', 'static/uploads\\camera_1742348786_2396.jpg', 'result_camera_1742348786_2396.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:46:26');
INSERT INTO `analysis_records` VALUES (138, 1, 'camera', 'static/uploads\\camera_1742348786_7974.jpg', 'result_camera_1742348786_7974.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:46:27');
INSERT INTO `analysis_records` VALUES (139, 1, 'camera', 'static/uploads\\camera_1742348787_2211.jpg', 'result_camera_1742348787_2211.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:46:28');
INSERT INTO `analysis_records` VALUES (140, 1, 'camera', 'static/uploads\\camera_1742348788_3939.jpg', 'result_camera_1742348788_3939.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:46:28');
INSERT INTO `analysis_records` VALUES (141, 1, 'camera', 'static/uploads\\camera_1742348788_1680.jpg', 'result_camera_1742348788_1680.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:46:29');
INSERT INTO `analysis_records` VALUES (142, 1, 'camera', 'static/uploads\\camera_1742348789_1511.jpg', 'result_camera_1742348789_1511.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:46:30');
INSERT INTO `analysis_records` VALUES (143, 1, 'camera', 'static/uploads\\camera_1742348790_3102.jpg', 'result_camera_1742348790_3102.jpg', 'static/@results', 'zdjy_ld', NULL, 0.8601, '2025-03-19 09:46:30');
INSERT INTO `analysis_records` VALUES (144, 1, 'camera', 'static/uploads\\camera_1742348790_5207.jpg', 'result_camera_1742348790_5207.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:46:31');
INSERT INTO `analysis_records` VALUES (145, 1, 'camera', 'static/uploads\\camera_1742348791_7039.jpg', 'result_camera_1742348791_7039.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7604, '2025-03-19 09:46:32');
INSERT INTO `analysis_records` VALUES (146, 1, 'camera', 'static/uploads\\camera_1742348792_5209.jpg', 'result_camera_1742348792_5209.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6758, '2025-03-19 09:46:32');
INSERT INTO `analysis_records` VALUES (147, 1, 'camera', 'static/uploads\\camera_1742348792_3829.jpg', 'result_camera_1742348792_3829.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:46:33');
INSERT INTO `analysis_records` VALUES (148, 1, 'camera', 'static/uploads\\camera_1742348793_8087.jpg', 'result_camera_1742348793_8087.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:46:34');
INSERT INTO `analysis_records` VALUES (149, 1, 'camera', 'static/uploads\\camera_1742348794_8349.jpg', 'result_camera_1742348794_8349.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:46:34');
INSERT INTO `analysis_records` VALUES (150, 1, 'camera', 'static/uploads\\camera_1742348794_8385.jpg', 'result_camera_1742348794_8385.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:46:35');
INSERT INTO `analysis_records` VALUES (151, 1, 'camera', 'static/uploads\\camera_1742348795_2178.jpg', 'result_camera_1742348795_2178.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:46:36');
INSERT INTO `analysis_records` VALUES (152, 1, 'camera', 'static/uploads\\camera_1742348796_2981.jpg', 'result_camera_1742348796_2981.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:46:36');
INSERT INTO `analysis_records` VALUES (153, 1, 'camera', 'static/uploads\\camera_1742348796_9996.jpg', 'result_camera_1742348796_9996.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:46:37');
INSERT INTO `analysis_records` VALUES (154, 1, 'camera', 'static/uploads\\camera_1742348797_2806.jpg', 'result_camera_1742348797_2806.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:46:38');
INSERT INTO `analysis_records` VALUES (155, 1, 'camera', 'static/uploads\\camera_1742348798_7194.jpg', 'result_camera_1742348798_7194.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7207, '2025-03-19 09:46:38');
INSERT INTO `analysis_records` VALUES (156, 1, 'camera', 'static/uploads\\camera_1742348798_8558.jpg', 'result_camera_1742348798_8558.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6577, '2025-03-19 09:46:39');
INSERT INTO `analysis_records` VALUES (157, 1, 'camera', 'static/uploads\\camera_1742348799_2887.jpg', 'result_camera_1742348799_2887.jpg', 'static/@results', 'zdjy_ld', NULL, 0.3212, '2025-03-19 09:46:40');
INSERT INTO `analysis_records` VALUES (158, 1, 'camera', 'static/uploads\\camera_1742348800_6124.jpg', 'result_camera_1742348800_6124.jpg', 'static/@results', 'zdjy_ld', NULL, 0.2521, '2025-03-19 09:46:40');
INSERT INTO `analysis_records` VALUES (159, 1, 'camera', 'static/uploads\\camera_1742348800_2161.jpg', 'result_camera_1742348800_2161.jpg', 'static/@results', 'zdjy_ld', NULL, 0.3376, '2025-03-19 09:46:41');
INSERT INTO `analysis_records` VALUES (160, 1, 'camera', 'static/uploads\\camera_1742348801_6592.jpg', 'result_camera_1742348801_6592.jpg', 'static/@results', 'zdjy_ld', NULL, 0.5585, '2025-03-19 09:46:42');
INSERT INTO `analysis_records` VALUES (161, 1, 'camera', 'static/uploads\\camera_1742348802_4083.jpg', 'result_camera_1742348802_4083.jpg', 'static/@results', 'zdjy_ld', NULL, 0.3193, '2025-03-19 09:46:42');
INSERT INTO `analysis_records` VALUES (162, 1, 'camera', 'static/uploads\\camera_1742348802_6429.jpg', 'result_camera_1742348802_6429.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:46:43');
INSERT INTO `analysis_records` VALUES (163, 1, 'camera', 'static/uploads\\camera_1742348803_3952.jpg', 'result_camera_1742348803_3952.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7639, '2025-03-19 09:46:44');
INSERT INTO `analysis_records` VALUES (164, 1, 'camera', 'static/uploads\\camera_1742348804_4214.jpg', 'result_camera_1742348804_4214.jpg', 'static/@results', 'zdjy_ld', NULL, 0.5192, '2025-03-19 09:46:44');
INSERT INTO `analysis_records` VALUES (165, 1, 'camera', 'static/uploads\\camera_1742348804_4047.jpg', 'result_camera_1742348804_4047.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7017, '2025-03-19 09:46:45');
INSERT INTO `analysis_records` VALUES (166, 1, 'camera', 'static/uploads\\camera_1742348805_9749.jpg', 'result_camera_1742348805_9749.jpg', 'static/@results', 'zdjy_ld', NULL, 0.2504, '2025-03-19 09:46:46');
INSERT INTO `analysis_records` VALUES (167, 1, 'camera', 'static/uploads\\camera_1742348806_8115.jpg', 'result_camera_1742348806_8115.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:46:46');
INSERT INTO `analysis_records` VALUES (168, 1, 'camera', 'static/uploads\\camera_1742348806_3599.jpg', 'result_camera_1742348806_3599.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:46:47');
INSERT INTO `analysis_records` VALUES (169, 1, 'camera', 'static/uploads\\camera_1742348807_1098.jpg', 'result_camera_1742348807_1098.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:46:48');
INSERT INTO `analysis_records` VALUES (170, 1, 'camera', 'static/uploads\\camera_1742348808_2161.jpg', 'result_camera_1742348808_2161.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:46:48');
INSERT INTO `analysis_records` VALUES (171, 1, 'camera', 'static/uploads\\camera_1742348833_6414.jpg', 'result_camera_1742348833_6414.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:14');
INSERT INTO `analysis_records` VALUES (172, 1, 'camera', 'static/uploads\\camera_1742348834_1921.jpg', 'result_camera_1742348834_1921.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:15');
INSERT INTO `analysis_records` VALUES (173, 1, 'camera', 'static/uploads\\camera_1742348835_1143.jpg', 'result_camera_1742348835_1143.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:16');
INSERT INTO `analysis_records` VALUES (174, 1, 'camera', 'static/uploads\\camera_1742348835_2680.jpg', 'result_camera_1742348835_2680.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:16');
INSERT INTO `analysis_records` VALUES (175, 1, 'camera', 'static/uploads\\camera_1742348836_5714.jpg', 'result_camera_1742348836_5714.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:17');
INSERT INTO `analysis_records` VALUES (176, 1, 'camera', 'static/uploads\\camera_1742348837_7238.jpg', 'result_camera_1742348837_7238.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:18');
INSERT INTO `analysis_records` VALUES (177, 1, 'camera', 'static/uploads\\camera_1742348837_4488.jpg', 'result_camera_1742348837_4488.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:18');
INSERT INTO `analysis_records` VALUES (178, 1, 'camera', 'static/uploads\\camera_1742348838_3919.jpg', 'result_camera_1742348838_3919.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:19');
INSERT INTO `analysis_records` VALUES (179, 1, 'camera', 'static/uploads\\camera_1742348839_4664.jpg', 'result_camera_1742348839_4664.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:20');
INSERT INTO `analysis_records` VALUES (180, 1, 'camera', 'static/uploads\\camera_1742348839_7307.jpg', 'result_camera_1742348839_7307.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:20');
INSERT INTO `analysis_records` VALUES (181, 1, 'camera', 'static/uploads\\camera_1742348840_6485.jpg', 'result_camera_1742348840_6485.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:21');
INSERT INTO `analysis_records` VALUES (182, 1, 'camera', 'static/uploads\\camera_1742348841_4128.jpg', 'result_camera_1742348841_4128.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:22');
INSERT INTO `analysis_records` VALUES (183, 1, 'camera', 'static/uploads\\camera_1742348841_2093.jpg', 'result_camera_1742348841_2093.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:22');
INSERT INTO `analysis_records` VALUES (184, 1, 'camera', 'static/uploads\\camera_1742348842_9826.jpg', 'result_camera_1742348842_9826.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:23');
INSERT INTO `analysis_records` VALUES (185, 1, 'camera', 'static/uploads\\camera_1742348843_4342.jpg', 'result_camera_1742348843_4342.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:23');
INSERT INTO `analysis_records` VALUES (186, 1, 'camera', 'static/uploads\\camera_1742348843_5449.jpg', 'result_camera_1742348843_5449.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:24');
INSERT INTO `analysis_records` VALUES (187, 1, 'camera', 'static/uploads\\camera_1742348844_2917.jpg', 'result_camera_1742348844_2917.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:25');
INSERT INTO `analysis_records` VALUES (188, 1, 'camera', 'static/uploads\\camera_1742348845_3357.jpg', 'result_camera_1742348845_3357.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:26');
INSERT INTO `analysis_records` VALUES (189, 1, 'camera', 'static/uploads\\camera_1742348845_4119.jpg', 'result_camera_1742348845_4119.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:26');
INSERT INTO `analysis_records` VALUES (190, 1, 'camera', 'static/uploads\\camera_1742348846_8647.jpg', 'result_camera_1742348846_8647.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:27');
INSERT INTO `analysis_records` VALUES (191, 1, 'camera', 'static/uploads\\camera_1742348847_6056.jpg', 'result_camera_1742348847_6056.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:28');
INSERT INTO `analysis_records` VALUES (192, 1, 'camera', 'static/uploads\\camera_1742348847_5053.jpg', 'result_camera_1742348847_5053.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:28');
INSERT INTO `analysis_records` VALUES (193, 1, 'camera', 'static/uploads\\camera_1742348848_1579.jpg', 'result_camera_1742348848_1579.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:29');
INSERT INTO `analysis_records` VALUES (194, 1, 'camera', 'static/uploads\\camera_1742348849_6870.jpg', 'result_camera_1742348849_6870.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:30');
INSERT INTO `analysis_records` VALUES (195, 1, 'camera', 'static/uploads\\camera_1742348849_5691.jpg', 'result_camera_1742348849_5691.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:30');
INSERT INTO `analysis_records` VALUES (196, 1, 'camera', 'static/uploads\\camera_1742348850_2533.jpg', 'result_camera_1742348850_2533.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:31');
INSERT INTO `analysis_records` VALUES (197, 1, 'camera', 'static/uploads\\camera_1742348851_5858.jpg', 'result_camera_1742348851_5858.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:32');
INSERT INTO `analysis_records` VALUES (198, 1, 'camera', 'static/uploads\\camera_1742348851_7771.jpg', 'result_camera_1742348851_7771.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:32');
INSERT INTO `analysis_records` VALUES (199, 1, 'camera', 'static/uploads\\camera_1742348852_9983.jpg', 'result_camera_1742348852_9983.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:33');
INSERT INTO `analysis_records` VALUES (200, 1, 'camera', 'static/uploads\\camera_1742348853_1251.jpg', 'result_camera_1742348853_1251.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:34');
INSERT INTO `analysis_records` VALUES (201, 1, 'camera', 'static/uploads\\camera_1742348853_6188.jpg', 'result_camera_1742348853_6188.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:34');
INSERT INTO `analysis_records` VALUES (202, 1, 'camera', 'static/uploads\\camera_1742348854_8297.jpg', 'result_camera_1742348854_8297.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:35');
INSERT INTO `analysis_records` VALUES (203, 1, 'camera', 'static/uploads\\camera_1742348855_1701.jpg', 'result_camera_1742348855_1701.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:36');
INSERT INTO `analysis_records` VALUES (204, 1, 'camera', 'static/uploads\\camera_1742348855_3645.jpg', 'result_camera_1742348855_3645.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:36');
INSERT INTO `analysis_records` VALUES (205, 1, 'camera', 'static/uploads\\camera_1742348856_2620.jpg', 'result_camera_1742348856_2620.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:37');
INSERT INTO `analysis_records` VALUES (206, 1, 'camera', 'static/uploads\\camera_1742348857_6422.jpg', 'result_camera_1742348857_6422.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:38');
INSERT INTO `analysis_records` VALUES (207, 1, 'camera', 'static/uploads\\camera_1742348857_1624.jpg', 'result_camera_1742348857_1624.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:38');
INSERT INTO `analysis_records` VALUES (208, 1, 'camera', 'static/uploads\\camera_1742348858_4017.jpg', 'result_camera_1742348858_4017.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:39');
INSERT INTO `analysis_records` VALUES (209, 1, 'camera', 'static/uploads\\camera_1742348859_7095.jpg', 'result_camera_1742348859_7095.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:39');
INSERT INTO `analysis_records` VALUES (210, 1, 'camera', 'static/uploads\\camera_1742348859_2234.jpg', 'result_camera_1742348859_2234.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:40');
INSERT INTO `analysis_records` VALUES (211, 1, 'camera', 'static/uploads\\camera_1742348860_9103.jpg', 'result_camera_1742348860_9103.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:41');
INSERT INTO `analysis_records` VALUES (212, 1, 'camera', 'static/uploads\\camera_1742348861_2908.jpg', 'result_camera_1742348861_2908.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:42');
INSERT INTO `analysis_records` VALUES (213, 1, 'camera', 'static/uploads\\camera_1742348861_7276.jpg', 'result_camera_1742348861_7276.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:42');
INSERT INTO `analysis_records` VALUES (214, 1, 'camera', 'static/uploads\\camera_1742348863_2897.jpg', 'result_camera_1742348863_2897.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:44');
INSERT INTO `analysis_records` VALUES (215, 1, 'camera', 'static/uploads\\camera_1742348863_4132.jpg', 'result_camera_1742348863_4132.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:44');
INSERT INTO `analysis_records` VALUES (216, 1, 'camera', 'static/uploads\\camera_1742348864_7602.jpg', 'result_camera_1742348864_7602.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:45');
INSERT INTO `analysis_records` VALUES (217, 1, 'camera', 'static/uploads\\camera_1742348865_3865.jpg', 'result_camera_1742348865_3865.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:46');
INSERT INTO `analysis_records` VALUES (218, 1, 'camera', 'static/uploads\\camera_1742348866_5778.jpg', 'result_camera_1742348866_5778.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:46');
INSERT INTO `analysis_records` VALUES (219, 1, 'camera', 'static/uploads\\camera_1742348866_3574.jpg', 'result_camera_1742348866_3574.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:47');
INSERT INTO `analysis_records` VALUES (220, 1, 'camera', 'static/uploads\\camera_1742348867_5955.jpg', 'result_camera_1742348867_5955.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:47');
INSERT INTO `analysis_records` VALUES (221, 1, 'camera', 'static/uploads\\camera_1742348868_4166.jpg', 'result_camera_1742348868_4166.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:48');
INSERT INTO `analysis_records` VALUES (222, 1, 'camera', 'static/uploads\\camera_1742348868_8239.jpg', 'result_camera_1742348868_8239.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:49');
INSERT INTO `analysis_records` VALUES (223, 1, 'camera', 'static/uploads\\camera_1742348869_2456.jpg', 'result_camera_1742348869_2456.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:49');
INSERT INTO `analysis_records` VALUES (224, 1, 'camera', 'static/uploads\\camera_1742348870_7975.jpg', 'result_camera_1742348870_7975.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:50');
INSERT INTO `analysis_records` VALUES (225, 1, 'camera', 'static/uploads\\camera_1742348870_2201.jpg', 'result_camera_1742348870_2201.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:51');
INSERT INTO `analysis_records` VALUES (226, 1, 'camera', 'static/uploads\\camera_1742348871_5802.jpg', 'result_camera_1742348871_5802.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:47:51');
INSERT INTO `analysis_records` VALUES (227, 1, 'image', 'static/uploads\\2b303d34b61a3e92e8fe5cbb52577b6_1742348983_2113.jpg', 'result_2b303d34b61a3e92e8fe5cbb52577b6_1742348983_2113.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7440, '2025-03-19 09:49:45');
INSERT INTO `analysis_records` VALUES (228, 1, 'camera', 'static/uploads\\camera_1742348993_4881.jpg', 'result_camera_1742348993_4881.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:49:53');
INSERT INTO `analysis_records` VALUES (229, 1, 'camera', 'static/uploads\\camera_1742348994_4733.jpg', 'result_camera_1742348994_4733.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:49:54');
INSERT INTO `analysis_records` VALUES (230, 1, 'camera', 'static/uploads\\camera_1742348994_4142.jpg', 'result_camera_1742348994_4142.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:49:55');
INSERT INTO `analysis_records` VALUES (231, 1, 'camera', 'static/uploads\\camera_1742348995_3117.jpg', 'result_camera_1742348995_3117.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:49:55');
INSERT INTO `analysis_records` VALUES (232, 1, 'camera', 'static/uploads\\camera_1742348996_9720.jpg', 'result_camera_1742348996_9720.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:49:56');
INSERT INTO `analysis_records` VALUES (233, 1, 'camera', 'static/uploads\\camera_1742348996_8676.jpg', 'result_camera_1742348996_8676.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7158, '2025-03-19 09:49:57');
INSERT INTO `analysis_records` VALUES (234, 1, 'camera', 'static/uploads\\camera_1742348997_2778.jpg', 'result_camera_1742348997_2778.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7511, '2025-03-19 09:49:57');
INSERT INTO `analysis_records` VALUES (235, 1, 'camera', 'static/uploads\\camera_1742348998_9105.jpg', 'result_camera_1742348998_9105.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6652, '2025-03-19 09:49:58');
INSERT INTO `analysis_records` VALUES (236, 1, 'camera', 'static/uploads\\camera_1742348998_9200.jpg', 'result_camera_1742348998_9200.jpg', 'static/@results', 'zdjy_ld', NULL, 0.8193, '2025-03-19 09:49:59');
INSERT INTO `analysis_records` VALUES (237, 1, 'camera', 'static/uploads\\camera_1742348999_8835.jpg', 'result_camera_1742348999_8835.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7461, '2025-03-19 09:49:59');
INSERT INTO `analysis_records` VALUES (238, 1, 'camera', 'static/uploads\\camera_1742349000_2406.jpg', 'result_camera_1742349000_2406.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7521, '2025-03-19 09:50:00');
INSERT INTO `analysis_records` VALUES (239, 1, 'camera', 'static/uploads\\camera_1742349000_2845.jpg', 'result_camera_1742349000_2845.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7164, '2025-03-19 09:50:01');
INSERT INTO `analysis_records` VALUES (240, 1, 'camera', 'static/uploads\\camera_1742349001_5163.jpg', 'result_camera_1742349001_5163.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7150, '2025-03-19 09:50:01');
INSERT INTO `analysis_records` VALUES (241, 1, 'camera', 'static/uploads\\camera_1742349002_5115.jpg', 'result_camera_1742349002_5115.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7237, '2025-03-19 09:50:02');
INSERT INTO `analysis_records` VALUES (242, 1, 'camera', 'static/uploads\\camera_1742349002_7360.jpg', 'result_camera_1742349002_7360.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:50:03');
INSERT INTO `analysis_records` VALUES (243, 1, 'camera', 'static/uploads\\camera_1742349003_8880.jpg', 'result_camera_1742349003_8880.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:50:03');
INSERT INTO `analysis_records` VALUES (244, 1, 'camera', 'static/uploads\\camera_1742349004_6840.jpg', 'result_camera_1742349004_6840.jpg', 'static/@results', 'zdjy_ld', NULL, 0.4869, '2025-03-19 09:50:04');
INSERT INTO `analysis_records` VALUES (245, 1, 'camera', 'static/uploads\\camera_1742349004_5702.jpg', 'result_camera_1742349004_5702.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7687, '2025-03-19 09:50:05');
INSERT INTO `analysis_records` VALUES (246, 1, 'camera', 'static/uploads\\camera_1742349005_1100.jpg', 'result_camera_1742349005_1100.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7752, '2025-03-19 09:50:05');
INSERT INTO `analysis_records` VALUES (247, 1, 'camera', 'static/uploads\\camera_1742349006_9768.jpg', 'result_camera_1742349006_9768.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7442, '2025-03-19 09:50:06');
INSERT INTO `analysis_records` VALUES (248, 1, 'camera', 'static/uploads\\camera_1742349006_2524.jpg', 'result_camera_1742349006_2524.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:50:07');
INSERT INTO `analysis_records` VALUES (249, 1, 'camera', 'static/uploads\\camera_1742349007_5669.jpg', 'result_camera_1742349007_5669.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7322, '2025-03-19 09:50:07');
INSERT INTO `analysis_records` VALUES (250, 1, 'camera', 'static/uploads\\camera_1742349008_5751.jpg', 'result_camera_1742349008_5751.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7627, '2025-03-19 09:50:08');
INSERT INTO `analysis_records` VALUES (251, 1, 'camera', 'static/uploads\\camera_1742349008_5503.jpg', 'result_camera_1742349008_5503.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6834, '2025-03-19 09:50:09');
INSERT INTO `analysis_records` VALUES (252, 1, 'camera', 'static/uploads\\camera_1742349009_6255.jpg', 'result_camera_1742349009_6255.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6395, '2025-03-19 09:50:09');
INSERT INTO `analysis_records` VALUES (253, 1, 'camera', 'static/uploads\\camera_1742349010_7051.jpg', 'result_camera_1742349010_7051.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7189, '2025-03-19 09:50:10');
INSERT INTO `analysis_records` VALUES (254, 1, 'camera', 'static/uploads\\camera_1742349010_5745.jpg', 'result_camera_1742349010_5745.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7154, '2025-03-19 09:50:11');
INSERT INTO `analysis_records` VALUES (255, 1, 'camera', 'static/uploads\\camera_1742349011_6968.jpg', 'result_camera_1742349011_6968.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7408, '2025-03-19 09:50:11');
INSERT INTO `analysis_records` VALUES (256, 1, 'camera', 'static/uploads\\camera_1742349012_4852.jpg', 'result_camera_1742349012_4852.jpg', 'static/@results', 'zdjy_ld', NULL, 0.5290, '2025-03-19 09:50:12');
INSERT INTO `analysis_records` VALUES (257, 1, 'camera', 'static/uploads\\camera_1742349012_3982.jpg', 'result_camera_1742349012_3982.jpg', 'static/@results', 'zdjy_ld', NULL, 0.5642, '2025-03-19 09:50:13');
INSERT INTO `analysis_records` VALUES (258, 1, 'camera', 'static/uploads\\camera_1742349013_2951.jpg', 'result_camera_1742349013_2951.jpg', 'static/@results', 'zdjy_ld', NULL, 0.4867, '2025-03-19 09:50:13');
INSERT INTO `analysis_records` VALUES (259, 1, 'camera', 'static/uploads\\camera_1742349014_9664.jpg', 'result_camera_1742349014_9664.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:50:14');
INSERT INTO `analysis_records` VALUES (260, 1, 'camera', 'static/uploads\\camera_1742349014_4389.jpg', 'result_camera_1742349014_4389.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6710, '2025-03-19 09:50:15');
INSERT INTO `analysis_records` VALUES (261, 1, 'camera', 'static/uploads\\camera_1742349015_4722.jpg', 'result_camera_1742349015_4722.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7659, '2025-03-19 09:50:15');
INSERT INTO `analysis_records` VALUES (262, 1, 'camera', 'static/uploads\\camera_1742349016_3649.jpg', 'result_camera_1742349016_3649.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6694, '2025-03-19 09:50:16');
INSERT INTO `analysis_records` VALUES (263, 1, 'camera', 'static/uploads\\camera_1742349016_6788.jpg', 'result_camera_1742349016_6788.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7936, '2025-03-19 09:50:17');
INSERT INTO `analysis_records` VALUES (264, 1, 'camera', 'static/uploads\\camera_1742349017_6859.jpg', 'result_camera_1742349017_6859.jpg', 'static/@results', 'zdjy_ld', NULL, 0.8083, '2025-03-19 09:50:17');
INSERT INTO `analysis_records` VALUES (265, 1, 'camera', 'static/uploads\\camera_1742349018_6034.jpg', 'result_camera_1742349018_6034.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:50:18');
INSERT INTO `analysis_records` VALUES (266, 1, 'camera', 'static/uploads\\camera_1742349018_1636.jpg', 'result_camera_1742349018_1636.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:50:19');
INSERT INTO `analysis_records` VALUES (267, 1, 'camera', 'static/uploads\\camera_1742349019_1083.jpg', 'result_camera_1742349019_1083.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:50:19');
INSERT INTO `analysis_records` VALUES (268, 1, 'camera', 'static/uploads\\camera_1742349020_7401.jpg', 'result_camera_1742349020_7401.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:50:20');
INSERT INTO `analysis_records` VALUES (269, 1, 'image', 'static/uploads\\6d631a0e0f1e670ca026d9ded2f243a_1742349047_2872.jpg', 'result_6d631a0e0f1e670ca026d9ded2f243a_1742349047_2872.jpg', 'static/@results', 'zdjy_ld', NULL, 0.8244, '2025-03-19 09:50:47');
INSERT INTO `analysis_records` VALUES (270, 1, 'camera', 'static/uploads\\camera_1742349077_9246.jpg', 'result_camera_1742349077_9246.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:51:17');
INSERT INTO `analysis_records` VALUES (271, 1, 'camera', 'static/uploads\\camera_1742349078_8395.jpg', 'result_camera_1742349078_8395.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:51:18');
INSERT INTO `analysis_records` VALUES (272, 1, 'camera', 'static/uploads\\camera_1742349078_2964.jpg', 'result_camera_1742349078_2964.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:51:18');
INSERT INTO `analysis_records` VALUES (273, 1, 'camera', 'static/uploads\\camera_1742349079_3185.jpg', 'result_camera_1742349079_3185.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:51:19');
INSERT INTO `analysis_records` VALUES (274, 1, 'camera', 'static/uploads\\camera_1742349080_7362.jpg', 'result_camera_1742349080_7362.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:51:20');
INSERT INTO `analysis_records` VALUES (275, 1, 'camera', 'static/uploads\\camera_1742349080_6783.jpg', 'result_camera_1742349080_6783.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:51:21');
INSERT INTO `analysis_records` VALUES (276, 1, 'camera', 'static/uploads\\camera_1742349081_2804.jpg', 'result_camera_1742349081_2804.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:51:21');
INSERT INTO `analysis_records` VALUES (277, 1, 'camera', 'static/uploads\\camera_1742349082_1775.jpg', 'result_camera_1742349082_1775.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:51:22');
INSERT INTO `analysis_records` VALUES (278, 1, 'camera', 'static/uploads\\camera_1742349082_7304.jpg', 'result_camera_1742349082_7304.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:51:23');
INSERT INTO `analysis_records` VALUES (279, 1, 'camera', 'static/uploads\\camera_1742349083_4946.jpg', 'result_camera_1742349083_4946.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:51:23');
INSERT INTO `analysis_records` VALUES (280, 1, 'camera', 'static/uploads\\camera_1742349084_5001.jpg', 'result_camera_1742349084_5001.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:51:24');
INSERT INTO `analysis_records` VALUES (281, 1, 'camera', 'static/uploads\\camera_1742349084_3572.jpg', 'result_camera_1742349084_3572.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:51:25');
INSERT INTO `analysis_records` VALUES (282, 1, 'camera', 'static/uploads\\camera_1742349085_2193.jpg', 'result_camera_1742349085_2193.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:51:25');
INSERT INTO `analysis_records` VALUES (283, 1, 'camera', 'static/uploads\\camera_1742349086_4037.jpg', 'result_camera_1742349086_4037.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:51:26');
INSERT INTO `analysis_records` VALUES (284, 1, 'camera', 'static/uploads\\camera_1742349086_2101.jpg', 'result_camera_1742349086_2101.jpg', 'static/@results', 'zdjy_ld', NULL, 0.2804, '2025-03-19 09:51:27');
INSERT INTO `analysis_records` VALUES (285, 1, 'camera', 'static/uploads\\camera_1742349087_4561.jpg', 'result_camera_1742349087_4561.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6574, '2025-03-19 09:51:27');
INSERT INTO `analysis_records` VALUES (286, 1, 'camera', 'static/uploads\\camera_1742349088_7464.jpg', 'result_camera_1742349088_7464.jpg', 'static/@results', 'zdjy_ld', NULL, 0.8177, '2025-03-19 09:51:28');
INSERT INTO `analysis_records` VALUES (287, 1, 'camera', 'static/uploads\\camera_1742349088_7169.jpg', 'result_camera_1742349088_7169.jpg', 'static/@results', 'zdjy_ld', NULL, 0.4353, '2025-03-19 09:51:29');
INSERT INTO `analysis_records` VALUES (288, 1, 'camera', 'static/uploads\\camera_1742349089_2904.jpg', 'result_camera_1742349089_2904.jpg', 'static/@results', 'zdjy_ld', NULL, 0.3030, '2025-03-19 09:51:29');
INSERT INTO `analysis_records` VALUES (289, 1, 'camera', 'static/uploads\\camera_1742349090_6142.jpg', 'result_camera_1742349090_6142.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7630, '2025-03-19 09:51:30');
INSERT INTO `analysis_records` VALUES (290, 1, 'camera', 'static/uploads\\camera_1742349090_8319.jpg', 'result_camera_1742349090_8319.jpg', 'static/@results', 'zdjy_ld', NULL, 0.8348, '2025-03-19 09:51:31');
INSERT INTO `analysis_records` VALUES (291, 1, 'camera', 'static/uploads\\camera_1742349091_7728.jpg', 'result_camera_1742349091_7728.jpg', 'static/@results', 'zdjy_ld', NULL, 0.8403, '2025-03-19 09:51:31');
INSERT INTO `analysis_records` VALUES (292, 1, 'camera', 'static/uploads\\camera_1742349092_7107.jpg', 'result_camera_1742349092_7107.jpg', 'static/@results', 'zdjy_ld', NULL, 0.8244, '2025-03-19 09:51:32');
INSERT INTO `analysis_records` VALUES (293, 1, 'camera', 'static/uploads\\camera_1742349092_2007.jpg', 'result_camera_1742349092_2007.jpg', 'static/@results', 'zdjy_ld', NULL, 0.8234, '2025-03-19 09:51:33');
INSERT INTO `analysis_records` VALUES (294, 1, 'camera', 'static/uploads\\camera_1742349093_5799.jpg', 'result_camera_1742349093_5799.jpg', 'static/@results', 'zdjy_ld', NULL, 0.8292, '2025-03-19 09:51:33');
INSERT INTO `analysis_records` VALUES (295, 1, 'camera', 'static/uploads\\camera_1742349094_4007.jpg', 'result_camera_1742349094_4007.jpg', 'static/@results', 'zdjy_ld', NULL, 0.3039, '2025-03-19 09:51:34');
INSERT INTO `analysis_records` VALUES (296, 1, 'camera', 'static/uploads\\camera_1742349094_5533.jpg', 'result_camera_1742349094_5533.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6455, '2025-03-19 09:51:35');
INSERT INTO `analysis_records` VALUES (297, 1, 'camera', 'static/uploads\\camera_1742349095_5922.jpg', 'result_camera_1742349095_5922.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7897, '2025-03-19 09:51:35');
INSERT INTO `analysis_records` VALUES (298, 1, 'camera', 'static/uploads\\camera_1742349096_7114.jpg', 'result_camera_1742349096_7114.jpg', 'static/@results', 'zdjy_ld', NULL, 0.8122, '2025-03-19 09:51:36');
INSERT INTO `analysis_records` VALUES (299, 1, 'camera', 'static/uploads\\camera_1742349096_8620.jpg', 'result_camera_1742349096_8620.jpg', 'static/@results', 'zdjy_ld', NULL, 0.8116, '2025-03-19 09:51:37');
INSERT INTO `analysis_records` VALUES (300, 1, 'camera', 'static/uploads\\camera_1742349097_9461.jpg', 'result_camera_1742349097_9461.jpg', 'static/@results', 'zdjy_ld', NULL, 0.8133, '2025-03-19 09:51:37');
INSERT INTO `analysis_records` VALUES (301, 1, 'camera', 'static/uploads\\camera_1742349098_9225.jpg', 'result_camera_1742349098_9225.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:51:38');
INSERT INTO `analysis_records` VALUES (302, 1, 'camera', 'static/uploads\\camera_1742349098_9671.jpg', 'result_camera_1742349098_9671.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:51:39');
INSERT INTO `analysis_records` VALUES (303, 1, 'camera', 'static/uploads\\camera_1742349099_4386.jpg', 'result_camera_1742349099_4386.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:51:39');
INSERT INTO `analysis_records` VALUES (304, 1, 'camera', 'static/uploads\\camera_1742349100_2172.jpg', 'result_camera_1742349100_2172.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:51:40');
INSERT INTO `analysis_records` VALUES (305, 1, 'camera', 'static/uploads\\camera_1742349361_9524.jpg', 'result_camera_1742349361_9524.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:56:03');
INSERT INTO `analysis_records` VALUES (306, 1, 'camera', 'static/uploads\\camera_1742349362_7205.jpg', 'result_camera_1742349362_7205.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:56:04');
INSERT INTO `analysis_records` VALUES (307, 1, 'camera', 'static/uploads\\camera_1742349364_1047.jpg', 'result_camera_1742349364_1047.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:56:04');
INSERT INTO `analysis_records` VALUES (308, 1, 'camera', 'static/uploads\\camera_1742349366_6281.jpg', 'result_camera_1742349366_6281.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:56:06');
INSERT INTO `analysis_records` VALUES (309, 1, 'camera', 'static/uploads\\camera_1742349368_5280.jpg', 'result_camera_1742349368_5280.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:56:08');
INSERT INTO `analysis_records` VALUES (310, 1, 'camera', 'static/uploads\\camera_1742349370_1101.jpg', 'result_camera_1742349370_1101.jpg', 'static/@results', 'zdjy_ld', NULL, 0.8014, '2025-03-19 09:56:10');
INSERT INTO `analysis_records` VALUES (311, 1, 'camera', 'static/uploads\\camera_1742349372_2741.jpg', 'result_camera_1742349372_2741.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7167, '2025-03-19 09:56:12');
INSERT INTO `analysis_records` VALUES (312, 1, 'camera', 'static/uploads\\camera_1742349374_9090.jpg', 'result_camera_1742349374_9090.jpg', 'static/@results', 'zdjy_ld', NULL, 0.3620, '2025-03-19 09:56:14');
INSERT INTO `analysis_records` VALUES (313, 1, 'camera', 'static/uploads\\camera_1742349376_4855.jpg', 'result_camera_1742349376_4855.jpg', 'static/@results', 'zdjy_ld', NULL, 0.3105, '2025-03-19 09:56:16');
INSERT INTO `analysis_records` VALUES (314, 1, 'camera', 'static/uploads\\camera_1742349378_8827.jpg', 'result_camera_1742349378_8827.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:56:18');
INSERT INTO `analysis_records` VALUES (315, 1, 'camera', 'static/uploads\\camera_1742349380_7030.jpg', 'result_camera_1742349380_7030.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:56:20');
INSERT INTO `analysis_records` VALUES (316, 1, 'camera', 'static/uploads\\camera_1742349382_7268.jpg', 'result_camera_1742349382_7268.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:56:22');
INSERT INTO `analysis_records` VALUES (317, 1, 'camera', 'static/uploads\\camera_1742349578_8482.jpg', 'result_camera_1742349578_8482.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:59:39');
INSERT INTO `analysis_records` VALUES (318, 1, 'camera', 'static/uploads\\camera_1742349579_1022.jpg', 'result_camera_1742349579_1022.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:59:39');
INSERT INTO `analysis_records` VALUES (319, 1, 'camera', 'static/uploads\\camera_1742349579_8122.jpg', 'result_camera_1742349579_8122.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:59:40');
INSERT INTO `analysis_records` VALUES (320, 1, 'camera', 'static/uploads\\camera_1742349580_1172.jpg', 'result_camera_1742349580_1172.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:59:40');
INSERT INTO `analysis_records` VALUES (321, 1, 'camera', 'static/uploads\\camera_1742349581_3342.jpg', 'result_camera_1742349581_3342.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:59:42');
INSERT INTO `analysis_records` VALUES (322, 1, 'camera', 'static/uploads\\camera_1742349582_2301.jpg', 'result_camera_1742349582_2301.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:59:42');
INSERT INTO `analysis_records` VALUES (323, 1, 'camera', 'static/uploads\\camera_1742349583_5093.jpg', 'result_camera_1742349583_5093.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:59:44');
INSERT INTO `analysis_records` VALUES (324, 1, 'camera', 'static/uploads\\camera_1742349584_4679.jpg', 'result_camera_1742349584_4679.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:59:44');
INSERT INTO `analysis_records` VALUES (325, 1, 'camera', 'static/uploads\\camera_1742349586_8190.jpg', 'result_camera_1742349586_8190.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:59:46');
INSERT INTO `analysis_records` VALUES (326, 1, 'camera', 'static/uploads\\camera_1742349586_6455.jpg', 'result_camera_1742349586_6455.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:59:46');
INSERT INTO `analysis_records` VALUES (327, 1, 'camera', 'static/uploads\\camera_1742349587_5892.jpg', 'result_camera_1742349587_5892.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:59:48');
INSERT INTO `analysis_records` VALUES (328, 1, 'camera', 'static/uploads\\camera_1742349588_3915.jpg', 'result_camera_1742349588_3915.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:59:48');
INSERT INTO `analysis_records` VALUES (329, 1, 'camera', 'static/uploads\\camera_1742349589_2595.jpg', 'result_camera_1742349589_2595.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:59:50');
INSERT INTO `analysis_records` VALUES (330, 1, 'camera', 'static/uploads\\camera_1742349590_3951.jpg', 'result_camera_1742349590_3951.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:59:50');
INSERT INTO `analysis_records` VALUES (331, 1, 'camera', 'static/uploads\\camera_1742349591_2510.jpg', 'result_camera_1742349591_2510.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:59:52');
INSERT INTO `analysis_records` VALUES (332, 1, 'camera', 'static/uploads\\camera_1742349592_8740.jpg', 'result_camera_1742349592_8740.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 09:59:52');
INSERT INTO `analysis_records` VALUES (333, 1, 'camera', 'static/uploads\\camera_1742349604_9081.jpg', 'result_camera_1742349604_9081.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:00:05');
INSERT INTO `analysis_records` VALUES (334, 1, 'camera', 'static/uploads\\camera_1742349604_2455.jpg', 'result_camera_1742349604_2455.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:00:05');
INSERT INTO `analysis_records` VALUES (335, 1, 'camera', 'static/uploads\\camera_1742349605_4726.jpg', 'result_camera_1742349605_4726.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:00:06');
INSERT INTO `analysis_records` VALUES (336, 1, 'camera', 'static/uploads\\camera_1742349605_9801.jpg', 'result_camera_1742349605_9801.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:00:06');
INSERT INTO `analysis_records` VALUES (337, 1, 'camera', 'static/uploads\\camera_1742349607_2946.jpg', 'result_camera_1742349607_2946.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:00:08');
INSERT INTO `analysis_records` VALUES (338, 1, 'camera', 'static/uploads\\camera_1742349607_7603.jpg', 'result_camera_1742349607_7603.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:00:08');
INSERT INTO `analysis_records` VALUES (339, 1, 'camera', 'static/uploads\\camera_1742349609_8526.jpg', 'result_camera_1742349609_8526.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:00:10');
INSERT INTO `analysis_records` VALUES (340, 1, 'camera', 'static/uploads\\camera_1742349609_6115.jpg', 'result_camera_1742349609_6115.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:00:10');
INSERT INTO `analysis_records` VALUES (341, 1, 'camera', 'static/uploads\\camera_1742349612_1897.jpg', 'result_camera_1742349612_1897.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:00:13');
INSERT INTO `analysis_records` VALUES (342, 1, 'camera', 'static/uploads\\camera_1742349612_6019.jpg', 'result_camera_1742349612_6019.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:00:13');
INSERT INTO `analysis_records` VALUES (343, 1, 'camera', 'static/uploads\\camera_1742349614_9832.jpg', 'result_camera_1742349614_9832.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:00:15');
INSERT INTO `analysis_records` VALUES (344, 1, 'camera', 'static/uploads\\camera_1742349614_9515.jpg', 'result_camera_1742349614_9515.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:00:15');
INSERT INTO `analysis_records` VALUES (345, 1, 'camera', 'static/uploads\\camera_1742349616_2728.jpg', 'result_camera_1742349616_2728.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:00:16');
INSERT INTO `analysis_records` VALUES (346, 1, 'camera', 'static/uploads\\camera_1742349616_2454.jpg', 'result_camera_1742349616_2454.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:00:17');
INSERT INTO `analysis_records` VALUES (347, 1, 'camera', 'static/uploads\\camera_1742349618_8905.jpg', 'result_camera_1742349618_8905.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:00:18');
INSERT INTO `analysis_records` VALUES (348, 1, 'camera', 'static/uploads\\camera_1742349618_6239.jpg', 'result_camera_1742349618_6239.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:00:19');
INSERT INTO `analysis_records` VALUES (349, 1, 'camera', 'static/uploads\\camera_1742349620_5739.jpg', 'result_camera_1742349620_5739.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:00:20');
INSERT INTO `analysis_records` VALUES (350, 1, 'camera', 'static/uploads\\camera_1742349620_3307.jpg', 'result_camera_1742349620_3307.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:00:21');
INSERT INTO `analysis_records` VALUES (351, 1, 'camera', 'static/uploads\\camera_1742350222_7394.jpg', 'result_camera_1742350222_7394.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:10:25');
INSERT INTO `analysis_records` VALUES (352, 1, 'camera', 'static/uploads\\camera_1742350222_5209.jpg', 'result_camera_1742350222_5209.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:10:26');
INSERT INTO `analysis_records` VALUES (353, 1, 'camera', 'static/uploads\\camera_1742350223_2306.jpg', 'result_camera_1742350223_2306.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:10:26');
INSERT INTO `analysis_records` VALUES (354, 1, 'camera', 'static/uploads\\camera_1742350225_4461.jpg', 'result_camera_1742350225_4461.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:10:26');
INSERT INTO `analysis_records` VALUES (355, 1, 'camera', 'static/uploads\\camera_1742350227_9136.jpg', 'result_camera_1742350227_9136.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:10:28');
INSERT INTO `analysis_records` VALUES (356, 1, 'camera', 'static/uploads\\camera_1742350229_2781.jpg', 'result_camera_1742350229_2781.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:10:30');
INSERT INTO `analysis_records` VALUES (357, 1, 'camera', 'static/uploads\\camera_1742350231_1750.jpg', 'result_camera_1742350231_1750.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:10:32');
INSERT INTO `analysis_records` VALUES (358, 1, 'camera', 'static/uploads\\camera_1742350233_7651.jpg', 'result_camera_1742350233_7651.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:10:34');
INSERT INTO `analysis_records` VALUES (359, 1, 'camera', 'static/uploads\\camera_1742350235_6106.jpg', 'result_camera_1742350235_6106.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:10:36');
INSERT INTO `analysis_records` VALUES (360, 1, 'camera', 'static/uploads\\camera_1742350237_6373.jpg', 'result_camera_1742350237_6373.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:10:38');
INSERT INTO `analysis_records` VALUES (361, 1, 'camera', 'static/uploads\\camera_1742350239_6130.jpg', 'result_camera_1742350239_6130.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:10:40');
INSERT INTO `analysis_records` VALUES (362, 1, 'camera', 'static/uploads\\camera_1742350241_4438.jpg', 'result_camera_1742350241_4438.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:10:42');
INSERT INTO `analysis_records` VALUES (363, 1, 'camera', 'static/uploads\\camera_1742350243_1019.jpg', 'result_camera_1742350243_1019.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:10:44');
INSERT INTO `analysis_records` VALUES (364, 1, 'camera', 'static/uploads\\camera_1742350245_2210.jpg', 'result_camera_1742350245_2210.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:10:46');
INSERT INTO `analysis_records` VALUES (365, 1, 'camera', 'static/uploads\\camera_1742350247_2472.jpg', 'result_camera_1742350247_2472.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:10:48');
INSERT INTO `analysis_records` VALUES (366, 1, 'camera', 'static/uploads\\camera_1742350249_2673.jpg', 'result_camera_1742350249_2673.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7337, '2025-03-19 10:10:50');
INSERT INTO `analysis_records` VALUES (367, 1, 'camera', 'static/uploads\\camera_1742350251_2427.jpg', 'result_camera_1742350251_2427.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7640, '2025-03-19 10:10:52');
INSERT INTO `analysis_records` VALUES (368, 1, 'camera', 'static/uploads\\camera_1742350253_6810.jpg', 'result_camera_1742350253_6810.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6245, '2025-03-19 10:10:54');
INSERT INTO `analysis_records` VALUES (369, 1, 'camera', 'static/uploads\\camera_1742350255_3243.jpg', 'result_camera_1742350255_3243.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6283, '2025-03-19 10:10:56');
INSERT INTO `analysis_records` VALUES (370, 1, 'camera', 'static/uploads\\camera_1742350257_1954.jpg', 'result_camera_1742350257_1954.jpg', 'static/@results', 'zdjy_ld', NULL, 0.5637, '2025-03-19 10:10:58');
INSERT INTO `analysis_records` VALUES (371, 1, 'camera', 'static/uploads\\camera_1742350259_2160.jpg', 'result_camera_1742350259_2160.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6826, '2025-03-19 10:11:00');
INSERT INTO `analysis_records` VALUES (372, 1, 'camera', 'static/uploads\\camera_1742350261_8951.jpg', 'result_camera_1742350261_8951.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:11:02');
INSERT INTO `analysis_records` VALUES (373, 1, 'camera', 'static/uploads\\camera_1742350263_4682.jpg', 'result_camera_1742350263_4682.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:11:04');
INSERT INTO `analysis_records` VALUES (374, 1, 'camera', 'static/uploads\\camera_1742350436_5173.jpg', 'result_camera_1742350436_5173.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:13:56');
INSERT INTO `analysis_records` VALUES (375, 1, 'camera', 'static/uploads\\camera_1742350436_8394.jpg', 'result_camera_1742350436_8394.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:13:56');
INSERT INTO `analysis_records` VALUES (376, 1, 'camera', 'static/uploads\\camera_1742350437_8982.jpg', 'result_camera_1742350437_8982.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:13:57');
INSERT INTO `analysis_records` VALUES (377, 1, 'camera', 'static/uploads\\camera_1742350439_9562.jpg', 'result_camera_1742350439_9562.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:13:59');
INSERT INTO `analysis_records` VALUES (378, 1, 'camera', 'static/uploads\\camera_1742350441_8101.jpg', 'result_camera_1742350441_8101.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:14:01');
INSERT INTO `analysis_records` VALUES (379, 1, 'camera', 'static/uploads\\camera_1742350443_1499.jpg', 'result_camera_1742350443_1499.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:14:03');
INSERT INTO `analysis_records` VALUES (380, 1, 'camera', 'static/uploads\\camera_1742350445_5451.jpg', 'result_camera_1742350445_5451.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:14:05');
INSERT INTO `analysis_records` VALUES (381, 1, 'camera', 'static/uploads\\camera_1742350447_4541.jpg', 'result_camera_1742350447_4541.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:14:07');
INSERT INTO `analysis_records` VALUES (382, 1, 'camera', 'static/uploads\\camera_1742350449_8505.jpg', 'result_camera_1742350449_8505.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:14:09');
INSERT INTO `analysis_records` VALUES (383, 1, 'camera', 'static/uploads\\camera_1742350451_6078.jpg', 'result_camera_1742350451_6078.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:14:11');
INSERT INTO `analysis_records` VALUES (384, 1, 'camera', 'static/uploads\\camera_1742350453_6345.jpg', 'result_camera_1742350453_6345.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:14:13');
INSERT INTO `analysis_records` VALUES (385, 1, 'camera', 'static/uploads\\camera_1742350455_9366.jpg', 'result_camera_1742350455_9366.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:14:16');
INSERT INTO `analysis_records` VALUES (386, 1, 'camera', 'static/uploads\\camera_1742350457_6201.jpg', 'result_camera_1742350457_6201.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:14:18');
INSERT INTO `analysis_records` VALUES (387, 1, 'camera', 'static/uploads\\camera_1742350459_5835.jpg', 'result_camera_1742350459_5835.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:14:19');
INSERT INTO `analysis_records` VALUES (388, 1, 'camera', 'static/uploads\\camera_1742350461_1520.jpg', 'result_camera_1742350461_1520.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:14:21');
INSERT INTO `analysis_records` VALUES (389, 1, 'camera', 'static/uploads\\camera_1742350463_1952.jpg', 'result_camera_1742350463_1952.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:14:23');
INSERT INTO `analysis_records` VALUES (390, 1, 'camera', 'static/uploads\\camera_1742350465_4283.jpg', 'result_camera_1742350465_4283.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:14:25');
INSERT INTO `analysis_records` VALUES (391, 1, 'camera', 'static/uploads\\camera_1742350467_5943.jpg', 'result_camera_1742350467_5943.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:14:27');
INSERT INTO `analysis_records` VALUES (392, 1, 'camera', 'static/uploads\\camera_1742350469_2812.jpg', 'result_camera_1742350469_2812.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:14:29');
INSERT INTO `analysis_records` VALUES (393, 1, 'camera', 'static/uploads\\camera_1742350471_3575.jpg', 'result_camera_1742350471_3575.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:14:31');
INSERT INTO `analysis_records` VALUES (394, 1, 'camera', 'static/uploads\\camera_1742350473_8935.jpg', 'result_camera_1742350473_8935.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:14:33');
INSERT INTO `analysis_records` VALUES (395, 1, 'camera', 'static/uploads\\camera_1742350475_4258.jpg', 'result_camera_1742350475_4258.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:14:35');
INSERT INTO `analysis_records` VALUES (396, 1, 'camera', 'static/uploads\\camera_1742350477_4480.jpg', 'result_camera_1742350477_4480.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:14:37');
INSERT INTO `analysis_records` VALUES (397, 1, 'camera', 'static/uploads\\camera_1742350479_3399.jpg', 'result_camera_1742350479_3399.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:14:39');
INSERT INTO `analysis_records` VALUES (398, 1, 'camera', 'static/uploads\\camera_1742350481_1724.jpg', 'result_camera_1742350481_1724.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:14:41');
INSERT INTO `analysis_records` VALUES (399, 1, 'camera', 'static/uploads\\camera_1742350483_6281.jpg', 'result_camera_1742350483_6281.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:14:43');
INSERT INTO `analysis_records` VALUES (400, 1, 'camera', 'static/uploads\\camera_1742350485_9554.jpg', 'result_camera_1742350485_9554.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:14:45');
INSERT INTO `analysis_records` VALUES (401, 1, 'camera', 'static/uploads\\camera_1742350487_5093.jpg', 'result_camera_1742350487_5093.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:14:47');
INSERT INTO `analysis_records` VALUES (402, 1, 'camera', 'static/uploads\\camera_1742350489_1477.jpg', 'result_camera_1742350489_1477.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:14:49');
INSERT INTO `analysis_records` VALUES (403, 1, 'camera', 'static/uploads\\camera_1742350491_3213.jpg', 'result_camera_1742350491_3213.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:14:51');
INSERT INTO `analysis_records` VALUES (404, 1, 'camera', 'static/uploads\\camera_1742350493_7787.jpg', 'result_camera_1742350493_7787.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:14:53');
INSERT INTO `analysis_records` VALUES (405, 1, 'camera', 'static/uploads\\camera_1742350495_8129.jpg', 'result_camera_1742350495_8129.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:14:55');
INSERT INTO `analysis_records` VALUES (406, 1, 'camera', 'static/uploads\\camera_1742350497_7892.jpg', 'result_camera_1742350497_7892.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:14:57');
INSERT INTO `analysis_records` VALUES (407, 1, 'camera', 'static/uploads\\camera_1742350499_8566.jpg', 'result_camera_1742350499_8566.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:14:59');
INSERT INTO `analysis_records` VALUES (408, 1, 'camera', 'static/uploads\\camera_1742350501_6501.jpg', 'result_camera_1742350501_6501.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:15:01');
INSERT INTO `analysis_records` VALUES (409, 1, 'camera', 'static/uploads\\camera_1742350503_1941.jpg', 'result_camera_1742350503_1941.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:15:03');
INSERT INTO `analysis_records` VALUES (410, 1, 'camera', 'static/uploads\\camera_1742350505_8845.jpg', 'result_camera_1742350505_8845.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:15:05');
INSERT INTO `analysis_records` VALUES (411, 1, 'camera', 'static/uploads\\camera_1742350507_7685.jpg', 'result_camera_1742350507_7685.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:15:07');
INSERT INTO `analysis_records` VALUES (412, 1, 'camera', 'static/uploads\\camera_1742350509_4464.jpg', 'result_camera_1742350509_4464.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:15:09');
INSERT INTO `analysis_records` VALUES (413, 1, 'camera', 'static/uploads\\camera_1742350511_9526.jpg', 'result_camera_1742350511_9526.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:15:11');
INSERT INTO `analysis_records` VALUES (414, 1, 'camera', 'static/uploads\\camera_1742350513_6580.jpg', 'result_camera_1742350513_6580.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:15:13');
INSERT INTO `analysis_records` VALUES (415, 1, 'camera', 'static/uploads\\camera_1742350515_6328.jpg', 'result_camera_1742350515_6328.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:15:15');
INSERT INTO `analysis_records` VALUES (416, 1, 'camera', 'static/uploads\\camera_1742350517_7613.jpg', 'result_camera_1742350517_7613.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:15:17');
INSERT INTO `analysis_records` VALUES (417, 1, 'camera', 'static/uploads\\camera_1742350519_8732.jpg', 'result_camera_1742350519_8732.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:15:19');
INSERT INTO `analysis_records` VALUES (418, 1, 'camera', 'static/uploads\\camera_1742350521_4802.jpg', 'result_camera_1742350521_4802.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:15:21');
INSERT INTO `analysis_records` VALUES (419, 1, 'camera', 'static/uploads\\camera_1742350523_3689.jpg', 'result_camera_1742350523_3689.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:15:23');
INSERT INTO `analysis_records` VALUES (420, 1, 'camera', 'static/uploads\\camera_1742350525_5981.jpg', 'result_camera_1742350525_5981.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:15:25');
INSERT INTO `analysis_records` VALUES (421, 1, 'camera', 'static/uploads\\camera_1742350527_3794.jpg', 'result_camera_1742350527_3794.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:15:27');
INSERT INTO `analysis_records` VALUES (422, 1, 'camera', 'static/uploads\\camera_1742350529_4942.jpg', 'result_camera_1742350529_4942.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:15:29');
INSERT INTO `analysis_records` VALUES (423, 1, 'camera', 'static/uploads\\camera_1742350531_6851.jpg', 'result_camera_1742350531_6851.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:15:31');
INSERT INTO `analysis_records` VALUES (424, 1, 'camera', 'static/uploads\\camera_1742350533_1771.jpg', 'result_camera_1742350533_1771.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:15:33');
INSERT INTO `analysis_records` VALUES (425, 1, 'camera', 'static/uploads\\camera_1742350535_7565.jpg', 'result_camera_1742350535_7565.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:15:35');
INSERT INTO `analysis_records` VALUES (426, 1, 'camera', 'static/uploads\\camera_1742350537_9183.jpg', 'result_camera_1742350537_9183.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:15:37');
INSERT INTO `analysis_records` VALUES (427, 1, 'camera', 'static/uploads\\camera_1742350539_4185.jpg', 'result_camera_1742350539_4185.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:15:39');
INSERT INTO `analysis_records` VALUES (428, 1, 'camera', 'static/uploads\\camera_1742350541_5236.jpg', 'result_camera_1742350541_5236.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:15:41');
INSERT INTO `analysis_records` VALUES (429, 1, 'camera', 'static/uploads\\camera_1742350543_7492.jpg', 'result_camera_1742350543_7492.jpg', 'static/@results', 'zdjy_ld', NULL, 0.2634, '2025-03-19 10:15:43');
INSERT INTO `analysis_records` VALUES (430, 1, 'camera', 'static/uploads\\camera_1742350545_6005.jpg', 'result_camera_1742350545_6005.jpg', 'static/@results', 'zdjy_ld', NULL, 0.3559, '2025-03-19 10:15:45');
INSERT INTO `analysis_records` VALUES (431, 1, 'camera', 'static/uploads\\camera_1742350547_7007.jpg', 'result_camera_1742350547_7007.jpg', 'static/@results', 'zdjy_ld', NULL, 0.3036, '2025-03-19 10:15:47');
INSERT INTO `analysis_records` VALUES (432, 1, 'camera', 'static/uploads\\camera_1742350549_2283.jpg', 'result_camera_1742350549_2283.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:15:49');
INSERT INTO `analysis_records` VALUES (433, 1, 'camera', 'static/uploads\\camera_1742350551_6554.jpg', 'result_camera_1742350551_6554.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:15:51');
INSERT INTO `analysis_records` VALUES (434, 1, 'camera', 'static/uploads\\camera_1742350553_3100.jpg', 'result_camera_1742350553_3100.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:15:53');
INSERT INTO `analysis_records` VALUES (435, 1, 'camera', 'static/uploads\\camera_1742350555_7679.jpg', 'result_camera_1742350555_7679.jpg', 'static/@results', 'zdjy_ld', NULL, 0.3434, '2025-03-19 10:15:55');
INSERT INTO `analysis_records` VALUES (436, 1, 'camera', 'static/uploads\\camera_1742350557_6624.jpg', 'result_camera_1742350557_6624.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:15:57');
INSERT INTO `analysis_records` VALUES (437, 1, 'camera', 'static/uploads\\camera_1742350559_1921.jpg', 'result_camera_1742350559_1921.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:15:59');
INSERT INTO `analysis_records` VALUES (438, 1, 'camera', 'static/uploads\\camera_1742350561_2817.jpg', 'result_camera_1742350561_2817.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:16:01');
INSERT INTO `analysis_records` VALUES (439, 1, 'camera', 'static/uploads\\camera_1742350563_4599.jpg', 'result_camera_1742350563_4599.jpg', 'static/@results', 'zdjy_ld', NULL, 0.4523, '2025-03-19 10:16:03');
INSERT INTO `analysis_records` VALUES (440, 1, 'camera', 'static/uploads\\camera_1742350565_9538.jpg', 'result_camera_1742350565_9538.jpg', 'static/@results', 'zdjy_ld', NULL, 0.3090, '2025-03-19 10:16:05');
INSERT INTO `analysis_records` VALUES (441, 1, 'camera', 'static/uploads\\camera_1742350567_4801.jpg', 'result_camera_1742350567_4801.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:16:07');
INSERT INTO `analysis_records` VALUES (442, 1, 'camera', 'static/uploads\\camera_1742350569_9819.jpg', 'result_camera_1742350569_9819.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:16:09');
INSERT INTO `analysis_records` VALUES (443, 1, 'camera', 'static/uploads\\camera_1742350571_7468.jpg', 'result_camera_1742350571_7468.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:16:11');
INSERT INTO `analysis_records` VALUES (444, 1, 'camera', 'static/uploads\\camera_1742350573_3824.jpg', 'result_camera_1742350573_3824.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:16:13');
INSERT INTO `analysis_records` VALUES (445, 1, 'camera', 'static/uploads\\camera_1742350575_2583.jpg', 'result_camera_1742350575_2583.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:16:15');
INSERT INTO `analysis_records` VALUES (446, 1, 'camera', 'static/uploads\\camera_1742350577_1311.jpg', 'result_camera_1742350577_1311.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:16:17');
INSERT INTO `analysis_records` VALUES (447, 1, 'camera', 'static/uploads\\camera_1742350579_6147.jpg', 'result_camera_1742350579_6147.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:16:19');
INSERT INTO `analysis_records` VALUES (448, 1, 'camera', 'static/uploads\\camera_1742350581_5047.jpg', 'result_camera_1742350581_5047.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:16:21');
INSERT INTO `analysis_records` VALUES (449, 1, 'camera', 'static/uploads\\camera_1742350583_9962.jpg', 'result_camera_1742350583_9962.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:16:23');
INSERT INTO `analysis_records` VALUES (450, 1, 'camera', 'static/uploads\\camera_1742350585_4485.jpg', 'result_camera_1742350585_4485.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:16:25');
INSERT INTO `analysis_records` VALUES (451, 1, 'camera', 'static/uploads\\camera_1742350587_4658.jpg', 'result_camera_1742350587_4658.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:16:27');
INSERT INTO `analysis_records` VALUES (452, 1, 'camera', 'static/uploads\\camera_1742350589_6514.jpg', 'result_camera_1742350589_6514.jpg', 'static/@results', 'zdjy_gd', NULL, 0.0000, '2025-03-19 10:16:29');
INSERT INTO `analysis_records` VALUES (453, 1, 'camera', 'static/uploads\\camera_1742351117_5994.jpg', 'result_camera_1742351117_5994.jpg', 'static/@results', 'zdjy_ld', NULL, 0.4109, '2025-03-19 10:25:20');
INSERT INTO `analysis_records` VALUES (454, 1, 'camera', 'static/uploads\\camera_1742351117_5943.jpg', 'result_camera_1742351117_5943.jpg', 'static/@results', 'zdjy_ld', NULL, 0.5118, '2025-03-19 10:25:20');
INSERT INTO `analysis_records` VALUES (455, 1, 'camera', 'static/uploads\\camera_1742351144_8122.jpg', 'result_camera_1742351144_8122.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6364, '2025-03-19 10:25:44');
INSERT INTO `analysis_records` VALUES (456, 1, 'camera', 'static/uploads\\camera_1742351146_9427.jpg', 'result_camera_1742351146_9427.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6791, '2025-03-19 10:25:46');
INSERT INTO `analysis_records` VALUES (457, 1, 'camera', 'static/uploads\\camera_1742351148_7659.jpg', 'result_camera_1742351148_7659.jpg', 'static/@results', 'zdjy_ld', NULL, 0.4874, '2025-03-19 10:25:48');
INSERT INTO `analysis_records` VALUES (458, 1, 'camera', 'static/uploads\\camera_1742351201_4071.jpg', 'result_camera_1742351201_4071.jpg', 'static/@results', 'zdjy_ld', NULL, 0.5803, '2025-03-19 10:26:41');
INSERT INTO `analysis_records` VALUES (459, 1, 'camera', 'static/uploads\\camera_1742351203_2483.jpg', 'result_camera_1742351203_2483.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7087, '2025-03-19 10:26:43');
INSERT INTO `analysis_records` VALUES (460, 1, 'image', 'static/uploads\\68abe875340255a00dae57559f25fdd_1742351678_8576.jpg', 'result_68abe875340255a00dae57559f25fdd_1742351678_8576.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7320, '2025-03-19 10:34:40');
INSERT INTO `analysis_records` VALUES (461, 1, 'image', 'static/uploads\\1a375bd321dd5ca9b794a010b9d07b4_1742351801_2586.jpg', 'result_1a375bd321dd5ca9b794a010b9d07b4_1742351801_2586.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6025, '2025-03-19 10:36:41');
INSERT INTO `analysis_records` VALUES (462, 1, 'image', 'static/uploads\\2d8a9771814e56819c72dbece609a04_1742352094_4550.jpg', 'result_2d8a9771814e56819c72dbece609a04_1742352094_4550.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6243, '2025-03-19 10:41:36');
INSERT INTO `analysis_records` VALUES (463, 1, 'image', 'static/uploads\\1a375bd321dd5ca9b794a010b9d07b4_1742352140_3937.jpg', 'result_1a375bd321dd5ca9b794a010b9d07b4_1742352140_3937.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6025, '2025-03-19 10:42:21');
INSERT INTO `analysis_records` VALUES (464, 1, 'image', 'static/uploads\\2b5778119ee7489d5a032e36e739bbb_1742352563_8055.jpg', 'result_2b5778119ee7489d5a032e36e739bbb_1742352563_8055.jpg', 'static/@results', 'zdjy_gd', NULL, 0.5486, '2025-03-19 10:49:26');
INSERT INTO `analysis_records` VALUES (465, 1, 'image', 'static/uploads\\2d057d1212e9ba234a5318606396ac4_1742353329_8393.jpg', 'result_2d057d1212e9ba234a5318606396ac4_1742353329_8393.jpg', 'static/@results', 'zdjy_ld', NULL, 0.5152, '2025-03-19 11:02:12');
INSERT INTO `analysis_records` VALUES (466, 1, 'image', 'static/uploads\\2d8a9771814e56819c72dbece609a04_1742353728_6861.jpg', 'result_2d8a9771814e56819c72dbece609a04_1742353728_6861.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6243, '2025-03-19 11:08:51');
INSERT INTO `analysis_records` VALUES (467, 1, 'image', 'static/uploads\\02ac6471578223c876c346ea2c88de9_1742353915_1814.jpg', 'result_02ac6471578223c876c346ea2c88de9_1742353915_1814.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6166, '2025-03-19 11:11:58');
INSERT INTO `analysis_records` VALUES (468, 1, 'image', 'static/uploads\\71a62abad5c3852a056b86c5b09677c_1742354017_7142.jpg', 'result_71a62abad5c3852a056b86c5b09677c_1742354017_7142.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6213, '2025-03-19 11:13:39');
INSERT INTO `analysis_records` VALUES (469, 1, 'image', 'static/uploads\\6b5dc597e61b6aacc34f456906a2e9c_1742354035_6642.jpg', 'result_6b5dc597e61b6aacc34f456906a2e9c_1742354035_6642.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7716, '2025-03-19 11:13:55');
INSERT INTO `analysis_records` VALUES (470, 1, 'camera', 'static/uploads\\camera_1742354111_9315.jpg', 'result_camera_1742354111_9315.jpg', 'static/@results', 'zdjy_ld', NULL, 0.3928, '2025-03-19 11:15:11');
INSERT INTO `analysis_records` VALUES (471, 1, 'camera', 'static/uploads\\camera_1742354113_7561.jpg', 'result_camera_1742354113_7561.jpg', 'static/@results', 'zdjy_ld', NULL, 0.5606, '2025-03-19 11:15:13');
INSERT INTO `analysis_records` VALUES (472, 1, 'camera', 'static/uploads\\camera_1742354115_3329.jpg', 'result_camera_1742354115_3329.jpg', 'static/@results', 'zdjy_ld', NULL, 0.2840, '2025-03-19 11:15:15');
INSERT INTO `analysis_records` VALUES (473, 1, 'camera', 'static/uploads\\camera_1742354117_5669.jpg', 'result_camera_1742354117_5669.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6964, '2025-03-19 11:15:17');
INSERT INTO `analysis_records` VALUES (474, 1, 'camera', 'static/uploads\\camera_1742354119_1419.jpg', 'result_camera_1742354119_1419.jpg', 'static/@results', 'zdjy_ld', NULL, 0.8244, '2025-03-19 11:15:19');
INSERT INTO `analysis_records` VALUES (475, 1, 'camera', 'static/uploads\\camera_1742354129_6589.jpg', 'result_camera_1742354129_6589.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7767, '2025-03-19 11:15:29');
INSERT INTO `analysis_records` VALUES (476, 1, 'camera', 'static/uploads\\camera_1742354131_4696.jpg', 'result_camera_1742354131_4696.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6866, '2025-03-19 11:15:31');
INSERT INTO `analysis_records` VALUES (477, 1, 'camera', 'static/uploads\\camera_1742379633_4332.jpg', 'result_camera_1742379633_4332.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7261, '2025-03-19 18:20:33');
INSERT INTO `analysis_records` VALUES (478, 1, 'camera', 'static/uploads\\camera_1742379635_6974.jpg', 'result_camera_1742379635_6974.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7796, '2025-03-19 18:20:35');
INSERT INTO `analysis_records` VALUES (479, 1, 'camera', 'static/uploads\\camera_1742379637_9486.jpg', 'result_camera_1742379637_9486.jpg', 'static/@results', 'zdjy_ld', NULL, 0.7337, '2025-03-19 18:20:37');
INSERT INTO `analysis_records` VALUES (480, 1, 'camera', 'static/uploads\\camera_1742379639_8486.jpg', 'result_camera_1742379639_8486.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6201, '2025-03-19 18:20:39');
INSERT INTO `analysis_records` VALUES (481, 1, 'camera', 'static/uploads\\camera_1742379641_1631.jpg', 'result_camera_1742379641_1631.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6473, '2025-03-19 18:20:41');
INSERT INTO `analysis_records` VALUES (482, 1, 'camera', 'static/uploads\\camera_1742379649_2283.jpg', 'result_camera_1742379649_2283.jpg', 'static/@results', 'zdjy_ld', NULL, 0.4331, '2025-03-19 18:20:49');
INSERT INTO `analysis_records` VALUES (483, 1, 'camera', 'static/uploads\\camera_1742379651_5288.jpg', 'result_camera_1742379651_5288.jpg', 'static/@results', 'zdjy_ld', NULL, 0.4648, '2025-03-19 18:20:51');
INSERT INTO `analysis_records` VALUES (484, 1, 'camera', 'static/uploads\\camera_1742379653_5046.jpg', 'result_camera_1742379653_5046.jpg', 'static/@results', 'zdjy_ld', NULL, 0.6423, '2025-03-19 18:20:53');
INSERT INTO `analysis_records` VALUES (485, 1, 'camera', 'static/uploads\\camera_1742379657_8210.jpg', 'result_camera_1742379657_8210.jpg', 'static/@results', 'zdjy_ld', NULL, 0.4812, '2025-03-19 18:20:57');
INSERT INTO `analysis_records` VALUES (486, 1, 'camera', 'static/uploads\\camera_1742379659_9936.jpg', 'result_camera_1742379659_9936.jpg', 'static/@results', 'zdjy_ld', NULL, 0.3578, '2025-03-19 18:20:59');
INSERT INTO `analysis_records` VALUES (487, 1, 'camera', 'static/uploads\\camera_1742379665_5182.jpg', 'result_camera_1742379665_5182.jpg', 'static/@results', 'zdjy_ld', NULL, 0.2932, '2025-03-19 18:21:05');
INSERT INTO `analysis_records` VALUES (488, 1, 'image', 'static/uploads\\6d631a0e0f1e670ca026d9ded2f243a_1742379714_5693.jpg', 'result_6d631a0e0f1e670ca026d9ded2f243a_1742379714_5693.jpg', 'static/@results', 'zdjy_ld', NULL, 0.8244, '2025-03-19 18:21:54');

-- ----------------------------
-- Table structure for detection_stats
-- ----------------------------
DROP TABLE IF EXISTS `detection_stats`;
CREATE TABLE `detection_stats`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `detection_date` date NOT NULL,
  `daily_count` int NULL DEFAULT 0,
  `total_count` int NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `unique_user_date`(`user_id` ASC, `detection_date` ASC) USING BTREE,
  CONSTRAINT `detection_stats_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of detection_stats
-- ----------------------------
INSERT INTO `detection_stats` VALUES (1, 1, '2025-03-12', 10, 10);
INSERT INTO `detection_stats` VALUES (2, 1, '2025-03-13', 7, 17);

-- ----------------------------
-- Table structure for login_logs
-- ----------------------------
DROP TABLE IF EXISTS `login_logs`;
CREATE TABLE `login_logs`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `login_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ip_address` varchar(45) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT NULL,
  `user_agent` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `login_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of login_logs
-- ----------------------------

-- ----------------------------
-- Table structure for tasks
-- ----------------------------
DROP TABLE IF EXISTS `tasks`;
CREATE TABLE `tasks`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of tasks
-- ----------------------------
INSERT INTO `tasks` VALUES (1, 1, '对辖区内重点区域进行日常巡查', '巡查任务描述', 'pending', '2025-03-16 15:08:05');
INSERT INTO `tasks` VALUES (2, 1, '处理占道经营违规行为', '执法任务描述', 'pending', '2025-03-16 13:08:05');

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `is_admin` tinyint(1) NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_bin ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of user
-- ----------------------------
INSERT INTO `user` VALUES (1, 'admin', 'admin', 1, '2025-02-19 14:41:31');
INSERT INTO `user` VALUES (2, 'zhaiyuhu5', '123456', 0, '2025-02-19 14:42:37');
INSERT INTO `user` VALUES (3, 'zs', '123456', 0, '2025-03-15 22:11:22');
INSERT INTO `user` VALUES (4, 'zhaiyuhu', '123', 0, '2025-03-15 22:29:50');

SET FOREIGN_KEY_CHECKS = 1;
