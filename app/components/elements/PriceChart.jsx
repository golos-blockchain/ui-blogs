import React from 'react';
import PropTypes from 'prop-types'
import tt from 'counterpart';
import { DEBT_TOKEN_SHORT, LIQUID_TICKER, CURRENCY_SIGN } from 'app/client_config';
import { createChart, CrosshairMode } from 'lightweight-charts';

function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

class PriceChart extends React.Component {

    static propTypes = {
        trades: PropTypes.array
    };

    shouldComponentUpdate(nextProps) {
        if (
            nextProps.trades !== undefined &&
            (this.props.trades === undefined ||
                JSON.stringify(this.props.trades) !==
                    JSON.stringify(nextProps.trades))
        ) {
            return true;
        }
        return false;
    }

    loadChart = () => {
        if (this.chart) {
            return;
        }
        const {trades} = this.props;
        if (!trades.length) {
            setTimeout(this.loadChart, 100);
            return;
        }
        this.chart = createChart(document.getElementById('PriceChart'), {
            width: 600,
            height: 350,
            localization: {
                locale: tt.getLocale() === 'ru' ? 'ru-RU' : 'en-US'
            },
            crosshair: {
                mode: CrosshairMode.Normal
            }
        });

        var candleSeries = this.chart.addCandlestickSeries();

        candleSeries.applyOptions({
            priceFormat: {
                type: 'price',
                precision: 3,
                minMove: 0.001
            },
            lastValueVisible: false
        });

        let timeFrom0 = trades[trades.length - 1].date;
        let timeFrom = { day: timeFrom0.getUTCDate(), month: timeFrom0.getUTCMonth() + 1, year: timeFrom0.getUTCFullYear() };
        let timeTo0 = trades[0].date;
        let timeTo = { day: timeTo0.getUTCDate(), month: timeTo0.getUTCMonth() + 1, year: timeTo0.getUTCFullYear() };
        var period = {
            timeFrom,
            timeTo,
        };

        let data = [];
        let buckets = {};
        for (let trade of trades) {
            let { date, price } = trade;
            date = date.toISOString().split('T')[0];
            let bucket = buckets[date];
            if (bucket) {
                buckets[date].open = trade.price;
                if (trade.price > buckets[date].high) {
                    buckets[date].high = trade.price;
                }
                if (trade.price < buckets[date].low) {
                    buckets[date].low = trade.price;
                }
            } else {
                buckets[date] = {
                    low: trade.price,
                    open: trade.price,
                    close: trade.price,
                    high: trade.price
                };
            }
        }
        let cur = timeFrom0;
        let timeTo1 = addDays(timeTo0, 1);
        while (cur <= timeTo1) {
            let date = cur.toISOString().split('T')[0];
            let bucket = buckets[date];
            if (bucket) {
                bucket.time = {
                    day: cur.getUTCDate(), month: cur.getUTCMonth() + 1, year: cur.getUTCFullYear()
                };
                data.push(bucket);
            } else {
                data.push({
                    time: {
                        day: cur.getUTCDate(), month: cur.getUTCMonth() + 1, year: cur.getUTCFullYear()
                    }
                });
            }
            cur = addDays(cur, 1);
        }

        candleSeries.setData(data);
    }

    componentDidMount() {
        setTimeout(this.loadChart, 1000);
    }

    render() {
        return (
            <div>
                <div style={{height: '15px'}} />
                <div id="PriceChart">
                </div>
            </div>
        );
    }
}

export default PriceChart;
