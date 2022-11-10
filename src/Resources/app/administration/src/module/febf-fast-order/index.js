import "./page/febf-fast-order-list";
import "./page/febf-fast-order-details";

import deDE from './snippet/de-DE.json';
import enGB from './snippet/en-GB.json';

Shopware.Module.register('febf-fast_order', {
    type: 'plugin',
    name: 'febf-fast-order',
    title: 'febf-fast-order.general.mainMenuItemGeneral',
    description: 'febf-fast-order.general.descriptionTextModule',
    color: '#ff3d58',
    icon: 'default-shopping-paper-bag-product',

    snippets: {
        'de-DE': deDE,
        'en-GB': enGB
    },

    routes: {
        list: {
            component: 'febf-fast-order-list',
            path: 'list'
        },
        details: {
            component: 'febf-fast-order-details',
            path: 'details/:id'
        },
    },

    navigation: [{
        id: 'febf-fast-order',
        path: 'febf.fast_order.list',
        parent: 'sw-order',
        label: 'febf-fast-order.general.mainMenuItemGeneral',
        icon: 'default-shopping-paper-bag-product',
        position: 100
    }],
});
