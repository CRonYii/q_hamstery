import { DeleteTwoTone, EditOutlined, ImportOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Col, List, Modal, notification, Popconfirm, Radio, Row, Tabs, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { IIndexer, IShowSubscription, ITvDownload, ITvEpisode, ITvSeason, ITvShow } from '../../../app/entities';
import { useAppDispatch, useAppSelector } from '../../../app/hook';
import { datetimeSort, isInThePast } from '../../../app/utils';
import { hamsterySlice } from '../../api/hamsterySlice';
import TMDB from '../../api/TMDB';
import ApiLoading from '../../general/ApiLoading';
import TvEpisodeCard from '../episode/TvEpisodeCard';
import { seasonActions, seasonSelector } from './seasonSlice';
import SubscriptionForm from './SubscriptionForm';

const { Text } = Typography;

const TVSeasonPage: React.FC = () => {
    const params = useParams()
    const season_id = params.season_id as string
    const show_id = params.show_id as string

    return <Tabs
        defaultActiveKey='episodes'
        centered
        items={[
            {
                key: 'episodes',
                label: 'Episodes',
                children: <ApiLoading getters={{
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
            },
            {
                key: 'subscriptions',
                label: 'Subscriptions',
                children: <ApiLoading getters={{
                    'subs': () => hamsterySlice.useGetShowSubscriptionsQuery({ season: season_id }),
                }}>
                    {
                        ({ values }) => {
                            const subs: IShowSubscription[] = values.subs.data
                            return <TVSeasonSubscriptions season_id={season_id} subs={subs} />
                        }
                    }
                </ApiLoading>
            },
        ]} />
}

const TVSeasonItems: React.FC<{ show: ITvShow, season: ITvSeason, episodes: ITvEpisode[] }> = ({
    show, season, episodes,
}) => {
    const dispatch = useAppDispatch()
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
        .sort((a, b) => datetimeSort(a.air_date, b.air_date))
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

const TVSeasonSubscriptions: React.FC<{ season_id: string, subs: IShowSubscription[] }> = ({ season_id, subs }) => {
    const dispatch = useAppDispatch()
    const season = useAppSelector(seasonSelector)
    let priority = 0
    if (subs.length > 0) {
        priority = subs[subs.length - 1].priority + 1
    }

    return <div>
        <Modal
            title={season.sub_editId ? "Update Torznab Indexer" : "Add new Torznab Indexer"}
            style={{ minWidth: '60vw' }}
            open={season.sub_open}
            onCancel={() => dispatch(seasonActions.closeSubscription())}
            footer={null}
        >
            <SubscriptionForm
                id='season-subscriber'
                editId={season.sub_editId}
                onFinish={async (task) => {
                    try {
                        await task
                        dispatch(seasonActions.closeSubscription())
                    } catch {
                        notification.error({ message: 'Failed to save subscription' })
                    }
                }}
                season_id={season_id}
                priority={priority}
            />
        </Modal>
        <Row gutter={12} style={{ margin: 16 }}>
            <Col>
                <Button type='primary' onClick={() => dispatch(seasonActions.addSubscription())}>
                    <PlusOutlined />Add
                </Button>
            </Col>
        </Row>
        <List
            itemLayout='horizontal'
            bordered
            dataSource={subs}
            renderItem={sub => (<TVSeasonSubscriptionListItem sub={sub} />)}
        /></div>
}

const TVSeasonSubscriptionListItem: React.FC<{ sub: IShowSubscription }> = ({ sub }) => {
    const dispatch = useAppDispatch()
    const [scanShowSubscription, { isLoading: scanIsLoading }] = hamsterySlice.useScanShowSubscriptionMutation()
    const [removeShowSubscription, { isLoading: isRemoveLoading }] = hamsterySlice.useRemoveShowSubscriptionMutation()

    return <ApiLoading getters={{
        'indexer': () => hamsterySlice.useGetIndexerQuery(String(sub.indexer)),
        'downloads': () => hamsterySlice.useGetMonitoredTvDownloadsQuery({ subscription: sub.id }),
    }}>
        {({ values }) => {
            const indexer: IIndexer = values.indexer.data
            const downloads: ITvDownload[] = values.downloads.data
            return <List.Item
                actions={[
                    <Button
                        key='scan' icon={<ReloadOutlined />}
                        onClick={() => scanShowSubscription(String(sub.id))}
                        loading={scanIsLoading}
                    />,
                    <Button
                        key='edit' icon={<EditOutlined />}
                        onClick={() => dispatch(seasonActions.editSubscription(String(sub.id)))}
                    />,
                    <Popconfirm
                        key='delete'
                        placement='topLeft'
                        title='Are you sure you want to delete this subscription?'
                        onConfirm={async () => {
                            if (!isRemoveLoading) {
                                try {
                                    await removeShowSubscription(String(sub.id)).unwrap()
                                } catch {
                                    notification.error({ message: 'Failed to remove Show Subscription' })
                                }
                            }
                        }}
                    >
                        <Button danger icon={<DeleteTwoTone key="delete" twoToneColor="#eb2f96" />} />
                    </Popconfirm>,
                ]}
            >
                <List.Item.Meta
                    title={indexer.name}
                    description={<span>
                        Query: {<Text code>{sub.query}</Text>}
                        {sub.exclude ? <span>Exclude: <Text code>{sub.exclude || 'N/A'}</Text></span> : null}
                        {sub.offset ? <span>Offset: <Text code>{sub.offset || 'N/A'}</Text></span> : null}
                    </span>}
                />
                <div>{downloads.filter(i => i.done).length} / {downloads.length} Episodes</div>
            </List.Item>
        }}
    </ApiLoading>
}

export default TVSeasonPage