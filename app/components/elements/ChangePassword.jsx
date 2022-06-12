/* eslint react/prop-types: 0 */
import React from 'react'
import PropTypes from 'prop-types'
import { connect, } from 'react-redux';
import { Formik, Field, ErrorMessage, } from 'formik';
import {api} from 'golos-lib-js';
import {PrivateKey, PublicKey, key_utils} from 'golos-lib-js/lib/auth/ecc';
import tt from 'counterpart';
import transaction from 'app/redux/Transaction'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import {validate_account_name} from 'app/utils/ChainValidation'
import KeyFile from 'app/utils/KeyFile';
import { APP_NAME } from 'app/client_config';

const {string, oneOf} = PropTypes

class ChangePassword extends React.Component {
    static propTypes = {
        // HTML properties
        username: string,
        defaultPassword: string,
        authType: oneOf(['posting', 'active', 'owner', 'memo']), // null for all
        priorAuthKey: string, // Required pubkey if authType is given
    }

    constructor(props) {
        super(props)
        this.state = {
            generated: false,
        };
    }

    componentWillUnmount() {
        newWif = null;
    }

    generateWif = (e) => {
        newWif = 'P' + key_utils.get_random_key().toWif();
        this.setState({ generated: true, });
    };

    onNameChange = (e, values, handle) => {
        let value = e.target.value.trim().toLowerCase();
        e.target.value = value;
        return handle(e);
    };

    validateName = async (accountName) => {
        let errors = {};
        errors.accountName = validate_account_name(accountName);
        if (!errors.accountName) delete errors.accountName;
        if (!errors.accountName) {
            try {
                const res = await api.getAccountsAsync([accountName])
                if (!res || !res.length) {
                    errors.accountName = tt('g.account_not_found');
                }
            } catch (err) {
                console.error('validating accountName', err);
                errors.accountName = 'Account name can\'t be verified right now due to server failure. Please try again later.';
            }
        }
        return errors;
    };

    validate = async (values) => {
        let errors = {};
        const { accountName, password, confirmPassword,
            confirmCheck, confirmSaved, } = values;

        if (accountName) {
            errors = {...errors, ...await this.validateName(accountName), };
        }

        if (!password) {
            errors.password = tt('g.required');
        } else if (PublicKey.fromString(password)) {
            errors.password = tt('g.you_need_private_password_or_key_not_a_public_key');
        }

        if (!confirmPassword) {
            errors.confirmPassword = tt('g.required');
        } else if (confirmPassword.trim() !== newWif) {
            errors.confirmPassword = tt('g.passwords_do_not_match');
        }

        if (!confirmCheck) errors.confirmCheck = tt('g.required');

        if (!confirmSaved) errors.confirmSaved = tt('g.required');

        return errors;
    }

    _onSubmit = (values, { setSubmitting, }) => {
        const { changePassword, authType, priorAuthKey, } = this.props;
        const { notify, } = this.props;
        const { accountName, password, twofa, } = values;
        const success = () => {
            this.setState({ error: null, });
            setSubmitting(false);
            const { onClose, } = this.props;
            if (onClose) onClose();
            notify('Password Updated');
            window.location = `/login.html#account=${accountName}&msg=passwordupdated`;
        };
        const error = (e) => {
            this.setState({ error: e, });
            setSubmitting(false);
        };
        this.setState({ error: null, });
        changePassword(accountName, authType, priorAuthKey,
            password, twofa, success, error);
    }

