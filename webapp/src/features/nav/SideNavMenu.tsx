import { Layout, Menu } from 'antd';
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppSelector } from '../../app/hook';
import { tvLibrariesSelectors } from '../tv-libraries/tvshowsSlice';

const { Sider } = Layout;

type SideNavPath = 'tvshows'

const SideNavMenu: React.FC<{ type: SideNavPath }> = ({ type }) => {
    const libs = useAppSelector(tvLibrariesSelectors.selectAll)
    const { id } = useParams()


    const sideNavItems = () => {
        switch (type) {
            case 'tvshows':
                return libs.map((lib) => {
                    return { key: String(lib.id), label: <Link to={`/tvshows/library/${lib.id}`}>{lib.name}</Link> }
                })
        }
    }

    return (<Sider className="site-layout-background" width={200}>
        <Menu
            mode="inline"
            style={{ height: '100%' }}
            items={sideNavItems()}
            selectedKeys={id ? [id] : []}
        />
    </Sider>)
}

export default SideNavMenu;