import template from './febf-settings-fast_order-view.html.twig';

Shopware.Component.register('febf-settings-fast_order-view', {
    template,

    data() {
        return {
            isLoading: true
        }
    },

    methods: {
        onSave() {
            window.alert("SAVE");
        }
    }
});
