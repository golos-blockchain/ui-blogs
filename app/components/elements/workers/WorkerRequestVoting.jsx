import React from 'react'
import Slider from '@appigram/react-rangeslider'
import FoundationDropdown from 'app/components/elements/FoundationDropdown'
import CloseButton from 'react-foundation-components/lib/global/close-button'
import tt from 'counterpart'
import { connect } from 'react-redux';

import transaction from 'app/redux/Transaction';
import Button from 'app/components/elements/Button'
import Icon from 'app/components/elements/Icon'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import OldPagedDropdownMenu from 'app/components/elements/OldPagedDropdownMenu'

class WorkerRequestVoting extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            vote_list_page: 0,
            showUpvoteSelect: false,
            showDownvoteSelect: false,
            upvoteWeight: 100,
            downvoteWeight: 100,
            submitting: false,
        }
    }

    upVote = () => {
        const { request } = this.props;
        if (request.myVote && request.myVote.vote_percent > 0) {
            this.setVote(0);
            return;
        }
        this.setState({
            showUpvoteSelect: true
        })
    }

    downVote = () => {
        const { request } = this.props;
        if (request.myVote && request.myVote.vote_percent < 0) {
            this.setVote(0);
            return;
        }
        this.setState({
            showDownvoteSelect: true
        })
    }

    upVoteAdd = () => {
        const { upvoteWeight } = this.state;
        this.setVote(parseInt(upvoteWeight) * 100);
        this.setState({
            showUpvoteSelect: false
        })
    }

    downVoteAdd = () => {
        const { downvoteWeight } = this.state;
        this.setVote(-1 * parseInt(downvoteWeight) * 100);
        this.setState({
            showDownvoteSelect: false
        })
    }

    setVote = (vote_percent) => {
        const { auth, request } = this.props;
        const { author, permlink } = request.post;
        this.setState({
            submitting: true
        })
        this.props.voteWorkerRequest({
            author, permlink, vote_percent, accountName: auth.account,
            successCallback: () => {
                setTimeout(() => {
                    this.props.fetchState()
                    this.setState({
                        submitting: false,
                        vote_list_page: 0
                    })
                }, 1500)
            },
            errorCallback: (err) => {
                console.error(err)
                this.setState({
                    submitting: false
                })
            }
        })
    }

    nextVoteListPage = () => {
        this.setState({
            vote_list_page: ++this.state.vote_list_page
        });
    }

    prevVoteListPage = () => {
        if (this.state.vote_list_page == 0) return;
        this.setState({
            vote_list_page: --this.state.vote_list_page
        });
    }

    _renderVoteDropdown(show, onHide, value, onChange, type, onClick) {
        const iconName = `chevron-${type}-circle`
        const isDown = type === 'down'
        return (<FoundationDropdown show={show} onHide={onHide}>
            <div className="Voting__adjust_weight row align-middle collapse">
                <a href="#" onClick={onClick} className="columns small-2 confirm_weight" title={tt('g.flag')}>
                    <Icon size="2x" name={iconName} />
                </a>
                <div className="columns small-2 weight-display">{isDown ? '-' : ''}{value}%</div>
                <Slider min={1} max={100} step={1} value={value} className="columns small-6" onChange={onChange} />
                <CloseButton className="columns small-2 Voting__adjust_weight_close" onClick={onHide} />
            </div>
        </FoundationDropdown>)
    }

    render() {
        const { request } = this.props
        const { vote_list_page, submitting } = this.state

        if (submitting) {
            return <LoadingIndicator type='circle' />
        }

        let upvotes = request.upvotes;
        let downvotes = request.downvotes;

        let vote_list = request.votes.map(vote => {
          const { voter, vote_percent } = vote;
          const sign = Math.sign(vote_percent);
          const voterPercent = vote_percent / 100 + '%';
          return {value: (sign > 0 ? '+ ' : '- ') + voter, link: '/@' + voter, data: voterPercent};
        });
        let next_vote_list = vote_list.slice(20*(vote_list_page+1), 20*(vote_list_page+1)+20);
        vote_list = vote_list.slice(20*vote_list_page, 20*vote_list_page+20);

        vote_list.push({value: <span>
          <a className="Workers__votes_pagination" onClick={this.prevVoteListPage}>{vote_list_page > 0 ? '< ' + tt('g.back') : ''}</a>
          <a className="Workers__votes_pagination" onClick={next_vote_list.length > 0 ? this.nextVoteListPage : null}>{next_vote_list.length > 0 ? tt('g.more_list') + ' >' : ''}</a></span>});

        return (<div>
            <div className='WRVoting__button-up'>
                <Button round='true' type={(request.myVote && request.myVote.vote_percent > 0) ? 'primary' : 'secondary'} onClick={this.upVote}><Icon name='new/upvote' /> ({upvotes})</Button>
                {this._renderVoteDropdown(this.state.showUpvoteSelect,
                    () => this.setState({showUpvoteSelect: false}),
                    this.state.upvoteWeight,
                    (weight) => {
                        this.setState({
                            upvoteWeight: weight,
                        })
                    },
                    'up',
                    this.upVoteAdd)}
            </div>
            &nbsp;
            <div className='WRVoting__button-down'>
                <Button round='true' type={(request.myVote && request.myVote.vote_percent < 0) ? 'primary' : 'secondary'} onClick={this.downVote}><Icon name='new/downvote' /> ({downvotes})</Button>
                {this._renderVoteDropdown(this.state.showDownvoteSelect,
                    () => this.setState({showDownvoteSelect: false}),
                    this.state.downvoteWeight,
                    (weight) => {
                        this.setState({
                            downvoteWeight: weight,
                        })
                    },
                    'down',
                    this.downVoteAdd)}
            </div>
            &nbsp;
            <OldPagedDropdownMenu className='VoteList above' items={vote_list} selected={(upvotes+downvotes) + ' ' + tt('workers.votes')} el='span' />
        </div>)
    }
}

export default connect(
    (state, props) => {
        return {
        };
    },
    dispatch => ({
        fetchState: () => {
            const pathname = window.location.pathname;
            dispatch({type: 'FETCH_STATE', payload: {pathname}});
        },
        voteWorkerRequest: ({author, permlink, vote_percent, accountName,
                successCallback, errorCallback}) => {
            dispatch(transaction.actions.broadcastOperation({
                type: 'worker_request_vote',
                operation: {voter: accountName, author, permlink, vote_percent},
                successCallback, errorCallback,
            }))
        },
    })
)(WorkerRequestVoting);
