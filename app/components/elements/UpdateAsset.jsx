import React, {Component} from 'react'
import PropTypes from 'prop-types'
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate'
import {countDecimals, formatAsset, formatAmount, longToAsset} from 'app/utils/ParsersAndFormatters';
import g from 'app/redux/GlobalReducer'
import {connect} from 'react-redux';
import { browserHistory } from 'react-router';
import transaction from 'app/redux/Transaction'
import user from 'app/redux/User';
import tt from 'counterpart';
import {cleanReduxInput} from 'app/utils/ReduxForms'
import reactForm from 'app/utils/ReactForm';
import {PrivateKey} from 'golos-classic-js/lib/auth/ecc';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import CopyToClipboard from 'react-copy-to-clipboard';
import Icon from 'app/components/elements/Icon';
import { Link } from 'react-router';

class UpdateAsset extends Component {
    static propTypes = {
        // HTML
        account: PropTypes.object.isRequired,
        // Redux
        isMyAccount: PropTypes.bool.isRequired,
        accountName: PropTypes.string.isRequired,
    }

    constructor(props) {
        super()
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'UpdateAsset')
        this.state = {
            errorMessage: '',
            successMessage: '',
            assetCost: '',
        }
        this.initForm(props)
    }

    componentDidMount() {
    }

    componentWillUpdate(nextProps, nextState) {
    }

    initForm(props) {
        const fields = ['fee_percent', 'symbols_whitelist']
        let fee_percent = props.asset.fee_percent
        fee_percent = longToAsset(fee_percent, '', 2).trim()
        reactForm({
            name: 'update_asset',
            instance: this, fields,
            initialValues: {
                fee_percent,
                symbols_whitelist: props.asset.symbols_whitelist.join('\n')
            },
            validation: values => ({
            })
        })
        this.handleSubmitForm =
            this.state.update_asset.handleSubmit(args => this.handleSubmit(args))
    }

    onChangeFeePercent = (e) => {
        let {value} = e.target
        let parts = value.split('.')
        if (parseFloat(value) == NaN || parseFloat(value) < 0 || parseFloat(value) > 100) return
        if (parts.length > 2) return
        this.state.fee_percent.props.onChange(value.replace(',','.'))
    }

    onBlurFeePercent = (e) => {
        let {value} = e.target
        this.state.fee_percent.props.onChange(parseFloat(value).toFixed(2))
    }

    onChangeSymbolsWhitelist = (e) => {
        let {value} = e.target
        let lines = value.split('\n')
        let lines2 = []
        for (let i = 0; i < lines.length; ++i) {
            let line = lines[i].trim().toUpperCase()
            if (line != '' || (i == lines.length - 1)) lines2.push(line)
        }
        this.state.symbols_whitelist.props.onChange(lines2.join('\n'))
    }

    handleSubmit = ({updateInitialValues}) => {
        const {updateAsset, accountName, symbol} = this.props
        const {fee_percent, symbols_whitelist} = this.state
        this.setState({loading: true});
        updateAsset({symbol, fee_percent, symbols_whitelist, accountName,
            errorCallback: (e) => {
                if (e === 'Canceled') {
                    this.setState({
                        loading: false,
                        errorMessage: ''
                    })
                } else {
                    console.log('updateAsset ERROR', e)
                    this.setState({
                        loading: false,
                        errorMessage: tt('g.server_returned_error')
                    })
                }
            },
            successCallback: () => {
                window.location.href = `/@${accountName}/assets`;
            }})
    }

    render() {
        const {props: {account, isMyAccount, cprops, symbol, asset}} = this
        if (!asset) return (<div></div>)
        const {fee_percent, symbols_whitelist, loading, successMessage, errorMessage} = this.state
        const {submitting, valid} = this.state.update_asset
        const account_name = account.get('name');

        return (<div>
            <form onSubmit={this.handleSubmitForm}>
                <div className="row">
                    <div className="column small-10">
                        <h4>{tt('assets_jsx.update_asset') + ' ' + symbol}</h4>
                    </div>
                </div>

                <div className="row">
                    <div className="column small-10">
                        {tt('assets_jsx.fee_percent')}
                        <div className="input-group">
                            <input
                                className="input-group-field bold"
                                type="text"
                                title={asset.allow_fee ? '' : tt('assets_jsx.fee_not_allowed')}
                                disabled={!asset.allow_fee}
                                {...fee_percent.props} maxlength="6" onChange={(e) => this.onChangeFeePercent(e)} onBlur={(e) => this.onBlurFeePercent(e)}
                            />
                        </div>
                        {fee_percent.touched && fee_percent.blur && fee_percent.error &&
                            <div className="error">{fee_percent.error}&nbsp;</div>
                        }
                    </div>
                </div>

                <div className="row">
                    <div className="column small-10">
                        {tt('assets_jsx.symbols_whitelist')}
                    <textarea 
                            {...symbols_whitelist.props} rows="10" onChange={(e) => this.onChangeSymbolsWhitelist(e)}/>
                    </div>
                </div>
<br/>

                <div className="row">
                    <div className="column small-10">
                        {loading && <span><LoadingIndicator type="circle" /><br /></span>}
                        {!loading && <input type="submit" className="button" value={tt('assets_jsx.update_btn')} disabled={submitting || !valid} />}
                        {' '}{
                            errorMessage
                                ? <small className="error">{errorMessage}</small>
                                : successMessage
                                ? <small className="success uppercase">{successMessage}</small>
                                : null
                        }
                        <Link to={`/@${account_name}/assets/${symbol}/transfer`} className="button hollow no-border Assets__noMarginBottom">
                            {tt('assets_jsx.transfer_asset_btn')}
                        </Link>
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
        let asset = null
        let assets = state.global.get('assets')
        asset = assets && assets.toJS()[ownProps.symbol]
        return {...ownProps, isMyAccount, accountName,
            asset}
    },
    dispatch => ({
        updateAsset: ({
            symbol, fee_percent, symbols_whitelist, accountName, successCallback, errorCallback
        }) => {
            let sw = symbols_whitelist.value.split('\n')
            let set = new Set()
            for (let i = 0; i < sw.length; ++i) {
                if (sw[i] != '') set.add(sw[i])
            }

            const operation = {
                creator: accountName,
                symbol,
                fee_percent: parseInt(fee_percent.value.replace('.','').replace(',','')),
                symbols_whitelist: [...set]
            }

            const success = () => {
                dispatch(user.actions.getAccount())
                successCallback()
            }

            dispatch(transaction.actions.broadcastOperation({
                type: 'asset_update',
                accountName,
                operation,
                successCallback: success,
                errorCallback
            }))
        },
    })
)(UpdateAsset)
