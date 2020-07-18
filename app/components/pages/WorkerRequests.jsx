import React from 'react';
import PropTypes from 'prop-types'
import golos from 'golos-classic-js';
import tt from 'counterpart';
import CloseButton from 'react-foundation-components/lib/global/close-button';
import Reveal from 'react-foundation-components/lib/global/reveal';
import { connect } from 'react-redux';
import {Link} from 'react-router';
import { FormattedPlural } from 'react-intl';

import Icon from 'app/components/elements/Icon';
import Button from 'app/components/elements/Button';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import Tooltip from 'app/components/elements/Tooltip';
import Author from 'app/components/elements/Author';
import DropdownMenu from 'app/components/elements/DropdownMenu';
import { formatAsset, formatDecimal, longToAsset, ERR } from 'app/utils/ParsersAndFormatters';
import { vestsToSteem, numberWithCommas } from 'app/utils/StateFunctions';

import AddEditWorkerRequest from './AddEditWorkerRequest';
import ViewWorkerRequest from './ViewWorkerRequest';
import WorkerFunds from 'app/components/elements/WorkerFunds';
import "./WorkerRequests.scss";

class WorkerRequests extends React.Component {
  static propTypes = {
      routeParams: PropTypes.object,
      gprops: PropTypes.object,
      account: PropTypes.string,
      posting_key: PropTypes.object,
      approve_min_percent: PropTypes.number,
  };

  state = {
      results: [],
      start_author: null,
      start_permlink: null,
      select_author: '',
      select_authors: [],
      select_states: ['created'],
      selected_state: 'Открытые заявки',
      show_load_more: false,
      showCreateRequest: false,
      showViewRequest: false,
      current_author: '',
      current_permlink: '',
      total_vesting_shares: 1
    };

  componentDidMount() {
    let new_state = {
      select_states: ['created'],
      selected_state: 'Открытые заявки',
      showCreateRequest: false,
      showViewRequest: false,
      current_author: '',
      current_permlink: ''
    }
    const {routeParams} = this.props;
    if (routeParams.state) {
      if (routeParams.state === 'closed') {
        new_state.selected_state = 'Закрытые';
        new_state.select_states = ['payment_complete', 'closed_by_author', 'closed_by_expiration', 'closed_by_voters'];
      } else {
        new_state.select_states = [routeParams.state];
      }
      if (routeParams.state === 'payment') {
        new_state.selected_state = 'Выплачиваемые';
      }
    }
    if (routeParams.slug) {
      new_state.showViewRequest = true;
      new_state.current_author = routeParams.username;
      new_state.current_permlink = routeParams.slug;
    } else if (routeParams.username === '.add') {
      new_state.showCreateRequest = true;
    }
    let total_vesting_shares = this.props.gprops.get('total_vesting_shares');
    total_vesting_shares = parseInt(total_vesting_shares.split(' ')[0].replace('.', ''));
    this.setState({
      total_vesting_shares,
      ...new_state
    }, () => {
      this.loadMore();
    });
  }

  componentWillUnmount() {
  }

  loadMore = async () => {
    const { start_author, start_permlink, select_authors, select_states } = this.state;
    let query = {
      limit: 10,
      start_author,
      start_permlink,
      select_authors,
      select_states
    };
    if (select_authors.length) {
      let accs = await golos.api.getAccounts([start_author]);
      if (!accs.length) {
        alert('Неверное имя автора.');
        return;
      }
    }
    let results = await golos.api.getWorkerRequests(query, 'by_created', true);
    if (!results.length) {
      this.setState({
        show_load_more: false
      });
      return;
    }
    if (start_author) results = results.slice(1);
    const last = results.slice(-1)[0];
    for (let req of results) {
      req.upvote_total = vestsToSteem(longToAsset(req.upvote_total, 'VESTS', 6), this.props.gprops.toJS());
      const stake_total = vestsToSteem(longToAsset(req.stake_total, 'VESTS', 6), this.props.gprops.toJS());
      req.downvote_total = stake_total - req.upvote_total;
      req.upvote_percent = parseInt(req.upvote_total / stake_total * 100);
      req.downvote_percent = 100 - req.upvote_percent;
      req.upvote_total = numberWithCommas((req.upvote_total + '').split('.')[0]);
      req.downvote_total = numberWithCommas((req.downvote_total + '').split('.')[0]);
    }
    this.setState({
      results: this.state.results.concat(results),
      start_author: last.post.author,
      start_permlink: last.post.permlink
    }, async () => {
        query = {
          limit: 10,
          start_author: last.post.author,
          start_permlink: last.post.permlink,
          select_authors,
          select_states
        };
        let results2 = await golos.api.getWorkerRequests(query, 'by_created', true);
        this.setState({
          show_load_more: (results2.length > 1)
        });
    });
  }

