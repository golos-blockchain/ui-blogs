import React from 'react';
import PropTypes from 'prop-types';

const icons = new Map([
    ['user', require('app/assets/icons/user.svg')],
    ['share', require('app/assets/icons/share.svg')],
    ['calendar', require('app/assets/icons/calendar.svg')],
    ['caret-down', require('app/assets/icons/caret-down.svg')],
    ['chevron-up-circle', require('app/assets/icons/chevron-up-circle.svg')],
    ['chevron-down-circle', require('app/assets/icons/chevron-down-circle.svg')],
    ['chevron-left', require('app/assets/icons/chevron-left.svg')],
    ['chatboxes', require('app/assets/icons/chatboxes.svg')],
    ['cross', require('app/assets/icons/cross.svg')],
    ['chatbox', require('app/assets/icons/chatbox.svg')],
    ['trade', require('app/assets/icons/trade.svg')],
    ['facebook', require('app/assets/icons/facebook.svg')],
    ['twitter', require('app/assets/icons/twitter.svg')],
    ['github', require('app/assets/icons/github.svg')],
    ['linkedin', require('app/assets/icons/linkedin.svg')],
    ['pencil', require('app/assets/icons/pencil.svg')],
    ['vk', require('app/assets/icons/vk.svg')],
    ['link', require('app/assets/icons/link.svg')],
    ['clock', require('app/assets/icons/clock.svg')],
    ['copy', require('app/assets/icons/copy.svg')],
    ['extlink', require('app/assets/icons/extlink.svg')],
    ['golos', require('app/assets/icons/golos.svg')],
    ['dropdown-arrow', require('app/assets/icons/dropdown-arrow.svg')],
    ['printer', require('app/assets/icons/printer.svg')],
    ['search', require('app/assets/icons/search.svg')],
    ['menu', require('app/assets/icons/menu.svg')],
    ['voter', require('app/assets/icons/voter.svg')],
    ['voters', require('app/assets/icons/voters.svg')],
    ['empty', require('app/assets/icons/empty.svg')],
    ['flag1', require('app/assets/icons/flag1.svg')],
    ['flag2', require('app/assets/icons/flag2.svg')],
    ['reblog', require('app/assets/icons/reblog.svg')],
    ['pin', require('app/assets/icons/pin.svg')],
    ['photo', require('app/assets/icons/photo.svg')],
    ['line', require('app/assets/icons/line.svg')],
    ['video', require('app/assets/icons/video.svg')],
    ['eye', require('app/assets/icons/eye.svg')],
    ['eye_strike', require('app/assets/icons/eye_strike.svg')],
    ['eye_gray', require('app/assets/icons/eye_gray.svg')],
    ['location', require('app/assets/icons/location.svg')],
    ['info_o', require('app/assets/icons/info_o.svg')],
    ['feedback', require('app/assets/icons/feedback.svg')],
    ['cog', require('app/assets/icons/cog.svg')],
    ['enter', require('app/assets/icons/enter.svg')],
    ['profile', require('app/assets/icons/profile.svg')],
    ['key', require('app/assets/icons/key.svg')],
    ['reply', require('app/assets/icons/reply.svg')],
    ['replies', require('app/assets/icons/replies.svg')],
    ['wallet', require('app/assets/icons/wallet.svg')],
    ['home', require('app/assets/icons/home.svg')],
    ['lj', require('app/assets/icons/lj.svg')],
    ['arrow', require('app/assets/icons/arrow.svg')],
    ['envelope', require('app/assets/icons/envelope.svg')],
    ['male', require('app/assets/icons/male.svg')],
    ['female', require('app/assets/icons/female.svg')],
    ['money', require('app/assets/icons/money.svg')],
    ['tips', require('app/assets/icons/tips.svg')],
    ['team', require('app/assets/icons/team.svg')],
    ['rocket', require('app/assets/icons/rocket.svg')],
    ['blockchain', require('app/assets/icons/blockchain.svg')],
    ['shuffle', require('app/assets/icons/shuffle.svg')],    
    ['sorting', require('app/assets/icons/sorting.svg')],
    ['hf/hf1', require('app/assets/icons/hf/hf1.svg')],
    ['hf/hf2', require('app/assets/icons/hf/hf2.svg')],
    ['hf/hf3', require('app/assets/icons/hf/hf3.svg')],
    ['hf/hf4', require('app/assets/icons/hf/hf4.svg')],
    ['hf/hf5', require('app/assets/icons/hf/hf5.svg')],
    ['hf/hf6', require('app/assets/icons/hf/hf6.svg')],
    ['hf/hf7', require('app/assets/icons/hf/hf7.svg')],
    ['hf/hf8', require('app/assets/icons/hf/hf8.svg')],
    ['hf/hf9', require('app/assets/icons/hf/hf9.svg')],
    ['hf/hf10', require('app/assets/icons/hf/hf10.svg')],
    ['hf/hf11', require('app/assets/icons/hf/hf11.svg')],
    ['hf/hf12', require('app/assets/icons/hf/hf12.svg')],
    ['hf/hf13', require('app/assets/icons/hf/hf13.svg')],
    ['hf/hf14', require('app/assets/icons/hf/hf14.svg')],
    ['hf/hf15', require('app/assets/icons/hf/hf15.svg')],
    ['hf/hf16', require('app/assets/icons/hf/hf16.svg')],
    ['hf/hf17', require('app/assets/icons/hf/hf17.svg')],
    ['hf/hf18', require('app/assets/icons/hf/hf18.svg')],
    ['hf/hf19', require('app/assets/icons/hf/hf19.svg')],
    ['hf/hf20', require('app/assets/icons/hf/hf20.svg')],
    ['vote', require('app/assets/icons/vote.svg')],
    ['flag', require('app/assets/icons/flag.svg')],
    ['new/vk', require('app/assets/icons/new/vk.svg')],
    ['new/facebook', require('app/assets/icons/new/facebook.svg')],
    ['new/twitter', require('app/assets/icons/new/twitter.svg')],
    ['new/telegram', require('app/assets/icons/new/telegram.svg')],
    ['new/home', require('app/assets/icons/new/home.svg')],
    ['new/blogging', require('app/assets/icons/new/blogging.svg')],
    ['new/comment', require('app/assets/icons/new/comment.svg')],
    ['new/answer', require('app/assets/icons/new/answer.svg')],
    ['new/wallet', require('app/assets/icons/new/wallet.svg')],
    ['new/setting', require('app/assets/icons/new/setting.svg')],
    ['new/logout', require('app/assets/icons/new/logout.svg')],
    ['new/bell', require('app/assets/icons/new/bell.svg')],
    ['new/messenger', require('app/assets/icons/new/messenger.svg')],
    ['new/more', require('app/assets/icons/new/more.svg')],
    ['new/like', require('app/assets/icons/new/like.svg')],
    ['new/upvote', require('app/assets/icons/new/upvote.svg')],
    ['new/downvote', require('app/assets/icons/new/downvote.svg')],
    ['new/add', require('app/assets/icons/new/add.svg')],
    ['new/search', require('app/assets/icons/new/search.svg')],
    ['new/wikipedia', require('app/assets/icons/new/wikipedia.svg')],
    ['new/envelope', require('app/assets/icons/new/envelope.svg')],
    ['new/monitor', require('app/assets/icons/new/monitor.svg')],
    ['new/mention', require('app/assets/icons/new/mention.svg')],
    ['editor/plus-18', require('app/assets/icons/editor/plus-18.svg')],
    ['editor/visible', require('app/assets/icons/editor/visible.svg')],
    ['editor/coin', require('app/assets/icons/editor/coin.svg')],
    ['editor/share', require('app/assets/icons/editor/share.svg')],
    ['editor/info', require('app/assets/icons/editor/info.svg')],
    ['editor/plus', require('app/assets/icons/editor/plus.svg')],
    ['editor/cross', require('app/assets/icons/editor/cross.svg')],
    ['editor/eye', require('app/assets/icons/editor/eye.svg')],
    ['editor/k', require('app/assets/icons/editor/k.svg')],
    ['editor-toolbar/bold', require('app/assets/icons/editor-toolbar/bold.svg')],
    ['editor-toolbar/italic', require('app/assets/icons/editor-toolbar/italic.svg')],
    ['editor-toolbar/header', require('app/assets/icons/editor-toolbar/header.svg')],
    ['editor-toolbar/strike', require('app/assets/icons/editor-toolbar/strike.svg')],
    ['editor-toolbar/link', require('app/assets/icons/editor-toolbar/link.svg')],
    ['editor-toolbar/quote', require('app/assets/icons/editor-toolbar/quote.svg')],
    ['editor-toolbar/bullet-list', require('app/assets/icons/editor-toolbar/bullet-list.svg')],
    ['editor-toolbar/number-list', require('app/assets/icons/editor-toolbar/number-list.svg')],
    ['editor-toolbar/picture', require('app/assets/icons/editor-toolbar/picture.svg')],
    ['editor-toolbar/video', require('app/assets/icons/editor-toolbar/video.svg')],
    ['editor-toolbar/search', require('app/assets/icons/editor-toolbar/search.svg')],
    ['ionicons/happy-outline', require('app/assets/icons/ionicons/happy-outline.svg')],
    ['ionicons/image-outline', require('app/assets/icons/ionicons/image-outline.svg')],
    ['ionicons/lock-closed-outline', require('app/assets/icons/ionicons/lock-closed-outline.svg')],
    ['ionicons/lock-open-outline', require('app/assets/icons/ionicons/lock-open-outline.svg')],
    ['ionicons/trash-outline', require('app/assets/icons/ionicons/trash-outline.svg')],
    ['notification/comment', require('app/assets/icons/notification/comment.svg')],
    ['notification/donate', require('app/assets/icons/notification/donate.svg')],
    ['notification/transfer', require('app/assets/icons/notification/transfer.svg')],
    ['notification/mention', require('app/assets/icons/notification/mention.svg')],
    ['notification/message', require('app/assets/icons/notification/message.svg')],
    ['notification/order', require('app/assets/icons/notification/order.svg')],
]);

const rem_sizes = {
    '0_75x': '0.75',
    '0_95x': '0.95',
    '1x': '1.12',
    '1_25x': '1.25',
    '1_5x': '1.5',
    '1_75x': '1.75',
    '2x': '2',
    '3x': '3.45',
    '4x': '4.60',
    '5x': '5.75',
    '10x': '10.0',
};

export default class Icon extends React.PureComponent {
    static propTypes = {
        name: PropTypes.string.isRequired,
        size: PropTypes.oneOf([
            '0_75x',
            '0_95x',
            '1x',
            '1_25x',
            '1_5x',
            '1_75x',
            '2x',
            '3x',
            '4x',
            '5x',
            '10x',
        ]),
    };

    render() {
        const { name, size, className } = this.props;
        let classes = 'Icon ' + name;
        let style;

        if (size) {
            classes += ' Icon_' + size;
            style = { width: `${rem_sizes[size]}rem` };
        }

        if (className) {
            classes += ' ' + className;
        }

        const passProps = { ...this.props };
        delete passProps.name;
        delete passProps.size;
        delete passProps.className;

        return (
            <span
                {...passProps}
                className={classes}
                style={style}
                dangerouslySetInnerHTML={{ __html: icons.get(name) }}
            />
        );
    }
}
