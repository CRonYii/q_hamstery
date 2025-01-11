import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ISeasonDownload } from '../../../app/entities';
import { RootState } from '../../../app/store';


interface BundleState {
    open: boolean,
    download?: ISeasonDownload,
}

const initialState: BundleState = {
    open: false,
}

const bundleSlice = createSlice({
    name: 'bundle',
    initialState,
    reducers: {
        updateBundle(state, action: PayloadAction<ISeasonDownload>) {
            state.open = true
            state.download = action.payload
        },
        closeBundle(state, action: PayloadAction<void>) {
            state.open = false
        },
    },
});

export const bundleActions = bundleSlice.actions;

export const bundleSelector = (state: RootState) => (state.bundle);

export default bundleSlice.reducer;
