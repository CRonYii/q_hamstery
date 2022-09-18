import { Breadcrumb, Col, Empty, Layout, Row } from 'antd';
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import './App.css';
import { useAppDispatch } from './app/hook';
import SideNavMenu from './features/nav/SideNavMenu';
import TopNavMenu from './features/nav/TopNavMenu';
import TvLibrary from './features/tv-libraries/TvLibrary';
import { fetchTvLibs, tvLibrariesSelectors } from './features/tv-libraries/tvshowsSlice';
import Login from './features/user/Login';
import LogoutButton from './features/user/LogutButton';
import { userSelector } from './features/user/userSlice';

const { Header, Content, Footer, Sider } = Layout;

const AppContent = () => {
  return (<Routes>
    <Route path='/tvshows/library/:id' element={<TvLibrary />} />
    <Route path='/tvshows/library' element={<Empty description={<span>Please select a TV Library</span>} />} />
    <Route path='/indexers' element={<div>Indexers</div>} />
    <Route path='*' element={<Navigate to={'/tvshows/library'} replace />} />
  </Routes>)
}

const AppSideNavMenu = () => {
  return (<Routes>
    <Route path='/tvshows/library' element={<SideNavMenu type='tvshows' />} />
    <Route path='/tvshows/library/:id' element={<SideNavMenu type='tvshows' />} />
  </Routes>)
}

const App: React.FC = () => {
  const dispatch = useAppDispatch()
  const user = useSelector(userSelector)
  const libs = useSelector(tvLibrariesSelectors.selectAll)

  const location = useLocation()
  const path = location.pathname

  useEffect(() => {
    dispatch(fetchTvLibs())
  }, [])

  if (!user.logged_in) {
    return <Login />;
  } else {
    return (<Layout>
      <Header className="header">
        <div className="logo" />
        <TopNavMenu />
      </Header>
      <Content style={{ padding: '0 50px' }}>
        <Row align='middle' gutter={16}>
          <Col>
            <Breadcrumb style={{ margin: '16px 0' }}>
              <Breadcrumb.Item>Home</Breadcrumb.Item>
              <Breadcrumb.Item>List</Breadcrumb.Item>
              <Breadcrumb.Item>{path}</Breadcrumb.Item>
            </Breadcrumb>
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