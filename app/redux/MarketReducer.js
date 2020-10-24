import {Map} from 'immutable';
import createModule from 'redux-modules';


export default createModule({
    name: 'market',
    initialState: Map({status: {}}),
    transformations: [
        {
            action: 'RECEIVE_ORDERBOOK',
            reducer: (state, action) => {
                return state.set('orderbook', action.payload);
            }
        },
        {
            action: 'RECEIVE_TICKER',
            reducer: (state, action) => {
                return state.set('ticker', action.payload);
            }
        },
        {
            action: 'RECEIVE_OPEN_ORDERS',
            reducer: (state, action) => {
                return state.set('open_orders', action.payload);
            }
        },
        {
            action: 'UPSERT_ASSETS',
            reducer: (state, action) => {
                const assets = state.get('assets')
                if (assets) {
                    let action_assets = Object.entries(action.payload)
                    let state_assets = Object.entries(assets)
                    let more_assets = action_assets.length > state_assets.length ? action_assets : state_assets
                    let lower_assets = action_assets.length > state_assets.length ? assets : action.payload

                    let new_assets = {}
                    for (let [key, value] of more_assets) {
                        new_assets[key] = {...value, ...lower_assets[key]}
                    }
                    return state.set('assets', new_assets);
                }
                return state.set('assets', action.payload);
            }
        },
        {
            action: 'RECEIVE_TRADE_HISTORY',
            reducer: (state, action) => {
                return state.set('history', action.payload);
            }
        },
        {
            action: 'APPEND_TRADE_HISTORY',
            reducer: (state, action) => {
                return state.set('history', [...action.payload, ...state.get('history')]);
            }
        }
    ]
});
