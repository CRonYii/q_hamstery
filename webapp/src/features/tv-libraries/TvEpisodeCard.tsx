import { Card, Skeleton } from 'antd';
import React from 'react';
import { useAppSelector } from '../../app/hook';
import { toTMDBPosterURL } from '../../app/utils';
import { tvEpisodesSelectors } from './tvshowsSlice';

const { Meta } = Card;

const TvEpisodeCard: React.FC<{ id: string }> = ({ id }) => {
    const episode = useAppSelector(state => tvEpisodesSelectors.selectById(state, id));

    if (!episode) {
        return <Skeleton />
    }

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