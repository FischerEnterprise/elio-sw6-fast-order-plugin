<?php declare(strict_types=1);

namespace Febf\FastOrderPlugin\Content\FastOrderLog;

use Shopware\Core\Framework\DataAbstractionLayer\Entity;
use Shopware\Core\Framework\DataAbstractionLayer\EntityIdTrait;

class FastOrderLogEntity extends Entity
{
    public const TYPE_ADD_TO_CART = 't_add_to_cart';

    use EntityIdTrait;

    /**
     * @var string
     */
    protected string $sessionId;

    /**
     * @var string
     */
    protected string $type;

    /**
     * @var array
     */
    protected array $orderInfo;

    /**
     * @return string
     */
    public function getSessionId(): string
    {
        return $this->sessionId;
    }

    /**
     * @param string $sessionId
     */
    public function setSessionId(string $sessionId): void
    {
        $this->sessionId = $sessionId;
    }

    /**
     * @return array
     */
    public function getOrderInfo(): array
    {
        return $this->orderInfo;
    }

    /**
     * @param array $orderInfo
     */
    public function setOrderInfo(array $orderInfo): void
    {
        $this->orderInfo = $orderInfo;
    }

    /**
     * @return string
     */
    public function getType(): string
    {
        return $this->type;
    }

    /**
     * @param string $type
     */
    public function setType(string $type): void
    {
        $this->type = $type;
    }


}
