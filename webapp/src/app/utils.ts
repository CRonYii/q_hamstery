import hamstery from "../features/api/hamstery";

export const datetimeSort = (a: string | undefined, b: string | undefined) => {
    const atime = a ? new Date(a).getTime() : Number.MAX_SAFE_INTEGER;
    const btime = b ? new Date(b).getTime() : Number.MAX_SAFE_INTEGER;
    return atime - btime;
}

export const getOnAirDate = () => {
    let onAir = new Date();
    onAir.setDate(onAir.getDate() + 1);
    return `${onAir.getFullYear()}-${onAir.getMonth() + 1}-${onAir.getDate()}`
}

export type TMDBPosterSize = 'w500' | 'w185'

export const toTMDBPosterURL = (relativeURL?: string, size: TMDBPosterSize = 'w500') => {
    return relativeURL ? `https://image.tmdb.org/t/p/${size}/${relativeURL}` : ''
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
    } else if (seconds >= 8640000) {
        return '∞'
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

export const getEpNumber = async (title: string) => {
    try {
        const { data } = await hamstery.getEpisodeNumber(title)
        return data.episode_number
    } catch {
        return 0
    }
}

const videoRegex = new RegExp('.*?.(mp4|mkv|flv|avi|rmvb|m4p|m4v|m2ts|ts)$');

export const isVideoFile = (f: string) => f.match(videoRegex) != null

const supplementalRegex = new RegExp('.*?.(ass|ssa|srt|idx|sub|mka|flac)$');

export const isSupplementalFile = (f: string) => f.match(supplementalRegex) != null

export function b64DecodeUnicode(str: string) {
    return decodeURIComponent(Array.prototype.map.call(atob(str), function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
}

export interface TreeMedia<T> {
    path: Record<string, TreeMedia<T>>,
    files: T[],
}

export function filePathsToTree<T>(paths: T[], selector: (entry: T) => string) {
    const tree: TreeMedia<T> = {
        path: {},
        files: [],
    };

    paths.forEach(path => {
        const parts = selector(path).split("/");
        let current = tree;

        parts.forEach((part, index) => {
            if (index === parts.length - 1) {
                current.files.push(path)
            } else {
                if (!current.path[part]) {
                    current.path[part] = {
                        path: {},
                        files: [],
                    };
                }
                current = current.path[part];
            }
        });
    });

    return tree
}

export function treeSelectNode<T>(tree: TreeMedia<T>, labels: string[]): TreeMedia<T> | null {
    let node: TreeMedia<T> = tree
    for (const label of labels) {
        node = node.path[label]
        if (!node)
            break
    }
    return node;
}

interface CascaderOption {
    value: string | number;
    label?: React.ReactNode;
    disabled?: boolean;
    children?: CascaderOption[];
    // Determines if this is a leaf node(effective when `loadData` is specified).
    // `false` will force trade TreeNode as a parent node.
    // Show expand icon even if the current node has no children.
    isLeaf?: boolean;
}

export function treeToCascaderOptions<T>(tree: TreeMedia<T>, selector?: (t: T) => CascaderOption): CascaderOption[] {
    const paths = []
    for (const key in tree.path) {
        const path = tree.path[key]
        paths.push({
            value: key,
            label: key,
            children: treeToCascaderOptions(path, selector)
        })
    }
    let files: CascaderOption[] = []
    if (selector)
        files = tree.files.map(selector);
    return [...paths, ...files]
}

export function getTopDirectory<T>(tree: TreeMedia<T>, selector: (t: TreeMedia<T>) => boolean): TreeMedia<T> | null {
    if (selector(tree))
        return tree
    for (const key in tree.path) {
        const res = getTopDirectory(tree.path[key], selector)
        if (res)
            return res
    }
    return null
}