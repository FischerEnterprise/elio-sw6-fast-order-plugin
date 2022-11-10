<?php declare(strict_types=1);

namespace Febf\FastOrderPlugin\Migration;

use Doctrine\DBAL\Connection;
use Doctrine\DBAL\Exception;
use Shopware\Core\Framework\Migration\MigrationStep;

class Migration1668007421 extends MigrationStep
{
    public function getCreationTimestamp(): int
    {
        return 1668007421;
    }

    /**
     * @throws Exception
     */
    public function update(Connection $connection): void
    {
        $connection->executeStatement(<<<SQL
            CREATE TABLE `febf_fast_order_log` (
                `id` BINARY(16) NOT NULL,
                `type` VARCHAR(255) NOT NULL,
                `session_id` VARCHAR(255) NOT NULL,
                `order_info` JSON NOT NULL,
                `created_at` DATETIME(3) NOT NULL,
                `updated_at` DATETIME(3) NULL,
                PRIMARY KEY (`id`),
                CONSTRAINT `json.febf_fast_order_log.order_info` CHECK (JSON_VALID(`order_info`))
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        SQL);
    }

    public function updateDestructive(Connection $connection): void
    {
        // implement update destructive
    }
}
