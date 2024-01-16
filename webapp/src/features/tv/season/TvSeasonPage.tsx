import { HeartTwoTone, ImportOutlined, LinkOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Col, Radio, Row } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ITvDownload, ITvEpisode, ITvSeason, ITvShow } from '../../../app/entities';
import { useAppDispatch } from '../../../app/hook';
import { isInThePast } from '../../../app/utils';
import TMDB from '../../api/TMDB';
import { hamsterySlice } from '../../api/hamsterySlice';
import ApiLoading from '../../general/ApiLoading';
import TvEpisodeCard from '../episode/TvEpisodeCard';
import { seasonActions } from './seasonSlice';

const TVSeasonPage: React.FC = () => {
    const params = useParams()
    const season_id = params.season_id as string
    const show_id = params.show_id as string

    return <ApiLoading getters={{
        'show': () => hamsterySlice.useGetTvShowQuery(show_id),
        'season': () => hamsterySlice.useGetTvSeasonQuery(season_id),
        'episodes': () => hamsterySlice.useGetTvEpisodesQuery({ season: season_id }),
    }}>
        {
            ({ values }) => {
                const show: ITvShow = values.show.data
                const season: ITvSeason = values.season.data
                const episodes: ITvEpisode[] = values.episodes.data
                return <TVSeasonItems show={show} season={season} episodes={episodes} />
            }
        }
    </ApiLoading>
}

export default TVSeasonPage

const TVSeasonItems: React.FC<{ show: ITvShow, season: ITvSeason, episodes: ITvEpisode[] }> = ({
    show, season, episodes,
}) => {
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const [scan, { isLoading }] = hamsterySlice.useScanTvSeasonMutation()
    const [displayFilter, setDisplayFilter] = useState<'all' | 'onair'>('onair')
    useEffect(() => {
        // Check TMDB and see if we needs an rescan
        TMDB.getTVShowSeason(String(show.tmdb_id), season.season_number)
            .then((data) => {
                if (data.episodes.length !== episodes.length) {
                    scan(String(season.id))
                }
            })
    }, [scan, show.tmdb_id, season.season_number, season.id, episodes.length])

    let displayEpisodes = episodes
        .slice()
        .sort((a, b) => (a.episode_number - b.episode_number))
    if (displayFilter === 'onair') {
        displayEpisodes = displayEpisodes.filter((episode) => isInThePast(episode.air_date))
    }
    return <ApiLoading getters={{
        'downloads': () => hamsterySlice.useGetTvDownloadsQuery({
            episode__in: episodes.map(e => e.id).join(',')
        }, {
            pollingInterval: 1000
        }),
    }}>
        {
            ({ values }) => {
                const downloads: ITvDownload[] = values.downloads.data
                const downloadsMap = new Map<number, ITvDownload[]>()
                downloads.forEach((download) => {
                    if (!downloadsMap.has(download.episode)) {
                        downloadsMap.set(download.episode, [download])
                    } else {
                        downloadsMap.get(download.episode)?.push(download)
                    }
                })

                return <div>
                    <Row gutter={12} style={{ margin: 16 }}>
                        <Col>
                            <Button onClick={() => scan(String(season.id))} loading={isLoading}>
                                {!isLoading ? <span><ReloadOutlined /> Scan</span> : <span>Scanning</span>}
                            </Button>
                        </Col>
                        <Col>
                            <Button onClick={() => dispatch(seasonActions.import({ season }))}>
                                <ImportOutlined />Import
                            </Button>
                        </Col>
                        <Col>
                            <Button onClick={() => navigate('./subscription')}>
                                <HeartTwoTone twoToneColor="#eb2f96" />Subscribe
                            </Button>
                        </Col>
                        <Col>
                            <Button disabled={season.warn_removed}><a
                                href={'https://www.themoviedb.org/tv/' + show.tmdb_id + '/season/' + season.season_number}
                                target='_blank'
                                rel='noreferrer'
                            ><LinkOutlined />View on TMDB</a></Button>
                        </Col>
                    </Row>
                    <Row gutter={24} style={{ margin: 16 }}>
                        <Col>
                            <Radio.Group
                                defaultValue='onair'
                                buttonStyle='solid'
                                value={displayFilter}
                                onChange={(e) => setDisplayFilter(e.target.value)}
                            >
                                <Radio.Button value='all'>All</Radio.Button>
                                <Radio.Button value='onair'>On Air</Radio.Button>
                            </Radio.Group>
                        </Col>
                    </Row>
                    <Row gutter={24} style={{ margin: 16 }} align='top'>
                        {displayEpisodes.map((episode) =>
                            <Col key={episode.id} style={{ marginBottom: 12 }}>
                                <TvEpisodeCard show={show} season={season} episode={episode} downloads={downloadsMap.get(episode.id) || []} />
                            </Col>)}
                    </Row>
                </div>
            }
        }
    </ApiLoading>
}
