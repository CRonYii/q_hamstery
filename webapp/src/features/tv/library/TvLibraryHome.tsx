import { PlusOutlined } from '@ant-design/icons';
import { Button, Col, Modal, notification, Row } from 'antd';
import React from 'react';
import { ITvLibrary } from '../../../app/entities';
import { useAppDispatch, useAppSelector } from '../../../app/hook';
import { hamsterySlice } from '../../api/hamsterySlice';
import ApiLoading from '../../general/ApiLoading';
import TvLibraryCard from './TvLibraryCard';
import TvLibraryForm from './TvLibraryForm';
import { tvLibraryActions, tvLibrarySelector } from './tvlibrarySlice';

const TvLibraryHome: React.FC = () => {
    const dispatch = useAppDispatch()
    const tvlibrary = useAppSelector(tvLibrarySelector)

    return <ApiLoading getters={{ 'tvlibraries': hamsterySlice.useGetTvLibrariesQuery }}>
        {
            ({ values }) => {
                const tvlibraries: ITvLibrary[] = values.tvlibraries.data
                return <div>
                    <Modal
                        title={tvlibrary.editId ? "Update TV Library" : "Add new TV Library"}
                        style={{ minWidth: '60vw' }}
                        open={tvlibrary.addLibraryOpen}
                        onCancel={() => dispatch(tvLibraryActions.close())}
                        footer={null}
                    >
                        <TvLibraryForm
                            id='tv-library-form'
                            editId={tvlibrary.editId}
                            onFinish={async (task) => {
                                try {
                                    await task
                                    dispatch(tvLibraryActions.close())
                                } catch {
                                    notification.error({ message: 'Failed to save TV Library' })
                                }
                            }}
                        />
                    </Modal>

                    <Row gutter={24} style={{ margin: 16 }}>
                        <Col>
                            <Button type='primary' onClick={() => dispatch(tvLibraryActions.add())}>
                                <PlusOutlined />Add
                            </Button>
                        </Col>
                    </Row>
                    <Row gutter={24} style={{ margin: 16 }}>
                        {
                            tvlibraries.map(library => {
                                return <Col key={library.id}>
                                    <TvLibraryCard library={library} />
                                </Col>
                            })
                        }
                    </Row>
                </div>
            }
        }
    </ApiLoading>
}

export default TvLibraryHome