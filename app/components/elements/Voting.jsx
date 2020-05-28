import React from 'react';
import PropTypes from 'prop-types'
import { connect } from 'react-redux';
import transaction from 'app/redux/Transaction';
import user from 'app/redux/User';
import Slider from 'react-rangeslider';
import Icon from 'app/components/elements/Icon';
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate';
import { parsePayoutAmount } from 'app/utils/ParsersAndFormatters';
import DropdownMenu from 'app/components/elements/DropdownMenu';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import FoundationDropdown from 'app/components/elements/FoundationDropdown';
import CloseButton from 'react-foundation-components/lib/global/close-button';
import tt from 'counterpart';
import LocalizedCurrency, { localizedCurrency } from 'app/components/elements/LocalizedCurrency';
import { DEBT_TICKER } from 'app/client_config';
import CalculatePayout from 'shared/CalculatePayout.js'

const MAX_VOTES_DISPLAY = 20;
const VOTE_WEIGHT_DROPDOWN_THRESHOLD = 1.0 * 1000.0 * 1000.0;


class Voting extends React.Component {
    static propTypes = {
        // HTML properties
        post: PropTypes.string.isRequired,
        flag: PropTypes.bool,
        showList: PropTypes.bool,

        // Redux connect properties
        vote: PropTypes.func.isRequired,
        author: PropTypes.string, // post was deleted
        permlink: PropTypes.string,
        username: PropTypes.string,
        is_comment: PropTypes.bool,
        active_votes: PropTypes.object,
        loggedin: PropTypes.bool,
        post_obj: PropTypes.object,
        net_vesting_shares: PropTypes.number,
        vesting_shares: PropTypes.number,
        voting: PropTypes.bool,
    };

    static defaultProps = {
        showList: true,
        flag: false
    };

