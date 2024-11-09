import { Button, Form, notification } from 'antd';
import React, { useState } from 'react';
import hamstery from '../api/hamstery';
import { hamsterySlice } from '../api/hamsterySlice';
import DjangoRestframeworkForm from '../general/DjangoRestframeworkForm';

const PlexSettingsForm: React.FC<{
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
                        const { data } = await hamstery.testPlexConnection()
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
            { key: 'plex_enable', displayName: 'Enable', },
            { key: 'plex_url', displayName: 'URL', },
            {
                key: 'plex_token', displayName: 'X-Plex-Token',
                help: 'https://support.plex.tv/articles/204059436-finding-an-authentication-token-x-plex-token/',
            },
        ]} />
}

export default PlexSettingsForm