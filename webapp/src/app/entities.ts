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
}

export const tvShowEntity = new schema.Entity<TvShow>("tvshows")
export const tvStorageEntity = new schema.Entity<TvStorage>("tvstorages", {
    shows: [tvShowEntity],
})
export const tvLibraryEntity = new schema.Entity<TvLibrary>("tvlibraries", {
    storages: [tvStorageEntity],
})
export const tvLibraryArray = new schema.Array(tvLibraryEntity)