import {Map, fromJS} from 'immutable';
import { combineReducers, __DO_NOT_USE__ActionTypes as ActionTypes } from 'redux';
import {routerReducer} from 'react-router-redux';
import appReducer from './AppReducer';
import globalReducerModule from './GlobalReducer';
import user from './User';
import transaction from './Transaction';
import offchain from './Offchain';
import {contentStats, fromJSGreedy} from 'app/utils/StateFunctions'

function initReducer(reducer, type) {
    return (state, action) => {
        if(!state) return reducer(state, action);

        // @@redux/INIT server and client init
        if (action.type === ActionTypes.INIT || action.type === '@@INIT') {
            if(!(state instanceof Map)) {
                state = fromJS(state);
            }
            if(type === 'global') {
                const content = state.get('content').withMutations(c => {
                    c.forEach((cc, key) => {
                        if(!c.getIn([key, 'stats'])) {
                            // This may have already been set in UniversalRender; if so, then
                            //   active_votes were cleared from server response. In this case it
                            //   is important to not try to recalculate the stats. (#1040)
                            c.setIn([key, 'stats'], fromJS(contentStats(cc)))
                        }
                    })
                });
                state = state.set('content', content);
            }
            return state;
        }

        if (action.type === '@@router/LOCATION_CHANGE' && type === 'global') {
            state = state.set('pathname', action.payload.pathname)
            // console.log(action.type, type, action, state.toJS())
        }

        return reducer(state, action);
    }
}

export default combineReducers({
    global: initReducer(globalReducerModule.reducer, 'global'),
    offchain: initReducer(offchain),
    user: initReducer(user.reducer),
    transaction: initReducer(transaction.reducer),
    discussion: initReducer((state = {}) => state),
    routing: initReducer(routerReducer),
    app: initReducer(appReducer),
});

/*
let now
    benchStart: initReducer((state = {}, action) => {console.log('>> action.type', action.type); now = Date.now(); return state}),
    benchEnd: initReducer((state = {}, action) => {console.log('<< action.type', action.type, (Date.now() - now), 'ms'); return state}),
*/
