import { createSlice } from '@reduxjs/toolkit';

import user from './User';

const offchainSlice = createSlice({
    name: 'offchain',
    initialState: { user: {} },
    reducers: {},
    extraReducers: builder => {
        builder.addCase(user.actions.saveLoginConfirm, (state, action) => {
            if (!action.payload) {
                state.account = null;
            }
        });
    },
});

export default offchainSlice.reducer;
