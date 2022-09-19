import { Alert, Col, Row, Skeleton } from 'antd';
import { useParams } from 'react-router-dom';
import { hamsterySlice } from '../api/hamsterySlice';
import TvEpisodeCard from './TvEpisodeCard';

export function TVSeasonPage() {
    const params = useParams()
    const season_id = params.season_id as string
    const {
        data: season,
        isLoading,
        isError,
    } = hamsterySlice.useGetTvSeasonQuery(season_id)

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
            {
                season.episodes.map((episode) =>
                    <Col key={episode.id}><TvEpisodeCard episode={episode} /></Col>
                )
            }
        </Row>
    </div>;
}