import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ITvSeason } from '../../../app/entities';
import { RootState } from '../../../app/store';


interface SeasonState {
    import: boolean,
    season?: ITvSeason,
}

const initialState: SeasonState = {
    import: false
}

const seasonSlice = createSlice({
    name: 'season',
    initialState,
    reducers: {
        import(state, action: PayloadAction<{ season: ITvSeason }>) {
            state.import = true
            state.season = action.payload.season
        },
        closeImport(state, action: PayloadAction<void>) {
            state.import = false
            state.season = undefined
        },
    },
});

export const seasonActions = seasonSlice.actions;

export const seasonSelector = (state: RootState) => state.episode;

export default seasonSlice.reducer;
