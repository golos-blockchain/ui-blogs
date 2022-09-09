import React, { Component } from 'react';
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom';
import {Map} from 'immutable';
import tt from 'counterpart';
import { Asset } from 'golos-lib-js/lib/utils'

import reactForm from 'app/utils/ReactForm';
import transaction from 'app/redux/Transaction';
import user from 'app/redux/User';
import g from 'app/redux/GlobalReducer';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import runTests, {browserTests} from 'app/utils/BrowserTests';
import {validate_account_name} from 'app/utils/ChainValidation';
import { saveMemo, loadMemo, clearOldMemos, } from 'app/utils/UIA';
import {countDecimals, formatAmount, checkMemo} from 'app/utils/ParsersAndFormatters';
import { LIQUID_TICKER, DEBT_TICKER , VESTING_TOKEN2 } from 'app/client_config';
import VerifiedExchangeList from 'app/utils/VerifiedExchangeList';
import { checkAllowed } from 'app/utils/Allowance'
import DropdownMenu from 'app/components/elements/DropdownMenu';
import Icon from 'app/components/elements/Icon';

/** Warning .. This is used for Power UP too. */
class TransferForm extends Component {

    static propTypes = {
        // redux
        currentUser: PropTypes.object.isRequired,
        toVesting: PropTypes.bool.isRequired,
        currentAccount: PropTypes.object.isRequired,
    }

    constructor(props) {
        super()
        const {transferToSelf} = props
        this.state = {
            advanced: !transferToSelf,
            isMemoPrivate: false,
        };
        this.initForm(props)
    }

    componentDidMount() {
        const { props: {onChange}, value} = this.state.amount;
        //force validation programmatically
        //done by the second argument - not working otherwise for now
        const { initialValues: {disableTo} } = this.props
        onChange(value, true)
        setTimeout(() => {
            const {advanced} = this.state
            if (advanced && !disableTo)
                ReactDOM.findDOMNode(this.refs.to).focus()
            else
                ReactDOM.findDOMNode(this.refs.amount).focus()
        }, 300)
        const { withdrawal, } = this.props.initialValues;
        if (withdrawal && withdrawal.ways && withdrawal.ways[0]) {
            this._setWithdrawalWay(withdrawal.ways[0].name);
        }
        runTests()
    }

    componentDidUpdate(prevProps) {
        if (this.autoToggleMemoEncrypt) {
            if (this.toggleMemoEncryption(true)) {
               this.autoToggleMemoEncrypt = false;
            }
        }
    }

    componentWillUnmount() {
        this.autoToggleMemoEncrypt = false;
    }

    onAdvanced = (e) => {
        e.preventDefault() // prevent form submission!!
        const username = this.props.currentUser.get('username')
        this.state.to.props.onChange(username)
        // setTimeout(() => {ReactDOM.findDOMNode(this.refs.amount).focus()}, 300)
        this.setState({advanced: !this.state.advanced})
    }

    _amountWithdrawal = (amount) => {
        const { withdrawal, } = this.props.initialValues
        if (!withdrawal || !withdrawal.min_amount) 
            return null;
        const minAmount = parseFloat(withdrawal.min_amount);
        amount = parseFloat(amount);
        if (minAmount && amount && amount < minAmount)
            return tt('asset_edit_withdrawal_jsx.min_amount') + withdrawal.min_amount + ' ' + this.props.sym;
        return null;
    };

    _memoWithdrawal = (memo) => {
        const { memoInitial, } = this.state;
        if (!memoInitial)
            return null;
        if (!(memo.trim()) || memo === memoInitial) {
            return tt('asset_edit_withdrawal_jsx.transfer_no_memo');
        }
        return null;
    };

