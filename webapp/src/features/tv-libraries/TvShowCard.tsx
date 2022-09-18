import React from 'react';

import { Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { tvShowsSelectors } from './tvshowsSlice';
import { useAppSelector } from '../../app/hook';
import { TvShow } from '../../app/entities';

const { Meta } = Card;

export const TVShowCard: React.FC<{ id: string }> = ({ id }) => {
    const navigate = useNavigate();
    const show: TvShow = useAppSelector(state => tvShowsSelectors.selectById(state, id)) || {
        id: 0, name: 'Failed to load...', number_of_episodes: 0, number_of_seasons: 0, tmdb_id: 0,
    }
    const description = show.number_of_seasons === 1 ?
        `${show.number_of_episodes} episodes` :
        `${show.number_of_seasons} seasons`
    const poster_path = show.poster_path ? 'https://image.tmdb.org/t/p/w500/' + show.poster_path : ''
    return <Card
        hoverable
        onClick={() => navigate(`/tvshows/show/${show.id}`)}
        style={{ width: 185 }}
        cover={<img alt="Poster" src={poster_path} />}
    >
        <Meta title={show.name} description={description} />
    </Card >;
}