import { createSlice } from '@reduxjs/toolkit';
import setPath from 'lodash/set';
import merge from 'lodash/merge';
import { DEFAULT_LANGUAGE, LOCALE_COOKIE_KEY } from 'app/client_config';
import cookie from 'react-cookie';

const baseState = {
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
};

function getDefaultState() {
    const state = { ...baseState };

    if (process.env.BROWSER) {
        const locale = cookie.load(LOCALE_COOKIE_KEY);
        if (locale) state.locale = locale;

        state.nightmodeEnabled =
            localStorage.getItem('nightmodeEnabled') == 'true' || false;
    }

    return state;
}

const userSlice = createSlice({
    name: 'user',
    initialState: getDefaultState(),
    reducers: {
        requireLogin(state) {
            state.show_login_modal = true;
            state.loginDefault = {
                unclosable: true,
                cancelIsRegister: true,
                blurring: true,
            };
        },
        showLogin(state, { payload }) {
            if (typeof payload === 'function') payload = undefined;

            state.show_login_modal = true;
            state.loginBroadcastOperation = payload && payload.operation;
            state.loginDefault = payload && payload.loginDefault;
        },
        hideLogin(state) {
            state.show_login_modal = false;
            state.loginBroadcastOperation = undefined;
            state.loginDefault = undefined;
        },
        saveLoginConfirm(state, { payload }) {
            state.saveLoginConfirm = payload;
        },
        saveLogin() {
            // Saga-only action. Use only for low security keys.
        },
        getAccount() {
            // Saga-only action.
        },
        removeHighSecurityKeys(state) {
            if (!state.current || !state.current.private_keys) return;
            delete state.current.private_keys.owner_private;
            delete state.current.private_keys.active_private;
        },
        changeCurrency(state, { payload }) {
            state.currency = payload;
        },
        changeLanguage(state, { payload }) {
            state.locale = payload;
        },
        toggleNightmode(state) {
            const nightmodeEnabled =
                localStorage.getItem('nightmodeEnabled') == 'true' || false;

            localStorage.setItem('nightmodeEnabled', !nightmodeEnabled);
            state.nightmodeEnabled = !nightmodeEnabled;
        },
        showTransfer(state) {
            state.show_transfer_modal = true;
        },
        hideTransfer(state) {
            state.show_transfer_modal = false;
        },
        setTransferDefaults(state, { payload }) {
            state.transfer_defaults = payload;
        },
        clearTransferDefaults(state) {
            delete state.transfer_defaults;
        },
        showDonate(state) {
            state.show_donate_modal = true;
        },
        hideDonate(state) {
            state.show_donate_modal = false;
        },
        setDonateDefaults(state, { payload }) {
            state.donate_defaults = payload;
        },
        showGiftNft(state) {
            state.show_nft_gift_modal = true;
        },
        hideGiftNft(state) {
            state.show_nft_gift_modal = false;
        },
        setGiftNftDefaults(state, { payload }) {
            state.gift_nft_defaults = payload;
        },
        showConvertAssets(state) {
            state.show_convert_assets_modal = true;
        },
        hideConvertAssets(state) {
            state.show_convert_assets_modal = false;
        },
        setConvertAssetsDefaults(state, { payload }) {
            state.convert_assets_defaults = payload;
        },
        showPowerdown(state) {
            state.show_powerdown_modal = true;
        },
        hidePowerdown(state) {
            state.show_powerdown_modal = false;
        },
        setPowerdownDefaults(state, { payload }) {
            state.powerdown_defaults = payload;
        },
        clearPowerdownDefaults(state) {
            delete state.powerdown_defaults;
        },
        showPromotePost(state) {
            state.show_promote_post_modal = true;
        },
        hidePromotePost(state) {
            state.show_promote_post_modal = false;
        },
        showOpenOrders(state) {
            state.show_open_orders_modal = true;
        },
        hideOpenOrders(state) {
            state.show_open_orders_modal = false;
        },
        setOpenOrdersDefaults(state, { payload }) {
            state.open_orders_defaults = payload;
        },
        showChangeAccount(state) {
            state.show_change_account_modal = true;
        },
        hideChangeAccount(state) {
            state.show_change_account_modal = false;
        },
        showAddAccount(state) {
            state.show_add_account_modal = true;
        },
        hideAddAccount(state) {
            state.show_add_account_modal = false;
        },
        showAppDownload(state) {
            state.show_app_download_modal = true;
        },
        hideAppDownload(state) {
            state.show_app_download_modal = false;
        },
        usernamePasswordLogin() {
            // Saga-only action.
        },
        changeAccount() {
            // Saga-only action.
        },
        setUser(state, { payload }) {
            const user = { ...payload };
            if (user.vesting_shares) {
                user.vesting_shares = parseFloat(user.vesting_shares);
            }
            if (user.delegated_vesting_shares) {
                user.delegated_vesting_shares = parseFloat(
                    user.delegated_vesting_shares
                );
            }
            if (user.received_vesting_shares) {
                user.received_vesting_shares = parseFloat(
                    user.received_vesting_shares
                );
            }

            state.current = merge({}, state.current || {}, user);
            state.show_login_modal = false;
            state.loginBroadcastOperation = undefined;
            state.loginDefault = undefined;
            state.logged_out = undefined;
        },
        closeLogin(state) {
            state.login_error = undefined;
            state.show_login_modal = false;
            state.loginBroadcastOperation = undefined;
            state.loginDefault = undefined;
        },
        loginError(state, { payload: { error, ...rest } }) {
            state.login_error = { error, ...rest };
            state.logged_out = undefined;
        },
        logout() {
            return { ...getDefaultState(), logged_out: true };
        },
        showSignUp(state) {
            state.show_signup_modal = true;
        },
        hideSignUp(state) {
            state.show_signup_modal = false;
        },
        keysError(state, { payload: { error } }) {
            state.keys_error = error;
        },
        accountAuthLookup() {
            // AuthSaga action.
        },
        setAuthority(state, { payload: { accountName, auth, pub_keys_used } }) {
            if (!state.authority) state.authority = {};
            state.authority[accountName] = auth;
            if (pub_keys_used) state.pub_keys_used = pub_keys_used;
        },
        hideConnectionErrorModal(state) {
            state.hide_connection_error_modal = true;
        },
        set(state, { payload: { key, value } }) {
            setPath(state, Array.isArray(key) ? key : [key], value);
        },
        notificationChannelCreated(state) {
            state.notification_channel_created = true;
        },
        notificationChannelDestroyed(state) {
            state.notification_channel_created = false;
        },
        lookupPreviousOwnerAuthority() {
            // Saga-only action.
        },
        loadSavingsWithdraw() {
            // Saga-only action.
        },
        uploadImage() {
            // Saga-only action.
        },
    },
});

export default userSlice;
