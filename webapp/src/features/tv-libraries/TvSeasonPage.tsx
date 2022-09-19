import { Alert, Col, Radio, Row, Skeleton } from 'antd';
import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { datetimeSort, isInThePast } from '../../app/utils';
import { hamsterySlice } from '../api/hamsterySlice';
import TvEpisodeCard from './TvEpisodeCard';

const TVSeasonPage: React.FC = () => {
    const params = useParams()
    const season_id = params.season_id as string
    const {
        data: season,
        isLoading,
        isError,
    } = hamsterySlice.useGetTvSeasonQuery(season_id)
    const [displayFilter, setDisplayFilter] = useState<'all' | 'onair'>('onair')

    let episodes = useMemo(() => {
        if (!season)
            return []
        let episodes = season.episodes
            .slice()
            .sort((a, b) => datetimeSort(a.air_date, b.air_date))


        return episodes
    }, [season])
    if (displayFilter === 'onair') {
        episodes = episodes.filter((episode) => isInThePast(episode.air_date))
    }

    if (isLoading)
        return <Skeleton active />
    else if (isError || !season) {
        return <Alert
            message="Error"
            description="Failed to load TV Season"
            type="error"
            showIcon
        />
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
    </div>;
}

export default TVSeasonPage