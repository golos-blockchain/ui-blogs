import React from 'react';
import tt from 'counterpart';
import { Field, FieldArray, FieldArrayItem, ErrorMessage, } from 'formik';
import { api, } from 'golos-lib-js';
import Icon from 'app/components/elements/Icon';
import Expandable from 'app/components/elements/Expandable';
import { validate_account_name, } from 'app/utils/ChainValidation';

class AssetEditWithdrawal extends React.Component {
    state = {
    };

    onToChange = (e, handle) => {
        let value = e.target.value.trim().toLowerCase();
        e.target.value = value;
        return handle(e);
    };

    submit() {
        this.submitTried = true;
    };

    _noWay = (values) => {
        const { name, } = this.props;
        const ways = values[name] && values[name].ways;
        for (let way of ways) {
            if (way.memo || way.name) {
                return false;
            }
        }
        return true;
    };

    validateTo = async (value, values) => {
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

    validateWay = (way) => {
        const spaceStart = /^[ \t]/;
        const spaceEnd = /[ \t]$/;
        const { name, memo, prefix, } = way;
        if (prefix) {
            if (spaceStart.test(prefix)) {
                return tt('asset_edit_withdrawal_jsx.wrong_prefix_start');
            } else if (!/[:_-]$/.test(prefix)) {
                return tt('asset_edit_withdrawal_jsx.wrong_prefix_end');
            } else if (memo && memo.startsWith(prefix)) {
                return tt('asset_edit_withdrawal_jsx.way_prefix_error');
            }
        }
        if (memo) {
            if (spaceStart.test(memo)) {
                return tt('asset_edit_withdrawal_jsx.wrong_memo_start');
            } else if (spaceEnd.test(memo)) {
                return tt('asset_edit_withdrawal_jsx.wrong_memo_end');
            } else if (!name) {
                return tt('asset_edit_withdrawal_jsx.way_name_error');
            }
        }
        return undefined; 
    };

    validateDetails = (value, values) => {
        let error;
        if (!this.submitTried) return error;
        const { name, } = this.props;
        if ((values[name].to || values[name].min_amount || values[name].fee) &&
                this._noWay(values) && !values[name].details) {
            error = tt('asset_edit_withdrawal_jsx.no_way_error');
        }
        if (!this._noWay(values) && !values[name].to) {
            error = tt('asset_edit_withdrawal_jsx.no_to_error');
        }
        return error;
    };

    render() {
        const { name, values, handleChange, } = this.props;

        let wayFields = <FieldArray
            name={`${name}.ways`}
            render={arrayHelpers => {
                const { form , } = arrayHelpers;
                const ways = form.values[name].ways;
                return (<React.Fragment>
                {(ways && ways.length) ? ways.map((memo, index) => (
                    <React.Fragment key={index}>
                        <FieldArrayItem
                            name={`${name}.ways.${index}`}
                            validate={this.validateWay}
                        />
                        <div className='row'>
                            <div className='column small-3'>
                                <div className='input-group'>
                                    <Field
                                        name={`${name}.ways.${index}.name`}
                                        component='input'
                                        type='text'
                                        className='input-group-field bold'
                                        maxLength='30'
                                        placeholder={tt('asset_edit_withdrawal_jsx.way_name_placeholder')}
                                    />
                                </div>
                            </div>
                            <div className='column small-4'>
                                <div className='input-group'>
                                    <Field
                                        name={`${name}.ways.${index}.prefix`}
                                        component='input'
                                        type='text'
                                        className='input-group-field bold'
                                        maxLength='64'
                                        placeholder={tt('asset_edit_withdrawal_jsx.way_prefix_placeholder')}
                                    />
                                </div>
                            </div>
                            <div className='column small-5'>
                                <div className='input-group'>
                                    <Field
                                        name={`${name}.ways.${index}.memo`}
                                        component='input'
                                        type='text'
                                        className='input-group-field bold'
                                        maxLength='256'
                                        placeholder={tt('asset_edit_withdrawal_jsx.way_memo_placeholder')}
                                    />
                                    <Icon 
                                        className='remove-way'
                                        name='cross'
                                        title={tt('g.remove')}
                                        onClick={() => arrayHelpers.remove(index)} />
                                </div>
                            </div>
                        </div>
                        <ErrorMessage name={`${name}.ways.${index}`} component='div' className='error' />
                    </React.Fragment>
                )) : null}
                <div className='add-way'>
                    <a
                        onClick={() => arrayHelpers.push({name: '', memo: '', prefix: ''})}
                    >
                        +&nbsp;{tt('asset_edit_withdrawal_jsx.way_add')}
                    </a>
                </div>
                </React.Fragment>);
            }}
        />;

        return (<div className='AssetEditWithdrawal row'>
            <div className='column small-10'>
                <Expandable title={tt('asset_edit_withdrawal_jsx.title')}>
                    <div>
                        {tt('asset_edit_withdrawal_jsx.to')}
                        <div className='input-group'>
                            <Field
                                name={`${name}.to`}
                                type='text'
                                className='input-group-field bold'
                                maxLength='20'
                                onChange={e => this.onToChange(e, handleChange)}
                                validate={value => this.validateTo(value, values)}
                            />
                        </div>
                        <ErrorMessage name={`${name}.to`} component='div' className='error' />
                    </div>
                    <div className='row'>
                        <div className='column small-3'>
                            {tt('asset_edit_withdrawal_jsx.way_name')}
                        </div>
                        <div className='column small-4'>
                            {tt('asset_edit_withdrawal_jsx.way_prefix')}
                        </div>
                        <div className='column small-5'>
                            {tt('asset_edit_withdrawal_jsx.way_memo')}
                        </div>
                    </div>
                    {wayFields}
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
                        {tt('g.fee') + ': '}
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
                    <div>
                        {tt('asset_edit_withdrawal_jsx.details')}
                        <div className='input-group'>
                            <Field
                                name={`${name}.details`}
                                as='textarea'
                                maxLength='512'
                                rows='3'
                                validate={value => this.validateDetails(value, values)}
                            />
                        </div>
                        <ErrorMessage name={`${name}.details`} component='div' className='error' />
                    </div>
                    <div>
                        <div className='input-group' style={{ marginBottom: '0rem', }}>
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

export default AssetEditWithdrawal;