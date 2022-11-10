import { DeleteTwoTone } from '@ant-design/icons';
import { Button, Col, List, notification, Popconfirm, Row } from 'antd';
import React, { useState } from 'react';
import { ITvStorage } from '../../../app/entities';
import { hamsterySlice } from '../../api/hamsterySlice';
import ApiLoading from '../../general/ApiLoading';
import PathSelector from '../../media/PathSelector';

const TvStoragePage: React.FC<{ library_id: string }> = ({ library_id }) => {
    const [remove, { isLoading }] = hamsterySlice.useRemoveTvStorageMutation()
    const [add, { isLoading: isAddLoading }] = hamsterySlice.useAddTvStorageMutation()
    const [path, setPath] = useState<string>('')

    return <ApiLoading getters={{ 'storages': () => hamsterySlice.useGetTvStoragesQuery({ lib: library_id }) }}>
        {
            ({ values }) => {
                const storages: ITvStorage[] = values.storages.data
                return <div>
                    <Row>
                        <Col flex='auto'>
                            <PathSelector type='path' onChange={(value) => setPath(value)} />
                        </Col>
                        <Col span={4}>
                            <Button type='primary' disabled={path.length === 0 || isAddLoading}
                                onClick={() => {
                                    add({ lib: library_id, path: atob(path) } as any)
                                        .unwrap()
                                        .catch(() => notification.error({ message: 'Failed to add TV Storage' }))
                                    setPath('')
                                }}
                            >Add</Button>
                        </Col>
                    </Row>
                    <Row>
                        <Col span={24}>
                            <List
                                size='small'
                                bordered
                                dataSource={storages}
                                renderItem={storage => <List.Item
                                    actions={[
                                        <Popconfirm title='Are you sure you want to delete this Storage?'
                                            onConfirm={async () => {
                                                if (!isLoading) {
                                                    try {
                                                        await remove(String(storage.id)).unwrap()
                                                    } catch {
                                                        notification.error({ message: 'Failed to remove TV Storage' })
                                                    }
                                                }
                                            }}
                                        >
                                            <Button danger>
                                                <DeleteTwoTone key="delete" twoToneColor="#eb2f96" />
                                            </Button>
                                        </Popconfirm>,
                                    ]}>
                                    {storage.path}
                                </List.Item>}
                            />
                        </Col>
                    </Row>
                </div>
            }
        }
    </ApiLoading>

}

export default TvStoragePage