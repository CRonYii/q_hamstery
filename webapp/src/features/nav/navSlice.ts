import { createEntityAdapter, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

interface INavTab {
    key: string,
    to: string,
    label: string,
}

const navAdapter = createEntityAdapter<INavTab>({
    selectId: (({ key }) => key)
})

const initialState = navAdapter.setAll(navAdapter.getInitialState(), [
    { key: 'tvshows', to: '/tvshows', label: 'TV Shows', },
    { key: 'indexers', to: '/indexers', label: 'Indexers', },
])

const navSlice = createSlice({
    name: 'nav',
    initialState,
    reducers: {
        updateRoute: navAdapter.updateOne,
    },
});

export const navActions = navSlice.actions;

export const navSelector = navAdapter.getSelectors<RootState>(state => state.nav);

export default navSlice.reducer;
