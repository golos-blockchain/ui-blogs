import React from 'react';
import tt from 'counterpart';
import { Field, ErrorMessage, } from 'formik';
import { api, } from 'golos-lib-js';
import Expandable from 'app/components/elements/Expandable';
import { validate_account_name, } from 'app/utils/ChainValidation';

class AssetEditDeposit extends React.Component {
    onToTransferChange = (e, handle) => {
        let value = e.target.value.trim().toLowerCase();
        e.target.value = value;
        return handle(e);
    };

    validateToTransfer = async (value, values) => {
        let error;
        if (!value) return error;
        error = validate_account_name(value);
        if (!error) {
            try {
                const res = await api.getAccountsAsync([value]);
                if (!res || !res.length) {
                    error = tt('g.account_not_found');
                }
            } catch (err) {
                console.error('validating to', err);
                error = 'Account name can\'t be verified right now due to server failure. Please try again later.';
            }
        }
        return error;
    };

    onAmountChange = (e, values, fieldName, handle) => {
        let value = e.target.value.trim().toLowerCase();
        value = value.replace(',','.');
        if (isNaN(value) || parseFloat(value) < 0) {
            e.target.value = values[fieldName] || '';
            return;
        }
        e.target.value = value;
        return handle(e);
    };

    _renderTo(isTransferring, show) {
        const { name, values, handleChange, } = this.props;
        const field = !isTransferring ? 'to_fixed' : 'to_transfer';
        const fieldProps = !isTransferring ? {
            maxLength: '256',
        } : {
            maxLength: '20',
            onChange: e => this.onToTransferChange(e, handleChange),
            validate: value => this.validateToTransfer(value, values),
        };
        return <div style={{ display: show ? 'block' : 'none', }}>
            {tt(`asset_edit_deposit_jsx.${field}`)}
            <div className='input-group'>
                <Field
                    name={`${name}.${field}`}
                    type='text'
                    className='input-group-field bold'
                    {...fieldProps}
                />
            </div>
            <ErrorMessage name={`${name}.${field}`} component='div' className='error' />
        </div>
    };

    _renderMemo(isTransferring, show) {
        const { name, values, handleChange, } = this.props;
        const field = isTransferring ? 'memo_transfer' : 'memo_fixed';
        return (<div style={{ display: show ? 'block' : 'none', }}>
            {tt(`asset_edit_deposit_jsx.${field}`)}
            <div className='input-group'>
                <Field
                    name={`${name}.${field}`}
                    type='text'
                    className='input-group-field bold'
                    maxLength='256'
                />
            </div>
            <ErrorMessage name={`${name}.${field}`} component='div' className='error' />
        </div>);
    };

    render() {
        const { name, values, handleChange, } = this.props;
        const isTransferring = values && values[name] && values[name].to_type === 'transfer';
        return (<div className='AssetEditWithdrawal row'>
            <div className='column small-10'>
                <Expandable title={tt('asset_edit_deposit_jsx.title')}>
                    <div>
                        <div className='input-group' style={{ marginBottom: '1.25rem', marginTop: '0.25rem', }}>
                            <label>
                                <Field
                                    name={`${name}.to_type`}
                                    value='fixed'
                                    type='radio'
                                    className='input-group-field bold'
                                />
                                {tt('asset_edit_deposit_jsx.to_type_fixed')}
                            </label>
                            <label style={{ marginLeft: '1.25rem', }}>
                                <Field
                                    name={`${name}.to_type`}
                                    value='transfer'
                                    type='radio'
                                    className='input-group-field bold'
                                />
                                {tt('asset_edit_deposit_jsx.to_type_transfer')}
                            </label>
                        </div>
                    </div>
                    {this._renderTo(false, !isTransferring)}
                    {this._renderTo(true, isTransferring)}
                    {this._renderMemo(false, !isTransferring)}
                    {this._renderMemo(true, isTransferring)}
                    <div>
                        {tt('asset_edit_withdrawal_jsx.min_amount')}
                        <div className='input-group'>
                            <Field
                                name={`${name}.min_amount`}
                                type='text'
                                className='input-group-field bold'
                                maxLength='20'
                                onChange={e => this.onAmountChange(e, values, 'min_amount', handleChange)}
                            />
                        </div>
                        <ErrorMessage name={`${name}.min_amount`} component='div' className='error' />
                    </div>
                    <div>
                        {tt('asset_edit_withdrawal_jsx.fee')}
                        <div className='input-group'>
                            <Field
                                name={`${name}.fee`}
                                type='text'
                                className='input-group-field bold'
                                maxLength='20'
                                onChange={e => this.onAmountChange(e, values, 'fee', handleChange)}
                            />
                        </div>
                        <ErrorMessage name={`${name}.fee`} component='div' className='error' />
                    </div>
                    <Field
                        name={`${name}.details`}
                        as='textarea'
                        maxLength='512'
                        rows='4'
                        placeholder={tt('asset_edit_deposit_jsx.details_placeholder')}
                    />
                    <div>
                        <div className='input-group' style={{ marginBottom: '0rem', marginTop: '1.25rem', }}>
                            <label>
                                <Field
                                    name={`${name}.unavailable`}
                                    type='checkbox'
                                    className='input-group-field bold'
                                />
                                {tt('asset_edit_withdrawal_jsx.unavailable')}
                            </label>
                        </div>
                    </div>
                </Expandable>
            </div>
        </div>);
    }
}

export default AssetEditDeposit;
