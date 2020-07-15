import React from 'react';
import golos from 'golos-classic-js';
import tt from 'counterpart';
import { connect } from 'react-redux';

import Button from 'app/components/elements/Button';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import Author from 'app/components/elements/Author';
import PercentSelect from 'app/components/elements/PercentSelect';
import DropdownMenu from 'app/components/elements/DropdownMenu';
import Icon from 'app/components/elements/Icon';
import { formatDecimal, formatAsset, ERR } from 'app/utils/ParsersAndFormatters';

class ViewWorkerRequest extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      request: {post: {title: "Loading..."}, required_amount_min: '0.000 GOLOS', required_amount_max: '0.000 GOLOS' },
      myPlanningVote: 10000,
      myVote: 0,
      total_vesting_shares: 1,
      votes: [],
      preloading: true
    };
  }

  async componentDidMount() {
    const { author, permlink } = this.props;
    const query = {
      limit: 1,
      start_author: author,
      start_permlink: permlink
    };
    const requests = await golos.api.getWorkerRequestsAsync(query, 'by_created', true);
    if (!requests.length) return;
    let dgp = await golos.api.getDynamicGlobalPropertiesAsync();
    let total_vesting_shares = parseInt(dgp.total_vesting_shares.split(' ')[0].replace('.', ''));
    this.setState({
      request: requests[0],
      preloading: false,
      total_vesting_shares
    }, () => {
      this.loadVotes();
    });
  }

  componentWillUnmount() {
  }

  loadVotes = () => {
    const { author, permlink } = this.props;
    golos.api.getWorkerRequestVotes(author, permlink, '', 20, (err, votes) => {
      if (err) {
        alert(err);
        return;
      }
      this.setState({
        votes
      }, () => {
        this.loadMyVote();
      });
    });
  }

  loadMyVote = () => {
    const { auth, author, permlink } = this.props;
    golos.api.getWorkerRequestVotes(author, permlink, auth.account, 1, (err, myVote) => {
      if (err) {
        alert(err);
        return;
      }
      if (!myVote.length || myVote[0].voter !== auth.account) return;
      this.setState({
        myVote: myVote[0].vote_percent,
        myPlanningVote: Math.abs(myVote[0].vote_percent)
      });
    });
  }

  deleteMe = (event) => {
    event.preventDefault();
    const { auth } = this.props;
    const { request } = this.state;

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

  setVote = (percent) => {
    const { auth } = this.props;
    const { request } = this.state;
    golos.broadcast.workerRequestVote(auth.posting_key, auth.account, request.post.author, request.post.permlink,
      percent, [], (err, result) => {
        if (err) {
          alert(ERR(err, 'worker_request_vote'));
          return;
        }
        this.setState({
          myVote: percent
        });
      });
  }

  upVote = () => {
    const { myVote, myPlanningVote } = this.state;
    if (myVote > 0) {
      this.setVote(0);
      return;
    }
    this.setVote(parseInt(myPlanningVote));
  }

  downVote = () => {
    const { myVote, myPlanningVote } = this.state;
    if (myVote < 0) {
      this.setVote(0);
      return;
    }
    this.setVote(-myPlanningVote);
  }

  render() {
    const { auth, approve_min_percent } = this.props;
    const { request, myVote, myPlanningVote, votes, preloading } = this.state;

    if (preloading) {
        return (<div>Загрузка...</div>);
    }

    let vote_end = null;
    if (request.state === 'created') {
      vote_end = (<span>Окончание голосования: <TimeAgoWrapper date={request.vote_end_time} altText="окончено" /></span>);
    }

    let rshares_pct = parseInt(request.stake_rshares * 100 / request.stake_total);

    let global_rshares_pct = (parseFloat(request.stake_total) * 100 / this.state.total_vesting_shares).toPrecision(4);

    let min_amount = parseFloat(request.required_amount_min.split(" ")[0]);
    let max_amount = parseFloat(request.required_amount_max.split(" ")[0]);
    let pend = max_amount * rshares_pct / 100;
    let pending_amount = formatDecimal(pend, 0, false, ' ')[0];
    let pending_title = "Если будет набран минимальный % поддержки от общей СГ";

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

    let vote_list = votes.map(vote => {
      const { voter, vote_percent } = vote;
      const sign = Math.sign(vote_percent);
      const voterPercent = vote_percent / 100 + '%';
      return {value: (sign > 0 ? '+ ' : '- ') + voter, link: '/@' + voter, data: voterPercent};
    });
    let vote_more = (upvotes+downvotes) - 20;
    if (vote_more > 0) {
      vote_list.push({value: <span>{'...и ещё ' + vote_more}</span>});
    }

    return(
      <div>
        <h5><a target="_blank" href={"/@" + request.post.author + "/" + request.post.permlink} rel="noopener noreferrer"><Icon name="extlink" size="1_5x" /> 
          {request.post.title}
        </a></h5>
        <p>
          Автор заявки: <Author author={request.post.author} /><br/>
          Получатель средств: <Author author={request.worker} />
        </p>
        <p>
          Запрашиваемая сумма: <b>{formatAsset(request.required_amount_max)}</b><br/>
          Минимальная сумма: {formatAsset(request.required_amount_min)}<br/>
          Выплата в Силу Голоса: {request.vest_reward ? "да" : "нет"}
        </p>
        <p>
          Статус заявки: {tt("workers."+request.state)}<br/>
          {vote_end}
        </p>
        <p style={{marginBottom: '-0rem'}}>
          Текущий процент проголосовавшей СГ: <b className={ (global_rshares_pct >= (approve_min_percent / 100)) ? 'Workers__green' : 'Workers__red' }>{global_rshares_pct} / {approve_min_percent / 100}%</b><br/>
          <span title={pending_title}>Расчётная сумма выплаты: <Icon name="info_o" /></span>
        </p>
        <div style={{marginBottom: '1rem'}}>
          <div className={'Workers__progressbar ' + ((pend >= min_amount) ? 'Workers__green_bg' : 'Workers__red_bg')} style={{ width: Math.abs(rshares_pct) + '%' }}>{(Math.abs(rshares_pct) >= 40) ? progress_bar_text : '\xa0'}</div>
          <div className="Workers__progressbar Workers__gray_bg" style={{ width: 100 - Math.abs(rshares_pct) + '%' }}>{(Math.abs(rshares_pct) < 40) ? progress_bar_text : '\xa0'}</div>
        </div>
        <div>
          <div className="Request__Footer_left">
            <TimeAgoWrapper date={request.created} />&nbsp;<Author author={request.post.author} />{modified_info}
            <div>
              <PercentSelect className="inline" value={myPlanningVote} disabled={myVote !== 0} onChange={this.onPlanningVote} />&nbsp;
              &nbsp;
              <Button round="true" type={myVote > 0 ? "primary" : "secondary"} onClick={this.upVote}><Icon name="new/upvote" /> ({upvotes})</Button>
              &nbsp;
              <Button round="true" type={myVote < 0 ? "primary" : "secondary"} onClick={this.downVote}><Icon name="new/downvote" /> ({downvotes})</Button>
              &nbsp;
              <DropdownMenu className="VoteList above" items={vote_list} selected={upvotes+downvotes + " голосов"} el="span" />
            </div>
          </div>
          {author_menu}
        </div>
      </div>
    );
  }
}

export default connect(
    state => {
        const cprops = state.global.get('cprops');
        const approve_min_percent = cprops ? cprops.get('worker_request_approve_min_percent') : 100
        return {
            approve_min_percent
        };
    },
    dispatch => {
        return {
        };
    }
)(ViewWorkerRequest);