import { Col, Divider, Row, Typography } from 'antd'
import React from 'react'
import PlexSettingsForm from './PlexSettingsForm'
import QbittorrentSettingsForm from './QbittorrentSettingsForm'

const SettingsPage: React.FC = () => {
    return <>
        <Row>
            <Col span={4}>
            </Col>
            <Col>
                <Typography.Title level={4}>qBittorrent Settings</Typography.Title>
            </Col>
        </Row>
        <QbittorrentSettingsForm id='qbt_settings' />
        <Divider />
        <Row>
            <Col span={4}>
            </Col>
            <Col>
                <Typography.Title level={4}>Plex Integration Settings</Typography.Title>
            </Col>
        </Row>
        <PlexSettingsForm id='plex_settings' />
        <Divider />
    </>
}

export default SettingsPage