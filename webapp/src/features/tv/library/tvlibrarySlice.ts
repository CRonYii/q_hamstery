import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../../app/store';


interface TvLibraryState {
    addLibraryOpen: boolean,
    editId?: string,
}

const initialState: TvLibraryState = {
    addLibraryOpen: false,
}

const tvLibrarySlice = createSlice({
    name: 'tvlibrary',
    initialState,
    reducers: {
        add(state, action: PayloadAction<void>) {
            state.addLibraryOpen = true
            state.editId = undefined
        },
        edit(state, action: PayloadAction<string>) {
            state.addLibraryOpen = true
            state.editId = action.payload
        },
        close(state, action: PayloadAction<void>) {
            state.addLibraryOpen = false
        },
    },
});

export const tvLibraryActions = tvLibrarySlice.actions;

export const tvLibrarySelector = (state: RootState) => state.tvlibrary;

export default tvLibrarySlice.reducer;
