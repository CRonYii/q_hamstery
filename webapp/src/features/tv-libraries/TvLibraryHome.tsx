import { PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Col, Modal, notification, Row, Skeleton } from 'antd';
import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hook';
import { hamsterySlice } from '../api/hamsterySlice';
import TvLibraryCard from './TvLibraryCard';
import TvLibraryForm from './TvLibraryForm';
import { tvLibraryActions, tvLibrarySelector } from './tvlibrarySlice';

const TvLibraryHome: React.FC = () => {
    const {
        data: libraries,
        isLoading,
        isError,
    } = hamsterySlice.useGetTvLibrariesQuery()
    const dispatch = useAppDispatch()
    const tvlibrary = useAppSelector(tvLibrarySelector)
    const [addLibraryLoading, setAddLibraryLoading] = useState(false)

    if (isLoading) {
        return <Skeleton active />
    } else if (isError || !libraries) {
        return <Alert
            message="Error"
            description='Failed to load TV Libraries'
            type="error"
            showIcon
        />
    }

    return <div>
        <Modal
            title="TV Library"
            open={tvlibrary.addLibraryOpen}
            onCancel={() => dispatch(tvLibraryActions.closeLibrary())}
            footer={[
                <Button
                    loading={addLibraryLoading}
                    key='submit' form="tvlibrary-add-form" type="primary" htmlType="submit">
                    {tvlibrary.editId ? 'Update' : 'Add'}
                </Button>,
            ]}
        >
            <TvLibraryForm
                editId={tvlibrary.editId}
                onFinish={async (task) => {
                    setAddLibraryLoading(true)
                    try {
                        await task
                        dispatch(tvLibraryActions.closeLibrary())
                    } catch {
                        notification.error({ message: 'Failed to save TV Library' })
                    }
                    setAddLibraryLoading(false)
                }}
            />
        </Modal>

        <Row gutter={24} style={{ margin: 16 }}>
            <Col>
                <Button type='primary' onClick={() => dispatch(tvLibraryActions.addLibrary())}>
                    <PlusOutlined />Add
                </Button>
            </Col>
        </Row>
        <Row gutter={24} style={{ margin: 16 }}>
            {
                libraries.map(library => {
                    return <Col key={library.id}>
                        <TvLibraryCard library={library} />
                    </Col>
                })
            }
        </Row>
    </div>
}

export default TvLibraryHome