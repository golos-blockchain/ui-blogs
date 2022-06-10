import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { Link, browserHistory } from 'react-router';
import tt from 'counterpart';
import {api, broadcast} from 'golos-lib-js'

import transaction from 'app/redux/Transaction';
import {longToAsset} from 'app/utils/ParsersAndFormatters';
import TransactionError from 'app/components/elements/TransactionError';
import Icon from 'app/components/elements/Icon';
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper';
import DropdownMenu from 'app/components/elements/DropdownMenu';

import Order from 'app/utils/market/Order'
import TradeHistory from 'app/utils/market/TradeHistory'
import { roundUp, roundDown, normalizeAssets } from 'app/utils/market/utils'
import MarketPair from 'app/components/elements/market/MarketPair'
import OrderBook from 'app/components/elements/market/OrderBook';
import OrderHistory from 'app/components/elements/market/OrderHistory';
import PriceChart from 'app/components/elements/market/PriceChart';
import TickerPriceStat from 'app/components/elements/market/TickerPriceStat';
import OrderForm from 'app/components/elements/market/OrderForm'
import './Market.scss';

const BY_TYPE = 'type'
const BY_DATE = 'date'
const BY_DATE_ASC = 'date_asc'
const BY_PRICE = 'price'
const BY_PRICE_ASC = 'price_asc'

class Market extends Component {
    static propTypes = {
        orderbook: PropTypes.object,
        open_orders: PropTypes.array,
        ticker: PropTypes.object,
        user: PropTypes.string,
    };

    state = {
        ordersSorting: BY_TYPE
    };

    constructor(props) {
        super(props)
        this.buyForm = React.createRef()
        this.sellForm = React.createRef()
    }

    componentDidUpdate(prevProps) {
        if (!prevProps.ticker && this.props.ticker) {
            const { lowest_ask, highest_bid } = this.props.ticker

            if (this.buyForm.current) {
                this.buyForm.current.setPrice(parseFloat(lowest_ask))
            }
            if (this.sellForm.current) {
                this.sellForm.current.setPrice(parseFloat(highest_bid))
            }
        }
    }

    shouldComponentUpdate = (nextProps, nextState) => {
        const { props, state } = this;

        if (props.routeParams.sym1 !== nextProps.routeParams.sym1) {
            return true;
        }

        if (props.routeParams.sym2 !== nextProps.routeParams.sym2) {
            return true;
        }

        if (props.user !== nextProps.user && nextProps.user) {
            props.reload(nextProps.user, nextProps.location.pathname);
        }

        if (props.user !== nextProps.user && nextProps.user) {
            props.reload(nextProps.user, nextProps.location.pathname);
        }

        for (let key in state) {
            if (state[key] !== nextState[key]) {
                return true;
            }
        }

        if (
            props.ticker === undefined ||
            props.ticker.latest1 !== nextProps.ticker.latest1 ||
            props.ticker.latest2 !== nextProps.ticker.latest2 ||
            props.ticker.asset2_volume !== nextProps.ticker.asset2_volume
        ) {
            return true;
        }

        if (
            props.orderbook === undefined ||
            props.orderbook['asks'].length !==
                nextProps.orderbook['asks'].length ||
            props.orderbook['bids'].length !==
                nextProps.orderbook['bids'].length
        ) {
            return true;
        }

        if (
            nextProps.open_orders !== undefined &&
            (props.open_orders === undefined ||
                JSON.stringify(props.open_orders) !==
                    JSON.stringify(nextProps.open_orders))
        ) {
            return true;
        }

        if (
            nextProps.assets !== undefined &&
            (props.assets === undefined ||
                JSON.stringify(props.assets) !==
                    JSON.stringify(nextProps.assets))
        ) {
            return true;
        }

        if (
            nextProps.history !== undefined &&
            (props.history === undefined ||
                JSON.stringify(props.history) !==
                    JSON.stringify(nextProps.history))
        ) {
            return true;
        }

        return false;
    };

