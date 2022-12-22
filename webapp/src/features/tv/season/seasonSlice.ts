import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ITvSeason } from '../../../app/entities';
import { RootState } from '../../../app/store';


interface SeasonState {
    import: boolean,
    season?: ITvSeason,
    sub_open: boolean,
    sub_editId?: string,
}

const initialState: SeasonState = {
    import: false,
    sub_open: false,
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
        addSubscription(state, action: PayloadAction<void>) {
            state.sub_open = true
            state.sub_editId = undefined
        },
        editSubscription(state, action: PayloadAction<string>) {
            state.sub_open = true
            state.sub_editId = action.payload
        },
        closeSubscription(state, action: PayloadAction<void>) {
            state.sub_open = false
        },
    },
});

export const seasonActions = seasonSlice.actions;

export const seasonSelector = (state: RootState) => state.episode;

export default seasonSlice.reducer;
