import { TagDescription } from '@reduxjs/toolkit/dist/query/endpointDefinitions';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';
import { ITorznabIndexer, ITvEpisode, ITvLibrary, ITvSeason, ITvShow, ITvStorage } from '../../app/entities';

export const hamsterySlice = createApi({
    reducerPath: 'hamstery',
    baseQuery: fetchBaseQuery({
        baseUrl: '/hamstery/api', prepareHeaders: (headers) => {
            const token = Cookies.get('csrftoken')
            if (token)
                headers.set('X-CSRFToken', token)
            return headers
        }
    }),
    tagTypes: ['torznab'],
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
        getTorznabIndexers: builder.query<ITorznabIndexer[], void>({
            query: () => '/torznab',
            providesTags: (result = [], error, arg) => [
                'torznab',
                ...result.map(({ id }): TagDescription<'torznab'> => ({ type: 'torznab', id: String(id) }))
            ]
        }),
        getTorznabIndexer: builder.query<ITorznabIndexer, string>({
            query: (id) => '/torznab/' + id,
            providesTags: (result, error, arg) => [{ type: 'torznab', id: arg }]
        }),
        addTorznabIndexer: builder.mutation<void, { name: string, url: string, apikey: string, }>({
            query: (body) => ({
                method: 'POST',
                url: '/torznab/',
                body
            }),
            invalidatesTags: ['torznab']
        }),
        removeTorznabIndexer: builder.mutation<void, string>({
            query: (id) => ({
                method: 'DELETE',
                url: '/torznab/' + id,
            }),
            invalidatesTags: ['torznab']
        }),
        editTorznabIndexer: builder.mutation<void, ITorznabIndexer>({
            query: (body) => ({
                method: 'PUT',
                url: '/torznab/' + body.id,
                body
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'torznab', id: arg.id }]
        }),
    })
})