    initForm(props) {
        const { transferType, } = props.initialValues
        const {toVesting, uia} = props
        const isWithdraw = transferType && transferType === 'Savings Withdraw'
        const isTIP = transferType && transferType.startsWith('TIP to')
        const isIssueUIA = (transferType === 'Issue UIA')
        const insufficientFunds = (asset, amount) => {
            const {currentAccount, uia} = this.props
            const balanceValue =
                !asset || asset === 'GOLOS' ?
                    isWithdraw ? currentAccount.get('savings_balance') : (isTIP ? currentAccount.get('tip_balance') : currentAccount.get('balance')) :
                asset === 'GBG' ?
                    isWithdraw ? currentAccount.get('savings_sbd_balance') : currentAccount.get('sbd_balance') :
                isIssueUIA ? uia.get('can_issue') :
                uia ?
                    (isTIP ? uia.get('tip_balance') : uia.get('balance')) :
                null
            if(!balanceValue) return false
            const balance = balanceValue.split(' ')[0]
            return parseFloat(amount) > parseFloat(balance)
        }
        const fields = toVesting ? ['to', 'amount'] : ['to', 'amount', 'asset']
        if(!toVesting && transferType !== 'Transfer to Savings' && transferType !== 'Savings Withdraw')
            fields.push('memo')

        reactForm({
            name: 'transfer',
            instance: this, fields,
            initialValues: props.initialValues,
            validation: values => { return {
                to:
                    ! values.to ? tt('g.required') :
                    (VerifiedExchangeList.includes(values.to) && isTIP) ? tt('transfer_jsx.verified_exchange_liquid_only') :
                    (VerifiedExchangeList.includes(values.to) && values.memo === '') ? tt('transfer_jsx.verified_exchange_no_memo') :
                    validate_account_name(values.to),
                amount:
                    !parseFloat(values.amount) || /^0$/.test(values.amount) ? tt('g.required') :
                    insufficientFunds(values.asset, values.amount) ? tt('transfer_jsx.insufficient_funds') :
                    (countDecimals(values.amount) > 3 && !this.props.uia) ? tt('transfer_jsx.use_only_3_digits_of_precison') :
                    this._amountWithdrawal(values.amount) || null,
                asset:
                    props.toVesting ? null :
                    ! values.asset ? tt('g.required') : null,
                memo:
                    checkMemo(values.memo) ? tt('transfer_jsx.private_key_in_memo') :
                    this._memoWithdrawal(values.memo) || null,
            }}
        })
    }

    clearError = () => {this.setState({ trxError: undefined })}

    errorCallback = estr => { this.setState({ trxError: estr, loading: false }) }

    golosBalanceValue() {
        const {transferType} = this.props.initialValues
        const {currentAccount} = this.props
        const isWithdraw = transferType && transferType === 'Savings Withdraw'
        const isTIP = transferType && transferType.startsWith('TIP to')
        return isWithdraw ? currentAccount.get('savings_balance') : (isTIP ? currentAccount.get('tip_balance') : currentAccount.get('balance'))
    }

    balanceValue() {
        const {transferType} = this.props.initialValues
        const {currentAccount, uia} = this.props
        const {asset} = this.state
        const isWithdraw = transferType && transferType === 'Savings Withdraw'
        const isTIP = transferType && transferType.startsWith('TIP to')
        const isIssueUIA = (transferType === 'Issue UIA')
        return !asset ||
            asset.value === 'GOLOS' ?
                isWithdraw ? currentAccount.get('savings_balance') : (isTIP ? currentAccount.get('tip_balance') : currentAccount.get('balance')) :
            asset.value === 'GBG' ?
                isWithdraw ? currentAccount.get('savings_sbd_balance') : currentAccount.get('sbd_balance') :
            isIssueUIA ?
                uia.get('can_issue') :
            uia ?
                (isTIP ? uia.get('tip_balance') : uia.get('balance')) :
            null
    }

    assetBalanceClick = e => {
        e.preventDefault()
        // Convert '9.999 STEEM' to 9.999
        this.state.amount.props.onChange(this.balanceValue().split(' ')[0])
    }