    constructor(props) {
        super(props);
        this.state = {
          xchangePair: 0,
          showWeight: false,
          showWeightDown: false,
          myVote: null,
          weight: 10000
        };

        this.voteUp = e => {
            e.preventDefault();
            this.voteUpOrDown(true)
            if (this.state.showWeight) this.setState({showWeight: false});
        };
        this.voteDown = e => {
            e.preventDefault();
            this.voteUpOrDown(false)
            if (this.state.showWeightDown) this.setState({showWeightDown: false});
        };
        this.voteUpOrDown = (up) => {
            if(this.props.voting) return;
            this.setState({votingUp: up, votingDown: !up});
            const {myVote} = this.state;
            const {author, permlink, username, is_comment} = this.props;
            if (this.props.net_vesting_shares > VOTE_WEIGHT_DROPDOWN_THRESHOLD) {
                localStorage.setItem('voteWeight' + (up ? '' : 'Down') + '-'+username+(is_comment ? '-comment' : ''),
                    this.state.weight);
            }
            // already voted Up, remove the vote
            const weight = up ? (myVote > 0 ? 0 : this.state.weight) : (myVote < 0 ? 0 : -1 * this.state.weight);
            this.props.vote(weight, {author, permlink, username, myVote})
        };

        this.handleWeightChange = weight => {
            this.setState({weight})
        };

        this.toggleWeightUp = e => {
            e.preventDefault();
            this.toggleWeightUpOrDown(true)
            this.setState({showWeight: !this.state.showWeight})
        };
        this.toggleWeightDown = e => {
            e.preventDefault();
            this.toggleWeightUpOrDown(false)
            this.setState({showWeightDown: !this.state.showWeightDown})
        };
        this.toggleWeightUpOrDown = up => {
            const {username, is_comment} = this.props;
            // Upon opening dialog, read last used weight (this works accross tabs)
            if(! this.state.showWeight) {
                localStorage.removeItem('vote_weight'); // deprecated. remove this line after 8/31
                const saved_weight = localStorage.getItem('voteWeight' + (up ? '' : 'Down') + '-'+username+(is_comment ? '-comment' : ''));
                this.setState({weight: saved_weight ? parseInt(saved_weight, 10) : 10000});
            }
        };
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'Voting')
    }

    componentDidMount() {
        const {username, active_votes} = this.props;
        this._checkMyVote(username, active_votes)

        const xchangePair = localStorage.getItem('xchange.pair') || 0;
        this.setState({ xchangePair });
    }

    componentWillReceiveProps(nextProps) {
        const {username, active_votes} = nextProps;
        this._checkMyVote(username, active_votes)
    }

    _checkMyVote(username, active_votes) {
        if (username && active_votes) {
            const vote = active_votes.find(el => el.get('voter') === username);
            // weight warning, the API may send a string or a number (when zero)
            if(vote) this.setState({myVote: parseInt(vote.get('percent') || 0, 10)})
        }
    }

    render() {
        const {active_votes, showList, voting, flag, net_vesting_shares, is_comment, post_obj} = this.props;
        const {username} = this.props;
        const {votingUp, votingDown, showWeight, showWeightDown, weight, myVote} = this.state;
        if(flag && !username) return null

        const votingUpActive = voting && votingUp;
        const votingDownActive = voting && votingDown;

        let downVote;
        if (true) {
            const down = <Icon name={votingDownActive ? 'empty' : 'chevron-down-circle'} />;
            const classDown = 'Voting__button Voting__button-down' + (myVote < 0 ? ' Voting__button--downvoted' : '') + (votingDownActive ? ' votingDown' : '');

            const flagClickAction = myVote === null || myVote === 0 ? this.toggleWeightDown : this.voteDown

            const dropdown = <FoundationDropdown show={showWeightDown} onHide={() => this.setState({showWeightDown: false})}>
                <div className="Voting__adjust_weight_down row align-middle collapse">
                    <a href="#" onClick={this.voteDown} className="columns small-2 confirm_weight" title={tt('g.flag')}><Icon size="2x" name="chevron-down-circle" /></a>
                    <div className="columns small-2 weight-display">- {weight / 100}%</div>
                    <Slider min={100} max={10000} step={100} value={weight} className="columns small-6" onChange={this.handleWeightChange} />
                    <CloseButton className="columns small-2 Voting__adjust_weight_close" onClick={() => this.setState({showWeightDown: false})} />
                </div>
            </FoundationDropdown>;

//            const dropdown = <FoundationDropdown show={showWeight} onHide={() => this.setState({showWeight: false})} className="Voting__adjust_weight_down">
//                {(myVote == null || myVote === 0) && net_vesting_shares > VOTE_WEIGHT_DROPDOWN_THRESHOLD &&
//                    <div>
//                        <div className="weight-display">- {weight / 100}%</div>
//                        <Slider min={100} max={10000} step={100} value={weight} onChange={this.handleWeightChange} />
//                    </div>
//                }
//                <CloseButton onClick={() => this.setState({showWeight: false})} />
//                <div className="clear Voting__about-flag">
//                    <p>{ABOUT_FLAG}</p>
//                    <a href="#" onClick={this.voteDown} className="button outline" title={tt('g.flag')}>{tt('g.flag')}</a>
//                </div>
//            </FoundationDropdown>;


            downVote = <span className={classDown}>
                    {votingDownActive ? down : <a href="#" onClick={flagClickAction} title={tt('g.flag')}>{down}</a>}
                    {dropdown}
                </span>
        }

        const total_votes = post_obj.getIn(['stats', 'total_votes']);

        const cashout_time = post_obj.get('cashout_time');
        const max_payout = parsePayoutAmount(post_obj.get('max_accepted_payout'));
        const pending_payout = parsePayoutAmount(post_obj.get('pending_payout_value'));
        const promoted = parsePayoutAmount(post_obj.get('promoted'));
        const total_author_payout = parsePayoutAmount(post_obj.get('total_payout_value'));

        const payout = CalculatePayout(post_obj)

        const payout_limit_hit = payout.total >= max_payout;
        // Show pending payout amount for declined payment posts
  
        const up = <Icon name={votingUpActive ? 'empty' : 'chevron-up-circle'} />;
        const classUp = 'Voting__button Voting__button-up' + (myVote > 0 ? ' Voting__button--upvoted' : '') + (votingUpActive ? ' votingUp' : '');
        // There is an "active cashout" if: (a) there is a pending payout, OR (b) there is a valid cashout_time AND it's NOT a comment with 0 votes.
        const cashout_active = pending_payout > 0 || (cashout_time.indexOf('1969') !== 0 && !(is_comment && total_votes == 0));
        const payoutItems = [];

        let donates = post_obj.get('donates');
        if (donates !== undefined) {
            donates = donates.toJS();
            donates.forEach((donate) => {
                payoutItems.push({value: donate.from + ' ' + donate.amount});
            });
        }

                //<LocalizedCurrency gold={(promoted > 0)} amount={max_payout} //className={payout.isDeclined ? 'strikethrough' : ''} />
        const payoutEl = <DropdownMenu el="div" items={payoutItems}>
            <span style={payout_limit_hit ? {opacity: '0.33'} : {}}>
                Донаты
                {payoutItems.length > 0 && <Icon name="dropdown-arrow" />}
            </span>
        </DropdownMenu>;

        let voters_list = null;
        if (showList && total_votes > 0 && active_votes) {
            const avotes = active_votes.toJS();
            avotes.sort((a, b) => Math.abs(parseInt(a.rshares)) > Math.abs(parseInt(b.rshares)) ? -1 : 1)
            let voters = [];
            for( let v = 0; v < avotes.length && voters.length < MAX_VOTES_DISPLAY; ++v ) {
                const {percent, voter} = avotes[v]
                const sign = Math.sign(percent)
                const voterPercent= percent / 100 + '%';
                if(sign === 0) continue
                voters.push({value: (sign > 0 ? '+ ' : '- ') + voter, link: '/@' + voter, data: voterPercent})
            }
            if (total_votes > voters.length) {
                voters.push({value: <span>&hellip; {tt('g.and')} {(total_votes - voters.length)} {tt('g.more')}</span>});
            }
            voters_list = <DropdownMenu selected={tt('votesandcomments_jsx.vote_count', {count: total_votes})} className="Voting__voters_list" items={voters} el="div" />;
        }

        let voteUpClick = this.voteUp;
        let dropdown = null;
        if (myVote <= 0 && net_vesting_shares > VOTE_WEIGHT_DROPDOWN_THRESHOLD) {
            voteUpClick = this.toggleWeightUp;
            dropdown = <FoundationDropdown show={showWeight} onHide={() => this.setState({showWeight: false})}>
                <div className="Voting__adjust_weight row align-middle collapse">
                    <a href="#" onClick={this.voteUp} className="columns small-2 confirm_weight" title={tt('g.upvote')}><Icon size="2x" name="chevron-up-circle" /></a>
                    <div className="columns small-2 weight-display">{weight / 100}%</div>
                    <Slider min={100} max={10000} step={100} value={weight} className="columns small-6" onChange={this.handleWeightChange} />
                    <CloseButton className="columns small-2 Voting__adjust_weight_close" onClick={() => this.setState({showWeight: false})} />
                </div>
            </FoundationDropdown>;
        }
        return (
            <span className="Voting">
                <span className="Voting__inner">
                    <span className={classUp}>
                        {votingUpActive ? up : <a href="#" onClick={voteUpClick} title={tt(myVote > 0 ? 'g.remove_vote' : 'g.upvote')}>{up}</a>}
                        {dropdown}
                    </span>
                    {downVote}
                    {payoutEl}
                </span>
                {voters_list}
            </span>
        );
    }
}

