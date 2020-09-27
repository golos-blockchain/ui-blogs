import React from 'react';
import tt from 'counterpart';

export default class TickerPriceStat extends React.Component {

    render() {
        const {ticker, symbol, precision} = this.props;
        const pct_change = <span className={'Market__ticker-pct-' + (ticker.percent_change1 < 0 ? 'down' : 'up')}>
                {ticker.percent_change1 < 0 ? '' : '+'}{ticker.percent_change1.toFixed(3)}%
              </span>
        return (
            <div className="TickerPriceStat">
                <div>
                    <b>{tt('market_jsx.last_price')} </b>
                    <span>{symbol} {ticker.latest1.toFixed(precision)} ({pct_change})</span>
                </div>
                <div>
                    <b>{tt('market_jsx.24h_volume')} </b>
                    <span>{symbol} {ticker.asset2_volume.toFixed(2)}</span>
                </div>
                <div>
                    <b>{tt('g.bid')} </b>
                    <span>{symbol} {ticker.highest_bid.toFixed(precision)}</span>
                </div>
                <div>
                    <b>{tt('g.ask')} </b>
                    <span>{symbol} {ticker.lowest_ask.toFixed(precision)}</span>
                </div>
                {ticker.highest_bid > 0 && <div>
                    <b>{tt('market_jsx.spread')} </b>
                    <span>{(200 * (ticker.lowest_ask - ticker.highest_bid) / (ticker.highest_bid + ticker.lowest_ask)).toFixed(3)}%</span>
                </div> }
            </div>
        );
    }
}
