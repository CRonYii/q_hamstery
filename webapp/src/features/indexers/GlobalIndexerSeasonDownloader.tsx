import { Button, Checkbox, Col, Modal, notification, Radio, Row, Select, Tooltip } from 'antd';
import axios from 'axios';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { IIndexer, IndexerSearchResult, ITvSeason } from '../../app/entities';
import { useAppDispatch } from '../../app/hook';
import { hamsterySlice } from '../api/hamsterySlice';
import ApiLoading from '../general/ApiLoading';
import IndexerSearcher from './IndexerSearcher';
import { indexerActions, indexerSelector } from './indexerSlice';
import { MagnetUrlDownloader, TorrentFileDownloader } from '../media/Downloader';

const GlobalIndexerSeasonDownloader: React.FC = () => {
  const indexer = useSelector(indexerSelector)
  if (!indexer.season || indexer.type !== 'season')
    return <div />
  return <div>
    <ApiLoading getters={{
      'indexers': hamsterySlice.useGetIndexersQuery,
    }}>
      {
        ({ values }) => {
          if (!indexer.season)
            return <div />
          const indexers: IIndexer[] = values.indexers.data
          return <SeasonDownloader key={indexer.season.id} indexers={indexers} season={indexer.season} />
        }
      }
    </ApiLoading>
  </div>
}

const SeasonDownloader: React.FC<{
  indexers: IIndexer[],
  season: ITvSeason,
}> = ({ indexers, season }) => {
  const dispatch = useAppDispatch()
  const indexer = useSelector(indexerSelector)
  const [searcher, setSearcher] = useState<string | undefined>()
  const [download, setDownload] = useState<IndexerSearchResult | undefined>()
  const [hamsteryDownloadSeason, { isLoading }] = hamsterySlice.useDownloadTvSeasonMutation()
  const [downloadMode, setDownloadMode] = useState<'search' | 'magnet' | 'torrent_file'>('search')
  const [importExternal, setImportExternal] = useState<boolean>(false)

  async function downloadSeason(download: IndexerSearchResult) {
    try {
      const { title, magneturl, link } = download;
      if (magneturl) {
        await hamsteryDownloadSeason({ id: String(season.id), data: magneturl, importExternal }).unwrap()
      } else if (link.startsWith('magnet:')) {
        await hamsteryDownloadSeason({ id: String(season.id), data: link, importExternal }).unwrap()
      } else if (link.startsWith('http://') || link.startsWith('https://')) {
        const { data } = await axios.get(link, {
          responseType: 'blob',
        })
        const file = new File([data], title + '.torrent')
        await hamsteryDownloadSeason({ id: String(season.id), data: file, importExternal }).unwrap()
      }
      setDownload(undefined)
      dispatch(indexerActions.closeSearch())
    } catch {
      notification.error({ message: 'Failed to start download' })
    }
  }

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
              setDownload(undefined)
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
                selection='radio'
                onDownloadChosen={(downloads) => {
                  setDownload(downloads[0])
                }}
              />
              : null}

        </Col>
      </Row>
      <Row>
        <Col flex='auto'>
        </Col>
        <Col>
          <Button type="primary" loading={isLoading} disabled={!download}
            onClick={() => download ? downloadSeason(download) : null}
          >Download</Button>
        </Col>
      </Row>
    </>,
    'magnet': <>
      <MagnetUrlDownloader
        id={`downloadMagnetSeason-${indexer.season?.id}`}
        onDownload={async (magneturl) => {
          if (!indexer.season) {
            notification.error({ message: 'Downloading to unknown Season' })
            return
          }
          try {
            await hamsteryDownloadSeason({ id: String(season.id), data: magneturl, importExternal }).unwrap()
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
        id={`downloadTorrentSeason-${indexer.season?.id}`}
        onDownload={async (file) => {
          if (!indexer.season) {
            notification.error({ message: 'Downloading to unknown Season' })
            return
          }
          try {
            await hamsteryDownloadSeason({ id: String(season.id), data: file, importExternal }).unwrap()
            dispatch(indexerActions.closeSearch())
          } catch (e: any) {
            notification.error({ message: `Failed to strat download: ${e.data}` })
          }
        }}
        isLoading={isLoading}
      />
    </>,
  }

  return <Modal
    title={`Download to ${indexer.defaultQuery} - ${indexer.season?.name}`
    }
    style={{ minWidth: '60vw' }}
    maskClosable={false}
    open={indexer.search === 'download'}
    onCancel={() => {
      dispatch(indexerActions.closeSearch())
    }}
    footer={null}
  >
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
  </Modal >
}

export default GlobalIndexerSeasonDownloader