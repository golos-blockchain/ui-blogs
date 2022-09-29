import React, {Component} from 'react'
import PropTypes from 'prop-types'
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate'
import {countDecimals, formatAmount} from 'app/utils/ParsersAndFormatters';
import {validate_account_name} from 'app/utils/ChainValidation'
import g from 'app/redux/GlobalReducer'
import {connect} from 'react-redux';
import transaction from 'app/redux/Transaction'
import user from 'app/redux/User';
import tt from 'counterpart';
import reactForm from 'app/utils/ReactForm';
import {PrivateKey} from 'golos-lib-js/lib/auth/ecc';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';

class ClaimInvite extends Component {
    static propTypes = {
        // HTML
        account: PropTypes.object.isRequired,
        // Redux
        isMyAccount: PropTypes.bool.isRequired,
        accountName: PropTypes.string.isRequired,
    }

    constructor(props) {
        super()
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'ClaimInvite')
        this.state = {
            errorMessage: '',
            successMessage: '',
        }
        this.initForm(props)
    }

    initForm(props) {
        const fields = ['invite_secret'];
        const validateSecret = (secret) => {
            try {
                PrivateKey.fromWif(secret);
                return null;
            } catch (e) {
                return tt('invites_jsx.claim_wrong_secret');
            }
        };
        reactForm({
            name: 'invite',
            instance: this, fields,
            initialValues: {},
            validation: values => ({
                invite_secret:
                    ! values.invite_secret ? tt('g.required') : validateSecret(values.invite_secret)
            })
        })
        this.handleSubmitForm =
            this.state.invite.handleSubmit(args => this.handleSubmit(args))
    }

    onChangeInviteSecret = (e) => {
        const {value} = e.target
        this.state.invite_secret.props.onChange(value.trim())
    }

    handleSubmit = ({updateInitialValues}) => {
        const {claimInvite, accountName} = this.props
        const {invite_secret} = this.state
        this.setState({loading: true});
        claimInvite({invite_secret, accountName,
            errorCallback: (e) => {
                if (e === 'Canceled') {
                    this.setState({
                        loading: false,
                        errorMessage: ''
                    })
                } else {
                    console.log('claimInvite ERROR', e)
                    this.setState({
                        loading: false,
                        errorMessage: e.includes('Missing') ? tt('invites_jsx.claim_wrong_secret_fatal') : tt('g.server_returned_error')
                    })
                }
            },
            successCallback: () => {
                this.setState({
                    loading: false,
                    errorMessage: '',
                    successMessage: tt('invites_jsx.success_claim'),
                })
                // remove successMessage after a while
                setTimeout(() => this.setState({successMessage: ''}), 4000)
            }})
    }

    render() {
        const {props: {account, isMyAccount}} = this
        const {invite_secret, loading, successMessage, errorMessage} = this.state
        const {submitting, valid} = this.state.invite

        return (<div>
            <form onSubmit={this.handleSubmitForm}>
                <div className="row">
                    <div className="column small-10">
                        <h4>{tt('invites_jsx.claim_invite')}</h4>
                    </div>
                </div>

                <div className="row">
                    <div className="column small-10">
                        {tt('invites_jsx.private_key')}
                        <div className="input-group" style={{marginBottom: "1.25rem"}}>
                            <input
                                className="input-group-field bold"
                                type="text"
                                {...invite_secret.props} onChange={(e) => this.onChangeInviteSecret(e)}
                            />
                        </div>
                        {invite_secret.touched && invite_secret.blur && invite_secret.error &&
                            <div className="error">{invite_secret.error}&nbsp;</div>
                        }
                    </div>
                </div>

                <div className="row">
                    <div className="column small-10">
                        {loading && <span><LoadingIndicator type="circle" /><br /></span>}
                        {!loading && <input type="submit" className="button" value={tt('invites_jsx.claim_btn')} disabled={submitting || !valid} />}
                        {' '}{
                            errorMessage
                                ? <small className="error">{errorMessage}</small>
                                : successMessage
                                ? <small className="success uppercase">{successMessage}</small>
                                : null
                        }
                    </div>
                </div>
                <br/>
            </form>
        </div>)
    }
}

export default connect(
    (state, ownProps) => {
        const {account} = ownProps
        const accountName = account.get('name')
        const current = state.user.get('current')
        const username = current && current.get('username')
        const isMyAccount = username === accountName
        return {...ownProps, isMyAccount, accountName}
    },
    dispatch => ({
        claimInvite: ({
            invite_secret, accountName, successCallback, errorCallback
        }) => {
            const operation = {
                initiator: accountName,
                receiver: accountName,
                invite_secret: invite_secret.value
            }

            const success = () => {
                dispatch(user.actions.getAccount())
                successCallback()
            }

            dispatch(transaction.actions.broadcastOperation({
                type: 'invite_claim',
                accountName,
                operation,
                successCallback: success,
                errorCallback
            }))
        }
    })
)(ClaimInvite)
