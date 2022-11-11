import React from 'react';
import GlobalIndexerDownloader from '../indexers/GlobalIndexerDownloader';
import GlobalIndexerSearcher from '../indexers/GlobalIndexerSearcher';

const GlobalModal: React.FC = () => {
    return <div>
        <GlobalIndexerSearcher />
        <GlobalIndexerDownloader />
    </div>
}

export default GlobalModal