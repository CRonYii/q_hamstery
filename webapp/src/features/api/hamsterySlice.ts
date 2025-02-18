import { TagDescription } from '@reduxjs/toolkit/dist/query/endpointDefinitions';
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import Cookies from 'js-cookie';
import flatten from 'lodash/flatten';
import { IAddShowResponse, IDjangoOptions, IHamsterySettings, IHamsteryStats, IIndexer, IParamOptions, ISeasonSearchResult, IShowSubscription, ITitleParserLog, ITorznab, ITvDownload, ITvEpisode, ITvLibrary, ITvSeason, ITvShow, ITvStorage } from '../../app/entities';

type TagTypes = 'stats' |
    'settings' |
    'tvlib' |
    'tvstorage' |
    'tvshow' |
    'tvseason' |
    'tvepisode' |
    'tvdownload' |
    'monitored-tvdownload' |
    'season-download' |
    'season-episode-download' |
    'indexer' |
    'torznab' |
    'show-subscription' |
    'title-parser'

export interface IPageNumberResult<T> {
    count: number
    page_size: number,
    page: number,
    results: T[]
}

export const hamsterySlice = createApi({
    reducerPath: 'hamstery',
    baseQuery: fetchBaseQuery({
        baseUrl: '/hamstery/api',
        prepareHeaders: (headers) => {
            const token = Cookies.get('csrftoken')
            if (token)
                headers.set('X-CSRFToken', token)
            return headers
        }
    }),
    tagTypes: [
        'stats',
        'settings',
        'tvlib',
        'tvstorage',
        'tvshow',
        'tvseason',
        'tvepisode',
        'tvdownload',
        'monitored-tvdownload',
        'season-download',
        'season-episode-download',
        'indexer',
        'torznab',
        'show-subscription',
        'title-parser',
    ],
    endpoints: builder => {
        const CRUDEntity = <T>(
            {
                name,
                url,
                singleton = false,
                idSelector = (item: any) => item.id,
                extraArgTags,
                extraItemTags,
                keepUnusedDataFor,

            }: {
                name: TagTypes, url: string,
                singleton?: boolean,
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
                getPage: builder.query<IPageNumberResult<T>, any>({
                    query: (params) => ({
                        method: 'GET',
                        url,
                        params
                    }),
                    providesTags: (result, error, arg) => {
                        if (!result)
                            return []
                        const { results } = result
                        const tags = [
                            name,
                            ...results.map((item): TagDescription<TagTypes> => ({ type: name, id: idSelector(item) })),
                            ...(extraArgTags
                                ? flatten(extraArgTags(arg))
                                : []),
                            ...(extraItemTags
                                ? flatten(results.map((item) => extraItemTags(item)))
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
                        url: singleton ? `${url}/${1}/` : url,
                        headers: {
                            'Accept': 'application/json'
                        }
                    }),
                    transformResponse: (response: IDjangoOptions) => {
                        return singleton ? response.actions.PUT : response.actions.POST
                    }
                }),
            }
        }
        const settings = CRUDEntity<IHamsterySettings>({ name: 'settings', url: '/settings/', singleton: true, })
        const stats = CRUDEntity<IHamsteryStats>({ name: 'stats', url: '/stats/', singleton: true, })
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
            extraArgTags: (arg) => [{ type: 'tvepisode', id: arg.episode }],
            keepUnusedDataFor: 1,
        })
        const monitored_tvdownload = CRUDEntity<ITvDownload>({ name: 'monitored-tvdownload', url: '/monitored-tvdownload/' })
        const season_download = CRUDEntity<ITvDownload>({ name: 'season-download', url: '/season-download/' })
        const season_episode_download = CRUDEntity<ITvDownload>({ name: 'season-episode-download', url: '/season-episode-download/' })
        const indexer = CRUDEntity<IIndexer>({ name: 'indexer', url: '/indexer/' })
        const torznab = CRUDEntity<ITorznab>({ name: 'torznab', url: '/torznab/' })
        const show_subscriptions = CRUDEntity<IShowSubscription>({ name: 'show-subscription', url: '/show-subscription/' })
        const title_parser = CRUDEntity<ITitleParserLog>({ name: 'title-parser', url: '/title-parser/' })
        return {
            // Hamstery Settings
            getSettings: settings.get,
            addSettings: settings.create, // dummy export, will not be used
            editSettings: settings.update,
            getSettingsOptions: settings.options,
            // Hamstery Stats
            getStats: stats.get,
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
            getTvShows: tvshow.getAll,
            getTvShowsPage: tvshow.getPage,
            addTvShowToStorage: builder.mutation<IAddShowResponse, { id: string, tmdb_id: string, }>({
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
            searchTvSeason: builder.query<ISeasonSearchResult, IShowSubscription>({
                query: (sub) => ({
                    method: 'GET',
                    url: `/tvseason/${sub.season}/search/?query=${sub.query}&indexer_id=${sub.indexer}&offset=${sub.offset}&exclude=${sub.exclude}`,
                }),
            }),
            downloadTvSeason: builder.mutation<void, { id: string, data: string | File, importExternal: boolean }>({
                query: ({ id, data, importExternal }) => {
                    if (typeof data === 'string') {
                        return ({
                            method: 'POST',
                            url: `/tvseason/${id}/download/`,
                            headers: { 'content-type': 'application/json' },
                            body: { url: data, importExternal },
                        })
                    } else {
                        const form = new FormData()
                        form.append('torrent', data)
                        form.append('import_external', String(importExternal))
                        return ({
                            method: 'POST',
                            url: `/tvseason/${id}/download/`,
                            body: form,
                        })
                    }
                },
                invalidatesTags: ['season-download']
            }),
            // TV Episode
            getTvEpisodes: tvepisode.getAll,
            getTvEpisodesPage: tvepisode.getPage,
            getTvEpisode: tvepisode.get,
            removeTvEpisode: builder.mutation<void, string>({
                query: (id) => ({
                    method: 'DELETE',
                    url: `/tvepisode/${id}/remove/`,
                }),
                invalidatesTags: (result, error, id) => [{ type: 'tvepisode', id }]
            }),
            downloadTvEpisode: builder.mutation<void, { id: string, data: string | File, importExternal: boolean }>({
                query: ({ id, data, importExternal }) => {
                    if (typeof data === 'string') {
                        return ({
                            method: 'POST',
                            url: `/tvepisode/${id}/download/`,
                            headers: { 'content-type': 'application/json' },
                            body: { url: data, importExternal },
                        })
                    } else {
                        const form = new FormData()
                        form.append('torrent', data)
                        form.append('import_external', String(importExternal))
                        return ({
                            method: 'POST',
                            url: `/tvepisode/${id}/download/`,
                            body: form,
                        })
                    }
                },
            }),
            importTvEpisode: builder.mutation<void, { id: string, path: string, mode: string }>({
                query: ({ id, path, mode }) => ({
                    method: 'POST',
                    url: `/tvepisode/${id}/local_import/`,
                    headers: { 'content-type': 'application/x-www-form-urlencoded' },
                    body: `path=${encodeURIComponent(path)}&mode=${mode}`
                }),
                invalidatesTags: (result, error, arg) => [{ type: 'tvepisode', id: arg.id }]
            }),
            importTvEpisodeSupplemental: builder.mutation<void, { id: string, path: string, mode: string }>({
                query: ({ id, path, mode }) => ({
                    method: 'POST',
                    url: `/tvepisode/${id}/local_import_supplemental/`,
                    headers: { 'content-type': 'application/x-www-form-urlencoded' },
                    body: `path=${encodeURIComponent(path)}&mode=${mode}`
                }),
            }),
            // TV Download,
            getTvDownloads: tvdownload.getAll,
            removeTvDownload: tvdownload.delete,
            // Monitored TV Download,
            getMonitoredTvDownloads: monitored_tvdownload.getAll,
            // Season Download
            getSeasonDownloads: season_download.getAll,
            getSeasonDownload: season_download.get,
            removeSeasonDownload: season_download.delete,
            updateSeasonDownloadMapping: builder.mutation<{ errors: string[] }, { id: string, args: { episode: number, file_index: number }[], }>({
                query: ({ id, args }) => ({
                    method: 'POST',
                    url: `/season-download/${id}/download/`,
                    headers: { 'content-type': 'application/json' },
                    body: { mappings: args },
                }),
                invalidatesTags: ['season-episode-download']
            }),
            // Season Episode Download,
            getSeasonEpisodeDownloads: season_episode_download.getAll,
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
            // Show Subscriptions
            getShowSubscriptions: show_subscriptions.getAll,
            getShowSubscription: show_subscriptions.get,
            addShowSubscription: show_subscriptions.create,
            removeShowSubscription: show_subscriptions.delete,
            editShowSubscription: show_subscriptions.update,
            getShowSubscriptionOptions: show_subscriptions.options,
            scanShowSubscription: builder.mutation<void, string>({
                query: (id) => ({
                    method: 'POST',
                    url: `/show-subscription/${id}/monitor/`,
                }),
            }),
            // OpenAITitleParserLogs
            getTitleParserLogs: title_parser.getAll,
            getTitleParserPage: title_parser.getPage,
            getTitleParserLog: title_parser.get,
        }
    }
})