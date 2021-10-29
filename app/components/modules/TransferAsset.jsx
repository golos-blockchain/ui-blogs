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
import reactForm from 'app/utils/ReactForm';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import { Link } from 'react-router';
import Slider from 'golos-ui/Slider';
import {validate_account_name} from 'app/utils/ChainValidation';

class TransferAsset extends Component {
    static propTypes = {
        // HTML
        account: PropTypes.object.isRequired,
        // Redux
        isMyAccount: PropTypes.bool.isRequired,
        accountName: PropTypes.string.isRequired,
    }

    constructor(props) {
        super()
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'TransferAsset')
        this.state = {
            errorMessage: '',
            successMessage: '',
            assetCost: '',
        }
        this.initForm(props)
    }

    initForm(props) {
        const fields = ['new_owner']
        reactForm({
            name: 'transfer_asset',
            instance: this, fields,
            initialValues: {
            },
            validation: values => ({
                new_owner: ! values.new_owner ? tt('g.required') : (values.new_owner == props.accountName ? tt('assets_jsx.cannot_transfer_to_oneself') : validate_account_name(values.new_owner))
            })
        })
        this.handleSubmitForm =
            this.state.transfer_asset.handleSubmit(args => this.handleSubmit(args))
    }

    onChangeNewOwner = (value) => {
        this.state.new_owner.props.onChange(value)
    }

    handleSubmit = ({updateInitialValues}) => {
        const {transferAsset, accountName, symbol} = this.props
        const {new_owner} = this.state
        this.setState({loading: true});
        transferAsset({symbol, new_owner, accountName,
            errorCallback: (e) => {
                if (e === 'Canceled') {
                    this.setState({
                        loading: false,
                        errorMessage: ''
                    })
                } else {
                    console.log('transferAsset ERROR', e)
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
        const {props: {account, isMyAccount, cprops, symbol, asset}} = this
        if (!asset) return (<div></div>)
        const {new_owner, loading, successMessage, errorMessage} = this.state
        const {submitting, valid} = this.state.transfer_asset
        const account_name = account.get('name');

        return (<div>
            <form onSubmit={this.handleSubmitForm}>
                <div className="row">
                    <div className="column small-10">
                        <h4>{tt('assets_jsx.transfer_asset') + ' ' + symbol}</h4>
                    </div>
                </div>

                <div className="row">
                    <div className="column small-10">
                        {tt('assets_jsx.transfer_new_owner')}
                        <div className="input-group">
                            <input
                                className="input-group-field bold"
                                type="text"
                                {...new_owner.props} maxlength="16" onChange={(e) => this.onChangeNewOwner(e)}
                            />
                        </div>
                        {new_owner.touched && new_owner.blur && new_owner.error &&
                            <div className="error">{new_owner.error}&nbsp;</div>
                        }
                    </div>
                </div>

                <div className="row">
                    <div className="column small-10">
                        {loading && <span><LoadingIndicator type="circle" /><br /></span>}
                        {!loading && <input type="submit" className="button" value={tt('assets_jsx.transfer_asset_btn2')} disabled={submitting || !valid} />}
                        {' '}{
                            errorMessage
                                ? <small className="error">{errorMessage}</small>
                                : successMessage
                                ? <small className="success uppercase">{successMessage}</small>
                                : null
                        }
                        <Link to={`/@${account_name}/assets/${symbol}/update`} className="button hollow no-border Assets__noMarginBottom">
                            {tt('assets_jsx.update_btn')}
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
        transferAsset: ({
            symbol, new_owner, accountName, successCallback, errorCallback
        }) => {
            const operation = {
                creator: accountName,
                symbol,
                new_owner: new_owner.value
            }

            const success = () => {
                dispatch(user.actions.getAccount())
                successCallback()
            }

            dispatch(transaction.actions.broadcastOperation({
                type: 'asset_transfer',
                accountName,
                operation,
                successCallback: success,
                errorCallback
            }))
        }
    })
)(TransferAsset)
