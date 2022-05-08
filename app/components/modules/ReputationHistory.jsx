import React, { Component } from 'react';
import { Link } from 'react-router';
import golos from 'golos-lib-js';
import tt from 'counterpart';
import Icon from 'app/components/elements/Icon';
import Callout from 'app/components/elements/Callout';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import Tooltip from 'app/components/elements/Tooltip';

class ReputationHistory extends Component {
    constructor(props) {
        super(props);
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (!this.props.account.reputation_history) return true;
        if (!nextProps.account.reputation_history) return true;
        return (
            nextProps.account.reputation_history.length !== this.props.account.reputation_history.length);
    }

    _renderReputationHistoryRow(operation, key) {
        const op = operation[1].op;

        let account = op[1].voter;
        let text = '';
        if (op[1].vote_weight > 0){ 
            text = tt('reputation_history_jsx.upvoted');
        } else {
            text = tt('reputation_history_jsx.downvoted');
        }

        let rep = golos.formatter.reputation(op[1].reputation_after, true);
        rep -= golos.formatter.reputation(op[1].reputation_before, true);
        let repFixed = parseFloat(rep.toFixed(3));
        repFixed = Math.abs(repFixed);
        if (repFixed === 0) {
            repFixed = '~0.001';
        }
        text += repFixed;

        return (<tr key={key}>
            <td style={{fontSize: '85%'}}>
                <Tooltip t={new Date(operation[1].timestamp).toLocaleString()}>
                    <TimeAgoWrapper date={operation[1].timestamp} />
                </Tooltip>
            </td>
            <td>
                <Link to={`/@${account}`}>{account}</Link>
                {text}
            </td>
        </tr>);
    }

    render() {
        const {account, incoming} = this.props;

        let reputation_history = account.reputation_history || [];
        reputation_history = reputation_history.reverse();

        let history = reputation_history.map((operation, index) => {
            return this._renderReputationHistoryRow(operation, index);
        });

        return (
            <div>
                <span style={{float: 'right', fontSize: '85%', marginLeft: '20px'}}>
                    <Link to='/minused_accounts'><Icon name="new/downvote" size="2x" /> {tt('minused_accounts_jsx.link_title')}</Link>
                </span>
                <span style={{float: 'right', fontSize: '85%'}}>
                    <a target="_blank" rel="noopener noreferrer" href="https://dpos.space/golos/top/reputation"><Icon name="hf/hf18" size="2x" /> {tt('reputation_history_jsx.rating')}</a> {tt('g.and')} <a target="_blank" rel="noopener noreferrer" href="https://pisolog.net/stats/accounts/toprepchanges">{tt('reputation_history_jsx.top')}</a> {tt('reputation_history_jsx.reputation')}
                </span>
                <h4 className='uppercase'>{tt('reputation_history_jsx.title')}</h4>
                {history.length ? (<table>
                    <tbody>
                        {history}
                    </tbody>
                </table>) : null}
                {!history.length ? (<Callout>{tt('reputation_history_jsx.empty_NAME', {
                    NAME: account ? account.name : '',
                })}</Callout>) : null}
            </div>);
    }
}

export default ReputationHistory;
