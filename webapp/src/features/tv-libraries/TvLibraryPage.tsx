import { Alert, Col, Empty, Row, Skeleton } from 'antd';
import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { getShowsOfLibrary } from '../../app/utils';
import { hamsterySlice } from '../api/hamsterySlice';
import TVShowCard from './TvShowCard';

const TvLibraryPage: React.FC = () => {
    const params = useParams()
    const library_id = params.library_id as string
    const {
        data: library,
        isLoading,
        isError,
    } = hamsterySlice.useGetTvLibraryQuery(library_id)
    const shows = useMemo(() => getShowsOfLibrary(library), [library])

    if (isLoading) {
        return <Skeleton active />
    } else if (isError || !library) {
        return <Alert
            message="Error"
            description='Failed to load TV Library'
            type="error"
            showIcon
        />
    } else if (shows.length === 0) {
        return <Empty description={"The library is empty. Try to add a show!"} />
    }

    return <div>
        <Row gutter={24} style={{ margin: 16 }} align='bottom'>
            {shows
                .map(show => <Col key={show.id}>
                    <TVShowCard show={show} />
                </Col>)}
        </Row>
    </div>

}


export default TvLibraryPage;