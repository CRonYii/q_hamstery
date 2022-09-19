import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';


interface TorznabIndexerState {
    open: boolean,
    type: 'edit' | 'add',
    editId?: string,
}

const initialState: TorznabIndexerState = {
    open: false,
    type: 'add',
}

const torznabIndexerSlice = createSlice({
    name: 'torznab',
    initialState,
    reducers: {
        add(state, action: PayloadAction<void>) {
            state.open = true
            state.type = 'add'
        },
        edit(state, action: PayloadAction<string>) {
            state.open = true
            state.type = 'edit'
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
