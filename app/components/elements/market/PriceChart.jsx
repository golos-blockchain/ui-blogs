import React from 'react';
import {connect} from 'react-redux'
import PropTypes from 'prop-types'
import tt from 'counterpart';
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
        if (nextProps.nightmodeEnabled !== this.props.nightmodeEnabled) {
            return true;
        }
        return false;
    }

    setupChart = () => {
        if (this.props.nightmodeEnabled) {
            const {layout, grid} = JSON.parse(JSON.stringify(this.chart.options()));
            this.oldChartOptions = {layout, grid};

            this.chart.applyOptions({
                layout: {
                    backgroundColor: '#212629',
                    textColor: '#D9D9D9',
                },
                grid: {
                    vertLines: {
                        color: '#2B2B43',
                    },
                    horzLines: {
                        color: '#363C4E',
                    },
                }
            })
        } else if (this.oldChartOptions) {
            this.chart.applyOptions(this.oldChartOptions)
        }
    }

    componentDidUpdate(prevProps) {
        if (this.chart) this.setupChart();
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
            height: 300,
            localization: {
                locale: tt.getLocale() === 'ru' ? 'ru-RU' : 'en-US'
            },
            crosshair: {
                mode: CrosshairMode.Normal
            }
        });

        this.setupChart();

        var candleSeries = this.chart.addCandlestickSeries();

        candleSeries.applyOptions({
            priceFormat: {
                type: 'price',
                precision: 3,
                minMove: 0.001
            },
            lastValueVisible: true
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

        this.chart.timeScale().setVisibleLogicalRange({
            from: data.length - 45,
            to: data.length,
        });
    }

    componentDidMount() {
        setTimeout(this.loadChart, 1000);
    }

    render() {
        return (
            <div>
                <div style={{height: '25px'}} />
                <div id="PriceChart">
                </div>
            </div>
        );
    }
}

export default connect(
    (state, ownProps) => {
        let nightmodeEnabled = process.env.BROWSER ? localStorage.getItem('nightmodeEnabled') == 'true' || false : false

        return {
            ...ownProps,
            nightmodeEnabled,
        }
    },
)(PriceChart)
