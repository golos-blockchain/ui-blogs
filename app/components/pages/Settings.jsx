import React from 'react';
import golos from 'golos-classic-js';

import Button from 'app/components/elements/Button';

export default class Settings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      host: localStorage.getItem('host') || "wss://testnet.solox.world/ws",
      account: localStorage.getItem('account'),
      posting_key: localStorage.getItem('posting_key'),
      forgot_posting_key: localStorage.getItem('forgot_posting_key') || 'true',

      host_checked: false
    };
  }

  componentDidMount() {
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

  handleSubmit = (event) => {
    event.preventDefault();
    const { host, account, posting_key, forgot_posting_key } = this.state;

    //golos.config.set('websocket', host);
    golos.api.getAccounts([account], (err, result) => {
      if (err) {
        alert('Не удается подключиться к ноде. Проверьте правильность введенного адреса ноды и подключение к интернету. Если все верно, то нода не работает в данный момент - попробуйте позже.');
        return;
      }
      this.setState({
        host_checked: true
      });
      if (!result.length) {
        alert('Неверное имя аккаунта. Указанный аккаунт не найден.');
        return;
      }

      if (!golos.auth.isWif(posting_key)) {
        alert('Неверный posting-ключ. Формат ключа невалидный. Проверьте, не добавлено ли пробелов и других лишних символов.');
        return;
      }

      result = result[0];
      const auths = result.posting.key_auths;
      let wifFound = false;
      for (let auth of auths) {
        let wifPub = auth[0];
        if (golos.auth.wifIsValid(posting_key, wifPub)) {
          wifFound = true;
          break;
        }
      }
      if (!wifFound) {
        alert('Неверный posting-ключ. Он не подходит к указанному аккаунту.');
        return;
      }

      localStorage.setItem('host', host);
      localStorage.setItem('account', account);
      localStorage.setItem('posting_key', posting_key);
      localStorage.setItem('forgot_posting_key', forgot_posting_key);
      this.props.onSubmit();
    });
  }

  render() {
    const { host, account, posting_key, forgot_posting_key, host_checked } = this.state;
    return(
      <form onSubmit={this.handleSubmit}>
        <h3>Войти</h3>
        <input name="host" placeholder="Адрес ноды" type="text" required value={host} disabled={host_checked} onChange={this.handleInputChange} />
        <input name="account" placeholder="Введи свое имя пользователя" type="text" required value={account} onChange={this.handleInputChange}/>
        <input name="posting_key" placeholder="Приватный posting-ключ" type="password" required value={posting_key} onChange={this.handleInputChange}/>
        <label for="forgot_posting_key"><input id="forgot_posting_key" name="forgot_posting_key" type="checkbox" checked={forgot_posting_key} onChange={this.handleInputChange} />Забыть ключ и имя после закрытия страницы</label>
        <Button nativeType="submit" round="true">Войти</Button>
      </form>
    );
  }
}
