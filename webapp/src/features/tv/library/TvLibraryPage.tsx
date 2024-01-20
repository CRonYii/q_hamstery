import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Col, Empty, Input, Modal, Row, notification } from 'antd';
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ITvLibrary, ITvShow } from '../../../app/entities';
import { hamsterySlice } from '../../api/hamsterySlice';
import ApiLoading from '../../general/ApiLoading';
import TVShowCard from '../show/TvShowCard';
import AddShowForm from './AddShowForm';

const TvLibraryPage: React.FC = () => {
    const params = useParams()
    const library_id = params.library_id as string
    const [addShowOpen, setAddShowOpen] = useState(false)
    const [addShowLoading, setAddShowLoading] = useState(false)
    const [scan, { isLoading }] = hamsterySlice.useScanTvLibraryMutation()
    const [showFilter, setShowFilter] = useState('')

    return <ApiLoading getters={{
        'library': () => hamsterySlice.useGetTvLibraryQuery(library_id),
        'shows': () => hamsterySlice.useGetTvShowsQuery({ lib: library_id, ordering: '-air_date' })
    }}>
        {
            ({ values }) => {
                const library: ITvLibrary = values.library.data
                const shows: ITvShow[] = values.shows.data
                const content = shows.length === 0
                    ? <Empty description={"The library is empty. Try to add a show!"} />
                    : <Row gutter={24} style={{ margin: 16 }} align='bottom'>
                        {
                            shows
                                .filter(show => show.name.toLowerCase().includes(showFilter))
                                .map(show =>

                                    <Col key={show.id}>
                                        <TVShowCard show={show} />
                                    </Col>
                                )
                        }
                    </Row>
                return <div>
                    <Modal
                        style={{ minWidth: '60vw' }}
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
                            setAddShowLoading(true)
                            try {
                                await task
                                setAddShowOpen(false)
                            } catch (e: any) {
                                notification.error({ message: 'Failed to add show to library' });
                            }
                            setAddShowLoading(false)
                        }} />
                    </Modal>
                    <Row gutter={12} style={{ margin: 16 }}>
                        <Col>
                            <Button type='primary' onClick={() => setAddShowOpen(true)}>
                                <PlusOutlined />Add Show
                            </Button>
                        </Col>
                        <Col>
                            <Button onClick={() => scan(library_id)} loading={isLoading}>
                                {!isLoading ? <span><ReloadOutlined /> Scan</span> : <span>Scanning</span>}
                            </Button>
                        </Col>
                        <Col span={8}>
                            <Input placeholder='Search Library' onChange={(evt) => setShowFilter(evt.target.value)} />
                        </Col>
                    </Row>
                    {content}
                </div>
            }}</ApiLoading>
}


export default TvLibraryPage;