    render() {
        if (!process.env.BROWSER) { // don't render this page on the server
            return <div className='row'>
                <div className='column'>
                    {tt('g.loading')}..
                </div>
            </div>;
        }
        const { generated, error, } = this.state;
        const { initialValues, username, authType, priorAuthKey, /*enable2fa*/ } = this.props;
        const { onClose, } = this.props;

        if (authType && !priorAuthKey)
            console.error('Missing priorAuthKey')

        const error2 = /Missing Owner Authority/.test(error) ?
            <span>{tt('g.this_is_wrong_password')}.</span> :
            error;

        const readOnlyAccountName = username && username.length > 0;

        return (
            <span className='ChangePassword'>
                <Formik
                    initialValues={initialValues}
                    validate={this.validate}
                    onSubmit={this._onSubmit}
                >
                {({
                    handleSubmit, isSubmitting, isValid, dirty, values, handleChange,
                }) => (
                <form
                    onSubmit={handleSubmit}
                    autoComplete='off'
                >
                    {username && <h4>{tt('g.reset_usernames_password', {username})}</h4>}
                    {authType ?
                        <p>{tt('g.this_will_update_usernames_authtype_key', {
                                username, authType
                            })}</p> :
                        <div className='ChangePassword__rules'>
                            <hr />
                            <p>
                                {tt('g.the_rules_of_APP_NAME.one', {APP_NAME})}
                                <br/>
                                {tt('g.the_rules_of_APP_NAME.second', {APP_NAME})}
                                <br/>
                                {tt('g.the_rules_of_APP_NAME.third', {APP_NAME})}
                                <br/>
                                {tt('g.the_rules_of_APP_NAME.fourth')}
                                <br/>
                                {tt('g.the_rules_of_APP_NAME.fifth')}
                                <br/>
                                {tt('g.the_rules_of_APP_NAME.sixth')}
                                <br/>
                                {tt('g.the_rules_of_APP_NAME.seventh')}
                            </p>
                        <hr />
                        </div>
                    }

                    <div>
                        <label>
                            <div className="float-right"><a target="_blank" href="https://golos.app/recover/change">{tt('g.recover_change')}</a></div>
                            {tt('g.account_name')}
                            <Field name='accountName'
                                type='text'
                                disabled={readOnlyAccountName}
                                autoComplete='off'
                                onChange={e => this.onNameChange(e, values, handleChange)}
                            />
                        </label>
                        <ErrorMessage name='accountName' component='div' className='error' />
                    </div>
                    <br />
                    <label>
                        <div className="float-right"><a target="_blank" href="https://golos.app/recover/request">{tt('g.recover_password')}</a></div>
                        {tt('g.current_password')}
                        <Field name='password'
                            type='password'
                            disabled={isSubmitting}
                        />
                    </label>
                    <ErrorMessage name='password' component='div' className='error' />

                    <br></br>

                    <label>
                        {tt('g.generated_password') + ' ' } <span className='secondary'>({tt('g.new')})</span><br />
                    </label>
                    {generated &&
                        <span>
                            <div>
                                {/* !! Do not put keys in a label, labels have an uppercase css style applied !! */}
                                <div className='overflow-ellipsis'><code style={{display: 'block', padding: '0.2rem 0.5rem', background: 'white', color: '#c7254e', wordWrap: 'break-word', fontSize: '100%', textAlign: 'center'}}>{newWif}</code></div>
                            </div>
                            <label className='ChangePassword__backup_text'>
                                {tt('g.backup_password_by_storing_it')}
                            </label>
                        </span>
                        ||
                        <center><button type='button' className='button hollow' onClick={this.generateWif}>{tt('g.click_to_generate_password')}</button></center>
                    }

                    <br></br>

                    <label>
                        {tt('g.re_enter_generate_password')}
                        <br />
                        <Field
                            name='confirmPassword'
                            type='password'
                            disabled={isSubmitting}
                        />
                    </label>
                    <ErrorMessage name='confirmPassword' component='div' className='error' />

                    <br />

                    <label><Field name='confirmCheck'
                        type='checkbox'
                    />{tt('g.understand_that_APP_NAME_cannot_recover_password', {APP_NAME: 'GOLOS'})}.</label>
                    <ErrorMessage name='confirmCheck' component='div' className='error' />

                    <label><Field name='confirmSaved'
                        type='checkbox'
                    />{tt('g.i_saved_password')}.</label>
                    <ErrorMessage name='confirmSaved' component='div' className='error' />
                    <br />

                    {isSubmitting && <div><LoadingIndicator type='circle' /></div>}
                    {!isSubmitting && <div>
                        <div className='error'>{error2}</div>
                        <button type='submit' className='button' disabled={isSubmitting || !isValid || !dirty}>
                            {tt('g.update_password')}
                        </button>
                        {onClose && <button type='button' disabled={isSubmitting} className='button hollow float-right' onClick={onClose}>
                            {tt('g.cancel')}
                        </button>}
                    </div>}
                </form>
                )}</Formik>
            </span>
        )
    }
}

let newWif = null

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        const {authType} = ownProps
        const enable2fa = authType == null
        return {
            ...ownProps, enable2fa,
            initialValues: {
                accountName: ownProps.username,
                twofa: false,
                password: ownProps.defaultPassword,
                confirmPassword: '',
                confirmCheck: false,
                confirmSaved: false,
            },
        }
    },
    // mapDispatchToProps
    dispatch => ({
        changePassword: (
            accountName, authType, priorAuthKey, password, twofa = false,
            success, error
        ) => {
            const ph = role => PrivateKey.fromSeed(`${accountName}${role}${newWif}`).toWif()
            const auths = authType ?
                [
                    {authType, oldAuth: priorAuthKey, newAuth: newWif}
                ] :
                [
                    {authType: 'owner', oldAuth: password, newAuth: ph('owner', newWif)},
                    {authType: 'active', oldAuth: password, newAuth: ph('active', newWif)},
                    {authType: 'posting', oldAuth: password, newAuth: ph('posting', newWif)},
                    {authType: 'memo', oldAuth: password, newAuth: ph('memo', newWif)},
                ];
            const keyFile = new KeyFile(accountName, {
                password: newWif,
                owner: auths[0].newAuth, active: auths[1].newAuth,
                posting: auths[2].newAuth, memo: auths[3].newAuth,
            });
            dispatch(transaction.actions.updateAuthorities({
                twofa,
                // signingKey provides the password if it was not provided in auths
                signingKey: authType ? password : null,
                accountName, auths,
                onSuccess: () => {
                    keyFile.save();
                    success();
                }, onError: error,
                // notifySuccess: 'Change password success'
            }))
        },
        notify: (message) => {
            dispatch({type: 'ADD_NOTIFICATION', payload: {
                key: 'chpwd_' + Date.now(),
                message,
                dismissAfter: 5000}
            });
        },
    })
)(ChangePassword)
