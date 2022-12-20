import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ITvSeason } from '../../app/entities';
import { RootState } from '../../app/store';


interface IndexerState {
    search: 'single' | 'download' | 'closed',
    defaultQuery: string,
    season?: ITvSeason,
    searchId?: string,
}

const initialState: IndexerState = {
    defaultQuery: '',
    search: 'closed'
}

const indexerSlice = createSlice({
    name: 'indexer',
    initialState,
    reducers: {
        search(state, action: PayloadAction<{ id: string }>) {
            state.search = 'single'
            state.searchId = action.payload.id
        },
        download(state, action: PayloadAction<{ season: ITvSeason, query: string }>) {
            state.search = 'download'
            state.season = action.payload.season
            state.defaultQuery = action.payload.query
        },
        closeSearch(state, action: PayloadAction<void>) {
            state.search = 'closed'
        },
    },
});

export const indexerActions = indexerSlice.actions;

export const indexerSelector = (state: RootState) => state.indexer;

export default indexerSlice.reducer;