    onChangeTo = (e) => {
        const {value} = e.target
        this.state.to.props.onChange(value.toLowerCase().trim())
    }

    onChangeAmount = (e) => {
        const {value} = e.target
        this.state.amount.props.onChange(formatAmount(value))
    }

    _renderWithdrawalWays() {
        const { withdrawal, } = this.props.initialValues;
        const { withdrawalWay, } = this.state;
        if (!withdrawal.ways
            || !Array.isArray(withdrawal.ways)) return null;
        let ways = withdrawal.ways.map(way => (<div className='Withdrawal__way' key={way.memo}>
            <label>
                <input type='radio'
                    checked={withdrawalWay === way.name}
                    name='way'
                    onClick={() => this._setWithdrawalWay(way.name)}></input>
                {way.name ? way.name.toString() : way.memo.toString()}
            </label>
        </div>));
        return (<div className='row' style={{ marginBottom: '0.75rem', }}>
                <div className='column small-2'>
                    {tt('asset_edit_withdrawal_jsx.transfer_way')}
                </div>
                <div className='column small-10'>
                    <div className='Withdrawal'>
                        {ways}
                    </div>
                </div>
            </div>);
    };

    _renderWithdrawalDetails() {
        const { withdrawal, } = this.props.initialValues;
        const { sym, } = this.props;

        // null if fee not set, NaN or zero
        let fee = (withdrawal.fee && parseFloat(withdrawal.fee) )?
            <div><b>
                {tt('g.fee') + ': '}
                {withdrawal.fee.toString()}
                {' '}
                {sym}
            </b></div> : null;

        if (!fee &&
            !withdrawal.details) return null;

        return (<div className='row' style={{ marginBottom: '1.25rem', }}>
            <div className='column small-2'>
            </div>
            <div className='column small-10' style={{ whiteSpace: 'pre-line', fontSize: '85%' }}>
                {fee}
                {withdrawal.details.toString()}
            </div></div>);
    };

    _setWithdrawalWay(name) {
        const { withdrawal, } = this.props.initialValues;
        let way = null;
        for (let w of withdrawal.ways) {
            if (w.name === name) {
                way = w;
                break;
            }
        }
        if (!way) {
            console.error('Withdrawal way not found', name, withdrawal);
        }
        let { memo, prefix, } = way;

        clearOldMemos();
        let memoPrefix = '';
        let memoInitial = memo;
        if (prefix && typeof prefix === 'string') {
            memoPrefix = prefix;
        }
        memo = loadMemo(this.props.sym, name, memoPrefix) || memoInitial;
        
        this.state.memo.props.onChange(memo);
        this.setState({
            withdrawalWay: name,
            memoPrefix,
            memoInitial,
        });
    };

    toggleMemoEncryption = (autoCall = false) => {
        const { currentUser, loginMemo, } = this.props;
        const { isMemoPrivate, } = this.state;
        let memo = this.state.memo.props.value;
        if (!isMemoPrivate) {
            const memoPrivate = currentUser ?
                currentUser.getIn(['private_keys', 'memo_private']) : null;
            if (!memoPrivate) {
                if (currentUser && (!this.autoToggleMemoEncrypt || !autoCall)) {
                    loginMemo(currentUser);
                    this.autoToggleMemoEncrypt = true;
                }
                return false;
            }

            if (/^#/.test(memo)) {
                memo = memo.replace('#', '');
                if (memo[0]) memo = memo.substring(1);
                this.state.memo.props.onChange(memo);
            }
        }
        this.setState({
            isMemoPrivate: !isMemoPrivate,
        });
        return true;
    }

    _getColumnSizes() {
        const leftColumnSize = 2
        const leftColumn = 'small-' + leftColumnSize
        const rightColumn = 'small-' + (12-leftColumnSize)
        return [leftColumn, rightColumn]
    }

