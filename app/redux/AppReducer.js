import {Map, OrderedMap} from 'immutable';
import tt from 'counterpart';
import { showToast, showCustomToast } from 'app/components/elements/Notifications/ToastUtils'

const defaultState = Map({
    requests: {},
    loading: false,
    error: '',
    location: {},
    notifications: null,
    ignoredLoadingRequestCount: 0,
    notificounters: Map({
        total: 0,
        feed: 0,
        reward: 0,
        send: 0,
        mention: 0,
        follow: 0,
        vote: 0,
        reply: 0,
        account_update: 0,
        message: 0,
        receive: 0,
        donate: 0
    })
});

export default function reducer(state = defaultState, action) {
    if (action.type === '@@router/LOCATION_CHANGE') {
        return state.set('location', {pathname: action.payload.pathname});
    }
    if (action.type === 'CHAIN_API_ERROR') {
        //return state.set('error', action.error).set('loading', false);
        return state.set('error', action.error);
    }
    if (action.type === 'FETCH_DATA_BEGIN') {
        return state.set('loading', true);
    }
    if (action.type === 'FETCH_DATA_END') {
        return state.set('loading', false);
    }
    let res = state;
    if (action.type === 'ADD_NOTIFICATION') {
        const { payload } = action
        const opts = {
            dismissAfter: payload.dismissAfter,
            action: payload.action
        }
        if (payload.key) {
            opts.id = payload.key
        }
        if (payload.custom) {
            showCustomToast(payload.message, opts)
        } else {
            showToast(payload.message, opts)
        }
    }
    if (action.type === 'REMOVE_NOTIFICATION') {
        res = res.update('notifications', s => s.delete(action.payload.key));
    }
    if (action.type === 'UPDATE_NOTIFICOUNTERS' && action.payload) {
        const nc = action.payload;
        if (nc.follow > 0) {
            nc.total -= nc.follow;
            nc.follow = 0;
        }
        res = res.set('notificounters', Map(nc));
    }
    return res;
}
