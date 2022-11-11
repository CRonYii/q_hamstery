import { ReloadOutlined } from '@ant-design/icons';
import { Button, Col, Radio, Row } from 'antd';
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ITvEpisode, ITvSeason, ITvShow } from '../../../app/entities';
import { datetimeSort, isInThePast } from '../../../app/utils';
import { hamsterySlice } from '../../api/hamsterySlice';
import TMDB from '../../api/TMDB';
import ApiLoading from '../../general/ApiLoading';
import TvEpisodeCard from '../episode/TvEpisodeCard';

const TVSeasonPage: React.FC = () => {
    const params = useParams()
    const season_id = params.season_id as string
    const show_id = params.show_id as string

    return <ApiLoading getters={{
        'show': () => hamsterySlice.useGetTvShowQuery(show_id),
        'season': () => hamsterySlice.useGetTvSeasonQuery(season_id),
        'episodes': () => hamsterySlice.useGetTvEpisodesQuery({ season: season_id })
    }}>
        {
            ({ values }) => {
                const show: ITvShow = values.show.data
                const season: ITvSeason = values.season.data
                const episodes: ITvEpisode[] = values.episodes.data
                return <TVSeasonItems show={show} season={season} episodes={episodes} />
            }
        }
    </ApiLoading>
}

const TVSeasonItems: React.FC<{ show: ITvShow, season: ITvSeason, episodes: ITvEpisode[] }> = ({
    show, season, episodes,
}) => {
    const [scan, { isLoading }] = hamsterySlice.useScanTvShowMutation()
    const [displayFilter, setDisplayFilter] = useState<'all' | 'onair'>('onair')
    useEffect(() => {
        // Check TMDB and see if we needs an rescan
        TMDB.getTVShowSeason(String(show.tmdb_id), season.season_number)
            .then((data) => {
                if (data.episodes.length !== episodes.length) {
                    scan(String(season.show))
                }
            })
    }, [scan, show.tmdb_id, season.season_number, season.show, episodes.length])

    let displayEpisodes = episodes
        .slice()
        .sort((a, b) => datetimeSort(a.air_date, b.air_date))
    if (displayFilter === 'onair') {
        displayEpisodes = displayEpisodes.filter((episode) => isInThePast(episode.air_date))
    }
    return <div>
        <Row gutter={12} style={{ margin: 16 }}>
            <Col>
                <Button onClick={() => scan(String(season.show))} loading={isLoading}>
                    {!isLoading ? <span><ReloadOutlined /> Scan</span> : <span>Scanning</span>}
                </Button>
            </Col>
        </Row>
        <Row gutter={24} style={{ margin: 16 }}>
            <Col>
                <Radio.Group
                    defaultValue='onair'
                    buttonStyle='solid'
                    value={displayFilter}
                    onChange={(e) => setDisplayFilter(e.target.value)}
                >
                    <Radio.Button value='all'>All</Radio.Button>
                    <Radio.Button value='onair'>On Air</Radio.Button>
                </Radio.Group>
            </Col>
        </Row>
        <Row gutter={24} style={{ margin: 16 }} align='top'>
            {displayEpisodes.map((episode) =>
                <Col key={episode.id}>
                    <TvEpisodeCard show={show} season={season} episode={episode} />
                    </Col>)}
        </Row>
    </div>
}

export default TVSeasonPage