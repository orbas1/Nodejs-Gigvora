-- Gigvora database bootstrap script
--
-- Usage:
--   mysql --user=root --password -h 127.0.0.1 --init-command="SET @GIGVORA_APP_PASSWORD='your-app-secret', @GIGVORA_MIGRATOR_PASSWORD='your-migrator-secret';" < install.sql
--
-- Requirements:
--   * MySQL/MariaDB 10.4+ with the ability to create users and roles.
--   * Password variables above must each be at least 16 characters and include
--     mixed casing plus numbers to satisfy production password policy.
--   * The script enforces TLS (`REQUIRE SSL`) for remote accounts so certificates
--     must be configured on the server before execution.

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE DATABASE IF NOT EXISTS `gigvora_dev` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS `gigvora_test` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `gigvora_dev`;

-- Guard against weak or missing passwords before creating accounts.
DROP PROCEDURE IF EXISTS ensure_secret_strength;
DELIMITER $$
CREATE PROCEDURE ensure_secret_strength(IN label VARCHAR(64), IN secret TEXT)
BEGIN
  IF secret IS NULL OR CHAR_LENGTH(secret) < 16
     OR secret NOT REGEXP BINARY '[A-Z]' OR secret NOT REGEXP BINARY '[a-z]'
     OR secret NOT REGEXP '[0-9]'
  THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = CONCAT('Set session variable @', label,
        ' to a strong password (16+ chars with upper, lower, number) before running install.sql');
  END IF;
END$$
DELIMITER ;

CALL ensure_secret_strength('GIGVORA_APP_PASSWORD', @GIGVORA_APP_PASSWORD);
CALL ensure_secret_strength('GIGVORA_MIGRATOR_PASSWORD', @GIGVORA_MIGRATOR_PASSWORD);
DROP PROCEDURE ensure_secret_strength;

-- Normalise escaped characters so prepared statements remain injection-safe.
SET @escaped_app_password = REPLACE(@GIGVORA_APP_PASSWORD, '\'', '\'\'');
SET @escaped_migrator_password = REPLACE(@GIGVORA_MIGRATOR_PASSWORD, '\'', '\'\'');

CREATE ROLE IF NOT EXISTS `gigvora_migrator_role`;
CREATE ROLE IF NOT EXISTS `gigvora_app_role`;

GRANT CREATE, ALTER, DROP, INDEX, REFERENCES, CREATE TEMPORARY TABLES, LOCK TABLES
  ON `gigvora_dev`.* TO `gigvora_migrator_role`;
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE
  ON `gigvora_dev`.* TO `gigvora_app_role`;

-- Provision the migrator account used by CI/CD and on-call engineers.
SET @create_migrator = CONCAT(
  "CREATE USER IF NOT EXISTS 'gigvora_migrator'@'%' IDENTIFIED BY '",
  @escaped_migrator_password,
  "' REQUIRE SSL PASSWORD EXPIRE NEVER;"
);
PREPARE stmt FROM @create_migrator;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @alter_migrator = CONCAT(
  "ALTER USER 'gigvora_migrator'@'%' IDENTIFIED BY '",
  @escaped_migrator_password,
  "' REQUIRE SSL PASSWORD EXPIRE INTERVAL 365 DAY;"
);
PREPARE stmt FROM @alter_migrator;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

GRANT `gigvora_migrator_role` TO 'gigvora_migrator'@'%';
SET DEFAULT ROLE `gigvora_migrator_role` FOR 'gigvora_migrator'@'%';

-- Provision the runtime application account with least-privilege DML access.
SET @create_app = CONCAT(
  "CREATE USER IF NOT EXISTS 'gigvora_app'@'%' IDENTIFIED BY '",
  @escaped_app_password,
  "' REQUIRE SSL PASSWORD EXPIRE NEVER;"
);
PREPARE stmt FROM @create_app;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @alter_app = CONCAT(
  "ALTER USER 'gigvora_app'@'%' IDENTIFIED BY '",
  @escaped_app_password,
  "' REQUIRE SSL PASSWORD EXPIRE INTERVAL 365 DAY;"
);
PREPARE stmt FROM @alter_app;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

GRANT `gigvora_app_role` TO 'gigvora_app'@'%';
SET DEFAULT ROLE `gigvora_app_role` FOR 'gigvora_app'@'%';

-- Ensure localhost automation (e.g., migrations run from CI) has equivalent accounts.
SET @create_local_migrator = CONCAT(
  "CREATE USER IF NOT EXISTS 'gigvora_migrator'@'localhost' IDENTIFIED BY '",
  @escaped_migrator_password,
  "' PASSWORD EXPIRE INTERVAL 365 DAY;"
);
PREPARE stmt FROM @create_local_migrator;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @alter_local_migrator = CONCAT(
  "ALTER USER 'gigvora_migrator'@'localhost' IDENTIFIED BY '",
  @escaped_migrator_password,
  "' PASSWORD EXPIRE INTERVAL 365 DAY;"
);
PREPARE stmt FROM @alter_local_migrator;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

GRANT `gigvora_migrator_role` TO 'gigvora_migrator'@'localhost';
SET DEFAULT ROLE `gigvora_migrator_role` FOR 'gigvora_migrator'@'localhost';

SET @create_local_app = CONCAT(
  "CREATE USER IF NOT EXISTS 'gigvora_app'@'localhost' IDENTIFIED BY '",
  @escaped_app_password,
  "' PASSWORD EXPIRE INTERVAL 365 DAY;"
);
PREPARE stmt FROM @create_local_app;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @alter_local_app = CONCAT(
  "ALTER USER 'gigvora_app'@'localhost' IDENTIFIED BY '",
  @escaped_app_password,
  "' PASSWORD EXPIRE INTERVAL 365 DAY;"
);
PREPARE stmt FROM @alter_local_app;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

GRANT `gigvora_app_role` TO 'gigvora_app'@'localhost';
SET DEFAULT ROLE `gigvora_app_role` FOR 'gigvora_app'@'localhost';

FLUSH PRIVILEGES;

-- The Sequelize migrations will create and evolve tables. Run `npm run migrate`
-- with the `gigvora_migrator` credentials once the repository scripts are executed.
