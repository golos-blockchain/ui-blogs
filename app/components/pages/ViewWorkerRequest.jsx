import React from 'react';
import golos from 'golos-classic-js';
import tt from 'counterpart';
import { connect } from 'react-redux';
import transaction from 'app/redux/Transaction';
import Button from 'app/components/elements/Button';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import Author from 'app/components/elements/Author';
import PercentSelect from 'app/components/elements/PercentSelect';
import PagedDropdownMenu from 'app/components/elements/PagedDropdownMenu';
import Icon from 'app/components/elements/Icon';
import { formatDecimal, formatAsset, ERR, assetToLong } from 'app/utils/ParsersAndFormatters';

class ViewWorkerRequest extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      myPlanningVote: 10000,
      votes: [],
      vote_list_page: 0,
      preloading: true
    };
  }

  async componentDidMount() {
    const { author, permlink, request } = this.props;
    const query = {
      limit: 1,
      start_author: author,
      start_permlink: permlink
    };
    this.setState({
      preloading: false,
      myPlanningVote: (request && request.myVote) ? Math.abs(request.myVote.vote_percent) : 10000
    });
  }

  componentWillUnmount() {
  }

  deleteMe = (event) => {
    event.preventDefault();
    const { auth } = this.props;
    const { request } = this.props;

    golos.broadcast.workerRequestDelete(auth.posting_key, request.post.author, request.post.permlink, [],
      (err, result) => {
        if (err) {
          alert(ERR(err, 'worker_request_delete'));
          return;
        }
        this.setState({
          request: {post: {title: "Loading..."}, required_amount_min: '0.000 GOLOS', required_amount_max: '0.000 GOLOS' }
        }, () => {
          this.props.hider('deleted');
        });
      });
  }

  editMe = (event) => {
    event.preventDefault();
    this.props.hider('edit');
  }

  onPlanningVote = (event) => {
    this.setState({
      myPlanningVote: event.target.value
    });
  }

  setVote = (vote_percent) => {
    const { auth, request } = this.props;
    const { author, permlink } = request.post;
    this.props.voteWorkerRequest({author, permlink, vote_percent, accountName: auth.account});
    this.setState({
      vote_list_page: 0
    });
  }

  upVote = () => {
    const { request } = this.props;
    const { myPlanningVote } = this.state;
    if (request.myVote && request.myVote.vote_percent > 0) {
      this.setVote(0);
      return;
    }
    this.setVote(parseInt(myPlanningVote));
  }

  downVote = () => {
    const { request } = this.props;
    const { myPlanningVote } = this.state;
    if (request.myVote && request.myVote.vote_percent < 0) {
      this.setVote(0);
      return;
    }
    this.setVote(-myPlanningVote);
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

  render() {
    const { auth, request, approve_min_percent } = this.props;
    const { vote_list_page, myPlanningVote, preloading } = this.state;

    if (preloading || !request) {
        return (<div>Загрузка...</div>);
    }

    let vote_end = null;
    if (request.state === 'created') {
      vote_end = (<span>{tt('workers.end_of_voting')}: <TimeAgoWrapper date={request.vote_end_time} altText="окончено" /></span>);
    }

    let rshares_pct = parseInt(request.stake_rshares * 100 / request.stake_total);

    let global_rshares_pct = (parseFloat(request.stake_total) * 100 / assetToLong(this.props.total_vesting_shares)).toFixed(2);

    let min_amount = parseFloat(request.required_amount_min.split(" ")[0]);
    let max_amount = parseFloat(request.required_amount_max.split(" ")[0]);
    let pend = max_amount * rshares_pct / 100;
    let pending_amount = formatDecimal(pend, 0, false, ' ')[0];
    let pending_title = "Если на момент окончания голосования будет набран мин. % поддержки от общей СГ и\nрасчётная сумма заявки выше мин. суммы запрашиваемой воркером";

    let progress_bar_text = pending_amount + ' ' + request.required_amount_min.split(' ')[1] + ' (' + rshares_pct + '%)';

    let upvotes = request.upvotes;
    let downvotes = request.downvotes;

    let modified_info = null;
    if (request.modified !== '1970-01-01T00:00:00') {
      modified_info = (
        <span>&nbsp;(изменено <TimeAgoWrapper date={request.modified} />)</span>
      );
    }

    let edit_button = null;
    if (request.state === 'created' && upvotes === 0 && downvotes === 0) {
      edit_button = (<a onClick={this.editMe}>Изменить</a>);
    }

    let author_menu = null;
    if (request.post.author === auth.account) {
      author_menu = (
        <div className="Request__Footer_right">
          {edit_button}
          &nbsp;
          <a onClick={this.deleteMe}>Удалить</a>
        </div>
      );
    }
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

    return(
      <div>
        <h5><a target="_blank" href={"/@" + request.post.author + "/" + request.post.permlink} rel="noopener noreferrer"><Icon name="extlink" size="1_5x" /> 
          {request.post.title}
        </a></h5>
        <hr/>
        <p>
          {tt('workers.author_proposal')}: <Author author={request.post.author} /><br/>
          {tt('workers.recipient_funds')}: <Author author={request.worker} />
        </p>
        <p>
          {tt('workers.requested_amount')}: <b>{formatAsset(request.required_amount_max)}</b><br/>
          {tt('workers.minimum_amount')}: {formatAsset(request.required_amount_min)}<br/>
          {tt('workers.payment_GP')}: {request.vest_reward ? tt('g.yes') : tt('g.no')}
        </p>
        <p>
          {tt('workers.status_proposal')}: {tt("workers."+request.state)}<br/>
          {vote_end}
        </p>
        <p style={{marginBottom: '-0rem'}}>
          {tt('workers.percentage_voted_GP')}: <b className={ (global_rshares_pct >= (approve_min_percent / 100)) ? 'Workers__green' : 'Workers__red' }>{global_rshares_pct} / {approve_min_percent / 100}%</b><br/>
          <span title={pending_title}>{tt('workers.estimated_amount')}: <Icon name="info_o" /></span>
        </p>
        <div style={{marginBottom: '1rem'}}>
          <div className={'Workers__progressbar ' + ((pend >= min_amount) ? 'Workers__green_bg' : 'Workers__red_bg')} style={{ width: Math.abs(rshares_pct) + '%' }}>{(Math.abs(rshares_pct) >= 40) ? progress_bar_text : '\xa0'}</div>
          <div className="Workers__progressbar Workers__gray_bg" style={{ width: 100 - Math.abs(rshares_pct) + '%' }}>{(Math.abs(rshares_pct) < 40) ? progress_bar_text : '\xa0'}</div>
        </div>
        <div>
          <div className="Request__Footer_left">
            <TimeAgoWrapper date={request.created} />&nbsp;<Author author={request.post.author} />{modified_info}
            <div>
              <PercentSelect className="inline" value={myPlanningVote} disabled={request.myVote} onChange={this.onPlanningVote} />&nbsp;
              &nbsp;
              <Button round="true" type={(request.myVote && request.myVote.vote_percent > 0) ? "primary" : "secondary"} onClick={this.upVote}><Icon name="new/upvote" /> ({upvotes})</Button>
              &nbsp;
              <Button round="true" type={(request.myVote && request.myVote.vote_percent < 0) ? "primary" : "secondary"} onClick={this.downVote}><Icon name="new/downvote" /> ({downvotes})</Button>
              &nbsp;
              <PagedDropdownMenu className="VoteList above" items={vote_list} selected={(upvotes+downvotes) + ' ' + tt('workers.votes')} el="span" />
            </div>
          </div>
          {author_menu}
        </div>
      </div>
    );
  }
}

export default connect(
    (state, props) => {
        const cprops = state.global.get('cprops');
        const approve_min_percent = cprops ? cprops.get('worker_request_approve_min_percent') : 100
        const url = props.author + '/' + props.permlink;
        const req = state.global.get('worker_requests').get(url)
        const request = req ? req.toJS() : null
        const gprops = state.global.get('props')
        const total_vesting_shares = gprops ? gprops.get('total_vesting_shares') : '1000.000000 GESTS';
                
        return {
          approve_min_percent,
          total_vesting_shares,
          request
        };
    },
    dispatch => ({
        voteWorkerRequest: ({author, permlink, vote_percent, accountName}) => {
            dispatch(transaction.actions.broadcastOperation({
                type: 'worker_request_vote',
                operation: {voter: accountName, author, permlink, vote_percent}                 
            }))
        },
    })
)(ViewWorkerRequest);