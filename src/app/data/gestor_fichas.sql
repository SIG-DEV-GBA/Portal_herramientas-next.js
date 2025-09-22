CREATE DATABASE  IF NOT EXISTS `historico_fichas_subidas` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `historico_fichas_subidas`;
-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: historico_fichas_subidas
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ccaa`
--

DROP TABLE IF EXISTS `ccaa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ccaa` (
  `id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `codigo_ine` varchar(4) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ccaa_nombre` (`nombre`),
  UNIQUE KEY `codigo_ine` (`codigo_ine`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `enlaces_base`
--

DROP TABLE IF EXISTS `enlaces_base`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `enlaces_base` (
  `id` tinyint unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(40) NOT NULL,
  `base_url` varchar(255) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_enlaces_base_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ficha_portal`
--

DROP TABLE IF EXISTS `ficha_portal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ficha_portal` (
  `ficha_id` bigint unsigned NOT NULL,
  `portal_id` smallint unsigned NOT NULL,
  PRIMARY KEY (`ficha_id`,`portal_id`),
  KEY `ix_fp_portal` (`portal_id`),
  CONSTRAINT `fk_fp_ficha` FOREIGN KEY (`ficha_id`) REFERENCES `fichas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fp_portal` FOREIGN KEY (`portal_id`) REFERENCES `portales` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ficha_tematica`
--

DROP TABLE IF EXISTS `ficha_tematica`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ficha_tematica` (
  `ficha_id` bigint unsigned NOT NULL,
  `tematica_id` smallint unsigned NOT NULL,
  `orden` smallint DEFAULT NULL,
  PRIMARY KEY (`ficha_id`,`tematica_id`),
  KEY `ix_ft_tematica` (`tematica_id`),
  KEY `ix_ft_orden` (`orden`),
  CONSTRAINT `fk_ft_ficha` FOREIGN KEY (`ficha_id`) REFERENCES `fichas` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT,
  CONSTRAINT `fk_ft_tema` FOREIGN KEY (`tematica_id`) REFERENCES `tematicas` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fichas`
--

DROP TABLE IF EXISTS `fichas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fichas` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `id_ficha_subida` decimal(20,0) NOT NULL,
  `nombre_ficha` varchar(200) NOT NULL,
  `nombre_slug` varchar(220) DEFAULT NULL,
  `vencimiento` date DEFAULT NULL,
  `fecha_redaccion` date DEFAULT NULL,
  `fecha_subida_web` date DEFAULT NULL,
  `trabajador_id` smallint unsigned DEFAULT NULL,
  `trabajador_subida_id` smallint unsigned DEFAULT NULL,
  `ambito_nivel` enum('UE','ESTADO','CCAA','PROVINCIA') NOT NULL,
  `ambito_ccaa_id` smallint unsigned DEFAULT NULL,
  `ambito_provincia_id` smallint unsigned DEFAULT NULL,
  `ambito_municipal` varchar(150) DEFAULT NULL,
  `tramite_tipo` enum('no','si','directo') DEFAULT NULL,
  `complejidad` enum('baja','media','alta') DEFAULT NULL,
  `complejidad_peso` tinyint unsigned GENERATED ALWAYS AS ((case `complejidad` when _utf8mb4'baja' then 1 when _utf8mb4'media' then 2 when _utf8mb4'alta' then 3 else NULL end)) STORED,
  `enlace_base_id` tinyint unsigned NOT NULL DEFAULT '1',
  `enlace_seg_override` varchar(120) DEFAULT NULL,
  `frase_publicitaria` varchar(300) DEFAULT NULL,
  `texto_divulgacion` text,
  `existe_frase` tinyint(1) GENERATED ALWAYS AS ((case when ((`frase_publicitaria` is not null) and (regexp_replace(`frase_publicitaria`,_utf8mb4'\\s+',_cp850'') <> _utf8mb4'')) then 1 else 0 end)) STORED,
  `destaque_principal` enum('nueva','para_publicitar') DEFAULT NULL COMMENT 'Destaque principal marcado manualmente',
  `destaque_secundario` enum('nueva','para_publicitar') DEFAULT NULL COMMENT 'Destaque secundario marcado manualmente',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_fichas_id_ficha_subida` (`id_ficha_subida`),
  UNIQUE KEY `uq_fichas_nombre_slug` (`nombre_slug`),
  KEY `ix_fichas_vencimiento` (`vencimiento`),
  KEY `ix_fichas_fecha_redaccion` (`fecha_redaccion`),
  KEY `ix_fichas_fecha_subida_web` (`fecha_subida_web`),
  KEY `ix_fichas_trabajador_subida` (`trabajador_subida_id`),
  KEY `ix_fichas_ambito_nivel` (`ambito_nivel`),
  KEY `ix_fichas_ccaa` (`ambito_ccaa_id`),
  KEY `ix_fichas_provincia` (`ambito_provincia_id`),
  KEY `ix_fichas_tramite_tipo` (`tramite_tipo`),
  KEY `ix_fichas_complejidad` (`complejidad`),
  KEY `ix_fichas_complejidad_peso` (`complejidad_peso`),
  KEY `ix_fichas_enlace_base` (`enlace_base_id`),
  KEY `idx_fichas_created_at_id` (`created_at` DESC,`id` DESC),
  KEY `idx_fichas_ambito` (`ambito_nivel`),
  KEY `idx_fichas_ccaa` (`ambito_ccaa_id`),
  KEY `idx_fichas_prov` (`ambito_provincia_id`),
  KEY `idx_fichas_trab_subida` (`trabajador_subida_id`),
  KEY `idx_fichas_vencimiento` (`vencimiento`),
  KEY `ix_fichas_trabajador` (`trabajador_id`),
  FULLTEXT KEY `ft_fichas_nombre` (`nombre_ficha`),
  FULLTEXT KEY `ft_fichas_frase` (`frase_publicitaria`),
  FULLTEXT KEY `ft_fichas_texto` (`texto_divulgacion`),
  CONSTRAINT `fk_fichas_ccaa` FOREIGN KEY (`ambito_ccaa_id`) REFERENCES `ccaa` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT,
  CONSTRAINT `fk_fichas_provincia` FOREIGN KEY (`ambito_provincia_id`) REFERENCES `provincias` (`id`) ON DELETE RESTRICT ON UPDATE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=444 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `portales`
--

DROP TABLE IF EXISTS `portales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `portales` (
  `id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(32) NOT NULL,
  `nombre` varchar(64) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_portales_slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `provincias`
--

DROP TABLE IF EXISTS `provincias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `provincias` (
  `id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `ccaa_id` smallint unsigned NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `codigo_ine` varchar(4) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_prov_nombre` (`nombre`),
  UNIQUE KEY `uq_prov_ine` (`codigo_ine`),
  KEY `ix_prov_ccaa` (`ccaa_id`),
  CONSTRAINT `fk_prov_ccaa` FOREIGN KEY (`ccaa_id`) REFERENCES `ccaa` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tematicas`
--

DROP TABLE IF EXISTS `tematicas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tematicas` (
  `id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(64) NOT NULL,
  `nombre` varchar(128) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tema_slug` (`slug`),
  UNIQUE KEY `uq_tema_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `trabajadores`
--

DROP TABLE IF EXISTS `trabajadores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trabajadores` (
  `id` smallint unsigned NOT NULL AUTO_INCREMENT,
  `slug` varchar(64) NOT NULL,
  `nombre` varchar(120) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_trab_slug` (`slug`),
  KEY `ix_trab_activo` (`activo`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_permissions`
--

DROP TABLE IF EXISTS `user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `role` enum('ADMIN','EDITOR','VIEWER') NOT NULL DEFAULT 'VIEWER',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Temporary view structure for view `v_fichas_enlace`
--

DROP TABLE IF EXISTS `v_fichas_enlace`;
/*!50001 DROP VIEW IF EXISTS `v_fichas_enlace`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_fichas_enlace` AS SELECT 
 1 AS `id`,
 1 AS `id_ficha_subida`,
 1 AS `nombre_ficha`,
 1 AS `nombre_slug`,
 1 AS `vencimiento`,
 1 AS `fecha_redaccion`,
 1 AS `fecha_subida_web`,
 1 AS `trabajador_id`,
 1 AS `trabajador_subida_id`,
 1 AS `ambito_nivel`,
 1 AS `ambito_ccaa_id`,
 1 AS `ambito_provincia_id`,
 1 AS `ambito_municipal`,
 1 AS `tramite_tipo`,
 1 AS `complejidad`,
 1 AS `complejidad_peso`,
 1 AS `enlace_base_id`,
 1 AS `enlace_seg_override`,
 1 AS `frase_publicitaria`,
 1 AS `texto_divulgacion`,
 1 AS `existe_frase`,
 1 AS `destaque_principal`,
 1 AS `destaque_secundario`,
 1 AS `created_at`,
 1 AS `updated_at`,
 1 AS `enlace_web`*/;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `v_fichas_enlace`
--

/*!50001 DROP VIEW IF EXISTS `v_fichas_enlace`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`georgi`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `v_fichas_enlace` AS select `f`.`id` AS `id`,`f`.`id_ficha_subida` AS `id_ficha_subida`,`f`.`nombre_ficha` AS `nombre_ficha`,`f`.`nombre_slug` AS `nombre_slug`,`f`.`vencimiento` AS `vencimiento`,`f`.`fecha_redaccion` AS `fecha_redaccion`,`f`.`fecha_subida_web` AS `fecha_subida_web`,`f`.`trabajador_id` AS `trabajador_id`,`f`.`trabajador_subida_id` AS `trabajador_subida_id`,`f`.`ambito_nivel` AS `ambito_nivel`,`f`.`ambito_ccaa_id` AS `ambito_ccaa_id`,`f`.`ambito_provincia_id` AS `ambito_provincia_id`,`f`.`ambito_municipal` AS `ambito_municipal`,`f`.`tramite_tipo` AS `tramite_tipo`,`f`.`complejidad` AS `complejidad`,`f`.`complejidad_peso` AS `complejidad_peso`,`f`.`enlace_base_id` AS `enlace_base_id`,`f`.`enlace_seg_override` AS `enlace_seg_override`,`f`.`frase_publicitaria` AS `frase_publicitaria`,`f`.`texto_divulgacion` AS `texto_divulgacion`,`f`.`existe_frase` AS `existe_frase`,`f`.`destaque_principal` AS `destaque_principal`,`f`.`destaque_secundario` AS `destaque_secundario`,`f`.`created_at` AS `created_at`,`f`.`updated_at` AS `updated_at`,concat(`eb`.`base_url`,coalesce(`f`.`enlace_seg_override`,convert(cast(`f`.`id_ficha_subida` as char charset cp850) using utf8mb4))) AS `enlace_web` from (`fichas` `f` join `enlaces_base` `eb` on((`eb`.`id` = `f`.`enlace_base_id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-09-19 13:01:33
