import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ISeasonDownload, ITvSeason } from '../../../app/entities';
import { RootState } from '../../../app/store';


interface BundleState {
    open: boolean,
    download?: ISeasonDownload,
    season?: ITvSeason,
}

const initialState: BundleState = {
    open: false,
}

const bundleSlice = createSlice({
    name: 'bundle',
    initialState,
    reducers: {
        updateBundle(state, action: PayloadAction<{ download: ISeasonDownload, season: ITvSeason }>) {
            state.open = true
            state.download = action.payload.download
            state.season = action.payload.season
        },
        closeBundle(state, action: PayloadAction<void>) {
            state.open = false
        },
    },
});

export const bundleActions = bundleSlice.actions;

export const bundleSelector = (state: RootState) => (state.bundle);

export default bundleSlice.reducer;
