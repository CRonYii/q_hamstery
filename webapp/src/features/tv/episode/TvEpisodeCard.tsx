import { CheckCircleTwoTone, CloudDownloadOutlined, DeleteTwoTone } from '@ant-design/icons';
import { Card, List, Popconfirm } from 'antd';
import React from 'react';
import { ITvDownload, ITvEpisode, ITvSeason, ITvShow, TvEpisodeStatus } from '../../../app/entities';
import { useAppDispatch } from '../../../app/hook';
import { formatBytes, secondsToDhms, toTMDBPosterURL } from '../../../app/utils';
import { hamsterySlice } from '../../api/hamsterySlice';
import ApiLoading from '../../general/ApiLoading';
import { indexerActions } from '../../indexers/indexerSlice';

const { Meta } = Card;

const TvEpisodeCard: React.FC<{ show: ITvShow, season: ITvSeason, episode: ITvEpisode }> = ({ show, season, episode }) => {
    const dispatch = useAppDispatch()
    const poster_path = toTMDBPosterURL(episode.poster_path, "w500")
    const actions = []
    let description = <div>{episode.name}</div>
    if (episode.air_date) {
        description = <div>{description}{episode.air_date}</div>
    }
    if (episode.status === TvEpisodeStatus.MISSING) {
        actions.push(<CloudDownloadOutlined onClick={() =>
            dispatch(indexerActions.download({ season, query: show.name }))}
        />)
        // TODO: actions.push(<ImportOutlined onClick={() => { }} />)
    } else if (episode.status === TvEpisodeStatus.READY) {
        actions.push(<CheckCircleTwoTone twoToneColor="#52c41a" />)
    }

    return <Card
        hoverable
        style={{ width: 400 }}
        cover={<img alt="Poster" src={poster_path} />}
        actions={actions}
    >
        <Meta title={`EP ${episode.episode_number}`} description={description} />
        <br />
        <TvDownloadInfo episode_id={String(episode.id)} />
    </Card >
}

export const TvDownloadInfo: React.FC<{ episode_id: string }> = ({ episode_id }) => {
    const dispatch = useAppDispatch()
    const [remove] = hamsterySlice.useRemoveTvDownloadMutation()

    const renderDownloadItem = (download: ITvDownload) => {
        const deleteButton = <Popconfirm title={"The download will be cancelled!"} onConfirm={() => remove(download.hash)}>
            <DeleteTwoTone twoToneColor="#eb2f96" />
        </Popconfirm>
        if (download.done) {
            return <List.Item>
                <List.Item.Meta
                    title={download.filename}
                    description={<span>
                        <b>Size: </b>{formatBytes(download.size)} |
                        <b> Uploaded: </b>{formatBytes(download.uploaded)} |
                        <b> Upspeed↑: </b>{formatBytes(download.upspeed)}/s
                    </span>}
                />
                <CheckCircleTwoTone twoToneColor="#52c41a" />
            </List.Item>
        } else if (download.filename.length === 0) {
            return <List.Item>
                <List.Item.Meta
                    title='Preparing...'
                />
                <span>
                    {(100 * download.progress).toFixed(2)}%
                    {deleteButton}
                </span>
            </List.Item>
        } else {
            return <List.Item>
                <List.Item.Meta
                    title={download.filename}
                    description={<span>
                        <b>Size: </b>{formatBytes(download.size)} |
                        <b> Downloaded: </b>{formatBytes(download.completed)} |
                        <b> Dlspeed↓: </b>{formatBytes(download.dlspeed)}/s |
                        <b> ETA: </b>{secondsToDhms(download.eta)}
                    </span>}
                />
                <span>
                    {(100 * download.progress).toFixed(2)}%
                    {deleteButton}
                </span>
            </List.Item>
        }
    }

    return <ApiLoading getters={{
        'episode': () => hamsterySlice.useGetTvEpisodeQuery(episode_id),
        'downloads': () => hamsterySlice.useGetTvDownloadsQuery({ episode: episode_id }, { pollingInterval: 1000 })
    }}>
        {
            ({ values }) => {
                const episode: ITvEpisode = values.episode.data
                const downloads: ITvDownload[] = values.downloads.data

                if (downloads.length === 0) {
                    return <div />
                }

                if (episode.status === TvEpisodeStatus.MISSING && downloads.some((d) => d.done)) {
                    dispatch(hamsterySlice.util.invalidateTags([{ type: 'tvepisode', id: episode.id }]))
                }

                return <List
                    bordered
                    dataSource={downloads}
                    renderItem={renderDownloadItem}
                />
            }
        }
    </ApiLoading>
}

export default TvEpisodeCard