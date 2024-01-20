import { HeartTwoTone, ImportOutlined, LinkOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Col, Pagination, Radio, Row } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ITvDownload, ITvEpisode, ITvSeason, ITvShow } from '../../../app/entities';
import { useAppDispatch } from '../../../app/hook';
import { getOnAirDate } from '../../../app/utils';
import TMDB from '../../api/TMDB';
import { IPageNumberResult, hamsterySlice } from '../../api/hamsterySlice';
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
    }}>
        {
            ({ values }) => {
                const show: ITvShow = values.show.data
                const season: ITvSeason = values.season.data

                return <>
                    <TVSeasonComponent show={show} season={season} />
                </>
            }
        }
    </ApiLoading>
}

export default TVSeasonPage

const TVSeasonComponent: React.FC<{ show: ITvShow, season: ITvSeason }> = ({
    show, season,
}) => {
    const [searchParams, setSearchParams] = useSearchParams()
    const [pageSize, setPageSize] = useState(25)
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const [scan, { isLoading }] = hamsterySlice.useScanTvSeasonMutation()
    const [displayFilter, setDisplayFilter] = useState<'all' | 'onair'>('onair')

    const goToPage = (page: number) => {
        const new_params = new URLSearchParams(searchParams)
        new_params.set('page', String(page))
        setSearchParams(new_params)
    }

    const currentPage = searchParams.get('page') || '1';
    const onAir = displayFilter === 'onair' ? getOnAirDate() : undefined;

    useEffect(() => {
        // Check TMDB and see if we needs an rescan
        TMDB.getTVShowSeason(String(show.tmdb_id), season.season_number)
            .then((data) => {
                if (data.episodes.length !== season.number_of_episodes) {
                    scan(String(season.id))
                }
            })
    }, [scan, show.tmdb_id, season])
    return <ApiLoading getters={{
        'episodes': () => hamsterySlice.useGetTvEpisodesPageQuery({
            season: season.id, ordering: 'episode_number',
            page: currentPage, page_size: pageSize,
            on_air: onAir,
        }),
    }}>
        {
            ({ values }) => {
                const episodes_page: IPageNumberResult<ITvEpisode> = values.episodes.data
                const episodes: ITvEpisode[] = episodes_page.results
                const paginator = <Row>
                    <Pagination
                        responsive
                        showQuickJumper
                        showSizeChanger
                        current={episodes_page.page} total={episodes_page.count}
                        onChange={(page) => {
                            goToPage(page)
                            window.scrollTo(0, 0)
                        }}
                        pageSize={pageSize}
                        pageSizeOptions={['10', '25', '50', '100']}
                        onShowSizeChange={(current, size) => {
                            setPageSize(size)
                        }}
                    />
                </Row>

                return <>
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
                                onChange={(e) => {
                                    goToPage(1)
                                    setDisplayFilter(e.target.value)
                                }}
                            >
                                <Radio.Button value='all'>All</Radio.Button>
                                <Radio.Button value='onair'>On Air</Radio.Button>
                            </Radio.Group>
                        </Col>
                    </Row>
                    {paginator}
                    <TVSeasonItems show={show} season={season} episodes={episodes} />
                    {paginator}
                </>
            }
        }
    </ApiLoading>
}

const TVSeasonItems: React.FC<{ show: ITvShow, season: ITvSeason, episodes: ITvEpisode[] }> = ({
    show, season, episodes,
}) => {
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

                return <>
                    <Row gutter={24} style={{ margin: 16 }} align='top'>
                        {episodes.map((episode) =>
                            <Col key={episode.id} style={{ marginBottom: 12 }}>
                                <TvEpisodeCard show={show} season={season} episode={episode} downloads={downloadsMap.get(episode.id) || []} />
                            </Col>)}
                    </Row>
                </>
            }
        }
    </ApiLoading>
}
