import { Menu } from 'antd';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const pages = [
    { key: 'tvshows', label: <Link to={'/tvshows'}>TV Shows</Link>, },
    { key: 'indexers', label: <Link to={'/indexers'}>Indexers</Link>, },
]

const TopNavMenu: React.FC = () => {
    const locaiton = useLocation()
    const selected = locaiton.pathname.split('/')[1]
    return (
        <Menu
            theme="dark" mode="horizontal"
            defaultSelectedKeys={['tvshows']}
            items={pages}
            selectedKeys={[selected]}
        />
    )
}

export default TopNavMenu;