import { Badge, Card } from 'antd';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ITvShow } from '../../../app/entities';
import { useAppSelector } from '../../../app/hook';
import { TMDBPosterSize, toTMDBPosterURL } from '../../../app/utils';
import { responsiveComputeSelector, useResponsiveCardSize } from '../../general/responsiveSlice';
import EpisodeNumberBadge from '../EpisodeNumberBadge';

const { Meta } = Card;

const TVShowCard: React.FC<{ show: ITvShow }> = ({ show }) => {
    const modeCompute = useAppSelector(responsiveComputeSelector)
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
    const poster_path = toTMDBPosterURL(show.poster_path, modeCompute<TMDBPosterSize>({
        'mobile': 'w185',
        'tablet': 'w185',
        'desktop': 'w500',
    }))
    const width = useResponsiveCardSize(modeCompute)
    return <EpisodeNumberBadge episode_stats={show.number_of_ready_episodes}>
        <Card
            hoverable
            onClick={() => navigate(`/tvshows/${library_id}/${show.id}`)}
            style={{ width }}
            cover={<img alt="Poster" src={poster_path} />}
        >
            <Meta title={show.name} description={description} />
            {
                show.warn_removed ?
                    <Badge status="error" text="Season/Episode is removed from TMDB" />
                    : null
            }
        </Card >
    </EpisodeNumberBadge>
}

export default TVShowCard