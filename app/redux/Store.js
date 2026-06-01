import { configureStore } from '@reduxjs/toolkit';

import rootReducer from './RootReducer';

export default function createAppStore(preloadedState, sagaMiddleware) {
    return configureStore({
        reducer: rootReducer,
        preloadedState,
        middleware: getDefaultMiddleware => {
            const middleware = getDefaultMiddleware({
                thunk: false,
                serializableCheck: false,
            });

            return sagaMiddleware
                ? middleware.concat(sagaMiddleware)
                : middleware;
        },
        devTools: process.env.BROWSER && process.env.NODE_ENV === 'development',
    });
}
