import React from 'react';
import GlobalIndexerDownloader from '../indexers/GlobalIndexerDownloader';
import GlobalIndexerSearcher from '../indexers/GlobalIndexerSearcher';
import GlobalSeasonSubscriptionModal from '../tv/season/GlobalSeasonSubscriptionModal';
import GlobalSeasonImporter from '../tv/season/SeasonImporter';
import { TVSeasonSearchResult } from '../tv/season/TvSubscriptionPage';

const GlobalModal: React.FC = () => {
    return <div>
        <GlobalIndexerSearcher />
        <GlobalIndexerDownloader />
        <GlobalSeasonImporter />
        <GlobalSeasonSubscriptionModal />
        <TVSeasonSearchResult />
    </div>
}

export default GlobalModal