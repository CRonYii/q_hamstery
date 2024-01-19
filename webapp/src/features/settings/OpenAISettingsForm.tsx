import { Form, Select } from 'antd';
import React, { useEffect, useState } from 'react';
import hamstery from '../api/hamstery';
import { hamsterySlice } from '../api/hamsterySlice';
import DjangoRestframeworkForm from '../general/DjangoRestframeworkForm';

const OpenAISettingsForm: React.FC<{
    id: string,
    onFinish?: (task: Promise<void>) => void,
}> = ({ id, onFinish }) => {
    const [form] = Form.useForm()
    const [models, setModels] = useState<{ label: string, value: string }[]>([])
    useEffect(() => {
        hamstery.getOpenAIModels()
            .then(({ data }) => {
                const models = data.models.sort((a, b) => b.created - a.created)
                return setModels(models.map((model) => {
                    return {
                        label: model.id,
                        value: model.id,
                    }
                }))
            })
    }, [])
    return <DjangoRestframeworkForm
        form={form}
        id={id} editId={'1'}
        onFinish={onFinish}
        get={hamsterySlice.useGetSettingsQuery}
        addMutation={hamsterySlice.useAddSettingsMutation}
        editMutation={hamsterySlice.useEditSettingsMutation}
        getOptions={hamsterySlice.useGetSettingsOptionsQuery}
        extras={{}}
        actions={[]}
        displays={[
            { key: 'id', displayName: 'ID', hidden: true },
            {
                key: 'openai_api_key', displayName: 'OpenAI API Key',
                help: 'Please keep in mind that using OpenAI API has a cost.'
            },
            {
                key: 'openai_title_parser_mode', displayName: 'ChatGPT Title Parsing Mode',
                help: 'To use ChatGPT to extract episode number from video title. Which has better accuracy but run slower than traditonal Regex handling. Primary means ChatGPT is always used for Title Parsing and RegEx is only used as a fallback solution. Standby means the other way.'
            },
            {
                key: 'openai_title_parser_model', displayName: 'ChatGPT Title Parsing Model',
                help: 'The model that will be used to handle title parsing. ',
                customRender: () => {
                    return <Select
                        showSearch
                        options={models}
                    />
                }
            }
        ]} />
}

export default OpenAISettingsForm