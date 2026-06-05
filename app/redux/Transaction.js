import { createSlice } from '@reduxjs/toolkit';
import setPath from 'lodash/set';
import unset from 'lodash/unset';

import transactionErrorReducer from './Transaction_Error';

const transactionSlice = createSlice({
    name: 'transaction',
    initialState: {
        operations: [],
        status: { key: '', error: false, busy: false },
        errors: null,
    },
    reducers: {
        confirmOperation(state, { payload }) {
            state.show_confirm_modal = true;
            state.confirmBroadcastOperation = payload.operation;
            state.confirmErrorCallback = payload.errorCallback;
            state.confirm = payload.confirm;
            state.warning = payload.warning;
        },
        hideConfirm(state) {
            state.show_confirm_modal = false;
            state.confirmBroadcastOperation = undefined;
            state.confirm = undefined;
        },
        broadcastOperation() {
            // Saga-only action.
        },
        updateAuthorities() {
            // Saga-only action.
        },
        updateMeta() {
            // Saga-only action.
        },
        error: transactionErrorReducer,
        deleteError(state, { payload: { key } }) {
            if (state.errors) delete state.errors[key];
        },
        set(state, { payload: { key, value } }) {
            setPath(state, Array.isArray(key) ? key : [key], value);
        },
        remove(state, { payload: { key } }) {
            unset(state, Array.isArray(key) ? key : [key]);
        },
    },
});

export default transactionSlice;
