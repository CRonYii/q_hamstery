import { Form, Input, notification } from 'antd';
import React, { useEffect } from 'react';
import { hamsterySlice } from '../api/hamsterySlice';

const TorznabIndexerForm: React.FC<{
    editId?: string,
    close: () => void
}> = ({ editId, close }) => {
    const [form] = Form.useForm()
    const {
        data: indexer, isUninitialized
    } = hamsterySlice.useGetTorznabIndexerQuery(editId as string, { skip: !editId })
    const [addTorznabIndexer, { isLoading: addIsLoading }] = hamsterySlice.useAddTorznabIndexerMutation()
    const [editTorznabIndexer, { isLoading: editIsLoading }] = hamsterySlice.useEditTorznabIndexerMutation()
    const isLoading = addIsLoading || editIsLoading
    const isEditing = !isUninitialized && indexer
    useEffect(() => {
        if (isEditing) {
            form.setFieldValue('id', indexer.id)
            form.setFieldValue('name', indexer.name)
            form.setFieldValue('url', indexer.url)
            form.setFieldValue('apikey', indexer.apikey)
        } else {
            form.resetFields()
        }
    }, [editId, indexer])

    return <Form
        form={form}
        id='torznab-indexer-form'
        name='torznab-indexer-form'
        labelCol={{ span: 4 }}
        onFinish={async (data) => {
            if (isLoading)
                return
            try {
                if (isEditing) {
                    await editTorznabIndexer(data).unwrap()
                } else {
                    await addTorznabIndexer(data).unwrap()
                }
                form.resetFields()
                close()
            } catch {
                notification.error({ message: 'Failed to save the Torznab Indexer' })
            }
        }}
    >
        <Form.Item
            label="ID"
            name="id"
            hidden
        >
            <Input />
        </Form.Item>
        <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: 'Please enter name' }]}
        >
            <Input />
        </Form.Item>
        <Form.Item
            label="URL"
            name="url"
            rules={[{ required: true, message: 'Please enter URL' }]}
        >
            <Input />
        </Form.Item>
        <Form.Item
            label="API Key"
            name="apikey"
            rules={[{ required: true, message: 'Please enter API Key' }]}
        >
            <Input />
        </Form.Item>
    </Form>
}

export default TorznabIndexerForm