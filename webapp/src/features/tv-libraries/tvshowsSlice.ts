import { createAsyncThunk, createEntityAdapter, createSelector, createSlice } from '@reduxjs/toolkit';
import { normalize, NormalizedSchema } from 'normalizr';
import { TvLibrary, tvLibraryArray, TvShow, TvStorage } from '../../app/entities';
import { RootState } from '../../app/store';
import hamstery from '../api/hamstery';

const tvLibrariesAdapter = createEntityAdapter<TvLibrary>();
const tvLibrariesInitialState = tvLibrariesAdapter.getInitialState()

const tvStoragesAdapter = createEntityAdapter<TvStorage>();
const tvStoragesInitialState = tvStoragesAdapter.getInitialState()

const tvShowsAdapter = createEntityAdapter<TvShow>();
const tvShowsInitialState = tvShowsAdapter.getInitialState()

export const fetchTvLibs = createAsyncThunk('tvshows/fetchTvLibraries', async () => {
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

const tvShowsSlice = createSlice({
    name: 'tvshows',
    initialState: {
        tvlibraries: tvLibrariesInitialState,
        tvstorages: tvStoragesInitialState,
        tvshows: tvShowsInitialState,
    },
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchTvLibs.fulfilled, (state, action) => {
                console.log(action.payload.entities.tvlibraries);
                tvLibrariesAdapter.upsertMany(state.tvlibraries, action.payload.entities.tvlibraries)
                tvStoragesAdapter.upsertMany(state.tvstorages, action.payload.entities.tvstorages)
                tvShowsAdapter.upsertMany(state.tvshows, action.payload.entities.tvshows)
            })
    },
});

export const tvShowsActions = tvShowsSlice.actions;

export const tvLibrariesSelectors = tvLibrariesAdapter.getSelectors((state: RootState) => state.tvshows.tvlibraries);
export const tvStoragesSelectors = tvStoragesAdapter.getSelectors((state: RootState) => state.tvshows.tvstorages);
export const tvShowsSelectors = tvShowsAdapter.getSelectors((state: RootState) => state.tvshows.tvshows);
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
    )

export default tvShowsSlice.reducer;
