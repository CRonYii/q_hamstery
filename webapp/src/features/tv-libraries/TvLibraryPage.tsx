import { PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Col, Empty, Modal, notification, Row, Skeleton } from 'antd';
import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getShowsOfLibrary } from '../../app/utils';
import { hamsterySlice } from '../api/hamsterySlice';
import AddShowForm from './AddShowForm';
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
    const [addShowOpen, setAddShowOpen] = useState(false)
    const [addShowLoading, setAddShowLoading] = useState(false)

    if (isLoading) {
        return <Skeleton active />
    } else if (isError || !library) {
        return <Alert
            message="Error"
            description='Failed to load TV Library'
            type="error"
            showIcon
        />
    }

    const content = shows.length === 0
        ? <Empty description={"The library is empty. Try to add a show!"} />
        : <Row gutter={24} style={{ margin: 16 }} align='bottom'>
            {
                shows
                    .map(show =>

                        <Col key={show.id}>
                            <TVShowCard show={show} />
                        </Col>

                    )
            }
        </Row>

    return <div>
        <Modal
            style={{ minWidth: '80vh' }}
            title={"Add Show to " + library.name}
            open={addShowOpen}
            onCancel={() => setAddShowOpen(false)}
            footer={[
                <Button
                    key='submit' form="tvshows-add" type="primary" htmlType="submit"
                    loading={addShowLoading}
                >
                    Add
                </Button>,
            ]}
        >
            <AddShowForm library={library} onFinish={async (task) => {
                try {
                    setAddShowLoading(true)
                    await task
                    setAddShowOpen(false)
                    setAddShowLoading(false)
                } catch (e: any) {
                    notification.error({ message: 'Failed to add show to library' });
                }
            }} />
        </Modal>
        <Row gutter={24} style={{ margin: 16 }}>
            <Col>
                <Button type='primary' onClick={() => setAddShowOpen(true)}>
                    <PlusOutlined />Add Show
                </Button>
            </Col>
        </Row>
        {content}
    </div >

}


export default TvLibraryPage;