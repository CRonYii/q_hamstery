export interface IHamsterySettings {
    id: number,
    qbittorrent_host: string,
    qbittorrent_port: string,
    qbittorrent_username: string,
    qbittorrent_password: string,
}

export interface IHamsteryStats {
    openai_title_parser_calls: number,
    openai_title_parser_failures: number,
    openai_title_parser_prompt_tokens_used: number,
    openai_title_parser_completion_tokens_used: number,
    openai_title_parser_total_tokens_used: number,
}

export interface ITvLibrary {
    id: number,
    name: string,
    lang: string,
}

export interface ITvStorage {
    id: number,
    lib: number,
    path: string,
}

export interface ITvShow {
    id: number,
    storage: number,
    tmdb_id: number,
    name: string,
    number_of_episodes: number,
    number_of_ready_episodes: INumberOfEpisodes,
    number_of_seasons: number,
    poster_path?: string,
    air_date?: string,
    warn_removed: boolean,
}

export interface IAddShowResponse { id: number }

export interface ITvSeason {
    id: number,
    show: number,
    tmdb_id: number,
    name: string,
    season_number: number,
    number_of_episodes: number,
    number_of_ready_episodes: INumberOfEpisodes,
    poster_path?: string,
    air_date?: string,
    warn_removed: boolean,
}

export enum TvEpisodeStatus {
    MISSING = 1,
    READY = 3
}

export interface ITvEpisode {
    id: number,
    season: number,
    tmdb_id: number,
    status: TvEpisodeStatus,
    name: string,
    season_number: number,
    episode_number: number,
    poster_path?: string,
    air_date?: string,
    warn_removed: boolean,
}

interface DownloadExtraInfo {
    name: string,
    state: string,
    progress: number,
    dlspeed: number,
    completed: number,
    completion_on: number,
    size: number,
    eta: number,
    ratio: number,
    uploaded: number,
    upspeed: number,
}

export interface ITvDownload {
    id: string,
    task: string,
    error: boolean,
    done: boolean,
    episode: number,
    filename: string,
    file_index: number,
    extra_info: DownloadExtraInfo,
}
export interface IFileInfo {
    file_index: number,
    name: string,
    size: number,
}
export interface ISeasonDownload {
    id: number,
    season: number,
    task: string,
    extra_info: DownloadExtraInfo,
    files: IFileInfo[]
}

export interface IIndexer {
    id: number,
    name: string,
}

export interface ITorznab extends IIndexer {
    url: string,
    apikey: string,
    cat: string,
}

export interface IndexerSearchResult {
    title: string,
    pub_date: string,
    size: string,
    link: string,
    magneturl: string,
}

export interface TorznabCaps {
    searching: Record<string, {
        available: boolean,
        supportedParams: string
    }>,
    categories: {
        id: string,
        name: string,
        subcat: {
            id: string,
            name: string,
        }[]
    }[],
}

export interface IShowSubscription {
    id: number,
    season: number,
    indexer: number,
    query: string,
    priority: number,
    offset: number,
    exclude: string,
    done: boolean,
}

export interface ITitleParserLog {
    id: number,
    model: string,
    title: string,
    result: Record<string, any>,
    exception: string,
    tokens_used: number,
    time: string,
}

export type ISeasonSearchResult = Record<string, {
    title: string,
    link: string,
    magneturl: string,
    size: string,
    pub_date: string,
}[]>

export interface IDjangoOptions {
    name: string;
    description: string;
    renders: string[];
    parses: string[];
    actions: Actions;
}

export type IParamOptions = Record<string, IParamOption>

interface Actions {
    PUT?: IParamOptions;
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

export interface INumberOfEpisodes {
    ready: number,
    missing: number,
}
