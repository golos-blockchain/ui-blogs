import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import { browserHistory, Link, } from 'react-router';
import tt from 'counterpart';
import { Formik, Field, ErrorMessage, } from 'formik';
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate';
import {countDecimals, formatAsset, formatAmount, longToAsset} from 'app/utils/ParsersAndFormatters';
import g from 'app/redux/GlobalReducer';
import transaction from 'app/redux/Transaction'
import user from 'app/redux/User';
import LoadingIndicator from 'app/components/elements/LoadingIndicator';
import AssetEditDeposit from 'app/components/modules/uia/AssetEditDeposit';
import AssetEditWithdrawal from 'app/components/modules/uia/AssetEditWithdrawal';

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
        };
        this.initForm(props);
        this.aewRef = React.createRef();
    }

    initForm(props) {
        let fee_percent = props.asset.fee_percent
        fee_percent = longToAsset(fee_percent, '', 2).trim()
        let description = '';
        let image_url = '';
        let deposit = null;
        let withdrawal = null;
        if (props.asset.json_metadata.startsWith('{')) {
            const json_metadata = JSON.parse(props.asset.json_metadata);
            description = json_metadata.description;
            image_url = json_metadata.image_url;
            deposit = json_metadata.deposit;
            withdrawal = json_metadata.withdrawal;
        }
        if (!deposit) deposit = {
            details: '',
        };
        if (!deposit.to_type)
            deposit.to_type = 'fixed';
        if (!withdrawal) withdrawal = {
            details: '',
        };
        if (!withdrawal.ways || !withdrawal.ways[0])
            withdrawal.ways = [{ name: '', memo: '', prefix: '', }];
        this.state.initialValues = {
            fee_percent,
            description,
            image_url,
            symbols_whitelist: props.asset.symbols_whitelist.join('\n'),
            withdrawal,
            deposit,
        };
    }

    onFeePercentChange = (e, values, handle) => {
        let { value, } = e.target;
        value = value.replace(',','.');
        if (isNaN(value)
            || parseFloat(value) < 0
            || parseFloat(value) > 100) {
            e.target.value = values.fee_percent || '';
            return;
        }
        let parts = value.split('.')
        if (parts.length > 2) {
            e.target.value = values.fee_percent || '';
            return;
        }
        e.target.value = value;
        return handle(e);
    };

    onFeePercentBlur = (e, values, handle, setFieldValue) => {
        let value = parseFloat(values.fee_percent);
        if (isNaN(value)) value = 0;
        setFieldValue('fee_percent', value.toFixed(2));
        return handle(e);
    };

    onSymbolsWhitelistChange = (e, values, handle) => {
        let value = e.target.value;
        let lines = value.split('\n')
        let lines2 = []
        for (let i = 0; i < lines.length; ++i) {
            let line = lines[i].trim().toUpperCase()
            if (line != '' || (i == lines.length - 1)) lines2.push(line)
        }
        e.target.value = lines2.join('\n');
        return handle(e);
    };


    _sanitizeWithdrawal = (withdrawal) => {
        let obj = {...withdrawal};
        if (withdrawal.ways) {
            let newWays = [];
            for (let way of withdrawal.ways) {
                if (way.memo || way.name) {
                    newWays.push(way);
                }
            }
            obj.ways = newWays;
        }
        return obj;
    };

    _onSubmit = (values, { setSubmitting, }) => {
        const {
            updateAsset, accountName, symbol,
        } = this.props;
        const {
            fee_percent, symbols_whitelist, description, image_url,
        } = values;
        const deposit = values.deposit;
        const withdrawal = this._sanitizeWithdrawal(values.withdrawal);
        updateAsset({ symbol, fee_percent, symbols_whitelist,
            image_url, description, deposit, withdrawal, accountName,
            errorCallback: (e) => {
                if (e === 'Canceled') {
                    this.setState({
                        errorMessage: '',
                    });
                    setSubmitting(false);
                } else {
                    console.log('updateAsset ERROR', e)
                    this.setState({
                        errorMessage: tt('g.server_returned_error'),
                    });
                    setSubmitting(false);
                }
            },
            successCallback: () => {
                window.location.href = `/@${accountName}/assets`;
            },
        });
    }

    onFormSubmit = (e, handle) => {
        const { aewRef, } = this;
        if (aewRef.current) {
            aewRef.current.submit();
        }
        return handle(e);
    };

    render() {
        const {props: {account, isMyAccount, cprops, symbol, asset}} = this;
        if (!asset) return (<div></div>);
        const { initialValues, successMessage, errorMessage, } = this.state;
        const account_name = account.get('name');

        return (<div>
            <Formik
                initialValues={initialValues}
                onSubmit={this._onSubmit}
            >
            {({
                handleSubmit, isValid, isSubmitting, errors, values,
                handleChange, handleBlur, setFieldValue,
            }) => (
            <form
                onSubmit={e => this.onFormSubmit(e, handleSubmit)}
                autoComplete='off'
            >
                <div className='row'>
                    <div className='column small-10'>
                        <h4>{tt('assets_jsx.update_asset') + ' ' + symbol}</h4>
                    </div>
                </div>

                <div className='row'>
                    <div className='column small-10'>
                        {tt('assets_jsx.fee_percent')}
                        <div className='input-group'>
                            <Field name='fee_percent'
                                className='input-group-field bold'
                                type='text'
                                title={asset.allow_fee ? '' : tt('assets_jsx.fee_not_allowed')}
                                disabled={!asset.allow_fee}
                                maxLength='6'
                                onChange={e => this.onFeePercentChange(e, values, handleChange)}
                                onBlur={(e) => this.onFeePercentBlur(e, values, handleBlur, setFieldValue)}
                            />
                        </div>
                        <ErrorMessage name='fee_percent' component='div' className='error' />
                    </div>
                </div>

                <div className='row'>
                    <div className='column small-10'>
                        {tt('assets_jsx.symbols_whitelist')}
                        <Field name='symbols_whitelist'
                            as='textarea'
                            rows='10'
                            onChange={e => this.onSymbolsWhitelistChange(e, values, handleChange)}
                        />
                    </div>
                </div>
<br/>
                <div className='row'>
                    <div className='column small-10'>
                        {tt('assets_jsx.description')}
                        <div className='input-group' style={{marginBottom: '0rem'}}>
                            <Field name='description'
                                className='input-group-field bold'
                                maxLength='500'
                                type='text'
                            />
                        </div>
                    </div>
                </div>
<br/>
                <div className='row'>
                    <div className='column small-10'>
                        {tt('assets_jsx.image_with_text')}
                        <div className='input-group' style={{marginBottom: '1.25rem'}}>
                            <Field name='image_url'
                                className='input-group-field bold'
                                maxLength='512'
                                type='text'
                            />
                        </div>
                    </div>
                </div>

                <AssetEditDeposit
                    name='deposit'
                    values={values}
                    handleChange={handleChange}
                />

                <AssetEditWithdrawal
                    name='withdrawal'
                    ref={this.aewRef}
                    values={values}
                    handleChange={handleChange}
                />

                <div className='row'>
                    <div className='column small-10'>
                        {isSubmitting && <span><LoadingIndicator type='circle' /><br /></span>}
                        {!isSubmitting && <input type='submit' className='button' value={tt('assets_jsx.update_btn')} disabled={isSubmitting || !isValid} />}
                        {' '}{
                            errorMessage
                                ? <small className='error'>{errorMessage}</small>
                                : successMessage
                                ? <small className='success uppercase'>{successMessage}</small>
                                : null
                        }
                        <Link to={`/@${account_name}/assets/${symbol}/transfer`} className='button hollow no-border Assets__noMarginBottom'>
                            {tt('assets_jsx.transfer_asset_btn')}
                        </Link>
                    </div>
                </div>
            </form>
            )}</Formik>
            <div className='row'>
                <div className='column small-10'>
                    <hr />
                </div>
            </div>
        </div>)
    }
}
const AssetBalance = ({onClick, balanceValue}) =>
    <a onClick={onClick} style={{borderBottom: '#A09F9F 1px dotted', cursor: 'pointer'}}>{tt('transfer_jsx.balance') + ': ' + balanceValue}</a>

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
            symbol, fee_percent, symbols_whitelist, image_url, description,
            deposit, withdrawal,
            accountName, successCallback, errorCallback
        }) => {
            let sw = symbols_whitelist.split('\n');
            let set = new Set();
            for (let i = 0; i < sw.length; ++i) {
                if (sw[i] != '') set.add(sw[i]);
            }

            const operation = {
                creator: accountName,
                symbol,
                fee_percent: parseInt(fee_percent.replace('.','').replace(',','')),
                symbols_whitelist: [...set],
                json_metadata: JSON.stringify({
                    image_url,
                    description,
                    deposit,
                    withdrawal,
                }),
            };

            const success = () => {
                dispatch(user.actions.getAccount());
                successCallback();
            };

            dispatch(transaction.actions.broadcastOperation({
                type: 'asset_update',
                accountName,
                operation,
                successCallback: success,
                errorCallback,
            }));
        },
    })
)(UpdateAsset)
