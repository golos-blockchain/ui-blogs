import React, { Component } from 'react';
import { Link } from 'react-router';
import golos from 'golos-lib-js';
import { Asset } from 'golos-lib-js/lib/utils';
import tt from 'counterpart';
import Icon from 'app/components/elements/Icon';
import Callout from 'app/components/elements/Callout';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import Tooltip from 'app/components/elements/Tooltip';

class FilledOrders extends Component {
    constructor(props) {
        super(props);
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (!this.props.account.filled_orders) return true;
        if (!nextProps.account.filled_orders) return true;
        return (
            nextProps.account.filled_orders.length !== this.props.account.filled_orders.length);
    }

    _renderOrderHistoryRow(operation, key) {
        const op = operation[1].op;

        const { current_user, } = this.props;
        let isMyAccount = current_user && current_user.get('username') === op[1].mentioned;

        const {
            current_owner,
            current_pays,
            open_owner,
            open_pays,
        } = op[1];
        if (!current_pays || !open_pays) { // additional protection
            return null;
        }

        let text = tt('filled_orders_jsx.exchanged', {
            OWNER: current_owner,
            AMOUNT: current_pays,
            OWNER2: open_owner,
            AMOUNT2: open_pays,
        });

        const sym1 = Asset(current_pays).symbol;
        const sym2 = Asset(open_pays).symbol;

        return (<tr key={key}>
            <td style={{fontSize: '85%'}}>
                <Tooltip t={new Date(operation[1].timestamp).toLocaleString()}>
                    <TimeAgoWrapper date={operation[1].timestamp} />
                </Tooltip>
            </td>
            <td>
                {text}
            </td>
            <td>
                <a href={`/market/${sym1}/${sym2}`}>{`${sym1}/${sym2}`}</a>
            </td>
        </tr>);
    }

    render() {
        const {account, incoming} = this.props;

        let filled_orders = account.filled_orders || [];
        filled_orders = filled_orders.reverse();

        let history = filled_orders.map((operation, index) => {
            return this._renderOrderHistoryRow(operation, index);
        });

        return (
            <div>
                <span style={{float: 'right', fontSize: '85%', marginLeft: '20px'}}>
                    <a href='/market/GOLOS/GBG' className='FilledOrders__market-link'><Icon name='trade' size='2x' /> {tt('filled_orders_jsx.open_market')}</a>
                </span>
                <span style={{float: 'right', fontSize: '85%'}}>
                    <a href='/convert' className='FilledOrders__convert-link'><Icon name='sorting' size='2x' /> {tt('filled_orders_jsx.quick_convert')}</a>
                </span>
                <h4 className='uppercase'>{tt('filled_orders_jsx.title')}</h4>
                <div className="column secondary">
                    {tt('filled_orders_jsx.orders_info')} <a href="/@allforyou/torguem-na-vnutrennei-birzhe-golosa">{tt('g.more_hint')}</a> <Icon name="extlink" size="1_5x" /><br /><br />
                </div>
                {history.length ? (<table>
                    <tbody>
                        {history}
                    </tbody>
                </table>) : null}
                {!history.length ? (<Callout>{tt('filled_orders_jsx.empty_NAME', {
                    NAME: account ? account.name : '',
                })}<a href='/market/GOLOS/GBG'>{tt('filled_orders_jsx.empty2')}</a>.</Callout>) : null}
            </div>);
    }
}

export default FilledOrders;