    _renderMemo(memo, memoInitial, memoPrefix, disableMemo, isMemoPrivate, loading) {
        const isObsoletePrivate = /^#/.test(memo.value);
        let input = (<input type="text"
            placeholder={memoInitial || tt('transfer_jsx.memo_placeholder')}
            {...memo.props}
            ref="memo"
            autoComplete="on" autoCorrect="off" autoCapitalize="off"
            spellCheck="false" disabled={disableMemo || loading}
            className={(memoPrefix ? 'input-group-field' : '') +
                    (!isObsoletePrivate ?
                        (isMemoPrivate ?
                        ' Transfer__encrypted' :
                        '')
                    : ' Transfer__wrong-encrypt')}
        />);
        const lock = 
            (<span class='input-group-label' style={{ cursor: 'pointer', }}
                title={isMemoPrivate ? tt('transfer_jsx.memo_unlock') : tt('transfer_jsx.memo_lock')}
                onClick={e => this.toggleMemoEncryption()}>
                <Icon name={isMemoPrivate ? 'ionicons/lock-closed-outline' : 'ionicons/lock-open-outline'} />
            </span>);
        if (memoPrefix) {
            input = (<div className='input-group'>
                    <span class='input-group-label'>
                        {memoPrefix}
                    </span>
                    {input}{lock}
                </div>);
        } else {
            input = (<div className='input-group'>
                    {input}{lock}
                </div>);
        }
        const columns = this._getColumnSizes()
        return (<div className="row">
            <div className={'column ' + columns[0]} style={{paddingTop: 33}}>{tt('transfer_jsx.memo')}</div>
            <div className={'column ' + columns[1]}>
                <small>
                    {isObsoletePrivate ?
                        tt('transfer_jsx.public_obsolete') :
                        (isMemoPrivate ?
                        tt('transfer_jsx.memo_locked') :
                        tt('transfer_jsx.public'))}
                </small>
                {input}
                <div className="error">{memo.touched && memo.error && memo.error}</div>
            </div>
        </div>)
    };

