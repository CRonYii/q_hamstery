export const datetimeSort = (a: string | undefined, b: string | undefined) => {
    const atime = a ? new Date(a).getTime() : 0;
    const btime = b ? new Date(b).getTime() : 0;
    return btime - atime;
}