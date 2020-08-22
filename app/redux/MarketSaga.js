import { fork, call, put, takeLatest } from 'redux-saga/effects';
import MarketReducer from './MarketReducer';
import {getAccount} from './SagaShared';
import {api} from 'golos-classic-js';

export function* marketWatches() {
    yield fork(watchLocationChange);
    yield fork(watchUserLogin);
    yield fork(watchMarketUpdate);
}
 

const wait = ms => (
    new Promise(resolve => {
        setTimeout(() => resolve(), ms)
    }))

let polling = false
let active_user = null
let last_trade = null

export function* fetchMarket(location_change_action) {
    const {pathname} = location_change_action.payload;
    if (pathname && !pathname.startsWith("/market")) {
        polling = false
        return
    }

    let parts = pathname.split('/')
    let sym1 = parts[2]
    let sym2 = parts[3]

    const assets = yield call([api, api.getAssets])
    let kv_assets = {}
    for (const asset of assets) {
        kv_assets[asset.supply.split(" ")[1]] = asset
    }
    yield put(MarketReducer.actions.upsertAssets(kv_assets));

    if(polling == true) return
    polling = true

    while(polling) {

        try {
            const state = yield call([api, api.getOrderBookExtendedAsync], 500, [sym1, sym2]);
            yield put(MarketReducer.actions.receiveOrderbook(state));

            let trades;
            if(last_trade == null ) {
                trades = yield call([api, api.getRecentTradesAsync], 25, [sym1, sym2]);
                yield put(MarketReducer.actions.receiveTradeHistory(trades));
            } else {
                let start = last_trade.toISOString().slice(0, -5)
                trades = yield call([api, api.getTradeHistoryAsync], start, "1969-12-31T23:59:59", 1000, [sym1, sym2]);
                trades = trades.reverse()
                yield put(MarketReducer.actions.appendTradeHistory(trades));
            }
            if(trades.length > 0) {
              last_trade = new Date((new Date(Date.parse(trades[0]['date']))).getTime() + 1000)
            }

            const state3 = yield call([api, api.getTickerAsync], [sym1, sym2]);
            yield put(MarketReducer.actions.receiveTicker(state3, [sym1, sym2]));
        } catch (error) {
            console.error('~~ Saga fetchMarket error ~~>', error);
            yield put({type: 'global/CHAIN_API_ERROR', error: error.message});
        }

        yield call(wait, 3000);
    }
}

export function* fetchOpenOrders(set_user_action) {
    const {username} = set_user_action.payload // pathname only from reloadMarket 

    let pair = ["GOLOS", "GBG"] // for UserWallet (/@account/transfers)
    if (window && window.location.href.includes('/market')) {
        let parts = window.location.href.split('/')
        pair = [parts[4], parts[5]]
    }

    try {
        const state = yield call([api, api.getOpenOrdersAsync], username, pair);
        yield put(MarketReducer.actions.receiveOpenOrders(state));
        const assets = (yield call([api, api.getAccountsBalances], [username]))[0]
        yield put(MarketReducer.actions.upsertAssets(assets));
        yield call(getAccount, username, true);
    } catch (error) {
        console.error('~~ Saga fetchOpenOrders error ~~>', error);
        yield put({type: 'global/CHAIN_API_ERROR', error: error.message});
    }
}

export function* reloadMarket(reload_action) {
    yield fetchMarket(reload_action);
    yield fetchOpenOrders(reload_action);
}

export function* watchUserLogin() {
    yield takeLatest('user/SET_USER', fetchOpenOrders);
}

export function* watchLocationChange() {
    yield takeLatest('@@router/LOCATION_CHANGE', fetchMarket);
}

export function* watchMarketUpdate() {
    yield takeLatest('market/UPDATE_MARKET', reloadMarket);
}
