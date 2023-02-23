import axios from "axios";
import { IndexerSearchResult, TorznabCaps } from "../../app/entities";

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

const hamstery = {
    test() {
        return axios.get<{ id: number, username: string }>('/hamstery/auth/test');
    },
    login(username: string, password: string) {
        return axios.post<'Ok' | 'Invalid credentials'>('/hamstery/auth/login', { username, password });
    },
    logout() {
        return axios.get<'Ok'>('/hamstery/auth/logout');
    },
    searchIndexer(id: string, keyword: string) {
        return axios.get<IndexerSearchResult[]>(`/hamstery/api/indexer/${id}/search/?query=${keyword}`)
    },
    torznabCaps(id: string) {
        return axios.get<TorznabCaps>(`/hamstery/api/torznab/${id}/caps`)
    },
    listMedia(path?: string) {
        return axios.get<IMediaResources>(path ? `/hamstery/api/media/list?path=${encodeURIComponent(path)}` : `/hamstery/api/media/list`)
    },
    testQbtConnection() {
        return axios.get<IQbtTestResult>('/hamstery/api/settings/1/qbt_test_connection/')
    }
};

export default hamstery;