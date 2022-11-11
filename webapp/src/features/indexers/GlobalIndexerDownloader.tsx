import { Button, Col, Form, Input, Modal, notification, Row, Select, Tabs } from 'antd';
import concat from 'lodash/concat';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { IndexerSearchResult, IndexerType, ITorznabIndexer, ITvEpisode, TvEpisodeStatus } from '../../app/entities';
import { useAppDispatch } from '../../app/hook';
import { getEpNumber } from '../../app/utils';
import { hamsterySlice } from '../api/hamsterySlice';
import ApiLoading from '../general/ApiLoading';
import IndexerSearcher from './IndexerSearcher';
import { indexerActions, indexerSelector } from './indexerSlice';

const GlobalIndexerDownloader: React.FC = () => {
  const indexer = useSelector(indexerSelector)

  return <div>
    <ApiLoading getters={{
      'torznab': hamsterySlice.useGetTorznabIndexersQuery,
      'episodes': () => hamsterySlice.useGetTvEpisodesQuery({ season: indexer.season?.id })
    }}>
      {
        ({ values }) => {
          const torznab: ITorznabIndexer[] = values.torznab.data
          const indexers: { type: IndexerType, id: number, name: string }[] = concat(torznab.map(({ id, name }) => ({ type: 'torznab', id, name })))
          const episodes: ITvEpisode[] = values.episodes.data
          return <EpisodeDownloader key={indexer.season?.id} indexers={indexers} episodes={episodes} />
        }
      }
    </ApiLoading>
  </div>
}

const EpisodeDownloader: React.FC<{
  indexers: { type: IndexerType, id: number, name: string }[],
  episodes: ITvEpisode[],
}> = ({ indexers, episodes }) => {
  const dispatch = useAppDispatch()
  const indexer = useSelector(indexerSelector)
  const [searcher, setSearcher] = useState<{ type: IndexerType, searchId: string } | undefined>()
  const [downloads, setDownloads] = useState<IndexerSearchResult[]>([])
  const [download, { isLoading }] = hamsterySlice.useDownloadTvEpisodeMutation()

  const searchTab = <div>
    <Row gutter={8} align='middle'>
      <Col>Choose Indexer: </Col>
      <Col flex='auto'>
        <Select
          showSearch
          style={{ width: '100%' }}
          filterOption={(input, option) => (option?.label as unknown as string).toLowerCase().includes(input)}
          options={indexers.map(({ type, name }, idx) => ({ label: `${type} - ${name}`, value: idx }))}
          onChange={(idx) => {
            const { type, id } = indexers[idx]
            setSearcher({ type, searchId: String(id) })
          }}
        />
      </Col>
    </Row>
    <Row>
      <Col flex='auto'>
        {
          searcher
            ? <IndexerSearcher
              defaultKeyword={indexer.defaultQuery}
              indexer={searcher}
              onDownloadChosen={(downloads) => setDownloads(downloads)}
            />
            : null}

      </Col>
    </Row>
  </div>

  const startDownloadTab = <Form
    id="downloadShows"
    name="downloadShows"
    labelCol={{ span: 24 }}
    onFinish={async (data: { episodes: { episode_number: number, link: string }[] }) => {
      try {
        for (const { episode_number, link } of data.episodes) {
          const episode = episodes.find(ep => ep.episode_number === episode_number)
          if (episode) {
            await download({ id: String(episode.id), url: link }).unwrap()
          }
        }
        dispatch(indexerActions.closeSearch())
      } catch {
        notification.error({ message: 'Failed to start download' })
      }
    }}
  >
    <Form.List name="episodes"
      rules={[
        {
          validator: async (_, downloads: { episode_number: number }[]) => {
            if (downloads.some(download => download.episode_number === undefined))
              return Promise.reject(new Error('You must choose an episode for each resource selected.'));
            if (new Set(downloads.map(download => download.episode_number)).size !== downloads.length)
              return Promise.reject(new Error('Cannot download multiple resouces for a single episode.'));
          }
        }
      ]}>
      {(_, __, { errors }) =>
        <div>
          {downloads
            .map((item, index) => {
              const guessEp = Number(getEpNumber(item.title));
              return <Form.Item key={item.title}>
                <Form.Item name={[index, 'link']} initialValue={item.link} hidden>
                  <Input />
                </Form.Item>
                <Form.Item label={item.title} name={[index, 'episode_number']} initialValue={guessEp === 0 ? undefined : guessEp}>
                  <Select>
                    {
                      episodes
                        .filter((e) => e.status === TvEpisodeStatus.MISSING)
                        .map((e) => <Select.Option key={e.episode_number} value={e.episode_number}>EP {e.episode_number}</Select.Option>)
                    }
                  </Select>
                </Form.Item>
              </Form.Item>
            })
          }
          <Form.ErrorList errors={errors} />
        </div>
      }
    </Form.List>
    <Button key='submit' form="downloadShows" type="primary" htmlType="submit" loading={isLoading}>Download</Button>
  </Form>

  return <Modal
    title={`Download to ${indexer.defaultQuery} - ${indexer.season?.name}`}
    style={{ minWidth: '60vw' }}
    open={indexer.search === 'download'}
    onCancel={() => {
      dispatch(indexerActions.closeSearch())
    }}
    footer={null}
  >
    <Tabs
      items={[
        {
          label: 'Search',
          key: 'search',
          children: searchTab
        },
        {
          label: 'Start Download',
          key: 'download',
          children: startDownloadTab
        }
      ]} />

  </Modal>
}

export default GlobalIndexerDownloader