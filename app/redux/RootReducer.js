import { combineReducers } from '@reduxjs/toolkit';
import { routerReducer } from 'react-router-redux';

import app from './AppReducer';
import global from './GlobalReducer';
import user from './User';
import transaction from './Transaction';
import offchain from './Offchain';
import { contentStats } from 'app/utils/StateFunctions';

function isInitAction(action) {
    return action.type === '@@INIT' || action.type.startsWith('@@redux/INIT');
}

function normalizeGlobalState(state) {
    if (!state || !state.content) return state;

    const content = {};
    let changed = false;

    Object.keys(state.content).forEach(key => {
        const item = state.content[key];
        if (item && !item.stats) {
            content[key] = {
                ...item,
                stats: contentStats(item),
            };
            changed = true;
        } else {
            content[key] = item;
        }
    });

    return changed ? { ...state, content } : state;
}

function initReducer(reducer, type) {
    return (state, action) => {
        if (state && type === 'global' && isInitAction(action)) {
            state = normalizeGlobalState(state);
        }

        return reducer(state, action);
    };
}

export default combineReducers({
    global: initReducer(global.reducer, 'global'),
    offchain: initReducer(offchain),
    user: initReducer(user.reducer),
    transaction: initReducer(transaction.reducer),
    discussion: initReducer((state = {}) => state),
    routing: initReducer(routerReducer),
    app: initReducer(app.reducer),
});
