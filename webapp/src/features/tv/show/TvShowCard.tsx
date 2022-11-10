import React from 'react';

import { Card } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { ITvShow } from '../../../app/entities';
import { toTMDBPosterURL } from '../../../app/utils';

const { Meta } = Card;

const TVShowCard: React.FC<{ show: ITvShow }> = ({ show }) => {
    const navigate = useNavigate();
    const params = useParams()
    const library_id = params.library_id as string

    let description = <span>{
        show.number_of_seasons === 1 ?
            `${show.number_of_episodes} episodes` :
            `${show.number_of_seasons} seasons`
    }</span>
    if (show.air_date) {
        description = <div>{description}<br />{show.air_date}</div>
    }
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