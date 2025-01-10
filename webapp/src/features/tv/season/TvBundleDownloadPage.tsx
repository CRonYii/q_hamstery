import { CheckCircleTwoTone, CloudDownloadOutlined, DeleteTwoTone, EditOutlined } from '@ant-design/icons';
import { Button, Col, Form, Input, List, notification, Popconfirm, Row, Select, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ISeasonDownload, ITvDownload, ITvEpisode, ITvSeason, ITvShow } from '../../../app/entities';
import { useAppDispatch } from '../../../app/hook';
import { formatBytes, getEpNumber, secondsToDhms } from '../../../app/utils';
import { hamsterySlice } from '../../api/hamsterySlice';
import ApiLoading from '../../general/ApiLoading';
import { indexerActions } from '../../indexers/indexerSlice';
import { bundleActions } from './bundleSlice';

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
      renderItem={download => (<TVSeasonSubscriptionListItem download={download} />)}
    />
  </div>
}

const TVSeasonSubscriptionListItem: React.FC<{ download: ISeasonDownload }> = ({ download }) => {
  const dispatch = useAppDispatch()
  const [removeSeasonDownload, { isLoading: isRemoveLoading }] = hamsterySlice.useRemoveSeasonDownloadMutation()

  return <List.Item
    actions={[
      <Button
        key='edit' icon={<EditOutlined />}
        onClick={() => dispatch(bundleActions.updateBundle(download))}
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

export const TVSeasonBundleUpdater: React.FC<{ download: ISeasonDownload }> = ({ download }) => {
  const dispatch = useAppDispatch()
  const [guessedEpisode, setGuessedEpisode] = useState<Record<number, number>>({})
  useEffect(() => {
    Promise.all(download.files.map(async ({ name, file_index }) => {
      const episode_number = await getEpNumber(name)
      return { file_index, episode_number }
    })).then(episode_numbers => {
      const episodes: Record<number, number> = {}
      episode_numbers.forEach(episode => {
        episodes[episode.episode_number] = episode.file_index
      })
      setGuessedEpisode(episodes)
    })
  }, [download])

  const [updateSeasonDownloadMapping, { isLoading }] = hamsterySlice.useUpdateSeasonDownloadMappingMutation()
  return <ApiLoading getters={{
    'episodes': () => hamsterySlice.useGetTvEpisodesQuery({ season: download.season, ordering: 'episode_number' }),
    'downloads': () => hamsterySlice.useGetSeasonEpisodeDownloadsQuery({ season_download: download.id })
  }}>
    {
      ({ values }) => {
        const episodes: ITvEpisode[] = values.episodes.data
        const downloads: ITvDownload[] = values.downloads.data

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
                            download.files
                              .map((d) => {
                                return <Select.Option key={d.file_index} value={d.file_index}>
                                  {existing?.file_index === d.file_index ? <CheckCircleTwoTone twoToneColor="#52c41a" /> : null} {d.name}
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
    }
  </ApiLoading>
}