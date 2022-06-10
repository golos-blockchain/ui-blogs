import React, { Component, } from 'react';
import tt from 'counterpart';
import { connect, } from 'react-redux';
import { Map, } from 'immutable';
import { api, } from 'golos-lib-js';
import { Asset, } from 'golos-lib-js/lib/utils';
import CloseButton from 'react-foundation-components/lib/global/close-button';

import Author from 'app/components/elements/Author'
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import Icon from 'app/components/elements/Icon';
import Memo from 'app/components/elements/Memo';
import transaction from 'app/redux/Transaction';
import { clearOldAddresses, loadAddress, saveAddress, } from 'app/utils/UIA';
import getUIAAddress from 'shared/getUIAAddress'

const TransferState = {
    initial: 0,
    transferring: 1,
    waiting: 2,
    received: 3,
    timeouted: 4,
};

class APIError extends Error {
    constructor(errReason, errData) {
        super('API Error')
        this.reason = errReason
        this.data = errData
    }
}

class AssetRules extends Component {
    state = {
        transferState: TransferState.initial,
    }

    async componentDidMount() {
        const { rules, sym, } = this.props;
        const { to_type, to_api, isDeposit, creator, } = rules;
        if (isDeposit) {
            if (to_type === 'transfer') {
                clearOldAddresses();
                const addr = loadAddress(sym, creator);
                if (addr) {
                    this.setState({
                        transferState: TransferState.received,
                        receivedTransfer: {
                            memo: addr,
                        },
                    });
                }
            } else if (to_type === 'api') {
                this.doAPI()
            }
        }
    }

    doReq = async (acc, sym) => {
        if (!process.env.IS_APP) {
            const url = '/api/v1/uia_address/' + sym + '/' + acc
            let res = await fetch(url)
            res = await res.json()
            return res
        } else {
            let res
            await getUIAAddress(acc, sym, (address) => {
                res = {
                    status: 'ok',
                    address
                }
            }, (errorName, logData, errorData) => {
                console.error(...logData)
                res = {
                    status: 'err',
                    error: errorName,
                    error_data: errorData,
                }
            })
            return res
        }
    }

    async doAPI() {
        const { rules, sym, currentAccount, } = this.props
        try {
            const acc = currentAccount.get('name')
            if (!acc) return
            let retried = 0
            const retryReq = async () => {
                let res = await this.doReq(acc, sym)
                if (res.status === 'err') {
                    if (retried < 3 &&
                        (res.error === 'too_many_requests'
                            || res.error === 'cannot_connect_gateway')) {
                        console.error('Repeating /uia_address', res)
                        ++retried
                        await new Promise(resolve => setTimeout(resolve, 1100))
                        await retryReq()
                        return
                    }
                    throw new APIError(res.error, res.error_data)
                }

                this.setState({
                    apiLoaded: {
                        address: res.address
                    }
                })
            }
            await retryReq()
        } catch (err) {
            console.error('/uia_address', err)
            if (err instanceof APIError) {
                this.setState({
                    apiLoaded: {
                        error: err.reason,
                        errData: err.data
                    }
                })
            } else {
                this.setState({
                    apiLoaded: {
                        error: 'error_on_golos_blockchain_side',
                    }
                })
            }
        }
    }

    balanceValue = () => {
        const { currentAccount, } = this.props;
        if (currentAccount) {
            return currentAccount.get('balance');
        }
        return '0.000 GOLOS';
    }

    enoughBalance = () => {
        return Asset(this.balanceValue()).gte(Asset('0.001 GOLOS'));
    }

    transfer = () => {
        this.setState({
            transferState: TransferState.transferring,
        }, () => {
            this.transferAndWait();
        });
    }

    waitingTimeout = (10 + 1) * 60 * 1000;

    transferAndWait = () => {
        const { sym, rules, dispatchTransfer, currentUser, } = this.props;
        const { to_transfer, memo_transfer, } = rules;
        let stopper;
        let stopStream = api.streamOperations((err, op) => {
            if (op[0] === 'transfer' && op[1].from === to_transfer
                && op[1].to === currentUser.get('username')) {
                stopStream();
                clearTimeout(stopper);
                saveAddress(sym, rules.creator, op[1].memo);
                this.setState({
                    transferState: TransferState.received,
                    receivedTransfer: op[1],
                });
            }
        });
        dispatchTransfer({
            to: to_transfer,
            memo: memo_transfer,
            currentUser,
            successCallback: () => {
                this.setState({
                    transferState: TransferState.waiting,
                });
                stopper = setTimeout(() => {
                    if (stopStream) stopStream();
                    this.setState({
                        transferState: TransferState.timeouted,
                    });
                }, this.waitingTimeout);
            }, 
            errorCallback: () => {
                this.setState({
                    transferState: TransferState.initial,
                });
                stopStream();
            }
        });
    }

    _renderTo = (to, to_fixed, username) => {
        let addr = to || to_fixed;
        if (username)
            addr = <Memo text={addr} myAccount={true} username={username} />
        return addr ? <div>
            {tt('asset_edit_withdrawal_jsx.to')}<br/>
            <b>{addr}</b><br/>
            </div> : null;
    }

    _renderParams = (withDetails = true) => {
        const { rules, sym, } = this.props;
        const { min_amount, fee, details, } = rules;
        return <div style={{fontSize: "90%"}}>
            <hr />
            {details && <div style={{ whiteSpace: 'pre-line', }}>
                {details}
            <br/><br/></div>}
            {min_amount && <div>
                {tt('asset_edit_withdrawal_jsx.min_amount')} <b>{min_amount} {sym || ''}</b></div>}
            {fee && <div>
                {tt('g.fee') + ': '}<b>{fee} {sym || ''}</b></div>}
        </div>;
    }

