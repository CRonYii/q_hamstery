
export interface ITvLibrary {
    id: number,
    name: string,
    lang: string,
    storages: ITvStorage[]
}

export interface ITvStorage {
    id: number,
    path: string,
    shows: ITvShow[]
}

export interface ITvShow {
    id: number,
    tmdb_id: number,
    name: string,
    number_of_episodes: number,
    number_of_seasons: number,
    poster_path?: string,
    air_date?: string,
}

export interface ITvSeason {
    id: number,
    show: number,
    tmdb_id: number,
    name: string,
    season_number: number,
    number_of_episodes: number,
    poster_path?: string,
    air_date?: string,
    episodes: ITvEpisode[],
}

export interface ITvEpisode {
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
