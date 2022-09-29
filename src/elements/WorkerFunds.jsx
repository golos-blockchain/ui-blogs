import React from 'react';
import golos from 'golos-lib-js';
import tt from 'counterpart';
import { connect } from 'react-redux';
import Tooltip from 'app/components/elements/Tooltip.jsx';
import { formatAsset } from 'app/utils/ParsersAndFormatters';

class WorkerFunds extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
  }

  componentWillUnmount() {
  }

  render() {
    const { balance, sbd_balance } = this.props;
    return(
      <span className="WorkerFunds">
        <Tooltip t="Текущий баланс фонда воркеров">
          {tt('workers.balance_fund')}:
          &nbsp;
          <span className="WorkerFunds__card">{formatAsset(balance,false)} GOLOS</span>
          &nbsp;{tt('g.and')}&nbsp;
          <span className="WorkerFunds__card">{formatAsset(sbd_balance,false)} GBG</span>
        </Tooltip>
      </span>
    );
  }
}

export default connect(
    state => {
        let workersAcc = state.global.getIn(['accounts', 'workers']);
        let balance = workersAcc ? workersAcc.get('balance') : '0.000 GOLOS';
        let sbd_balance = workersAcc ? workersAcc.get('sbd_balance') : '0.000 GOLOS';
        return {
            balance,
            sbd_balance
        };
    },
    dispatch => {
        return {
        };
    }
)(WorkerFunds);
