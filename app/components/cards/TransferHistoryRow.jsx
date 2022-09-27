import React from 'react';
import {connect} from 'react-redux'
import { Link } from 'react-router';
import { PrivateKey } from 'golos-lib-js/lib/auth/ecc'
import tt from 'counterpart'

import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import Tooltip from 'app/components/elements/Tooltip';
import Memo from 'app/components/elements/Memo'
import {numberWithCommas, vestsToSp} from 'app/utils/StateFunctions'
import { msgsLink } from 'app/utils/ExtLinkUtils'
import { VEST_TICKER } from 'app/client_config';

class TransferHistoryRow extends React.Component {

    render() {
        const VESTING_TOKENS = tt('token_names.VESTING_TOKENS')

        const {op, curation_reward, author_reward} = this.props
        let { context, } = this.props;
        // context -> account perspective

        const type = op[1].op[0];
        const data = op[1].op[1];
        const amount = data.amount;

        /*  all transfers involve up to 2 accounts, context and 1 other. */
        let description_start = "";
        let link = null, linkTitle = null, linkExternal = false
        let code_key = "";
        let description_end = "";
        let target_hint = "";
        let data_memo = data.memo;

        if (/^transfer$|^transfer_to_savings$|^transfer_from_savings$/.test(type)) {
            const fromWhere =
                type === 'transfer_to_savings' ? tt('transferhistoryrow_jsx.to_savings') :
                type === 'transfer_from_savings' ? tt('transferhistoryrow_jsx.from_savings') :
                ''
            const { amount } = data
            if( data.from === context ) {
                description_start += tt('transferhistoryrow_jsx.transfer') + ` ${fromWhere} ${data.amount}` + tt('g.to');
                link = data.to
            }
            else if( data.to === context ) {
                description_start += tt('g.receive') + ` ${fromWhere} ${data.amount}` + tt('g.from');
                link = data.from
            } else {
                description_start += tt('transferhistoryrow_jsx.transferred') + ` ${fromWhere} ${data.amount}` + tt('g.from');
                link = data.from
                description_end += tt('g.to') + data.to;
            }
            if(data.request_id != null)
                description_end += ` (${tt('g.request')} ${data.request_id})`
        }

        else if( type === 'curation_reward' ) {
            description_start += `${curation_reward} ${VESTING_TOKENS}` + tt('transferhistoryrow_jsx.for');
            link = data.comment_author + "/" + data.comment_permlink;
        }

        else if (type === 'author_reward') {
            description_start += `${author_reward} ${VESTING_TOKENS}` + tt('transferhistoryrow_jsx.for');
            link = data.author + "/" + data.permlink;
        }

        else if (type === 'donate' && context == 'ref') {
            const donate_meta = JSON.parse(op[1].json_metadata);
            description_start += donate_meta.referrer_interest + tt('transferhistoryrow_jsx.percen_referral');
            link = data.to;
            data_memo = "";
        }
        else if (type === 'donate') {
            const describe_account = () => {
                if (context === "from") {
                    link = data.to;
                    return tt('transferhistoryrow_jsx.to');
                } else {
                    link = data.from;
                    return tt('transferhistoryrow_jsx.from');
                }
            };

            const { target } = data.memo

            // golos-blog donates of version 1 are for posts (with permlink) and just for account (without)
            if (target.permlink) {
                description_start += data.amount;
                if (context === "from" && data.to != target.author) {
                    description_start += tt('transferhistoryrow_jsx.to') + data.to;
                } else if (context === "to") {
                    description_start += tt('transferhistoryrow_jsx.from') + data.from;
                }
                description_start += tt('transferhistoryrow_jsx.for');
                link = target.author + '/' + target.permlink;
                target_hint += data.memo.app;
            } else if (target.nonce && target.from && target.to) {
                description_start += data.amount
                if (context === "from") {
                    description_start += tt('transferhistoryrow_jsx.to') + data.to
                } else if (context === "to") {
                    description_start += tt('transferhistoryrow_jsx.from') + data.from
                }
                description_start += tt('transferhistoryrow_jsx.for_msg_in')
                const isMyAccount = this.props.username == this.props.acc
                if (isMyAccount) {
                    link = context === "from" ? msgsLink(data.to) : msgsLink(data.from)
                    linkTitle = tt('transferhistoryrow_jsx.chat')
                    linkExternal = true
                } else {
                    description_start += tt('transferhistoryrow_jsx.chat')
                }
                target_hint += data.memo.app
            } else {
                description_start += data.amount;
                if (context === "from") {
                    description_start += tt('transferhistoryrow_jsx.to');
                    link = data.to;
                } else {
                    description_start += tt('transferhistoryrow_jsx.from');
                    link = data.from;
                }
            }

            // Here is a workaround to not throw in Memo component which is for old (string, not object) memo format
            if (data.memo.comment) {
                data_memo = data.memo.comment;
            } else {
                data_memo = '';
            }

            context = this.props.acc;
        }

        else if( type === 'withdraw_vesting' ) {
            if( data.vesting_shares === '0.000000 ' + VEST_TICKER)
                description_start += tt('transferhistoryrow_jsx.stop_power_down', {VESTING_TOKENS});
            else
                description_start += tt('transferhistoryrow_jsx.start_power_down_of', {VESTING_TOKENS}) + " " +  data.vesting_shares;
        }

        else if( type === 'transfer_to_vesting' ) {
            if( data.to === context ) {
                if( data.from === context ) {
                    description_start += tt('transferhistoryrow_jsx.transferred') + data.amount + tt('transferhistoryrow_jsx.to_golos_power');
                }
                else {
                    description_start += tt('g.receive') + data.amount + tt('g.from');
                    link = data.from;
                    description_end += tt('transferhistoryrow_jsx.to_golos_power');
                }
            } else {
                description_start += tt('transferhistoryrow_jsx.transfer') + data.amount + tt('g.to');
                link = data.to;
                description_end += tt('transferhistoryrow_jsx.to_golos_power');
            }
        }

        else if (type === 'transfer_to_tip') {
            if( data.to === context ) {
                if( data.from === context ) {
                    description_start += tt('transferhistoryrow_jsx.transferred') + data.amount + tt('transferhistoryrow_jsx.to_tip');
                }
                else {
                    description_start += tt('g.receive') + data.amount + tt('transferhistoryrow_jsx.to_tip') + tt('transferhistoryrow_jsx.from');
                    link = data.from;
                }
            } else {
                description_start += tt('transferhistoryrow_jsx.transfer') + data.amount + tt('transferhistoryrow_jsx.to_tip') + tt('g.to');
                link = data.to;
            }
        }

        else if (type === 'transfer_from_tip') {
            let to_what = tt('transferhistoryrow_jsx.to_golos_power');
            if (data.amount.split(' ')[1] != 'GOLOS') to_what = tt('transferhistoryrow_jsx.to_golos_liquid');
            if( data.to === context ) {
                if( data.from === context ) {
                    description_start += tt('transferhistoryrow_jsx.transferred') + data.amount + tt('transferhistoryrow_jsx.from_tip') + to_what;
                }
                else {
                    description_start += tt('g.receive') + data.amount + tt('transferhistoryrow_jsx.from_tip') + tt('transferhistoryrow_jsx.from');
                    link = data.from;
                    description_end += to_what;
                }
            } else {
                description_start += tt('transferhistoryrow_jsx.transfer') + data.amount + tt('transferhistoryrow_jsx.from_tip') + tt('g.to');
                link = data.to;
                description_end += to_what;
            }
        }

        else if (type === 'invite') {
            description_start += tt('invites_jsx.hist_invite');
            code_key = data.invite_key;
            description_end += tt('invites_jsx.hist_invite2') + data.balance;            
        }

        else if (type === 'asset_issue') {
            description_start += tt('transferhistoryrow_jsx.issue') + data.amount + tt('transferhistoryrow_jsx.to_account');
            link = data.to;
        }

        else if (type === 'convert_sbd_debt') {
            description_start += tt('transferhistoryrow_jsx.orders_canceled') + data.sbd_amount;
        }

        else if (type === 'convert') {
            description_start += tt('transferhistoryrow_jsx.conversion_started') + data.amount;
            const from = data.amount.split(' ')[1];
            const to = from === 'GOLOS' ? 'GBG' : 'GOLOS';
            description_start += ' ' + tt('g.into') + ' ' + to;
        }

        else if (type === 'fill_convert_request') {
            description_start += data.amount_in;
            if (data.fee_in.endsWith(' GOLOS')) {
                description_start += ' (' + tt('transferhistoryrow_jsx.including_conversion_fee') + ' ' + data.fee_in + ')';
            }
            description_start += tt('transferhistoryrow_jsx.were_converted') + data.amount_out;
        }

        else if (type === 'interest') {
            description_start += tt('transferhistoryrow_jsx.receive_interest_of') + data.interest;
        }

        else if (type === 'worker_reward') {
            description_start += tt('transferhistoryrow_jsx.funded_workers') + data.reward + tt('transferhistoryrow_jsx.for');
            link = data.worker_request_author + "/" + data.worker_request_permlink;
        }

        else if (type === 'account_freeze' && !data.frozen) {
            description_start += tt('transferhistoryrow_jsx.claimed') + data.unfreeze_fee + tt('transferhistoryrow_jsx.account_unfreeze');
        }

        else if (type === 'unwanted_cost') {
            if (data.blocker === this.props.context) {
                description_start += tt('transferhistoryrow_jsx.received') + data.amount + tt('transferhistoryrow_jsx.from')
                link = data.blocking
                description_end += tt('transferhistoryrow_jsx.for_unwanted')
            } else {
                description_start += tt('transferhistoryrow_jsx.transfer') + data.amount + tt('g.to')
                link = data.blocker
                description_end += tt('transferhistoryrow_jsx.for_unwanted')
            }
        }

        else if (type === 'unlimit_cost') {
            description_start += tt('transferhistoryrow_jsx.claimed') + data.amount + tt('transferhistoryrow_jsx.from_tip') + tt('transferhistoryrow_jsx.for')
            if (data.target_type === 'comment') {
                link = data.id1 + '/' + data.id2
                linkTitle = tt('transferhistoryrow_jsx.comment')
            } else if (data.target_type === 'vote') {
                link = data.id1 + '/' + (data.id2 || '')
                linkTitle = tt('transferhistoryrow_jsx.vote')
            } else {
                description_start += tt('transferhistoryrow_jsx.action')
            }
            if (data.limit_type === 'negrep') {
                description_end += tt('transferhistoryrow_jsx.with_negrep')
            } else {
                description_end += tt('transferhistoryrow_jsx.with_unlimit')
            }
        }

        else {
            code_key = JSON.stringify({type, ...data}, null, 2);
        }

        return(
                <tr key={op[0]} className="Trans">
                    <td style={{fontSize: "85%"}}>
                        <Tooltip t={new Date(op[1].timestamp).toLocaleString()}>
                            <TimeAgoWrapper date={op[1].timestamp} />
                        </Tooltip>
                    </td>
                    <td className="TransferHistoryRow__text" style={{maxWidth: "35rem"}}>
                        {description_start}
                        {code_key && <span style={{fontSize: "85%"}}>{code_key}</span>}
                        {link && (linkExternal ?
                            <a href={link} target='_blank' rel='noreferrer noopener'>{linkTitle || link}</a> :
                            <Link to={`/@${link}`}>{linkTitle || link}</Link>)}
                        {description_end}
                        {target_hint && <span style={{fontSize: "85%", padding: "5px"}}>[{target_hint}]</span>}
                    </td>
                    <td className="show-for-medium" style={{maxWidth: "25rem", wordWrap: "break-word", fontSize: "85%"}}>
                        <Memo text={data_memo} data={data} username={context} />
                    </td>
                </tr>
        );
    }
}

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        const currentUser = state.user.getIn(['current'])
        const username = currentUser ? currentUser.get('username') : ''

        const op = ownProps.op
        const type = op[1].op[0]
        const data = op[1].op[1]
        const curation_reward = type === 'curation_reward' ? numberWithCommas(vestsToSp(state, data.reward)) : undefined
        const author_reward = type === 'author_reward' ? numberWithCommas(vestsToSp(state, data.vesting_payout)) : undefined
        return {
            ...ownProps,
            username,
            curation_reward,
            author_reward,
        }
    },
)(TransferHistoryRow)
