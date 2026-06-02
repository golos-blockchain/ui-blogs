import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    requests: {},
    loading: false,
    error: '',
    location: {},
    ignoredLoadingRequestCount: 0,
    notificounters: {
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
        donate: 0,
    },
};

const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        chainApiError(state, action) {
            state.error = action.error || action.payload;
        },
        fetchDataBegin(state) {
            state.loading = true;
        },
        fetchDataEnd(state) {
            state.loading = false;
        },
        updateNotificounters(state, { payload }) {
            if (!payload) return;

            const counters = { ...payload };
            if (counters.follow > 0) {
                counters.total -= counters.follow;
                counters.follow = 0;
            }
            state.notificounters = counters;
        },
    },
    extraReducers: builder => {
        builder.addCase('@@router/LOCATION_CHANGE', (state, action) => {
            state.location = { pathname: action.payload.pathname };
        });
    },
});

export default appSlice;
