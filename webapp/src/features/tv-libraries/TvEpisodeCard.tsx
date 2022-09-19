import { Card } from 'antd';
import React from 'react';
import { ITvEpisode } from '../../app/entities';
import { toTMDBPosterURL } from '../../app/utils';

const { Meta } = Card;

const TvEpisodeCard: React.FC<{ episode: ITvEpisode }> = ({ episode }) => {
    const poster_path = toTMDBPosterURL(episode.poster_path, "w185")
    return <Card
        hoverable
        style={{ width: 185 }}
        cover={< img alt="Poster" src={poster_path} />}

    >
        <Meta title={`EP ${episode.episode_number}`} description={`${episode.name} (${episode.air_date})`} />
    </Card >
}

export default TvEpisodeCard