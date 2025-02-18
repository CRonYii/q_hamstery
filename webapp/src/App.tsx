import { Col, Empty, Layout, Row } from 'antd';
import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { useAppSelector } from './app/hook';
import GlobalModal from './features/general/GlobalModal';
import { responsiveComputeSelector, useResponsiveUpdater } from './features/general/responsiveSlice';
import TorznabIndexer from './features/indexers/torznab/TorznabIndexer';
import LogsPage from './features/logs/LogsPage';
import { IndexerBreadcrumbNav, TvShowsBreadcrumbNav } from './features/nav/BreadcrumbNav';
import { IndexerSideNavMenu, TvLibrarySideNavMenu, TvSeasonSideNavMenu, TvShowSideNavMenu } from './features/nav/SideNavMenu';
import TopNavMenu from './features/nav/TopNavMenu';
import SettingsPage from './features/settings/SettingsPage';
import StatsPage from './features/stats/StatsPage';
import TvLibraryHome from './features/tv/library/TvLibraryHome';
import TvLibraryPage from './features/tv/library/TvLibraryPage';
import TVBundleDownloadPage from './features/tv/season/TvBundleDownloadPage';
import TVSeasonPage from './features/tv/season/TvSeasonPage';
import TVSubscriptionPage from './features/tv/season/TvSubscriptionPage';
import TvShowPage from './features/tv/show/TvShowPage';
import Login from './features/user/Login';
import LogoutButton from './features/user/LogutButton';
import { userSelector } from './features/user/userSlice';

const { Header, Content, Footer } = Layout;

const AppContent = () => {
  return (<Routes>
    <Route path='/tvshows/:library_id/:show_id/:season_id/bundle' element={<TVBundleDownloadPage />} />
    <Route path='/tvshows/:library_id/:show_id/:season_id/subscription' element={<TVSubscriptionPage />} />
    <Route path='/tvshows/:library_id/:show_id/:season_id' element={<TVSeasonPage />} />
    <Route path='/tvshows/:library_id/:show_id' element={<TvShowPage />} />
    <Route path='/tvshows/:library_id' element={<TvLibraryPage />} />
    <Route path='/tvshows/' element={<TvLibraryHome />} />
    <Route path='/indexers' element={<Empty description={<span>Please select an Indexer Category</span>} />} />
    <Route path='/indexers/torznab' element={<TorznabIndexer />} />
    <Route path='/settings' element={<SettingsPage />} />
    <Route path='/stats' element={<StatsPage />} />
    <Route path='/logs' element={<LogsPage />} />
    <Route path='*' element={<Navigate to={'/tvshows'} replace />} />
  </Routes>)
}

const AppSideNavMenu = () => {
  return (<Routes>
    <Route path='/tvshows/:library_id/:show_id/:season_id/bundle' element={<TvSeasonSideNavMenu />} />
    <Route path='/tvshows/:library_id/:show_id/:season_id/subscription' element={<TvSeasonSideNavMenu />} />
    <Route path='/tvshows/:library_id/:show_id/:season_id' element={<TvSeasonSideNavMenu />} />
    <Route path='/tvshows/:library_id/:show_id' element={<TvShowSideNavMenu />} />
    <Route path='/tvshows/:library_id' element={<TvLibrarySideNavMenu />} />
    <Route path='/tvshows/' element={<TvLibrarySideNavMenu />} />
    <Route path='/indexers/*' element={<IndexerSideNavMenu />} />
    <Route path='*' element={<div />} />
  </Routes>)
}

const AppBreadcrumbNav = () => {
  return (<Routes>
    <Route path='/tvshows/:library_id/:show_id/:season_id/bundle' element={<TvShowsBreadcrumbNav />} />
    <Route path='/tvshows/:library_id/:show_id/:season_id/subscription' element={<TvShowsBreadcrumbNav />} />
    <Route path='/tvshows/:library_id/:show_id/:season_id' element={<TvShowsBreadcrumbNav />} />
    <Route path='/tvshows/:library_id/:show_id' element={<TvShowsBreadcrumbNav />} />
    <Route path='/tvshows/:library_id' element={<TvShowsBreadcrumbNav />} />
    <Route path='/tvshows/' element={<TvShowsBreadcrumbNav />} />
    <Route path='/indexers/*' element={<IndexerBreadcrumbNav />} />
    <Route path='*' element={<div />} />
  </Routes>)
}

const App: React.FC = () => {
  useResponsiveUpdater()
  const user = useAppSelector(userSelector)
  const modeCompute = useAppSelector(responsiveComputeSelector)
  const logo = modeCompute<any>({
    'tablet': null,
    'desktop': <div className="logo" />,
  })

  if (!user.logged_in) {
    return <Login />;
  } else {
    return (<Layout>
      <Header className="header">
        {logo}
        <TopNavMenu />
      </Header>
      <Content style={{ padding: '0 50px' }}>
        <Row align='middle' gutter={24} style={{ margin: 2 }}>
          <Col>
            <AppBreadcrumbNav />
          </Col>
          <Col flex="auto"></Col>
          <Col>
            <LogoutButton />
          </Col>
        </Row>
        <Layout className="site-layout-background" style={{ padding: '24px 0' }}>
          <AppSideNavMenu />
          <Content style={{ padding: '0 24px', minHeight: '40vh' }}>
            <AppContent />
            <GlobalModal />
          </Content>
        </Layout>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        Hamstery {process.env.REACT_APP_VERSION ? process.env.REACT_APP_VERSION : '<unknown>'} - Tech otakus save the world
      </Footer>
    </Layout>);
  }
}

export default App;