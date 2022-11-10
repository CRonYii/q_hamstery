import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';


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
        addLibrary(state, action: PayloadAction<void>) {
            state.addLibraryOpen = true
            state.editId = undefined
        },
        editLibrary(state, action: PayloadAction<string>) {
            state.addLibraryOpen = true
            state.editId = action.payload
        },
        closeLibrary(state, action: PayloadAction<void>) {
            state.addLibraryOpen = false
        },
    },
});

export const tvLibraryActions = tvLibrarySlice.actions;

export const tvLibrarySelector = (state: RootState) => state.tvlibrary;

export default tvLibrarySlice.reducer;
