import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Col, Empty, Input, Modal, Pagination, Row, notification } from 'antd';
import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ITvLibrary, ITvShow } from '../../../app/entities';
import { IPageNumberResult, hamsterySlice } from '../../api/hamsterySlice';
import ApiLoading from '../../general/ApiLoading';
import TVShowCard from '../show/TvShowCard';
import AddShowForm from './AddShowForm';

const TvLibraryPage: React.FC = () => {
    const params = useParams()
    const [searchParams, setSearchParams] = useSearchParams()
    const library_id = params.library_id as string
    const [addShowOpen, setAddShowOpen] = useState(false)
    const [addShowLoading, setAddShowLoading] = useState(false)
    const [scan, { isLoading }] = hamsterySlice.useScanTvLibraryMutation()

    const goToPage = (page: number) => {
        const new_params = new URLSearchParams(searchParams)
        new_params.set('page', String(page))
        setSearchParams(new_params)
    }

    const searchLibrary = (keyword: string) => {
        const new_params = new URLSearchParams(searchParams)
        new_params.set('search', keyword)
        new_params.set('search_page', String(1))
        setSearchParams(new_params)
    }

    const searchKeyword = searchParams.get('search') || ''
    const currentPage = searchKeyword ? searchParams.get('serch_page') || '1' : searchParams.get('page') || '1';

    return <ApiLoading getters={{
        'library': () => hamsterySlice.useGetTvLibraryQuery(library_id),
        'shows': () => hamsterySlice.useGetTvShowsQuery({
            lib: library_id, ordering: '-air_date',
            search: searchKeyword, page: currentPage
        })
    }}>
        {
            ({ values }) => {
                const library: ITvLibrary = values.library.data
                const shows_page: IPageNumberResult<ITvShow> = values.shows.data
                const shows: ITvShow[] = shows_page.results
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
                const paginator = <Row>
                    <Pagination
                        current={shows_page.page} pageSize={shows_page.page_size} total={shows_page.count}
                        onChange={(page) => {
                            goToPage(page)
                            window.scrollTo(0, 0)
                        }}
                    />
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
                            <Input placeholder='Search Library' onChange={(evt) => searchLibrary(evt.target.value)} />
                        </Col>
                    </Row>
                    {paginator}
                    {content}
                    {paginator}
                </div>
            }}</ApiLoading>
}


export default TvLibraryPage;