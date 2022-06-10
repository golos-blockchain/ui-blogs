import React from "react";
import tt from 'counterpart';

import OrderBookRow from 'app/components/elements/market/OrderBookRow'
import { DEBT_TOKEN_SHORT } from 'app/client_config';

export default class Orderbook extends React.Component {

    constructor() {
        super();

        this.state = {
            buyIndex: 0,
            sellIndex: 0,
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

    _setBuySellPage(back) {

        const indexKey = this.props.side === "bids" ? "buyIndex" : "sellIndex";

        let newIndex = this.state[indexKey] + (back ? 10 : -10);

        newIndex = Math.min(Math.max(0, newIndex), this.props.orders.length - 10);

        let newState = {};
        newState[indexKey] = newIndex;
        // Disable animations while paging
        if (newIndex !== this.state[indexKey]) {
            newState.animate = false;
        }
        // Reenable animatons after paging complete
        this.setState(newState, () => {
            this.setState({animate: true})
        });
    }

    renderBuySellHeader() {
        const LIQUID_TOKEN = tt('token_names.LIQUID_TOKEN')

        let buy = this.props.side === "bids";

        const {sym1, sym2} = this.props;

        return (
            <thead>
                <tr>
                    {!buy ? <th></th> : null}
                    <th>{buy ? tt('market_jsx.total_DEBT_TOKEN_SHORT_CURRENCY_SIGN', {DEBT_TOKEN_SHORT: sym2}) : tt('g.price')}</th>
                    <th>{buy ? sym2 : sym1}</th>
                    <th>{buy ? sym1 : sym2}</th>
                    <th>{buy ? tt('g.price') : tt('market_jsx.total_DEBT_TOKEN_SHORT_CURRENCY_SIGN', {DEBT_TOKEN_SHORT: sym2})}</th>
                    {buy ? <th></th> : null}
                </tr>
            </thead>
        );
    }

    renderOrdersRows() {
        const {sym1, sym2, prec1, prec2, orders, side} = this.props;
        const buy = side === "bids";

        if (!orders.length) {
            return null;
        }
        const {buyIndex, sellIndex} = this.state;

        let total = 0;
        return orders
        .map((order, index) => {
            total += order.asset2;
            if (index >= (buy ? buyIndex : sellIndex) && index < ((buy ? buyIndex : sellIndex) + 10)) {
                return (
                    <OrderBookRow
                        sym1={sym1}
                        sym2={sym2}
                        prec1={prec1}
                        prec2={prec2}
                        onClick={this.props.onClick}
                        cancelSpecificOrdersClick={this.props.cancelSpecificOrdersClick}
                        animate={this.state.animate}
                        key={side + order.getStringAsset2() + order.getStringPrice()}
                        index={index}
                        order={order}
                        side={side}
                        total={total}
                    />
                );
            }
            return null;
        }).filter(a => {
            return !!a;
        });
    }

    render() {
        const {orders, sym2} = this.props;

        const buy = this.props.side === "bids";
        const {buyIndex, sellIndex} = this.state;

        const currentIndex = buy ? buyIndex : sellIndex;

        return (
            <div>
                <table className="Market__orderbook">
                    {this.renderBuySellHeader()}
                    <tbody>
                            {this.renderOrdersRows()}
                    </tbody>
                </table>
                <nav>
                  <ul className="pager">
                    <li>
                        <div className={"button tiny hollow " + (buy ? "float-left" : "float-left") + (currentIndex === 0 ? " disabled" : "")} onClick={this._setBuySellPage.bind(this, false)} aria-label="Previous">
                            <span aria-hidden="true">&larr; {tt(buy ? 'market_jsx.higher' : 'market_jsx.lower')}</span>
                        </div>
                    </li>
                    <li>
                        <div className={"button tiny hollow " + (buy ? "float-right" : "float-right") + (currentIndex >= (orders.length - 10) ? " disabled" : "")} onClick={this._setBuySellPage.bind(this, true)} aria-label="Next">
                            <span aria-hidden="true">{tt(buy ? 'market_jsx.lower' : 'market_jsx.higher')} &rarr;</span>
                        </div>
                    </li>
                  </ul>
                </nav>
            </div>

        )
    }
}
