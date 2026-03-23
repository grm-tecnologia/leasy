-- Migration: Add generated columns for fast JSON-based search on leads table
-- These virtual columns extract commonly searched fields from the JSON `data` column
-- and allow MySQL to use indexes for filtering instead of full-table JSON scanning.

-- Generated columns (STORED so they can be indexed)
ALTER TABLE `leads`
  ADD COLUMN `_search_nome` VARCHAR(255) GENERATED ALWAYS AS (
    LOWER(TRIM(JSON_UNQUOTE(JSON_EXTRACT(`data`, '$.nome'))))
  ) STORED,
  ADD COLUMN `_search_email` VARCHAR(320) GENERATED ALWAYS AS (
    LOWER(TRIM(JSON_UNQUOTE(JSON_EXTRACT(`data`, '$.email'))))
  ) STORED,
  ADD COLUMN `_search_telefone` VARCHAR(20) GENERATED ALWAYS AS (
    REGEXP_REPLACE(JSON_UNQUOTE(JSON_EXTRACT(`data`, '$.telefone')), '[^0-9]', '')
  ) STORED,
  ADD COLUMN `_search_cidade` VARCHAR(255) GENERATED ALWAYS AS (
    LOWER(TRIM(JSON_UNQUOTE(JSON_EXTRACT(`data`, '$.cidade'))))
  ) STORED,
  ADD COLUMN `_search_estado` VARCHAR(2) GENERATED ALWAYS AS (
    UPPER(TRIM(JSON_UNQUOTE(JSON_EXTRACT(`data`, '$.estado'))))
  ) STORED;

-- Indexes on generated columns for fast lookups
CREATE INDEX `idx_leads_search_nome` ON `leads` (`categoryId`, `_search_nome`);
CREATE INDEX `idx_leads_search_email` ON `leads` (`categoryId`, `_search_email`);
CREATE INDEX `idx_leads_search_telefone` ON `leads` (`categoryId`, `_search_telefone`);
CREATE INDEX `idx_leads_search_cidade` ON `leads` (`categoryId`, `_search_cidade`);
CREATE INDEX `idx_leads_search_estado` ON `leads` (`categoryId`, `_search_estado`);

-- Composite index for common filter combinations
CREATE INDEX `idx_leads_category_active` ON `leads` (`categoryId`, `isActive`);
