export interface ITvLibrary {
    id: number,
    name: string,
    lang: string,
    storages: ITvStorage[]
}

export interface ITvStorage {
    id: number,
    lib: number,
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
    seasons?: ITvSeason[],
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

export interface ITorznabIndexer {
    id: number,
    name: string,
    url: string,
    apikey: string,
}

export interface IndexerSearchResult {
    title: string,
    pub_date: string,
    size: string,
    link: string,
}

export interface IDjangoOptions {
    name: string;
    description: string;
    renders: string[];
    parses: string[];
    actions: Actions;
}

export type IParamOptions = Record<string, IParamOption>

interface Actions {
    POST?: IParamOptions;
}

export interface IParamOption {
    type: 'integer' | 'string' | 'boolean' | 'choice' | 'email' | 'field' | 'date' | 'nested object';
    required: boolean;
    read_only: boolean;
    label?: string;
    choices?: Choice[];
    max_length?: number;
    min_length?: number;
    max_value?: number;
    min_value?: number;
    child?: IParamOption;
    children?: IParamOptions;
}

export interface Choice {
    value: string;
    display_name: string;
}