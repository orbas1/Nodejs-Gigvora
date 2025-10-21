-- -----------------------------------------------------------------------------
-- Gigvora database bootstrap
-- -----------------------------------------------------------------------------
-- This script prepares the MySQL schema, application credentials, and optional
-- read-only analytics accounts used by the Gigvora platform. Run it from a MySQL
-- session after setting strong secrets for the users you plan to create.
--
-- Example usage:
--   SET @app_password = 'Replace-with-very-strong-passphrase!1';
--   SET @readonly_password = 'Optional-analytics-passphrase!2';
--   -- Optional: SET @allow_remote = 1; SET @remote_host = '10.0.%';
--   SOURCE gigvora-backend-nodejs/install.sql;
--
-- The application expects these credentials to be mirrored in .env using
-- DB_NAME, DB_USER, and DB_PASSWORD. After provisioning, run the Sequelize
-- migrations and seeders to create tables and demo data.
-- -----------------------------------------------------------------------------

SET @app_db = COALESCE(@app_db, 'gigvora');
SET @app_charset = COALESCE(@app_charset, 'utf8mb4');
SET @app_collation = COALESCE(@app_collation, 'utf8mb4_unicode_ci');
SET @app_user = COALESCE(@app_user, 'gigvora');
SET @app_password = NULLIF(@app_password, '');
SET @readonly_user = COALESCE(@readonly_user, CONCAT(@app_user, '_readonly'));
SET @readonly_password = NULLIF(@readonly_password, '');
SET @remote_host = COALESCE(@remote_host, '%');
SET @allow_remote = CASE
  WHEN @allow_remote IS NULL THEN 0
  WHEN LOWER(CAST(@allow_remote AS CHAR(5))) IN ('1', 'true', 'yes', 'on') THEN 1
  ELSE 0
END;
SET @app_privileges = 'SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, REFERENCES, INDEX, ALTER, CREATE TEMPORARY TABLES, LOCK TABLES, EXECUTE, CREATE VIEW, SHOW VIEW';
SET @readonly_privileges = 'SELECT, SHOW VIEW';

DELIMITER $$

CREATE PROCEDURE ensure_not_empty(IN value TEXT, IN label VARCHAR(64))
BEGIN
  IF value IS NULL OR value = '' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = CONCAT('Configure @', label, ' before running install.sql');
  END IF;
END$$

CREATE PROCEDURE ensure_identifier(IN identifier TEXT, IN label VARCHAR(64))
BEGIN
  CALL ensure_not_empty(identifier, label);
  IF identifier NOT REGEXP '^[0-9A-Za-z_]+$' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = CONCAT('Value for @', label, ' must contain only letters, numbers, or underscores.');
  END IF;
END$$

CREATE PROCEDURE ensure_password(IN secret TEXT, IN label VARCHAR(64))
BEGIN
  CALL ensure_not_empty(secret, label);
  IF CHAR_LENGTH(secret) < 16 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = CONCAT('Password for @', label, ' must be at least 16 characters.');
  END IF;
  IF secret NOT REGEXP '[0-9]' OR secret NOT REGEXP '[A-Z]' OR secret NOT REGEXP '[a-z]' OR secret NOT REGEXP '[^0-9A-Za-z]' THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = CONCAT('Password for @', label, ' must include upper, lower, digit, and symbol characters.');
  END IF;
END$$

CREATE PROCEDURE upsert_user(
  IN in_username VARCHAR(128),
  IN in_host VARCHAR(255),
  IN in_password TEXT,
  IN in_privileges TEXT
)
BEGIN
  DECLARE escaped_username VARCHAR(256);
  DECLARE escaped_database VARCHAR(256);

  SET escaped_username = REPLACE(in_username, '`', '``');
  SET escaped_database = REPLACE(@app_db, '`', '``');

  SET @sql := CONCAT('CREATE USER IF NOT EXISTS `', escaped_username, '`@''', in_host, ''' IDENTIFIED BY ', QUOTE(in_password), ';');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;

  SET @sql := CONCAT('ALTER USER `', escaped_username, '`@''', in_host, ''' IDENTIFIED BY ', QUOTE(in_password), ' PASSWORD EXPIRE NEVER;');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;

  SET @sql := CONCAT('GRANT ', in_privileges, ' ON `', escaped_database, '`.* TO `', escaped_username, '`@''', in_host, ''';');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

CREATE PROCEDURE provision_accounts()
BEGIN
  CALL ensure_identifier(@app_db, 'app_db');
  CALL ensure_identifier(@app_user, 'app_user');
  CALL ensure_password(@app_password, 'app_password');

  CALL upsert_user(@app_user, 'localhost', @app_password, @app_privileges);
  CALL upsert_user(@app_user, '127.0.0.1', @app_password, @app_privileges);
  CALL upsert_user(@app_user, '::1', @app_password, @app_privileges);

  IF @allow_remote = 1 THEN
    CALL upsert_user(@app_user, @remote_host, @app_password, @app_privileges);
  END IF;

  IF @readonly_password IS NOT NULL AND @readonly_password <> '' THEN
    CALL ensure_identifier(@readonly_user, 'readonly_user');
    CALL ensure_password(@readonly_password, 'readonly_password');

    CALL upsert_user(@readonly_user, 'localhost', @readonly_password, @readonly_privileges);
    CALL upsert_user(@readonly_user, '127.0.0.1', @readonly_password, @readonly_privileges);
    CALL upsert_user(@readonly_user, '::1', @readonly_password, @readonly_privileges);

    IF @allow_remote = 1 THEN
      CALL upsert_user(@readonly_user, @remote_host, @readonly_password, @readonly_privileges);
    END IF;
  END IF;
END$$

DELIMITER ;

CALL ensure_identifier(@app_charset, 'app_charset');
CALL ensure_identifier(@app_collation, 'app_collation');

SET @sql := CONCAT('CREATE DATABASE IF NOT EXISTS `', REPLACE(@app_db, '`', '``'), '` CHARACTER SET ', @app_charset, ' COLLATE ', @app_collation, ';');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := CONCAT('ALTER DATABASE `', REPLACE(@app_db, '`', '``'), '` CHARACTER SET ', @app_charset, ' COLLATE ', @app_collation, ';');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql := CONCAT('USE `', REPLACE(@app_db, '`', '``'), '`;');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

CALL provision_accounts();

FLUSH PRIVILEGES;

DROP PROCEDURE provision_accounts;
DROP PROCEDURE upsert_user;
DROP PROCEDURE ensure_password;
DROP PROCEDURE ensure_identifier;
DROP PROCEDURE ensure_not_empty;

SET @local_hosts := 'localhost, 127.0.0.1, ::1';
SET @host_summary := IF(@allow_remote = 1, CONCAT(@local_hosts, ', ', @remote_host), @local_hosts);
SET @readonly_status := IF(
  @readonly_password IS NOT NULL AND @readonly_password <> '',
  CONCAT('Read-only user `', @readonly_user, '` provisioned for hosts [', @host_summary, '].'),
  'Read-only user not provisioned. Set @readonly_password before running the script to enable it.'
);

SELECT
  CONCAT('Database `', @app_db, '` ready with charset ', @app_charset, ' and collation ', @app_collation, '.') AS database_status,
  CONCAT('Application user `', @app_user, '` provisioned for hosts [', @host_summary, ']. Update .env with these credentials.') AS app_user_status,
  @readonly_status AS readonly_user_status,
  'Run `npx sequelize-cli db:migrate` followed by `npx sequelize-cli db:seed:all` to create schema objects and demo data.' AS next_steps;