    render() {
        if (!this.props.initialValues) {
            return (<div>f</div>);
        }
        const LIQUID_TOKEN = tt('token_names.LIQUID_TOKEN')
        const VESTING_TOKEN =  tt('token_names.VESTING_TOKEN')
        const VESTING_TOKENS = tt('token_names.VESTING_TOKENS')
        const VESTING_TOKEN2 = tt('token_names.VESTING_TOKEN2')

		const transferTips = {
			'Transfer to Account': tt('transfer_jsx.move_funds_to_another_account'),
			'Transfer to Savings': tt('transfer_jsx.protect_funds_by_requiring_a_3_day_withdraw_waiting_period'),
			'Savings Withdraw':    tt('transfer_jsx.withdraw_funds_after_the_required_3_day_waiting_period'),
            'Issue UIA': '',
		}
		const powerTip = tt('tips_js.influence_tokens_which_give_you_more_control_over', {VESTING_TOKEN, VESTING_TOKENS})
		const powerTip2 = tt('tips_js.VESTING_TOKEN_is_non_transferrable_and_requires_convert_back_to_LIQUID_TOKEN', {LIQUID_TOKEN: LIQUID_TICKER, VESTING_TOKEN2})
		const powerTip3 = tt('tips_js.converted_VESTING_TOKEN_can_be_sent_to_yourself_but_can_not_transfer_again', {LIQUID_TOKEN, VESTING_TOKEN})
        const { to, amount, asset, memo,
                memoPrefix, memoInitial, isMemoPrivate, } = this.state
        const { loading, trxError, advanced, } = this.state
        const {currentAccount, currentUser, sym, toVesting, transferToSelf, dispatchSubmit} = this.props
        const { transferType,
                precision,
                disableMemo = false,
                disableTo = false,
                disableAmount = false,
                withdrawal, } = this.props.initialValues
        const {submitting, valid, handleSubmit} = this.state.transfer
        const isIssueUIA = (transferType === 'Issue UIA')
        const isUIA = this.props.uia != undefined

        let withdrawalWay = null;
        if (this.state.withdrawalWay) {
            withdrawalWay = {
                memo: memoInitial,
                prefix: memoPrefix || '',
                name: this.state.withdrawalWay,
            };
        }

        let tipBalanceValue = null;
        const amountLabel = tt('g.amount')
        const columns = this._getColumnSizes()
        const form = (
            <form onSubmit={handleSubmit(async ({data}) => {
                await dispatchSubmit({...data, isUIA, precision, errorCallback: this.errorCallback, currentUser, toVesting, transferType,
                    withdrawalWay, isMemoPrivate, })
            })}
                onChange={this.clearError}
            >
                {toVesting && <div className="row">
                    <div className="column small-12">
                        <p>{powerTip}</p>
                        <p>{powerTip2}</p>
                    </div>
                </div>}

                {(!toVesting && !withdrawal) ? <div>
                    <div className="row">
                        <div className="column small-12">
                            {withdrawal ?
                                tt('asset_edit_withdrawal_jsx.transfer_desc') :
                                transferTips[transferType]}
                        </div>
                    </div>
                    <br />
                </div> : null}

                {!withdrawal && <div className="row">
                    <div className="column small-2" style={{paddingTop: 5}}>{tt('g.from')}</div>
                    <div className="column small-10">
                        <div className="input-group" style={{marginBottom: "1.25rem"}}>
                            <span className="input-group-label">@</span>
                            <input
                                className="input-group-field bold"
                                type="text"
                                disabled
                                value={currentUser.get('username')}
                            />
                        </div>
                    </div>
                </div>}

                {advanced && <div className="row">
                    <div className="column small-2" style={{paddingTop: 5}}>
                        {withdrawal ? tt('asset_edit_withdrawal_jsx.transfer_by') : tt('g.to')}
                    </div>
                    <div className="column small-10">
                        <div className="input-group" style={{marginBottom: "1.25rem"}}>
                            <span className="input-group-label">@</span>
                            <input
                                className="input-group-field"
                                ref="to"
                                type="text"
                                placeholder={tt('transfer_jsx.send_to_account')}
                                onChange={this.onChangeTo}
                                autoComplete="off"
                                autoCorrect="off"
                                autoCapitalize="off"
                                spellCheck="false"
                                disabled={disableTo || loading}
                                {...to.props}
                            />
                        </div>
                        {to.touched && to.blur && to.error ?
                            <div className="error">{to.error}&nbsp;</div> :
                            <p>{toVesting && powerTip3}</p>
                        }
                    </div>
                </div>}

                {withdrawal ? this._renderWithdrawalWays() : null}

                {withdrawal ? this._renderWithdrawalDetails() : null}

                {<div className="row">
                    <div className={'column ' + columns[0]} style={{paddingTop: 5}}>{amountLabel}</div>
                    <div className={'column ' + columns[1]}>
                        <div className="input-group" style={{marginBottom: 5}}>
                            <input type="text" placeholder={amountLabel} {...amount.props} ref="amount" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" disabled={disableAmount || loading} onChange={(e) => this.onChangeAmount(e)}/>
                            {asset && !isUIA && !transferType.startsWith('TIP to') && !transferType.endsWith('to TIP') && <span className="input-group-label" style={{paddingLeft: 0, paddingRight: 0}}>
                                <select {...asset.props} placeholder={tt('transfer_jsx.asset')} disabled={disableAmount || loading} style={{minWidth: "5rem", height: "inherit", backgroundColor: "transparent", border: "none"}}>
                                    <option value={LIQUID_TICKER}>{LIQUID_TOKEN}</option>
                                    <option value={DEBT_TICKER}>{DEBT_TICKER}</option>
                                </select>
                            </span>}
                            {isUIA && <span className="input-group-label" style={{paddingLeft: 0, paddingRight: 0}}><select value={sym} disabled={true} style={{minWidth: "5rem", height: "inherit", backgroundColor: "transparent", border: "none"}}>
                                    <option value={sym}>{sym}</option>
                                </select></span>}
                        </div>
                        <div style={{marginBottom: "0.6rem"}}>
                            <AssetBalance balanceText={!isIssueUIA ? tt('transfer_jsx.balance') : tt('transfer_jsx.can_issue')} balanceValue={this.balanceValue()} onClick={this.assetBalanceClick} />
                        </div>
                        {(asset && asset.touched && asset.error ) || (amount.touched && amount.error) ?
                        <div className="error">
                            {asset && asset.touched && asset.error && asset.error}&nbsp;
                            {amount.touched && amount.error && amount.error}&nbsp;
                        </div> : null}
                    </div>
                </div>}

                {(memo && !disableMemo) && !isIssueUIA &&
                    this._renderMemo(memo, memoInitial, memoPrefix, disableMemo, isMemoPrivate, loading)}

                {loading && <span><LoadingIndicator type="circle" /><br /></span>}
                {!loading && <span>
                    {trxError && <div className="error">{trxError}</div>}
                    <button type="submit" disabled={submitting || !valid} className="button">
                        {tt(toVesting ? 'transfer_jsx.power_up' :
                            (isIssueUIA ? 'transfer_jsx.issue' : 'transfer_jsx.submit'))}
                    </button>
                    {transferToSelf && <button className="button hollow no-border" disabled={submitting} onClick={this.onAdvanced}>{tt(advanced ? 'g.basic' : 'g.advanced')}</button>}
                </span>}
            </form>
        )
        return (
           <div id="transferFormParent">
               <div className="row">
                   <h3>{withdrawal ?
                    tt('asset_edit_withdrawal_jsx.transfer_title_SYM', { SYM: sym, }) :
                    toVesting ?
                    tt('transfer_jsx.convert_to_VESTING_TOKEN', {VESTING_TOKEN2}) : 
                        (isIssueUIA ? tt('transfer_jsx.issue_uia') : tt('transfer_jsx.form_title'))}</h3>
               </div>
               {form}
           </div>
       )
    }
}

