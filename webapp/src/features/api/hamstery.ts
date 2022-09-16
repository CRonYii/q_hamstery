import axios from "axios";

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
        return axios.get('/hamstery/api/tvlib/');
    }
};

export default hamstery;