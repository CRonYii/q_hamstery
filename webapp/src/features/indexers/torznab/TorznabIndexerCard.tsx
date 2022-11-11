import { DeleteTwoTone, EditOutlined, SearchOutlined } from '@ant-design/icons';
import { Card, notification, Popconfirm } from 'antd';
import React from 'react';
import { ITorznabIndexer } from '../../../app/entities';
import { useAppDispatch } from '../../../app/hook';
import { hamsterySlice } from '../../api/hamsterySlice';
import { indexerActions } from '../indexerSlice';
import { torznabIndexerActions } from './torznabIndexerSlice';

const TorznabIndexerCard: React.FC<{ indexer: ITorznabIndexer }> = ({ indexer }) => {
    const dispatch = useAppDispatch()
    const [removeTorznabIndexer, { isLoading }] = hamsterySlice.useRemoveTorznabIndexerMutation()

    return <Card
        style={{ minWidth: '200px' }}
        actions={[
            <SearchOutlined key="search"
                onClick={() => dispatch(indexerActions.search({ type: 'torznab', id: String(indexer.id) }))}
            />,
            <EditOutlined key="edit"
                onClick={() => dispatch(torznabIndexerActions.edit(String(indexer.id)))}
            />,
            <Popconfirm title='Are you sure you want to delete this Torznab Indexer?'
                onConfirm={async () => {
                    if (!isLoading) {
                        try {
                            await removeTorznabIndexer(String(indexer.id)).unwrap()
                        } catch {
                            notification.error({ message: 'Failed to remove Torznab Indexer' })
                        }
                    }
                }}
            >
                <DeleteTwoTone key="delete" twoToneColor="#eb2f96" />
            </Popconfirm>,
        ]}
    >
        <Card.Meta title={indexer.name} description={indexer.url} />
    </Card>
}

export default TorznabIndexerCard