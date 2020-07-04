import React from 'react';
import golos from 'golos-classic-js';
import cn from 'classnames';
import { connect } from 'react-redux';

import {
    APP_DOMAIN
} from 'app/client_config';
import Button from 'app/components/elements/Button';
import { formatAsset, ERR } from 'app/utils/ParsersAndFormatters';

import WorkerFunds from 'app/components/elements/WorkerFunds';
import { getAuthorPermlink } from 'app/utils/ParsersAndFormatters';

class AddEditWorkerRequest extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      url: '',
      required_amount_min: '1000 GOLOS',
      required_amount_max: '5000 GOLOS',
      vest_reward: false,
      duration: 7,
      worker: this.props.auth.account,

      created: '',

      postError: '',
      workerError: ''
    };
  }

  componentDidMount() {
    const { author, permlink} = this.props;
    this.setState({
    }, async () => {
      if (author === '') return; // Not edit case
      var query = {
        limit: 1,
        start_author: author,
        start_permlink: permlink
      };
      var results = await golos.api.getWorkerRequestsAsync(query, 'by_created', true);
      if (!results.length) return;
      const req = results[0];
      if (req.post.author !== author || req.post.permlink !== permlink) return;

      this.setState({
        url: "https://" + APP_DOMAIN + "/@" + req.post.author + "/" + req.post.permlink,
        required_amount_min: formatAsset(req.required_amount_min, true, false, ''),
        required_amount_max: formatAsset(req.required_amount_max, true, false, ''),
        vest_reward: req.vest_reward,
        duration: parseInt(req.duration)/(24*60*60),
        worker: req.worker,
        created: req.created
      });
    });
  }

  componentWillUnmount() {
  }

  handleInputChange = (event) => {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  }

  onPostChanged = (event) => {
    return;
  }

  onWorkerChanged = (event) => {
    let workerError = null;

    golos.api.getAccounts([event.target.value], (err, results) => {
        if (!results.length) {
          workerError = 'Неверный логин.';
        }
        this.setState({ workerError });
      });
  }

  sendOp = async (event) => {
    event.preventDefault();
    const { auth } = this.props;
    const req = this.state;

    const arr = getAuthorPermlink(req.url);

    let post = await golos.api.getContentAsync(arr[0], arr[1]);
    if (post.author === '') { // no post
      try {
        await golos.broadcast.commentAsync(auth.posting_key, '', arr[1], arr[0], arr[1], 'Заголовок поста с описанием по заявке', 'Пост заявки воркеров', '');
      } catch (err) {
        alert('Пост не существует, а создать его не удается.\n' + ERR(err,'worker_request'));
        return;
      }
    }

    let required_amount_min = req.required_amount_min.trim().replace(" ", ".000 ");
    let required_amount_max = req.required_amount_max.trim().replace(" ", ".000 ");

    let created = new Date();
    if (this.state.created != '') {
      created = new Date(this.state.created);
      created.setSeconds(created.getSeconds() - created.getTimezoneOffset() * 60);
    }
    let duration = parseInt(req.duration)*24*60*60;
    if (duration == 0) duration = 5*60;
    golos.broadcast.workerRequest(auth.posting_key,
      arr[0], arr[1], req.worker, required_amount_min, required_amount_max, req.vest_reward, duration, [],
      (err, result) => {
        if (err) {
          alert(ERR(err,'worker_request'));
          return;
        }
        this.props.hider('yes');
      });
  }

  render() {
    const req = this.state;
    const { postError, workerError } = this.state;
    const editCase = (this.props.author !== '');

    let creation_fee = null;
    if (!editCase) {
      creation_fee = (<b>&nbsp;Будет списано: {formatAsset(this.props.cprops.worker_request_creation_fee)}</b>);
    }

    return(
      <div>
      <h3>{editCase ? 'Изменение' : 'Создание'} заявки</h3>
      <WorkerFunds />
      <form>
        <div className={cn({ error: postError })}>
            <label>
              Ссылка на пост заявки:<input name="url" disabled={editCase} type="text" value={req.url} onChange={this.handleInputChange} onBlur={this.onPostChanged}/>
            </label>
            <p>{postError}</p>
        </div>
        <table className="AmountFields">
          <tr>
            <td>
              <label>
                Минимальная сумма:<input name="required_amount_min" type="text" value={req.required_amount_min} onChange={this.handleInputChange}/>
              </label>
            </td>
            <td>
              <label>
                Запрашиваемая сумма:<input name="required_amount_max" type="text" value={req.required_amount_max} onChange={this.handleInputChange}/>
              </label>
            </td>
            <td>
              <label>
                Выплата в СГ:<input name="vest_reward" type="checkbox" checked={req.vest_reward} onChange={this.handleInputChange}/>
              </label>
            </td>
          </tr>
        </table>
        <label>
          Время голосования (суток):
          <div>
            <input name="duration" type="number" min="5" max="30" className="inline" value={req.duration} onChange={this.handleInputChange} />
          </div>
        </label>
        <div className={cn({ error: workerError })}>
            <label>
              Получатель средств:<input name="worker" type="text" value={req.worker} onChange={this.handleInputChange} onBlur={this.onWorkerChanged}/>
            </label>
            <p>{workerError}</p>
        </div>
        <div>
          <Button round="true" type="primary" onClick={this.sendOp}>Отправить</Button>&nbsp;
          <Button round="true" type="secondary" onClick={(event) => {event.preventDefault(); this.props.hider('closed');}}>Отмена</Button>
          {creation_fee}
        </div>
      </form>
      </div>
    );
  }
}

export default connect(
    state => {
        const cprops = state.global.get('cprops').toJS();
        return {
            cprops
        };
    },
    dispatch => {
        return {
        };
    }
)(AddEditWorkerRequest);

