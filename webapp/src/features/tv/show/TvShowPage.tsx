import { ReloadOutlined } from '@ant-design/icons';
import { Button, Col, Row } from 'antd';
import React from 'react';
import { useParams } from 'react-router-dom';
import { ITvSeason } from '../../../app/entities';
import { hamsterySlice } from '../../api/hamsterySlice';
import ApiLoading from '../../general/ApiLoading';
import TvSeasonCard from '../season/TvSeasonCard';

const TvShowPage: React.FC = () => {
    const params = useParams()
    const show_id = params.show_id as string
    const [scan, { isLoading }] = hamsterySlice.useScanTvShowMutation()

    return <ApiLoading getters={{ 'seasons': () => hamsterySlice.useGetTvSeasonsQuery({ show: show_id }) }}>
        {
            ({ values }) => {
                const seasons: ITvSeason[] = values.seasons.data
                return <div>
                    <Row gutter={12} style={{ margin: 16 }}>
                        <Col>
                            <Button onClick={() => scan(show_id)} loading={isLoading}>
                                {!isLoading ? <span><ReloadOutlined /> Scan</span> : <span>Scanning</span>}
                            </Button>
                        </Col>
                    </Row>
                    <Row gutter={24} style={{ margin: 16 }} align='bottom'>
                        {
                            seasons
                                .slice()
                                .sort((a, b) => (a.season_number - b.season_number))
                                .map((season) => {
                                    return <Col key={season.id}>
                                        <TvSeasonCard season={season} />
                                    </Col>;
                                })
                        }
                    </Row>
                </div>
            }
        }
    </ApiLoading>

}

export default TvShowPage