  handleSearchAuthor = (event) => {
    this.setState({select_author: event.target.value});
  }

  searchByAuthor = (event) => {
    const { select_author } = this.state;
    event.preventDefault();
    this.setState({
      results: [],
      start_author: null,
      start_permlink: null,
      select_authors: select_author !== '' ? [select_author] : []
    }, () => {
      this.loadMore();
    });
  }

  reloadList = () => {
    this.setState({
      results: [],
      start_author: null,
      start_permlink: null
    }, () => {
      this.loadMore();
    });
  }

  createRequest = () => {
    this.setState({
      current_author: '',
      current_permlink: '',
      showCreateRequest: true
    });
  }

  hideCreateRequest = (needReload) => {
    this.setState({
      showCreateRequest: false
    }, () => {
      //if (needReload === 'yes') this.reloadList(); // TODO: wait for block
    });
  }

  viewRequest = (event) => {
    const { dataset } = event.target;
    this.setState({
      current_author: dataset.author,
      current_permlink: dataset.permlink,
      showViewRequest: true
    });
  }

  hideViewRequest = (msg) => {
    this.setState({
      showViewRequest: false,
      showCreateRequest: (msg === 'edit') ? true : this.state.showCreateRequest
    });
  }

  render() {
    const state_in_route = this.props.routeParams.state || 'created';
    const workerRequests = this.state.results.map((req) => {
        let rshares_amount_pct = parseInt(req.stake_rshares * 100 / req.stake_total);
        rshares_amount_pct = !isNaN(rshares_amount_pct) ? rshares_amount_pct : 0;
        let max_amount = parseFloat(req.required_amount_max.split(" ")[0]);
        let payed = max_amount * rshares_amount_pct / 100;
        let payed_amount = formatDecimal(payed, 0, false, ' ');

        let rshares_pct = req.stake_total * 100 / this.state.total_vesting_shares;
        rshares_pct = !isNaN(rshares_pct) ? rshares_pct : 0;
        rshares_pct = +parseFloat(rshares_pct).toFixed(2);

        let vote_end = "Завершено";
        if (!req.vote_end_time.startsWith("19")) {
            vote_end = (<TimeAgoWrapper date={req.vote_end_time} />);
        }

        return (<div key={req.post.author + "/" + req.post.permlink}>
          <Link to={'/workers/' + state_in_route + '/@' + req.post.author + "/" + req.post.permlink}><h4 className="Workers__title" data-author={req.post.author} data-permlink={req.post.permlink} onClick={this.viewRequest}>{req.post.title}</h4></Link>
          <div className="Workers__author float-right">Автор предложения:&nbsp;&nbsp;<Author author={req.post.author} follow={false} /></div>
          <table>
          <thead>
            <tr>
              {['created', 'payment'].includes(req.state) && <th style={{ textAlign: 'center' }}>
                Сумма
              </th>}
              {'created' == req.state && <th style={{ textAlign: 'center' }}>
                Окончание голосования
              </th>}
              {!['created'].includes(req.state) && <th style={{ textAlign: 'center' }}>
                Выплачено
              </th>}
              {!['created', 'payment'].includes(req.state) && <th style={{ textAlign: 'center' }}>
                Статус
              </th>}
              <th style={{ textAlign: 'center' }}>
                <Tooltip t="Процент проголосовавших от суммы всей Силы Голоса системы">
                  Кворум
                </Tooltip>
                <div>
                  <span style={{ fontSize: '80%' }}>
                    (>{this.props.approve_min_percent / 100}% от общей СГ)
                  </span>
                </div>
              </th>
              <th style={{ width: '580px' }}>
                <span className="Workers__green"><Icon name="new/upvote" /> За: {req.upvote_total} СГ ({req.upvotes} <FormattedPlural value={req.upvotes} one="голос" few="голоса" many="голосов" other="голосов"/>)</span>
                <span className="Workers__red float-right"> Против: {req.downvote_total} СГ ({req.downvotes} <FormattedPlural value={req.downvotes} one="голос" few="голоса" many="голосов" other="голосов"/>)&nbsp;<Icon name="new/downvote" /></span>
              </th>
            </tr>
          </thead>
          <tbody>
          <tr>
              {['created', 'payment'].includes(req.state) && <td style={{ textAlign: 'center' }}>
                <div>
                  <b>{formatAsset(req.required_amount_max)}</b>
                </div>
                <div>
                  <span style={{ fontSize: '80%' }}>
                    но не менее {formatAsset(req.required_amount_min)}
                  </span>
                </div>
              </td>}
              {'created' == req.state && <td style={{ textAlign: 'center' }}>
                {vote_end}
              </td>}
              {!['created'].includes(req.state) && <td style={{ textAlign: 'center' }}>
                <b>{formatAsset(req.paid_out)}</b>
              </td>}
              {!['created', 'payment'].includes(req.state) && <td style={{ textAlign: 'center' }}>
                <b className={(req.state == 'payment_complete') ? 'Workers__green' : 'Workers__red'}>{tt('workers.'+req.state)}</b>
              </td>}
              <td style={{ textAlign: 'center' }}><span className={(rshares_pct >= 15 ? 'Workers__green' : 'Workers__red')}>
                {rshares_pct}%
              </span>
              </td>
              <td>
                <div>
                  <div className="Workers__progressbar Workers__green_bg" style={{ width: req.upvote_percent + '%' }}>{req.upvote_percent >= 5 ? req.upvote_percent + '%' : ''}</div>
                  <div className="Workers__progressbar Workers__red_bg" style={{ width: req.downvote_percent + '%' }}>{req.downvote_percent >= 5 ? req.downvote_percent + '%' : ''}</div>
                </div>
                <div>
                  <div className="Workers__created float-right">Опубликовано <TimeAgoWrapper date={req.created} /></div>
                </div>
              </td>
          </tr>
          </tbody>
          </table>
          </div>
        );
    });
    const { current_author, current_permlink, selected_state, show_load_more, showCreateRequest, showViewRequest} = this.state;
    const auth = { account: this.props.account, posting_key: this.props.posting_key };
    let list_states = [
      {link: '/workers/created', value: 'Открытые заявки'},
      {link: '/workers/payment', value: 'Выплачиваемые'},
      {link: '/workers/closed', value: 'Закрытые'}
    ];
    return (
      <div className="App-workers">
        <div><h2>Заявки на работу</h2></div>
        <Link to={'/workers/' + state_in_route + '/@.add'}>ffffff<Button round="true" type="primary">+ {tt('workers.create_request')}</Button></Link>
        <WorkerFunds/>
        <form className="Input__Inline" style={{marginBottom: '1rem'}} onSubmit={this.searchByAuthor}>
          <input className="Input__Inline" type="text" placeholder="Поиск по автору" onChange={this.handleSearchAuthor}/>
        </form>
        <DropdownMenu className="StatesMenu" items={list_states} selected={selected_state} el="span" />
        {workerRequests}
        <div className="App-center">
          {show_load_more && <Button onClick={this.loadMore} round="true" type="secondary">{tt('g.load_more')}</Button>}
        </div>
        <br/>
        <Reveal show={showCreateRequest}>
          <CloseButton onClick={this.hideCreateRequest} />
          <AddEditWorkerRequest auth={auth} hider={this.hideCreateRequest} author={current_author} permlink={current_permlink} />
        </Reveal>
        <Reveal show={showViewRequest}>
          <CloseButton onClick={this.hideViewRequest} />
          <ViewWorkerRequest auth={auth} hider={this.hideViewRequest} author={current_author} permlink={current_permlink} />
        </Reveal>
      </div>
    );
  }
}

export default connect(
    state => {
        const gprops = state.global.get('props');
        const currentUser = state.user.get('current');
        let account = null;
        let posting_key = null;
        if (currentUser) {
          account = currentUser.get('username');
          posting_key = currentUser.get('private_keys').get('posting_private');
        }
        const cprops = state.global.get('cprops');
        const approve_min_percent = cprops ? cprops.get('worker_request_approve_min_percent') : 100
        return {
            gprops,
            account,
            posting_key,
            approve_min_percent
        };
    },
    dispatch => {
        return {
        };
    }
)(WorkerRequests);
