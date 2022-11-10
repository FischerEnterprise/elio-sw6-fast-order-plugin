<?php declare(strict_types=1);

namespace Febf\FastOrderPlugin\Content\FastOrderLog;

use Shopware\Core\Framework\DataAbstractionLayer\EntityCollection;

class FastOrderLogCollection extends EntityCollection {
    protected function getExpectedClass(): string
    {
        return FastOrderLogEntity::class;
    }
}
