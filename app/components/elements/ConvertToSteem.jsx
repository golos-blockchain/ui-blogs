/* eslint react/prop-types: 0 */
import React from 'react'
import ReactDOM from 'react-dom';
import { connect, } from 'react-redux';
import { Formik, Field, ErrorMessage, } from 'formik';
import transaction from 'app/redux/Transaction'
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate'
import Icon from 'app/components/elements/Icon'
import TransactionError from 'app/components/elements/TransactionError'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import tt from 'counterpart';
import { DEBT_TICKER, LIQUID_TOKEN, LIQUID_TICKER } from 'app/client_config';
import { Asset } from 'golos-lib-js/lib/utils';

function floatToAsset(value, from) {
    value = parseFloat(value);
    if (isNaN(value)) {
        return Asset(0, 3, from);
    }
    value = value.toFixed(3);
    return Asset(value + ' ' + from);
}

function calcFee(value, cprops) {
    const percent = cprops ? cprops.toJS().convert_fee_percent : 0;
    const fee = value.mul(parseInt(percent)).div(10000);
    return fee;
}

class ConvertToSteem extends React.Component {
    constructor(props) {
        super()
        const { from, to } = props;
        this.state = {
            fee: Asset(0, 3, from),
            toAmount: Asset(0, 3, to),
        };
        this.amtRef = React.createRef();
    }

    componentDidMount() {
        this.amtRef.current.focus();
    }

    shouldComponentUpdate = shouldComponentUpdate(this, 'ConvertToSteem')

    validate = (values) => {
        const { maxBalance, from, cprops, } = this.props;
        const errors = {};
        if (values.amount) {
            if (isNaN(values.amount)
                || parseFloat(values.amount) <= 0) {
                errors.amount = tt('g.required');
            } else if (parseFloat(values.amount) > maxBalance) {
                errors.amount = tt('g.insufficient_balance');
            } else if (from === 'GOLOS' && !calcFee(floatToAsset(values.amount), cprops).amount) {
                errors.amount = tt('converttosteem_jsx.too_low_amount');
            }
        } else {
            errors.amount = tt('g.required');
        }
        return errors;
    };

    _onSubmit = (values, { setSubmitting, }) => {
        const { convert, owner, from, to, onClose } = this.props;
        const { amount } = values;
        const success = () => {
            if (onClose) onClose();
            setSubmitting(false);
        };
        const error = () => {
            setSubmitting(false);
        };
        convert(owner, amount, from, to, success, error);
    };

    onAmountChange = (e, values, handle) => {
        let value = e.target.value.trim().toLowerCase();
        if (isNaN(value) || parseFloat(value) < 0) {
            e.target.value = values.amount || '';
            return;
        }
        e.target.value = value;

        const { from, to, feed, cprops } = this.props;
        let fee = Asset(0, 3, from);
        let toAmount = Asset(0, 3, to);
        let { base, quote } = feed;
        base = Asset(base);
        quote = Asset(quote);
        value = floatToAsset(parseFloat(value), from);
        if (from === 'GOLOS' && cprops) {
            fee = calcFee(value, cprops);
            value.amount = value.amount - fee.amount;
        }
        if (value.symbol === base.symbol) {
            toAmount = value.mul(quote).div(base);
        } else {
            toAmount = value.mul(base).div(quote);
        }
        toAmount.symbol = to;
        this.setState({ toAmount, fee, });

        return handle(e);
    };

