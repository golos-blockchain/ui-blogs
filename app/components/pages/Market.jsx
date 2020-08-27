import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { Link, browserHistory } from 'react-router';
import tt from 'counterpart';
import transaction from 'app/redux/Transaction';
import {longToAsset} from 'app/utils/ParsersAndFormatters';
import TransactionError from 'app/components/elements/TransactionError';
import Icon from 'app/components/elements/Icon';
import DropdownMenu from 'app/components/elements/DropdownMenu';
import DepthChart from 'app/components/elements/DepthChart';
import Orderbook from 'app/components/elements/Orderbook';
import OrderHistory from 'app/components/elements/OrderHistory';
import { Order, TradeHistory } from 'app/utils/MarketClasses';
import { roundUp, roundDown } from 'app/utils/MarketUtils';
import TickerPriceStat from 'app/components/elements/TickerPriceStat';
import {
    DEBT_TOKEN_SHORT,
    LIQUID_TICKER,
    DEBT_TICKER,
} from 'app/client_config';
import './Market.scss';

class Market extends Component {
    static propTypes = {
        orderbook: PropTypes.object,
        open_orders: PropTypes.array,
        ticker: PropTypes.object,
        placeOrder: PropTypes.func.isRequired,
        user: PropTypes.string,
    };

    state = {
        buyDisabled: true,
        sellDisabled: true,
        buyPriceWarning: false,
        sellPriceWarning: false,
        showDepthChart: false,
    };

    componentDidMount() {
        this._depthChartTimeout = setTimeout(() => {
            this.setState({ showDepthChart: true });
        }, 500);
    }

    componentWillUnmount() {
        clearTimeout(this._depthChartTimeout);
    }

