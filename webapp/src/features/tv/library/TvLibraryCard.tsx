import { DeleteTwoTone, EditOutlined } from '@ant-design/icons';
import { Card, notification, Popconfirm } from 'antd';
import React from 'react';
import { ITvLibrary } from '../../../app/entities';
import { useAppDispatch } from '../../../app/hook';
import { hamsterySlice } from '../../api/hamsterySlice';
import { tvLibraryActions } from './tvlibrarySlice';

const TvLibraryCard: React.FC<{ library: ITvLibrary }> = ({ library }) => {
    const dispatch = useAppDispatch()
    const [remove, { isLoading }] = hamsterySlice.useRemoveTvLibraryMutation()

    return <Card
        style={{ minWidth: '200px' }}
        actions={[
            <EditOutlined key="edit"
                onClick={() => dispatch(tvLibraryActions.editLibrary(String(library.id)))}
            />,
            <Popconfirm title='Are you sure you want to delete this TV Library?'
                onConfirm={async () => {
                    if (!isLoading) {
                        try {
                            await remove(String(library.id)).unwrap()
                        } catch {
                            notification.error({ message: 'Failed to remove TV Library' })
                        }
                    }
                }}
            >
                <DeleteTwoTone key="delete" twoToneColor="#eb2f96" />
            </Popconfirm>,
        ]}
    >
        <Card.Meta title={library.name} description={`Language: ${library.lang}`} />
    </Card>
}

export default TvLibraryCard