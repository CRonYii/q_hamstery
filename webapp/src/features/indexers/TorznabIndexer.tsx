import { PlusOutlined } from '@ant-design/icons';
import { Button, Col, Modal, notification, Row } from 'antd';
import React from 'react';
import { ITorznabIndexer } from '../../app/entities';
import { useAppDispatch, useAppSelector } from '../../app/hook';
import hamstery from '../api/hamstery';
import { hamsterySlice } from '../api/hamsterySlice';
import ApiLoading from '../general/ApiLoading';
import IndexerSearcher from './IndexerSearcher';
import TorznabIndexerCard from './TorznabIndexerCard';
import TorznabIndexerForm from './TorznabIndexerForm';
import { torznabIndexerActions, torznabIndexerSelector } from './torznabIndexerSlice';

const TorznabIndexer: React.FC = () => {
    const dispatch = useAppDispatch()
    const torznab = useAppSelector(torznabIndexerSelector)

    return <ApiLoading getters={{ 'indexers': hamsterySlice.useGetTorznabIndexersQuery }}>
        {
            ({ values }) => {
                const indexers: ITorznabIndexer[] = values.indexers.data
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

                    <Modal
                        title="Search"
                        style={{ minWidth: '100vh' }}
                        open={!!torznab.searchId}
                        onCancel={() => {
                            dispatch(torznabIndexerActions.closeSearch())
                        }}
                        footer={null}
                    >
                        <IndexerSearcher
                            onSearch={
                                async (keyword) => {
                                    if (!torznab.searchId)
                                        return []
                                    try {
                                        const { data } = await hamstery.searchTorznabIndexer(torznab.searchId, keyword)
                                        return data
                                    } catch {
                                        notification.error({ message: 'Failed to search with indexer' })
                                        return []
                                    }
                                }
                            }
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