    render() {
        const DEBT_TOKEN = tt('token_names.DEBT_TOKEN')

        const { from, to, cprops, onClose, } = this.props
        const { fee, toAmount, } = this.state

        let feePercent = 0;
        if (cprops && from === 'GOLOS') {
            feePercent = parseFloat(cprops.get('convert_fee_percent')) / 100;
        }

        return (
            <Formik
                initialValues={{ amount: '', }}
                validate={this.validate}
                onSubmit={this._onSubmit}
            >
            {({
                handleSubmit, isSubmitting, errors, values, handleChange,
            }) => (
            <form
                onSubmit={handleSubmit}
                autoComplete='off'
            >
                <div className='row'>
                    <div className='small-12 columns'>
                        <h3>{tt('converttosteem_jsx.title_FROM_TO', {FROM: from, TO: to})}</h3>
                        <p>{tt('converttosteem_jsx.this_will_take_days')}
                            <Icon name='info_o' title={tt('converttosteem_jsx.this_will_take_days_hint')} />
                        </p>
                        <p>{tt('converttosteem_jsx.tokens_will_be_unavailable')}</p>
                    </div>
                </div>
                <div className='row'>
                    <div className='column small-2' style={{paddingTop: 5}}>{tt('g.amount')}</div>
                    <div className='column small-10' style={{marginBottom: 5}}>
                        <div className='input-group' style={{marginBottom: 5}}>
                            <Field name='amount'
                                type='text'
                                innerRef={input => this.amtRef.current = input}
                                autoComplete='off'
                                disabled={isSubmitting}
                                onChange={e => this.onAmountChange(e, values, handleChange)}
                            />
                            <span className='input-group-label' style={{paddingLeft: 0, paddingRight: 0}}>
                                <select placeholder={tt('transfer_jsx.asset')} style={{minWidth: '5rem', height: 'inherit', backgroundColor: 'transparent', border: 'none'}}>
                                    <option value={from}>{from}</option>
                                </select>
                            </span>
                        </div>
                        <ErrorMessage name='amount' component='div' className='error' />
                    </div>
                </div>
                <div className='row'>
                    <div className='small-12 columns'>
                        {feePercent ? <span>
                            {tt('converttosteem_jsx.fee')}
                            <b>
                                {fee.toString()}
                                {' '}
                                ({feePercent}%).
                            </b></span> : <span>{tt('converttosteem_jsx.no_fee')}</span>
                        }
                    </div>
                </div>
                <div className='row'>
                    <div className='small-12 columns'>
                        {tt('converttosteem_jsx.you_will_receive')}
                        <b>
                            {tt('g.approximately')}
                            {' '}
                            {toAmount.toString()}
                            .
                        </b>
                    </div>
                </div>
                <div className='row' style={{marginTop: 15}}>
                    <div className='small-12 columns'>
                        <TransactionError opType='convert' />
                        {isSubmitting && <span><LoadingIndicator type='circle' /></span>}
                        <div>
                            <button type='submit' className='button' disabled={isSubmitting || !values.amount || errors.amount}>
                                {tt('g.convert')}
                            </button>
                            <button type='button' disabled={isSubmitting} className='button hollow float-right' onMouseDown={onClose}>
                                {tt('g.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            </form>
            )}</Formik>
        )
    }
}
export default connect(
    // mapStateToProps
    (state, ownProps) => {
        const { from, to } = ownProps;
        const current = state.user.get('current');
        const username = current.get('username');
        const account = state.global.getIn(['accounts', username]);
        const balance = account.get('balance');
        const sbd_balance = account.get('sbd_balance');
        const cprops = state.global.get('cprops');
        const max = parseFloat(Asset(from === DEBT_TICKER ? sbd_balance : balance).amountFloat);
        return {
            ...ownProps,
            owner: username,
            feed: state.global.get('feed_price').toJS(),
            cprops,
            maxBalance: max,
        };
    },
    // mapDispatchToProps
    dispatch => ({
        convert: (owner, amt, from, to, success, error) => {
            const amount = [parseFloat(amt).toFixed(3), from].join(' ')
            const requestid = Math.floor(Date.now() / 1000)
            const conf = tt('postfull_jsx.in_week_convert_DEBT_TOKEN_to_LIQUID_TOKEN',
                { amount: amount.split(' ')[0], DEBT_TOKEN: from, LIQUID_TOKEN: to, })
            dispatch(transaction.actions.broadcastOperation({
                type: 'convert',
                operation: {
                    owner,
                    requestid,
                    amount,
                    __config: {title: tt('converttosteem_jsx.confirm_title')}
                },
                confirm: conf + '?',

                successCallback: () => {
                    success()
                    dispatch({type: 'ADD_NOTIFICATION', payload:
                        {key: 'convert_sd_to_steem_' + Date.now(),
                         message: tt('g.order_placed') + ': ' + conf,
                         dismissAfter: 5000}
                    })
                },
                errorCallback: () => {error()}
            }))
        },
    })
)(ConvertToSteem)
