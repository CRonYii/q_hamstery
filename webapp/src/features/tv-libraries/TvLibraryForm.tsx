import { Form, Input, Select } from 'antd';
import React, { useEffect } from 'react';
import { hamsterySlice } from '../api/hamsterySlice';

const TvLibraryForm: React.FC<{
    editId?: string,
    onFinish?: (task: Promise<void>) => void,
}> = ({ editId, onFinish }) => {
    const [form] = Form.useForm()
    const {
        data: library, isUninitialized
    } = hamsterySlice.useGetTvLibraryQuery(editId as string, { skip: !editId })
    const [add, { isLoading: addIsLoading }] = hamsterySlice.useAddTvLibraryMutation()
    const [edit, { isLoading: editIsLoading }] = hamsterySlice.useEditTvLibraryMutation()
    const { data: options } = hamsterySlice.useGetTvLibraryOptionsQuery()
    const langs = options?.languages || []
    const isLoading = addIsLoading || editIsLoading
    const isEditing = !isUninitialized && library
    useEffect(() => {
        if (isEditing) {
            form.setFieldValue('id', library.id)
            form.setFieldValue('name', library.name)
            form.setFieldValue('lang', library.lang)
        } else {
            form.resetFields()
        }
    }, [form, isEditing, library])

    return <Form
        form={form}
        id='tvlibrary-add-form'
        name='tvlibrary-add-form'
        labelCol={{ span: 4 }}
        onFinish={(data) => {
            if (isLoading)
                return

            const task = (async function () {
                if (isEditing) {
                    await edit(data).unwrap()
                } else {
                    await add(data).unwrap()
                }
                form.resetFields()
            })()
            if (onFinish)
                onFinish(task)
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
            label="Language"
            name="lang"
            rules={[{ required: true, message: 'Please select a language' }]}
        >
            <Select
                showSearch
                filterOption={(input, option) => {
                    input = input.toLowerCase();
                    return (option?.children as unknown as string).toLowerCase().includes(input)
                        || (option?.value as string).toLowerCase().includes(input)
                }
                }
            >
                {
                    langs.map(({ display_name, value }) => {
                        return <Select.Option key={value} value={value}>{display_name}</Select.Option>
                    })
                }

            </Select>
        </Form.Item>
    </Form>
}

export default TvLibraryForm