import { CheckCircleTwoTone, CloudDownloadOutlined, DeleteTwoTone, EditOutlined } from '@ant-design/icons';
import { Button, Cascader, Col, Form, Input, List, notification, Popconfirm, Row, Select, Skeleton, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { IFileInfo, ISeasonDownload, ITvDownload, ITvEpisode, ITvSeason, ITvShow } from '../../../app/entities';
import { useAppDispatch } from '../../../app/hook';
import { filePathsToTree, formatBytes, getEpNumber, secondsToDhms, treeSelectNode, treeToCascaderOptions } from '../../../app/utils';
import { hamsterySlice } from '../../api/hamsterySlice';
import ApiLoading from '../../general/ApiLoading';
import { indexerActions } from '../../indexers/indexerSlice';
import { bundleActions } from './bundleSlice';
import hamstery from '../../api/hamstery';

const { Text } = Typography;

const TVBundleDownloadPage: React.FC = () => {
  const params = useParams()
  const show_id = params.show_id as string
  const season_id = params.season_id as string

  return <ApiLoading getters={{
    'show': () => hamsterySlice.useGetTvShowQuery(show_id),
    'season': () => hamsterySlice.useGetTvSeasonQuery(season_id),
    'downloads': () => hamsterySlice.useGetSeasonDownloadsQuery({ season: season_id }, { pollingInterval: 1000 }),
  }}>
    {
      ({ values }) => {
        const show: ITvShow = values.show.data
        const season: ITvSeason = values.season.data
        const downloads: ISeasonDownload[] = values.downloads.data
        return <TVSeasonBundles show={show} season={season} downloads={downloads} />
      }
    }
  </ApiLoading>
}

export default TVBundleDownloadPage

const TVSeasonBundles: React.FC<{ show: ITvShow, season: ITvSeason, downloads: ISeasonDownload[] }> = ({ show, season, downloads }) => {
  const dispatch = useAppDispatch()

  return <div>
    <Row gutter={12} style={{ margin: 16 }}>
      <Col>
        <Button onClick={() =>
          dispatch(indexerActions.download({ season, query: show.name }))}>
          <CloudDownloadOutlined />New Season Bundle Download
        </Button>
      </Col>
    </Row>
    <List
      itemLayout='horizontal'
      bordered
      dataSource={downloads}
      renderItem={download => (<TVSeasonSubscriptionListItem download={download} season={season} />)}
    />
  </div>
}

const TVSeasonSubscriptionListItem: React.FC<{ download: ISeasonDownload, season: ITvSeason }> = ({ download, season }) => {
  const dispatch = useAppDispatch()
  const [removeSeasonDownload, { isLoading: isRemoveLoading }] = hamsterySlice.useRemoveSeasonDownloadMutation()

  return <List.Item
    actions={[
      <Button
        key='edit' icon={<EditOutlined />}
        onClick={() => dispatch(bundleActions.updateBundle({ download, season }))}
      />,
      <Popconfirm
        key='delete'
        placement='topLeft'
        title='Are you sure you want to delete this subscription?'
        onConfirm={async () => {
          if (!isRemoveLoading) {
            try {
              await removeSeasonDownload(String(download.id)).unwrap()
            } catch {
              notification.error({ message: 'Failed to remove Show Subscription' })
            }
          }
        }}
      >
        <Button danger icon={<DeleteTwoTone key="delete" twoToneColor="#eb2f96" />} />
      </Popconfirm>,
    ]}
  >
    <List.Item.Meta
      title={download.extra_info.name}
      description={<span>
        State: <Text code>{download.extra_info.state}</Text>
        Size: <Text code>{formatBytes(Number(download.extra_info.size))}</Text>
        Progress: <Text code>{(100 * download.extra_info.progress).toFixed(2)}%</Text>
        ETA: <Text code>{secondsToDhms(download.extra_info.eta)}</Text>
      </span>}
    />
  </List.Item>
}

async function guessEpisodeFromFiles(files: IFileInfo[]) {
  if (!files.length)
    return []
  const { data: episodesMapping } = await hamstery.getEpisodesMapping(files.map(f => f.name))
  const episodes: Record<number, number> = {}
  for (const episode in episodesMapping) {
    const file_index = files.find((f) => f.name === episodesMapping[episode].entity)?.file_index
    if (file_index) {
      episodes[episode] = file_index
    }
  }
  return episodes
}

const TVSeasonBundleSelector: React.FC<{
  download: ISeasonDownload, episodes: ITvEpisode[], files: IFileInfo[], downloads: ITvDownload[],
}> =
  ({ download, episodes, files, downloads }) => {
    const dispatch = useAppDispatch()
    const [guessedEpisode, setGuessedEpisode] = useState<Record<number, number>>({})
    const [ready, setReady] = useState<boolean>(false)
    const [updateSeasonDownloadMapping, { isLoading }] = hamsterySlice.useUpdateSeasonDownloadMappingMutation()

    useEffect(() => {
      setReady(false)
      if (episodes.length === downloads.length || files.length === downloads.length) {
        // Skip doing file guess when all episodes are ready
        setReady(true)
        return
      }
      guessEpisodeFromFiles(files)
        .then(episodes => {
          setGuessedEpisode(episodes)
        })
        .finally(() => setReady(true))
    }, [files, episodes, downloads])

    if (!files.length)
      return <></>

    if (!ready)
      return <Skeleton active />

    const episodeSelections = episodes.map((episode) => {
      return {
        episode,
        existing: downloads.find(d => d.episode === episode.id),
        guess: guessedEpisode[episode.episode_number]
      }
    })

    return <Form
      layout='vertical'
      id="updateBundle"
      name="updateBundle"
      labelCol={{ span: 24 }}
      onFinish={async (data: { mappings: { episode: number, file_index: number }[] }) => {
        const mappings = data.mappings.filter(m => m.file_index != null)
        const res = await updateSeasonDownloadMapping({ id: String(download.id), args: mappings }).unwrap()
        res.errors.forEach((message) => {
          notification.error({ message })
        })
        dispatch(bundleActions.closeBundle())
      }}
    >
      <Form.List name="mappings"
        rules={[]}
      >
        {(_, __, { errors }) =>
          <div>
            {episodeSelections
              .map((selection, index) => {
                const { episode, existing, guess } = selection;
                return <Form.Item key={episode.episode_number}>
                  <Form.Item name={[index, 'episode']} initialValue={episode.episode_number} hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item label={<span>EP{episode.episode_number} - {episode.name}</span>}
                    name={[index, 'file_index']} initialValue={existing ? existing.file_index : guess}>
                    <Select>
                      {
                        files
                          .map((d) => {
                            return <Select.Option key={d.file_index} value={d.file_index}>
                              {existing?.file_index === d.file_index ? <CheckCircleTwoTone twoToneColor="#52c41a" /> : null}
                              {d.name.split('/').pop()}
                            </Select.Option>
                          })
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
      <Button key='submit' form="updateBundle" type="primary" htmlType="submit" loading={isLoading}>Update</Button>
    </Form>
  }

export const TVSeasonBundleUpdater: React.FC<{ download: ISeasonDownload, season: ITvSeason }> = ({ download }) => {

  const [files, setFiles] = useState<IFileInfo[]>([])
  const tree = useMemo(() => filePathsToTree(download.files, (f) => f.name), [download])

  const targetDirSelector = <Row>
    <Col>Select Folder: </Col>
    <Col span={12}>
      <Cascader
        placeholder='Select'
        changeOnSelect={true}
        style={{ minWidth: 200, width: '100%' }}
        displayRender={(label) => label[label.length - 1]}
        onChange={(value) => {
          const node = treeSelectNode(tree, value as string[])
          if (node)
            setFiles(node.files)
        }}
        options={treeToCascaderOptions(tree)}
      />
    </Col>
  </Row>

  const mappingSelector = <ApiLoading getters={{
    'episodes': () => hamsterySlice.useGetTvEpisodesQuery({ season: download.season, ordering: 'episode_number' }),
    'downloads': () => hamsterySlice.useGetSeasonEpisodeDownloadsQuery({ season_download: download.id })
  }}>
    {
      ({ values }) => {
        const episodes: ITvEpisode[] = values.episodes.data
        const downloads: ITvDownload[] = values.downloads.data

        return <TVSeasonBundleSelector
          download={download} episodes={episodes} files={files} downloads={downloads}
        />
      }
    }
  </ApiLoading>

  return <>
    {targetDirSelector}
    {mappingSelector}
  </>
}