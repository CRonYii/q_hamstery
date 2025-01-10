import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ITvEpisode, ITvSeason } from '../../app/entities';
import { RootState } from '../../app/store';


type IndexerSearchState = 'single' | 'download' | 'closed';
type IndexerSearchType = 'episode' | 'season';

interface IndexerState {
    search: IndexerSearchState,
    defaultQuery: string,
    type: IndexerSearchType,
    season?: ITvSeason,
    episode?: ITvEpisode,
    searchId?: string,
}

const initialState: IndexerState = {
    defaultQuery: '',
    search: 'closed',
    type: 'episode',
}

const indexerSlice = createSlice({
    name: 'indexer',
    initialState,
    reducers: {
        search(state, action: PayloadAction<{ id: string }>) {
            state.search = 'single'
            state.searchId = action.payload.id
        },
        download(state, action: PayloadAction<{ season: ITvSeason, episode?: ITvEpisode, query: string }>) {
            state.search = 'download'
            state.season = action.payload.season
            state.episode = action.payload.episode
            state.defaultQuery = action.payload.query
            state.type = state.episode ? 'episode' : 'season'
        },
        closeSearch(state, action: PayloadAction<void>) {
            state.search = 'closed'
        },
    },
});

export const indexerActions = indexerSlice.actions;

export const indexerSelector = (state: RootState) => state.indexer;

export default indexerSlice.reducer;
