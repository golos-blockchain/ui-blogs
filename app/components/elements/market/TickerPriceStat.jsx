import React from 'react';
import tt from 'counterpart';
import { Asset } from 'golos-lib-js/lib/utils';

export default class TickerPriceStat extends React.Component {

    render() {
        const {ticker, trades, symbol, precision} = this.props;

        let open = parseFloat(0);
        let latest = parseFloat(0);
        let asset2_volume = Asset(0, precision, symbol);
        const newDate = Date.now() -1*24*3600*1000;
        const now = new Date(newDate);
        if (trades.length) {
            latest = trades[0].price;
            for (let trade of trades) {
                if (trade.date < now) break;
                open = trade.price;
                const asset2 = trade.asset2 * Math.pow(10, precision);
                asset2_volume = asset2_volume.plus(asset2);
            }
        }

        let percent_change1 = open ? ((latest - open) / open * 100) : 0.0;

        const pct_change = <span className={'Market__ticker-pct-' + (percent_change1 < 0 ? 'down' : 'up')}>
                {percent_change1 < 0 ? '' : '+'}{percent_change1.toFixed(3)}%
              </span>
        return (
            <div className="TickerPriceStat">
                <div>
                    <b>{tt('market_jsx.last_price')} </b>
                    <span>{symbol} {latest.toFixed(8)} ({pct_change})</span>
                </div>
                <div>
                    <b>{tt('market_jsx.24h_volume')} </b>
                    <span>{symbol} {asset2_volume.toString().split(' ')[0]}</span>
                </div>
                <div>
                    <b>{tt('g.bid')} </b>
                    <span>{symbol} {ticker.highest_bid.toFixed(8)}</span>
                </div>
                <div>
                    <b>{tt('g.ask')} </b>
                    <span>{symbol} {ticker.lowest_ask.toFixed(8)}</span>
                </div>
                {ticker.highest_bid > 0 && <div>
                    <b>{tt('market_jsx.spread')} </b>
                    <span>{(200 * (ticker.lowest_ask - ticker.highest_bid) / (ticker.highest_bid + ticker.lowest_ask)).toFixed(3)}%</span>
                </div> }
            </div>
        );
    }
}
