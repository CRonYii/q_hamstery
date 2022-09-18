import { Col, Row, Skeleton } from 'antd';
import { useParams } from 'react-router-dom';
import { useAppSelector } from '../../app/hook';
import TvEpisodeCard from './TvEpisodeCard';
import { tvSeasonsSelectors, tvShowsSelectors } from './tvshowsSlice';

export function TVSeasonPage() {
    const params = useParams()
    const show_id = params.show_id as string
    const season_id = params.season_id as string

    const show = useAppSelector(state => tvShowsSelectors.selectById(state, show_id))
    const season = useAppSelector(state => tvSeasonsSelectors.selectById(state, season_id))

    if (!show || !season)
        return <Skeleton active />

    console.log(show, season);


    return <div>
        <Row gutter={24} style={{ margin: 16 }} align='bottom'>
            {
                season.episodes.map((episode_id) =>
                    <Col key={episode_id}><TvEpisodeCard id={episode_id} /></Col>
                )
            }
        </Row>
    </div >;
}