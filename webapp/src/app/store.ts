import { configureStore } from "@reduxjs/toolkit";
import { hamsterySlice } from "../features/api/hamsterySlice";
import torznabIndexerSlice from "../features/indexers/torznabIndexerSlice";
import navSlice from "../features/nav/navSlice";
import tvlibrarySlice from "../features/tv/library/tvlibrarySlice";
import userSlice from "../features/user/userSlice";

const store = configureStore({
    reducer: {
        [hamsterySlice.reducerPath]: hamsterySlice.reducer,
        nav: navSlice,
        user: userSlice,
        tvlibrary: tvlibrarySlice,
        torznab: torznabIndexerSlice,
    },
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware().concat(hamsterySlice.middleware)
});

export default store;

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch