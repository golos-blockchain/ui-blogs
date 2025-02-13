import {fromJS} from 'immutable';
import createModule from 'redux-modules';
import {DEFAULT_LANGUAGE, LOCALE_COOKIE_KEY} from 'app/client_config';
import cookie from "react-cookie";

const defaultState = fromJS({
    current: null,
    show_login_modal: false,
    show_transfer_modal: false,
    show_donate_modal: false,
    show_nft_gift_modal: false,
    show_convert_assets_modal: false,
    show_promote_post_modal: false,
    show_signup_modal: false,
    show_open_orders_modal: false,
    show_change_account_modal: false,
    show_add_account_modal: false,
    show_app_download_modal: false,
    pub_keys_used: null,
    locale: DEFAULT_LANGUAGE,
    nightmodeEnabled: false,
});

if (process.env.BROWSER) {
    const locale = cookie.load(LOCALE_COOKIE_KEY)
    if (locale) defaultState.locale = locale;

    // TODO Чет нихера не цепляет при первой загрузке
    defaultState.nightmodeEnabled = localStorage.getItem('nightmodeEnabled') == 'true' || false
}

export default createModule({
    name: 'user',
    initialState: defaultState,
    transformations: [
        {
            action: 'REQUIRE_LOGIN',
            reducer: (state, {payload}) => {
                return state.merge({
                    show_login_modal: true, 
                    loginDefault: {
                        unclosable: true,
                        cancelIsRegister: true,
                        blurring: true
                    }
                })
            }
        },
        {
            action: 'SHOW_LOGIN',
            reducer: (state, {payload}) => {
                // https://github.com/mboperator/redux-modules/issues/11
                if (typeof payload === 'function') payload = undefined
                let operation, loginDefault
                if (payload) {
                    operation = fromJS(payload.operation)
                    loginDefault = fromJS(payload.loginDefault)
                }
                return state.merge({show_login_modal: true, loginBroadcastOperation: operation, loginDefault})
            }
        },

        { action: 'HIDE_LOGIN', reducer: state =>
            state.merge({show_login_modal: false, loginBroadcastOperation: undefined, loginDefault: undefined}) },
        { action: 'SAVE_LOGIN_CONFIRM', reducer: (state, {payload}) => state.set('saveLoginConfirm', payload) },
        { action: 'SAVE_LOGIN', reducer: (state) => state }, // Use only for low security keys (like posting only keys)
        { action: 'GET_ACCOUNT', reducer: (state) => state },
        { action: 'CHANGE_CURRENCY', reducer: (state, {payload}) => {
            return state.set('currency', payload)}
        },
        { action: 'CHANGE_LANGUAGE', reducer: (state, {payload}) => {
            return state.set('locale', payload)}
        },
        { action: 'TOGGLE_NIGHTMODE', reducer: (state) => {
            const nightmodeEnabled = localStorage.getItem('nightmodeEnabled') == 'true' || false

            localStorage.setItem('nightmodeEnabled', !nightmodeEnabled)
            return state.set('nightmodeEnabled', !nightmodeEnabled)
          }
        },
        { action: 'SHOW_TRANSFER', reducer: state => state.set('show_transfer_modal', true) },
        { action: 'HIDE_TRANSFER', reducer: state => state.set('show_transfer_modal', false) },
        { action: 'SET_TRANSFER_DEFAULTS', reducer: (state, {payload}) => state.set('transfer_defaults', fromJS(payload)) },
        { action: 'CLEAR_TRANSFER_DEFAULTS', reducer: (state) => state.remove('transfer_defaults') },
        { action: 'SHOW_DONATE', reducer: state => state.set('show_donate_modal', true) },
        { action: 'HIDE_DONATE', reducer: state => state.set('show_donate_modal', false) },
        { action: 'SET_DONATE_DEFAULTS', reducer: (state, {payload}) => state.set('donate_defaults', fromJS(payload)) },
        { action: 'SHOW_GIFT_NFT', reducer: state => state.set('show_gift_nft_modal', true) },
        { action: 'HIDE_GIFT_NFT', reducer: state => state.set('show_gift_nft_modal', false) },
        { action: 'SET_GIFT_NFT_DEFAULTS', reducer: (state, {payload}) => state.set('gift_nft_defaults', fromJS(payload)) },
        { action: 'SHOW_CONVERT_ASSETS', reducer: state => state.set('show_convert_assets_modal', true) },
        { action: 'HIDE_CONVERT_ASSETS', reducer: state => state.set('show_convert_assets_modal', false) },
        { action: 'SET_CONVERT_ASSETS_DEFAULTS', reducer: (state, {payload}) => state.set('convert_assets_defaults', fromJS(payload)) },
        { action: 'SHOW_POWERDOWN', reducer: state =>  state.set('show_powerdown_modal', true) },
        { action: 'HIDE_POWERDOWN', reducer: state => state.set('show_powerdown_modal', false) },
        { action: 'SET_POWERDOWN_DEFAULTS', reducer: (state, {payload}) => state.set('powerdown_defaults', fromJS(payload)) },
        { action: 'CLEAR_POWERDOWN_DEFAULTS', reducer: state => state.remove('powerdown_defaults') },
        { action: 'SHOW_PROMOTE_POST', reducer: state => state.set('show_promote_post_modal', true) },
        { action: 'HIDE_PROMOTE_POST', reducer: state => state.set('show_promote_post_modal', false) },
        { action: 'SHOW_OPEN_ORDERS', reducer: state => state.set('show_open_orders_modal', true)  },
        { action: 'HIDE_OPEN_ORDERS', reducer: state => state.set('show_open_orders_modal', false) },
        { action: 'SET_OPEN_ORDERS_DEFAULTS', reducer: (state, {payload}) => state.set('open_orders_defaults', fromJS(payload)) },
        { action: 'SHOW_CHANGE_ACCOUNT', reducer: state => state.set('show_change_account_modal', true) },
        { action: 'HIDE_CHANGE_ACCOUNT', reducer: state => state.set('show_change_account_modal', false) },
        { action: 'SHOW_ADD_ACCOUNT', reducer: state => state.set('show_add_account_modal', true) },
        { action: 'HIDE_ADD_ACCOUNT', reducer: state => state.set('show_add_account_modal', false) },
        { action: 'SHOW_APP_DOWNLOAD', reducer: state => state.set('show_app_download_modal', true) },
        { action: 'HIDE_APP_DOWNLOAD', reducer: state => state.set('show_app_download_modal', false) },
        {
            action: 'USERNAME_PASSWORD_LOGIN',
            reducer: state => state, // saga
        },
        {
            action: 'CHANGE_ACCOUNT',
            reducer: state => state, // saga
        },
        {
            action: 'SET_USER',
            reducer: (state, {payload}) => {
                if (payload.vesting_shares)
                    payload.vesting_shares = parseFloat(payload.vesting_shares);
                if (payload.delegated_vesting_shares)
                    payload.delegated_vesting_shares = parseFloat(payload.delegated_vesting_shares);
                if (payload.received_vesting_shares)
                    payload.received_vesting_shares = parseFloat(payload.received_vesting_shares);
                    
                return state.mergeDeep({ current: payload, show_login_modal: false, loginBroadcastOperation: undefined, loginDefault: undefined, logged_out: undefined })
            }
        },
        {
            action: 'CLOSE_LOGIN',
            reducer: (state) => state.merge({ login_error: undefined, show_login_modal: false, loginBroadcastOperation: undefined, loginDefault: undefined })
        },
        {
            action: 'LOGIN_ERROR',
            reducer: (state, {payload: {error, ...rest}}) => state.merge({ login_error: { error, ...rest },
                logged_out: undefined })
        },
        {
            action: 'LOGOUT',
            reducer: () => {
                return defaultState.merge({logged_out: true})
            }
        },
        // {
        //     action: 'ACCEPTED_COMMENT',
        //     // User can only post 1 comment per minute
        //     reducer: (state) => state.merge({ current: {lastComment: Date.now()} })
        // },
        { action: 'SHOW_SIGN_UP', reducer: state => state.set('show_signup_modal', true) },
        { action: 'HIDE_SIGN_UP', reducer: state => state.set('show_signup_modal', false) },

        {
            action: 'KEYS_ERROR',
            reducer: (state, {payload: {error}}) => state.merge({ keys_error: error })
        },
        // { action: 'UPDATE_PERMISSIONS', reducer: state => {
        //     return state // saga
        // }},
        { // AuthSaga
            action: 'ACCOUNT_AUTH_LOOKUP',
            reducer: state => state
        },
        { // AuthSaga
            action: 'SET_AUTHORITY',
            reducer: (state, {payload: {accountName, auth, pub_keys_used}}) => {
                state = state.setIn(['authority', accountName], fromJS(auth))
                if(pub_keys_used)
                    state = state.set('pub_keys_used', pub_keys_used)
                return state
            },
        },
        { action: 'HIDE_CONNECTION_ERROR_MODAL', reducer: state => state.set('hide_connection_error_modal', true) },
        {
            action: 'SET',
            reducer: (state, {payload: {key, value}}) => {
                key = Array.isArray(key) ? key : [key]
                return state.setIn(key, fromJS(value))
            }
        },
        { action: 'NOTIFICATION_CHANNEL_CREATED', reducer: state => state.set('notification_channel_created', true) },
        { action: 'NOTIFICATION_CHANNEL_DESTROYED', reducer: state => state.set('notification_channel_created', false) },
    ]
});
