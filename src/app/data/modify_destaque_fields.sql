-- Script para modificar los campos de destaque en la base de datos
-- Cambia los valores de ENUM de 'novedad','destacable' a 'nueva','para_publicitar'
-- Ejecutar en la base de datos historico_fichas_subidas

USE `historico_fichas_subidas`;

-- 1. Deshabilitar el modo seguro temporalmente
SET SQL_SAFE_UPDATES = 0;

-- 2. Actualizar los valores existentes (si los hay)
-- Mapear 'novedad' -> 'nueva' y 'destacable' -> 'para_publicitar'
UPDATE `fichas` 
SET `destaque_principal` = CASE 
    WHEN `destaque_principal` = 'novedad' THEN 'nueva'
    WHEN `destaque_principal` = 'destacable' THEN 'para_publicitar'
    ELSE `destaque_principal`
END
WHERE `destaque_principal` IN ('novedad', 'destacable');

UPDATE `fichas` 
SET `destaque_secundario` = CASE 
    WHEN `destaque_secundario` = 'novedad' THEN 'nueva'
    WHEN `destaque_secundario` = 'destacable' THEN 'para_publicitar'
    ELSE `destaque_secundario`
END
WHERE `destaque_secundario` IN ('novedad', 'destacable');

-- 3. Reactivar el modo seguro
SET SQL_SAFE_UPDATES = 1;

-- 2. Modificar la estructura de las columnas con los nuevos valores ENUM
ALTER TABLE `fichas` 
MODIFY COLUMN `destaque_principal` ENUM('nueva', 'para_publicitar') NULL DEFAULT NULL COMMENT 'Destaque principal marcado manualmente',
MODIFY COLUMN `destaque_secundario` ENUM('nueva', 'para_publicitar') NULL DEFAULT NULL COMMENT 'Destaque secundario marcado manualmente';

-- 3. Verificar los cambios
SELECT 
    COUNT(*) as total_fichas,
    COUNT(CASE WHEN destaque_principal IS NOT NULL THEN 1 END) as con_destaque_principal,
    COUNT(CASE WHEN destaque_secundario IS NOT NULL THEN 1 END) as con_destaque_secundario,
    COUNT(CASE WHEN destaque_principal = 'nueva' OR destaque_secundario = 'nueva' THEN 1 END) as marcadas_nueva,
    COUNT(CASE WHEN destaque_principal = 'para_publicitar' OR destaque_secundario = 'para_publicitar' THEN 1 END) as marcadas_para_publicitar
FROM fichas;

-- 4. Mostrar algunas fichas con destaque para verificar
SELECT 
    id_ficha_subida,
    nombre_ficha,
    destaque_principal,
    destaque_secundario,
    created_at
FROM fichas 
WHERE destaque_principal IS NOT NULL OR destaque_secundario IS NOT NULL
LIMIT 10;