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
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
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
        const fields = ['fee_percent', 'symbols_whitelist', 'description', 'image_url']
        let fee_percent = props.asset.fee_percent
        fee_percent = longToAsset(fee_percent, '', 2).trim()
        let description = ''
        let image_url = ''
        if (props.asset.json_metadata.startsWith('{')) {
            let json_metadata = JSON.parse(props.asset.json_metadata)
            description = json_metadata.description
            image_url = json_metadata.image_url
        }
        reactForm({
            name: 'update_asset',
            instance: this, fields,
            initialValues: {
                fee_percent,
                description,
                image_url,
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

    onChangeDescription = (e) => {
        let {value} = e.target
        this.state.description.props.onChange(value)
    }

    onChangeImageUrl = (e) => {
        let {value} = e.target
        this.state.image_url.props.onChange(value)
    }

    handleSubmit = ({updateInitialValues}) => {
        const {updateAsset, accountName, symbol} = this.props
        const {fee_percent, symbols_whitelist, description, image_url} = this.state
        this.setState({loading: true});
        updateAsset({symbol, fee_percent, symbols_whitelist, image_url, description, accountName,
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
        const {fee_percent, symbols_whitelist, description, image_url, loading, successMessage, errorMessage} = this.state
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
                        {tt('assets_jsx.description')}
                        <div className="input-group" style={{marginBottom: "0rem"}}>
                            <input
                                className="input-group-field bold"
                                {...description.props}
                                maxlength="500"
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
                                maxlength="512"
                                type="text"
                                 onChange={(e) => this.onChangeImageUrl(e)}
                            />
                        </div>
                    </div>
                </div>

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
            symbol, fee_percent, symbols_whitelist, image_url, description, accountName, successCallback, errorCallback
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
                symbols_whitelist: [...set],
                json_metadata: JSON.stringify({image_url: image_url.value, description: description.value})
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
