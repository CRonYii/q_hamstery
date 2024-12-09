import { Button, Col, InputNumber, notification, Row } from 'antd'
import React, { useEffect, useState } from 'react'
import hamstery from '../api/hamstery'
import { LazyLog } from '@melloware/react-logviewer'
import { debounce } from 'lodash'

const LogsPage: React.FC = () => {
    const [lines, setLines] = useState(100)
    const [logs, setLogs] = useState('')
    useEffect(() => {
        hamstery.retrieveHamsteryLogs(lines)
            .then((res) => {
                const logs = res.data
                setLogs(logs)
            })
            .catch((err) => {
                console.error(err)
                notification.error({ message: 'Failed to retrieve logs from server.' })
            })
    }, [lines])
    return <>
        <Row gutter={8}>
            <Col>
                <InputNumber
                    addonBefore='Lines' prefix='#'
                    value={lines}
                    controls={false}
                    min={0}
                    onChange={debounce((val) => setLines(val != null ? val : 100), 500)}
                />
            </Col>
            <Col flex='auto'></Col>
            <Col>
                <Button type='primary'
                    href='/hamstery/api/logs/hamstery?file=true'
                >Download</Button>
            </Col>
        </Row>
        <Row>
            <Col span={24}>
                <div style={{ height: '80vh' }} >
                    <LazyLog
                        caseInsensitive
                        enableHotKeys
                        enableLineNumbers
                        enableLinks
                        enableSearch
                        wrapLines
                        text={logs}
                    />
                </div>
            </Col>
        </Row>
    </>
}

export default LogsPage