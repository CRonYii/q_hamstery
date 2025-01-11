import { configureStore } from "@reduxjs/toolkit";
import { hamsterySlice } from "../features/api/hamsterySlice";
import responsiveSlice from "../features/general/responsiveSlice";
import indexerSlice from "../features/indexers/indexerSlice";
import torznabIndexerSlice from "../features/indexers/torznab/torznabIndexerSlice";
import navSlice from "../features/nav/navSlice";
import tvlibrarySlice from "../features/tv/library/tvlibrarySlice";
import bundleSlice from "../features/tv/season/bundleSlice";
import seasonSlice from "../features/tv/season/seasonSlice";
import subscriptionSlice from "../features/tv/season/subscriptionSlice";
import userSlice from "../features/user/userSlice";

const store = configureStore({
    reducer: {
        [hamsterySlice.reducerPath]: hamsterySlice.reducer,
        nav: navSlice,
        user: userSlice,
        tvlibrary: tvlibrarySlice,
        indexer: indexerSlice,
        torznab: torznabIndexerSlice,
        season: seasonSlice,
        subscription: subscriptionSlice,
        bundle: bundleSlice,
        responsive: responsiveSlice,
    },
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware().concat(hamsterySlice.middleware)
});

export default store;

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch