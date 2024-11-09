import { PlusOutlined } from '@ant-design/icons';
import { Button, Col, Modal, notification, Row } from 'antd';
import React from 'react';
import { ITorznab } from '../../../app/entities';
import { useAppDispatch, useAppSelector } from '../../../app/hook';
import { hamsterySlice } from '../../api/hamsterySlice';
import ApiLoading from '../../general/ApiLoading';
import TorznabIndexerCard from './TorznabIndexerCard';
import TorznabIndexerForm from './TorznabIndexerForm';
import { torznabIndexerActions, torznabIndexerSelector } from './torznabIndexerSlice';

const TorznabIndexer: React.FC = () => {
    const dispatch = useAppDispatch()
    const torznab = useAppSelector(torznabIndexerSelector)

    return <ApiLoading getters={{ 'indexers': hamsterySlice.useGetTorznabIndexersQuery }}>
        {
            ({ values }) => {
                const indexers: ITorznab[] = values.indexers.data
                return <div>
                    <Modal
                        title={torznab.editId ? "Update Torznab Indexer" : "Add new Torznab Indexer"}
                        style={{ minWidth: '60vw' }}
                        open={torznab.open}
                        onCancel={() => dispatch(torznabIndexerActions.close())}
                        footer={null}
                    >
                        <TorznabIndexerForm
                            id='torznab-indexer'
                            editId={torznab.editId}
                            onFinish={async (task) => {
                                try {
                                    await task
                                    dispatch(torznabIndexerActions.close())
                                } catch {
                                    notification.error({ message: 'Failed to save Torznab Indexer' })
                                }
                            }}
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
        }
    </ApiLoading>

}

export default TorznabIndexer