export default connect(
    (state, ownProps) => {
        const post = state.global.getIn(['content', ownProps.post])
        if (!post) return ownProps
        const author = post.get('author')
        const permlink = post.get('permlink')
        const active_votes = post.get('active_votes')
        const is_comment = post.get('parent_author') !== ''

        const current_account = state.user.get('current')
        const username = current_account
            ? current_account.get('username')
            : null;
        const vesting_shares = current_account
            ? current_account.get('vesting_shares')
            : 0.0;
        const delegated_vesting_shares = current_account
            ? current_account.get('delegated_vesting_shares')
            : 0.0;
        const received_vesting_shares = current_account
            ? current_account.get('received_vesting_shares')
            : 0.0;
        const net_vesting_shares = vesting_shares - delegated_vesting_shares + received_vesting_shares;
        const voting = state.global.get(`transaction_vote_active_${author}_${permlink}`)

        return {
            post: ownProps.post,
            flag: ownProps.flag,
            showList: ownProps.showList,
            author,
            permlink,
            username,
            active_votes,
            net_vesting_shares,
            vesting_shares,
            is_comment,
            post_obj: post,
            loggedin: username != null,
            voting,
        }
    },

    (dispatch) => ({
        vote: (weight, {author, permlink, username, myVote}) => {
            const confirm = () => {
                if(myVote == null) return
                const t = tt('voting_jsx.we_will_reset_curation_rewards_for_this_post')
                if(weight === 0) return tt('voting_jsx.removing_your_vote') + t
                if(weight > 0) return tt('voting_jsx.changing_to_an_upvote') + t
                if(weight < 0) return tt('voting_jsx.changing_to_a_downvote') + t
                return null
            }
            dispatch(transaction.actions.broadcastOperation({
                type: 'vote',
                operation: {voter: username, author, permlink, weight,
                    __config: {title: weight < 0 ? tt('voting_jsx.confirm_flag') : null},
                },
                confirm,
                successCallback: () => dispatch(user.actions.getAccount())                   
            }))
        },
    })
)(Voting)
