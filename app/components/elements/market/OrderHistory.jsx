import React from "react";
import tt from 'counterpart';

import Order from 'app/utils/market/Order'
import TradeHistory from 'app/utils/market/TradeHistory'
import OrderHistoryRow from 'app/components/elements/market/OrderHistoryRow'

export default class OrderHistory extends React.Component {

    constructor() {
        super();

        this.state = {
            historyIndex: 0,
            animate: false
        }
    }

    componentDidMount() {
        setTimeout(() => {
            this.setState({
            animate: true
            });
        }, 2000);
    }

    renderHistoryRows(history, buy) {
        if (!history.length) {
            return null;
        }

        let ids = [];
        let historyNew = [];
        for (let h of history) {
            if (historyNew.length && historyNew[historyNew.length -1].date.getTime() == h.date.getTime()) {
                historyNew[historyNew.length -1].asset1 += h.asset1;
                historyNew[historyNew.length -1].asset2 += h.asset2;
                continue;
            }
            if (ids.includes(h.id)) continue;
            ids.push(h.id);
            historyNew.push(new TradeHistory(Object.assign({},h.fill), h.sym1, h.sym2, h.prec1, h.prec2));
        }

        let {historyIndex} = this.state;

        const {prec1, prec2} = this.props;

        let last_id = Number.MAX_VALUE
        return historyNew.map((order, index) => {
            if (index >= historyIndex && index < (historyIndex + 10)) {
                if (order.id >= last_id) return null
                last_id = order.id
                return (
                    <OrderHistoryRow
                        prec1={prec1}
                        prec2={prec2}
                        key={order.date.getTime() + order.getStringPrice() + order.getStringAsset2()}
                        index={index}
                        order={order}
                        animate={this.state.animate}
                    />
                );
            }
        }).filter(a => {
            return !!a;
        });
    }

    _setHistoryPage(back) {
        let newState = {};
        const newIndex = this.state.historyIndex + (back ? 10 : -10);
        newState.historyIndex = Math.min(Math.max(0, newIndex), this.props.history.length - 10);

        // Disable animations while paging
        if (newIndex !== this.state.historyIndex) {
            newState.animate = false;
        }
        // Reenable animatons after paging complete
        this.setState(newState, () => {
            this.setState({animate: true})
        });
    }

    render() {
        const {history, sym1, sym2} = this.props;
        const {historyIndex} = this.state;

        return (
            <section>
                <table className="Market__trade-history">
                    <thead>
                        <tr>
                            <th>{tt('market_jsx.date_trade')}</th>
                            <th>Buy/Sell</th>
                            <th>{tt('g.price')}</th>
                            <th>{sym1}</th>
                            <th>{sym2}</th>
                        </tr>
                    </thead>
                    <tbody>
                            {this.renderHistoryRows(history)}
                    </tbody>
                </table>

                <nav>
                  <ul className="pager">
                    <li>
                        <div className={"button tiny hollow float-left " + (historyIndex === 0 ? " disabled" : "")}  onClick={this._setHistoryPage.bind(this, false)} aria-label="Previous">
                            <span aria-hidden="true">&larr; {tt('g.newer')}</span>
                        </div>
                    </li>
                    <li>
                        <div className={"button tiny hollow float-right " + (historyIndex >= (history.length - 10) ? " disabled" : "")}  onClick={this._setHistoryPage.bind(this, true)} aria-label="Next">
                            <span aria-hidden="true">{tt('g.older')} &rarr;</span>
                        </div>
                    </li>
                  </ul>
                </nav>
            </section>

        )
    }

}
