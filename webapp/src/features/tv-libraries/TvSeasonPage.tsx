import { Col, Row, Skeleton } from 'antd';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hook';
import TvEpisodeCard from './TvEpisodeCard';
import { fetchTvShow, tvSeasonsSelectors, tvShowsSelectors } from './tvshowsSlice';

export function TVSeasonPage() {
    const params = useParams()
    const show_id = params.show_id as string
    const season_id = params.season_id as string
    const dispatch = useAppDispatch()

    useEffect(() => {
        dispatch(fetchTvShow(show_id))
    }, [dispatch, show_id]);

    const show = useAppSelector(state => tvShowsSelectors.selectById(state, show_id))
    const season = useAppSelector(state => tvSeasonsSelectors.selectById(state, season_id))

    if (!show || !season)
        return <Skeleton active />

    return <div>
        <Row gutter={24} style={{ margin: 16 }} align='bottom'>
            {
                season.episodes.map((episode_id) =>
                    <Col key={episode_id}><TvEpisodeCard id={episode_id} /></Col>
                )
            }
        </Row>
    </div>;
}