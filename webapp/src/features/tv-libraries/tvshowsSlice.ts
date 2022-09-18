import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { normalize, NormalizedSchema } from 'normalizr';
import { TvEpisode, TvLibrary, tvLibraryArray, TvSeason, TvShow, tvShowEntity, TvStorage } from '../../app/entities';
import { RootState } from '../../app/store';
import { datetimeSort } from '../../app/utils';
import hamstery from '../api/hamstery';

const tvLibrariesAdapter = createEntityAdapter<TvLibrary>();
const tvLibrariesInitialState = tvLibrariesAdapter.getInitialState()

const tvStoragesAdapter = createEntityAdapter<TvStorage>();
const tvStoragesInitialState = tvStoragesAdapter.getInitialState()

const tvShowsAdapter = createEntityAdapter<TvShow>();
const tvShowsInitialState = tvShowsAdapter.getInitialState()

const tvSeasonsAdapter = createEntityAdapter<TvSeason>();
const tvSeasonsInitialState = tvSeasonsAdapter.getInitialState()

const tvEpisodesAdapter = createEntityAdapter<TvEpisode>();
const tvEpisodesInitialState = tvEpisodesAdapter.getInitialState()

export const fetchTvLibraries = createAsyncThunk('tvshows/fetchTvLibraries', async () => {
    const response = await hamstery.getTvLibraryList();
    const data: NormalizedSchema<{
        ["tvlibraries"]: {
            [key: string]: TvLibrary,
        },
        ["tvstorages"]: {
            [key: string]: TvStorage,
        },
        ["tvshows"]: {
            [key: string]: TvShow,
        },
    }, number[]> = normalize(response.data, tvLibraryArray)
    return data;
})

export const fetchTvShow = createAsyncThunk('tvshows/fetchTvShow', async (id: string) => {
    const response = await hamstery.getTvShowById(id);
    const data: NormalizedSchema<{
        ["tvepisodes"]: {
            [key: string]: TvEpisode,
        },
        ["tvseasons"]: {
            [key: string]: TvSeason,
        },
        ["tvshows"]: {
            [key: string]: TvShow,
        },
    }, number[]> = normalize(response.data, tvShowEntity)
    return data;
}, {
    condition: (id, { getState }) => {
        const show = tvShowsSelectors.selectById(getState() as RootState, id)
        return !show || !show.seasons
    }
})

const tvShowsSlice = createSlice({
    name: 'tvshows',
    initialState: {
        tvlibraries: tvLibrariesInitialState,
        tvstorages: tvStoragesInitialState,
        tvshows: tvShowsInitialState,
        tvseasons: tvSeasonsInitialState,
        tvepisodes: tvEpisodesInitialState,
    },
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchTvLibraries.fulfilled, (state, action) => {
                tvLibrariesAdapter.upsertMany(state.tvlibraries, action.payload.entities.tvlibraries)
                tvStoragesAdapter.upsertMany(state.tvstorages, action.payload.entities.tvstorages)
                tvShowsAdapter.upsertMany(state.tvshows, action.payload.entities.tvshows)
            })
            .addCase(fetchTvShow.fulfilled, (state, action) => {
                tvShowsAdapter.upsertMany(state.tvshows, action.payload.entities.tvshows)
                tvSeasonsAdapter.upsertMany(state.tvseasons, action.payload.entities.tvseasons)
                tvEpisodesAdapter.upsertMany(state.tvepisodes, action.payload.entities.tvepisodes)
            })
    },
});

export const tvShowsActions = tvShowsSlice.actions;

export const tvLibrariesSelectors = tvLibrariesAdapter.getSelectors((state: RootState) => state.tvshows.tvlibraries);
export const tvStoragesSelectors = tvStoragesAdapter.getSelectors((state: RootState) => state.tvshows.tvstorages);
export const tvShowsSelectors = tvShowsAdapter.getSelectors((state: RootState) => state.tvshows.tvshows);
export const tvSeasonsSelectors = tvSeasonsAdapter.getSelectors((state: RootState) => state.tvshows.tvseasons);
export const tvEpisodesSelectors = tvEpisodesAdapter.getSelectors((state: RootState) => state.tvshows.tvepisodes);

export const selectAllShowsByLibrary = (libId: string) =>
    createSelector(
        [
            state => tvLibrariesSelectors.selectById(state, libId),
            state => tvStoragesSelectors.selectEntities(state),
            state => tvShowsSelectors.selectEntities(state),
        ],
        (library, storages, shows) =>
            library
                ?.storages.map(id => storages[id])
                .reduce<TvShow[]>((libraryShows, storage) => {
                    if (!storage)
                        return libraryShows
                    const storageShows = storage.shows.map(id => shows[id]).filter((show): show is TvShow => !!show)
                    return [...libraryShows, ...storageShows]
                }, [])
                .sort((a, b) => datetimeSort(a.air_date, b.air_date))
    )

export const selectAllSeasonsByShow = (showId: string) =>
    createSelector(
        [
            state => tvShowsSelectors.selectById(state, showId),
            state => tvSeasonsSelectors.selectEntities(state),
        ],
        (show, seasons) =>
            show?.seasons
                ?.map(season => seasons[season])
                .filter((season): season is TvSeason => !!season)
    )

export default tvShowsSlice.reducer;
