import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { VKIcon, FacebookIcon, MailruIcon } from 'react-share';
import tt from 'counterpart';
import cn from 'classnames';
import { api } from 'golos-classic-js';
import { PrivateKey } from 'golos-classic-js/lib/auth/ecc';
import LoadingIndicator from '@elements/LoadingIndicator';
import Icon from 'app/components/elements/Icon';
import Tooltip from 'app/components/elements/Tooltip';
import user from 'app/redux/User';
import { validate_account_name } from 'app/utils/ChainValidation';
import { formatAsset } from 'app/utils/ParsersAndFormatters';
import runTests from 'app/utils/BrowserTests';
import g from 'app/redux/GlobalReducer';
import GeneratedPasswordInput from '@elements/GeneratedPasswordInput';
import { APP_DOMAIN, SUPPORT_EMAIL } from 'app/client_config';
import { jsPDF } from 'jspdf';

class CreateAccount extends React.Component {
    static propTypes = {
        loginUser: PropTypes.func.isRequired,
        serverBusy: PropTypes.bool,
    };

    state = {
        fetchState: {
            checking: false,
            success: false,
            status: '',
            message: '',
            showCheckInfo: false,
        },
        fetchCounter: 0,
        phone: '',
        country: 7,
        name: '',
        email: '',
        invite_code: '',
        invite_enabled: false,
        code: '',
        password: '',
        passwordValid: '',
        nameError: '',
        emailHint: '',
        emailError: '',
        inviteHint: '',
        inviteError: '',
        codeError: '',
        codeHint: '',
        serverError: '',
        loading: false,
        cryptographyFailure: false,
        showRules: false,
        allBoxChecked: false,
        iSent: false,
        showHowMuchHelp: false,
    };

    componentDidMount() {
        const cryptoTestResult = runTests();
        if (cryptoTestResult !== undefined) {
            console.error(
                'CreateAccount - cryptoTestResult: ',
                cryptoTestResult
            );
            this.setState({ cryptographyFailure: true });
        }
    }

    componentWillUnmount() {
        clearTimeout(this._timeoutId);
        clearTimeout(this._waitTimeout);
    }

    useSocialLogin = (socName) => {
        let fetchState = {
            checking: true,
            success: true,
            status: 'done',
            message: (<div>
                {tt('createaccount_jsx.authorized_with_') + socName + '.'}
                {this._renderSocialButtons()}
            </div>),
            showCheckInfo: false,
        };
        this.setState({ fetchState, email: '', invite_enabled: false });
    };

    useVk = (e) => {
        e.preventDefault();
        this.setState({
            authType: 'ВКонтакте'
        });
        window.open('/api/v1/auth/vk', '_blank');
        this.useSocialLogin(this.state.authType);
    };

    useFacebook = (e) => {
        e.preventDefault();
        this.setState({
            authType: 'Facebook'
        });
        window.open('/api/v1/auth/facebook', '_blank');
        this.useSocialLogin(this.state.authType);
    };

    useMailru = (e) => {
        e.preventDefault();
        this.setState({
            authType: 'Mail.Ru'
        });
        window.open('/api/v1/auth/mailru', '_blank');
        this.useSocialLogin(this.state.authType);
    };

    useYandex = (e) => {
        e.preventDefault();
        this.setState({
            authType: 'Яндекс'
        });
        window.open('/api/v1/auth/yandex', '_blank');
        this.useSocialLogin(this.state.authType);
    };

