import { PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Col, Modal, Row, Skeleton } from 'antd';
import React from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hook';
import { hamsterySlice } from '../api/hamsterySlice';
import TorznabIndexerCard from './TorznabIndexerCard';
import TorznabIndexerForm from './TorznabIndexerForm';
import { torznabIndexerActions, torznabIndexerSelector } from './torznabIndexerSlice';

const TorznabIndexer: React.FC = () => {
    const {
        data: indexers,
        isLoading,
        isError,
    } = hamsterySlice.useGetTorznabIndexersQuery()
    const dispatch = useAppDispatch()
    const torznab = useAppSelector(torznabIndexerSelector)

    if (isLoading) {
        return <Skeleton active />
    } else if (isError || !indexers) {
        return <Alert
            message="Error"
            description='Failed to load Torznab Indexers'
            type="error"
            showIcon
        />
    }

    return <div>
        <Modal
            title="Torznab Indexer"
            open={torznab.open}
            onCancel={() => dispatch(torznabIndexerActions.close())}
            footer={[
                <Button key='submit' form="torznab-indexer-form" type="primary" htmlType="submit">
                    {torznab.type === 'edit' ? 'Update' : 'Add'}
                </Button>,
            ]}
        >
            <TorznabIndexerForm
                editId={torznab.type === 'edit' ? torznab.editId : undefined}
                close={() => dispatch(torznabIndexerActions.close())}
            />
        </Modal>
        <Row gutter={24} style={{ margin: 16 }}>
            <Col>
                <Button type='primary' onClick={() => dispatch(torznabIndexerActions.add())}>
                    <PlusOutlined />Add
                </Button>
            </Col>
        </Row>
        <Row gutter={24} style={{ margin: 16 }}>
            {
                indexers.map(indexer => {
                    return <Col key={indexer.id}>
                        <TorznabIndexerCard indexer={indexer} />
                    </Col>
                })
            }
        </Row>
    </div>
}

export default TorznabIndexer