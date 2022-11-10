import template from './febf-fast-order-list.html.twig';

Shopware.Component.register('febf-fast-order-list', {
    template,

    inject: [
        'repositoryFactory',
    ],

    data() {
        return {
            repository: null,
            fastOrderLogs: null
        }
    },

    metaInfo() {
        return {
            title: this.$createTitle()
        }
    },

    computed: {
        columns() {
            return this.getColumns()
        }
    },

    created() {
        this.componentCreated();
    },

    methods: {
        componentCreated() {
            this.repository = this.repositoryFactory.create('febf_fast_order_log');

            this.repository.search(new Shopware.Data.Criteria(), Shopware.Context.api).then(res => {
                this.fastOrderLogs = res;
            })
        },

        getColumns() {
            return [{
                property: 'sessionId',
                label: this.$t('febf-fast-order.list.column.sessionId'),
                allowResize: true,
                primary: true,
                routerLink: 'febf.fast_order.details'
            }, {
                property: 'type',
                label: this.$t('febf-fast-order.list.column.type'),
                allowResize: true
            }];
        }
    }
});
