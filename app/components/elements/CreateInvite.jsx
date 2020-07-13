import React, {Component} from 'react'
import PropTypes from 'prop-types'
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate'
import {countDecimals, formatAsset, formatAmount} from 'app/utils/ParsersAndFormatters';
import g from 'app/redux/GlobalReducer'
import {connect} from 'react-redux';
import transaction from 'app/redux/Transaction'
import user from 'app/redux/User';
import tt from 'counterpart';
import {cleanReduxInput} from 'app/utils/ReduxForms'
import reactForm from 'app/utils/ReactForm';
import {PrivateKey} from 'golos-classic-js/lib/auth/ecc';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import CopyToClipboard from 'react-copy-to-clipboard';
import Icon from 'app/components/elements/Icon';

class CreateInvite extends Component {
    static propTypes = {
        // HTML
        account: PropTypes.object.isRequired,
        // Redux
        isMyAccount: PropTypes.bool.isRequired,
        accountName: PropTypes.string.isRequired,
    }

    constructor(props) {
        super()
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'CreateInvite')
        this.state = {
            errorMessage: '',
            successMessage: '',
        }
        this.initForm(props)
    }

    componentDidMount() {
        this.generateKeys()
    }

    componentWillUpdate(nextProps, nextState) {
    }

    generateKeys = () => {
        const pk = PrivateKey.fromSeed(Math.random().toString());
        this.state.public_key.props.onChange(pk.toPublicKey().toString());
        this.state.private_key.props.onChange(pk.toString());
    }

    initForm(props) {
        const insufficientFunds = (amount) => {
            const balanceValue = props.account.get('balance')
            if(!balanceValue) return false
            return parseFloat(amount) > parseFloat(balanceValue.split(' ')[0])
        }

        const meetsMinimum = (amount) => {
            const minValue = props.min_invite_balance
            if (!minValue) return false
            return parseFloat(amount) < parseFloat(minValue.split(' ')[0])
        }

        const validateSecret = (secret) => {
            try {
                PrivateKey.fromWif(secret);
                return null;
            } catch (e) {
                return tt('invites_jsx.claim_wrong_secret_format');
            }
        };

        const fields = ['public_key', 'private_key', 'amount']
        reactForm({
            name: 'invite',
            instance: this, fields,
            initialValues: {},
            validation: values => ({
                private_key:
                    ! values.private_key ? tt('g.required') : validateSecret(values.private_key),
                public_key:
                    ! values.public_key ? tt('g.required') : null,
                amount:
                    ! parseFloat(values.amount) || /^0$/.test(values.amount) ? tt('g.required') :
                    insufficientFunds(values.amount) ? tt('transfer_jsx.insufficient_funds') :
                    meetsMinimum(values.amount) ? tt('invites_jsx.meet_minimum') :
                    countDecimals(values.amount) > 3 ? tt('transfer_jsx.use_only_3_digits_of_precison') :
                    null,
            })
        })
        this.handleSubmitForm =
            this.state.invite.handleSubmit(args => this.handleSubmit(args))
    }

    balanceValue() {
        const {account} = this.props
        return formatAsset(account.get('balance'), true, false, '')
    }

    assetBalanceClick = e => {
        e.preventDefault()
        // Convert '9 GOLOS' to 9
        this.state.amount.props.onChange(this.balanceValue().split(' ')[0])
    }

    onChangePrivateKey = (e) => {
        const {value} = e.target
        let pk = value.trim()
        this.state.private_key.props.onChange(pk)
        try {
            this.state.public_key.props.onChange(PrivateKey.fromWif(pk).toPublicKey().toString())
        } catch (e) {
        }
    }

    onChangeAmount = (e) => {
        const {value} = e.target
        this.state.amount.props.onChange(formatAmount(value))
    }

    handleSubmit = ({updateInitialValues}) => {
        const {createInvite, accountName} = this.props
        const {public_key, amount} = this.state
        this.setState({loading: true});
        createInvite({public_key, amount, accountName, 
            errorCallback: (e) => {
                if (e === 'Canceled') {
                    this.setState({
                        loading: false,
                        errorMessage: ''
                    })
                } else {
                    console.log('createInvite ERROR', e)
                    this.setState({
                        loading: false,
                        errorMessage: tt('g.server_returned_error')
                    })
                }
            },
            successCallback: () => {
                this.setState({
                    loading: false,
                    errorMessage: '',
                    successMessage: tt('invites_jsx.success'),
                })
                // remove successMessage after a while
                setTimeout(() => this.setState({successMessage: ''}), 4000)
            }})
    }

    render() {
        const {props: {account, isMyAccount, cprops, min_invite_balance}} = this
        const {public_key, private_key, amount, loading, successMessage, errorMessage} = this.state
        const {submitting, valid} = this.state.invite

        return (<div>
            <form onSubmit={this.handleSubmitForm}>
                <div className="row">
                    <div className="column small-10">
                        {tt('invites_jsx.create_invite_info')}
                    <hr />
                    </div>
                </div>

                <div className="row">
                    <div className="column small-10">
                        <h4>{tt('invites_jsx.create_invite')}</h4>
                    </div>
                </div>

                <div className="row">
                    <div className="column small-10">
                        <div className="float-right"><a onClick={this.generateKeys}>{tt('invites_jsx.generate_new').toUpperCase()}</a></div>{tt('invites_jsx.private_key')}
                        <div className="input-group" style={{marginBottom: "1.25rem"}}>
                            <input
                                className="input-group-field bold"
                                type="text"
                                {...private_key.props} onChange={(e) => this.onChangePrivateKey(e)}
                            />
                            <CopyToClipboard 
                                text={private_key.value} 
                            >
                                <span className="CreateInvite__copy-button input-group-label" title={tt('explorepost_jsx.copy')}><Icon name="copy"/></span>
                            </CopyToClipboard>
                        </div>
                        {private_key.touched && private_key.blur && private_key.error &&
                            <div className="error">{private_key.error}&nbsp;</div>
                        }
                    </div>
                </div>

                <div className="row">
                    <div className="column small-10">
                        {tt('invites_jsx.public_key')}
                        <div className="input-group" style={{marginBottom: "1.25rem"}}>
                            <input
                                className="input-group-field bold"
                                type="text"
                                disabled
                                {...public_key.props}
                            />
                            <CopyToClipboard 
                                text={public_key.value} 
                            >
                                <span className="CreateInvite__copy-button input-group-label" title={tt('explorepost_jsx.copy')}><Icon name="copy"/></span>
                            </CopyToClipboard>
                        </div>
                        {public_key.touched && public_key.blur && public_key.error &&
                            <div className="error">{public_key.error}&nbsp;</div>
                        }
                    </div>
                </div>

                <div className="row">
                    <div className="column small-10">
                        {tt('g.amount')} ({tt('g.at_least')} <b>{formatAsset(min_invite_balance, true, false, '')}</b>)
                        <div className="input-group" style={{marginBottom: 5}}>
                            <input type="text" placeholder={tt('g.amount')} {...amount.props} ref="amount" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck="false" onChange={(e) => this.onChangeAmount(e)}/>
                        </div>
                        <div style={{marginBottom: "0.6rem"}}>
                            <AssetBalance balanceValue={this.balanceValue()} onClick={this.assetBalanceClick} />
                        </div>
                        {(amount.touched && amount.error) ?
                        <div className="error">
                            {amount.touched && amount.error && amount.error}&nbsp;
                        </div> : null}
                    </div>
                </div>
                
                <div className="row">
                    <div className="column small-10">
                        {loading && <span><LoadingIndicator type="circle" /><br /></span>}
                        {!loading && <input type="submit" className="button" value={tt('invites_jsx.create_btn')} disabled={submitting || !valid} />}
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
        const min_invite_balance = cprops ? cprops.get('min_invite_balance') : '0.000 GOLOS'
        return {...ownProps, isMyAccount, accountName, min_invite_balance}
    },
    dispatch => ({
        createInvite: ({
            public_key, amount, accountName, successCallback, errorCallback
        }) => {
            const operation = {
                creator: accountName,
                balance: parseFloat(amount.value, 10).toFixed(3) + ' GOLOS',
                invite_key: public_key.value
            }

            const success = () => {
                dispatch(user.actions.getAccount())
                successCallback()
            }

            dispatch(transaction.actions.broadcastOperation({
                type: 'invite',
                accountName,
                operation,
                successCallback: success,
                errorCallback
            }))
        }
    })
)(CreateInvite)
