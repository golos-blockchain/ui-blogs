import React from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import golos from 'golos-lib-js';
import tt from 'counterpart';
import reactForm from 'app/utils/ReactForm';
import transaction from 'app/redux/Transaction';
import { validate_account_name } from 'app/utils/ChainValidation';
import { formatAmount } from 'app/utils/ParsersAndFormatters';
import { vestsToSteem, steemToVests } from 'app/utils/StateFunctions';
import { LIQUID_TICKER } from 'app/client_config';
import Icon from 'app/components/elements/Icon';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';

function calcMaxInterest(cprops) {
    let maxInterestRate = 100;
    if (cprops) {
        maxInterestRate = Math.min(90, cprops.get('max_delegated_vesting_interest_rate') / 100);
    }
    return maxInterestRate;
}

function calcDefaultInterest(cprops) {
    return Math.min(50, calcMaxInterest(cprops));
}

class DelegateVestingShares extends React.Component {

    static propTypes = {
        currentAccount: PropTypes.object.isRequired
    }

    constructor(props) {
        super(props)
        this.initForm(props)
    }

    componentDidMount() {
        setTimeout(() => {
            ReactDOM.findDOMNode(this.refs.to).focus()
        }, 300)
    }

    initForm(props) {
        const fields = [ 'to', 'amount', 'emissionInterest:checked', 'interestRate' ]

        const insufficientFunds = (amount) => {
            const { gprops, currentAccount } = this.props
            const balance = vestsToSteem(currentAccount.get('vesting_shares'), gprops)
            return parseFloat(amount) > parseFloat(balance)
        }

        const interestLimit = (interestRate) => {
            const { cprops } = this.props;
            return parseFloat(interestRate) > calcMaxInterest(cprops);
        }

        reactForm({
            name: 'delegate_vesting',
            instance: this, fields,
            initialValues: props.initialValues,

            validation: values => ({
                to:
                    !values.to
                        ? tt('g.required')
                        : validate_account_name(values.to),
                amount:
                    !values.amount
                        ? tt('g.required') 
                        : !/^[0-9]*\.?[0-9]*/.test(values.amount) 
                            ? tt('transfer_jsx.amount_is_in_form')
                            : insufficientFunds(values.amount)
                                ? tt('transfer_jsx.insufficient_funds')
                                : null,
                interestRate:
                    interestLimit(values.interestRate)
                        ? tt('delegatevestingshares_jsx.too_large_percent')
                        : null,
                emissionInterest: null,
            })
        })
    }

    balanceValue = () => {
        const { gprops, currentAccount } = this.props
        return vestsToSteem(currentAccount.get('vesting_shares'), gprops)
    }

    assetBalanceClick = e => {
        e.preventDefault()
        this.state.amount.props.onChange(this.balanceValue())
    }

    clearError = () => { this.setState({ trxError: undefined }) }

    successCallback = () => {
        if (this.props.onClose) this.props.onClose();
        this.setState({ loading: false, });
    };

    errorCallback = estr => {
        this.setState({ trxError: estr, loading: false, });
    };

    onChangeTo = async (e) => {
        const { currentAccount, cprops, gprops, } = this.props;
        let { value } = e.target;
        value = value.toLowerCase().trim();
        this.state.to.props.onChange(value);
        if (!validate_account_name(value)) {
            this.setState({
                vdoLoading: true,
            });
            let delegations = null;
            try {
                delegations = await golos.api.getVestingDelegationsAsync(currentAccount.get('name'), value, 1, 'delegated');
            } catch (error) {
                console.error('getVestingDelegationsAsync', error);
            }
            if (delegations && delegations[0] && delegations[0].delegatee === value) {
                const vdo = delegations[0]

                let amount = vdo.vesting_shares
                amount = vestsToSteem(amount, gprops);
                this.state.amount.props.onChange(amount);

                let interestRate = vdo.interest_rate / 100;
                this.state.interestRate.props.onChange(vdo.is_emission ? '0' : interestRate.toString());

                this.state.emissionInterest.props.onChange(vdo.is_emission)

                this.setState({
                    vdoLoading: false,
                    vdoExists: amount.toString(),
                });
            } else {
                this.state.amount.props.onChange('');
                this.state.interestRate.props.onChange(calcDefaultInterest(cprops));

                this.setState({
                    vdoLoading: false,
                    vdoExists: false,
                });
            }
        } else {
            this.setState({
                vdoLoading: false,
                vdoExists: false,
            });
        }
    };

    onChangeAmount = (e) => {
        const { value } = e.target;
        this.state.amount.props.onChange(formatAmount(value));
    };

