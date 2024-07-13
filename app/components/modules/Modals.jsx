import React from 'react';
import PropTypes from 'prop-types'
import {connect} from 'react-redux';
import Confetti from 'react-dom-confetti'
import CloseButton from 'react-foundation-components/lib/global/close-button';
import Reveal from 'react-foundation-components/lib/global/reveal';

import { CONFETTI_CONFIG } from 'app/client_config'
import LoginForm from 'app/components/modules/LoginForm';
import ConfirmTransactionForm from 'app/components/modules/ConfirmTransactionForm';
import Donate from 'app/components/modules/Donate'
import GiftNFT from 'app/components/modules/GiftNFT'
import SignUp from 'app/components/modules/SignUp'
import ChangeAccount from 'app/components/modules/ChangeAccount'
import AddAccount from 'app/components/modules/AddAccount'
import AppDownload from 'app/components/modules/app/AppDownload'
import user from 'app/redux/User';
import tr from 'app/redux/Transaction';
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate';

let keyIndex = 0;

class Modals extends React.Component {
    static propTypes = {
        show_login_modal: PropTypes.bool,
        show_confirm_modal: PropTypes.bool,
        show_donate_modal: PropTypes.bool,
        show_gift_nft_modal: PropTypes.bool,
        show_signup_modal: PropTypes.bool,
        show_promote_post_modal: PropTypes.bool,
        show_change_account_modal: PropTypes.bool,
        show_add_account_modal: PropTypes.bool,
        show_app_download_modal: PropTypes.bool,
        confetti_nft_active: PropTypes.bool,
        hideLogin: PropTypes.func.isRequired,
        hideConfirm: PropTypes.func.isRequired,
        hideSignUp: PropTypes.func.isRequired,
        hideDonate: PropTypes.func.isRequired,
        hidePromotePost: PropTypes.func.isRequired,
        hideAppDownload: PropTypes.func.isRequired,
        notifications: PropTypes.object,
        removeNotification: PropTypes.func,
    };

    constructor() {
        super();
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'Modals');
    }

    onLoginTryClose = (e) => {
        const { loginUnclosable } = this.props;
        if (loginUnclosable)
            throw new Error('Closing login modal is forbidden here');
    };

    render() {
        const {
            show_login_modal,
            loginBlurring,
            show_confirm_modal,
            show_donate_modal,
            show_gift_nft_modal,
            show_signup_modal,
            show_change_account_modal,
            show_add_account_modal,
            show_app_download_modal,
            confetti_nft_active,
            hideLogin,
            hideDonate,
            hideGiftNFT,
            hideConfirm,
            hideSignUp,
            hideChangeAccount,
            hideAddAccount,
            hideAppDownload,
            notifications,
            removeNotification,
        } = this.props;

        const notifications_array = notifications ? notifications.toArray().map(n => {
            if (!n.key) {
                n.key = ++keyIndex;
            }
            n.onClick = () => removeNotification(n.key);
            return n;
        }) : [];

        const loginClass = loginBlurring ? 'reveal-blurring' : undefined

        return (
            <div>
                {show_login_modal && <Reveal overlayClassName={loginClass} onBackdropClick={this.onLoginTryClose} onEscapeKeyDown={this.onLoginTryClose} onHide={hideLogin} show={show_login_modal}>
                    <LoginForm onCancel={hideLogin} />
                </Reveal>}
                {show_confirm_modal && <Reveal onHide={hideConfirm} show={show_confirm_modal}>
                    <CloseButton onClick={hideConfirm} />
                    <ConfirmTransactionForm onCancel={hideConfirm} />
                </Reveal>}
                {show_donate_modal && <Reveal onHide={hideDonate} show={show_donate_modal} revealStyle={{ width: '600px' }}>
                    <CloseButton onClick={hideDonate} />
                    <Donate />
                </Reveal>}
                {show_gift_nft_modal && <Reveal onHide={hideGiftNFT} show={show_gift_nft_modal} revealStyle={{ width: '600px' }}>
                    <CloseButton onClick={hideGiftNFT} />
                    <GiftNFT onCancel={hideGiftNFT} />
                </Reveal>}
                {show_signup_modal && <Reveal onHide={hideSignUp} show={show_signup_modal}>
                    <CloseButton onClick={hideSignUp} />
                    <SignUp />
                </Reveal>}
                {show_change_account_modal && <Reveal onHide={hideChangeAccount} show={show_change_account_modal} revealStyle={{ width: '400px' }}>
                    <CloseButton onClick={hideChangeAccount} />
                    <ChangeAccount />
                </Reveal>}
                {show_add_account_modal && <Reveal onHide={hideAddAccount} show={show_add_account_modal}>
                    <CloseButton onClick={hideAddAccount} />
                    <AddAccount />
                </Reveal>}
                {show_app_download_modal && <Reveal onHide={hideAppDownload} show={show_app_download_modal}>
                    <CloseButton onClick={hideAppDownload} />
                    <AppDownload />
                </Reveal>}
                <div style={{ position: 'fixed', zIndex: 10000000, bottom: '50%', left: '50%' }}>
                    <Confetti config={{...CONFETTI_CONFIG, elementCount: 1000}} active={confetti_nft_active} />
                </div>
            </div>
        );
    }
}

export default connect(
    state => {
        const loginDefault = state.user.get('loginDefault');
        const loginUnclosable = loginDefault && loginDefault.get('unclosable');
        const loginBlurring = loginDefault && loginDefault.get('blurring')
        return {
            show_login_modal: state.user.get('show_login_modal'),
            loginUnclosable,
            loginBlurring,
            show_confirm_modal: state.transaction.get('show_confirm_modal'),
            show_donate_modal: state.user.get('show_donate_modal'),
            show_gift_nft_modal: state.user.get('show_gift_nft_modal'),
            show_promote_post_modal: state.user.get('show_promote_post_modal'),
            show_signup_modal: state.user.get('show_signup_modal'),
            show_change_account_modal: state.user.get('show_change_account_modal'),
            show_add_account_modal: state.user.get('show_add_account_modal'),
            show_app_download_modal: state.user.get('show_app_download_modal'),
            notifications: state.app.get('notifications'),
            confetti_nft_active: state.global.get('confetti_nft_active')
        }
    },
    dispatch => ({
        hideLogin: e => {
            if (e) e.preventDefault();
            dispatch(user.actions.hideLogin())
        },
        hideConfirm: e => {
            if (e) e.preventDefault();
            dispatch(tr.actions.hideConfirm())
        },
        hideDonate: e => {
            if (e) e.preventDefault()
            dispatch(user.actions.hideDonate())
        },
        hideGiftNFT: e => {
            if (e) e.preventDefault()
            dispatch(user.actions.hideGiftNft())
        },
        hidePromotePost: e => {
            if (e) e.preventDefault();
            dispatch(user.actions.hidePromotePost())
        },
        hideSignUp: e => {
            if (e) e.preventDefault();
            dispatch(user.actions.hideSignUp())
        },
        hideChangeAccount: e => {
            if (e) e.preventDefault();
            dispatch(user.actions.hideChangeAccount())
        },
        hideAddAccount: e => {
            if (e) e.preventDefault();
            dispatch(user.actions.hideAddAccount())
        },
        hideAppDownload: e => {
            if (e) e.preventDefault()
            dispatch(user.actions.hideAppDownload())
        },
        // example: addNotification: ({key, message}) => dispatch({type: 'ADD_NOTIFICATION', payload: {key, message}}),
        removeNotification: (key) => dispatch({type: 'REMOVE_NOTIFICATION', payload: {key}}),

    })
)(Modals)
