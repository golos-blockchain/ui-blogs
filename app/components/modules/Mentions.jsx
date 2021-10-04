import React, { Component } from 'react';
import { Link } from 'react-router';
import golos from 'golos-lib-js';
import tt from 'counterpart';
import Icon from 'app/components/elements/Icon';
import Callout from 'app/components/elements/Callout';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import Tooltip from 'app/components/elements/Tooltip';

class Mentions extends Component {
    constructor(props) {
        super(props);
    }

    shouldComponentUpdate(nextProps, nextState) {
        if (!this.props.account.mentions) return true;
        if (!nextProps.account.mentions) return true;
        return (
            nextProps.account.mentions.length !== this.props.account.mentions.length);
    }

    _renderMentionHistoryRow(operation, key) {
        const op = operation[1].op;

        let account = op[1].author;
        const { current_user, } = this.props;
        let isMyAccount = current_user && current_user.get('username') === op[1].mentioned;

        let link = '';
        let linkTitle = '';

        let text = tt('mentions_jsx.mention_NAME', {
            NAME: isMyAccount ? tt('mentions_jsx.you') : op[1].mentioned,
        });
        if (!op[1].parent_author){ 
            text += tt('mentions_jsx.mention_post');
            linkTitle = op[1].author + '/' + op[1].permlink;
            link = '/@' + linkTitle;
        } else {
            text += tt('mentions_jsx.mention_comment');
            linkTitle = op[1].author + '/' + op[1].permlink;
            link = '/@' + linkTitle;
        }

        return (<tr key={key}>
            <td style={{fontSize: '85%'}}>
                <Tooltip t={new Date(operation[1].timestamp).toLocaleString()}>
                    <TimeAgoWrapper date={operation[1].timestamp} />
                </Tooltip>
            </td>
            <td>
                <Link to={`/@${account}`}>{account}</Link>
                {text}
                <Link to={link}>{linkTitle}</Link>
            </td>
        </tr>);
    }

    render() {
        const {account, incoming} = this.props;

        let mentions = account.mentions || [];
        mentions = mentions.reverse();

        let history = mentions.map((operation, index) => {
            return this._renderMentionHistoryRow(operation, index);
        });

        return (
            <div>
                <span style={{float: 'right', fontSize: '85%'}}>
                    <Link style={{fill: "#3e7bc6"}} to='/services'><Icon name="new/monitor" size="2x" /> {tt('navigation.services')}</Link>
                </span>
                <h4 className='uppercase'>{tt('g.mentions')}</h4>
                {history.length ? (<table>
                    <tbody>
                        {history}
                    </tbody>
                </table>) : null}
                {!history.length ? (<Callout>{tt('mentions_jsx.empty_NAME', {
                    NAME: account ? account.name : '',
                })}</Callout>) : null}
            </div>);
    }
}

export default Mentions;
