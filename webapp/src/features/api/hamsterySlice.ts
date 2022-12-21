import { TagDescription } from '@reduxjs/toolkit/dist/query/endpointDefinitions';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';
import flatten from 'lodash/flatten';
import { IDjangoOptions, IIndexer, IParamOptions, ITorznab, ITvDownload, ITvEpisode, ITvLibrary, ITvSeason, ITvShow, ITvStorage } from '../../app/entities';

type TagTypes = 'tvlib' | 'tvstorage' | 'tvshow' | 'tvseason' | 'tvepisode' | 'tvdownload' | 'indexer' | 'torznab'

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
    tagTypes: ['tvlib', 'tvstorage', 'tvshow', 'tvseason', 'tvepisode', 'tvdownload', 'indexer', 'torznab'],
    endpoints: builder => {
        const CRUDEntity = <T>(
            {
                name,
                url,
                idSelector = (item: any) => item.id,
                extraArgTags,
                extraItemTags,
                keepUnusedDataFor,
            }: {
                name: TagTypes, url: string,
                idSelector?: (item: T) => string,
                extraArgTags?: (arg: any) => TagDescription<TagTypes>[],
                extraItemTags?: (item: T) => TagDescription<TagTypes>[],
                keepUnusedDataFor?: number,
            }
        ) => {
            return {
                getAll: builder.query<T[], any>({
                    query: (params) => ({
                        method: 'GET',
                        url,
                        params
                    }),
                    providesTags: (result = [], error, arg) => {
                        const tags = [
                            name,
                            ...result.map((item): TagDescription<TagTypes> => ({ type: name, id: idSelector(item) })),
                            ...(extraArgTags
                                ? flatten(extraArgTags(arg))
                                : []),
                            ...(extraItemTags
                                ? flatten(result.map((item) => extraItemTags(item)))
                                : []),
                        ]

                        return tags
                    },
                    keepUnusedDataFor,
                }),
                get: builder.query<T, string>({
                    query: (id) => `${url}${id}/`,
                    providesTags: (result, error, arg) => {
                        const tags: TagDescription<TagTypes>[] = [{ type: name, id: arg }]
                        if (extraItemTags && result)
                            extraItemTags(result).forEach((tag) => {
                                tags.push(tag)
                            })
                        if (extraArgTags)
                            extraArgTags(arg).forEach((tag) => {
                                tags.push(tag)
                            })
                        return tags
                    },
                    keepUnusedDataFor
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
        const tvlib = CRUDEntity<ITvLibrary>({ name: 'tvlib', url: '/tvlib/' })
        const tvstorage = CRUDEntity<ITvStorage>({ name: 'tvstorage', url: '/tvstorage/' })
        const tvshow = CRUDEntity<ITvShow>({ name: 'tvshow', url: '/tvshow/', })
        const tvseason = CRUDEntity<ITvSeason>({
            name: 'tvseason', url: '/tvseason/', extraArgTags: (arg) => [{ type: 'tvshow', id: arg.show }]
        })
        const tvepisode = CRUDEntity<ITvEpisode>({ name: 'tvepisode', url: '/tvepisode/' })
        const tvdownload = CRUDEntity<ITvDownload>({
            name: 'tvdownload',
            url: '/tvdownload/',
            idSelector: d => d.hash,
            extraArgTags: (arg) => [{ type: 'tvepisode', id: arg.episode }],
            keepUnusedDataFor: 1,
        })
        const indexer = CRUDEntity<IIndexer>({ name: 'indexer', url: '/indexer/' })
        const torznab = CRUDEntity<ITorznab>({ name: 'torznab', url: '/torznab/' })
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
                invalidatesTags: (result, error, arg) => [
                    ...(result || []).map<TagDescription<TagTypes>>(id => ({ type: 'tvstorage', id })),
                    'tvshow', 'tvseason', 'tvepisode'
                ]
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
            addTvShowToStorage: builder.mutation<void, { id: string, tmdb_id: string, }>({
                query: ({ id, tmdb_id }) => ({
                    method: 'POST',
                    url: `/tvstorage/${id}/add-show/`,
                    headers: { 'content-type': 'application/x-www-form-urlencoded' },
                    body: `tmdb_id=${encodeURIComponent(tmdb_id)}`
                }),
                invalidatesTags: (result, error, arg) => [{ type: 'tvstorage', id: arg.id }]
            }),
            scanTvShow: builder.mutation<string[], string>({
                query: (id) => ({
                    method: 'POST',
                    url: `/tvshow/${id}/scan/`,
                }),
                invalidatesTags: (result, error, arg) => [{ type: 'tvshow', id: arg }, 'tvseason', 'tvepisode']
            }),
            // TV Season
            getTvSeasons: tvseason.getAll,
            getTvSeason: tvseason.get,
            scanTvSeason: builder.mutation<string[], string>({
                query: (id) => ({
                    method: 'POST',
                    url: `/tvseason/${id}/scan/`,
                }),
                invalidatesTags: (result, error, arg) => [{ type: 'tvseason', id: arg }, 'tvepisode']
            }),
            // TV Episode
            getTvEpisodes: tvepisode.getAll,
            getTvEpisode: tvepisode.get,
            downloadTvEpisode: builder.mutation<void, { id: string, url: string }>({
                query: ({ id, url }) => ({
                    method: 'POST',
                    url: `/tvepisode/${id}/download/`,
                    headers: { 'content-type': 'application/x-www-form-urlencoded' },
                    body: `url=${encodeURIComponent(url)}`
                }),
            }),
            importTvEpisode: builder.mutation<void, { id: string, path: string }>({
                query: ({ id, path }) => ({
                    method: 'POST',
                    url: `/tvepisode/${id}/local_import/`,
                    headers: { 'content-type': 'application/x-www-form-urlencoded' },
                    body: `path=${encodeURIComponent(path)}`
                }),
                invalidatesTags: (result, error, arg) => [{ type: 'tvepisode', id: arg.id}]
            }),
            // TV Download,
            getTvDownloads: tvdownload.getAll,
            removeTvDownload: tvdownload.delete,
            // Indexers
            getIndexers: indexer.getAll,
            getIndexer: indexer.get,
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