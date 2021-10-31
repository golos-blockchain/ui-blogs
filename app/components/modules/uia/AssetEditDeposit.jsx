import React from 'react';
import tt from 'counterpart';
import { Field, } from 'formik';
import Expandable from 'app/components/elements/Expandable';

class AssetEditDeposit extends React.Component {
    render() {
        const { name, } = this.props;
        return (<div className='AssetEditWithdrawal row'>
            <div className='column small-10'>
                <Expandable title={tt('asset_edit_deposit_jsx.title')}>
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
