import React from 'react';
import { Link } from 'react-router';
import tt from 'counterpart';
import { Asset } from 'golos-lib-js/lib/utils';

import Icon from 'app/components/elements/Icon';
import Userpic from 'app/components/elements/Userpic';
import iconCross from 'app/assets/icons/cross.svg';
import { msgsLink } from 'app/utils/ExtLinkUtils'

const actionStyle = {
    // fixme
    paddingTop: '2px',
    // paddingLeft: '11px',
    // paddingRight: '0px',
    display: 'flex',
    height: '100%',
    alignItems: 'center',
};

const cross = () => {
    return (<span className='NotificationContent__action'
        dangerouslySetInnerHTML={{ __html: iconCross }} />);
};

const transfer = (scope, type, op) => {
    const { from, to, amount, } = op;
    const isSend = scope === 'send';

    let icon = null;
    let message = null;
    let url = null;
    if (scope === 'donate' || scope === 'donate_msgs') {
        icon = 'notification/donate';
        message = tt('notify_content.donate_AMOUNT', { AMOUNT: amount, });
        url = `/@${to}/donates-to`;
    } else {
        icon = 'notification/transfer';
        if (isSend) {
            message = tt('notify_content.send_AMOUNT', { AMOUNT: amount, }) + ' ' + to;
        } else {
            message = tt('notify_content.receive_AMOUNT', { AMOUNT: amount, });
        }
        url = `/@${to}/transfers`;
    }

    return (
        <div className='NotificationContent__container'>
            <div className='NotificationContent__container_left'>
                <span className='NotificationContent__icon'>
                    <Icon name={icon} size='2x' />
                </span>
            </div>
            <div className='NotificationContent__container_center'>
                <Link to={url}>
                    <span className='NotificationContent__action_source'>
                        {isSend ? null : from}
                        <span style={{ color: '#919191', fontWeight: '450', }}>
                            {message}
                        </span>
                    </span>
                </Link>
            </div>
        </div>
    );
};

const comment = (scope, type, op) => {
    const { author, permlink, parent_author, parent_permlink, _depth, mentioned, } = op;

    let icon = null;
    let message = null;
    let url = null;
    if (scope === 'comment_reply') {
        icon = 'notification/comment';
        if (_depth > 1) {
            message = tt('notify_content.reply_comment');
        } else {
            message = tt('notify_content.reply_post');
        }
        url = `/@${parent_author}/recent-replies`;
    } else if (scope === 'mention') {
        icon = 'notification/mention';
        if (parent_author) {
            message = tt('notify_content.mention_comment');
        } else {
            message = tt('notify_content.mention_post');
        }
        url = `/@${mentioned}/mentions`;
    } else {
        return null;
    }

    return (
        <div className='NotificationContent__container'>
            <div className='NotificationContent__container_left'>
                <span className='NotificationContent__icon'>
                    <Icon name={icon} size='2x' />
                </span>
            </div>
            <div className='NotificationContent__container_center'>
                <Link to={url}>
                    <span className='NotificationContent__action_source'>
                        {author}
                        <span style={{ color: '#919191', fontWeight: '450', }}>
                            {message}.
                        </span>
                    </span>
                </Link>
            </div>
        </div>
    );
};

const message = (scope, type, op) => {
    const { from, to } = op;

    let icon = 'notification/message';
    let message = tt('notify_content.message');
    let url = msgsLink(from)

    return (
        <div className='NotificationContent__container'>
            <div className='NotificationContent__container_left'>
                <span className='NotificationContent__icon'>
                    <Icon name={icon} size='2x' />
                </span>
            </div>
            <div className='NotificationContent__container_center'>
                <a href={url} target='_blank' rel='noopener noreferrer'>
                    <span className='NotificationContent__action_source'>
                        {from}
                        <span style={{ color: '#919191', fontWeight: '450', }}>
                            {message}.
                        </span>
                    </span>
                </a>
            </div>
        </div>
    );
};

const fillOrder = (scope, type, op) => {
    const { current_pays, open_pays, } = op;

    const sym1 = Asset(current_pays).symbol;
    const sym2 = Asset(open_pays).symbol;

    let icon = 'notification/order';
    let message = tt('notify_content.fill_order_AMOUNT_AMOUNT2',
        {
            AMOUNT: current_pays,
            AMOUNT2: open_pays,
        });
    let url = `/market/${sym1}/${sym2}`;

    return (
        <div className='NotificationContent__container'>
            <div className='NotificationContent__container_left'>
                <span className='NotificationContent__icon'>
                    <Icon name={icon} size='2x' />
                </span>
            </div>
            <div className='NotificationContent__container_center'>
                <a href={url} target='_blank'>
                    <span className='NotificationContent__action_source'>
                        <span style={{ color: '#919191', fontWeight: '450', }}>
                            {message}.
                        </span>
                    </span>
                </a>
            </div>
        </div>
    );
};

function render(action) {
    const { scope, type, op } = action;
    try {
        return (
            type === 'transfer' ? transfer(scope, type, op) :
            (type === 'donate' || type === 'donate_msgs') ? transfer(scope, type, op) :
            (type === 'comment' || type === 'comment_reply' || type === 'comment_mention') ? comment(scope, type, op) :
            type === 'private_message' ? message(scope, type, op) :
            type === 'fill_order' ? fillOrder(scope, type, op) :
            null
        );
    } catch (err) {
        console.error('NotifyContent', err);
        throw err;
    }
}

export default action => ({
    // the following two are merged by react-notification
    // and overload .notification-bar css class
    barStyle: {},
    activeBarStyle: {
        // left: 'auto',
        // right: '1rem',
        // transition: '',
        // transitionProperty: 'right',
        // transitionDuration: '.5s',
        // transitionTimingFunction: 'cubic-bezier(0.89, 0.01, 0.5, 1.1)',
        background: '#FFFFFF',
        borderRadius: '6px',
        paddingTop: '11px',
        paddingBottom: '11px',
        paddingLeft: '21px',
        paddingRight: '14px'
    },
    // title can be inline-styled
    title: render(action),
    titleStyle: {
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        // override react-notification
        marginRight: '0px'
    },
    message: '',
    action:
        <span style={actionStyle}>
            {cross()}
        </span>,
    actionStyle: {
        // background: 'red',
        padding: '0px',
        marginLeft: '18px',
        color: 'blue',
        font: '.75rem normal Roboto, sans-serif',
        lineHeight: '1rem',
        letterSpacing: '.125ex',
        textTransform: 'uppercase',
        borderRadius: '0px',
        cursor: 'pointer'
    },
    key: 'chain_' + Date.now(),
    dismissAfter: 10000,
});
