import { ITvShow, ITvStorage } from "./entities";

export const datetimeSort = (a: string | undefined, b: string | undefined) => {
    const atime = a ? new Date(a).getTime() : Number.MAX_SAFE_INTEGER;
    const btime = b ? new Date(b).getTime() : Number.MAX_SAFE_INTEGER;
    return atime - btime;
}

export const isInThePast = (date?: string) => {
    if (!date)
        return false
    return new Date(date).getTime() < (new Date().getTime() + (1000 * 3600 * 24))
}

export const toTMDBPosterURL = (relativeURL?: string, size: 'w500' | 'w185' = 'w500') => {
    return relativeURL ? `https://image.tmdb.org/t/p/${size}/${relativeURL}` : ''
}

export const getShowsOfLibrary = (storages?: ITvStorage[]) => {
    if (!storages)
        return []
    return storages
        .reduce<ITvShow[]>((shows, storage) => [...shows, ...storage.shows], [])
        .sort((a, b) => datetimeSort(b.air_date, a.air_date))
}

export const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1000;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function secondsToDhms(seconds: number) {
    if (seconds <= 0) {
        return '0 sec'
    }
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor(seconds % (3600 * 24) / 3600);
    const m = Math.floor(seconds % 3600 / 60);
    const s = Math.floor(seconds % 60);

    const dDisplay = d > 0 ? d + (d === 1 ? " day, " : " days, ") : "";
    const hDisplay = h > 0 ? h + (h === 1 ? " hr, " : " hrs, ") : "";
    const mDisplay = m > 0 ? m + (m === 1 ? " min, " : " mins, ") : "";
    const sDisplay = s > 0 ? s + (s === 1 ? " sec" : " secs") : "";
    return dDisplay + hDisplay + mDisplay + sDisplay;
}

export const getDefaultLanguage = () => {
    return window.navigator.language.split(/-|_/)[0]
}

export const getEpNumber = (title: string) => (title.match(/Ep|EP|[ E第【[](\d{2,3})(v\d)?[ 话回集\].】]/) || [])[1] || '0'