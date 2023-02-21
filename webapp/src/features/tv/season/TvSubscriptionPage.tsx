import { DeleteTwoTone, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Col, Collapse, List, Modal, notification, Popconfirm, Row, Skeleton, Switch, Typography } from 'antd';
import React from 'react';
import { useParams } from 'react-router-dom';
import { IIndexer, IShowSubscription, ITvDownload } from '../../../app/entities';
import { useAppDispatch, useAppSelector } from '../../../app/hook';
import { formatBytes } from '../../../app/utils';
import { hamsterySlice } from '../../api/hamsterySlice';
import ApiLoading from '../../general/ApiLoading';
import { seasonActions, seasonSearchSelector } from './seasonSlice';
import { subscriptionActions } from './subscriptionSlice';

const { Text } = Typography;

const TVSubscriptionPage: React.FC = () => {
    const params = useParams()
    const season_id = params.season_id as string

    return <ApiLoading getters={{
        'subs': () => hamsterySlice.useGetShowSubscriptionsQuery({ season: season_id }),
    }}>
        {
            ({ values }) => {
                const subs: IShowSubscription[] = values.subs.data
                return <TVSeasonSubscriptions season_id={season_id} subs={subs} />
            }
        }
    </ApiLoading>
}

export default TVSubscriptionPage

const TVSeasonSubscriptions: React.FC<{ season_id: string, subs: IShowSubscription[] }> = ({ season_id, subs }) => {
    const dispatch = useAppDispatch()
    let priority = 0
    if (subs.length > 0) {
        priority = subs[subs.length - 1].priority + 1
    }

    return <div>
        <Row gutter={12} style={{ margin: 16 }}>
            <Col>
                <Button type='primary' onClick={() => dispatch(subscriptionActions.addSubscription({
                    season: season_id, priority,
                }))}>
                    <PlusOutlined />Add
                </Button>
            </Col>
        </Row>
        <List
            itemLayout='horizontal'
            bordered
            dataSource={subs}
            renderItem={sub => (<TVSeasonSubscriptionListItem sub={sub} />)}
        /></div>
}

const TVSeasonSubscriptionListItem: React.FC<{ sub: IShowSubscription }> = ({ sub }) => {
    const dispatch = useAppDispatch()
    const [scanShowSubscription, { isLoading: scanIsLoading }] = hamsterySlice.useScanShowSubscriptionMutation()
    const [removeShowSubscription, { isLoading: isRemoveLoading }] = hamsterySlice.useRemoveShowSubscriptionMutation()
    const [editShowSubscription, { isLoading: isEditLoading }] = hamsterySlice.useEditShowSubscriptionMutation()

    return <ApiLoading getters={{
        'indexer': () => hamsterySlice.useGetIndexerQuery(String(sub.indexer)),
        'downloads': () => hamsterySlice.useGetMonitoredTvDownloadsQuery({ subscription: sub.id }),
    }}>
        {({ values }) => {
            const indexer: IIndexer = values.indexer.data
            const downloads: ITvDownload[] = values.downloads.data
            return <List.Item
                actions={[
                    <Switch loading={isEditLoading} checked={!sub.done} onClick={async () => {
                        if (!isEditLoading) {
                            try {
                                await editShowSubscription({
                                    id: String(sub.id),
                                    body: {
                                        ...sub,
                                        done: !sub.done,
                                    },
                                }).unwrap()
                            } catch {
                                notification.error({ message: 'Failed to change status of Show Subscription' })
                            }
                        }
                    }} />,
                    <Button
                        key='scan' icon={<ReloadOutlined />}
                        onClick={() => scanShowSubscription(String(sub.id))}
                        loading={scanIsLoading}
                    />,
                    <Button
                        key='edit' icon={<EditOutlined />}
                        onClick={() => dispatch(subscriptionActions.editSubscription(String(sub.id)))}
                    />,
                    <Popconfirm
                        key='delete'
                        placement='topLeft'
                        title='Are you sure you want to delete this subscription?'
                        onConfirm={async () => {
                            if (!isRemoveLoading) {
                                try {
                                    await removeShowSubscription(String(sub.id)).unwrap()
                                } catch {
                                    notification.error({ message: 'Failed to remove Show Subscription' })
                                }
                            }
                        }}
                    >
                        <Button danger icon={<DeleteTwoTone key="delete" twoToneColor="#eb2f96" />} />
                    </Popconfirm>,
                ]}
            >
                <List.Item.Meta
                    title={indexer.name}
                    description={<span>
                        Query: {<Text code>{sub.query}</Text>}
                        {sub.exclude ? <span>Exclude: <Text code>{sub.exclude || 'N/A'}</Text></span> : null}
                        {sub.offset ? <span>Offset: <Text code>{sub.offset || 'N/A'}</Text></span> : null}
                    </span>}
                />
                <div>{downloads.filter(i => i.done).length} / {downloads.length} Episodes</div>
            </List.Item>
        }}
    </ApiLoading>
}

export const TVSeasonSearchResult: React.FC = () => {
    const dispatch = useAppDispatch()
    const season = useAppSelector(seasonSearchSelector)
    const { data, isUninitialized, isLoading: dataIsLoading, isError: dataIsError } = hamsterySlice.useSearchTvSeasonQuery(season.search_query as IShowSubscription, { skip: !season.search_query })

    const content = () => {
        if (isUninitialized || dataIsLoading)
            return <Skeleton active />
        if (dataIsError)
            return <Alert
                message="Error"
                description='Failed to load data'
                type="error"
                showIcon
            />
        const activeKeys = Object.keys(data).filter(key => data[key].length)
        return <Collapse defaultActiveKey={activeKeys}>
            {
                activeKeys.map((key) => {
                    const res = data[key]

                    return <Collapse.Panel key={key} header={`Episode ${key}`}>
                        <List
                            itemLayout='horizontal'
                            dataSource={res}
                            renderItem={item => (<List.Item>
                                <List.Item.Meta
                                    title={item.title}
                                    description={<span>
                                        Size: <Typography.Text code>{formatBytes(Number(item.size))}</Typography.Text>
                                        Date: <Typography.Text code>{new Date(item.pub_date).toLocaleString()}</Typography.Text>
                                    </span>}
                                />
                            </List.Item>)}
                        />
                    </Collapse.Panel>
                })
            }
        </Collapse>
    }

    return <Modal
        title='Search Result'
        open={season.search_open}
        onCancel={() => dispatch(seasonActions.closeSearchResult())}
        style={{ minWidth: '60vw' }}
        footer={null}
    >
        {content()}
    </Modal>
}
