import React from 'react';
import golos from 'golos-classic-js';

import Tooltip from 'app/components/elements/Tooltip.jsx';
import { formatAsset } from 'app/utils/ParsersAndFormatters';

export default class WorkerFunds extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      balance: "0.000 GOLOS",
      sbd_balance: "0.000 GOLOS"
    };
  }

  componentDidMount() {
    setTimeout(() => 
    golos.api.getAccounts(['workers'],
      (err, results) => {
        if (err) {
          alert(err);
          return;
        }
        if (!results.length) return;
        this.setState({
          balance: results[0].balance,
          sbd_balance: results[0].sbd_balance
        });
      }), 500);
  }

  componentWillUnmount() {
  }

  render() {
    const { balance, sbd_balance } = this.state;
    return(
      <span class="WorkerFunds">
        <Tooltip t="Текущий баланс фонда воркеров">
          Состояние фонда:
          &nbsp;
          <span class="WorkerFunds__card">{formatAsset(balance,false)} GOLOS</span>
          &nbsp;и&nbsp;
          <span class="WorkerFunds__card">{formatAsset(sbd_balance,false)} GBG</span>
        </Tooltip>
      </span>
    );
  }
}
