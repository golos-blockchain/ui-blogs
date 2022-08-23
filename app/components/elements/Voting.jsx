import React from 'react';
import PropTypes from 'prop-types'
import { connect } from 'react-redux';
import transaction from 'app/redux/Transaction';
import user from 'app/redux/User';
import Slider from '@appigram/react-rangeslider';
import Confetti from 'react-dom-confetti'
import CloseButton from 'react-foundation-components/lib/global/close-button'
import tt from 'counterpart'
import { Asset } from 'golos-lib-js/lib/utils'

import { checkAllowed, AllowTypes } from 'app/utils/Allowance'
import Icon from 'app/components/elements/Icon';
import shouldComponentUpdate from 'app/utils/shouldComponentUpdate';
import DropdownMenu from 'app/components/elements/DropdownMenu';
import OldPagedDropdownMenu from 'app/components/elements/OldPagedDropdownMenu';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import FoundationDropdown from 'app/components/elements/FoundationDropdown';
import { CONFETTI_CONFIG, LIQUID_TICKER } from 'app/client_config';

const MAX_VOTES_DISPLAY = 20;

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
        voting: PropTypes.bool,
    };

    static defaultProps = {
        showList: true,
        flag: false
    };

    constructor(props) {
        super(props);
        this.state = {
          showWeightDown: false,
          myVote: null,
          weight: 10000,
          voteListPage: 0,
        };

        this.getAllowType = () => {
            const { post_obj } = this.props
            const cashoutTime = post_obj.get('cashout_time')
            return (!cashoutTime || cashoutTime.startsWith('19')) ?
                AllowTypes.voteArchived : AllowTypes.vote
        }
        this.voteUp = e => {
            e.preventDefault()
            const { myVote } = this.state
            if (!this.props.loggedin) {
                this.props.showLogin()
                return
            }
            const { author, permlink, } = this.props
            this.props.showDonate(author, permlink, this.props.is_comment, myVote,
                this.getAllowType())
        }
        this.voteDown = e => {
            e.preventDefault();
            this.voteUpOrDown(false)
            if (this.state.showWeightDown) this.setState({showWeightDown: false});
        };
        this.voteUpOrDown = (up) => {
            if(this.props.voting) return;
            this.setState({votingUp: up, votingDown: !up});
            const {myVote} = this.state;
            const {author, permlink, username, is_comment } = this.props;
            if (myVote <= 0 && !up) {
                localStorage.removeItem('vote_weight'); // deprecated
                localStorage.setItem('voteWeightDown-'+username+(is_comment ? '-comment' : ''),
                    this.state.weight)
            }
            // already voted Up, remove the vote
            const weight = up ? (myVote > 0 ? 0 : this.state.weight) : (myVote < 0 ? 0 : -1 * this.state.weight);
            this.props.vote(weight, {
                author, permlink,
                username, myVote,
                allowType: this.getAllowType()
            })
        };

        this.handleWeightChange = weight => {
            this.setState({weight})
        };

        this.toggleWeightDown = e => {
            e.preventDefault();
            // Upon opening dialog, read last used weight
            if (!this.state.showWeight) {
                const {username, is_comment} = this.props
                const savedWeight = localStorage.getItem('voteWeightDown' + '-'+username+(is_comment ? '-comment' : ''))
                this.setState({weight: savedWeight ? parseInt(savedWeight, 10) : 10000})
            }
            this.setState({showWeightDown: !this.state.showWeightDown})
        };
        this.shouldComponentUpdate = shouldComponentUpdate(this, 'Voting')
    }

    componentDidMount() {
        const {username, active_votes} = this.props;
        this._checkMyVote(username, active_votes)
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
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

    nextVoteListPage = () => {
        this.setState({
          voteListPage: this.state.voteListPage + 1,
        });
    }

    prevVoteListPage = () => {
        if (this.state.voteListPage == 0) return;
        this.setState({
          voteListPage: this.state.voteListPage - 1,
        });
    }

    render() {
        const {active_votes, showList, voting, flag, is_comment, post_obj} = this.props;
        const {username} = this.props;
        const {votingUp, votingDown, showWeightDown, weight, myVote, voteListPage} = this.state;
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

            downVote = <span className={classDown}>
                    {votingDownActive ? down : <a href="#" onClick={flagClickAction} title={tt('g.flag')}>{down}</a>}
                    {dropdown}
                </span>
        }

        const total_votes = post_obj.get('from_search') ?
            post_obj.get('net_votes') :
            post_obj.getIn(['stats', 'total_votes'])

        const up = <Icon name={votingUpActive ? 'empty' : 'chevron-up-circle'} />;
        const classUp = 'Voting__button Voting__button-up' + (myVote > 0 ? ' Voting__button--upvoted' : '') + (votingUpActive ? ' votingUp' : '');
        
        let donateItems = [];
        let donateUiaItems = [];
        let donates = post_obj.get('donate_list');
        if (showList && donates !== undefined) {
            donates = donates.toJS();
            let i = 0;
            donates.forEach((donate) => {
                const amount = donate.amount.split(".")[0] + " GOLOS";
                donateItems.push({key: i, value: donate.from, link: '/@' + donate.from, data: amount});
                i++;
            });
        }

        let donates_uia = post_obj.get('donate_uia_list');
        if (showList && donates_uia !== undefined) {
            donates_uia = donates_uia.toJS();
            let i = 0;
            donates_uia.forEach((donate) => {
                const amount = donate.amount.split(".")[0] + " " + donate.amount.split(" ")[1];
                donateUiaItems.push({key: i, value: donate.from, link: '/@' + donate.from, data: amount});
                i++;
            });
        }

        let reward = post_obj.get('mode') === 'archived' ?
            post_obj.get('author_payout_in_golos') :
            post_obj.get('pending_author_payout_in_golos');
        reward = Asset(reward);

        const non_payout = post_obj.get('max_accepted_payout') === '0.000 GBG';

        let donateTitle = undefined;
        if (donateItems.length)
            donateTitle = non_payout ? tt('voting_jsx.payouts_declined') : tt('g.pool_payout_short') + reward;

        let donateSum = Asset(post_obj.get('donates'))
        if (reward.amount !== 0) 
            donateSum = Asset(donateSum.amount + reward.amount, 3, 'GOLOS');

        const donatesEl = <DropdownMenu className="Voting__donates_list" el="div" items={donateItems} title={donateTitle}>
            <Icon size="0_95x" name="tips" />&nbsp;
            <span style={non_payout ? {'text-decoration': 'line-through'} : {}} title={non_payout ? tt('voting_jsx.payouts_declined') : tt('g.pool_payout_short') + reward}>
                {donateSum.toString()}{donateItems.length > 0 && <Icon name="dropdown-arrow" />}
            </span>
        </DropdownMenu>;

        let donatesUiaSum = post_obj.get('donates_uia');
        let donatesUiaEl = null;
        if (donatesUiaSum > 0) donatesUiaEl = <DropdownMenu className="Voting__donates_list" el="div" items={donateUiaItems}>
            <span className="Voting__donates_uia_sum" title={tt('g.uia_rewards')}>
                +&nbsp;{post_obj.get('donates_uia').toString() + " UIA"}
                {donateUiaItems.length > 0 && <Icon name="dropdown-arrow" />}
            </span>
        </DropdownMenu>;

        let voters_list = null;
        let voters = [];    
        if (showList && total_votes > 0 && active_votes) {
            const avotes = active_votes.toJS();
            avotes.sort((a, b) => Math.abs(parseInt(a.rshares)) > Math.abs(parseInt(b.rshares)) ? -1 : 1)
            let has_more_votes = false;
            for( let v = voteListPage*MAX_VOTES_DISPLAY; v < avotes.length; ++v ) {
                if (voters.length >= MAX_VOTES_DISPLAY) {
                    has_more_votes = true;
                    break;
                }
                const {percent, voter} = avotes[v]
                const sign = Math.sign(percent)
                const voterPercent= percent / 100 + '%';
                if(sign === 0) continue
                voters.push({value: (sign > 0 ? '+ ' : '- ') + voter, link: '/@' + voter, data: voterPercent})
            }
            if (voteListPage > 0 || has_more_votes)
            voters.push({value: <span>
              <a className="Voting__votes_pagination" onClick={this.prevVoteListPage}>{voteListPage > 0 ? '< ' + tt('g.back') : ''}</a>
              <a className="Voting__votes_pagination" onClick={has_more_votes ? this.nextVoteListPage : null}>{has_more_votes ? tt('g.more_list') + ' >' : ''}</a></span>});
        }

        voters_list = <OldPagedDropdownMenu selected={total_votes.toString()} className="Voting__voters_list" items={voters} el="div" noArrow={true} />;

        return (
            <span className="Voting">
                <Confetti config={CONFETTI_CONFIG} active={post_obj.get('confetti_active')}/>
                <span className="Voting__inner">
                    <span className={classUp}>
                        {votingUpActive ? up : <a href="#" onClick={this.voteUp} title={tt(myVote > 0 ? 'g.remove_vote' : 'g.upvote')}>{up}</a>}
                    </span>
                    {voters_list}
                    {downVote}
                </span>
                {donatesEl}
                {donatesUiaEl}
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
        const voting = state.global.get(`transaction_vote_active_${author}_${permlink}`)

        return {
            post: ownProps.post,
            flag: ownProps.flag,
            showList: ownProps.showList,
            author,
            permlink,
            username,
            active_votes,
            is_comment,
            post_obj: post,
            loggedin: username != null,
            voting,
        }
    },

    (dispatch) => ({
        showLogin: () => {
            dispatch(user.actions.showLogin())
        },
        vote: async (weight, {author, permlink, username, myVote, allowType}) => {
            const blocking = await checkAllowed(username, [],
                null, allowType)
            if (blocking.error) {
                dispatch({
                    type: 'ADD_NOTIFICATION',
                    payload: {
                        message: blocking.error,
                        dismissAfter: 5000,
                    },
                })
                return
            }
            const confirm = () => {
                if (blocking.confirm) return blocking.confirm
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
        showDonate(author, permlink, is_comment, myVote, voteAllowType) {
            const sym = LIQUID_TICKER
            dispatch(user.actions.setDonateDefaults({
                permlink,
                is_comment,
                to: author,
                sym,
                precision: 3,
                myVote: myVote ? Math.max(Math.round(myVote / 100), 0) : myVote,
                voteAllowType
            }))
            dispatch(user.actions.showDonate())
        },
    })
)(Voting)
