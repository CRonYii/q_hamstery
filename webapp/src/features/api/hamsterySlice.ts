import { TagDescription } from '@reduxjs/toolkit/dist/query/endpointDefinitions';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';
import flatten from 'lodash/flatten';
import { IDjangoOptions, IParamOptions, ITorznabIndexer, ITvEpisode, ITvLibrary, ITvSeason, ITvShow, ITvStorage } from '../../app/entities';

type TagTypes = 'tvlib' | 'tvstorage' | 'tvshow' | 'tvseason' | 'tvepisode' | 'torznab'

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
    tagTypes: ['tvlib', 'tvstorage', 'tvshow', 'tvseason', 'tvepisode', 'torznab'],
    endpoints: builder => {
        const CRUDEntity = <T extends { id: number }>(
            name: TagTypes, url: string, extraTags?: (item: T) => TagDescription<TagTypes>[]) => {
            return {
                getAll: builder.query<T[], any>({
                    query: (params) => ({
                        method: 'GET',
                        url,
                        params
                    }),
                    providesTags: (result = [], error, arg) => {
                        const tags = extraTags
                            ? flatten(result.map((item) => extraTags(item)))
                            : []
                        return [
                            name,
                            ...result.map(({ id }): TagDescription<TagTypes> => ({ type: name, id: String(id) })),
                            ...tags,
                        ]
                    }
                }),
                get: builder.query<T, string>({
                    query: (id) => `${url}${id}/`,
                    providesTags: (result, error, arg) => {
                        const tags: TagDescription<TagTypes>[] = [{ type: name, id: arg }]
                        if (extraTags && result)
                            extraTags(result).forEach((tag) => {
                                tags.push(tag)
                            })
                        return tags
                    }
                }),
                create: builder.mutation<void, T | FormData>({
                    query: (body) => ({
                        method: 'POST',
                        url,
                        body
                    }),
                    invalidatesTags: [name]
                }),
                delete: builder.mutation<void, string>({
                    query: (id) => ({
                        method: 'DELETE',
                        url: `${url}${id}/`,
                    }),
                    invalidatesTags: (result, error, id) => [{ type: name, id }]
                }),
                update: builder.mutation<void, { id: string, body: T | FormData }>({
                    query: ({ id, body }) => {
                        return {
                            method: 'PUT',
                            url: `${url}${id}/`,
                            body
                        }
                    },
                    invalidatesTags: (result, error, arg) => [{ type: name, id: arg.id }]
                }),
                options: builder.query<IParamOptions | undefined, void>({
                    query: () => ({
                        method: 'OPTIONS',
                        url: url,
                        headers: {
                            'Accept': 'application/json'
                        }
                    }),
                    transformResponse: (response: IDjangoOptions) => {
                        return response.actions.POST
                    }
                }),
            }
        }
        const tvlib = CRUDEntity<ITvLibrary>('tvlib', '/tvlib/')
        const tvstorage = CRUDEntity<ITvStorage>('tvstorage', '/tvstorage/')
        const tvshow = CRUDEntity<ITvShow>('tvshow', '/tvshow/', (show) => [{ type: 'tvstorage', id: show.storage }])
        const tvseason = CRUDEntity<ITvSeason>('tvseason', '/tvseason/')
        const tvepisode = CRUDEntity<ITvEpisode>('tvepisode', '/tvepisode/')
        const torznab = CRUDEntity<ITorznabIndexer>('torznab', '/torznab/')
        return {
            // TV Library
            getTvLibraries: tvlib.getAll,
            getTvLibrary: tvlib.get,
            addTvLibrary: tvlib.create,
            removeTvLibrary: tvlib.delete,
            editTvLibrary: tvlib.update,
            getTvLibraryOptions: tvlib.options,
            scanTvLibrary: builder.mutation<string[], string>({
                query: (id) => ({
                    method: 'POST',
                    url: `/tvlib/${id}/scan/`,
                }),
                invalidatesTags: (result, error, arg) => result?.map(id => ({ type: 'tvstorage', id })) || []
            }),
            // Tv Storage
            getTvStorages: tvstorage.getAll,
            getTvStorage: tvstorage.get,
            addTvStorage: tvstorage.create,
            removeTvStorage: tvstorage.delete,
            editTvStorage: tvstorage.update,
            getTvStorageOptions: tvstorage.options,
            // TV Show
            getTvShow: tvshow.get,
            addTvShowToStorage: builder.mutation<void, { library_id: string, id: string, tmdb_id: string, }>({
                query: ({ id, tmdb_id }) => ({
                    method: 'POST',
                    url: `/tvstorage/${id}/add-show/`,
                    headers: { 'content-type': 'application/x-www-form-urlencoded' },
                    body: `tmdb_id=${tmdb_id}`
                }),
                invalidatesTags: (result, error, arg) => [{ type: 'tvstorage', id: arg.id }]
            }),
            // TV Season
            getTvSeasons: tvseason.getAll,
            getTvSeason: tvseason.get,
            // TV Episode
            getTvEpisodes: tvepisode.getAll,
            getTvEpisode: tvepisode.get,
            // Torznab Indexers
            getTorznabIndexers: torznab.getAll,
            getTorznabIndexer: torznab.get,
            addTorznabIndexer: torznab.create,
            removeTorznabIndexer: torznab.delete,
            editTorznabIndexer: torznab.update,
            getTorznabIndexerOptions: torznab.options,
        }
    }
})