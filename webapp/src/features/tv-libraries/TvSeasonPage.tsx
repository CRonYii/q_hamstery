import React, { useMemo } from 'react'
import { Alert, Col, Row, Skeleton } from 'antd';
import { useParams } from 'react-router-dom';
import { hamsterySlice } from '../api/hamsterySlice';
import TvEpisodeCard from './TvEpisodeCard';
import { datetimeSort } from '../../app/utils';

const TVSeasonPage: React.FC = () => {
    const params = useParams()
    const season_id = params.season_id as string
    const {
        data: season,
        isLoading,
        isError,
    } = hamsterySlice.useGetTvSeasonQuery(season_id)

    const episode_cards = useMemo(() => {
        if (!season)
            return []
        return season.episodes
            .slice()
            .sort((a, b) => datetimeSort(a.air_date, b.air_date))
            .map((episode) =>
                <Col key={episode.id}><TvEpisodeCard episode={episode} /></Col>)
    }, [season])

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
        <Row gutter={24} style={{ margin: 16 }} align='bottom'>
            {episode_cards}
        </Row>
    </div>;
}

export default TVSeasonPage