import { Badge, Card, Skeleton } from 'antd';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ITvSeason } from '../../../app/entities';
import { useAppSelector } from '../../../app/hook';
import { TMDBPosterSize, toTMDBPosterURL } from '../../../app/utils';
import { responsiveComputeSelector, useResponsiveCardSize } from '../../general/responsiveSlice';
import EpisodeNumberBadge from '../EpisodeNumberBadge';

const { Meta } = Card;

const TvSeasonCard: React.FC<{ season: ITvSeason }> = ({ season }) => {
    const modeCompute = useAppSelector(responsiveComputeSelector)
    const navigate = useNavigate();
    const params = useParams()
    const library_id = params.library_id as string
    const show_id = params.show_id as string
    let title = season.name
    if (season.air_date) {
        title = `${title} (${season.air_date})`
    }

    const poster_path = toTMDBPosterURL(season.poster_path, modeCompute<TMDBPosterSize>({
        'mobile': 'w185',
        'tablet': 'w185',
        'desktop': 'w500',
    }))
    const width = useResponsiveCardSize(modeCompute)

    if (!season) {
        return <Skeleton active />
    }

    return <EpisodeNumberBadge episode_stats={season.number_of_ready_episodes}>
        <Card
            hoverable
            onClick={() => navigate(`/tvshows/${library_id}/${show_id}/${season.id}`)}
            style={{ width }}
            cover={<img alt="Poster" src={poster_path} />}
        >
            <Meta title={title} description={`${season.number_of_episodes} Episode${season.number_of_episodes !== 1 ? 's' : ''}`} />
            {
                season.warn_removed ?
                    <Badge status="error" text="Season/Episode is removed from TMDB" />
                    : null
            }
        </Card >
    </EpisodeNumberBadge>
}

export default TvSeasonCard