    render() {
        if (!process.env.BROWSER) {
            return (
                <div className="row">
                    <div className="column">{tt('g.loading')}...</div>
                </div>
            );
        }

        const { loggedIn, offchainUser, serverBusy } = this.props;
        const {
            fetchState,
            phone,
            country,
            email,
            invite_code,
            invite_enabled,
            name,
            passwordValid,
            nameError,
            emailHint,
            emailError,
            inviteHint,
            inviteError,
            serverError,
            loading,
            cryptographyFailure,
            allBoxChecked,
        } = this.state;

        if (serverBusy || $STM_Config.disable_signups) {
            return this._renderInvitationError();
        }

        if (cryptographyFailure) {
            return this._renderCryptoFailure();
        }

        if (loggedIn) {
            return this._renderLoggedWarning();
        }

        if (offchainUser && offchainUser.get('account')) {
            return this._renderExistingUserAccount(offchainUser.get('account'));
        }

        let phoneStep = null;
        let showMailForm =
            fetchState.status !== 'waiting' && fetchState.status !== 'done';

        if (fetchState.status === 'waiting') {
            phoneStep = this._renderCodeWaiting();
        } else if (fetchState.message) {
            phoneStep = (
                <div
                    className={cn('callout', {
                        success: fetchState.success,
                        alert: !fetchState.success,
                    })}
                >
                    {fetchState.message}
                </div>
            );
        }

        let nextStep = null;

        if (serverError) {
            if (serverError === 'Email address is not confirmed') {
                nextStep = (
                    <div className="callout alert">
                        <a href="/enter_email">{tt('tips_js.confirm_email')}</a>
                    </div>
                );
            } else if (serverError === 'Phone number is not confirmed') {
                nextStep = (
                    <div className="callout alert">
                        <a href="/enter_mobile">
                            {tt('tips_js.confirm_phone')}
                        </a>
                    </div>
                );
            } else {
                nextStep = (
                    <div className="callout alert">
                        <strong>
                            {tt(
                                'createaccount_jsx.couldnt_create_account_server_returned_error'
                            )}:
                        </strong>
                        <p>{serverError}</p>
                    </div>
                );
            }
        }

        const okStatus = fetchState.checking && fetchState.success;

        const submitDisabled =
            loading ||
            !name ||
            nameError ||
            inviteError ||
            !passwordValid ||
            !allBoxChecked ||
            !okStatus;

        const disableGetCode = okStatus || !emailHint;
        const disableContinueInvite = !inviteHint;

        return (
            <div>
                <div className="CreateAccount row">
                    <div
                        className="column"
                        style={{ maxWidth: '36rem', margin: '0 auto' }}
                    >
                        <h2>{tt('g.sign_up')}</h2>
                        <p className="CreateAccount__account-name-hint">
                            <Icon name="info_o" /> Возникли сложности? Напишите в <a target="_blank" href="https://t.me/goloshelp">телеграм-чат</a> или на <a href="mailto:info@golos.id">info@golos.id</a>
                        </p>
                        <hr />
                        <form
                            onSubmit={this._onSubmit}
                            autoComplete="off"
                            noValidate
                            method="post"
                        >
                            {(showMailForm || invite_enabled) && (
                                <div>
                                    {showMailForm && <div>
                                        <a onClick={this.onInviteEnabledChange}>{tt(invite_enabled ? 'createaccount_jsx.i_have_not_invite_code' : 'createaccount_jsx.i_have_invite_code')}
                                        </a>
                                    </div>}
                                    {invite_enabled && <div>
                                        <label>
                                            {this._renderInviteCodeField(true)}
                                        </label>
                                    </div>}
                                    {!invite_enabled && <div>
                                        <label>
                                            <span style={{ color: 'red' }}>
                                                *
                                            </span>{' '}
                                            {'Введите вашу gmail.com почту'} (создать её можно <a target="_blank" href="https://accounts.google.com/signup/v2/webcreateaccount?hl=ru&flowName=GlifWebSignIn&flowEntry=SignUp">по ссылке</a>) 
                                            <input
                                                type="text"
                                                name="email"
                                                autoComplete="off"
                                                disabled={fetchState.checking}
                                                onChange={this.onEmailChange}
                                                value={email}
                                            />
                                            <div
                                                className={cn({
                                                    error: emailError,
                                                    success: emailHint,
                                                })}
                                            >
                                                <p>{emailError || emailHint}</p>
                                            </div>
                                        </label>
                                    </div>}
                                    {this._renderSocialButtons()}
                                </div>
                            )}
                            {phoneStep}
                            {showMailForm && !invite_enabled && (
                                <div>
                                    <p>
                                        <a
                                            className={cn('button', {
                                                disabled: disableGetCode,
                                            })}
                                            onClick={
                                                !disableGetCode
                                                    ? this.onClickSendCode
                                                    : null
                                            }
                                        >
                                            {tt('g.continue')}
                                        </a>
                                    </p>
                                </div>
                            )}
                            {showMailForm && invite_enabled && (
                                <div>
                                    <p>
                                        <a
                                            className={cn('button', {
                                                disabled: disableContinueInvite,
                                            })}
                                            onClick={
                                                !disableContinueInvite
                                                    ? this.onClickContinueInvite
                                                    : null
                                            }
                                        >
                                            {tt('g.continue')}
                                        </a>
                                    </p>
                                </div>
                            )}
                            {fetchState.showCheckInfo
                                ? this._renderCheckInfo()
                                : null}

                            <div className={nameError ? 'error' : ''}>
                                <label>
                                    {tt('createaccount_jsx.enter_account_name')}

                                    <div className="input-group">
                                        <input
                                            className="input-group-field"
                                            type="text"
                                            name="name"
                                            autoComplete="off"
                                            disabled={!okStatus}
                                            onChange={this.onNameChange}
                                            value={name}
                                        />
                                    </div>

                                    <div className="CreateAccount__account-name-hint">
                                        {tt(
                                            'createaccount_jsx.account_name_hint'
                                        )}
                                    </div>
                                </label>
                                <p>{nameError}</p>
                            </div>
                            <GeneratedPasswordInput
                                onChange={this.onPasswordChange}
                                disabled={!okStatus || loading}
                                showPasswordString={
                                    name.length > 0 && !nameError
                                }
                            />
                            <br />
                            {nextStep}
                            <noscript>
                                <div className="callout alert">
                                    <p>
                                        {tt(
                                            'createaccount_jsx.form_requires_javascript_to_be_enabled'
                                        )}
                                    </p>
                                </div>
                            </noscript>
                            {loading && <LoadingIndicator type="circle" />}
                            <button
                                disabled={submitDisabled}
                                className={cn('button action uppercase', {
                                    disabled: submitDisabled,
                                })}
                            >
                                {tt('createaccount_jsx.create_account')}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    _renderExistingUserAccount(existingUserAccount) {
        const APP_NAME = tt('g.APP_NAME');

        return (
            <div className="row">
                <div className="column">
                    <div className="callout alert">
                        <p>
                            {tt(
                                'createaccount_jsx.our_records_indicate_you_already_have_account',
                                { APP_NAME }
                            )}: <strong>{existingUserAccount}</strong>
                        </p>
                        <p>
                            {tt(
                                'createaccount_jsx.in_order_to_prevent_abuse_APP_NAME_can_only_register_one_account_per_user',
                                { APP_NAME }
                            )}
                        </p>
                        <p>
                            {tt(
                                'createaccount_jsx.next_3_blocks.you_can_either'
                            ) + ' '}
                            <a href="/login.html">{tt('g.login')}</a>
                            {tt(
                                'createaccount_jsx.next_3_blocks.to_your_existing_account_or'
                            ) + ' '}
                            <a href={'mailto:' + SUPPORT_EMAIL}>
                                {tt('createaccount_jsx.send_us_email')}
                            </a>
                            {' ' +
                                tt(
                                    'createaccount_jsx.next_3_blocks.if_you_need_a_new_account'
                                )}.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    _renderCodeWaiting() {
        const { country, codeError, codeHint, fetchState, iSent, showHowMuchHelp } = this.state;

        return (
            <div className="callout">
                <div className="CreateAccount__send-sms-block">
                    {'Введите проверочный код отправленный на вашу почту'}
                    <input
                        type="email"
                        name="email"
                        autoComplete="off"
                        onChange={this.onCodeChange}
                    />
                </div>
                <div>{tt('mobilevalidation_js.waiting_from_you_line_2')}</div>


                <p>
                    <small>
                        {tt('mobilevalidation_js.you_can_change_your_number') +
                            ' '}
                        <a onClick={this.onClickSelectAnotherPhone}>
                            {tt('mobilevalidation_js.select_another_number')}
                        </a>.
                    </small>
                </p>


                <div className={cn({ error: codeError, success: codeHint })}>
                    <p>{codeError || codeHint}</p>
                </div>

                <a
                    className={cn('button', {
                        disabled: false,
                    })}
                    onClick={this.onCheckCode}
                >
                    {tt('g.continue')}
                </a>
            </div>
        );
    }

    _renderInvitationError() {
        return (
            <div className="row">
                <div className="column">
                    <div className="callout alert">
                        <p>Registration is disabled for a while. </p>
                    </div>
                </div>
            </div>
        );
    }

    _renderLoggedWarning() {
        const APP_NAME = tt('g.APP_NAME');

        return (
            <div className="row">
                <div className="column">
                    <div className="callout alert">
                        <p>
                            {tt('createaccount_jsx.you_need_to')}
                            <a href="#" onClick={this._onLogoutClick}>
                                {tt('g.logout')}
                            </a>
                            {tt('createaccount_jsx.before_creating_account')}
                        </p>
                        <p>
                            {tt(
                                'createaccount_jsx.APP_NAME_can_only_register_one_account_per_verified_user',
                                { APP_NAME }
                            )}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    _renderCryptoFailure() {
        const APP_NAME = tt('g.APP_NAME');

        return (
            <div className="row">
                <div className="column">
                    <div className="callout alert">
                        <h4>
                            {tt('createaccount_jsx.ctyptography_test_failed')}
                        </h4>
                        <p>
                            {tt(
                                'createaccount_jsx.we_will_be_unable_to_create_account_with_this_browser',
                                { APP_NAME }
                            )}.
                        </p>
                        <p>
                            {tt('loginform_jsx.the_latest_versions_of') + ' '}
                            <a href="https://www.google.com/chrome/">Chrome</a>
                            {' ' + tt('g.and')}
                            <a href="https://www.mozilla.org/en-US/firefox/new/">
                                Firefox
                            </a>
                            {' ' +
                                tt(
                                    'loginform_jsx.are_well_tested_and_known_to_work_with',
                                    { APP_DOMAIN }
                                )}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    _renderCheckInfo() {
        return (
            <p className="CreateAccount__check-info">
                {tt('createaccount_jsx.check_code')}{' '}
                <a href={'mailto:' + SUPPORT_EMAIL}>{SUPPORT_EMAIL}</a>.
            </p>
        );
    }

    _renderSocialButtons() {
        return (
            <div>
                {!this.state.authType && tt('createaccount_jsx.or_use_socsite')}<br/>
                <Tooltip t='VK'>
                    <VKIcon onClick={this.useVk} style={{cursor: 'pointer', marginRight: '5px'}} size={32} />
                </Tooltip>
                <Tooltip t='Facebook'>
                    <FacebookIcon onClick={this.useFacebook} style={{cursor: 'pointer', marginRight: '5px'}} size={32} />
                </Tooltip>
                <Tooltip t='Mail.Ru'>
                    <MailruIcon onClick={this.useMailru} style={{cursor: 'pointer', marginRight: '5px'}} size={32} />
                </Tooltip>
                <Tooltip t='Yandex'>
                    <span onClick={this.useYandex} style={{cursor: 'pointer', marginRight: '5px', color: 'white' }}>
                        <img src='/images/yandex.png' style={{ verticalAlign: 'top', paddingTop: '4px' }} />
                    </span>
                </Tooltip>
            </div>
        );
    }

    _renderInviteCodeField = (required) => {
        const {
            fetchState,
            invite_code,
            inviteHint,
            inviteError,
        } = this.state;
        return (
            <div>
                {required ? (<span style={{ color: 'red' }}>
                    *
                </span>) : null}
                {required ? ' ' : null}
                {tt(required ? 'createaccount_jsx.enter_invite_code' : 'createaccount_jsx.enter_invite_code_optional')}
                <input
                    type="text"
                    name="invite_code"
                    autoComplete="off"
                    disabled={required ? fetchState.checking : false}
                    onChange={this.onInviteCodeChange}
                    value={invite_code}
                />
                <div
                    className={cn({
                        error: inviteError,
                        success: inviteHint,
                    })}
                >
                    <p>{inviteError || inviteHint}</p>
                </div>
            </div>
        );
    }

    _onHowMuchClick = () => {
        this.setState({
            showHowMuchHelp: !this.state.showHowMuchHelp,
        });
    };

    _onISendClick = () => {
        this.setState({
            iSent: true,
        });
    };

    createPdf = (username, privateKeys) => {
        this.keysPDFFileName = 'keys-' + username + '.pdf';
        this.keysPDF = new jsPDF();
        let pdf = this.keysPDF;

        /*"pdf_title": "Ключи от аккаунта @",
        "pdf_desc": "Это приватные ключи, которые дают доступ к вашему аккаунту. Храните этот файл в надежном месте.",
        "pdf_password_desc": "Пароль (используйте для входа на форум): ",
        "pdf_posting_desc": "Posting-ключ (также подходит в качестве пароля на форуме): ",
        "pdf_active_desc": "Active-ключ: ",
        "pdf_owner_desc": "Owner-ключ: ",
        "pdf_memo_desc": "Memo-ключ: "*/

        pdf.setFontSize(28);
        pdf.text(10, 20, tt('createaccount_jsx.pdf_title') + username);

        pdf.setFontSize(10);
        pdf.text(10, 30, tt('createaccount_jsx.pdf_desc'));

        pdf.setFontSize(12);
        pdf.text(10, 40, tt('createaccount_jsx.pdf_password_desc'));
        pdf.text(10, 45, privateKeys.password);

        pdf.text(10, 55, tt('createaccount_jsx.pdf_posting_desc'));
        pdf.text(10, 60, privateKeys.posting);

        pdf.text(10, 70, tt('createaccount_jsx.pdf_active_desc'));
        pdf.text(10, 75, privateKeys.active);

        pdf.text(10, 85, tt('createaccount_jsx.pdf_owner_desc'));
        pdf.text(10, 90, privateKeys.owner);

        pdf.text(10, 100, tt('createaccount_jsx.pdf_memo_desc'));
        pdf.text(10, 105, privateKeys.memo);
    };

    _onSubmit = async e => {
        e.preventDefault();
        this.setState({ serverError: '', loading: true });
        const { email, invite_code, name, password, passwordValid } = this.state;
        if (!name || !password || !passwordValid) return;

        let publicKeys;
        let privateKeys = {};
        try {
            const pk = PrivateKey.fromWif(password);
            publicKeys = ['owner', 'active', 'posting', 'memo'].map(role => {
                const priv = pk;
                privateKeys[role] = priv.toString();
                return priv.toPublicKey().toString();
            });
        } catch (err) {
            publicKeys = ['owner', 'active', 'posting', 'memo'].map(role => {
                const priv = PrivateKey.fromSeed(`${name}${role}${password}`);
                privateKeys[role] = priv.toString();
                return priv.toPublicKey().toString();
            });
        }

        this.createPdf(name, {password, ...privateKeys});

        try {
            // createAccount
            const res = await callApi('/api/v1/accounts', {
                csrf: $STM_csrf,
                email: email != '' ? email : undefined,
                invite_code: email == '' ? invite_code : undefined,
                name,
                owner_key: publicKeys[0],
                active_key: publicKeys[1],
                posting_key: publicKeys[2],
                memo_key: publicKeys[3],
                referrer: new URLSearchParams(window.location.search).get('invite')
            });

            const data = await res.json();

            if (data.error || data.status !== 'ok') {
                console.error('CreateAccount server error', data.error);
                this.setState({
                    serverError: data.error || tt('g.unknown'),
                    loading: false,
                });
            } else {
                this.keysPDF.save(this.keysPDFFileName);
                window.location = `/login.html#account=${name}&msg=accountcreated`;
            }
        } catch (err) {
            console.error('Caught CreateAccount server error', err);
            this.setState({
                serverError: err.message ? err.message : err,
                loading: false,
            });
        }
    };

    onPasswordChange = (password, passwordValid, allBoxChecked) => {
        this.setState({ password, passwordValid, allBoxChecked });
    };

    onCodeChange = e => {
        const code = e.target.value.trim().toLowerCase();
        this.setState({ code });
    };

    onCountryChange = e => {
        const country = e.target.value.trim().toLowerCase();
        const emailHint = this.state.phone.length
            ? tt('createaccount_jsx.will_be_send_to_phone_number') +
              country +
              this.state.phone
            : '';
        this.setState({ country, emailHint });
    };

    validateEmail = (value, isFinal) => {
        let emailError = null;
        let emailHint = null;

        // TODO добавить перевод для подсказки для google email
        if (!value) {
            emailError = 'Google email не может быть пустым';
        } else if (!/^[a-z0-9](\.?[a-z0-9]){5,}@g(oogle)?mail\.com$/.test(value)) {
            // TODO добавить перевод для подсказки для google email
            //emailError = tt('mobilevalidation_js.have_only_digits');
            emailError = 'Email должен принадлежать Google Mail (gmail.com)';
        }

        if (emailError) {
            emailError =
                '' + emailError;
        } else {
            emailHint = 'Google email: ' + value;
        }

        this.setState({ emailError, emailHint });
    };

    validateInviteCode = async (value, isFinal) => {
        let inviteError = null;
        let inviteHint = null;

        if (!value) {
            if (this.state.invite_enabled) inviteError = tt('createaccount_jsx.invite_secret_cannot_be_empty');
        } else {
            let pk;
            try {
                pk = PrivateKey.fromWif(value);
            } catch (e) {
                inviteError = tt('invites_jsx.claim_wrong_secret');
            }
            if (pk) try {
                const res = await api.getInvite(pk.toPublicKey().toString());

                if (!res) {
                    inviteError = tt(
                        'invites_jsx.claim_wrong_secret_fatal'
                    );
                } else {
                    inviteHint = tt('createaccount_jsx.invite_new_account_will_receive', {amount: formatAsset(res.balance, true, false, '')});
                }
            } catch (err) {
                inviteError = tt('invites_jsx.claim_wrong_secret_cannot_fetch');
            }
        }

        this.setState({ inviteError, inviteHint });
    };

    updateFetchingState(res) {
        const fetchState = {
            checking: false,
            success: false,
            status: res.status,
            message: '',
            showCheckInfo: false,
        };

        if (res.status !== 'waiting') {
            clearTimeout(this._waitTimeout);
        }

        switch (res.status) {
            case 'select_country':
                fetchState.message = 'Please select a country code';
                break;

            case 'provide_email':
                fetchState.message = 'Please provide a correct gmail';
                break;

            case 'already_used':
                fetchState.message = tt(
                    'createaccount_jsx.this_phone_number_has_already_been_used'
                );
                break;

            case 'session':
                fetchState.message = '';
                break;

            case 'waiting':
                //fetchState.checking = true;
                fetchState.showCheckInfo = this.state.fetchState.showCheckInfo;
                fetchState.code = res.code;
                break;

            case 'done':
                fetchState.checking = true;
                fetchState.success = true;
                fetchState.message = tt(
                    'createaccount_jsx.phone_number_has_been_verified'
                );
                break;

            case 'attempts_10':
                fetchState.checking = true;
                fetchState.message = tt('mobilevalidation_js.attempts_10');
                break;

            case 'attempts_300':
                fetchState.checking = true;
                fetchState.message = tt('mobilevalidation_js.attempts_300');
                break;

            case 'error':
                fetchState.message = res.error;
                break;

            default:
                fetchState.message = tt('g.unknown');
                break;
        }

        this.setState({ fetchState });
    }

    onClickSelectAnotherPhone = () => {
        clearTimeout(this._timeoutId);
        this.setState({ fetchState: { checking: false } });
    };

    onClickSendCode = async () => {
        const { email } = this.state;

        this.setState({
            fetchCounter: 0,
            fetchState: { checking: true },
        });

        try {
            const res = await callApi('/api/v1/send_code', {
                csrf: $STM_csrf,
                email
            });

            let data = null;

            if (res.status === 200) {
                data = await res.json();
            } else {
                let message = res.status + ' ' + await res.text();

                if (res.status === 429) {
                    message += '. Please wait a moment and try again.';
                }

                data = {
                    status: 'error',
                    error: message,
                };
            }

            this.updateFetchingState(data);
        } catch (err) {
            console.error('Caught /send_code server error', err);

            this.updateFetchingState({
                status: 'error',
                error: err.message ? err.message : err,
            });
        }
    };

    onClickContinueInvite = async () => {
        let fetchState = {
            checking: true,
            success: true,
            status: 'done',
            message: '',
            showCheckInfo: false,
        };

        const res = await callApi('/api/v1/use_invite', {
            csrf: $STM_csrf,
            invite_key: PrivateKey.fromWif(this.state.invite_code).toPublicKey().toString()
        });

        if (res.status === 200) {
            let data = await res.json();
            fetchState.success = true;
        } else {
            let message = res.status + ' ' + await res.text();

            if (res.status === 429) {
                message += '. Please wait a moment and try again.';
            }

            fetchState.status = 'error';
            fetchState.success = false;
            fetchState.message = message;
        }
        this.setState({ fetchState, email: '' });
    };

    onCheckCode = async () => {
        try {
            const res = await callApi('/api/v1/verify_code', {
                csrf: $STM_csrf,
                confirmation_code: this.state.code,
                email: this.state.email
            });

            let data;
            if (res.status === 200) {
                this.updateFetchingState({status: 'done'})
            } else {
                console.log(res.status, + res.body)
                this.setState({ codeError: res.status + ' ' + await res.text(), codeHint: '' })
            }
        } catch (err) {
            console.error('Caught /verify_code server error:', err);
            this.updateFetchingState({
                status: 'error',
                error: err.message ? err.message : err,
            });
        }
    };

    onNameChange = e => {
        const name = e.target.value.trim().toLowerCase(); // Add prefix here
        this.validateAccountName(name);
        this.setState({ name });
    };

    async validateAccountName(name) {
        let nameError = '';

        if (name.length > 0) {
            nameError = validate_account_name(name);

            if (!nameError) {
                try {
                    const res = await api.getAccountsAsync([name]);

                    if (res && res.length > 0) {
                        nameError = tt(
                            'createaccount_jsx.account_name_already_used'
                        );
                    }
                } catch (err) {
                    nameError = tt('createaccount_jsx.account-name-hint');
                }
            }
        }

        this.setState({ nameError });
    }

    onEmailChange = e => {
        // продолжаем let 
        let email = e.target.value.trim().toLowerCase()
        this.validateEmail(email)

        this.setState({
            email
        });
    };

    onInviteEnabledChange = e => {
        this.setState({
            invite_enabled: !this.state.invite_enabled
        });
    };

    onInviteCodeChange = e => {
        // продолжаем let 
        let invite_code = e.target.value.trim()
        this.validateInviteCode(invite_code)

        this.setState({
            invite_code
        });
    };

    _onLogoutClick = e => {
        e.preventDefault();
        this.props.logout();
    };
}

function callApi(apiName, data) {
    return fetch(apiName, {
        method: 'post',
        mode: 'no-cors',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-type': 'application/json',
        },
        body: JSON.stringify(data),
    });
}

module.exports = {
    path: 'create_account',
    component: connect(
        state => ({
            loggedIn: !!state.user.get('current'),
            offchainUser: state.offchain.get('user'),
            serverBusy: state.offchain.get('serverBusy'),
            suggestedPassword: state.global.get('suggestedPassword'),
        }),
        {
            loginUser: (username, password) =>
                user.actions.usernamePasswordLogin({
                    username,
                    password,
                    saveLogin: true,
                }),
            logout: () => user.actions.logout(),
        }
    )(CreateAccount),
};
