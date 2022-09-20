import axios from 'axios';

const TMDB_API_KEYV3 = 'e0c3646a54719a22df8b8e2c3f2e06ed'
const TMDB_APIV3_BASE_URL = 'https://api.themoviedb.org/3'

const TMDB = {
    searchTVShowsByPage: async (query: string, page: number, language = 'ja-JP') => {
        const { data } = await axios.get(`${TMDB_APIV3_BASE_URL}/search/tv`, {
            params: {
                query,
                language,
                page,
                api_key: TMDB_API_KEYV3
            }
        })
        return data
    },
    searchTVShowsAll: async (query: string, language = 'ja-JP') => {
        let { results, total_pages } = await TMDB.searchTVShowsByPage(query, 1, language)
        if (total_pages !== 1) {
            for (let i = 2; i <= total_pages; i++) {
                const subpage = await TMDB.searchTVShowsByPage(query, i, language)
                results.concat(subpage.results)
            }
        }
        return results
    },
    getTVShowDetails: async (id: string, language = 'ja-JP') => {
        const { data } = await axios.get(`${TMDB_APIV3_BASE_URL}/tv/${id}`, {
            params: {
                language,
                api_key: TMDB_API_KEYV3
            }
        })
        return data
    },
    getTVShowSeason: async (id: string, season_number: number, language = 'ja-JP') => {
        const { data } = await axios.get(`${TMDB_APIV3_BASE_URL}/tv/${id}/season/${season_number}`, {
            params: {
                language,
                api_key: TMDB_API_KEYV3
            }
        })
        return data
    },
    toPosterURL: (relativeURL?: string, size: 'w500' | 'w185' = 'w500') => {
        return relativeURL ? `https://image.tmdb.org/t/p/${size}/${relativeURL}` : ''
    },
}

export default TMDB