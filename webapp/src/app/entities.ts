import { schema } from "normalizr"

export interface TvLibrary {
    id: number,
    name: string,
    lang: string,
    storages: string[]
}

export interface TvStorage {
    id: number,
    path: string,
    shows: string[]
}

export interface TvShow {
    id: number,
    tmdb_id: number,
    name: string,
    number_of_episodes: number,
    number_of_seasons: number,
    poster_path?: string,
    air_date?: string,
    seasons?: string[],
}

export interface TvSeason {
    id: number,
    show: number,
    tmdb_id: number,
    name: string,
    season_number: number,
    number_of_episodes: number,
    poster_path?: string,
    air_date?: string,
    episodes: string[],
}

export interface TvEpisode {
    id: number,
    season: number,
    tmdb_id: number,
    status: number,
    name: string,
    season_number: number,
    episode_number: number,
    poster_path?: string,
    air_date?: string,
}

export const tvEpisodeEntity = new schema.Entity<TvShow>("tvepisodes")
export const tvSeasonEntity = new schema.Entity<TvShow>("tvseasons", {
    episodes: [tvEpisodeEntity],
})
export const tvShowEntity = new schema.Entity<TvShow>("tvshows", {
    seasons: [tvSeasonEntity]
})
export const tvStorageEntity = new schema.Entity<TvStorage>("tvstorages", {
    shows: [tvShowEntity],
})
export const tvLibraryEntity = new schema.Entity<TvLibrary>("tvlibraries", {
    storages: [tvStorageEntity],
})
export const tvLibraryArray = new schema.Array(tvLibraryEntity)