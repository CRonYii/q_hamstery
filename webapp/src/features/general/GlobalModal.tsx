import React from 'react';
import GlobalIndexerDownloader from '../indexers/GlobalIndexerDownloader';
import GlobalIndexerSearcher from '../indexers/GlobalIndexerSearcher';
import GlobalSeasonImporter from '../tv/season/SeasonImporter';

const GlobalModal: React.FC = () => {
    return <div>
        <GlobalIndexerSearcher />
        <GlobalIndexerDownloader />
        <GlobalSeasonImporter />
    </div>
}

export default GlobalModal