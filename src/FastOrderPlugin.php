<?php

declare(strict_types=1);

namespace Febf\FastOrderPlugin;

use Doctrine\DBAL\Connection;
use Shopware\Core\Framework\Plugin;
use Shopware\Core\Framework\Plugin\Context\UninstallContext;

class FastOrderPlugin extends Plugin
{
    public function uninstall(UninstallContext $uninstallContext): void
    {
        parent::uninstall($uninstallContext);

        if ($uninstallContext->keepUserData())
            return;

        $connection = $this->container->get(Connection::class);

        $connection->executeStatement(<<<MYSQL
            DROP TABLE `febf_fast_order_log`;
        MYSQL);
    }


}
