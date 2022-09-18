export const datetimeSort = (a: string | undefined, b: string | undefined) => {
    const atime = a ? new Date(a).getTime() : 0;
    const btime = b ? new Date(b).getTime() : 0;
    return btime - atime;
}

export const toTMDBPosterURL = (relativeURL?: string, size: 'w500' | 'w185' = 'w500') => {
    return relativeURL ? `https://image.tmdb.org/t/p/${size}/${relativeURL}` : ''
}