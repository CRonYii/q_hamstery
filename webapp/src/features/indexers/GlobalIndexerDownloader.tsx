import { Button, Col, Form, Input, Modal, notification, Row, Select, Tabs } from 'antd';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { IIndexer, IndexerSearchResult, ITvEpisode, TvEpisodeStatus } from '../../app/entities';
import { useAppDispatch } from '../../app/hook';
import { getEpNumber } from '../../app/utils';
import { hamsterySlice } from '../api/hamsterySlice';
import ApiLoading from '../general/ApiLoading';
import IndexerSearcher from './IndexerSearcher';
import { indexerActions, indexerSelector } from './indexerSlice';

const GlobalIndexerDownloader: React.FC = () => {
  const indexer = useSelector(indexerSelector)
  if (!indexer.season)
    return <div />
  return <div>
    <ApiLoading getters={{
      'indexers': hamsterySlice.useGetIndexersQuery,
      'episodes': () => hamsterySlice.useGetTvEpisodesQuery({ season: indexer.season?.id })
    }}>
      {
        ({ values }) => {
          const indexers: IIndexer[] = values.indexers.data
          const episodes: ITvEpisode[] = values.episodes.data
          return <EpisodeDownloader key={indexer.season?.id} indexers={indexers} episodes={episodes} />
        }
      }
    </ApiLoading>
  </div>
}

const EpisodeDownloader: React.FC<{
  indexers: IIndexer[],
  episodes: ITvEpisode[],
}> = ({ indexers, episodes }) => {
  const dispatch = useAppDispatch()
  const indexer = useSelector(indexerSelector)
  const [searcher, setSearcher] = useState<string | undefined>()
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
          options={indexers.map(({ name }, idx) => ({ label: `${name}`, value: idx }))}
          onChange={(idx) => {
            const { id } = indexers[idx]
            setSearcher(String(id))
            setDownloads([])
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
              indexerId={searcher}
              onDownloadChosen={(downloads) => {
                setDownloads(downloads)
              }}
            />
            : null}

      </Col>
    </Row>
  </div>

  const startDownloadTab = <Form
    layout='vertical'
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
        setDownloads([])
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
          }
        }
      ]}>
      {(_, __, { errors }) =>
        <div>
          {downloads
            .map((item, index) => {
              const missingEps = episodes
                .filter((e) => e.status === TvEpisodeStatus.MISSING)
                .map(e => e.episode_number)
              let guessEp = getEpNumber(item.title)
              if (!missingEps.some(n => n === guessEp)) {
                guessEp = undefined
              }
              return <Form.Item key={item.title}>
                <Form.Item name={[index, 'title']} initialValue={item.title} hidden>
                  <Input />
                </Form.Item>
                <Form.Item name={[index, 'link']} initialValue={item.link} hidden>
                  <Input />
                </Form.Item>
                <Form.Item label={item.title} name={[index, 'episode_number']} initialValue={guessEp}>
                  <Select>
                    {
                      missingEps
                        .map((n) => <Select.Option key={n} value={n}>EP {n}</Select.Option>)
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

  const items = [
    {
      label: 'Search',
      key: 'search',
      children: searchTab
    },
  ]
  if (downloads.length !== 0) {
    items.push({
      label: 'Start Download',
      key: 'download',
      children: startDownloadTab
    })
  }

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
      items={items} />

  </Modal>
}

export default GlobalIndexerDownloader