    onChangeInterestRate = (e) => {
        let { value } = e.target;
        value = formatAmount(value);
        if (!value) value = '0';
        this.state.interestRate.props.onChange(value);
    };

    onChangeEmissionInterest = (e) => {
        this.state.interestRate.props.onChange('0');
        this.state.emissionInterest.props.onChange(e.target.checked)
    }

    onClickRevoke = (e) => {
        e.preventDefault();
        const { dispatchSubmit, gprops, currentAccount, } = this.props;

        dispatchSubmit({
            to: this.state.to.props.value,
            amount: '0',
            interestRate: this.state.interestRate.props.value,
            emissionInterest: this.state.emissionInterest.props.checked,
            errorCallback: this.errorCallback, successCallback: this.successCallback,
            gprops, currentAccount })
    };

    render() {
        const { gprops, cprops, currentAccount, dispatchSubmit, } = this.props;
        const { to, amount, interestRate, emissionInterest, loading, trxError, vdoLoading, vdoExists, } = this.state;
        const { submitting, valid, handleSubmit, } = this.state.delegate_vesting;

        const VESTING_TOKEN2 = tt('token_names.VESTING_TOKEN2')

        let maxInterestRate = calcMaxInterest(cprops);

        const form = (
            <form 
                onSubmit={handleSubmit(({ data }) => {
                    this.setState({ loading: true })
                    const success = () => {
                        if(this.props.onClose) this.props.onClose()
                        this.setState({ loading: false })
                    }
                    dispatchSubmit({ ...data, errorCallback: this.errorCallback, successCallback: this.successCallback,
                        gprops, currentAccount, })
                })}
                onChange={this.clearError}
            >
                <div className='row'>
                    <div className='column small-2' style={{paddingTop: 5}}>{tt('g.from')}</div>
                    <div className='column small-10'>
                        <div className='input-group' style={{marginBottom: '1.25rem'}}>
                            <span className='input-group-label'>@</span>
                            <input
                                className='input-group-field bold'
                                type='text'
                                disabled
                                value={currentAccount.get('name')}
                            />
                        </div>
                    </div>
                </div>

                <div className='row'>
                    <div className='column small-2' style={{paddingTop: 5}}>{tt('g.to')}</div>
                    <div className='column small-10'>
                        <div className='input-group' style={{marginBottom: '1.25rem'}}>
                            <span className='input-group-label'>@</span>
                            <input
                                className='input-group-field'
                                {...to.props}
                                ref='to'
                                type='text'
                                placeholder={tt('transfer_jsx.send_to_account')}
                                onChange={this.onChangeTo}
                                autoComplete='off'
                                autoCorrect='off'
                                autoCapitalize='off'
                                spellCheck='false'
                                disabled={loading}
                            />
                        </div>
                        {to.touched && to.blur && to.error && <div className='error'>{to.error}&nbsp;</div>}
                    </div>
                </div>

                {vdoLoading && <span><LoadingIndicator type='circle' /><br /></span>}

                {vdoExists && <div className='row' style={{ marginBottom: '1.55rem', }}>
                    <div className='column small-12'>
                        {tt('delegatevestingshares_jsx.vdo_exists')}
                    </div>
                </div>}

                {!vdoLoading && <div className='row'>
                    <div className='column small-2' style={{paddingTop: 5}}>{tt('g.amount')}</div>
                    <div className='column small-10'>
                        <div className='input-group' style={{marginBottom: '0.25rem'}}>
                            <input type='text'
                                {...amount.props}
                                placeholder={tt('g.amount')}
                                ref='amount'
                                onChange={this.onChangeAmount}
                                autoComplete='off'
                                autoCorrect='off'
                                autoCapitalize='off'
                                spellCheck='false'
                                disabled={loading}
                            />
                            <span className='input-group-label uppercase'>{LIQUID_TICKER}</span>
                        </div>

                        <div style={{marginBottom: '1.5rem'}}>
                            <AssetBalance
                                balanceValue={`${this.balanceValue()} ${LIQUID_TICKER}`}
                                onClick={this.assetBalanceClick}
                                title={tt('transfer_jsx.balance')}
                            />
                        </div>

                      {(amount.touched && amount.error)
                          ?
                            <div className='error'>
                              {amount.touched && amount.error && amount.error}&nbsp;
                            </div>
                          :
                            null
                      }
                    </div>
                </div>}

                {!vdoLoading && <div className="row">
                    <div className="column small-10">
                        <div className="input-group" style={{marginBottom: "1.25rem"}}>
                            <label>
                                <input
                                    className="input-group-field bold"
                                    type="checkbox"
                                    {...emissionInterest.props} onChange={(e) => this.onChangeEmissionInterest(e)}
                                    disabled={vdoExists}
                                />
                                {tt('delegatevestingshares_jsx.emission_interest')}
                            </label>
                        </div>
                        {emissionInterest.touched && emissionInterest.blur && emissionInterest.error &&
                            <div className="error">{emissionInterest.error}&nbsp;</div>
                        }
                    </div>
                </div>}

                {!vdoLoading && <div className='row'>
                    <div className='column small-12'>
                        {tt('delegatevestingshares_jsx.interest')}
                        {maxInterestRate < 100 && <span style={{ paddingLeft: '5px' }}>({tt('g.no_more_than')} <b>{maxInterestRate}%</b>)</span>}
                        &nbsp;
                        <Icon name='info_o' title={tt('delegatevestingshares_jsx.interest_hint')} />
                    </div>
                    <div className='column small-12'>
                        <div className='input-group' style={{marginBottom: '1.25rem'}}>
                            <input type='text'
                                className='input-group-field'
                                {...interestRate.props}
                                ref='interestRate'
                                onChange={this.onChangeInterestRate}
                                autoComplete='off'
                                autoCorrect='off'
                                autoCapitalize='off'
                                spellCheck='false'
                                disabled={loading || vdoExists || emissionInterest.props.checked}
                            />
                        </div>
                        {interestRate.touched && interestRate.blur && interestRate.error && <div className='error'>{interestRate.error}&nbsp;</div>}
                    </div>
                </div>}

                {!vdoLoading && loading && <span><LoadingIndicator type='circle' /><br /></span>}
                {!vdoLoading && !loading && <span>
                    {trxError && <div className='error'>{trxError}</div>}
                    <button type='submit' disabled={submitting || !valid} className='button'>
                        {tt(vdoExists ? 'delegatevestingshares_jsx.edit' : 'delegatevestingshares_jsx.delegate')}
                    </button>
                    {vdoExists ? <button onClick={this.onClickRevoke} disabled={submitting} className='button alert' style={{ color: 'white', }}>
                        {tt('delegatevestingshares_jsx.revoke')}
                    </button> : null}
                </span>}
            </form>
        )

        return (
            <div>
                <div className='row'>
                    <h3>{tt('delegatevestingshares_jsx.form_title', {VESTING_TOKEN2})}</h3>
                </div>
                {form}
            </div>
        )
    }
}

