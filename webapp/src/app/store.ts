import { configureStore } from "@reduxjs/toolkit";
import tvlibsReducer from "../features/tv-libraries/tvshowsSlice";
import userSlice from "../features/user/userSlice";

const store = configureStore({
    reducer: {
        user: userSlice,
        tvshows: tvlibsReducer,
    }
});

export default store;

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch