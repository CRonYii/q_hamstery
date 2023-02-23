import { Button, Form, Input, notification } from 'antd';
import React, { useState } from 'react';
import hamstery from '../api/hamstery';
import { hamsterySlice } from '../api/hamsterySlice';
import DjangoRestframeworkForm from '../general/DjangoRestframeworkForm';

const QbittorrentSettingsForm: React.FC<{
    id: string,
    onFinish?: (task: Promise<void>) => void,
}> = ({ id, onFinish }) => {
    const [form] = Form.useForm()
    const [testing, setTesting] = useState<boolean>(false)
    return <DjangoRestframeworkForm
        form={form}
        id={id} editId={'1'}
        onFinish={onFinish}
        get={hamsterySlice.useGetSettingsQuery}
        addMutation={hamsterySlice.useAddSettingsMutation}
        editMutation={hamsterySlice.useEditSettingsMutation}
        getOptions={hamsterySlice.useGetSettingsOptionsQuery}
        extras={{}}
        actions={[
            <Button
                loading={testing}
                onClick={async () => {
                    try {
                        setTesting(true)
                        const { data } = await hamstery.testQbtConnection()
                        const { status, message } = data
                        if (status) {
                            notification.success({
                                message,
                            })
                        } else {
                            notification.error({
                                message,
                                duration: 0,
                            })
                        }
                    } catch {
                        notification.error({
                            message: 'Server error',
                            duration: 0,
                        })
                    } finally {
                        setTesting(false)
                    }

                }}
            >Test Connection (Update before testing)</Button>
        ]}
        displays={[
            { key: 'id', displayName: 'ID', hidden: true },
            { key: 'qbittorrent_host', displayName: 'URL', },
            { key: 'qbittorrent_port', displayName: 'Port', },
            {
                key: 'qbittorrent_username', displayName: 'Username',
                help: 'You can leave username and password empty if you have whitelisted Hamstery in qBittorrent',
            },
            {
                key: 'qbittorrent_password', displayName: 'Password',
                help: 'Be aware: Password is stored as cleartext and can be stolen in the event of data breach',
                customRender: (data) => {
                    return <Input.Password value={data} autoComplete='new-password' />
                },
            },
        ]} />
}

export default QbittorrentSettingsForm