import { Button, Form, Input, Modal, notification, Select, Table, Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { ITvEpisode, ITvSeason, TvEpisodeStatus } from '../../../app/entities';
import { useAppDispatch } from '../../../app/hook';
import { b64DecodeUnicode, getEpNumber, isVideoFile } from '../../../app/utils';
import hamstery, { IMediaResource } from '../../api/hamstery';
import { hamsterySlice } from '../../api/hamsterySlice';
import ApiLoading from '../../general/ApiLoading';
import { PathSelectorV2Modal } from '../../media/PathSelectorV2';
import { seasonActions, seasonImportSelector } from './seasonSlice';

const GlobalSeasonImporter: React.FC = () => {
  const info = useSelector(seasonImportSelector)
  if (!info.season)
    return <div />
  return <div>
    <ApiLoading getters={{
      'episodes': () => hamsterySlice.useGetTvEpisodesQuery({ season: info.season?.id })
    }}>
      {
        ({ values }) => {
          const episodes: ITvEpisode[] = values.episodes.data
          return <SeasonImporter season={info.season as ITvSeason} episodes={episodes} />
        }
      }
    </ApiLoading>
  </div>
}

const SeasonImporter: React.FC<{
  season: ITvSeason,
  episodes: ITvEpisode[],
}> = ({ season, episodes }) => {
  const dispatch = useAppDispatch()
  const info = useSelector(seasonImportSelector)
  const [files, setFiles] = useState<IMediaResource[]>([])
  const [imports, setImports] = useState<IMediaResource[]>([])
  const [episode_numbers, setEpisoedNumbers] = useState<Record<string, number>>({})
  const [loading_episode_numbers, setLoadingEpisodeNumbers] = useState<boolean>(false)
  const [localImport, { isLoading }] = hamsterySlice.useImportTvEpisodeMutation()

  const missingEps = useMemo(() => new Set(episodes
    .filter((e) => e.status === TvEpisodeStatus.MISSING)
    .map(e => e.episode_number)), [episodes])

  useEffect(() => {
    setLoadingEpisodeNumbers(true)
    Promise.all(imports.map(async (item) => {
      const episode_number = await getEpNumber(item.title)
      return { title: item.title, episode_number }
    })).then(episode_numbers => {
      const import_episode_numbers: Record<string, number> = {}
      episode_numbers.forEach(episode => {
        if (!missingEps.has(episode.episode_number)) {
          return
        }
        import_episode_numbers[episode.title] = episode.episode_number
      })
      setEpisoedNumbers(import_episode_numbers)
    })
      .finally(() => {
        setLoadingEpisodeNumbers(false)
      })
  }, [missingEps, imports])

  const chooseTab = <div>
    <PathSelectorV2Modal type='path' onChange={async (opt) => {
      const { data } = await hamstery.listMedia(opt.key)
      setFiles(data.file.filter((f) => isVideoFile(f.title)));
      setImports([])
    }} />
    <Table
      rowKey='title'
      columns={[
        {
          title: 'Title',
          dataIndex: 'title',
          sorter: (a: any, b: any) => a.title.localeCompare(b.title),
        },
      ]}
      dataSource={files}
      rowSelection={{
        type: 'checkbox',
        onChange: (selectedRowKeys, selectedRows) => setImports(selectedRows)
      }}
      pagination={{ defaultPageSize: 26, pageSizeOptions: ['13', '26', '52'] }}
    />
  </div>

  const importTab = <Form
    layout='vertical'
    id="importSeason"
    name="importSeason"
    labelCol={{ span: 24 }}
    onFinish={async (data: { episodes: { episode_number: number, path: string }[], mode: string }) => {
      try {
        const { mode } = data
        for (const { episode_number, path } of data.episodes) {
          const episode = episodes.find(ep => ep.episode_number === episode_number)
          if (episode) {
            await localImport({ id: String(episode.id), path: b64DecodeUnicode(path), mode }).unwrap()
          }
        }
        setImports([])
        dispatch(seasonActions.closeImport())
        notification.success({ message: 'Successfully imported episode' })
      } catch {
        notification.error({ message: 'Failed to import episode' })
      }
    }}
  >
    <Form.Item label='Import Mode' name='mode' rules={[
      { required: true }
    ]}>
      <Select>
        <Select.Option key='link' value='link'>
          Link
        </Select.Option>
        <Select.Option key='symlink' value='symlink'>
          Symlink
        </Select.Option>
        <Select.Option key='move' value='move'>
          Move
        </Select.Option>
      </Select>
    </Form.Item>
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
          {imports
            .map((item, index) => {
              return <Form.Item key={item.title}>
                <Form.Item name={[index, 'title']} initialValue={item.title} hidden>
                  <Input />
                </Form.Item>
                <Form.Item name={[index, 'path']} initialValue={item.key} hidden>
                  <Input />
                </Form.Item>
                <Form.Item label={item.title} name={[index, 'episode_number']} initialValue={episode_numbers[item.title]}>
                  <Select>
                    {
                      [...missingEps.values()]
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
    <Button key='submit' form="importSeason" type="primary" loading={isLoading} htmlType="submit">Import</Button>
  </Form>

  const items = [
    {
      label: 'Choose videos',
      key: 'choose',
      children: chooseTab
    },
  ]
  if (!loading_episode_numbers && imports.length !== 0) {
    items.push({
      label: 'Finish import',
      key: 'import',
      children: importTab
    })
  }

  return <Modal
    maskClosable={false}
    title={`Import to ${season.name}`}
    style={{ minWidth: '60vw' }}
    open={info.import}
    onCancel={() => {
      dispatch(seasonActions.closeImport())
    }}
    footer={null}
  >
    <Tabs
      items={items} />
  </Modal>
}

export default GlobalSeasonImporter