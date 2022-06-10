import React, {Component} from 'react'
import PropTypes from 'prop-types'
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate'
import {countDecimals, formatAsset, formatAmount} from 'app/utils/ParsersAndFormatters';
import g from 'app/redux/GlobalReducer'
import {connect} from 'react-redux';
import transaction from 'app/redux/Transaction'
import user from 'app/redux/User';
import tt from 'counterpart';
import reactForm from 'app/utils/ReactForm';
import {PrivateKey} from 'golos-lib-js/lib/auth/ecc';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import CopyToClipboard from 'react-copy-to-clipboard';
import Icon from 'app/components/elements/Icon';
import { authRegisterUrl, } from 'app/utils/AuthApiClient';

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
        this.setDefaultAmount();
    }

    componentDidUpdate(prevProps) {
        if (this.props.min_invite_balance !== prevProps.min_invite_balance) {
            this.setDefaultAmount();
        }
    }

    setDefaultAmount = () => {
        const { min_invite_balance } = this.props;
        const { amount } = this.state;
        if (min_invite_balance && !amount.value) {
            const val = (parseInt(min_invite_balance) + 1).toString()
            amount.props.onChange(val)
        }
    }

    updatePrivateKey = (pk) => {
        this.state.private_key.props.onChange(pk);

        const register_link = authRegisterUrl() + `?invite=${pk}`;
        this.state.register_link.props.onChange(register_link);
    }

    generateKeys = () => {
        const pk = PrivateKey.fromSeed(Math.random().toString());
        this.updatePrivateKey(pk.toString())
        this.setState({
            createdInvite: '',
        });
    }

    initForm(props) {
        const insufficientFunds = (amount) => {
            const balanceValue = props.account.get('balance')
            if(!balanceValue) return false
            return parseFloat(amount) > parseFloat(balanceValue.split(' ')[0])
        }

        const meetsMinimum = (amount) => {
            const minValue = this.props.min_invite_balance
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

        const fields = ['private_key', 'register_link', 'amount', 'is_referral:checked']
        reactForm({
            name: 'invite',
            instance: this, fields,
            initialValues: {},
            validation: values => ({
                private_key:
                    ! values.private_key ? tt('g.required') : validateSecret(values.private_key),
                register_link:
                    ! values.register_link ? tt('g.required') : null,
                amount:
                    ! parseFloat(values.amount) || /^0$/.test(values.amount) ? tt('g.required') :
                    insufficientFunds(values.amount) ? tt('transfer_jsx.insufficient_funds') :
                    meetsMinimum(values.amount) ? tt('invites_jsx.meet_minimum') :
                    countDecimals(values.amount) > 3 ? tt('transfer_jsx.use_only_3_digits_of_precison') :
                    null,
                is_referral: null,
            })
        })
        this.handleSubmitForm =
            this.state.invite.handleSubmit(args => this.handleSubmit(args))
    }

    showQrPriv = e => {
        this.props.showQRKey({type: 'Invite', text: this.state.private_key.value, isPrivate: true});
    }

    showQrRegLink = e => {
        this.props.showQRKey({type: 'Invite', text: this.state.register_link.value, title: tt('invites_jsx.register_link')});
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
        this.updatePrivateKey(pk)
    }

    onChangeAmount = (e) => {
        const {value} = e.target
        this.state.amount.props.onChange(formatAmount(value))
    }

    onChangeIsReferral = (e) => {
        this.state.is_referral.props.onChange(e.target.checked)
    }

    handleSubmit = ({updateInitialValues}) => {
        const {createInvite, accountName} = this.props
        const {private_key, amount, is_referral} = this.state
        this.setState({loading: true});
        const public_key = PrivateKey.fromWif(private_key.value).toPublicKey().toString();
        createInvite({public_key, amount, is_referral, accountName, 
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
                    createdInvite: public_key,
                })
                // remove successMessage after a while
                setTimeout(() => this.setState({successMessage: ''}), 8000)
            }})
    }

    render() {
        const {props: {account, isMyAccount, cprops, min_invite_balance}} = this
        const {private_key, register_link, amount, is_referral, loading, successMessage, errorMessage, createdInvite} = this.state
        const {submitting, valid} = this.state.invite

        let publicKeyLink = null;
        if (createdInvite) {
            publicKeyLink = `https://gapi.golos.today/api/database_api/get_invite?invite_key=${createdInvite}`;
            publicKeyLink=(<span>{tt('invites_jsx.public_key_can_be_checked') + ' '}
                    <a href={publicKeyLink} target='_blank' rel='noopener noreferrer'>{tt('g.here')}</a>
                    <Icon name="extlink" size="1_5x" />
                </span>);
        }

        return (<div>
            <form onSubmit={this.handleSubmitForm}>
                <div className="row">
                    <div className="column small-10 secondary">
                        {tt('invites_jsx.create_invite_info')} <a href="/@lex/cheki-kak-instrument-peredachi-tokenov">{tt('g.more_hint')}</a> <Icon name="extlink" size="1_5x" />
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
                        <div className="float-right">
                            <a onClick={this.generateKeys}>{tt('invites_jsx.generate_new').toUpperCase()}</a>
                        </div>
                        {tt('invites_jsx.private_key')}
                        <div className="input-group" style={{marginBottom: "1.25rem"}}>
                            <div style={{display: "inline-block", paddingTop: 2, paddingRight: 5, cursor: "pointer"}} onClick={this.showQrPriv}>
                                <img src={require("app/assets/images/qrcode.png")} height="40" width="40" />
                            </div>
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
                        {tt('invites_jsx.register_link')}
                        <div className="input-group" style={{marginBottom: "1.25rem"}}>
                            <div style={{display: "inline-block", paddingTop: 2, paddingRight: 5, cursor: "pointer"}} onClick={this.showQrRegLink}>
                                <img src={require("app/assets/images/qrcode.png")} height="40" width="40" />
                            </div>
                            <input
                                className="input-group-field bold"
                                type="text"
                                style={{color: '#0078C4'}}
                                disabled
                                {...register_link.props}
                            />
                            <CopyToClipboard 
                                text={register_link.value} 
                            >
                                <span className="CreateInvite__copy-button input-group-label" title={tt('explorepost_jsx.copy')}><Icon name="copy"/></span>
                            </CopyToClipboard>
                        </div>
                    </div>
                </div>

                <div className="row">
                    <div className="column small-10">
                        {tt('g.amount')} (<b>{min_invite_balance ? formatAsset(min_invite_balance, true, false, '') : '0 GOLOS'}{' ' + tt('g.or_more')}</b>)
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
                        <div className="input-group" style={{marginBottom: '0rem'}}>
                            <label title={tt('invites_jsx.referral_invite')}>
                                <input
                                    className="input-group-field bold"
                                    type="checkbox"
                                    {...is_referral.props} onChange={(e) => this.onChangeIsReferral(e)}
                                />
                                {tt('invites_jsx.is_referral')} (?)
                            </label>
                        </div>
                        {is_referral.touched && is_referral.blur && is_referral.error &&
                            <div className="error">{is_referral.error}&nbsp;</div>
                        }
                    </div>
                </div>

                {publicKeyLink ? (<div className="row" style={{marginTop: "0.5rem"}}>
                    <div className="column small-10 secondary">
                        {publicKeyLink}
                    </div>
                </div>) : null}

                <div className="row" style={{marginTop: "1.25rem"}}>
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
        const min_invite_balance = cprops && cprops.get('min_invite_balance')
        return {...ownProps, isMyAccount, accountName, min_invite_balance}
    },
    dispatch => ({
        createInvite: ({
            public_key, amount, is_referral, accountName, successCallback, errorCallback
        }) => {
            let operation = {
                creator: accountName,
                balance: parseFloat(amount.value, 10).toFixed(3) + ' GOLOS',
                invite_key: public_key
            }
            if (is_referral.value) {
                operation.extensions = [[0, {
                    is_referral: true,
                }]];
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
        },

        showQRKey: ({type, isPrivate, text, title}) => {
            dispatch(g.actions.showDialog({name: "qr_key", params: {type, isPrivate, text, title}}));
        }
    })
)(CreateInvite)
