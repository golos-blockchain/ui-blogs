import React, {Component} from 'react'
import PropTypes from 'prop-types'
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate'
import {countDecimals, formatAsset, formatAmount} from 'app/utils/ParsersAndFormatters';
import g from 'app/redux/GlobalReducer'
import {connect} from 'react-redux';
import { browserHistory } from 'react-router';
import transaction from 'app/redux/Transaction'
import user from 'app/redux/User';
import tt from 'counterpart';
import Icon from 'app/components/elements/Icon';
import reactForm from 'app/utils/ReactForm';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import Slider from 'golos-ui/Slider';
import {api} from 'golos-lib-js';

class CreateAsset extends Component {
    static propTypes = {
        // HTML
        account: PropTypes.object.isRequired,
        // Redux
        isMyAccount: PropTypes.bool.isRequired,
        accountName: PropTypes.string.isRequired,
    }

    constructor(props) {
        super()
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'CreateAsset')
        this.state = {
            errorMessage: '',
            successMessage: '',
            assetCost: '',
        }
        this.initForm(props)
    }

    initForm(props) {
        const insufficientFunds = (symbol) => {
            const balanceValue = props.account.get('sbd_balance')
            if(!balanceValue) return false
            let minValue = parseFloat(props.asset_creation_fee)
            if (symbol.length == 3) minValue *= 50
            if (symbol.length == 4) minValue *= 10
            return parseFloat(minValue) > parseFloat(balanceValue.split(' ')[0])
        }

        const validateSymbol = (symbol) => {
            if (symbol.length < 3) return tt('assets_jsx.symbol_too_short');
            const parts = symbol.split('.')
            if (parts[0] == 'GOLOS' || parts[0] == 'GBG' || parts[0] == 'GESTS') {
                if (parts.length > 1) return tt('assets_jsx.top_symbol_not_your');
                return tt('assets_jsx.symbol_exists');
            }
            if (parts.length > 1 && parts[1].length < 3) return tt('assets_jsx.subsymbol_too_short');
            const assets = this.props.assets.toJS()
            if (symbol in assets) return tt('assets_jsx.symbol_exists');
            if (parts.length > 1) {
                if (parts[0] in assets) {
                    const username = props.account.get('name')
                    if (assets[parts[0]].creator != username) return tt('assets_jsx.top_symbol_not_your');
                } else {
                    return tt('assets_jsx.top_symbol_not_exists');
                }
            }
            return null
        };

        const fields = ['symbol', 'precision', 'max_supply', 'allow_fee:checked', 'allow_override_transfer:checked', 'image_url', 'description']
        reactForm({
            name: 'create_asset',
            instance: this, fields,
            initialValues: {
                symbol: '',
                precision: 3,
                max_supply: '1000000',
                allow_fee: false,
                allow_override_transfer: false
            },
            validation: values => ({
                symbol:
                    ! values.symbol ? tt('g.required') :
                        (insufficientFunds(values.symbol) ? tt('transfer_jsx.insufficient_funds') : validateSymbol(values.symbol)),
                precision:
                    ! values.precision ? tt('g.required') : null,
                max_supply:
                    ! values.max_supply ? tt('g.required') : null,
                allow_fee: null,
                allow_override_transfer: null,
                /*precision:
                    ! parseFloat(values.amount) || /^0$/.test(values.amount) ? tt('g.required') :
                    insufficientFunds(values.amount) ? tt('transfer_jsx.insufficient_funds') :
                    meetsMinimum(values.amount) ? tt('invites_jsx.meet_minimum') :
                    countDecimals(values.amount) > 3 ? tt('transfer_jsx.use_only_3_digits_of_precison') :
                    null,*/
            })
        })
        this.handleSubmitForm =
            this.state.create_asset.handleSubmit(args => this.handleSubmit(args))
    }

    onChangeSymbol = (e) => {
        let {value} = e.target
        value = value.toUpperCase()
        let symbol = ''
        let machine_state = 0
        for (let i = 0; i < value.length; ++i) {
            if (value[i] < 'A' || value[i] > 'Z') {
                if (value[i] != '.') continue;
                if (machine_state != 3) continue;
                machine_state = 4
            } else {
                if (machine_state < 3) machine_state += 1
            }
            symbol += value[i]
        }
        this.state.symbol.props.onChange(symbol)

        let minValue = parseFloat(this.props.asset_creation_fee)
        if (symbol.length == 3) minValue *= 50
        if (symbol.length == 4) minValue *= 10
        if (symbol.length < 3) {
            this.setState({
                assetCost: ''
            })
        } else {
            this.setState({
                assetCost: tt('workers.proposal_fee') + ' ' + parseInt(minValue) + ' GBG'
            })
        }
    }

    onChangePrecision = (value) => {
        this.state.precision.props.onChange(value)
        this.state.max_supply.props.onChange(this.state.max_supply.props.value.substr(0, 16 - value))
    }

    onChangeMaxSupply = (e) => {
        let {value} = e.target
        let symbol = ''
        for (let i = 0; i < value.length; ++i) {
            if (value[i] < '0' || value[i] > '9') {
                continue;
            }
            symbol += value[i]
        }
        this.state.max_supply.props.onChange(symbol)
    }

    onChangeAllowFee = (e) => {
        this.state.allow_fee.props.onChange(e.target.checked)
    }

    onChangeAllowOverrideTransfer = (e) => {
        this.state.allow_override_transfer.props.onChange(e.target.checked)
    }

    onChangeDescription = (e) => {
        let {value} = e.target
        this.state.description.props.onChange(value)
    }

    onChangeImageUrl = (e) => {
        let {value} = e.target
        this.state.image_url.props.onChange(value)
    }

    handleSubmit = ({updateInitialValues}) => {
        const {createAsset, accountName} = this.props
        const {symbol, max_supply, precision, allow_fee, allow_override_transfer, description, image_url} = this.state
        this.setState({loading: true});
        createAsset({symbol, max_supply, precision, allow_fee, allow_override_transfer, image_url, description, accountName,
            errorCallback: (e) => {
                if (e === 'Canceled') {
                    this.setState({
                        loading: false,
                        errorMessage: ''
                    })
                } else {
                    console.log('createAsset ERROR', e)
                    this.setState({
                        loading: false,
                        errorMessage: tt('g.server_returned_error')
                    })
                }
            },
            successCallback: () => {
                browserHistory.push(`/@${accountName}/assets`);
            }})
    }

    render() {
        const {props: {account, isMyAccount, cprops, min_invite_balance}} = this
        const {symbol, max_supply, precision, allow_fee, allow_override_transfer, image_url, description, loading, successMessage, errorMessage} = this.state
        const {submitting, valid} = this.state.create_asset

        return (<div>
            <form onSubmit={this.handleSubmitForm}>
                <div className="row">
                    <div className="column small-10">
                        <span className="float-right secondary" style={{marginTop: '0.5rem' }}><a target="_blank" href="/@allforyou/sozdaem-i-ispolzuem-uia-na-golose">Подробнее о создании UIA актива</a> <Icon name="extlink" size="1_5x" /></span>
                        <h4>{tt('assets_jsx.create_asset')}</h4>
                    </div>
                </div>

                <div className="row">
                    <div className="column small-10">
                        {tt('assets_jsx.symbol')}
                        <div className="input-group" style={{marginBottom: "1.25rem"}}>
                            <input
                                className="input-group-field bold"
                                type="text"
                                {...symbol.props} maxLength="14" onChange={(e) => this.onChangeSymbol(e)}
                            />
                        </div>
                        {this.state.assetCost != '' && <div className="Assets__cost">{this.state.assetCost}</div>
                        }
                        {symbol.touched && symbol.blur && symbol.error &&
                            <div className="error Assets__noMarginBottom">{symbol.error}&nbsp;</div>
                        }
                    </div>
                </div>

                <div className="row Assets__marginTop">
                    <div className="column small-10">
                        {tt('assets_jsx.precision')}
                        <Slider
                            {...precision.props}
                            min={1}
                            max={8}
                            onChange={this.onChangePrecision} />
                    </div>
                </div>
<br/>
                <div className="row">
                    <div className="column small-10">
                        {tt('assets_jsx.max_supply')}
                        <div className="input-group" style={{marginBottom: "0rem"}}>
                            <input
                                className="input-group-field bold"
                                {...max_supply.props}
                                maxLength={16 - parseInt(precision.props.value)}
                                type="text"
                                 onChange={(e) => this.onChangeMaxSupply(e)}
                            />
                        </div>
                    </div>
                </div>
<br/>
                <div className="row">
                    <div className="column small-10">
                        {tt('assets_jsx.description')}
                        <div className="input-group" style={{marginBottom: "0rem"}}>
                            <input
                                className="input-group-field bold"
                                {...description.props}
                                maxLength="500"
                                type="text"
                                 onChange={(e) => this.onChangeDescription(e)}
                            />
                        </div>
                    </div>
                </div>
<br/>
                <div className="row">
                    <div className="column small-10">
                        {tt('assets_jsx.image_with_text')}
                        <div className="input-group" style={{marginBottom: "1.25rem"}}>
                            <input
                                className="input-group-field bold"
                                {...image_url.props}
                                maxLength="512"
                                type="text"
                                 onChange={(e) => this.onChangeImageUrl(e)}
                            />
                        </div>
                    </div>
                </div>
                
                <div className="row">
                    <div className="column small-10">
                        <div className="input-group" style={{marginBottom: "1.25rem"}}>
                            <label>
                                <input
                                    className="input-group-field bold"
                                    type="checkbox"
                                    {...allow_fee.props} onChange={(e) => this.onChangeAllowFee(e)}
                                />
                                {tt('assets_jsx.allow_fee')}
                            </label>
                        </div>
                        {allow_fee.touched && allow_fee.blur && allow_fee.error &&
                            <div className="error">{allow_fee.error}&nbsp;</div>
                        }
                    </div>
                </div>

                <div className="row">
                    <div className="column small-10">
                        <div className="input-group">
                            <label>
                                <input
                                    className="input-group-field bold"
                                    type="checkbox"
                                    {...allow_override_transfer.props} onChange={(e) => this.onChangeAllowOverrideTransfer(e)}
                                />
                                {tt('assets_jsx.allow_override_transfer')}
                            </label>
                        </div>
                        {allow_override_transfer.touched && allow_override_transfer.blur && allow_fee.error &&
                            <div className="error">{allow_override_transfer.error}&nbsp;</div>
                        }
                    </div>
                </div>

                <div className="row">
                    <div className="column small-10 secondary" style={{marginBottom: "1.25rem"}}>
                    {tt('assets_jsx.allow_danger_note')}
                    </div>
                </div>

                <div className="row">
                    <div className="column small-10">
                        {loading && <span><LoadingIndicator type="circle" /><br /></span>}
                        {!loading && <input type="submit" className="button" value={tt('assets_jsx.create_btn')} disabled={submitting || !valid} />}
                        {' '}{
                            errorMessage
                                ? <small className="error">{errorMessage}</small>
                                : successMessage
                                ? <small className="success uppercase">{successMessage}</small>
                                : null
                        }
                    </div>
                </div>
            </form>
            <div className="row">
                <div className="column small-10">
                    <hr />
                </div>
            </div>
        </div>)
    }
}
const AssetBalance = ({onClick, balanceValue}) =>
    <a onClick={onClick} style={{borderBottom: '#A09F9F 1px dotted', cursor: 'pointer'}}>{tt('transfer_jsx.balance') + ": " + balanceValue}</a>

