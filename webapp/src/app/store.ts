import { configureStore } from "@reduxjs/toolkit";
import userSlice from "../features/user/userSlice";
import tvlibsReducer from "../features/tv-libraries/tvlibsSlice";

const store = configureStore({
    reducer: {
        user: userSlice,
        tvlibs: tvlibsReducer,
    }
});

export default store;

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch