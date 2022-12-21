import { CheckCircleTwoTone, CloudDownloadOutlined, DeleteTwoTone } from '@ant-design/icons';
import { Card, List, Popconfirm, Row } from 'antd';
import React from 'react';
import { ITvDownload, ITvEpisode, ITvSeason, ITvShow, TvEpisodeStatus } from '../../../app/entities';
import { useAppDispatch } from '../../../app/hook';
import { formatBytes, secondsToDhms, toTMDBPosterURL } from '../../../app/utils';
import { hamsterySlice } from '../../api/hamsterySlice';
import { indexerActions } from '../../indexers/indexerSlice';

const { Meta } = Card;

const TvEpisodeCard: React.FC<{ show: ITvShow, season: ITvSeason, episode: ITvEpisode, downloads: ITvDownload[] }> = ({ show, season, episode, downloads }) => {
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
        <TvDownloadInfo episode={episode} downloads={downloads} />
    </Card >
}

export const TvDownloadInfo: React.FC<{ episode: ITvEpisode, downloads: ITvDownload[] }> = ({ episode, downloads }) => {
    const dispatch = useAppDispatch()
    const [remove] = hamsterySlice.useRemoveTvDownloadMutation()

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
            </List.Item>
        }
        const { extra_info } = download
        if (download.done) {
            return <List.Item>
                <List.Item.Meta
                    title={download.filename}
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
                    title={download.filename}
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