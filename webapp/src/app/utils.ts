import Nzh from "nzh";
import { hamsterySlice } from "../features/api/hamsterySlice";
import { ITvLibrary, ITvShow, ITvStorage } from "./entities";

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

export const makeGettersForShowsOfLibrary = (getters: Record<string, any>, library: ITvLibrary) => {
    library.storages.forEach(storage => getters[String(storage.id)] = () => hamsterySlice.useGetTvShowsQuery({ storage: storage.id }))
}

export const getShowsFromLibrary = (values: Record<string, any>, library: ITvLibrary) => {
    return library.storages
        .reduce<ITvShow[]>((shows, storage) => [...shows, ...values[String(storage.id)].data], [])
        .sort((a, b) => datetimeSort(b.air_date, a.air_date))
}

export const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatBytes(bytes: number, decimals = 2) {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];

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

export const getFilenameWithoutExtension = (name: string) => {
    const parts = name.split('.')
    const filename = parts.slice(0, parts.length - 1).join('.')
    return filename
}

const epNumberRegex = /(?:[Ee][Pp]|[ E第【[])(\d{2,3}|[零一二三四五六七八九十百千]{1,6})([vV]\d)?[ 話话回集\].】-]/

export const getEpNumber = (title: string) => {
    // If the title itself is a number, return title
    const filename = getFilenameWithoutExtension(title)
    if (!isNaN(Number(filename)))
        return Number(filename)

    const match = title.match(epNumberRegex)
    if (!match || match[1] === undefined)
        return undefined
    const keyword = match[1]

    if (!isNaN(Number(keyword)))
        return Number(keyword)
    return Nzh.cn.decodeS(keyword)
}

const videoRegex = new RegExp('(.mp4|.mkv|.flv|.avi|.rmvb|.m4p|.m4v)$');

export const isVideoFile = (f: string) => f.match(videoRegex) != null

export function b64DecodeUnicode(str: string) {
    return decodeURIComponent(Array.prototype.map.call(atob(str), function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
}