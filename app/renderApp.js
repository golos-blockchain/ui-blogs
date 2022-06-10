import 'whatwg-fetch';
import * as golos from 'golos-lib-js';

import './assets/stylesheets/app.scss';
import plugins from 'app/utils/JsPlugins';
import { clientRender } from 'shared/UniversalRender';
import { serverApiRecordEvent } from 'app/utils/ServerApiClient';

// window.onerror = error => {
//     if (window.$STM_csrf) serverApiRecordEvent('client_error', error);
// };

export default async function renderApp(initialState) {
    if (process.env.BROWSER) {
        await golos.importNativeLib();
    }

    const config = initialState.offchain.config
    golos.config.set('websocket', config.ws_connection_client)
    if (config.chain_id)
        golos.config.set('chain_id', config.chain_id)
    window.$STM_Config = config;
    plugins(config);

    if (initialState.offchain.serverBusy) {
        window.$STM_ServerBusy = true;
    }
    if (initialState.offchain.csrf) {
        window.$STM_csrf = initialState.offchain.csrf;
        delete initialState.offchain.csrf;
    }

    try {
        clientRender(initialState)
    } catch (error) {
        console.error(error)
        serverApiRecordEvent('client_error', error)
    }
}