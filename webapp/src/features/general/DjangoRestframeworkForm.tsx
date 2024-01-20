import { Alert, Button, Checkbox, Col, DatePicker, Form, Input, InputNumber, Row, Select, Skeleton, Slider } from 'antd';
import { FormInstance, Rule } from 'antd/lib/form';
import TextArea from 'antd/lib/input/TextArea';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { IParamOption } from '../../app/entities';

export interface IFormDisplayField {
    key: string,
    displayName: string,
    hidden?: boolean,
    defaultValue?: any,
    tooltip?: string,
    help?: string,
    convertValueFrom?: (raw: any) => any,
    convertValueTo?: (raw: any) => any,
    customRender?: (data: any) => React.ReactNode,
}

export interface IDjangoRestframeworkFormProps {
    onFinish?: (task: Promise<void>) => void,
    form: FormInstance<any>,
    id: string,
    editId?: string,
    get: any,
    getOptions: any,
    addMutation: any,
    editMutation: any,
    displays: IFormDisplayField[],
    extras: Record<string, any[] | undefined>,
    actions?: React.ReactNode[],
}

const DjangoRestframeworkForm: React.FC<IDjangoRestframeworkFormProps> =
    ({ form, id, editId, get, getOptions, addMutation, editMutation, onFinish, displays, extras, actions = [] }) => {
        const {
            data, isUninitialized, isLoading: dataIsLoading, isError: dataIsError
        } = get(editId as string, { skip: !editId })
        const [add, { isLoading: addIsLoading }] = addMutation()
        const [edit, { isLoading: editIsLoading }] = editMutation()
        const { data: options, isLoaidng: optionsIsLoading, isError: optionsIsError } = getOptions()
        const isMutating = addIsLoading || editIsLoading
        const isEditing = !!(editId && !isUninitialized && data)
        const [loading, setLoading] = useState<boolean>(false)
        useEffect(() => {
            if (isEditing && options) {
                displays.forEach(({ key, convertValueFrom }) => {
                    const option = options[key]
                    let value = data[key]
                    if (option.type === 'date')
                        value = moment(value)
                    if (convertValueFrom)
                        value = convertValueFrom(value)
                    form.setFieldValue(key, value)
                })
            } else {
                form.resetFields()
            }
        }, [form, isEditing, displays, options, data])

        if (!options || optionsIsLoading || dataIsLoading)
            return <Skeleton active />
        if (dataIsError || optionsIsError)
            return <Alert
                message="Error"
                description='Failed to load data'
                type="error"
                showIcon
            />

        const optionToField = (key: string, option: IParamOption) => {
            const disabled = option.read_only
            switch (option.type) {
                case 'email':
                case 'string':
                    if (option.max_length && option.max_length > 255)
                        return <TextArea disabled={disabled} />
                    return <Input disabled={disabled} />
                case 'date':
                    return <DatePicker disabled={disabled} />
                case 'choice':
                    {
                        const choices = option?.choices
                        if (!choices)
                            return <Input disabled={disabled} />
                        return <Select
                            showSearch
                            filterOption={(input, option) => (option?.children as unknown as string).toLowerCase().includes(input)
                                || (option?.value as string).toLowerCase().includes(input)}
                            disabled={disabled}>
                            {
                                choices.map((choice) => {
                                    return <Select.Option
                                        key={choice.display_name}
                                        value={choice.value}
                                    >{choice.display_name}</Select.Option>
                                })
                            }
                        </Select>
                    }
                case 'boolean':
                    return <Checkbox disabled={disabled} />
                case 'integer':
                    if (option.max_value && option.min_value) {
                        const mid = Math.floor((option.min_value + option.max_value) / 2)
                        return <Slider marks={{
                            [option.min_value]: option.min_value,
                            [mid]: mid,
                            [option.max_value]: option.max_value,
                        }} min={option.min_value} max={option.max_value} />
                    }
                    return <InputNumber type='number' min={option.min_value} max={option.max_value} disabled={disabled} />
                case 'field':
                    {
                        const choices = extras[key];
                        if (!choices)
                            return <Input disabled={disabled} />
                        return <Select disabled={disabled}>
                            {
                                choices.map((choice) => {
                                    return <Select.Option
                                        key={choice.display_name}
                                        value={choice.value}
                                    >{choice.display_name}</Select.Option>
                                })
                            }
                        </Select>
                    }
            }

            return <div></div>
        }

        const fields = displays
            .map(({ key, displayName, hidden = false, customRender, convertValueTo, tooltip, help, }) => {
                const option = options[key]
                if (!option) {
                    console.warn('DjangoRestframeworkForm:', key, 'does not exist.')
                    return null
                }
                const rules: Rule[] = [];
                if (option.required && option.type !== 'boolean')
                    rules.push({ required: true, message: `Please enter ${displayName}` })
                if (option.max_length)
                    rules.push({ max: option.max_length, message: `${displayName} maximum length is ${option.max_length}`, transform: convertValueTo })
                if (option.min_length)
                    rules.push({ max: option.min_length, message: `${displayName} minimum length is ${option.min_length}`, transform: convertValueTo })
                if (option.type === 'email')
                    rules.push({ type: 'email' })
                return <Form.Item
                    label={displayName}
                    key={key}
                    name={key}
                    hidden={hidden}
                    rules={rules}
                    tooltip={tooltip}
                    help={help}
                    valuePropName={option.type === 'boolean' ? 'checked' : 'value'}
                >
                    {customRender ? customRender(isEditing ? data : undefined) : optionToField(key, option)}
                </Form.Item>
            })

        let initialValues: Record<string, any> = {}
        displays.forEach(({ key, defaultValue }) => {
            if (defaultValue) {
                initialValues[key] = defaultValue
            } else {
                const option = options[key]
                switch (option.type) {
                    case 'email':
                    case 'string':
                        initialValues[key] = ''
                        break
                    case 'choice':
                        initialValues[key] = option?.choices?.at(0)?.value
                        break
                    case 'integer':
                        initialValues[key] = option?.min_value || 0
                        break
                    case 'boolean':
                        initialValues[key] = false
                        break
                }
            }
        })

        return <>
            <Form
                form={form}
                id={id}
                name={id}
                initialValues={initialValues}
                labelCol={{ span: 4 }}
                onFinish={(data) => {
                    if (isMutating)
                        return
                    setLoading(true)
                    displays.forEach(({ key, convertValueTo }) => {
                        if (!data[key])
                            return
                        const option = options[key]
                        if (option.type === 'date')
                            data[key] = data[key].format('YYYY-MM-DD')

                        if (convertValueTo)
                            data[key] = convertValueTo(data[key])
                    })

                    const task = (async function () {
                        if (isEditing) {
                            await edit({ id: editId, body: data }).unwrap()
                        } else {
                            await add(data).unwrap()
                        }
                    })()
                    if (onFinish)
                        onFinish(task)
                    task.finally(() => {
                        setLoading(false)
                    })
                }}
            >
                {
                    fields
                }
            </Form>
            <Row gutter={8}>
                <Col flex='auto'></Col>
                {
                    actions.map((action, i) => (<Col key={i}>{action}</Col>))
                }
                <Col>
                    <Button
                        loading={loading}
                        key='submit' form={id} type="primary" htmlType="submit">
                        {editId ? 'Update' : 'Add'}
                    </Button>
                </Col>
            </Row>
        </>
    }

export default DjangoRestframeworkForm