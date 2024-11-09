import { Col, Divider, Row, Typography } from 'antd'
import React from 'react'
import PlexSettingsForm from './PlexSettingsForm'
import QbittorrentSettingsForm from './QbittorrentSettingsForm'
import OpenAISettingsForm from './OpenAISettingsForm'

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
        <Row>
            <Col span={4}>
            </Col>
            <Col>
                <Typography.Title level={4}>OpenAI Integration Settings</Typography.Title>
            </Col>
        </Row>
        <OpenAISettingsForm id='open_ai_settings' />
        <Divider />
    </>
}

export default SettingsPage