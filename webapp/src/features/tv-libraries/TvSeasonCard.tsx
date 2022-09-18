import { Card, Skeleton } from 'antd';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppSelector } from '../../app/hook';
import { toTMDBPosterURL } from '../../app/utils';
import { tvSeasonsSelectors } from './tvshowsSlice';

const { Meta } = Card;

const TvSeasonCard: React.FC<{ id: string }> = ({ id }) => {
    const navigate = useNavigate();
    const params = useParams()
    const library_id = params.library_id as string
    const show_id = params.show_id as string
    const season = useAppSelector(state => tvSeasonsSelectors.selectById(state, id));

    if (!season) {
        return <Skeleton active />
    }

    const poster_path = toTMDBPosterURL(season.poster_path)
    return <Card
        hoverable
        onClick={() => navigate(`/tvshows/${library_id}/${show_id}/${season.id}`)}
        style={{ width: 300 }}
        cover={<img alt="Poster" src={poster_path} />}
    >
        <Meta title={`${season.name} (${season.air_date})`} description={`${season.number_of_episodes} Episode${season.number_of_episodes !== 1 ? 's' : ''}`} />
    </Card >
}

export default TvSeasonCard