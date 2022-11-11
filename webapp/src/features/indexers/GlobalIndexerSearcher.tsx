import { Modal } from 'antd';
import React from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../app/hook';
import IndexerSearcher from './IndexerSearcher';
import { indexerActions, indexerSelector } from './indexerSlice';

const GlobalIndexerSearcher: React.FC = () => {
    const dispatch = useAppDispatch()
    const indexer = useSelector(indexerSelector)

    return <div>
        <Modal
            title="Search"
            style={{ minWidth: '60vw' }}
            open={indexer.search === 'single'}
            onCancel={() => {
                dispatch(indexerActions.closeSearch())
            }}
            footer={null}
        >
            <IndexerSearcher key={String(indexer.type) + indexer.searchId} indexer={indexer} />
        </Modal>
    </div>
}

export default GlobalIndexerSearcher