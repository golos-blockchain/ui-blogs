import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { Link, browserHistory } from 'react-router';
import tt from 'counterpart';
import {api} from 'golos-classic-js'
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
        buySteemFeePct: '0%',
        sellSteemFeePct: '0%',
        showDepthChart: false,
        sym1_list_page: 0,
        sym2_list_page: 0
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

            let {sym1, sym2} = this.props.routeParams
            sym1 = sym1.toUpperCase()
            sym2 = sym2.toUpperCase()

            let assets = this.props.assets;
            let assets_right = {}
            assets_right['GOLOS'] = {supply: '0.000 GOLOS', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/golos.png"}'}
            assets_right['GBG'] = {supply: '0.000 GBG', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/gold-golos.png"}'}
            for (let [key, value] of Object.entries(assets)) {
                assets_right[key] = value
            }

            if (this.refs.buySteemPrice) {
                this.refs.buySteemPrice.value = parseFloat(lowest_ask).toFixed(assets_right[sym2].precision);
            }

            if (this.refs.sellSteem_price) {
                this.refs.sellSteem_price.value = parseFloat(highest_bid).toFixed(assets_right[sym2].precision);
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

        return false;
    };

    buySteem = e => {
        e.preventDefault();

        let {sym1, sym2} = this.props.routeParams
        sym1 = sym1.toUpperCase()
        sym2 = sym2.toUpperCase()

        let assets = this.props.assets;
        let assets_right = {}
        assets_right['GOLOS'] = {supply: '0.000 GOLOS', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/golos.png"}'}
        assets_right['GBG'] = {supply: '0.000 GBG', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/gold-golos.png"}'}
        for (let [key, value] of Object.entries(assets)) {
            assets_right[key] = value
        }

        const { placeOrder, user } = this.props;
        if (!user) return;
        const amount_to_sell = parseFloat(
            ReactDOM.findDOMNode(this.refs.buySteemTotal).value
        );
        const min_to_receive = parseFloat(
            ReactDOM.findDOMNode(this.refs.buySteemAmount).value
        );
        const price = (amount_to_sell / min_to_receive).toFixed(assets_right[sym2].precision);
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

        let assets = this.props.assets;
        let assets_right = {}
        assets_right['GOLOS'] = {supply: '0.000 GOLOS', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/golos.png"}'}
        assets_right['GBG'] = {supply: '0.000 GBG', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/gold-golos.png"}'}
        for (let [key, value] of Object.entries(assets)) {
            assets_right[key] = value
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

        const price = (min_to_receive / amount_to_sell).toFixed(assets_right[sym2].precision);
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

        let {sym1, sym2} = this.props.routeParams
        sym1 = sym1.toUpperCase()
        sym2 = sym2.toUpperCase()
        if (sym2 === "GOLOS"
            || (sym2 < sym1 && sym1 !== "GOLOS")) {
            [sym1, sym2] = [sym2, sym1]
        }

        let assets = this.props.assets;
        let assets_right = {}
        assets_right['GOLOS'] = {supply: '0.000 GOLOS', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/golos.png"}'}
        assets_right['GBG'] = {supply: '0.000 GBG', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/gold-golos.png"}'}
        for (let [key, value] of Object.entries(assets)) {
            assets_right[key] = value
        }

        this.refs.sellSteem_price.value = p.toFixed(assets_right[sym2].precision);
        this.refs.buySteemPrice.value = p.toFixed(assets_right[sym2].precision);  

        const samount = parseFloat(this.refs.sellSteem_amount.value);
        if (samount >= 0) {
            this.refs.sellSteem_total.value = roundDown(p * samount, assets_right[sym1].precision).toFixed(assets_right[sym1].precision);;
        }

        const bamount = parseFloat(this.refs.buySteemAmount.value);
        if (bamount >= 0) {
            this.refs.buySteemTotal.value = roundUp(p * bamount, assets_right[sym2].precision).toFixed(assets_right[sym2].precision);;
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
        }, async () => {
            if (valid) {
                let {sym1, sym2} = this.props.routeParams
                sym1 = sym1.toUpperCase()
                sym2 = sym2.toUpperCase()
                if (sym2 === "GOLOS"
                    || (sym2 < sym1 && sym1 !== "GOLOS")) {
                    [sym1, sym2] = [sym2, sym1]
                }

                let assets = this.props.assets;
                let assets_right = {}
                assets_right['GOLOS'] = {supply: '0.000 GOLOS', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/golos.png"}'}
                assets_right['GBG'] = {supply: '0.000 GBG', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/gold-golos.png"}'}
                for (let [key, value] of Object.entries(assets)) {
                    assets_right[key] = value
                }

                const market_price = {quote: amount.toFixed(assets_right[sym1].precision) + ' ' + sym1, base: total.toFixed(assets_right[sym2].precision) + ' ' + sym2};
                const res = await api.getFillableOrders(market_price);
                if (res && res.length) {
                    this.refs.buySteemFee.value = (amount * assets_right[sym1].fee_percent / 10000).toFixed(assets_right[sym1].precision)
                    this.setState( {
                        buySteemFeePct: longToAsset(assets_right[sym1].fee_percent, '', 2) + '%'
                    })
                } else {
                    this.refs.buySteemFee.value = '0.0'
                    this.setState( {
                        buySteemFeePct: '0%'
                    })
                }
            }
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
        }, async () => {
            if (valid) {
                let {sym1, sym2} = this.props.routeParams
                sym1 = sym1.toUpperCase()
                sym2 = sym2.toUpperCase()
                if (sym2 === "GOLOS"
                    || (sym2 < sym1 && sym1 !== "GOLOS")) {
                    [sym1, sym2] = [sym2, sym1]
                }

                let assets = this.props.assets;
                let assets_right = {}
                assets_right['GOLOS'] = {supply: '0.000 GOLOS', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/golos.png"}'}
                assets_right['GBG'] = {supply: '0.000 GBG', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/gold-golos.png"}'}
                for (let [key, value] of Object.entries(assets)) {
                    assets_right[key] = value
                }

                const market_price = {base: amount.toFixed(assets_right[sym1].precision) + ' ' + sym1, quote: total.toFixed(assets_right[sym2].precision) + ' ' + sym2};
                const res = await api.getFillableOrders(market_price);
                if (res && res.length) {
                    this.refs.sellSteem_fee.value = (total * assets_right[sym2].fee_percent / 10000).toFixed(assets_right[sym2].precision)
                    this.setState( {
                        sellSteemFeePct: longToAsset(assets_right[sym2].fee_percent, '', 2) + '%'
                    })
                } else {
                    this.refs.sellSteem_fee.value = '0.0'
                    this.setState( {
                        sellSteemFeePct: '0%'
                    })
                }
            }
        });
    };

      nextSym1ListPage = () => {
        this.setState({
          sym1_list_page: this.state.sym1_list_page+1
        });
      }

      prevSym1ListPage = () => {
        if (this.state.sym1_list_page == 0) return;
        this.setState({
          sym1_list_page: this.state.sym1_list_page-1
        });
      }

      nextSym2ListPage = () => {
        this.setState({
          sym2_list_page: this.state.sym2_list_page+1
        });
      }

      prevSym2ListPage = () => {
        if (this.state.sym2_list_page == 0) return;
        this.setState({
          sym2_list_page: this.state.sym2_list_page-1
        });
      }

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
        assets_right['GOLOS'] = {supply: '0.000 GOLOS', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/golos.png"}'}
        assets_right['GBG'] = {supply: '0.000 GBG', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/gold-golos.png"}'}
        for (let [key, value] of Object.entries(assets)) {
            assets_right[key] = value
        }
        for (let [key, value] of Object.entries(assets_right)) {
            if (!value.json_metadata) {
                return (<div></div>);
            }
        }

        let prec1 = assets_right[sym1].precision
        let prec2 = assets_right[sym2].precision

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
            sym1_list_page,
            sym2_list_page
        } = this.state;

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
                bids: orders.bids.map(o => new Order(o, 'bids', sym1, sym2, prec1, prec2)),
                asks: orders.asks.map(o => new Order(o, 'asks', sym1, sym2, prec1, prec2)),
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
                            {sym2} {o.price.toFixed(8)}
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
                label: (<span className={"Market__bg-" + key} style={{lineHeight: "28px"}}><img src={image_url} width="28" height="28"/>&nbsp;&nbsp;&nbsp;{key}</span>),
                link: '/market/' + key + '/' + sym2,
            onClick: (e) => {window.location.href = '/market/' + sym2 + '/' + key}});

            if (sym1 !== key && sym2 !== key && (!value.symbols_whitelist.length || value.symbols_whitelist.includes(sym1)) && (!assets_right[sym1].symbols_whitelist.length || assets_right[sym1].symbols_whitelist.includes(key)))
            symbols2.push({key: key, value: key,
                label: (<span className={"Market__bg-" + key} style={{lineHeight: "28px"}}><img src={image_url} width="28" height="28"/>&nbsp;&nbsp;&nbsp;{key}</span>),
                link: '/market/' + sym1 + '/' + key, 
            onClick: (e) => {window.location.href = '/market/' + sym1 + '/' + key}});
        }

        let next_sym1_list = symbols1.slice(10*(sym1_list_page+1), 10*(sym1_list_page+1)+10);
        symbols1 = symbols1.slice(10*sym1_list_page, 10*sym1_list_page+10);

        symbols1.push({value: <span>
          <a className="Market__votes_pagination" onClick={this.prevSym1ListPage}>{sym1_list_page > 0 ? '< ' + tt('g.back') : ''}</a>
          <a className="Market__votes_pagination" onClick={next_sym1_list.length > 0 ? this.nextSym1ListPage : null}>{next_sym1_list.length > 0 ? tt('g.more_list') + ' >' : ''}</a></span>});

        let next_sym2_list = symbols2.slice(10*(sym2_list_page+1), 10*(sym2_list_page+1)+10);
        symbols2 = symbols2.slice(10*sym2_list_page, 10*sym2_list_page+10);

        symbols2.push({value: <span>
          <a className="Market__votes_pagination" onClick={this.prevSym2ListPage}>{sym2_list_page > 0 ? '< ' + tt('g.back') : ''}</a>
          <a className="Market__votes_pagination" onClick={next_sym2_list.length > 0 ? this.nextSym2ListPage : null}>{next_sym2_list.length > 0 ? tt('g.more_list') + ' >' : ''}</a></span>});

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
                    <div className="column small-4 Market__pairs"><br/><h5>
                        <DropdownMenu el="div" items={symbols1}>
                            <span>
                                {sym1 === "GOLOS" ? (<img src="/images/golos.png" width="36" height="36" style={{marginBottom: "4px"}} />) : null}
                                {sym1 === "GBG" ? (<img src="/images/gold-golos.png" width="36" height="36" style={{marginBottom: "4px"}} />) : null}
                                {sym1}
                                {symbols1.length > 0 && <Icon name="dropdown-arrow" />}
                            </span>
                        </DropdownMenu>
                        &nbsp;
                        <a href={"/market/"+sym2+"/"+sym1}><Icon name="shuffle" /></a>
                        &nbsp;
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
                                <div className="column small-3 large-3">
                                    <label>{tt('g.price')}</label>
                                </div>
                                <div className="column small-9 large-7">
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
                                                let {sym1, sym2} = this.props.routeParams
                                                sym1 = sym1.toUpperCase()
                                                sym2 = sym2.toUpperCase()

                                                let assets = this.props.assets;
                                                let assets_right = {}
                                                assets_right['GOLOS'] = {supply: '0.000 GOLOS', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/golos.png"}'}
                                                assets_right['GBG'] = {supply: '0.000 GBG', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/gold-golos.png"}'}
                                                for (let [key, value] of Object.entries(assets)) {
                                                    assets_right[key] = value
                                                }

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
                                                        assets_right[sym2].precision
                                                    ).toFixed(assets_right[sym2].precision);
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
                                <div className="column small-3 large-3">
                                    <label>{tt('g.amount')}</label>
                                </div>
                                <div className="column small-9 large-7">
                                    <div className="input-group">
                                        <input
                                            className="input-group-field"
                                            type="text"
                                            ref="buySteemAmount"
                                            placeholder="0.0"
                                            onChange={e => {
                                                let {sym1, sym2} = this.props.routeParams
                                                sym1 = sym1.toUpperCase()
                                                sym2 = sym2.toUpperCase()

                                                let assets = this.props.assets;
                                                let assets_right = {}
                                                assets_right['GOLOS'] = {supply: '0.000 GOLOS', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/golos.png"}'}
                                                assets_right['GBG'] = {supply: '0.000 GBG', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/gold-golos.png"}'}
                                                for (let [key, value] of Object.entries(assets)) {
                                                    assets_right[key] = value
                                                }

                                                const price = parseFloat(
                                                    this.refs.buySteemPrice
                                                        .value
                                                )
                                                const amount = parseFloat(
                                                    this.refs.buySteemAmount
                                                        .value
                                                );
                                                if (price >= 0 && amount >= 0) {
                                                    let res = price * amount
                                                    this.refs.buySteemTotal.value = roundUp(
                                                        res,
                                                        assets_right[sym2].precision
                                                    ).toFixed(assets_right[sym2].precision)
                                                }
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
                                <div className="column small-3 large-3">
                                    <label>{tt('market_jsx.total')}</label>
                                </div>
                                <div className="column small-9 large-7">
                                    <div className="input-group">
                                        <input
                                            className="input-group-field"
                                            type="text"
                                            ref="buySteemTotal"
                                            placeholder="0.0"
                                            onChange={e => {
                                                let {sym1, sym2} = this.props.routeParams
                                                sym1 = sym1.toUpperCase()
                                                sym2 = sym2.toUpperCase()

                                                let assets = this.props.assets;
                                                let assets_right = {}
                                                assets_right['GOLOS'] = {supply: '0.000 GOLOS', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/golos.png"}'}
                                                assets_right['GBG'] = {supply: '0.000 GBG', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/gold-golos.png"}'}
                                                for (let [key, value] of Object.entries(assets)) {
                                                    assets_right[key] = value
                                                }

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
                                                        assets_right[sym1].precision
                                                    ).toFixed(assets_right[sym1].precision);;
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
                                <div className="column small-4 large-3">
                                    <label>{tt('market_jsx.market_fee_percent_') + this.state.buySteemFeePct}</label>
                                </div>
                                <div className="column small-9 large-7">
                                    <div className="input-group">
                                        <input
                                            className="input-group-field"
                                            type="text"
                                            disabled
                                            ref="buySteemFee"
                                            placeholder="0.0"
                                        />
                                        <span className="input-group-label">
                                            {sym1}
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
                                                    let {sym1, sym2} = this.props.routeParams
                                                    sym1 = sym1.toUpperCase()
                                                    sym2 = sym2.toUpperCase()

                                                    let assets = this.props.assets;
                                                    let assets_right = {}
                                                    assets_right['GOLOS'] = {supply: '0.000 GOLOS', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/golos.png"}'}
                                                    assets_right['GBG'] = {supply: '0.000 GBG', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/gold-golos.png"}'}
                                                    for (let [key, value] of Object.entries(assets)) {
                                                        assets_right[key] = value
                                                    }

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
                                                        total = account.balance.split(
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
                                                            assets_right[sym1].precision
                                                        ).toFixed(assets_right[sym1].precision);
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
                                                    let {sym1, sym2} = this.props.routeParams
                                                    sym1 = sym1.toUpperCase()
                                                    sym2 = sym2.toUpperCase()

                                                    let assets = this.props.assets;
                                                    let assets_right = {}
                                                    assets_right['GOLOS'] = {supply: '0.000 GOLOS', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/golos.png"}'}
                                                    assets_right['GBG'] = {supply: '0.000 GBG', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/gold-golos.png"}'}
                                                    for (let [key, value] of Object.entries(assets)) {
                                                        assets_right[key] = value
                                                    }

                                                    e.preventDefault();
                                                    const amount = parseFloat(
                                                        this.refs.buySteemAmount
                                                            .value
                                                    );
                                                    const price = parseFloat(
                                                        ticker.lowest_ask
                                                    );
                                                    this.refs.buySteemPrice.value =
                                                        ticker.lowest_ask.toFixed(assets_right[sym2].precision);
                                                    if (amount >= 0)
                                                        this.refs.buySteemTotal.value = roundUp(
                                                            amount * price,
                                                            assets_right[sym2].precision
                                                        ).toFixed(assets_right[sym2].precision);
                                                    validateBuySteem();
                                                }}
                                            >
                                                {tt('market_jsx.lowest_ask')}:
                                            </a>{' '}
                                            {ticker.lowest_ask.toFixed(8)}<br/>
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
                                <div className="column small-3 large-3">
                                    <label>{tt('g.price')}</label>
                                </div>

                                <div className="column small-9 large-7">
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
                                                let {sym1, sym2} = this.props.routeParams
                                                sym1 = sym1.toUpperCase()
                                                sym2 = sym2.toUpperCase()

                                                let assets = this.props.assets;
                                                let assets_right = {}
                                                assets_right['GOLOS'] = {supply: '0.000 GOLOS', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/golos.png"}'}
                                                assets_right['GBG'] = {supply: '0.000 GBG', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/gold-golos.png"}'}
                                                for (let [key, value] of Object.entries(assets)) {
                                                    assets_right[key] = value
                                                }

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
                                                        assets_right[sym2].precision
                                                    ).toFixed(assets_right[sym2].precision);
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
                                <div className="column small-3 large-3">
                                    <label>{tt('g.amount')}</label>
                                </div>
                                <div className="column small-9 large-7">
                                    <div className="input-group">
                                        <input
                                            className="input-group-field"
                                            type="text"
                                            ref="sellSteem_amount"
                                            placeholder="0.0"
                                            onChange={() => {
                                                let {sym1, sym2} = this.props.routeParams
                                                sym1 = sym1.toUpperCase()
                                                sym2 = sym2.toUpperCase()

                                                let assets = this.props.assets;
                                                let assets_right = {}
                                                assets_right['GOLOS'] = {supply: '0.000 GOLOS', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/golos.png"}'}
                                                assets_right['GBG'] = {supply: '0.000 GBG', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/gold-golos.png"}'}
                                                for (let [key, value] of Object.entries(assets)) {
                                                    assets_right[key] = value
                                                }

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
                                                        assets_right[sym2].precision
                                                    ).toFixed(assets_right[sym2].precision);
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
                                <div className="column small-3 large-3">
                                    <label>{tt('market_jsx.total')}</label>
                                </div>
                                <div className="column small-9 large-7">
                                    <div className="input-group">
                                        <input
                                            className="input-group-field"
                                            type="text"
                                            ref="sellSteem_total"
                                            placeholder="0.0"
                                            onChange={e => {
                                                let {sym1, sym2} = this.props.routeParams
                                                sym1 = sym1.toUpperCase()
                                                sym2 = sym2.toUpperCase()

                                                let assets = this.props.assets;
                                                let assets_right = {}
                                                assets_right['GOLOS'] = {supply: '0.000 GOLOS', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/golos.png"}'}
                                                assets_right['GBG'] = {supply: '0.000 GBG', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/gold-golos.png"}'}
                                                for (let [key, value] of Object.entries(assets)) {
                                                    assets_right[key] = value
                                                }

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
                                                        assets_right[sym1].precision
                                                    ).toFixed(assets_right[sym1].precision);
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
                                <div className="column small-4 large-3">
                                    <label>{tt('market_jsx.market_fee_percent_') + this.state.sellSteemFeePct}</label>
                                </div>
                                <div className="column small-9 large-7">
                                    <div className="input-group">
                                        <input
                                            className="input-group-field"
                                            type="text"
                                            disabled
                                            ref="sellSteem_fee"
                                            placeholder="0.0"
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
                                                    let {sym1, sym2} = this.props.routeParams
                                                    sym1 = sym1.toUpperCase()
                                                    sym2 = sym2.toUpperCase()

                                                    let assets = this.props.assets;
                                                    let assets_right = {}
                                                    assets_right['GOLOS'] = {supply: '0.000 GOLOS', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/golos.png"}'}
                                                    assets_right['GBG'] = {supply: '0.000 GBG', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/gold-golos.png"}'}
                                                    for (let [key, value] of Object.entries(assets)) {
                                                        assets_right[key] = value
                                                    }

                                                    e.preventDefault();
                                                    const price = parseFloat(
                                                        this.refs.sellSteem_price.value
                                                    );
                                                    let amount = '';
                                                    if (sym1 === "GBG") {
                                                        amount = account.sbd_balance.split(
                                                            ' '
                                                        )[0];
                                                    }
                                                    else if (sym1 === "GOLOS") {
                                                        amount = account.balance.split(
                                                            ' '
                                                        )[0];
                                                    }
                                                    else {
                                                        amount = assets[sym1].balance.split(
                                                            ' '
                                                        )[0];
                                                    }
                                                    this.refs.sellSteem_amount.value = amount;
                                                    if (price >= 0)
                                                        this.refs.sellSteem_total.value = roundDown(
                                                            price * parseFloat(amount),
                                                            assets_right[sym2].precision
                                                        ).toFixed(assets_right[sym2].precision);
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
                                                    let {sym1, sym2} = this.props.routeParams
                                                    sym1 = sym1.toUpperCase()
                                                    sym2 = sym2.toUpperCase()

                                                    let assets = this.props.assets;
                                                    let assets_right = {}
                                                    assets_right['GOLOS'] = {supply: '0.000 GOLOS', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/golos.png"}'}
                                                    assets_right['GBG'] = {supply: '0.000 GBG', precision: 3, symbols_whitelist: [], fee_percent: 0, json_metadata: '{"image_url": "/images/gold-golos.png"}'}
                                                    for (let [key, value] of Object.entries(assets)) {
                                                        assets_right[key] = value
                                                    }

                                                    e.preventDefault();
                                                    const amount = parseFloat(
                                                        this.refs
                                                            .sellSteem_amount
                                                            .value
                                                    );
                                                    const price =
                                                        ticker.highest_bid;
                                                    this.refs.sellSteem_price.value = price.toFixed(assets_right[sym2].precision);
                                                    if (amount >= 0)
                                                        this.refs.sellSteem_total.value = roundDown(
                                                            parseFloat(price) *
                                                                amount,
                                                            assets_right[sym2].precision
                                                        ).toFixed(assets_right[sym2].precision);
                                                    validateSellSteem();
                                                }}
                                            >
                                                {tt('market_jsx.highest_bid')}:
                                            </a>{' '}
                                            {ticker.highest_bid.toFixed(8)}<br/>
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
            assets_right['GOLOS'] = {supply: '0.000 GOLOS', precision: 3, fee_percent: 0, json_metadata: '{"image_url": "/images/golos.png"}'}
            assets_right['GBG'] = {supply: '0.000 GBG', precision: 3, fee_percent: 0, json_metadata: '{"image_url": "/images/gold-golos.png"}'}
            for (let [key, value] of Object.entries(assets)) {
                assets_right[key] = value
            }
            let prec1 = assets_right[sym1].precision
            let prec2 = assets_right[sym2].precision

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
alert(JSON.stringify(operation))
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