export default connect(
    (state, ownProps) => {
        const {account} = ownProps
        const accountName = account.get('name')
        const current = state.user.get('current')
        const username = current && current.get('username')
        const isMyAccount = username === accountName
        const cprops = state.global.get('cprops');
        const asset_creation_fee = cprops ? cprops.get('asset_creation_fee') : '0.000 GOLOS'
        return {...ownProps, isMyAccount, accountName, asset_creation_fee,
            assets: state.global.get('assets')}
    },
    dispatch => ({
        createAsset: ({
            symbol, max_supply, precision, allow_fee, allow_override_transfer, image_url, description, accountName, successCallback, errorCallback
        }) => {
            const operation = {
                creator: accountName,
                max_supply: max_supply.value + '.' + '0'.repeat(precision.value) + ' ' + symbol.value,
                allow_fee: allow_fee.value,
                allow_override_transfer: allow_override_transfer.value,
                json_metadata: JSON.stringify({image_url: image_url.value, description: description.value})
            }

            const success = () => {
                dispatch(user.actions.getAccount())
                successCallback()
            }

            dispatch(transaction.actions.broadcastOperation({
                type: 'asset_create',
                accountName,
                operation,
                successCallback: success,
                errorCallback
            }))
        },

        showQRKey: ({type, isPrivate, text}) => {
            dispatch(g.actions.showDialog({name: "qr_key", params: {type, isPrivate, text}}));
        }
    })
)(CreateAsset)
