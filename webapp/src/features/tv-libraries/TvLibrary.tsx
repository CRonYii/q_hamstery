import { Col, Empty, Row, Skeleton } from 'antd';
import React from 'react';
import { useParams } from 'react-router-dom';
import { useAppSelector } from '../../app/hook';
import TVShowCard from './TvShowCard';
import { selectAllShowsByLibrary } from './tvshowsSlice';

const TvLibrary: React.FC = () => {
    const params = useParams()
    const library_id = params.library_id as string
    const shows = useAppSelector(selectAllShowsByLibrary(library_id))
    if (!shows) {
        return <Skeleton active />
    }
    if (shows.length === 0) {
        return <Empty description={"The library is empty. Try to add a show!"} />
    }
    return <div>
        <Row gutter={24} style={{ margin: 16 }} align='bottom'>
            {shows
                .map(show => <Col key={show.id}><TVShowCard library_id={library_id} id={String(show.id)} /></Col>)}
        </Row>
    </div>

}


export default TvLibrary;