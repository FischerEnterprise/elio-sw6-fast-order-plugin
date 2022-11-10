<?php declare(strict_types=1);

namespace Febf\FastOrderPlugin\Content\FastOrderLog;

use Shopware\Core\Framework\DataAbstractionLayer\EntityDefinition;
use Shopware\Core\Framework\DataAbstractionLayer\Field\CreatedAtField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\DateTimeField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\Flag\PrimaryKey;
use Shopware\Core\Framework\DataAbstractionLayer\Field\Flag\Required;
use Shopware\Core\Framework\DataAbstractionLayer\Field\IdField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\JsonField;
use Shopware\Core\Framework\DataAbstractionLayer\Field\StringField;
use Shopware\Core\Framework\DataAbstractionLayer\FieldCollection;

class FastOrderLogDefinition extends EntityDefinition {

    public const ENTITY_NAME = 'febf_fast_order_log';

    public function getEntityName(): string
    {
        return self::ENTITY_NAME;
    }

    protected function defineFields(): FieldCollection
    {
        return new FieldCollection([
            (new IdField('id', 'id'))->addFlags(new Required(), new PrimaryKey()),
            (new StringField('session_id', 'sessionId'))->addFlags(new Required()),
            (new StringField('type', 'type'))->addFlags(new Required()),
            (new JsonField('order_info', 'orderInfo'))->addFlags(new Required()),
            new CreatedAtField(),
        ]);
    }
}
