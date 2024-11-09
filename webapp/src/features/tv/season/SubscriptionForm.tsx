import { Button, Form } from 'antd';
import React from 'react';
import { IIndexer } from '../../../app/entities';
import { useAppDispatch } from '../../../app/hook';
import { hamsterySlice } from '../../api/hamsterySlice';
import ApiLoading from '../../general/ApiLoading';
import DjangoRestframeworkForm from '../../general/DjangoRestframeworkForm';
import { seasonActions } from './seasonSlice';

const SubscriptionForm: React.FC<{
    id: string,
    season_id: string,
    priority: number,
    editId?: string,
    onFinish?: (task: Promise<void>) => void,
}> = ({ id, season_id, priority, editId, onFinish }) => {
    const [form] = Form.useForm()
    const dispatch = useAppDispatch()
    return <ApiLoading getters={{
        indexers: hamsterySlice.useGetIndexersQuery,
    }}>{
            ({ values }) => {
                const indexers: IIndexer[] = values.indexers.data
                return <DjangoRestframeworkForm
                    form={form}
                    id={id} editId={editId}
                    onFinish={onFinish}
                    get={hamsterySlice.useGetShowSubscriptionQuery}
                    addMutation={hamsterySlice.useAddShowSubscriptionMutation}
                    editMutation={hamsterySlice.useEditShowSubscriptionMutation}
                    getOptions={hamsterySlice.useGetShowSubscriptionOptionsQuery}
                    extras={{
                        'indexer': indexers.map((entity) => ({
                            value: entity.id,
                            display_name: entity.name,
                        }))
                    }}
                    displays={[
                        { key: 'id', displayName: 'ID', hidden: true },
                        { key: 'season', displayName: 'Season', hidden: true, defaultValue: season_id, },
                        { key: 'indexer', displayName: 'Indexer', },
                        { key: 'query', displayName: 'Query', },
                        { key: 'priority', displayName: 'Priority', defaultValue: priority, },
                        { key: 'offset', displayName: 'Offset', defaultValue: 0 },
                        { key: 'exclude', displayName: 'Exclude', },
                    ]}
                    actions={[
                        <Button
                            onClick={async () => {
                                try {
                                    await form.validateFields()
                                    const data = form.getFieldsValue()
                                    dispatch(seasonActions.showSearchResult(data))
                                } catch (e) {
                                    /* do nothing */
                                }
                            }}
                        >Test</Button>
                    ]}
                />

            }
        }</ApiLoading>
}

export default SubscriptionForm