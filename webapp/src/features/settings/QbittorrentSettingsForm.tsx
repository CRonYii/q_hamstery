import { Form, Input } from 'antd';
import React from 'react';
import { hamsterySlice } from '../api/hamsterySlice';
import DjangoRestframeworkForm from '../general/DjangoRestframeworkForm';

const QbittorrentSettingsForm: React.FC<{
    id: string,
    onFinish?: (task: Promise<void>) => void,
}> = ({ id, onFinish }) => {
    const [form] = Form.useForm()
    return <DjangoRestframeworkForm
        form={form}
        id={id} editId={'1'}
        onFinish={onFinish}
        get={hamsterySlice.useGetSettingsQuery}
        addMutation={hamsterySlice.useAddSettingsMutation}
        editMutation={hamsterySlice.useEditSettingsMutation}
        getOptions={hamsterySlice.useGetSettingsOptionsQuery}
        extras={{}}
        displays={[
            { key: 'id', displayName: 'ID', hidden: true },
            { key: 'qbittorrent_host', displayName: 'Host', },
            { key: 'qbittorrent_port', displayName: 'Port', },
            {
                key: 'qbittorrent_username', displayName: ' Username',
                help: 'If you have whitelisted Hamstery in qBittorrent, you can leave username and password empty',
            },
            {
                key: 'qbittorrent_password', displayName: 'Password',
                help: 'Be aware: Password is stored as cleartext and can be stolen in the case of data breach',
                customRender: (data) => {
                    return <Input.Password value={data} autoComplete='new-password' />
                },
            },
        ]} />
}

export default QbittorrentSettingsForm