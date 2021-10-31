import React, {Component} from 'react';
import tt from 'counterpart';

export default class AssetRules extends Component {
    render() {
        const { rules, sym, } = this.props;
        const { to, min_amount, fee, details, } = rules;
        return (<div>
            <h4>
                {tt('asset_edit_withdrawal_jsx.transfer_title_SYM', {
                    SYM: sym || ' ',
                })}
            </h4>
            {to ? <div>
                {tt('asset_edit_withdrawal_jsx.to')}<br/>
                <b>{to}</b><br/>
                </div>:null}
            {min_amount && <div>
                {tt('asset_edit_withdrawal_jsx.min_amount')}<br/>
                <b>{min_amount}</b></div>}
            {fee && <div>
                {tt('asset_edit_withdrawal_jsx.fee')}<br/>
                <b>{fee}</b></div>}
            {details && <div>
                    <hr />
                    {details}
                </div>}
        </div>);
    }
}