const AssetBalance = ({onClick, balanceValue, title}) =>
    <a onClick={onClick} style={{borderBottom: '#A09F9F 1px dotted', cursor: 'pointer'}}>{title + ': ' + balanceValue}</a>

export default connect(

    (state, ownProps) => {
        const currentUser = state.user.getIn(['current'])
        const currentAccount = state.global.getIn(['accounts', currentUser.get('username')])
        const gprops = state.global.get('props').toJS()
        const cprops = state.global.get('cprops');

        let interestRate = calcDefaultInterest(cprops);

        const initialValues = { to: null, interestRate, emissionInterest: false }

        return {
            ...ownProps,
            initialValues,
            currentAccount,
            gprops,
            cprops,
        }
    },

    dispatch => ({
        dispatchSubmit: ({ to, amount, interestRate, emissionInterest, errorCallback, successCallback, gprops, currentAccount }) => {
            const delegator = currentAccount.get('name');
            const delegatee = to;
            const vestingShares = `${steemToVests(amount, gprops)} GESTS`;

            const success = () => {
                dispatch({ type: 'FETCH_STATE', payload: { pathname: `@${delegator}/transfers` } });
                successCallback();
            };

            let __config = undefined;
            let confirm = undefined;
            if (parseFloat(amount) === 0) {
                confirm = tt(
                    'delegate_vesting_shares_info_jsx.confirm_cancel_delegation',
                    { VESTING_TOKEN2: tt('token_names.VESTING_TOKEN2'), delegatee },
                );
                __config = { title: tt('delegate_vesting_shares_info_jsx.confirm_title', { VESTING_TOKENS: tt('token_names.VESTING_TOKENS') }), };
            }

            let extensions =[]
            if (emissionInterest) {
                extensions.push([0,
                {
                    is_emission: true
                }])
                interestRate = 100
            }

            dispatch(transaction.actions.broadcastOperation({
                type: 'delegate_vesting_shares_with_interest',
                operation: {
                    delegator,
                    delegatee,
                    vesting_shares: vestingShares,
                    interest_rate: Math.trunc(interestRate * 100),
                    extensions,
                    __config,
                },
                confirm,
                successCallback: success,
                errorCallback,
            }));
        },
    })

)(DelegateVestingShares)
