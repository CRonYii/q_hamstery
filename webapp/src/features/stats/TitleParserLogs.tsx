import { CheckCircleTwoTone, CloseCircleTwoTone } from '@ant-design/icons';
import { Divider, Table, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import React from 'react';
import { ITitleParserLog } from '../../app/entities';
import { IPageNumberResult } from '../api/hamsterySlice';

const columns: ColumnsType<ITitleParserLog> = [
    {
        title: 'Model',
        dataIndex: 'model',
        key: 'model',
    },
    {
        title: 'Title',
        dataIndex: 'title',
        key: 'title',
    },
    {
        title: 'Result',
        dataIndex: 'episode_number',
        key: 'episode_number',
        filters: [{ text: 'Success', value: true }, { text: "Failed", value: false }],
        onFilter: (value, entry) => value ? entry.episode_number !== 0 : entry.episode_number === 0,
        render: (_, entry) => {
            if (entry.episode_number) {
                return <>
                    <CheckCircleTwoTone twoToneColor="#52c41a" /> {entry.episode_number}
                </>
            } else {
                return <>
                    <CloseCircleTwoTone twoToneColor="#eb2f96" /> {entry.exception}
                </>
            }
        }
    },
    {
        title: 'Tokens Used',
        dataIndex: 'tokens_used',
        key: 'tokens_used',
    },
    {
        title: 'Time',
        dataIndex: 'time',
        key: 'time',
    },
];

const TitleParserLogs: React.FC<{
    logs: IPageNumberResult<ITitleParserLog>,
    onPageChange: (page: number, pageSize: number) => void,
}> = ({ logs, onPageChange }) => {
    return <>
        <Typography.Title level={5}>Logs</Typography.Title>
        <Table columns={columns} dataSource={logs.results} pagination={{
            total: logs.count,
            current: logs.page,
            onChange: onPageChange,
        }} />
        <Divider />
    </>
}

export default TitleParserLogs