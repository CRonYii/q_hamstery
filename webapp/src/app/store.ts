import { configureStore } from "@reduxjs/toolkit";
import { hamsterySlice } from "../features/api/hamsterySlice";
import userSlice from "../features/user/userSlice";

const store = configureStore({
    reducer: {
        [hamsterySlice.reducerPath]: hamsterySlice.reducer,
        user: userSlice,
    },
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware().concat(hamsterySlice.middleware)
});

export default store;

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch