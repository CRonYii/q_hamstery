import { Button, Checkbox, Col, Form, Input, Modal, notification, Radio, Row, Select, Tabs, Tooltip } from 'antd';
import axios from 'axios';
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { IIndexer, IndexerSearchResult, ITvEpisode, TvEpisodeStatus } from '../../app/entities';
import { useAppDispatch } from '../../app/hook';
import { getEpNumber } from '../../app/utils';
import { hamsterySlice } from '../api/hamsterySlice';
import ApiLoading from '../general/ApiLoading';
import { MagnetUrlDownloader, TorrentFileDownloader } from '../media/Downloader';
import IndexerSearcher from './IndexerSearcher';
import { indexerActions, indexerSelector } from './indexerSlice';

const GlobalIndexerDownloader: React.FC = () => {
  const indexer = useSelector(indexerSelector)
  if (!indexer.season || indexer.type !== 'episode')
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
  const [episode_numbers, setEpisoedNumbers] = useState<Record<string, number>>({})
  const [downloadMode, setDownloadMode] = useState<'search' | 'magnet' | 'torrent_file'>('search')
  const [importExternal, setImportExternal] = useState<boolean>(false)

  const missingEps = useMemo(() => episodes
    .filter((e) => e.status === TvEpisodeStatus.MISSING), [episodes])

  useEffect(() => {
    Promise.all(downloads.map(async (item) => {
      const episode_number = await getEpNumber(item.title)
      return { title: item.title, episode_number }
    })).then(episode_numbers => {
      const import_episode_numbers: Record<string, number> = {}
      episode_numbers.forEach(episode => {
        if (!missingEps.some((e) => e.episode_number === episode.episode_number)) {
          return
        }
        import_episode_numbers[episode.title] = episode.episode_number
      })
      setEpisoedNumbers(import_episode_numbers)
    })
  }, [missingEps, downloads])

  const downloadPages = {
    'search': <>
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
                selection='checkbox'
              />
              : null}

        </Col>
      </Row>
    </>,
    'magnet': <>
      <MagnetUrlDownloader
        id={`downloadMagnetShows-${indexer.episode?.id}`}
        onDownload={async (magneturl) => {
          if (!indexer.episode) {
            notification.error({ message: 'Downloading to unknown Episode' })
            return
          }
          try {
            await download({ id: String(indexer.episode.id), data: magneturl, importExternal }).unwrap()
            dispatch(indexerActions.closeSearch())
          } catch (e: any) {
            notification.error({ message: `Failed to strat download: ${e.data}` })
          }
        }}
        isLoading={isLoading}
      />
    </>,
    'torrent_file': <>
      <TorrentFileDownloader
        id={`downloadTorrentShows-${indexer.episode?.id}`}
        onDownload={async (file) => {
          if (!indexer.episode) {
            notification.error({ message: 'Downloading to unknown Episode' })
            return
          }
          try {
            await download({ id: String(indexer.episode.id), data: file, importExternal }).unwrap()
            dispatch(indexerActions.closeSearch())
          } catch (e: any) {
            notification.error({ message: `Failed to strat download: ${e.data}` })
          }
        }}
        isLoading={isLoading}
      />
    </>,
  }

  const selectDownloadTab = <div>
    <Row gutter={8} align='middle'>
      <Col span={8} offset={8}>
        <Radio.Group
          defaultValue='search'
          buttonStyle='solid'
          value={downloadMode}
          onChange={(e) => {
            setDownloadMode(e.target.value)
          }}
        >
          <Radio.Button value='search'>Search</Radio.Button>
          <Radio.Button value='magnet'>Magnet URL</Radio.Button>
          <Radio.Button value='torrent_file'>Torrent File</Radio.Button>
        </Radio.Group>
      </Col>
      <Col flex='auto'></Col>
      <Col>
        <Tooltip title="Import an existing download in qbittorrent to hamstery. Hamstery will take control of it.">
          <Checkbox value={importExternal} onChange={(e) => setImportExternal(e.target.checked)}>
            Import Existing Download
          </Checkbox>
        </Tooltip>
      </Col>
    </Row>
    {downloadPages[downloadMode]}
  </div>

  const startDownloadTab = <Form
    layout='vertical'
    id="downloadShows"
    name="downloadShows"
    labelCol={{ span: 24 }}
    onFinish={async (data: { episodes: { title: string, episode_number: number, link: string, magneturl: string }[] }) => {
      try {
        for (const { title, episode_number, link, magneturl } of data.episodes) {
          const episode = episodes.find(ep => ep.episode_number === episode_number)
          if (!episode)
            continue
          if (magneturl) {
            await download({ id: String(episode.id), data: magneturl, importExternal }).unwrap()
          } else if (link.startsWith('magnet:')) {
            await download({ id: String(episode.id), data: link, importExternal }).unwrap()
          } else if (link.startsWith('http://') || link.startsWith('https://')) {
            const { data } = await axios.get(link, {
              responseType: 'blob',
            })
            const file = new File([data], title + '.torrent')
            await download({ id: String(episode.id), data: file, importExternal }).unwrap()
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
              return <Form.Item key={item.title}>
                <Form.Item name={[index, 'title']} initialValue={item.title} hidden>
                  <Input />
                </Form.Item>
                <Form.Item name={[index, 'link']} initialValue={item.link} hidden>
                  <Input />
                </Form.Item>
                <Form.Item name={[index, 'magneturl']} initialValue={item.magneturl} hidden>
                  <Input />
                </Form.Item>
                <Form.Item label={item.title} name={[index, 'episode_number']} initialValue={episode_numbers[item.title]}>
                  <Select>
                    {
                      [...missingEps.values()]
                        .map(({ episode_number, name }) => <Select.Option key={episode_number} value={episode_number}>EP{episode_number} - {name}</Select.Option>)
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
      label: 'Select Download',
      key: 'select',
      children: selectDownloadTab
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
    maskClosable={false}
    open={indexer.search === 'download'}
    onCancel={() => {
      dispatch(indexerActions.closeSearch())
    }}
    footer={null}
  >
    <Tabs defaultActiveKey='select' centered items={items} />
  </Modal>
}

export default GlobalIndexerDownloader