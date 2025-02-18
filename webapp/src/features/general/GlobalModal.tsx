import React from 'react';
import GlobalIndexerDownloader from '../indexers/GlobalIndexerDownloader';
import GlobalIndexerSearcher from '../indexers/GlobalIndexerSearcher';
import GlobalIndexerSeasonDownloader from '../indexers/GlobalIndexerSeasonDownloader';
import GlobalSeasonBundleModal from '../tv/season/GlobalSeasonBundleModal';
import GlobalSeasonSubscriptionModal from '../tv/season/GlobalSeasonSubscriptionModal';
import GlobalSeasonImporter from '../tv/season/SeasonImporter';
import GlobalSeasonSupplementalImporter from '../tv/season/SeasonSupplementalImporter';
import { TVSeasonSearchResult } from '../tv/season/TvSubscriptionPage';

const GlobalModal: React.FC = () => {
    return <div>
        <GlobalIndexerSearcher />
        <GlobalIndexerDownloader />
        <GlobalIndexerSeasonDownloader />
        <GlobalSeasonImporter />
        <GlobalSeasonSupplementalImporter />
        <GlobalSeasonBundleModal />
        <GlobalSeasonSubscriptionModal />
        <TVSeasonSearchResult />
    </div>
}

export default GlobalModal