    _renderApi = () => {
        const { sym, onClose } = this.props
        const header = (<h4>
            {tt('asset_edit_deposit_jsx.transfer_title_SYM', {
                SYM: sym || ' ',
            })}
        </h4>)
        const { apiLoaded  } = this.state
        if (!apiLoaded) {
            const { sym } = this.props
            return (<div>
                <CloseButton onClick={onClose} />
                {header}
                <br />
                <center>
                    <LoadingIndicator type='circle' size='70px' />
                </center>
                <br />
            </div>);
        }
        if (apiLoaded.error) {
            const { creator } = this.props.rules
            return (<div>
                <CloseButton onClick={onClose} />
                {header}
                {tt('asset_edit_deposit_jsx.api_error') + sym + ':'}
                <p style={{marginTop: '0.3rem', marginBottom: '0.3rem'}}>
                    <Author author={creator} forceMsgs={true} />
                </p>
                {tt('asset_edit_deposit_jsx.api_error_details')}
                <pre style={{marginTop: '0.3rem'}}>
                    {apiLoaded.error}
                    {'\n'}
                    {apiLoaded.errData ? JSON.stringify(apiLoaded.errData) : null}
                </pre>
            </div>)
        }
        const { address } = apiLoaded
        return (<div>
            <CloseButton onClick={onClose} />
            {header}
            {this._renderTo(address, null)}
            {this._renderParams(false)}
        </div>)
    }

    _renderTransfer = () => {
        const { rules, sym, onClose, } = this.props;
        const { to_transfer, memo_transfer, } = rules;
        const { transferState, receivedTransfer, } = this.state;

        const transferring = transferState === TransferState.transferring;

        const enough = this.enoughBalance();

        const header = (<h4>
            {tt('asset_edit_deposit_jsx.transfer_title_SYM', {
                SYM: sym || ' ',
            })}
        </h4>);

        if (transferState === TransferState.received) {
            const { currentUser, } = this.props;
            const { memo, } = receivedTransfer;
            return (<div>
                <CloseButton onClick={onClose} />
                {header}
                {this._renderTo(receivedTransfer.memo, null, currentUser.get('username'))}
                {this._renderParams(false)}
            </div>);
        }

        if (transferState === TransferState.timeouted) {
            return (<div>
                <CloseButton onClick={onClose} />
                {header}
                {tt('asset_edit_deposit_jsx.timeouted')}
                {sym || ''}
                .
            </div>);
        }

        if (transferState === TransferState.waiting) {
            return (<div>
                {header}
                {tt('asset_edit_deposit_jsx.waiting')}
                <br />
                <br />
                <center>
                    <LoadingIndicator type='circle' size='70px' />
                </center>
                <br />
            </div>);
        }

        return (<div>
            <CloseButton onClick={onClose} />
            {header}
            {tt('asset_edit_deposit_jsx.transfer_desc')}
            <b>{to_transfer || ''}</b>
            {tt('asset_edit_deposit_jsx.transfer_desc_2')}
            <b>{memo_transfer || ''}</b>
            {transferring ?
                <span><LoadingIndicator type='circle' /></span> : null}
            <button type='submit' disabled={!enough || transferring} className='button float-center' onClick={this.transfer}>
                {tt('g.submit')}
            </button>
            {!enough ? <div className='error'>
                {tt('transfer_jsx.insufficient_funds')}
            </div> : null}
            {this._renderParams()}
        </div>);
    }

    render() {
        const { rules, sym, onClose, } = this.props;
        const { to, to_type, to_fixed, to_transfer, memo_fixed,
            min_amount, fee, details, isDeposit, } = rules;
        if (isDeposit && to_type === 'api') {
            return this._renderApi();
        }
        if (isDeposit && to_type === 'transfer') {
            return this._renderTransfer();
        }
        return (<div>
            <CloseButton onClick={onClose} />
            <h4>
                {tt((isDeposit ? 'asset_edit_deposit_jsx' : 'asset_edit_withdrawal_jsx')
                        + '.transfer_title_SYM', {
                    SYM: sym || ' ',
                })}
            </h4>
            {this._renderTo(to, to_fixed)}
            {memo_fixed ? <div>
                    {tt('asset_edit_deposit_jsx.memo_fixed')}<br/>
                    <b>{memo_fixed}</b><br/>
                </div> : null}
            {this._renderParams()}
        </div>);
    }
}

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        const {locationBeforeTransitions: {pathname}} = state.routing;
        const currentUserNameFromRoute = pathname.split(`/`)[1].substring(1);
        const currentUserFromRoute = Map({username: currentUserNameFromRoute});
        const currentUser = state.user.getIn(['current']) || currentUserFromRoute;
        const currentAccount = currentUser && state.global.getIn(['accounts', currentUser.get('username')]);
        return { ...ownProps, currentUser, currentAccount, };
    },

    dispatch => ({
        dispatchTransfer: ({
            to, memo, currentUser, successCallback, errorCallback
        }) => {
            const username = currentUser.get('username');
            const operation = {
                from: username,
                to,
                amount: '0.001 GOLOS',
                memo,
            };

            dispatch(transaction.actions.broadcastOperation({
                type: 'transfer',
                username,
                operation,
                successCallback,
                errorCallback
            }));
        }
    })
)(AssetRules)
