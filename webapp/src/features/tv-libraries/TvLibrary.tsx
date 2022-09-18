import { Col, Empty, Row, Skeleton } from 'antd';
import React from 'react';
import { useParams } from 'react-router-dom';
import { useAppSelector } from '../../app/hook';
import { datetimeSort } from '../../app/utils';
import { TVShowCard } from './TvShowCard';
import { selectAllShowsByLibrary } from './tvshowsSlice';

const TvLibrary: React.FC = () => {
    const { id } = useParams()
    const shows = useAppSelector(selectAllShowsByLibrary(id as string))
    if (!shows) {
        return <Skeleton active />
    }
    if (shows.length === 0) {
        return <Empty description={"The library is empty. Try to add a show!"} />
    }
    return <div>
        <Row gutter={24} style={{ margin: 16 }} align='bottom'>
            {shows
                .sort((a, b) => datetimeSort(a.air_date, b.air_date))
                .map(show => <Col key={show.id}><TVShowCard id={String(show.id)} /></Col>)}
        </Row>
    </div>

}


export default TvLibrary;