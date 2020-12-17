import React from "react";
import OrderHistoryRow from "./OrderhistoryRow.jsx";
import tt from 'counterpart';
import { DEBT_TOKEN_SHORT } from 'app/client_config';

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

        let {historyIndex} = this.state;

        const {prec1, prec2} = this.props;

        let last_time = Number.MAX_VALUE
        return history.map((order, index) => {
            if (index >= historyIndex && index < (historyIndex + 10)) {
                if (order.date.getTime() >= last_time) return null
                last_time = order.date.getTime()
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
                            <th>{tt('g.date')}</th>
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
