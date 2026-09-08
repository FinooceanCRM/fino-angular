-- MariaDB dump 10.19  Distrib 10.4.28-MariaDB, for osx10.10 (x86_64)
--
-- Host: 127.0.0.1    Database: finoocean
-- ------------------------------------------------------
-- Server version	10.4.28-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `vendors`
--

DROP TABLE IF EXISTS `vendors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vendors` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `business_name` varchar(255) DEFAULT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `alternate_phone` varchar(20) DEFAULT NULL,
  `vendor_category` varchar(255) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `address_line1` varchar(255) DEFAULT NULL,
  `address_line2` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `pan_number` varchar(20) DEFAULT NULL,
  `gst_number` varchar(20) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` varchar(32) NOT NULL DEFAULT 'pending_verification',
  `otp_code` varchar(6) DEFAULT NULL,
  `otp_expires_at` timestamp NULL DEFAULT NULL,
  `phone_verified_at` timestamp NULL DEFAULT NULL,
  `joined_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vendors_user_id_unique` (`user_id`),
  KEY `vendors_city_index` (`city`),
  KEY `vendors_state_index` (`state`),
  KEY `vendors_status_index` (`status`),
  CONSTRAINT `vendors_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendors`
--

LOCK TABLES `vendors` WRITE;
/*!40000 ALTER TABLE `vendors` DISABLE KEYS */;
INSERT INTO `vendors` VALUES (1,67,'Coastline Legal Associates','Vendor One','9810000001','Legal services','https://coastline-legal.example','5 Harbour Street',NULL,'Mumbai','Maharashtra','400005','VEND01234A','27VEND01234A1Z9',NULL,'active',NULL,NULL,'2026-09-07 04:06:43','2026-09-07 04:06:43','2026-09-07 03:58:00','2026-09-07 04:06:43'),(2,68,'Tidewater Property Valuers','Vendor Two','9810000002','Valuation',NULL,'19 Lake View Road',NULL,'Pune','Maharashtra','411002','VEND05678B','27VEND05678B1Z4',NULL,'pending_verification',NULL,NULL,NULL,'2026-09-07 04:06:43','2026-09-07 03:58:00','2026-09-07 04:06:43'),(3,69,'Das Aanandam Financial Services Private limited','hello','+917776000353','va',NULL,'HNO.887 Jagdamba Niwas, , Beside Godraj Anandam Word City, Karna',NULL,'Nagpur','Maharashtra','440018',NULL,NULL,NULL,'active',NULL,NULL,'2026-09-07 03:58:59','2026-09-07 03:58:52','2026-09-07 03:58:52','2026-09-07 03:58:59'),(4,70,'Das Aanandam Financial Services Private limited','fr','+917776000353','hhhh',NULL,'2nd floor, mordan mill Square, umrad road, Ganeshpeth',NULL,'Nagpur','Maharashtra','440018',NULL,NULL,NULL,'active',NULL,NULL,'2026-09-07 03:59:57','2026-09-07 03:59:55','2026-09-07 03:59:55','2026-09-07 03:59:57');
/*!40000 ALTER TABLE `vendors` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-08 13:37:22
