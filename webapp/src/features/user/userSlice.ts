import { createAsyncThunk, createSlice, isRejected } from '@reduxjs/toolkit';
import { notification } from 'antd';
import Cookies from 'js-cookie';
import { RootState } from '../../app/store';
import hamstery from '../api/hamstery';

export const testAuthHamstery = createAsyncThunk('user/test_auth', async () => {
    const response = await hamstery.test();
    return response.data;
})

export const loginHamstery = createAsyncThunk('user/login', async (arg: { username: string, password: string }) => {
    await hamstery.login(arg.username, arg.password);
    return arg.username;
})

interface UserState {
    loading: boolean,
    logged_in: boolean,
    username?: string,
}

const initialState: UserState = {
    loading: true,
    logged_in: false,
}

const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        logout(state, action) {
            hamstery.logout();
            state.logged_in = false;
            state.username = undefined
            Cookies.remove('sessionid')
            Cookies.remove('csrftoken')
        }
    },
    extraReducers: builder => {
        builder
            .addCase(testAuthHamstery.pending, (state, action) => { state.loading = true })
            .addCase(testAuthHamstery.rejected, (state, action) => { state.loading = false; })
            .addCase(testAuthHamstery.fulfilled, (state, action) => {
                state.loading = false;
                state.logged_in = true;
                state.username = action.payload.username
            })
            .addCase(loginHamstery.pending, (state, action) => { state.loading = true; })
            .addCase(loginHamstery.rejected, (state, action) => {
                state.loading = false;
                notification.error({
                    message: 'The provided credentials are invalid or the user does not exist',
                });
            })
            .addCase(loginHamstery.fulfilled, (state, action) => {
                state.loading = false;
                state.logged_in = true;
                state.username = action.payload
            })
            .addMatcher(isRejected, (state, action) => {
                if (action.error.code === 'ERR_BAD_REQUEST') {
                    state.logged_in = false;
                }
            })
    },
});

export const userActions = userSlice.actions;

export const userSelector = (state: RootState) => state.user;

export default userSlice.reducer;
