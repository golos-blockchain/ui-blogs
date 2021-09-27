import React from 'react';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import golos from 'golos-lib-js';
import tt from 'counterpart';
import Icon from 'app/components/elements/Icon';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import Tooltip from 'app/components/elements/Tooltip';

class MinusedAccounts extends React.Component {
    constructor(props) {
        super(props);
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (!this.props.minused_accounts) return true;
        if (!nextProps.minused_accounts) return true;
        return (
            nextProps.minused_accounts.length !== this.props.minused_accounts.length);
    }

    _renderHistoryRow(operation, key) {
        const op = operation[1].op;

        let { author, voter, } = op[1];
        let text = tt('minused_accounts_jsx.row_text');

        let rep = golos.formatter.reputation(op[1].reputation_after, true);
        rep -= golos.formatter.reputation(op[1].reputation_before, true);
        let repFixed = parseFloat(rep.toFixed(3));
        if (repFixed === 0) {
            repFixed = '-0.001';
        }
        repFixed;

        return (<tr key={key}>
            <td style={{fontSize: '85%'}}>
                <Tooltip t={new Date(operation[1].timestamp).toLocaleString()}>
                    <TimeAgoWrapper date={operation[1].timestamp} />
                </Tooltip>
            </td>
            <td>
                <Link to={`/@${author}/reputation`}>{author}</Link>
                {text}
                <Link to={`/@${voter}`}>{voter}</Link>
            </td>
            <td>
                {repFixed}
            </td>
        </tr>);
    }

    render() {
        let minused_accounts = this.props.minused_accounts.reverse();

        let history = minused_accounts.map((operation, index) => {
            return this._renderHistoryRow(operation, index);
        });

        return (<div>
            <div className='column' style={{ paddingTop: '30px', }}>
                <div className='row'>
                    <h3 className='uppercase'>{tt('minused_accounts_jsx.title')}</h3>
                    <div className='secondary' style={{ paddingBottom: '10px', }}>
                        {tt('minused_accounts_jsx.description')} 
                        <br /> <a target="_blank" rel="noopener noreferrer" href="https://pisolog.net/stats/votes/allvotes?flag=true&acc=true">{tt('minused_accounts_jsx.stats')} <Icon name="extlink" /></a>  
                         /  <a target="_blank" rel="noopener noreferrer" href="https://pisolog.net/stats/accounts/toprepchanges">{tt('minused_accounts_jsx.changes')} <Icon name="extlink" /></a>
                    </div>
                    {history.length ? (<table>
                        <tbody>
                            {history}
                        </tbody>
                    </table>) : null}
                </div>
                {!history.length ? (<div className='callout'>
                    {tt('minused_accounts_jsx.empty')}
                </div>) : null}
            </div>
        </div>);
    }
}

module.exports = {
    path: '/minused_accounts',
    component: connect(
        state => {
            const minused_accounts = state.global.get('minused_accounts')

            return {
                minused_accounts: minused_accounts ? minused_accounts.toJS() : [],
            };
        })(MinusedAccounts)
};
