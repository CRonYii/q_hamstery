import axios from "axios";
import { TvLibrary, TvShow } from "../../app/entities";

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
    getTvLibraryList() {
        return axios.get<TvLibrary[]>('/hamstery/api/tvlib/');
    },
    getTvShowById(id: string) {
        return axios.get<TvShow>(`/hamstery/api/tvshow/${id}/`);
    }
};

export default hamstery;