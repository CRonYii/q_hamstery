import React from 'react';

import { Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { tvShowsSelectors } from './tvshowsSlice';
import { useAppSelector } from '../../app/hook';
import { TvShow } from '../../app/entities';
import { toTMDBPosterURL } from '../../app/utils';

const { Meta } = Card;

const TVShowCard: React.FC<{ library_id: string, id: string }> = ({ library_id, id }) => {
    const navigate = useNavigate();
    const show: TvShow = useAppSelector(state => tvShowsSelectors.selectById(state, id)) || {
        id: 0, name: 'Failed to load...', number_of_episodes: 0, number_of_seasons: 0, tmdb_id: 0, seasons: []
    }
    const description = show.number_of_seasons === 1 ?
        `${show.number_of_episodes} episodes` :
        `${show.number_of_seasons} seasons`
    const poster_path = toTMDBPosterURL(show.poster_path)
    return <Card
        hoverable
        onClick={() => navigate(`/tvshows/${library_id}/${show.id}`)}
        style={{ width: 185 }}
        cover={<img alt="Poster" src={poster_path} />}
    >
        <Meta title={show.name} description={description} />
    </Card >;
}

export default TVShowCard