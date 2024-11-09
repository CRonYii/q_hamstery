import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../../app/store';


interface SubscriptionState {
    open: boolean,
    editId?: string,
    season: string,
    priority: number,
}

const initialState: SubscriptionState = {
    open: false,
    season: '',
    priority: 1,
}

const subscriptionSlice = createSlice({
    name: 'subscription',
    initialState,
    reducers: {
        addSubscription(state, action: PayloadAction<{ season: string, priority: number }>) {
            state.open = true
            state.editId = undefined
            state.season = action.payload.season
            state.priority = action.payload.priority
        },
        editSubscription(state, action: PayloadAction<string>) {
            state.open = true
            state.editId = action.payload
        },
        closeSubscription(state, action: PayloadAction<void>) {
            state.open = false
        },
    },
});

export const subscriptionActions = subscriptionSlice.actions;

export const subscriptionSelector = (state: RootState) => (state.subscription);

export default subscriptionSlice.reducer;
