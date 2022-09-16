import { createAsyncThunk, createEntityAdapter, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import hamstery from '../api/hamstery';

interface TvLibrary {
    id: number,
    name: string,
    lang: string,
}

const tvLibsAdapter = createEntityAdapter<TvLibrary>();

interface TvLibsState {
    selected?: number,
}

const initialState = tvLibsAdapter.getInitialState<TvLibsState>({
    selected: undefined,
});

export const fetchTvLibs = createAsyncThunk('tvlibs/fetchTvLibs', async () => {
    const response = await hamstery.getTvLibraryList();
    
    return response.data;
})

const tvLibsSlice = createSlice({
    name: 'tvlibs',
    initialState,
    reducers: {},
    extraReducers: builder => {
        builder
            .addCase(fetchTvLibs.fulfilled, (state, action) => {
                tvLibsAdapter.setAll(state, action.payload);
            })
    },
});

export const tvLibsActions = tvLibsSlice.actions;

export const tvLibsSelectors = tvLibsAdapter.getSelectors((state: RootState) => state.tvlibs);

export default tvLibsSlice.reducer;
