import { Button, Col, Divider, Row, Statistic, Typography } from 'antd'
import React, { useState } from 'react'
import { IHamsteryStats, ITitleParserLog } from '../../app/entities'
import { useAppDispatch } from '../../app/hook'
import hamstery from '../api/hamstery'
import { hamsterySlice, IPageNumberResult } from '../api/hamsterySlice'
import ApiLoading from '../general/ApiLoading'
import TitleParserLogs from './TitleParserLogs'

interface IStat {
    title: string,
    data: {
        name: string, value: number
    }[][],
    reset?: () => Promise<void>,
}

const Stats: React.FC<{ stats: IStat[] }> = ({ stats }) => {
    const [loading, setLoading] = useState<boolean>(false)
    return <>
        {stats.map(stat => {
            return <div key={stat.title}>
                <Row gutter={16}>
                    <Col>
                        <Typography.Title level={4}>{stat.title}</Typography.Title>
                    </Col>
                    {
                        stat.reset ?
                            <Col>
                                <Button onClick={async () => {
                                    if (!stat.reset)
                                        return
                                    setLoading(true)
                                    await stat.reset()
                                    setLoading(false)
                                }}>Reset</Button>
                            </Col>
                            : null
                    }
                </Row>
                {stat.data.map((row, index) => {
                    return <Row key={index} gutter={16}>
                        {row.map(col => {
                            return <Col key={col.name} span={6}>
                                <Statistic title={col.name} value={col.value} loading={loading} />
                            </Col>
                        })}
                    </Row>
                })}
                <Divider />
            </div>
        })}

    </>
}

const StatsPage: React.FC = () => {
    const dispatch = useAppDispatch()
    const [page, setPage] = useState({ page: 1, page_size: 25 })
    const resetStats = () => {
        dispatch(hamsterySlice.util.invalidateTags([{ type: 'stats', id: '1' }]))
    }

    return <ApiLoading getters={{
        'stats': () => hamsterySlice.useGetStatsQuery('1'),
        'title_parser_logs': () => hamsterySlice.useGetTitleParserPageQuery({
            ordering: '-id',
            ...page,
        }),
    }}>
        {
            ({ values }) => {
                const stats: IHamsteryStats = values.stats.data
                const titleParserLogs: IPageNumberResult<ITitleParserLog> = values.title_parser_logs.data
                return <div>
                    <Stats stats={[
                        {
                            title: 'OpenAI Title Parser',
                            data: [
                                [{ name: 'API Calls', value: stats.openai_title_parser_calls }, { name: 'API Failures', value: stats.openai_title_parser_failures },],
                                [{ name: 'Total Tokens Used', value: stats.openai_title_parser_total_tokens_used }, { name: 'Pormpt Tokens Used', value: stats.openai_title_parser_prompt_tokens_used }, { name: 'Completion Tokens Used', value: stats.openai_title_parser_completion_tokens_used },],
                            ],
                            reset: async () => {
                                await hamstery.resetTitleParserStats()
                                resetStats()
                            }
                        },
                    ]} />
                    <TitleParserLogs
                        logs={titleParserLogs}
                        onPageChange={(page, pageSize) => {
                            setPage({ page, page_size: pageSize })
                        }}
                    />
                </div>
            }
        }
    </ApiLoading>
}

export default StatsPage