import { InboxOutlined } from '@ant-design/icons';
import { Button, Form, Input, notification, Upload } from "antd";
import React from "react";

export interface IDownloaderProps {
    id: string,
    onDownload: (data: string | File) => Promise<any>,
    isLoading?: boolean,
}

export const MagnetUrlDownloader: React.FC<IDownloaderProps> = ({
    id, onDownload, isLoading,
}) => {
    return <Form
        layout='vertical'
        id={id}
        name={id}
        labelCol={{ span: 24 }}
        onFinish={(data) => {
            if (!data.magneturl) {
                notification.error({ message: 'Magnet URL is empty' })
                return
            }
            onDownload(data.magneturl)
        }}
    >
        <Form.Item name="magneturl" label="Magnet URL"
            rules={[
                { required: true },
                {
                    type: 'string', validator: async (_, url) => {
                        if (!url || !url.startsWith('magnet:'))
                            return Promise.reject('Invalid Magnet URL')
                    }
                },
            ]}
        >
            <Input />
        </Form.Item>
        <Form.Item>
            <Button key='submit' form={id} type="primary" htmlType="submit" loading={isLoading}>Download</Button>
        </Form.Item>
    </Form>
}

const normFile = (e: any) => {
    return e?.file;
};

export const TorrentFileDownloader: React.FC<IDownloaderProps> = ({
    id, onDownload, isLoading,
}) => {
    return <Form
        layout='vertical'
        id={id}
        name={id}
        labelCol={{ span: 24 }}
        onFinish={(data) => {
            if (!data.torrent) {
                notification.error({ message: 'File is empty' })
                return
            }
            onDownload(data.torrent)
        }}
    >
        <Form.Item name="torrent" label="Torrent File" getValueFromEvent={normFile}
            rules={[
                { required: true },
            ]}
        >
            <Upload.Dragger
                name='file'
                multiple={false}
                beforeUpload={() => false}
            >
                <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag file to this area to upload</p>
            </Upload.Dragger>
        </Form.Item>
        <Form.Item>
            <Button key='submit' form={id} type="primary" htmlType="submit" loading={isLoading}>Download</Button>
        </Form.Item>
    </Form>
}