    cancelOrderClick = (e, orderid) => {
        e.preventDefault();
        const { cancelOrder, user } = this.props;

        if (!user) {
            return;
        }

        cancelOrder(user, orderid, msg => {
            this.props.notify(msg);
            this.props.reload(user, this.props.location.pathname);
        });
    };
    cancelOrdersClick = (e) => {
        e.preventDefault();
        const { cancelOrders, user } = this.props;

        if (!user) {
            return;
        }

        let {sym1, sym2} = this.props.routeParams
        cancelOrders(
            user, sym1, sym2, () => {
            this.props.reload(user, this.props.location.pathname);
        });
    };
    cancelSpecificOrdersClick = (orderids, e) => {
        this.props.cancelSpecificOrders(this.props.user, orderids, () => {
            this.props.notify(tt('market_jsx.orders_canceled'));
            this.props.reload(this.props.user, this.props.location.pathname);
        });
    };

    setFormPrice = price => {
        const p = parseFloat(price)
        this.buyForm.current.setPrice(p)
        this.sellForm.current.setPrice(p)
    };

    render() {
        let {sym1, sym2} = this.props.routeParams
        if (!sym1 || !sym2) {
            if(process.env.BROWSER) {browserHistory.push('/market/GOLOS/GBG')
            return(<div></div>)}
        }
        sym1 = sym1.toUpperCase()
        sym2 = sym2.toUpperCase()

        let assets = this.props.assets
        if (!assets) return(<div></div>)
        for (let [key, value] of Object.entries(assets)) {
            if (!value.symbols_whitelist) return (<div></div>)
        }

        let not_exists = []
        if (!(sym1 in assets) && sym1 !== "GOLOS" && sym1 !== "GBG") not_exists.push(sym1)
        if (!(sym2 in assets) && sym2 !== "GOLOS" && sym2 !== "GBG") not_exists.push(sym2)
        if (not_exists.length) return (<div className="NotFound float-center">
            <br/>
            {not_exists.join(', ') + tt('market_jsx.not_exists')}<br/>
            <Link to="/market/GOLOS/GBG">{tt('market_jsx.asset_problem_go_home')}</Link>
            <br/>
            <br/>
        </div>)
        let forbids = []
        if (sym1 in assets && (assets[sym1].symbols_whitelist.length && !assets[sym1].symbols_whitelist.includes(sym2))) forbids.push({sym1: sym1, sym2: sym2})
        if (sym2 in assets && (assets[sym2].symbols_whitelist.length && !assets[sym2].symbols_whitelist.includes(sym1))) forbids.push({sym1: sym2, sym2: sym1})
        let forbid_ps = []
        for (const forbid of forbids) {
            forbid_ps.push(<p key={forbid.sym1}>{forbid.sym1 + tt('market_jsx.forbids') + forbid.sym2}</p>)
        }
        if (forbids.length) return (<div className="NotFound float-center">
            <br/>
            {forbid_ps}
            <Link to="/market/GOLOS/GBG">{tt('market_jsx.asset_problem_go_home')}</Link>
            <br/>
            <br/>
        </div>)

        let assetsNorm = normalizeAssets(assets)
        for (let [key, value] of Object.entries(assetsNorm)) {
            if (!value.json_metadata) {
                return (<div></div>);
            }
        }

        let prec1 = assetsNorm[sym1].precision
        let prec2 = assetsNorm[sym2].precision

        const LIQUID_TOKEN = tt('token_names.LIQUID_TOKEN');
        const LIQUID_TOKEN_UPPERCASE = tt('token_names.LIQUID_TOKEN_UPPERCASE');

        const {
            sellSteem,
            buySteem,
            cancelOrderClick,
            cancelOrdersClick,
            setFormPrice,
        } = this;

        let ticker = {
            latest1: 0,
            latest2: 0,
            lowest_ask: 0,
            highest_bid: 0,
            percent_change1: 0,
            percent_change2: 0,
            asset2_volume: 0,
            asset1_depth: 0,
            asset2_depth: 0,
            feed_price: 0,
        };

        const user = this.props.user;
        const ticker0 = this.props.ticker;
        if (ticker0 !== undefined) {
            let { base, quote } = this.props.feed;

            ticker = {
                latest1: parseFloat(ticker0.latest1),
                latest2: parseFloat(ticker0.latest2),
                lowest_ask: roundUp(parseFloat(ticker0.lowest_ask), 8),
                highest_bid: roundDown(parseFloat(ticker0.highest_bid), 8),
                percent_change1: parseFloat(ticker0.percent_change1),
                percent_change2: parseFloat(ticker0.percent_change2),
                asset2_volume: parseFloat(ticker0.asset2_volume),
                asset1_depth: parseFloat(ticker0.asset1_depth).toFixed(prec1),
                asset2_depth: parseFloat(ticker0.asset2_depth).toFixed(prec2),
                feed_price:
                    parseFloat(base.split(' ')[0]) /
                    parseFloat(quote.split(' ')[0]),
            };
        }

        // Take raw orders from API and put them into a format that's clean & useful
        function normalizeOrders(orders) {
            if (orders === undefined) {
                return { bids: [], asks: [] };
            }

            return {
                bids: orders.bids.map(o => new Order(o, 'bids', sym1, sym2, prec1, prec2, user)),
                asks: orders.asks.map(o => new Order(o, 'asks', sym1, sym2, prec1, prec2, user)),
            };
        }

        function aggOrders(orders) {
            return ['bids', 'asks'].reduce((out, side) => {
                let buff = [];
                let last = null;

                orders[side].map(o => {
                    // o.price = (side == 'asks') ? roundUp(o.price, 6) : Math.max(roundDown(o.price, 6), 0.000001)
                    // the following line should be checking o.price == last.price but it appears due to inverted prices from API,
                    //   inverting again causes values to not be properly sorted.
                    if (
                        last !== null &&
                        o.getStringPrice() === last.getStringPrice()
                    ) {
                        //if(last !== null && o.price == last.price) {
                        buff[buff.length - 1] = buff[buff.length - 1].add(o);
                        // buff[buff.length-1].steem += o.steem
                        // buff[buff.length-1].sbd   += o.sbd
                        // buff[buff.length-1].sbd_depth = o.sbd_depth
                        // buff[buff.length-1].steem_depth = o.steem_depth
                    } else {
                        buff.push(o);
                    }

                    last = o;
                });

                out[side] = buff;
                return out;
            }, {});
        }

        let account = this.props.account ? this.props.account.toJS() : null;
        let open_orders = this.props.open_orders;
        let orderbook = aggOrders(normalizeOrders(this.props.orderbook));

        const normalizeOpenOrders = (openOrders) => {
            let res = openOrders.map(o => {
                const type =
                    o.sell_price.base.indexOf(sym1) > 0
                        ? 'ask'
                        : 'bid';

                return {
                    ...o,
                    type: type,
                    price: parseFloat(
                        type === 'ask' ? o.real_price : o.real_price
                    ),
                    asset1:
                        type === 'ask' ? o.asset1 : o.asset2,
                    asset2:
                        type === 'bid' ? o.asset1 : o.asset2,
                };
            });
            let compare = null
            const { ordersSorting } = this.state
            if (ordersSorting === BY_DATE) {
                compare = (a, b) => {
                    return new Date(b.created) - new Date(a.created)
                }
            } else if (ordersSorting === BY_DATE_ASC) {
                compare = (a, b) => {
                    return new Date(a.created) - new Date(b.created)
                }
            } else if (ordersSorting === BY_PRICE) {
                compare = (a, b) => {
                    return b.price - a.price
                }
            } else if (ordersSorting === BY_PRICE_ASC) {
                compare = (a, b) => {
                    return a.price - b.price
                }
            } 
            if (compare) {
                res.sort(compare)
            }
            return res
        }

        const toggleOrdersSorting = (e, type) => {
            e.preventDefault()
            let ordersSorting = type
            if (this.state.ordersSorting === ordersSorting) {
                if (ordersSorting === BY_DATE) {
                    ordersSorting = BY_DATE_ASC
                }
                if (ordersSorting === BY_PRICE) {
                    ordersSorting = BY_PRICE_ASC
                }
            }
            this.setState({
                ordersSorting
            })
        }

        // Logged-in user's open orders
        const openOrdersTable = (sym1, sym2, openOrders) => {
            let need_reverse = false;
            let sym1_ = sym1.toUpperCase()
            let sym2_ = sym2.toUpperCase()
            if (sym2_ === "GOLOS"
                || (sym2_ < sym1_ && sym1_ !== "GOLOS")) {
                need_reverse = true;
            }
            const rows =
                openOrders &&
                normalizeOpenOrders(openOrders).map(o => (
                    <tr key={o.orderid}>
                        <td>{(this.state.ordersSorting === BY_DATE || this.state.ordersSorting === BY_DATE_ASC) ?
                            (<TimeAgoWrapper date={o.created} />) :
                            (o.created.replace('T', ' '))
                        }</td>
                        <td className={need_reverse ? (o.type === 'bid' ? 'sell-color' : 'buy-color') : (o.type === 'ask' ? 'sell-color' : 'buy-color')}>{tt(need_reverse ? (o.type === 'bid' ? 'g.sell' : 'g.buy') : (o.type === 'ask' ? 'g.sell' : 'g.buy'))}</td>
                        <td className={need_reverse ? (o.type === 'bid' ? 'sell-color' : 'buy-color') : (o.type === 'ask' ? 'sell-color' : 'buy-color')}>
                            {o.price.toFixed(assetsNorm[sym2].precision)}
                        </td>
                        <td>{o.asset1}</td>
                        <td>{o.asset2}</td>
                        <td>
                            <a
                                href="#"
                                onClick={e => cancelOrderClick(e, o.orderid)}
                            >
                                {tt('g.cancel')}
                            </a>
                        </td>
                    </tr>
                ));

            return (
                <table className="Market__open-orders">
                    <thead>
                        <tr>
                            <th>
                                <a href='#' onClick={(e) => toggleOrdersSorting(e, BY_DATE)}>
                                    {tt('market_jsx.date_created')} <Icon name="sorting" />
                                </a>
                            </th>
                            <th>
                                <a href='#' onClick={(e) => toggleOrdersSorting(e, BY_TYPE)}>
                                    {tt('g.type')} <Icon name="sorting" />
                                </a>
                            </th>
                            <th>
                                <a href='#' onClick={(e) => toggleOrdersSorting(e, BY_PRICE)}>
                                    {tt('g.price')} <Icon name="sorting" />
                                </a>
                            </th>
                            <th className="uppercase">{sym1}</th>
                            <th>{sym2}</th>
                            <th>{tt('market_jsx.action')}<br/>
                            {openOrders && openOrders.length ? <a
                                href="#"
                                onClick={e => cancelOrdersClick(e)}
                            >
                                {tt('g.cancel_all')}
                            </a> : null}</th>
                        </tr>
                    </thead>
                    <tbody>{rows}</tbody>
                </table>
            );
        }

        const normalizeTrades = trades => trades.map(t => new TradeHistory(t, sym1, sym2, prec1, prec2));

        const trades = this.props.history ? normalizeTrades(this.props.history) : [];

        let tradeHistoryTable = [];
        if (trades && trades.length) {
            tradeHistoryTable = (<OrderHistory 
                sym1={sym1}
                sym2={sym2}
                prec1={prec1}
                prec2={prec2}
                history={trades} />);
        }

        return (
            <div>
                <div className="row">
                    <div className="column small-8 show-for-medium">
                        <PriceChart
                            trades={trades}
                        />
                    </div>
                    <div className="column"><br/>
                        <h5>
                            <MarketPair assets={assetsNorm} sym1={sym1} sym2={sym2}
                                linkComposer={(sym1, sym2) => {
                                    return '/market/' + sym1 + '/' + sym2
                                }}
                                onChange={({event, link}) => {
                                    if (event) {
                                        event.preventDefault()
                                        window.location.href = link
                                    }
                                }}
                            />
                        </h5>
                        <TickerPriceStat ticker={ticker} trades={trades} symbol={sym2} precision={assetsNorm[sym2].precision} />
                    </div>
                </div>
                <div className="row">
                    <div className="column small-12">
                    <p className="text-center"><Icon name="info_o" /> <small>Попробуйте торговать и через новый интерфейс на <a target="_blank" href="https://dex.golos.app">dex.golos.app</a> или <a target="_blank" href="https://gls.exchange">gls.exchange</a> (подробнее <a target="_blank" href="/@graphenelab/reliz-novoi-birzhi-golos">в посте</a>).</small></p>
                    </div>
                </div>
                <div className="row">
                    <div className="column small-12" style={{background: "rgb(252,84,78)"}}>
                        <TransactionError opType="limit_order_create" />
                    </div>
                </div>
                <div className="row">
                    <div className="small-12 medium-6 columns">
                        <h4 className="buy-color uppercase inline">
                            {tt('navigation.buy_LIQUID_TOKEN', {
                                LIQUID_TOKEN: sym1,
                            })}  
                        </h4>&nbsp;&nbsp;&nbsp;<div className="inline"><small>({tt('market_jsx.market_depth_') + ': '}<b>{ticker.asset2_depth + ' ' + sym2}</b>)</small></div>
                        <OrderForm ref={this.buyForm} account={account} sym1={sym1} sym2={sym2} assets={assetsNorm}
                            bestPrice={ticker.lowest_ask}
                            onCreate={msg => {
                                this.props.notify(msg);
                                this.props.reload(user, this.props.location.pathname);
                            }} />
                    </div>

                    <div className="small-12 medium-6 columns">
                        <h4 className="sell-color uppercase inline">
                            {tt('navigation.sell_LIQUID_TOKEN', {
                                LIQUID_TOKEN: sym1
                            })}
                        </h4>&nbsp;&nbsp;&nbsp;<div className="inline"><small>({tt('market_jsx.market_depth_') + ': '} <b>{ticker.asset1_depth + ' ' + sym1}</b>)</small></div>
                        <OrderForm ref={this.sellForm} account={account} sym1={sym1} sym2={sym2} assets={assetsNorm}
                            isSell={true} bestPrice={ticker.highest_bid}
                            onCreate={msg => {
                                this.props.notify(msg);
                                this.props.reload(user, this.props.location.pathname);
                            }} />
                    </div>
                </div>

                <div className="row">
                    <div className="column small-12">
{assets && assetsNorm[sym1].allow_override_transfer && (<p className="text-center"><Icon name="info_o" /> <small>{tt('market_jsx.asset_') + sym1 + tt('market_jsx.asset_is_overridable')} <a target="_blank" href="https://wiki.golos.id/users/faq#chto-takoe-otzyvnye-uia-tokeny">{tt('g.more_hint')} ></a></small></p>)}
{assets && assetsNorm[sym2].allow_override_transfer && (<p className="text-center"><Icon name="info_o" /> <small>{tt('market_jsx.asset_') + sym2 + tt('market_jsx.asset_is_overridable')} <a target="_blank" href="https://wiki.golos.id/users/faq#chto-takoe-otzyvnye-uia-tokeny">{tt('g.more_hint')} ></a></small></p>)}
                    </div>
                </div>

                <div className="row show-for-medium">
                    <div className="small-6 columns">
                        <h4>{tt('market_jsx.buy_orders')}</h4>
                        <OrderBook
                            sym1={sym1}
                            sym2={sym2}
                            prec1={prec1}
                            prec2={prec2}
                            side={'bids'}
                            orders={orderbook.bids}
                            onClick={price => {
                                setFormPrice(price);
                            }}
                            cancelSpecificOrdersClick={this.cancelSpecificOrdersClick}
                        />
                    </div>

                    <div className="small-6 columns">
                        <h4>{tt('market_jsx.sell_orders')}</h4>
                        <OrderBook
                            sym1={sym1}
                            sym2={sym2}
                            prec1={prec1}
                            prec2={prec2}
                            side={'asks'}
                            orders={orderbook.asks}
                            onClick={price => {
                                setFormPrice(price);
                            }}
                            cancelSpecificOrdersClick={this.cancelSpecificOrdersClick}
                        />
                    </div>
                </div>
                <div className="row ">
                    <div className="small-12 column">
                        <h4>{tt('market_jsx.trade_history')}</h4>
                        {tradeHistoryTable}
                    </div>
                </div>
                {account ? (
                    <div className="row">
                        <div className="column">
                            <h4>{tt('market_jsx.open_orders')}</h4>
                            {openOrdersTable(sym1, sym2, open_orders)}
                        </div>
                    </div>
                ) : null}
            </div>
        );
    }
}

