import React from 'react';
import golos from 'golos-classic-js';
import tt from 'counterpart';
import CloseButton from 'react-foundation-components/lib/global/close-button';
import Reveal from 'react-foundation-components/lib/global/reveal';
import { connect } from 'react-redux';

import Button from 'app/components/elements/Button';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import Tooltip from 'app/components/elements/Tooltip';
import Author from 'app/components/elements/Author';
import DropdownMenu from 'app/components/elements/DropdownMenu';
import { formatAsset, formatDecimal, ERR } from 'app/utils/ParsersAndFormatters';

import AddEditWorkerRequest from './AddEditWorkerRequest';
import ViewWorkerRequest from './ViewWorkerRequest';
import WorkerFunds from 'app/components/elements/WorkerFunds';
import "./WorkerRequests.scss";

class WorkerRequests extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      results: [],
      start_author: null,
      start_permlink: null,
      select_author: '',
      select_authors: [],
      select_states: ['created'],
      selected_state: 'Открытые заявки',
      showCreateRequest: false,
      showViewRequest: false,
      current_author: '',
      current_permlink: '',
      total_vesting_shares: 1
    };
  }

  componentDidMount() {
    let total_vesting_shares = this.props.gprops.get('total_vesting_shares');
    total_vesting_shares = parseInt(total_vesting_shares.split(' ')[0].replace('.', ''));
    this.setState({
      total_vesting_shares
    }, () => {
      this.loadMore();
    });
  }

  componentWillUnmount() {
  }

  loadMore = () => {
    const { start_author, start_permlink, select_authors, select_states } = this.state;
    var query = {
      limit: 10,
      start_author,
      start_permlink,
      select_authors,
      select_states
    };
    golos.api.getWorkerRequests(query, 'by_created', true,
      (err, results) => {
        if (err) {
          alert(ERR(err, 'search_by_author'));
          return;
        }
        if (!results.length) return;
        if (start_author) results = results.slice(1);
        const last = results.slice(-1)[0];
        this.setState({
          results: this.state.results.concat(results),
          start_author: last.post.author,
          start_permlink: last.post.permlink
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

  onStateSelected = (e) => {
    e.preventDefault();
    const {link, value} = e.target.parentNode.dataset;
    let select_states = [];
    if (link === 'closed')
      select_states = ['payment_complete', 'closed_by_author', 'closed_by_expiration', 'closed_by_voters'];
    else if (link !== 'all')
      select_states = [link];

    this.setState({
      results: [],
      start_author: null,
      start_permlink: null,
      select_states,
      selected_state: value
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
    tt.setLocale('ru');
    const workerRequests = this.state.results.map((req) => {
        let rshares_amount_pct = parseInt(req.stake_rshares * 100 / req.stake_total);
        rshares_amount_pct = !isNaN(rshares_amount_pct) ? rshares_amount_pct : 0;
        let max_amount = parseFloat(req.required_amount_max.split(" ")[0]);
        let payed = max_amount * rshares_amount_pct / 100;
        let payed_amount = formatDecimal(payed, 0, false, ' ');
        let wr_state = tt("workers."+req.state);
        if (wr_state == "Выплачено") {
            wr_state = (<td>
                <div>
                  {wr_state}
                </div>
                <div>
                  <span style={{ fontSize: '80%' }}>
                    {payed_amount} {req.required_amount_min.split(" ")[1]}
                  </span>
                </div>
            </td>);
        } else {
            wr_state = (<td>{wr_state}</td>);
        }

        let rshares_pct = parseInt(req.stake_total * 100 / this.state.total_vesting_shares);
        rshares_pct = !isNaN(rshares_pct) ? rshares_pct : 0;

        let vote_end = "Завершено";
        if (!req.vote_end_time.startsWith("19")) {
            vote_end = (<TimeAgoWrapper date={req.vote_end_time} />);
        }

        return (
          <tr>
              <td>
                <a href="#" data-author={req.post.author} data-permlink={req.post.permlink} onClick={this.viewRequest}>{req.post.title}</a>
              </td>
              <td>
                <Author author={req.post.author} follow={false} />
              </td>
              {wr_state}
              <td>
                <div>
                  <b>{formatAsset(req.required_amount_max)}</b>
                </div>
                <div>
                  <span style={{ fontSize: '80%' }}>
                    но не менее {formatAsset(req.required_amount_min)}
                  </span>
                </div>
              </td>
              <td>
                {rshares_pct}%
              </td>
              <td>
                {vote_end}
              </td>
          </tr>
        );
    });
    const { current_author, current_permlink, selected_state, showCreateRequest, showViewRequest} = this.state;
    const auth = { account: this.props.account, posting_key: this.props.posting_key };
    let list_states = [
      {link: 'all', value: 'Все', onClick: this.onStateSelected},
      {link: 'created', value: 'Открытые заявки', onClick: this.onStateSelected},
      {link: 'payment', value: 'Выплачиваемые', onClick: this.onStateSelected},
      {link: 'closed', value: 'Закрытые', onClick: this.onStateSelected}
    ];
    return (
      <div className="App-workers">
        <div><h2>Заявки на работу</h2></div>
        <Button onClick={this.createRequest} round="true" type="primary">+ {tt('workers.create_request')}</Button>
        <WorkerFunds/>
        <form className="Input__Inline" style={{marginBottom: '1rem'}} onSubmit={this.searchByAuthor}>
          <input className="Input__Inline" type="text" placeholder="Поиск по автору" onChange={this.handleSearchAuthor}/>
        </form>
        <DropdownMenu className="StatesMenu" items={list_states} selected={selected_state} el="span" />
        <table>
          <thead>
            <tr>
              <th width="300">
                Заявка
              </th>
              <th>
                Автор
              </th>
              <th>
                Статус
              </th>
              <th>
                Сумма
              </th>
              <th>
                <Tooltip t="Процент проголосовавших от суммы всей Силы Голоса системы">
                  % от общей СГ
                </Tooltip>
              </th>
              <th>
                Окончание голосования
              </th>
            </tr>
          </thead>
          <tbody>
            {workerRequests}
          </tbody>
        </table>
        <div className="App-center">
          <Button onClick={this.loadMore} round="true" type="secondary">{tt('g.load_more')}</Button>
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
        return {
            gprops,
            account,
            posting_key
        };
    },
    dispatch => {
        return {
        };
    }
)(WorkerRequests);
