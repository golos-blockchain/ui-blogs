import React from 'react';
import golos from 'golos-classic-js';
import tt from 'counterpart';
import CloseButton from 'react-foundation-components/lib/global/close-button';
import Reveal from 'react-foundation-components/lib/global/reveal';
import { addLocaleData, IntlProvider } from 'react-intl';
import ru from 'react-intl/locale-data/ru';

import Button from 'app/components/elements/Button';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import Tooltip from 'app/components/elements/Tooltip';
import Author from 'app/components/elements/Author';
import DropdownMenu from 'app/components/elements/DropdownMenu';
import { formatAsset, ERR } from 'app/utils/ParsersAndFormatters';

import Settings from './Settings';
import AddEditWorkerRequest from './AddEditWorkerRequest';
import ViewWorkerRequest from './ViewWorkerRequest';
import WorkerFunds from './WorkerFunds';
import "./WorkerRequests.scss";

export default class WorkerRequests extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      auth: {
        host: null,
        account: null,
        posting_key: null
      },
      results: [],
      start_author: null,
      start_permlink: null,
      select_author: '',
      select_authors: [],
      select_states: ['created'],
      selected_state: 'Открытые заявки',
      showSettings: false,
      showCreateRequest: false,
      showViewRequest: false,
      current_author: '',
      current_permlink: '',
      total_vesting_shares: 1
    };
  }

  componentDidMount() {
    const host = localStorage.getItem('host');
    if (!host) {
      this.setState({
        showSettings: true
      });
      return;
    }
    window.addEventListener("unload", this.unload);
    //golos.config.set('websocket', host);
    this.setState({
      auth: {
        host: host,
        account: localStorage.getItem('account'),
        posting_key: localStorage.getItem('posting_key')
      }
    }, async () => {
      let dgp = await golos.api.getDynamicGlobalPropertiesAsync();
      let total_vesting_shares = parseInt(dgp.total_vesting_shares.split(' ')[0].replace('.', ''));
      this.setState({
        total_vesting_shares
      }, () => {
        this.loadMore();
      });
    });
  }

  componentWillUnmount() {
    window.removeEventListener("unload", this.unload);
  }

  unload = () => {
    if (localStorage.getItem('forgot_posting_key') === 'true') {
      localStorage.removeItem('host');
      localStorage.removeItem('account');
      localStorage.removeItem('posting_key');
      localStorage.removeItem('forgot_posting_key');
    }
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

  onStateSelected = (link, value) => {
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

  settingSubmit = () => {
    this.setState({
      showSettings: false
    }, () => {
      window.location.reload();
    });
  }

  settingReset = () => {
    this.setState({
      auth: {
        host: localStorage.removeItem('host'),
        account: localStorage.removeItem('account'),
        posting_key: localStorage.removeItem('posting_key'),
      }
    }, () => {
      localStorage.removeItem('forgot_posting_key');
      window.location.reload();
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
        let rshares_pct = parseInt(req.stake_total * 100 / this.state.total_vesting_shares);
        rshares_pct = !isNaN(rshares_pct) ? rshares_pct : 0;
        return (
          <tr>
              <td>
                <b><a href="#" data-author={req.post.author} data-permlink={req.post.permlink} onClick={this.viewRequest}>{req.post.title}</a></b>
              </td>
              <td>
                <Author link={req.post.author} />
              </td>
              <td>
                {tt("workers."+req.state)}
              </td>
              <td>
                <div>
                  <b>{formatAsset(req.required_amount_min)}</b>
                </div>
                <div>
                  {formatAsset(req.required_amount_max)}
                </div>
              </td>
              <td>
                {rshares_pct}%
              </td>
              <td>
                <TimeAgoWrapper date={req.vote_end_time} altText="окончено" />
              </td>
          </tr>
        );
    });
    const { auth, current_author, current_permlink, selected_state, showSettings, showCreateRequest, showViewRequest} = this.state;
    let worker_funds = null;
    let user_bar = null;
    if (auth.host) {
      user_bar = (
        <span>
          {auth.account}&nbsp;<Button onClick={this.settingReset}>Выйти</Button>
        </span>
      );
      worker_funds = <WorkerFunds />;
    }
    let list_states = [
      {link: 'all', value: 'Все'},
      {link: 'created', value: 'Открытые заявки'},
      {link: 'payment', value: 'Выплачиваемые'},
      {link: 'closed', value: 'Закрытые'}
    ];
    return (
      <IntlProvider
        key="ru"
        locale="ru"
        defaultLocale="en">
      <div className="App">
        {user_bar}
        <div><h3>Заявки воркеров Golos Blockchain</h3></div>
        <Button onClick={this.createRequest} round="true" type="primary">+ {tt('workers.create_request')}</Button>
        {worker_funds}
        <form class="Input__Inline" onSubmit={this.searchByAuthor}>
          <input class="Input__Inline" type="text" placeholder="Поиск по автору" onChange={this.handleSearchAuthor}/>
        </form>
        <DropdownMenu className="StatesMenu" items={list_states} selected={selected_state} onSelected={this.onStateSelected} el="span" />
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
                <Tooltip t="% отданной СГ от всей СГ системы">
                  % от СГ системы
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
        <div class="App-center">
          <Button onClick={this.loadMore} round="true" type="secondary">{tt('g.load_more')}</Button>
        </div>
        <Reveal show={showSettings}>
          <Settings onSubmit={this.settingSubmit} />
        </Reveal>
        <Reveal show={showCreateRequest}>
          <CloseButton onClick={this.hideCreateRequest} />
          <AddEditWorkerRequest auth={auth} hider={this.hideCreateRequest} author={current_author} permlink={current_permlink} />
        </Reveal>
        <Reveal show={showViewRequest}>
          <CloseButton onClick={this.hideViewRequest} />
          <ViewWorkerRequest auth={auth} hider={this.hideViewRequest} author={current_author} permlink={current_permlink} />
        </Reveal>
      </div>
      </IntlProvider>
    );
  }
}