export default connect(
    state => {
        const username = state.user.getIn(['current', 'username']);
        return {
            orderbook: state.market.get('orderbook'),
            open_orders: process.env.BROWSER
                ? state.market.get('open_orders')
                : [],
            ticker: state.market.get('ticker'),
            account: username
                ? state.global.getIn(['accounts', username])
                : null,
            assets: (process.env.BROWSER && state.market.get('assets'))
                ? state.market.get('assets')
                : null,
            history: state.market.get('history'),
            user: username,
            feed: state.global.get('feed_price').toJS(),
        };
    },
    dispatch => ({
        notify: message => {
            dispatch({
                type: 'ADD_NOTIFICATION',
                payload: {
                    key: 'mkt_' + Date.now(),
                    message: message,
                    dismissAfter: 5000,
                },
            });
        },
        reload: (username, pathname) => {
            dispatch({
                type: 'market/UPDATE_MARKET',
                payload: { username: username, pathname: pathname },
            });
        },
        cancelOrder: (owner, orderid, successCallback) => {
            const confirm = tt('market_jsx.order_cancel_confirm', {
                order_id: orderid,
                user: owner,
            });

            const successMessage = tt('market_jsx.order_cancelled', {
                order_id: orderid,
            });

            dispatch(
                transaction.actions.broadcastOperation({
                    type: 'limit_order_cancel',
                    operation: {
                        owner,
                        orderid,
                    },
                    confirm,
                    successCallback: () => {
                        successCallback(successMessage);
                    },
                    //successCallback
                })
            );
        },
        cancelOrders: (owner, symbol1, symbol2, successCallback) => {
            const confirm = tt('market_jsx.order_cancel_all_confirm', {
                symbol1,
                symbol2,
                user: owner,
            });
            let operation = {
                owner,
                orderid: 0,
                extensions: [[0, {
                    base: symbol1,
                    quote: symbol2,
                    reverse: true,
                }]]
            }
            dispatch(
                transaction.actions.broadcastOperation({
                    type: 'limit_order_cancel_ex',
                    operation,
                    confirm,
                    successCallback: () => {
                        successCallback();
                    },
                    errorCallback: (e) => {
                        console.log(e);
                    }
                })
            );
        },
        cancelSpecificOrders: (owner, orderids, successCallback) => {
            const confirm = tt('market_jsx.order_cancel_confirm_few', {
                order_cnt: orderids.length,
                user: owner,
            });
            let OPERATIONS = [];
            for (const oid of orderids) {
                OPERATIONS.push(
                    ['limit_order_cancel',
                        {
                            owner,
                            orderid: oid
                        }
                    ]);
            }
            dispatch(
                transaction.actions.broadcastOperation({
                    type: 'limit_order_cancel',
                    trx: OPERATIONS,
                    confirm,
                    successCallback: () => {
                        successCallback();
                    },
                    errorCallback: (e) => {
                        console.log(e);
                    }
                })
            );
        },
    })
)(Market);
