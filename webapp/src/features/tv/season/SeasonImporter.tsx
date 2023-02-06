import { Button, Form, Input, Modal, notification, Select, Table, Tabs } from 'antd';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { ITvEpisode, ITvSeason, TvEpisodeStatus } from '../../../app/entities';
import { useAppDispatch } from '../../../app/hook';
import { getEpNumber, isVideoFile, b64DecodeUnicode } from '../../../app/utils';
import hamstery, { IMediaResource } from '../../api/hamstery';
import { hamsterySlice } from '../../api/hamsterySlice';
import ApiLoading from '../../general/ApiLoading';
import PathSelector from '../../media/PathSelector';
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
  const [localImport, { isLoading }] = hamsterySlice.useImportTvEpisodeMutation()

  const chooseTab = <div>
    <PathSelector type='path' onChange={async (path) => {
      const { data } = await hamstery.listMedia(path)
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
    <Form.Item label='Import Mode' name='mode' initialValue='move'>
      <Select>
        <Select.Option key='move' value='move'>
          Move
        </Select.Option>
        <Select.Option key='link' value='link'>
          Link
        </Select.Option>
        <Select.Option key='symlink' value='symlink'>
          Symlink
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
                <Form.Item name={[index, 'path']} initialValue={item.key} hidden>
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
    <Button key='submit' form="importSeason" type="primary" loading={isLoading} htmlType="submit">Import</Button>
  </Form>

  const items = [
    {
      label: 'Choose videos',
      key: 'choose',
      children: chooseTab
    },
  ]
  if (imports.length !== 0) {
    items.push({
      label: 'Finish import',
      key: 'import',
      children: importTab
    })
  }

  return <Modal
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