    componentWillReceiveProps(np) {
        if (!this.props.ticker && np.ticker) {
            const { lowest_ask, highest_bid } = np.ticker;

            if (this.refs.buySteemPrice) {
                this.refs.buySteemPrice.value = parseFloat(lowest_ask).toFixed(
                    6
                );
            }

            if (this.refs.sellSteem_price) {
                this.refs.sellSteem_price.value = parseFloat(
                    highest_bid
                ).toFixed(6);
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
            props.ticker.latest !== nextProps.ticker.latest ||
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

        return false;
    };

    buySteem = e => {
        e.preventDefault();

        let {sym1, sym2} = this.props.routeParams
        sym1 = sym1.toUpperCase()
        sym2 = sym2.toUpperCase()
        if (sym2 === "GOLOS"
            || (sym2 < sym1 && sym1 !== "GOLOS")) {
            [sym1, sym2] = [sym2, sym1]
        }

        const { placeOrder, user } = this.props;
        if (!user) return;
        const amount_to_sell = parseFloat(
            ReactDOM.findDOMNode(this.refs.buySteemTotal).value
        );
        const min_to_receive = parseFloat(
            ReactDOM.findDOMNode(this.refs.buySteemAmount).value
        );
        const price = (amount_to_sell / min_to_receive).toFixed(6);
        const { lowest_ask } = this.props.ticker;
        placeOrder(
            (this.props.assets ? this.props.assets : {}),
            sym1, sym2,
            user,
            `${amount_to_sell} ${sym2}`,
            `${min_to_receive} ${sym1}`,
            `${sym2} ${price}/${sym1}`,
            !!this.state.buyPriceWarning,
            lowest_ask,
            msg => {
                this.props.notify(msg);
                this.props.reload(user, this.props.location.pathname);
            }
        );
    };
    sellSteem = e => {
        e.preventDefault();

        let {sym1, sym2} = this.props.routeParams
        sym1 = sym1.toUpperCase()
        sym2 = sym2.toUpperCase()
        if (sym2 === "GOLOS"
            || (sym2 < sym1 && sym1 !== "GOLOS")) {
            [sym1, sym2] = [sym2, sym1]
        }

        const { placeOrder, user } = this.props;
        if (!user) {
            return;
        }

        const min_to_receive = parseFloat(
            ReactDOM.findDOMNode(this.refs.sellSteem_total).value
        );

        const amount_to_sell = parseFloat(
            ReactDOM.findDOMNode(this.refs.sellSteem_amount).value
        );

        const price = (min_to_receive / amount_to_sell).toFixed(6);
        const { highest_bid } = this.props.ticker;

        placeOrder(
            (this.props.assets ? this.props.assets : {}),
            sym2, sym1,
            user,
            `${amount_to_sell} ${sym1}`,
            `${min_to_receive} ${sym2}`,
            `${sym2} ${price}/${sym1}`,
            !!this.state.sellPriceWarning,
            highest_bid,
            msg => {
                this.props.notify(msg);
                this.props.reload(user, this.props.location.pathname);
            }
        );
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

    setFormPrice = price => {
        const p = parseFloat(price);

        this.refs.sellSteem_price.value = p.toFixed(6);
        this.refs.buySteemPrice.value = p.toFixed(6);

        const samount = parseFloat(this.refs.sellSteem_amount.value);
        if (samount >= 0) {
            this.refs.sellSteem_total.value = roundDown(p * samount, 3);
        }

        const bamount = parseFloat(this.refs.buySteemAmount.value);
        if (bamount >= 0) {
            this.refs.buySteemTotal.value = roundUp(p * bamount, 3);
        }

        this.validateBuySteem();
        this.validateSellSteem();
    };

    percentDiff = (marketPrice, userPrice) => {
        marketPrice = parseFloat(marketPrice);
        return (100 * (userPrice - marketPrice)) / marketPrice;
    };

    validateBuySteem = () => {
        const amount = parseFloat(this.refs.buySteemAmount.value);
        const price = parseFloat(this.refs.buySteemPrice.value);
        const total = parseFloat(this.refs.buySteemTotal.value);

        const valid = amount > 0 && price > 0 && total > 0;
        let { lowest_ask } = this.props.ticker;

        this.setState({
            buyDisabled: !valid,
            buyPriceWarning: valid && this.percentDiff(lowest_ask, price) > 15,
        });
    };

    validateSellSteem = () => {
        const amount = parseFloat(this.refs.sellSteem_amount.value);
        const price = parseFloat(this.refs.sellSteem_price.value);
        const total = parseFloat(this.refs.sellSteem_total.value);
        const valid = amount > 0 && price > 0 && total > 0;
        let { highest_bid } = this.props.ticker;

        this.setState({
            sellDisabled: !valid,
            sellPriceWarning:
                valid && this.percentDiff(highest_bid, price) < -15,
        });
    };

    render() {
        let {sym1, sym2} = this.props.routeParams
        if (!sym1 || !sym2) {
            if(process.env.BROWSER) {browserHistory.push('/market/GOLOS/GBG')
            return(<div></div>)}
        }
        sym1 = sym1.toUpperCase()
        sym2 = sym2.toUpperCase()
        if (sym2 === "GOLOS"
            || (sym2 < sym1 && sym1 !== "GOLOS")) {
            [sym1, sym2] = [sym2, sym1]
        }

        let assets = this.props.assets ? this.props.assets : {};

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

        let assets_right = {}
        assets_right['GOLOS'] = {supply: '0.000 GOLOS', symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/golos.png"}'}
        assets_right['GBG'] = {supply: '0.000 GBG', symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/gold-golos.png"}'}
        for (let [key, value] of Object.entries(assets)) {
            assets_right[key] = value
        }

        let prec1 = assets_right[sym1].supply.split('.')[1]
        prec1 = prec1.split(' ')[0].length
        let prec2 = assets_right[sym2].supply.split('.')[1].split(' ')[0].length

        const LIQUID_TOKEN = tt('token_names.LIQUID_TOKEN');
        const LIQUID_TOKEN_UPPERCASE = tt('token_names.LIQUID_TOKEN_UPPERCASE');

        const {
            sellSteem,
            buySteem,
            cancelOrderClick,
            setFormPrice,
            validateBuySteem,
            validateSellSteem,
        } = this;

        const {
            buyDisabled,
            sellDisabled,
            buyPriceWarning,
            sellPriceWarning,
        } = this.state;

        let ticker = {
            latest: 0,
            lowest_ask: 0,
            highest_bid: 0,
            percent_change: 0,
            asset2_volume: 0,
            asset1_depth: 0,
            asset2_depth: 0,
            feed_price: 0,
        };

        if (this.props.ticker !== undefined) {
            let {
                latest,
                lowest_ask,
                highest_bid,
                percent_change,
                asset2_volume,
            asset1_depth,
            asset2_depth,
            } = this.props.ticker;

            let { base, quote } = this.props.feed;

            ticker = {
                latest: parseFloat(latest),
                lowest_ask: roundUp(parseFloat(lowest_ask), 6),
                highest_bid: roundDown(parseFloat(highest_bid), 6),
                percent_change: parseFloat(percent_change),
                asset2_volume: parseFloat(asset2_volume),
                asset1_depth: parseFloat(asset1_depth).toFixed(prec1),
                asset2_depth: parseFloat(asset2_depth).toFixed(prec2),
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

            let prec1_ = prec1;
            let prec2_ = prec2;
            return {
                bids: orders.bids.map(o => new Order(o, 'bids', sym1, sym2, prec1_, prec2_)),
                asks: orders.asks.map(o => new Order(o, 'asks', sym1, sym2, prec1_, prec2_)),
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

        function normalizeOpenOrders(openOrders) {
            return openOrders.map(o => {
                const type =
                    o.sell_price.base.indexOf(LIQUID_TICKER) > 0
                        ? 'ask'
                        : 'bid';

                return {
                    ...o,
                    type: type,
                    price: parseFloat(
                        type === 'ask' ? o.real_price : o.real_price
                    ),
                    asset1:
                        type === 'ask' ? o.sell_price.base : o.sell_price.quote,
                    asset2:
                        type === 'bid' ? o.sell_price.base : o.sell_price.quote,
                };
            });
        }

        // Logged-in user's open orders
        function openOrdersTable(sym1, sym2, openOrders) {
            const rows =
                openOrders &&
                normalizeOpenOrders(openOrders).map(o => (
                    <tr key={o.orderid}>
                        <td>{o.created.replace('T', ' ')}</td>
                        <td>{tt(o.type === 'ask' ? 'g.sell' : 'g.buy')}</td>
                        <td>
                            {sym2} {o.price.toFixed(6)}
                        </td>
                        <td>{o.asset1}</td>
                        <td>{o.asset2.replace('SBD', DEBT_TOKEN_SHORT)}</td>
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
                            <th>{tt('market_jsx.date_created')}</th>
                            <th>{tt('g.type')}</th>
                            <th>{tt('g.price')}</th>
                            <th className="uppercase">{sym1}</th>
                            <th>{sym2}</th>
                            <th>{tt('market_jsx.action')}</th>
                        </tr>
                    </thead>
                    <tbody>{rows}</tbody>
                </table>
            );
        }

        function tradeHistoryTable(trades) {
            if (!trades || !trades.length) {
                return [];
            }
            const norm = trades => trades.map(t => new TradeHistory(t, sym1, sym2, prec1, prec2));

            return <OrderHistory 
                        sym1={sym1}
                        sym2={sym2}
                        prec1={prec1}
                        prec2={prec2}
                        history={norm(trades)} />;
        }

        let symbols1 = [];
        let symbols2 = [];
        for (let [key, value] of Object.entries(assets_right)) {
            let description = ""
            let image_url = ""
            if (value.json_metadata.startsWith('{')) {
                let json_metadata = JSON.parse(value.json_metadata)
                description = json_metadata.description
                image_url = json_metadata.image_url
            }

            if (sym1 !== key && sym2 !== key && (!value.symbols_whitelist.length || value.symbols_whitelist.includes(sym2)) && (!assets_right[sym2].symbols_whitelist.length || assets_right[sym2].symbols_whitelist.includes(key)))
            symbols1.push({key: key, value: key,
                label: (<span style={{lineHeight: "28px"}}><img src={image_url} width="28" height="28"/>&nbsp;{key}</span>),
                link: '/market/' + key + '/' + sym2,
            onClick: (e) => {window.location.href = '/market/' + sym2 + '/' + key}});

            if (sym1 !== key && sym2 !== key && (!value.symbols_whitelist.length || value.symbols_whitelist.includes(sym1)) && (!assets_right[sym1].symbols_whitelist.length || assets_right[sym1].symbols_whitelist.includes(key)))
            symbols2.push({key: key, value: key,
                label: (<span style={{lineHeight: "28px"}}><img src={image_url} width="28" height="28"/>&nbsp;{key}</span>),
                link: '/market/' + sym1 + '/' + key, 
            onClick: (e) => {window.location.href = '/market/' + sym1 + '/' + key}});
        }

        return (
            <div>
                <div className="row">
                    <div className="column small-8">
                        {this.state.showDepthChart ? (
                            <DepthChart
                                bids={orderbook.bids}
                                asks={orderbook.asks}
                            />
                        ) : null}
                    </div>
                    <div className="column small-4"><br/><h5>
                        <DropdownMenu el="div" items={symbols1}>
                            <span>
                                {sym1 === "GOLOS" ? (<img src="/images/golos.png" width="36" height="36" style={{marginBottom: "4px"}} />) : null}
                                {sym1 === "GBG" ? (<img src="/images/gold-golos.png" width="36" height="36" style={{marginBottom: "4px"}} />) : null}
                                {sym1}
                                {symbols1.length > 0 && <Icon name="dropdown-arrow" />}
                            </span>
                        </DropdownMenu>
                        {" / "}
                        <DropdownMenu el="div" items={symbols2}>
                            <span>
                                {sym2 === "GOLOS" ? (<img src="/images/golos.png" width="36" height="36" style={{marginBottom: "4px"}} />) : null}
                                {sym2 === "GBG" ? (<img src="/images/gold-golos.png" width="36" height="36" style={{marginBottom: "4px"}} />) : null}
                                {sym2}
                                {symbols2.length > 0 && <Icon name="dropdown-arrow" />}
                            </span>
                        </DropdownMenu></h5>
                        <TickerPriceStat ticker={ticker} symbol={sym2} />
                    </div>
                </div>

                <div className="row">
                    <div className="column small-12">
{assets && assets_right[sym1].allow_override_transfer && (<div className="callout error text-center"><Icon name="info_o" /> {tt('market_jsx.asset_') + sym1 + tt('market_jsx.asset_is_overridable')}</div>)}
{assets && assets_right[sym2].allow_override_transfer && (<div className="callout error text-center"><Icon name="info_o" /> {tt('market_jsx.asset_') + sym2 + tt('market_jsx.asset_is_overridable')}</div>)}
                    </div>
                </div>
                <div className="row">
                    <div className="column small-12">
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
                        <form className="Market__orderform" onSubmit={buySteem}>
                            <div className="row">
                                <div className="column small-3 large-2">
                                    <label>{tt('g.price')}</label>
                                </div>
                                <div className="column small-9 large-8">
                                    <div className="input-group">
                                        <input
                                            className={
                                                'input-group-field' +
                                                (buyPriceWarning
                                                    ? ' price_warning'
                                                    : '')
                                            }
                                            type="text"
                                            ref="buySteemPrice"
                                            placeholder="0.0"
                                            onChange={e => {
                                                const amount = parseFloat(
                                                    this.refs.buySteemAmount
                                                        .value
                                                );
                                                const price = parseFloat(
                                                    this.refs.buySteemPrice
                                                        .value
                                                );
                                                if (amount >= 0 && price >= 0)
                                                    this.refs.buySteemTotal.value = roundUp(
                                                        price * amount,
                                                        3
                                                    );
                                                validateBuySteem();
                                            }}
                                        />
                                        <span className="input-group-label uppercase">
                                            {`${sym2}/${sym1}`}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="column small-3 large-2">
                                    <label>{tt('g.amount')}</label>
                                </div>
                                <div className="column small-9 large-8">
                                    <div className="input-group">
                                        <input
                                            className="input-group-field"
                                            type="text"
                                            ref="buySteemAmount"
                                            placeholder="0.0"
                                            onChange={e => {
                                                const price = parseFloat(
                                                    this.refs.buySteemPrice
                                                        .value
                                                );
                                                const amount = parseFloat(
                                                    this.refs.buySteemAmount
                                                        .value
                                                );
                                                if (price >= 0 && amount >= 0)
                                                    this.refs.buySteemTotal.value = roundUp(
                                                        price * amount,
                                                        3
                                                    );
                                                validateBuySteem();
                                            }}
                                        />
                                        <span className="input-group-label uppercase">
                                            {' '}
                                            {sym1}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="column small-3 large-2">
                                    <label>{tt('market_jsx.total')}</label>
                                </div>
                                <div className="column small-9 large-8">
                                    <div className="input-group">
                                        <input
                                            className="input-group-field"
                                            type="text"
                                            ref="buySteemTotal"
                                            placeholder="0.0"
                                            onChange={e => {
                                                const price = parseFloat(
                                                    this.refs.buySteemPrice
                                                        .value
                                                );
                                                const total = parseFloat(
                                                    this.refs.buySteemTotal
                                                        .value
                                                );
                                                if (total >= 0 && price >= 0)
                                                    this.refs.buySteemAmount.value = roundUp(
                                                        total / price,
                                                        3
                                                    );
                                                validateBuySteem();
                                            }}
                                        />
                                        <span className="input-group-label">
                                            {sym2}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="column small-3 large-2" />
                                <div className="column small-9 large-8">
                                    <input
                                        disabled={buyDisabled}
                                        type="submit"
                                        className="button hollow buy-color float-right uppercase"
                                        value={tt(
                                            'navigation.buy_LIQUID_TOKEN',
                                            { LIQUID_TOKEN: sym1 }
                                        )}
                                    />

                                    <div>
                                        {(((sym2 === "GBG" || sym2 === "GOLOS") && account) || (assets && sym2 in assets)) && (
                                        <small>
                                            <a
                                                href="#"
                                                onClick={e => {
                                                    e.preventDefault();
                                                    const price = parseFloat(
                                                        this.refs.buySteemPrice.value
                                                    );
                                                    let total = '';
                                                    if (sym2 === "GBG") {
                                                        total = account.sbd_balance.split(
                                                            ' '
                                                        )[0];
                                                    }
                                                    else if (sym2 === "GOLOS") {
                                                        total = account.steem_balance.split(
                                                            ' '
                                                        )[0];
                                                    }
                                                    else {
                                                        total = assets[sym2].balance.split(
                                                            ' '
                                                        )[0];
                                                    }
                                                    this.refs.buySteemTotal.value = total;
                                                    if (price >= 0)
                                                        this.refs.buySteemAmount.value = roundDown(
                                                            parseFloat(total) / price,
                                                            3
                                                        ).toFixed(3);
                                                    validateBuySteem();
                                                }}
                                            >
                                                {tt('market_jsx.available')}:
                                            </a>{' '}
                                            {sym2 === "GBG" && account.sbd_balance.replace(
                                                'GBG',
                                                DEBT_TOKEN_SHORT
                                            )}
                                            {sym2 === "GOLOS" && account.balance.replace(
                                                LIQUID_TICKER,
                                                LIQUID_TOKEN_UPPERCASE
                                            )}
                                            {sym2 !== "GOLOS" && sym2 !== "GBG" && assets[sym2].balance}
                                        </small>
                                        )}
                                        <br/>
                                        <small>
                                            <a
                                                href="#"
                                                onClick={e => {
                                                    e.preventDefault();
                                                    const amount = parseFloat(
                                                        this.refs.buySteemAmount
                                                            .value
                                                    );
                                                    const price = parseFloat(
                                                        ticker.lowest_ask
                                                    );
                                                    this.refs.buySteemPrice.value =
                                                        ticker.lowest_ask;
                                                    if (amount >= 0)
                                                        this.refs.buySteemTotal.value = roundUp(
                                                            amount * price,
                                                            3
                                                        ).toFixed(3);
                                                    validateBuySteem();
                                                }}
                                            >
                                                {tt('market_jsx.lowest_ask')}:
                                            </a>{' '}
                                            {ticker.lowest_ask.toFixed(6)}<br/>
                                            {assets ? (<b>{tt('market_jsx.market_fee_percent_') + sym1 + ': ' + longToAsset(assets_right[sym1].fee_percent, '', 2).trim() + '%'}</b>) : null}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="small-12 medium-6 columns">
                        <h4 className="sell-color uppercase inline">
                            {tt('navigation.sell_LIQUID_TOKEN', {
                                LIQUID_TOKEN: sym1
                            })}
                        </h4>&nbsp;&nbsp;&nbsp;<div className="inline"><small>({tt('market_jsx.market_depth_') + ': '} <b>{ticker.asset1_depth + ' ' + sym1}</b>)</small></div>

                        <form
                            className="Market__orderform"
                            onSubmit={sellSteem}
                        >
                            <div className="row">
                                <div className="column small-3 large-2">
                                    <label>{tt('g.price')}</label>
                                </div>

                                <div className="column small-9 large-8">
                                    <div className="input-group">
                                        <input
                                            className={
                                                'input-group-field' +
                                                (sellPriceWarning
                                                    ? ' price_warning'
                                                    : '')
                                            }
                                            type="text"
                                            ref="sellSteem_price"
                                            placeholder="0.0"
                                            onChange={e => {
                                                const amount = parseFloat(
                                                    this.refs.sellSteem_amount
                                                        .value
                                                );
                                                const price = parseFloat(
                                                    this.refs.sellSteem_price
                                                        .value
                                                );
                                                if (amount >= 0 && price >= 0)
                                                    this.refs.sellSteem_total.value = roundDown(
                                                        price * amount,
                                                        3
                                                    );
                                                validateSellSteem();
                                            }}
                                        />
                                        <span className="input-group-label uppercase">
                                            {`${sym2}/${sym1}`}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="column small-3 large-2">
                                    <label>{tt('g.amount')}</label>
                                </div>
                                <div className="column small-9 large-8">
                                    <div className="input-group">
                                        <input
                                            className="input-group-field"
                                            type="text"
                                            ref="sellSteem_amount"
                                            placeholder="0.0"
                                            onChange={() => {
                                                const price = parseFloat(
                                                    this.refs.sellSteem_price
                                                        .value
                                                );
                                                const amount = parseFloat(
                                                    this.refs.sellSteem_amount
                                                        .value
                                                );
                                                if (price >= 0 && amount >= 0)
                                                    this.refs.sellSteem_total.value = roundDown(
                                                        price * amount,
                                                        3
                                                    );
                                                validateSellSteem();
                                            }}
                                        />
                                        <span className="input-group-label uppercase">
                                            {sym1}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="column small-3 large-2">
                                    <label>{tt('market_jsx.total')}</label>
                                </div>
                                <div className="column small-9 large-8">
                                    <div className="input-group">
                                        <input
                                            className="input-group-field"
                                            type="text"
                                            ref="sellSteem_total"
                                            placeholder="0.0"
                                            onChange={e => {
                                                const price = parseFloat(
                                                    this.refs.sellSteem_price
                                                        .value
                                                );
                                                const total = parseFloat(
                                                    this.refs.sellSteem_total
                                                        .value
                                                );
                                                if (price >= 0 && total >= 0)
                                                    this.refs.sellSteem_amount.value = roundUp(
                                                        total / price,
                                                        3
                                                    );
                                                validateSellSteem();
                                            }}
                                        />
                                        <span className="input-group-label">
                                            {sym2}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="column small-3 large-2" />
                                <div className="column small-9 large-8">
                                    <input
                                        disabled={sellDisabled}
                                        type="submit"
                                        className="button hollow sell-color float-right uppercase"
                                        value={tt(
                                            'navigation.sell_LIQUID_TOKEN',
                                            { LIQUID_TOKEN: sym1 }
                                        )}
                                    />

                                    <div>
                                        {(((sym1 === "GBG" || sym1 === "GOLOS") && account) || (assets && sym1 in assets)) && (
                                        <small>
                                            <a
                                                href="#"
                                                onClick={e => {
                                                    e.preventDefault();
                                                    const price = parseFloat(
                                                        this.refs.sellSteem_price.value
                                                    );
                                                    const amount = account.balance.split(
                                                        ' '
                                                    )[0];
                                                    this.refs.sellSteem_amount.value = amount;
                                                    if (price >= 0)
                                                        this.refs.sellSteem_total.value = roundDown(
                                                            price * parseFloat(amount),
                                                            3
                                                        );
                                                    validateSellSteem();
                                                }}
                                            >
                                                {tt('market_jsx.available')}:
                                            </a>{' '}
                                            {sym1 === "GBG" && account.sbd_balance.replace(
                                                'GBG',
                                                DEBT_TOKEN_SHORT
                                            )}
                                            {sym1 === "GOLOS" && account.balance.replace(
                                                LIQUID_TICKER,
                                                LIQUID_TOKEN_UPPERCASE
                                            )}
                                            {sym1 !== "GOLOS" && sym1 !== "GBG" && assets[sym1].balance}
                                        </small>
                                        )}
                                        <br/>
                                        <small>
                                            <a
                                                href="#"
                                                onClick={e => {
                                                    e.preventDefault();
                                                    const amount = parseFloat(
                                                        this.refs
                                                            .sellSteem_amount
                                                            .value
                                                    );
                                                    const price =
                                                        ticker.highest_bid;
                                                    this.refs.sellSteem_price.value = price;
                                                    if (amount >= 0)
                                                        this.refs.sellSteem_total.value = roundDown(
                                                            parseFloat(price) *
                                                                amount,
                                                            3
                                                        );
                                                    validateSellSteem();
                                                }}
                                            >
                                                {tt('market_jsx.highest_bid')}:
                                            </a>{' '}
                                            {ticker.highest_bid.toFixed(6)}<br/>
                                            {assets ? (<b>{tt('market_jsx.market_fee_percent_') + sym2 + ': ' + longToAsset(assets_right[sym2].fee_percent, '', 2).trim() + '%'}</b>) : null}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="row show-for-medium">
                    <div className="small-6 columns">
                        <h4>{tt('market_jsx.buy_orders')}</h4>
                        <Orderbook
                            sym1={sym1}
                            sym2={sym2}
                            prec1={prec1}
                            prec2={prec2}
                            side={'bids'}
                            orders={orderbook.bids}
                            onClick={price => {
                                setFormPrice(price);
                            }}
                        />
                    </div>

                    <div className="small-6 columns">
                        <h4>{tt('market_jsx.sell_orders')}</h4>
                        <Orderbook
                            sym1={sym1}
                            sym2={sym2}
                            prec1={prec1}
                            prec2={prec2}
                            side={'asks'}
                            orders={orderbook.asks}
                            onClick={price => {
                                setFormPrice(price);
                            }}
                        />
                    </div>
                </div>
                <div className="row ">
                    <div className="small-12 column">
                        <h4>{tt('market_jsx.trade_history')}</h4>
                        {tradeHistoryTable(this.props.history)}
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
const DEFAULT_EXPIRE = 0xffffffff;

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
                : {},
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
        placeOrder: (
            assets,
            sym1, sym2,
            owner,
            amount_to_sell,
            min_to_receive,
            effectivePrice,
            priceWarning,
            marketPrice,
            successCallback,
            fill_or_kill = false,
            expiration = DEFAULT_EXPIRE
        ) => {
            // create_order jsc 12345 "1.000 SBD" "100.000 STEEM" true 1467122240 false

            let assets_right = {}
            assets_right['GOLOS'] = {supply: '0.000 GOLOS', fee_percent: 0, json_metadata: '{"image_url": "/images/golos.png"}'}
            assets_right['GBG'] = {supply: '0.000 GBG', fee_percent: 0, json_metadata: '{"image_url": "/images/gold-golos.png"}'}
            for (let [key, value] of Object.entries(assets)) {
                assets_right[key] = value
            }
            let prec1 = assets_right[sym1].supply.split('.')[1]
            prec1 = prec1.split(' ')[0].length
            let prec2 = assets_right[sym2].supply.split('.')[1].split(' ')[0].length

            // Padd amounts to 3 decimal places
            amount_to_sell = amount_to_sell.replace(
                amount_to_sell.split(' ')[0],
                String(parseFloat(amount_to_sell).toFixed(prec2))
            );
            min_to_receive = min_to_receive.replace(
                min_to_receive.split(' ')[0],
                String(parseFloat(min_to_receive).toFixed(prec1))
            );

            const isSell = amount_to_sell.indexOf(sym1) > 0;
            const confirmStr = tt(
                isSell
                    ? 'market_jsx.sell_amount_for_atleast'
                    : 'market_jsx.buy_atleast_amount_for',
                { amount_to_sell, min_to_receive, effectivePrice }
            );
            const successMessage = tt('g.order_placed') + ': ' + confirmStr;
            const confirm = confirmStr + '?';
            const warning = priceWarning
                ? tt(
                      'market_jsx.price_warning_' +
                          (isSell ? 'below' : 'above'),
                      {
                          marketPrice:
                              sym2 +
                              parseFloat(marketPrice).toFixed(4) +
                              '/' +
                              sym1,
                      }
                  )
                : null;

            const orderid = Math.floor(Date.now() / 1000);

            const operation = {
                owner,
                amount_to_sell,
                min_to_receive,
                fill_or_kill,
                expiration,
                orderid,
            }

            dispatch(
                transaction.actions.broadcastOperation({
                    type: 'limit_order_create',
                    operation,
                    confirm,
                    warning,
                    successCallback: () => {
                        successCallback(successMessage);
                    },
                })
            );
        },
    })
)(Market);
