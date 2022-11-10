import { Col, Radio, Row } from 'antd';
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ITvSeason } from '../../../app/entities';
import { datetimeSort, isInThePast } from '../../../app/utils';
import { hamsterySlice } from '../../api/hamsterySlice';
import ApiLoading from '../../general/ApiLoading';
import TvEpisodeCard from '../episode/TvEpisodeCard';

const TVSeasonPage: React.FC = () => {
    const params = useParams()
    const season_id = params.season_id as string
    const [displayFilter, setDisplayFilter] = useState<'all' | 'onair'>('onair')

    return <ApiLoading getters={{ 'season': () => hamsterySlice.useGetTvSeasonQuery(season_id) }}>
        {
            ({ values }) => {
                const season: ITvSeason = values.season.data
                let episodes = season.episodes
                    .slice()
                    .sort((a, b) => datetimeSort(a.air_date, b.air_date))
                if (displayFilter === 'onair') {
                    episodes = episodes.filter((episode) => isInThePast(episode.air_date))
                }
                return <div>
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
                        {episodes.map((episode) =>
                            <Col key={episode.id}><TvEpisodeCard episode={episode} /></Col>)}
                    </Row>
                </div>
            }
        }
    </ApiLoading>
}

export default TVSeasonPage