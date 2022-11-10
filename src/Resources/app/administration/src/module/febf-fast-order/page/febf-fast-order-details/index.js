import template from './febf-fast-order-details.html.twig';

Shopware.Component.register('febf-fast-order-details', {

    template,

    inject: [
        "repositoryFactory"
    ],

    computed: {
        columns() {
            return this.getColumns();
        }
    },

    data() {
        return {
            repository: null,
            fastOrderLog: null,
            orderInfoData: null
        }
    },

    metaInfo() {
        return {
            title: this.$createTitle()
        }
    },

    created() {
        this.componentCreated();
    },

    methods: {
        componentCreated() {
            this.repository = this.repositoryFactory.create('febf_fast_order_log');
            this.repository.get(this.$route.params.id, Shopware.Context.api).then(entity => {
                this.fastOrderLog = entity;
            })
        },

        getColumns() {
            return [{
                property: 'productNumber',
                label: this.$t('febf-fast-order.details.column.productNumber'),
                primary: true,
                routerLink: 'sw.product.detail'
            }, {
                property: 'amount',
                label: this.$t('febf-fast-order.details.column.amount')
            }]
        }
    }

});
