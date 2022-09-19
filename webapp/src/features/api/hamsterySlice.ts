import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ITvEpisode, ITvLibrary, ITvSeason, ITvShow, ITvStorage } from '../../app/entities';

export const hamsterySlice = createApi({
    reducerPath: 'hamstery',
    baseQuery: fetchBaseQuery({ baseUrl: '/hamstery/api' }),
    endpoints: builder => ({
        getTvLibraries: builder.query<ITvLibrary[], void>({
            query: () => '/tvlib',
        }),
        getTvLibrary: builder.query<ITvLibrary, string>({
            query: (id) => '/tvlib/' + id,
        }),
        getTvStorage: builder.query<ITvStorage, string>({
            query: (id) => '/tvstorage/' + id,
        }),
        getTvShow: builder.query<ITvShow & { seasons: ITvSeason[] }, string>({
            query: (id) => '/tvshow/' + id,
        }),
        getTvSeason: builder.query<ITvSeason, string>({
            query: (id) => '/tvseason/' + id,
        }),
        getTvEpisode: builder.query<ITvEpisode, string>({
            query: (id) => '/tvepisode/' + id,
        }),
    })
})