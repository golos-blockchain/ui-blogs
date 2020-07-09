import React from 'react';
import PropTypes from 'prop-types'
import {connect} from 'react-redux';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate';
import transaction from 'app/redux/Transaction';
import {Set, Map} from 'immutable'
import tt from 'counterpart';
import user from 'app/redux/User';
import { getMutedInNew } from 'app/utils/NormalizeProfile';
import o2j from 'shared/clash/object2json'

const {string, bool, any} = PropTypes;
import { LIQUID_TICKER } from 'app/client_config';

export default class Follow extends React.Component {
    static propTypes = {
        following: string,
        follower: string, // OPTIONAL default to current user
        showFollow: bool,
        showMute: bool,
        donateUrl: string,
        children: any,
        showLogin: PropTypes.func.isRequired,
    };

    static defaultProps = {
        showFollow: true,
        showMute: true,
    };

    constructor(props) {
        super();
        this.state = {};
        this.initEvents(props);
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'Follow');
    }

    componentWillUpdate(nextProps) {
        this.initEvents(nextProps)
    }

    initEvents(props) {
        const {updateFollow, follower, following} = props;

        /** @param {string} [msg] Confirmation message. */
        const upd = (type, msg) => {
            if(this.state.busy) return;

            // const c = !msg || !confirm || confirm(msg)
            // if (!c) return

            this.setState({busy: true});
            const done = () => {this.setState({busy: false})};
            updateFollow(follower, following, type, done)
        };
        this.follow = upd.bind(null, 'blog', tt('g.confirm_follow'))
        this.unfollow = upd.bind(null, null, tt('g.confirm_unfollow'))
        this.ignore = upd.bind(null, 'ignore', tt('g.confirm_ignore'))
        this.unignore = upd.bind(null, null, tt('g.confirm_unignore'))
    }

    followLoggedOut = (e) => {
        // close author preview if present
        const author_preview = document.querySelector('.dropdown-pane.is-open');
        if(author_preview) author_preview.remove();
        // resume authenticate modal
        this.props.showLogin(e);
    }

    showTransfer = () => {
        const asset = LIQUID_TICKER;
        const transferType = 'Transfer to Account';
        // const memo = url;
        // const memo = window.JSON.stringify({donate: {post: this.props.donateUrl}});
        // store/user/transfer_defaults structure initialized correctly for each transfer type
        // (click in wallet, external link, donate from PostFull)
        // so, mark this kind of transfer with a flag for now to analyze in transfer.jsx
        // the rest of transfer types don't have the flag for now
        // todo redesign transfer types globally
        const flag = {
            type: `donate`,
            fMemo: () => JSON.stringify({ donate: { post: this.props.donateUrl } }),
        };

        document.body.click();

        this.props.showTransfer({
            flag,
            to: this.props.following,
            asset,
            transferType,
            // memo,
            disableMemo: false,
            disableTo: true,
        });
    };

    unmuteNew = () => {
        let {follower, following, metaData, updateAccount} = this.props

        metaData.mutedInNew = metaData.mutedInNew.filter(val => val !== following);

        updateAccount({
            json_metadata: JSON.stringify(metaData),
            account: follower,
            errorCallback: (e) => {},
            successCallback: () => {
            }
        })
    };

    render() {
        const {loading} = this.props;
        if(loading) return <span><LoadingIndicator /> {tt('g.loading')}&hellip;</span>;
        if(loading !== false) {
            // must know what the user is already following before any update can happen
            return <span></span>
        }

        const {follower, following} = this.props; // html
        // Show follow preview for new users
        if(!follower || !following) return <span>
             <label className="button slim hollow secondary" onClick={this.followLoggedOut}>{tt('g.follow')}</label>
        </span>;
        // Can't follow or ignore self
        if(follower === following) return <span></span>

        const {followingWhat} = this.props; // redux
        const {showFollow, showMute, showMuteInNew, donateUrl, children} = this.props; // html
        const {busy} = this.state;

        const cnBusy = busy ? 'disabled' : '';
        const cnInactive = 'button slim hollow secondary ' + cnBusy;
        const cnDonate = 'button slim alert ' + cnBusy;
        return <span>
            {showFollow && followingWhat !== 'blog' &&
                <label className={cnInactive} onClick={this.follow}>{tt('g.follow')}</label>}

            {showFollow && followingWhat === 'blog' &&
                <label className={cnInactive} onClick={this.unfollow}>{tt('g.unfollow')}</label>}

            {showMute && followingWhat !== 'ignore' &&
                <label className={cnInactive} onClick={this.ignore}>{tt('g.mute')}</label>}

            {showMute && followingWhat === 'ignore' &&
                <label className={cnInactive} onClick={this.unignore}>{tt('g.unmute')}</label>}

            {showMuteInNew &&
                <label className={cnInactive} onClick={this.unmuteNew}>{tt('g.unmute')}</label>}

            {donateUrl &&
                <label style={{color: '#fff'}} className={cnDonate} onClick={this.showTransfer}>&nbsp;{tt('g.transfer2')}&nbsp;</label>}

            {children && <span>&nbsp;&nbsp;{children}</span>}
        </span>
    }
}

const emptyMap = Map();
const emptySet = Set();

module.exports = connect(
    (state, ownProps) => {
        let {follower} = ownProps;
        const current_user = state.user.get('current');
        if(!follower) {
            follower = current_user ? current_user.get('username') : null
        }

        const account = state.global.getIn(['accounts', follower])
        let metaData = account ? o2j.ifStringParseJSON(account.get('json_metadata')) : {}
        if (typeof metaData !== 'object') metaData = {}
        metaData.mutedInNew = account ? getMutedInNew(account.toJS(), true) : [];

        const {following} = ownProps;
        const f = state.global.getIn(['follow', 'getFollowingAsync', follower], emptyMap);
        const loading = f.get('blog_loading', false) || f.get('ignore_loading', false);
        const followingWhat =
            f.get('blog_result', emptySet).contains(following) ? 'blog' :
            f.get('ignore_result', emptySet).contains(following) ? 'ignore' :
            null;

        return {
            follower,
            following,
            followingWhat,
            loading,
            metaData,
        };
    },
    dispatch => ({
        updateFollow: (follower, following, action, done) => {
            const what = action ? [action] : [];
            const json = ['follow', {follower, following, what}];
            dispatch(transaction.actions.broadcastOperation({
                type: 'custom_json',
                operation: {
                    id: 'follow',
                    required_posting_auths: [follower],
                    json: JSON.stringify(json),
                },
                successCallback: done,
                errorCallback: done,
            }))
        },
        updateAccount: ({successCallback, errorCallback, ...operation}) => {
            const success = () => {
                dispatch(user.actions.getAccount())
                successCallback()
            }

            const options = {type: 'account_metadata', operation, successCallback: success, errorCallback}
            dispatch(transaction.actions.broadcastOperation(options))
        },
        showLogin: e => {
            if (e) e.preventDefault();
            dispatch(user.actions.showLogin())
        },
        showTransfer(transferDefaults) {
            dispatch(user.actions.setTransferDefaults(transferDefaults));
            dispatch(user.actions.showTransfer());
        },
    })
)(Follow);
