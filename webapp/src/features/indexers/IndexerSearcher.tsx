import { Button, Input, notification, Table } from 'antd';
import React, { useState } from 'react';
import { IndexerSearchResult, IndexerType } from '../../app/entities';
import { formatBytes } from '../../app/utils';
import hamstery from '../api/hamstery';

const IndexerSearcher: React.FC<{
    defaultKeyword?: string,
    indexer: { type?: IndexerType, searchId?: string, },
    onDownloadChosen?: (downlaods: IndexerSearchResult[]) => void,
}> = ({ defaultKeyword, indexer, onDownloadChosen }) => {
    const [data, setData] = useState<IndexerSearchResult[]>([])
    const [loading, setLoading] = useState<boolean>(false)

    const search = async (keyword: string) => {
        if (!indexer.searchId) {
            return []
        }
        switch (indexer.type) {
            case 'torznab': return (await hamstery.searchTorznabIndexer(indexer.searchId, keyword)).data
            default: return []
        }
    }

    return (<div>
        <Input.Search
            placeholder='keyword'
            enterButton={<Button type='primary' disabled={indexer.searchId === undefined} loading={loading}>Search</Button>}
            size="large"
            defaultValue={defaultKeyword}
            onSearch={async (keyword: string) => {
                setLoading(true)
                try {
                    setData(await search(keyword))
                } catch {
                    setData([])
                    notification.error({ message: 'Failed to search with indexer' })
                }
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
                onChange: (selectedRowKeys, selectedRows) => {
                    if (onDownloadChosen)
                        onDownloadChosen(selectedRows)
                }
            }}
        />
    </div>)
}

export default IndexerSearcher