const AssetBalance = ({onClick, balanceText, balanceValue}) =>
    <a onClick={onClick} style={{borderBottom: '#A09F9F 1px dotted', cursor: 'pointer'}}>{balanceText + ": " + balanceValue}</a>

import {connect} from 'react-redux'

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        const initialValues = state.user.get('transfer_defaults', Map()).toJS()
        const toVesting = initialValues.asset === 'GESTS'
        const {locationBeforeTransitions: {pathname}} = state.routing;
        const currentUserNameFromRoute = pathname.split(`/`)[1].substring(1);
        const currentUserFromRoute = Map({username: currentUserNameFromRoute});
        const currentUser = state.user.getIn(['current']) || currentUserFromRoute;
        const username = currentUser.get('username')
        const currentAccount = currentUser && state.global.getIn(['accounts', currentUser.get('username')])

        if(!toVesting && !initialValues.transferType)
            initialValues.transferType = 'Transfer to Account'

        let transferToSelf = toVesting || /Transfer to Savings|Savings Withdraw|Transfer to TIP/.test(initialValues.transferType)
        if (currentUser && transferToSelf && !initialValues.to)
            initialValues.to = username

        if(currentUser && initialValues.to !== username)
            transferToSelf = false // don't hide the to field

        let uias = state.global.get('assets')
        let uia = undefined;
        if (uias) {
            uia = uias.get(initialValues.asset)
        }

        return {...ownProps,
            currentUser, currentAccount,
            uias, uia, toVesting, sym: initialValues.asset,
            transferToSelf, initialValues}
    },

    // mapDispatchToProps
    dispatch => ({
        loginMemo: (currentUser) => {
            if (!currentUser) return;
            dispatch(user.actions.showLogin({
                loginDefault: { username: currentUser.get('username'), authType: 'memo', unclosable: false }
            }));
        },
        setTransferDefaults: ({
            transferDefaults
        }) => {
            dispatch(user.actions.setTransferDefaults(transferDefaults))
        },
        dispatchSubmit: async ({
            to, amount, isUIA, asset, precision, memo, transferType,
            withdrawalWay, isMemoPrivate,
            toVesting, currentUser, errorCallback
        }) => {
            if(!toVesting && !isUIA && !/Transfer to Account|Transfer to Savings|Savings Withdraw|Transfer to TIP|TIP to Account|Issue UIA/.test(transferType))
                throw new Error(`Invalid transfer params: toVesting ${toVesting}, transferType ${transferType}`)

            const username = currentUser.get('username')
            const successCallback = () => {
                // refresh transfer history
                let pathname = '';
                if (!isUIA) {
                    pathname = `@${username}/transfers`;
                } else {
                    pathname = `@${username}/assets`;
                }
                dispatch({type: 'FETCH_STATE', payload: {pathname}})
                if(/Savings Withdraw/.test(transferType)) {
                    dispatch({type: 'user/LOAD_SAVINGS_WITHDRAW', payload: {}})
                }
                dispatch(user.actions.hideTransfer())
            }
            const asset2 = toVesting ? 'GOLOS' : asset
            const operation = {
                to, 
                memo: ((toVesting && transferType !== 'TIP to Vesting') || transferType === 'Issue UIA') ? undefined : (memo ? memo : '')
            }

            if (transferType !== 'Issue UIA') {
                operation.from = username
            } else {
                operation.creator = username
            }

            if (!isUIA) {
                operation.amount = parseFloat(amount, 10).toFixed(3) + ' ' + asset2
            } else {
                operation.amount = parseFloat(amount, 10).toFixed(precision) + ' ' + asset2
            }

            if(transferType === 'Savings Withdraw')
                operation.request_id = Math.floor((Date.now() / 1000) % 4294967295)

            if (transferType === 'TIP to Account') {
                let donate_memo = {};
                donate_memo.app = "golos-blog";
                donate_memo.version = 1;
                donate_memo.comment = operation.memo;
                donate_memo.target = {
                    author: operation.to,
                    permlink: ""
                };
                operation.memo = donate_memo;
            }

            if (withdrawalWay) {
                operation.memo = withdrawalWay.prefix + operation.memo;
                saveMemo(
                    asset,
                    withdrawalWay.name,
                    memo || '',
                    withdrawalWay.prefix);
            }

            if (isMemoPrivate)
                operation._memo_private = true;

            const opType = toVesting ? (
                transferType === 'TIP to Vesting' ? 'transfer_from_tip' :
                'transfer_to_vesting'
            ) : (
                isUIA && transferType === 'TIP to Vesting' ? 'transfer_from_tip' :
                transferType === 'Transfer to Account' ? 'transfer' :
                transferType === 'Transfer to Savings' ? 'transfer_to_savings' :
                transferType === 'Savings Withdraw' ? 'transfer_from_savings' :
                transferType === 'Transfer to TIP' ? 'transfer_to_tip' :
                transferType === 'TIP to Account' ? 'donate' :
                transferType === 'Issue UIA' ? 'asset_issue' :
                null
            )

            let trx = [
                [opType, operation]
            ]

            let confirm
            if (opType === 'transfer' || opType === 'donate') {
                const tipAmount = opType === 'donate' && Asset(operation.amount)
                const blocking = await checkAllowed(operation.from, [operation.to], tipAmount)
                if (blocking.error) {
                    errorCallback(blocking.error)
                    return
                }
                confirm = blocking.confirm
            }

            dispatch(transaction.actions.broadcastOperation({
                type: opType,
                username,
                trx,
                confirm,
                successCallback,
                errorCallback
            }))
        }
    })
)(TransferForm)
