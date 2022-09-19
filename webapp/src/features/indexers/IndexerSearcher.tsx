import { Input, Table } from 'antd';
import React, { useState } from 'react';
import { IndexerSearchResult } from '../../app/entities';
import { formatBytes } from '../../app/utils';

const IndexerSearcher: React.FC<{
    defaultKeyword?: string,
    onSearch: (keyword: string) => Promise<IndexerSearchResult[]>,
}> = ({ defaultKeyword, onSearch, }) => {
    const [data, setData] = useState<IndexerSearchResult[]>([])
    const [loading, setLoading] = useState<boolean>(false)
    return (<div>
        <Input.Search
            placeholder='keyword'
            enterButton="Search" size="large"
            defaultValue={defaultKeyword}
            loading={loading}
            onSearch={async (keyword) => {
                setLoading(true)
                setData(await onSearch(keyword))
                setLoading(false)
            }}
        />
        <Table
            rowKey='title'
            dataSource={data}
            columns={[
                {
                    title: 'Date',
                    dataIndex: 'pub_date',
                    sorter: (a: any, b: any) => (new Date(a.date).getTime() - new Date(b.date).getTime()),
                    render: (date) => new Date(date).toLocaleString(),
                },
                {
                    title: 'Title',
                    dataIndex: 'title',
                    sorter: (a: any, b: any) => a.title.localeCompare(b.title),
                },
                {
                    title: 'Size',
                    dataIndex: 'size',
                    render: bytes => formatBytes(bytes),
                },
            ]}
            rowSelection={{
                type: 'checkbox',
            }}
        />
    </div>)
}

export default IndexerSearcher