import { Alert, Col, Row, Skeleton } from 'antd';
import React from 'react';
import { useParams } from 'react-router-dom';
import { ITvShow } from '../../../app/entities';
import { datetimeSort } from '../../../app/utils';
import { hamsterySlice } from '../../api/hamsterySlice';
import ApiLoading from '../../general/ApiLoading';
import TvSeasonCard from '../season/TvSeasonCard';

const TvShowPage: React.FC = () => {
    const params = useParams()
    const show_id = params.show_id as string

    return <ApiLoading getters={{ 'show': () => hamsterySlice.useGetTvShowQuery(show_id) }}>
        {
            ({ values }) => {
                const show: ITvShow = values.show.data
                return <div>
                    <Row gutter={24} style={{ margin: 16 }} align='bottom'>
                        {
                            show.seasons
                                ?.slice()
                                .sort((a, b) => datetimeSort(a.air_date, b.air_date))
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