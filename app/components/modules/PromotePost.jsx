import React, { Component } from 'react';
import PropTypes from 'prop-types'
import {connect} from 'react-redux';
import ReactDOM from 'react-dom';
import transaction from 'app/redux/Transaction';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import * as api from 'app/utils/APIWrapper'
import { DEBT_TOKEN_SHORT, DEBT_TICKER} from 'app/client_config';
import tt from 'counterpart';

class PromotePost extends Component {

    static propTypes = {
        author: PropTypes.string.isRequired,
        permlink: PropTypes.string.isRequired,
        promoted: PropTypes.string.isRequired
    };

    constructor(props) {
        super(props);
        this.state = {
            amount: '1.0',
            alreadyInTop: true, // to do not show before info loaded
            requiredAmount: '... GBG',
            asset: '',
            loading: false,
            amountError: '',
            trxError: ''
        };
        this.onSubmit = this.onSubmit.bind(this);
        this.errorCallback = this.errorCallback.bind(this);
        this.amountChange = this.amountChange.bind(this);
        // this.assetChange = this.assetChange.bind(this);
    }

    loadRequiredAmount() {
        const {author, permlink, promoted} = this.props
        let myAmount = parseFloat(promoted.split(' '));
        api.gedDiscussionsBy('promoted', { limit: 1}).then(r => {
            if (!r.length) return;
            if (r[0].author === author && r[0].permlink === permlink) {
                this.setState({
                    alreadyInTop: true
                });
                return;
            }
            let requiredAmount = parseFloat(r[0].promoted.split(' ')[0]);
            requiredAmount -= myAmount;
            requiredAmount = Math.floor(requiredAmount);
            requiredAmount += 1;
            this.setState({
                alreadyInTop: false,
                requiredAmount: (requiredAmount) + ' GBG'
            });
        }).catch(e => {
            setTimeout(this.loadRequiredAmount, 500);
        })
    }

    componentDidMount() {
        this.loadRequiredAmount();
        setTimeout(() => {
            ReactDOM.findDOMNode(this.refs.amount).focus()
        }, 300)
    }

    errorCallback(estr) {
        this.setState({ trxError: estr, loading: false });
    }

    onSubmit(e) {
        e.preventDefault();
        const {author, permlink, onClose} = this.props
        const {amount} = this.state
        this.setState({loading: true});
        console.log('-- PromotePost.onSubmit -->');
        this.props.dispatchSubmit({amount, asset: DEBT_TICKER, author, permlink, onClose,
            currentUser: this.props.currentUser, errorCallback: this.errorCallback});
    }

    amountChange(e) {
        const amount = e.target.value;
        // console.log('-- PromotePost.amountChange -->', amount);
        this.setState({amount});
    }

    // assetChange(e) {
    //     const asset = e.target.value;
    //     console.log('-- PromotePost.assetChange -->', e.target.value);
    //     this.setState({asset});
    // }

    render() {
        const DEBT_TOKEN = tt('token_names.DEBT_TOKEN')

        const {amount, loading, amountError, trxError, requiredAmount, alreadyInTop} = this.state;
        const {currentAccount} = this.props;
        const balanceValue = currentAccount.get('sbd_balance');
        const balance = balanceValue ? balanceValue.split(' ')[0] : 0.0;
        const submitDisabled = !amount;

        return (
           <div className="PromotePost row">
               <div className="column small-12">
                   <form onSubmit={this.onSubmit} onChange={() => this.setState({trxError: ''})}>
                       <h4>{tt('promote_post_jsx.promote_post')}</h4>
                       <p>{tt('promote_post_jsx.spend_your_DEBT_TOKEN_to_advertise_this_post', {DEBT_TOKEN})}.</p>
                       <p>{tt('promote_post_jsx.to_promote_this_post_sent')}<b>{this.props.promoted.split('.')[0] + ' GBG'}</b>
                       {!alreadyInTop && <div>{tt('promote_post_jsx.remaining_to_promote')}<b>{requiredAmount}</b></div>}
                       </p>
                       <hr />
                       <div className="row">
                           <div className="column small-4">
                               <label>{tt('g.amount')}</label>
                               <div className="input-group">
                                   <input className="input-group-field" type="text" placeholder={tt('g.amount')} value={amount} ref="amount" autoComplete="off" disabled={loading} onChange={this.amountChange} />
                                   <span className="input-group-label">{DEBT_TOKEN_SHORT + ' '} </span>
                                   <div className="error">{amountError}</div>
                               </div>
                           </div>
                       </div>
                       <div>{`${tt('transfer_jsx.balance')}: ${balance} ${DEBT_TOKEN_SHORT} `} <span className="secondary">({tt('promote_post_jsx.buy_gbg')} <a target="_blank" href="/market/GBG/GOLOS">{tt('promote_post_jsx.market')}</a>)</span></div>
                       <br />
                       {loading && <span><LoadingIndicator type="circle" /><br /></span>}
                       {!loading && <span>
                           {trxError && <div className="error">{trxError}</div>}
                           <button type="submit" className="button" disabled={submitDisabled}>{tt('g.promote')}</button>
                        </span>}
                   </form>
               </div>
           </div>
       )
    }
}

export default connect(
    (state, ownProps) => {
        const currentUser = state.user.getIn(['current']);
        const currentAccount = state.global.getIn(['accounts', currentUser.get('username')]);
        const post = state.global.get('content').get(ownProps.author + '/' + ownProps.permlink);
        return {...ownProps, currentAccount, currentUser, promoted: post.get('promoted')}
    },

    // mapDispatchToProps
    dispatch => ({
        dispatchSubmit: ({amount, asset, author, permlink, currentUser, onClose, errorCallback}) => {
            const username = currentUser.get('username')
            const successCallback = () => {
                dispatch({type: 'FETCH_STATE', payload: {pathname: `@${username}/transfers`}}) // refresh transfer history
                onClose()
            }
            const operation = {
                from: username,
                to: 'null', amount: parseFloat(amount, 10).toFixed(3) + ' ' + asset,
                memo: `@${author}/${permlink}`,
                __config: {successMessage: tt('promote_post_jsx.you_successfully_promoted_this_post') + '.'}
            }
            dispatch(transaction.actions.broadcastOperation({
                type: 'transfer',
                operation,
                successCallback,
                errorCallback
            }))
        }
    })
)(PromotePost)
