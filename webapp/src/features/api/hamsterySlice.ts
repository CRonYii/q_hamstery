import { TagDescription } from '@reduxjs/toolkit/dist/query/endpointDefinitions';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';
import { ITorznabIndexer, ITvEpisode, ITvLibrary, ITvSeason, ITvShow } from '../../app/entities';

interface IDjangoOptions {
    name: string;
    description: string;
    renders: string[];
    parses: string[];
    actions: Actions;
}
type IParamOptions = Record<string, IParamOption>

interface Actions {
    POST?: IParamOptions;
}

interface IParamOption {
    type: 'integer' | 'string' | 'choice' | 'field' | 'nested object';
    required: boolean;
    read_only: boolean;
    label?: string;
    choices?: Choice[];
    max_length?: number;
    child?: IParamOption;
    children?: IParamOptions;
}

interface Choice {
    value: string;
    display_name: string;
}

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
    tagTypes: ['tvlib', 'torznab'],
    endpoints: builder => ({
        getTvLibraries: builder.query<ITvLibrary[], void>({
            query: () => '/tvlib/',
            providesTags: (result = [], error, arg) => [
                'tvlib',
                ...result.map(({ id }): TagDescription<'tvlib'> => ({ type: 'tvlib', id: String(id) }))
            ]
        }),
        getTvLibrary: builder.query<ITvLibrary, string>({
            query: (id) => `/tvlib/${id}/`,
            providesTags: (result, error, arg) => [{ type: 'tvlib', id: arg }]
        }),
        addTvLibrary: builder.mutation<void, { name: string, lang: string, }>({
            query: (body) => ({
                method: 'POST',
                url: '/tvlib/',
                body
            }),
            invalidatesTags: ['tvlib']
        }),
        removeTvLibrary: builder.mutation<void, string>({
            query: (id) => ({
                method: 'DELETE',
                url: `/tvlib/${id}/`,
            }),
            invalidatesTags: ['tvlib']
        }),
        editTvLibrary: builder.mutation<void, { id: string, name: string, lang: string, }>({
            query: (body) => ({
                method: 'PUT',
                url: `/tvlib/${body.id}/`,
                body
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'tvlib', id: arg.id }]
        }),
        getTvLibraryOptions: builder.query<{
            languages: { value: string, display_name: string }[],
        }, void>({
            query: () => ({
                method: 'OPTIONS',
                url: '/tvlib/',
                headers: {
                    'Accept': 'application/json'
                }
            }),
            transformResponse: (response: IDjangoOptions) => {
                return { languages: response.actions.POST?.lang?.choices || [] }
            }
        }),
        getTvShow: builder.query<ITvShow & { seasons: ITvSeason[] }, string>({
            query: (id) => `/tvshow/${id}/`,
        }),
        addTvShowToStorage: builder.mutation<void, { library_id: string, id: string, tmdb_id: string, }>({
            query: ({ id, tmdb_id }) => ({
                method: 'POST',
                url: `/tvstorage/${id}/add-show/`,
                headers: { 'content-type': 'application/x-www-form-urlencoded' },
                body: `tmdb_id=${tmdb_id}`
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'tvlib', id: arg.library_id }]
        }),
        getTvSeason: builder.query<ITvSeason, string>({
            query: (id) => `/tvseason/${id}/`,
        }),
        getTvEpisode: builder.query<ITvEpisode, string>({
            query: (id) => `/tvepisode/${id}/`,
        }),
        getTorznabIndexers: builder.query<ITorznabIndexer[], void>({
            query: () => '/torznab/',
            providesTags: (result = [], error, arg) => [
                'torznab',
                ...result.map(({ id }): TagDescription<'torznab'> => ({ type: 'torznab', id: String(id) }))
            ]
        }),
        getTorznabIndexer: builder.query<ITorznabIndexer, string>({
            query: (id) => `/torznab/${id}`,
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
                url: `/torznab/${id}/`,
            }),
            invalidatesTags: ['torznab']
        }),
        editTorznabIndexer: builder.mutation<void, ITorznabIndexer>({
            query: (body) => ({
                method: 'PUT',
                url: `/torznab/${body.id}/`,
                body
            }),
            invalidatesTags: (result, error, arg) => [{ type: 'torznab', id: arg.id }]
        }),
    })
})