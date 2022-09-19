import { Alert, Col, Row, Skeleton } from 'antd';
import React from 'react';
import { useParams } from 'react-router-dom';
import { hamsterySlice } from '../api/hamsterySlice';
import TvSeasonCard from './TvSeasonCard';

const TvShowPage: React.FC = () => {
    const params = useParams()
    const show_id = params.show_id as string
    const {
        data: show,
        isLoading,
        isError,
    } = hamsterySlice.useGetTvShowQuery(show_id)

    if (isLoading) {
        return <Skeleton active />
    } else if (isError || !show) {
        return <Alert
            message="Error"
            description="Failed to load TV Show"
            type="error"
            showIcon
        />
    }

    return <div>
        <Row gutter={24} style={{ margin: 16 }} align='bottom'>
            {
                show.seasons.map((season) => {
                    return <Col key={season.id}>
                        <TvSeasonCard season={season} />
                    </Col>;
                })
            }
        </Row>
    </div>;
}

export default TvShowPage