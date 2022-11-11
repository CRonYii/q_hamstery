import { CheckCircleTwoTone, CloudDownloadOutlined } from '@ant-design/icons';
import { Card } from 'antd';
import React from 'react';
import { ITvEpisode, ITvSeason, ITvShow, TvEpisodeStatus } from '../../../app/entities';
import { useAppDispatch } from '../../../app/hook';
import { toTMDBPosterURL } from '../../../app/utils';
import { indexerActions } from '../../indexers/indexerSlice';

const { Meta } = Card;

const TvEpisodeCard: React.FC<{ show: ITvShow, season: ITvSeason, episode: ITvEpisode }> = ({ show, season, episode }) => {
    const dispatch = useAppDispatch()
    const poster_path = toTMDBPosterURL(episode.poster_path, "w185")
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
        // TODO: <Popconfirm title={"The download will be cancelled!"} onConfirm={() => { }}>
        //         <DeleteTwoTone twoToneColor="#eb2f96" />
        //       </Popconfirm>
    } else if (episode.status === TvEpisodeStatus.READY) {
        actions.push(<CheckCircleTwoTone twoToneColor="#52c41a" />)
    }
    return <Card
        hoverable
        style={{ width: 185 }}
        cover={<img alt="Poster" src={poster_path} />}
        actions={actions}
    >
        <Meta title={`EP ${episode.episode_number}`} description={description} />
    </Card >
}

export default TvEpisodeCard