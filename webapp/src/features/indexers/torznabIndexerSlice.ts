import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';


interface TorznabIndexerState {
    open: boolean,
    editId?: string,
    searchId?: string,
}

const initialState: TorznabIndexerState = {
    open: false,
}

const torznabIndexerSlice = createSlice({
    name: 'torznab',
    initialState,
    reducers: {
        search(state, action: PayloadAction<string>) {
            state.searchId = action.payload
        },
        closeSearch(state, action: PayloadAction<void>) {
            state.searchId = undefined
        },
        add(state, action: PayloadAction<void>) {
            state.open = true
            state.editId = undefined
        },
        edit(state, action: PayloadAction<string>) {
            state.open = true
            state.editId = action.payload
        },
        close(state, action: PayloadAction<void>) {
            state.open = false
        },
    },
});

export const torznabIndexerActions = torznabIndexerSlice.actions;

export const torznabIndexerSelector = (state: RootState) => state.torznab;

export default torznabIndexerSlice.reducer;
