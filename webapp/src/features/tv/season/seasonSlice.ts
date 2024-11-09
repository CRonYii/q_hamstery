import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IShowSubscription, ITvSeason } from '../../../app/entities';
import { RootState } from '../../../app/store';


interface SeasonState {
    import: boolean,
    import_supplemental: boolean,
    season?: ITvSeason,
    search_open: boolean,
    search_query?: IShowSubscription,
}

const initialState: SeasonState = {
    import: false,
    import_supplemental: false,
    search_open: false,
}

const seasonSlice = createSlice({
    name: 'season',
    initialState,
    reducers: {
        import(state, action: PayloadAction<{ season: ITvSeason }>) {
            state.import = true
            state.season = action.payload.season
        },
        import_supplemental(state, action: PayloadAction<{ season: ITvSeason }>) {
            state.import_supplemental = true
            state.season = action.payload.season
        },
        closeImport(state, action: PayloadAction<void>) {
            state.import = false
            state.import_supplemental = false
            state.season = undefined
        },
        showSearchResult(state, action: PayloadAction<IShowSubscription>) {
            state.search_open = true
            state.search_query = action.payload
        },
        closeSearchResult(state, action: PayloadAction<void>) {
            state.search_open = false
            state.search_query = undefined
        },
    },
});

export const seasonActions = seasonSlice.actions;

export const seasonImportSelector = (state: RootState) => ({
    import: state.season.import,
    season: state.season.season,
});

export const seasonSupplementalImportSelector = (state: RootState) => ({
    import: state.season.import_supplemental,
    season: state.season.season,
});

export const seasonSearchSelector = (state: RootState) => ({
    search_open: state.season.search_open,
    search_query: state.season.search_query,
});

export default seasonSlice.reducer;
