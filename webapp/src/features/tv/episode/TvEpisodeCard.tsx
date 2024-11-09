import { CheckCircleTwoTone, CloudDownloadOutlined, DeleteTwoTone } from '@ant-design/icons';
import { Badge, Card, List, Popconfirm, Row, Tooltip, notification } from 'antd';
import React from 'react';
import { ITvDownload, ITvEpisode, ITvSeason, ITvShow, TvEpisodeStatus } from '../../../app/entities';
import { useAppDispatch, useAppSelector } from '../../../app/hook';
import { TMDBPosterSize, formatBytes, secondsToDhms, toTMDBPosterURL } from '../../../app/utils';
import { hamsterySlice } from '../../api/hamsterySlice';
import { responsiveComputeSelector, useResponsiveCardSize } from '../../general/responsiveSlice';
import { indexerActions } from '../../indexers/indexerSlice';

const { Meta } = Card;

const DownloadName: React.FC<{
    title: string,
    length: number
}> = ({ title, length }) => {
    let showTitle
    if (length !== 0 && title.length > length)
        showTitle = title.substring(0, length) + '...'
    else
        showTitle = title
    return <Tooltip title={title}>{showTitle}</Tooltip>
}

const TvEpisodeCard: React.FC<{ show: ITvShow, season: ITvSeason, episode: ITvEpisode, downloads: ITvDownload[] }> = ({ show, season, episode, downloads }) => {
    const dispatch = useAppDispatch()
    const modeCompute = useAppSelector(responsiveComputeSelector)
    const actions = []
    const [removeTvEpisode] = hamsterySlice.useRemoveTvEpisodeMutation()

    const poster_path = toTMDBPosterURL(episode.poster_path, modeCompute<TMDBPosterSize>({
        'mobile': 'w185',
        'tablet': 'w185',
        'desktop': 'w500',
    }))
    const width = useResponsiveCardSize(modeCompute)

    let description = <div>{episode.name}</div>
    if (episode.air_date) {
        description = <div>{description}{episode.air_date}</div>
    }
    if (episode.status === TvEpisodeStatus.MISSING) {
        actions.push(<CloudDownloadOutlined onClick={() =>
            dispatch(indexerActions.download({ season, query: show.name }))}
        />)
    } else if (episode.status === TvEpisodeStatus.READY) {
        actions.push(<CheckCircleTwoTone twoToneColor="#52c41a" />)
        actions.push(<Popconfirm title='Are you sure you want to delete this episode from the file system?'
            onConfirm={async () => {
                try {
                    await removeTvEpisode(String(episode.id)).unwrap()
                } catch {
                    notification.error({ message: 'Failed to delete TV Episode' })
                }
            }}>
            <DeleteTwoTone key="delete" twoToneColor="#eb2f96" />
        </Popconfirm>)
    }

    return <Card
        hoverable
        style={{ width }}
        cover={<img alt="Poster" src={poster_path} />}
        actions={actions}
    >
        <Meta title={`EP ${episode.episode_number}`} description={description} />
        {
            episode.warn_removed ?
                <Badge status="error" text="Episode is removed from TMDB" />
                : null
        }
        <br />
        <TvDownloadInfo episode={episode} downloads={downloads} />
    </Card >
}

export const TvDownloadInfo: React.FC<{ episode: ITvEpisode, downloads: ITvDownload[] }> = ({ episode, downloads }) => {
    const dispatch = useAppDispatch()
    const modeCompute = useAppSelector(responsiveComputeSelector)
    const [remove] = hamsterySlice.useRemoveTvDownloadMutation()
    const downloadNameLength = modeCompute<number>({
        'mobile': 10,
        'tablet': 20,
        'desktop': 80,
    }) || 0

    const renderDownloadItem = (download: ITvDownload) => {
        const deleteButton = <Popconfirm title={"This download will be deleted!"}
            onConfirm={() => {
                remove(download.hash)
                dispatch(hamsterySlice.util.invalidateTags([{ type: 'tvepisode', id: episode.id }]))
            }}>
            <DeleteTwoTone twoToneColor="#eb2f96" />
        </Popconfirm>
        if (!download.extra_info) {
            return <List.Item>
                <List.Item.Meta
                    title='Info not found...'
                />
                {deleteButton}
            </List.Item>
        }
        const { extra_info } = download
        if (download.done) {
            return <List.Item>
                <List.Item.Meta
                    title={<DownloadName title={download.filename} length={downloadNameLength} />}
                    description={<span>
                        <b>Size: </b>{formatBytes(extra_info.size)} <br />
                        <b> Uploaded: </b>{formatBytes(extra_info.uploaded)} <br />
                        <b> Upspeed↑: </b>{formatBytes(extra_info.upspeed)}/s <br />
                        <Row align='middle' justify='center'><CheckCircleTwoTone twoToneColor="#52c41a" /></Row>
                    </span>}
                />
                {deleteButton}
            </List.Item>
        } else if (download.filename.length === 0) {
            return <List.Item>
                <List.Item.Meta
                    title='Preparing...'
                />
                <span>
                    {(100 * extra_info.progress).toFixed(2)}%
                    {deleteButton}
                </span>
            </List.Item>
        } else {
            return <List.Item>
                <List.Item.Meta
                    title={<DownloadName title={download.filename} length={downloadNameLength} />}
                    description={<span>
                        <b>Size: </b>{formatBytes(extra_info.size)}  <br />
                        <b> Downloaded: </b>{formatBytes(extra_info.completed)}  <br />
                        <b> Dlspeed↓: </b>{formatBytes(extra_info.dlspeed)}/s  <br />
                        <b> ETA: </b>{secondsToDhms(extra_info.eta)}
                    </span>}
                />
                <span>
                    {(100 * extra_info.progress).toFixed(2)}%
                    {deleteButton}
                </span>
            </List.Item>
        }
    }

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

export default TvEpisodeCard