import axios from "axios";
import { IndexerSearchResult, TorznabCaps } from "../../app/entities";
import Cookies from "js-cookie";

export interface ITestAuth { id: number, username: string, hamstery_version: string }

export interface IMediaResource {
    key: string,
    path: string,
    title: string,
}

export interface IMediaResources {
    path: IMediaResource[],
    file: IMediaResource[],
}

export interface IQbtTestResult {
    status: boolean,
    message: string,
}

export interface ITitleParserResult {
    title: string,
    episode: number,
    success: boolean,
}

export interface IEpisodeNumber {
    episode_number: number,
}

export interface IOpenAIModel {
    id: string,
    created: number,
    owned_by: string,
}

const hamstery = {
    test() {
        return axios.get<ITestAuth>('/hamstery/auth/test');
    },
    login(username: string, password: string) {
        return axios.post<'Ok' | 'Invalid credentials'>('/hamstery/auth/login', { username, password });
    },
    logout() {
        return axios.get<'Ok'>('/hamstery/auth/logout');
    },
    searchIndexer(id: string, keyword: string) {
        return axios.get<IndexerSearchResult[]>(`/hamstery/api/indexer/${id}/search/?query=${encodeURIComponent(keyword)}`)
    },
    torznabCaps(id: string) {
        return axios.get<TorznabCaps>(`/hamstery/api/torznab/${id}/caps`)
    },
    listMedia(path?: string) {
        return axios.get<IMediaResources>(path ? `/hamstery/api/media/list?path=${encodeURIComponent(path)}` : `/hamstery/api/media/list`)
    },
    testQbtConnection() {
        return axios.get<IQbtTestResult>('/hamstery/api/settings/1/qbt_test_connection/')
    },
    testPlexConnection() {
        return axios.get<IQbtTestResult>('/hamstery/api/settings/1/plex_test_connection/')
    },
    getEpisodeNumber(title: string) {
        return axios.get<IEpisodeNumber>(`/hamstery/api/media/episode_number?title=${encodeURIComponent(title)}`)
    },
    getOpenAIModels() {
        return axios.get<{ models: IOpenAIModel[] }>('/hamstery/api/settings/1/openai_get_models/')
    },
    testOpenAITitleParser() {
        return axios.get<ITitleParserResult>('/hamstery/api/settings/1/openai_test_title_parser/')
    },
    resetTitleParserStats() {
        return axios.post<string>('/hamstery/api/stats/1/reset_title_parser_stats/', undefined, {
            headers: {
                'X-CSRFToken': Cookies.get('csrftoken') || '',
            }
        })
    },
};

export default hamstery;