import { Card, Skeleton } from 'antd';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ITvSeason } from '../../../app/entities';
import { toTMDBPosterURL } from '../../../app/utils';
import EpisodeNumberBadge from '../EpisodeNumberBadge';

const { Meta } = Card;

const TvSeasonCard: React.FC<{ season: ITvSeason }> = ({ season }) => {
    const navigate = useNavigate();
    const params = useParams()
    const library_id = params.library_id as string
    const show_id = params.show_id as string
    let title = season.name
    if (season.air_date) {
        title = `${title} (${season.air_date})`
    }

    if (!season) {
        return <Skeleton active />
    }

    const poster_path = toTMDBPosterURL(season.poster_path)
    return <EpisodeNumberBadge episode_stats={season.number_of_ready_episodes}>
        <Card
            hoverable
            onClick={() => navigate(`/tvshows/${library_id}/${show_id}/${season.id}`)}
            style={{ width: 300 }}
            cover={<img alt="Poster" src={poster_path} />}
        >
            <Meta title={title} description={`${season.number_of_episodes} Episode${season.number_of_episodes !== 1 ? 's' : ''}`} />
        </Card >
    </EpisodeNumberBadge>
}

export default TvSeasonCard