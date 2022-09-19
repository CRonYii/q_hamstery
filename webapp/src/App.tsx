import { Col, Empty, Layout, Row } from 'antd';
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import TorznabIndexer from './features/indexers/TorznabIndexer';
import { IndexerBreadcrumbNav, TvShowsBreadcrumbNav } from './features/nav/BreadcrumbNav';
import { IndexerSideNavMenu, TvLibrarySideNavMenu, TvSeasonSideNavMenu, TvShowSideNavMenu } from './features/nav/SideNavMenu';
import TopNavMenu from './features/nav/TopNavMenu';
import TvLibraryPage from './features/tv-libraries/TvLibraryPage';
import TVSeasonPage from './features/tv-libraries/TvSeasonPage';
import TvShowPage from './features/tv-libraries/TvShowPage';
import Login from './features/user/Login';
import LogoutButton from './features/user/LogutButton';
import { userSelector } from './features/user/userSlice';

const { Header, Content, Footer } = Layout;

const AppContent = () => {
  return (<Routes>
    <Route path='/tvshows/:library_id/:show_id/:season_id' element={<TVSeasonPage />} />
    <Route path='/tvshows/:library_id/:show_id' element={<TvShowPage />} />
    <Route path='/tvshows/:library_id' element={<TvLibraryPage />} />
    <Route path='/tvshows/' element={<Empty description={<span>Please select a TV Library</span>} />} />
    <Route path='/indexers' element={<Empty description={<span>Please select an Indexer Category</span>} />} />
    <Route path='/indexers/torznab' element={<TorznabIndexer />} />
    <Route path='*' element={<Navigate to={'/tvshows'} replace />} />
  </Routes>)
}

const AppSideNavMenu = () => {
  return (<Routes>
    <Route path='/tvshows/:library_id/:show_id/:season_id' element={<TvSeasonSideNavMenu />} />
    <Route path='/tvshows/:library_id/:show_id' element={<TvShowSideNavMenu />} />
    <Route path='/tvshows/:library_id' element={<TvLibrarySideNavMenu />} />
    <Route path='/tvshows/' element={<TvLibrarySideNavMenu />} />
    <Route path='/indexers/*' element={<IndexerSideNavMenu />} />
  </Routes>)
}

const AppBreadcrumbNav = () => {
  return (<Routes>
    <Route path='/tvshows/:library_id/:show_id/:season_id' element={<TvShowsBreadcrumbNav />} />
    <Route path='/tvshows/:library_id/:show_id' element={<TvShowsBreadcrumbNav />} />
    <Route path='/tvshows/:library_id' element={<TvShowsBreadcrumbNav />} />
    <Route path='/tvshows/' element={<TvShowsBreadcrumbNav />} />
    <Route path='/indexers/*' element={<IndexerBreadcrumbNav />} />
  </Routes>)
}

const App: React.FC = () => {
  const user = useSelector(userSelector)

  if (!user.logged_in) {
    return <Login />;
  } else {
    return (<Layout>
      <Header className="header">
        <div className="logo" />
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
          </Content>
        </Layout>
      </Content>
      <Footer style={{ textAlign: 'center' }}>Hamstery - Tech otakus save the world</Footer>
    </Layout>);
  }
}

export default App;