import React, { Component } from 'react';
import PropTypes from 'prop-types'
import ReactDOM from 'react-dom';
import reactForm from 'app/utils/ReactForm';
import {Map} from 'immutable';
import transaction from 'app/redux/Transaction';
import user from 'app/redux/User';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import runTests, {browserTests} from 'app/utils/BrowserTests';
import {validate_account_name} from 'app/utils/ChainValidation';
import {countDecimals, formatAmount, checkMemo} from 'app/utils/ParsersAndFormatters';
import tt from 'counterpart';
import { LIQUID_TICKER, DEBT_TICKER , VESTING_TOKEN2 } from 'app/client_config';
import Slider from 'golos-ui/Slider';
import VerifiedExchangeList from 'app/utils/VerifiedExchangeList';
import DropdownMenu from 'app/components/elements/DropdownMenu';

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
        // only `donate` flag defined for now
        const flag = props.initialValues && props.initialValues.flag;
        if (flag) {
          this.flag = flag
        }
        const {transferToSelf} = props
        this.state = {advanced: !transferToSelf}
        this.initForm(props)
    }

    componentDidMount() {
        const { props: {onChange}, value} = this.state.amount;
        //force validation programmatically
        //done by the second argument - not working otherwise for now
        const {initialValues: {disableTo}} = this.props
        onChange(value, true)
        setTimeout(() => {
            let permlink = (this.flag && typeof this.flag.permlink === `string`) ? this.flag.permlink : null;
            if (permlink) {
                const transferFormParent = document.getElementById('transferFormParent');
                if (transferFormParent) transferFormParent.parentNode.style.minWidth = '700px';
            }
            const {advanced} = this.state
            if (advanced && !disableTo)
                ReactDOM.findDOMNode(this.refs.to).focus()
            else
                ReactDOM.findDOMNode(this.refs.amount).focus()
        }, 300)
        runTests()
    }

    onAdvanced = (e) => {
        e.preventDefault() // prevent form submission!!
        const username = this.props.currentUser.get('username')
        this.state.to.props.onChange(username)
        // setTimeout(() => {ReactDOM.findDOMNode(this.refs.amount).focus()}, 300)
        this.setState({advanced: !this.state.advanced})
    }

    initForm(props) {
        const {transferType} = props.initialValues
        const {toVesting, uia} = props
        const isWithdraw = transferType && transferType === 'Savings Withdraw'
        const isTIP = transferType && transferType.startsWith('TIP to')
        const isClaim = transferType && transferType === 'Claim'
        const isIssueUIA = (transferType === 'Issue UIA')
        const insufficientFunds = (asset, amount) => {
            const {currentAccount, uia} = this.props
            const balanceValue =
                !asset || asset === 'GOLOS' ?
                    isWithdraw ? currentAccount.get('savings_balance') : (isTIP ? currentAccount.get('tip_balance') : (isClaim ? currentAccount.get('accumulative_balance') : currentAccount.get('balance'))) :
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
        if(!toVesting && transferType !== 'Transfer to Savings' && transferType !== 'Savings Withdraw' && transferType !== 'Claim')
            fields.push('memo')

        let permlink = (this.flag && typeof this.flag.permlink === `string`) ? this.flag.permlink : null;
        reactForm({
            name: 'transfer',
            instance: this, fields,
            initialValues: props.initialValues,
            validation: values => ({
                to:
                    ! values.to ? tt('g.required') :
                    (VerifiedExchangeList.includes(values.to) && !permlink && (isTIP || isClaim || values.asset !== 'GOLOS')) ? tt('transfer_jsx.verified_exchange_liquid_only') :
                    (VerifiedExchangeList.includes(values.to) && !permlink && values.memo === '') ? tt('transfer_jsx.verified_exchange_no_memo') :
                    validate_account_name(values.to),
                amount:
                    ! parseFloat(values.amount) || /^0$/.test(values.amount) ? tt('g.required') :
                    insufficientFunds(values.asset, values.amount) ? tt('transfer_jsx.insufficient_funds') :
                    (countDecimals(values.amount) > 3 && !this.props.uia) ? tt('transfer_jsx.use_only_3_digits_of_precison') :
                    null,
                asset:
                    props.toVesting ? null :
                    ! values.asset ? tt('g.required') : null,
                memo:
                    values.memo && (!browserTests.memo_encryption && /^#/.test(values.memo)) ?
                    'Encrypted memos are temporarily unavailable (issue #98)' :
                    checkMemo(values.memo) ? tt('transfer_jsx.private_key_in_memo') :
                    null,
            })
        })
    }

    clearError = () => {this.setState({ trxError: undefined })}

    errorCallback = estr => { this.setState({ trxError: estr, loading: false }) }

    golosBalanceValue() {
        const {transferType} = this.props.initialValues
        const {currentAccount} = this.props
        const isWithdraw = transferType && transferType === 'Savings Withdraw'
        const isClaim = transferType && transferType === 'Claim'
        const isTIP = transferType && transferType.startsWith('TIP to')
        return isWithdraw ? currentAccount.get('savings_balance') : (isTIP ? currentAccount.get('tip_balance') : (isClaim ? currentAccount.get('accumulative_balance') : currentAccount.get('balance')))
    }

    balanceValue() {
        const {transferType} = this.props.initialValues
        const {currentAccount, uia} = this.props
        const {asset} = this.state
        const isWithdraw = transferType && transferType === 'Savings Withdraw'
        const isTIP = transferType && transferType.startsWith('TIP to')
        const isClaim = transferType && transferType === 'Claim'
        const isIssueUIA = (transferType === 'Issue UIA')
        return !asset ||
            asset.value === 'GOLOS' ?
                isWithdraw ? currentAccount.get('savings_balance') : (isTIP ? currentAccount.get('tip_balance') : (isClaim ? currentAccount.get('accumulative_balance') : currentAccount.get('balance'))) :
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

    onDonateSliderChange = int_value => {
        this.state.amount.props.onChange(formatAmount(int_value.toString() + '.000'));
    };

    onPresetClicked = (e) => {
        e.preventDefault();
        const amount = e.target.textContent.split(" ")[0] + ".000";
        this.state.amount.props.onChange(formatAmount(amount));
    };

    onTipAssetChanged = (e) => {
        e.preventDefault();
        //this.setState({
        //    tipAssetOverride: e.currentTarget.parentNode.dataset.value
        //});
        this.state.asset.props.onChange(e.currentTarget.parentNode.dataset.value);
        let transferDefaults = this.props.initialValues
        const val = e.currentTarget.parentNode.dataset.link.split(',')
        transferDefaults.asset = val[0];
        transferDefaults.precision = parseInt(val[1]);
        this.props.setTransferDefaults({ transferDefaults });
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
        const {to, amount, asset, memo} = this.state
        const {loading, trxError, advanced} = this.state
        const {currentAccount, currentUser, sym, toVesting, transferToSelf, dispatchSubmit} = this.props
        const { transferType,
                precision,
                disableMemo = false,
                disableTo = false,
                disableAmount = false} = this.props.initialValues
        const {submitting, valid, handleSubmit} = this.state.transfer
        const isMemoPrivate = memo && /^#/.test(memo.value)
        const isIssueUIA = (transferType === 'Issue UIA')
        const isUIA = this.props.uia != undefined

        let permlink = (this.flag && typeof this.flag.permlink === `string`) ? this.flag.permlink : null;
        let donatePresets;
        if(process.env.BROWSER) {
            donatePresets = localStorage.getItem('donate.presets-' + currentUser.get('username'))
            if (donatePresets) donatePresets = JSON.parse(donatePresets)
            else {
              donatePresets = ['5','10','25','50','100'];
            };
        }
        let tipBalanceValue = this.balanceValue().split(".")[0] + " " + asset.value;
        let myAssets = [];
        myAssets.push({key: 'GOLOS', value: 'GOLOS', link: 'GOLOS,3', label: this.golosBalanceValue().split(".")[0] + " GOLOS", onClick: this.onTipAssetChanged});
        if (this.props.uias)
        for (const [sym, obj] of Object.entries(this.props.uias.toJS())) {
            const prec = obj.tip_balance.split(' ')[0].split('.')[1].length;
            myAssets.push({key: sym, value: sym, link: sym + ',' + prec, label: obj.tip_balance.split('.')[0] + ' ' + sym, onClick: this.onTipAssetChanged});
        }
        if (myAssets.length > 1) {
            tipBalanceValue = (<DropdownMenu selected={tipBalanceValue.split(' ')[1]} el="span" items={myAssets} />)
        }
        const form = (
            <form onSubmit={handleSubmit(({data}) => {
                this.setState({loading: true})
                dispatchSubmit({...data, isUIA, precision, flag: this.flag, errorCallback: this.errorCallback, currentUser, toVesting, transferType})
            })}
                onChange={this.clearError}
            >
                {toVesting && <div className="row">
                    <div className="column small-12">
                        <p>{powerTip}</p>
                        <p>{powerTip2}</p>
                    </div>
                </div>}

                {!toVesting && <div>
                    <div className="row">
                        <div className="column small-12">
                            {transferTips[transferType]}
                        </div>
                    </div>
                    <br />
                </div>}

                {permlink && (<div className="DonatePresets column">
                <div>
                <div className="PresetSelector__container">
                <button className={"PresetSelector button hollow" + (amount.value.split(".")[0] === donatePresets[0] ? " PresetSelector__active" : "")} onClick={this.onPresetClicked}>{donatePresets[0]}</button>
                <button className={"PresetSelector button hollow" + (amount.value.split(".")[0] === donatePresets[1] ? " PresetSelector__active" : "")} onClick={this.onPresetClicked}>{donatePresets[1]}</button>
                <button className={"PresetSelector button hollow" + (amount.value.split(".")[0] === donatePresets[2] ? " PresetSelector__active" : "")} onClick={this.onPresetClicked}>{donatePresets[2]}</button>
                <button className={"PresetSelector button hollow" + (amount.value.split(".")[0] === donatePresets[3] ? " PresetSelector__active" : "")} onClick={this.onPresetClicked}>{donatePresets[3]}</button>
                <button className={"PresetSelector button hollow" + (amount.value.split(".")[0] === donatePresets[4] ? " PresetSelector__active" : "")} onClick={this.onPresetClicked}>{donatePresets[4]}</button>
                </div>
                <div className="TipBalance">
                <b>{tt('token_names.TIP_TOKEN')}:</b><br/>
                {tipBalanceValue}
                </div>
                </div>
                <Slider
                        {...amount.props}
                        min={0}
                        max={parseInt(this.balanceValue().split(".")[0])}
                        hideHandleValue={true}
                        onChange={this.onDonateSliderChange}
                    />
                </div>)}

                {!permlink && <div className="row">
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

                {advanced && !permlink && <div className="row">
                    <div className="column small-2" style={{paddingTop: 5}}>{tt('g.to')}</div>
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

                {<div className="row">
                    <div className="column small-2" style={{paddingTop: 5}}>{tt('g.amount')}</div>
                    <div className="column small-10">
                        <div className="input-group" style={{marginBottom: 5}}>
                            <input type="text" placeholder={tt('g.amount')} {...amount.props} ref="amount" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" disabled={disableAmount || loading} onChange={(e) => this.onChangeAmount(e)}/>
                            {asset && !isUIA && transferType !== 'Claim' && !transferType.startsWith('TIP to') && !transferType.endsWith('to TIP') && <span className="input-group-label" style={{paddingLeft: 0, paddingRight: 0}}>
                                <select {...asset.props} placeholder={tt('transfer_jsx.asset')} disabled={disableAmount || loading} style={{minWidth: "5rem", height: "inherit", backgroundColor: "transparent", border: "none"}}>
                                    <option value={LIQUID_TICKER}>{LIQUID_TOKEN}</option>
                                    <option value={DEBT_TICKER}>{DEBT_TICKER}</option>
                                </select>
                            </span>}
                            {isUIA && !permlink && <span className="input-group-label" style={{paddingLeft: 0, paddingRight: 0}}><select value={sym} disabled={true} style={{minWidth: "5rem", height: "inherit", backgroundColor: "transparent", border: "none"}}>
                                    <option value={sym}>{sym}</option>
                                </select></span>}
                            {permlink && <span style={{paddingLeft: "10px", paddingTop: "7px", backgroundColor: "transparent", border: "none"}}>{sym}</span>}
                        </div>
                        {!permlink && <div style={{marginBottom: "0.6rem"}}>
                            <AssetBalance balanceText={!isIssueUIA ? tt('transfer_jsx.balance') : tt('transfer_jsx.can_issue')} balanceValue={this.balanceValue()} onClick={this.assetBalanceClick} />
                        </div>}
                        {(asset && asset.touched && asset.error ) || (amount.touched && amount.error) ?
                        <div className="error">
                            {asset && asset.touched && asset.error && asset.error}&nbsp;
                            {amount.touched && amount.error && amount.error}&nbsp;
                        </div> : null}
                    </div>
                </div>}

                {(memo && !disableMemo) && !isIssueUIA && <div className="row">
                    <div className="column small-2" style={{paddingTop: 33}}>{tt('transfer_jsx.memo')}</div>
                    <div className="column small-10">
                        <small>{tt('transfer_jsx.this_memo_is') + isMemoPrivate ? tt('transfer_jsx.public') : tt('transfer_jsx.private')}</small>
                        <input type="text" placeholder={tt('transfer_jsx.memo_placeholder')} {...memo.props}
                            ref="memo" autoComplete="on" autoCorrect="off" autoCapitalize="off" spellCheck="false" disabled={disableMemo || loading} />
                        <div className="error">{memo.touched && memo.error && memo.error}&nbsp;</div>
                    </div>
                </div>}
                {loading && <span><LoadingIndicator type="circle" /><br /></span>}
                {!loading && <span>
                    {trxError && <div className="error">{trxError}</div>}
                    <button type="submit" disabled={submitting || !valid} className="button">
                        {tt(toVesting ? 'transfer_jsx.power_up' : (isIssueUIA ? 'transfer_jsx.issue' : 'transfer_jsx.submit'))}
                    </button>
                    {transferToSelf && <button className="button hollow no-border" disabled={submitting} onClick={this.onAdvanced}>{tt(advanced ? 'g.basic' : 'g.advanced')}</button>}
                </span>}
            </form>
        )
        return (
           <div id="transferFormParent">
               <div className="row">
                   <h3>{toVesting ?
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
        const currentAccount = currentUser && state.global.getIn(['accounts', currentUser.get('username')])

        if(!toVesting && !initialValues.transferType)
            initialValues.transferType = 'Transfer to Account'

        let transferToSelf = toVesting || /Transfer to Savings|Savings Withdraw|Claim|Transfer to TIP/.test(initialValues.transferType)
        if (currentUser && transferToSelf && !initialValues.to)
            initialValues.to = currentUser.get('username')

        if(currentUser && initialValues.to !== currentUser.get('username'))
            transferToSelf = false // don't hide the to field

        let uias = state.global.get('assets')
        let uia = undefined;
        if (uias) {
            uia = uias.get(initialValues.asset)
        }

        return {...ownProps, currentUser, currentAccount, uias, uia, toVesting, sym: initialValues.asset, transferToSelf, initialValues}
    },

    // mapDispatchToProps
    dispatch => ({
        setTransferDefaults: ({
            transferDefaults
        }) => {
            dispatch(user.actions.setTransferDefaults(transferDefaults))
        },
        dispatchSubmit: ({
            flag,
            to, amount, isUIA, asset, precision, memo, transferType,
            toVesting, currentUser, errorCallback
        }) => {
            if(!toVesting && !isUIA && !/Transfer to Account|Transfer to Savings|Savings Withdraw|Claim|Transfer to TIP|TIP to Account|Issue UIA/.test(transferType))
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
                memo: ((toVesting && transferType !== 'TIP to Vesting') || transferType === 'Claim'|| transferType === 'Issue UIA') ? undefined : (memo ? memo : '')
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

            // handle donate
            // TODO redesign transfer types globally
            if (flag) {
              // get transfer type and default memo composer
              // now 'donate' only
              const { fMemo, permlink } = flag;
              if (typeof operation.memo === `string`) {
                // donation with an empty memo
                // compose memo default for this case
                if (operation.memo.trim().length === 0) {
                  operation.memo = typeof fMemo === `function` ? fMemo() : operation.memo;
                }
              }
            }

            if (transferType === 'Claim') {
                operation.to_vesting = toVesting;
            }

            if (transferType === 'TIP to Account') {
                let donate_memo = {};
                donate_memo.app = "golos-id";
                donate_memo.version = 1;
                donate_memo.comment = operation.memo;
                donate_memo.target = {
                    author: operation.to,
                    permlink: ""
                };
                if (flag) {
                    const { permlink } = flag;
                    if (typeof permlink === `string`) {
                        donate_memo.target.permlink = permlink;
                    }
                }
                operation.memo = donate_memo;
            }

            dispatch(transaction.actions.broadcastOperation({
                type: toVesting ? (
                    transferType === 'TIP to Vesting' ? 'transfer_from_tip' :
                    transferType === 'Claim' ? 'claim' :
                    'transfer_to_vesting'
                ) : (
                    isUIA && transferType === 'TIP to Vesting' ? 'transfer_from_tip' :
                    transferType === 'Transfer to Account' ? 'transfer' :
                    transferType === 'Transfer to Savings' ? 'transfer_to_savings' :
                    transferType === 'Savings Withdraw' ? 'transfer_from_savings' :
                    transferType === 'Transfer to TIP' ? 'transfer_to_tip' :
                    transferType === 'TIP to Account' ? 'donate' :
                    transferType === 'Claim' ? 'claim' :
                    transferType === 'Issue UIA' ? 'asset_issue' :
                    null
                ),
                username,
                operation,
                successCallback,
                errorCallback
            }))
        }
    })
)(TransferForm)
