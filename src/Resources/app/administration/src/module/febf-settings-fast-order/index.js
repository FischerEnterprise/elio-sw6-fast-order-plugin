import './page/febf-settings-fast-order-view';
import './extension/febf-settings-index'

Shopware.Module.register('febf-settings-fast_order', {
    type: 'plugin',
    name: 'settings-fast_order',
    title: 'febf-settings-fast_order.general.mainMenuItem',
    description: 'febf-settings-fast_order.general.description',
    color: '#9AA8B5',
    icon: 'default-action-settings',
    favicon: 'icon-module-settings.png',

    routes: {
        index: {
            component: 'febf-settings-fast_order-view',
            path: 'index',
            meta: {
                parentPath: 'sw.settings.index',
                privilege: 'admin'
            }
        }
    },

    settingsItem: [{
        group: 'plugins',
        to: 'febf.settings.fast_order.index',
        icon: 'default-object-shield',
        name: 'febf-settings-fast_order.general.mainMenuItem'
    }]
});
