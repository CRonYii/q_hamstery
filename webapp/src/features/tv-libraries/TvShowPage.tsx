import { Col, Row, Skeleton } from 'antd';
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hook';
import TvSeasonCard from './TvSeasonCard';
import { fetchTvShow, tvShowsSelectors } from './tvshowsSlice';

const TvShowPage: React.FC = () => {
    const params = useParams()
    const show_id = params.show_id as string
    const dispatch = useAppDispatch()
    const show = useAppSelector(state => tvShowsSelectors.selectById(state, show_id));
    useEffect(() => {
        dispatch(fetchTvShow(show_id))
    }, [dispatch, show_id]);

    if (!show || !show.seasons) {
        return <Skeleton />
    }

    return <div>
        <Row gutter={24} style={{ margin: 16 }} align='bottom'>
            {
                show.seasons.map((season) => {
                    return <Col key={season}>
                        <TvSeasonCard id={season} />
                    </Col>;
                })
            }
        </Row>
    </div>;
}

export default TvShowPage