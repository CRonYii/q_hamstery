import { Menu } from 'antd';
import React from 'react';
import { Link } from 'react-router-dom';

const pages = [
    { key: 'tvshows', label: <Link to={'/tvshows'}>Tv Shows</Link>, },
    { key: 'indexers', label: <Link to={'/indexers'}>Indexers</Link>, },
]

const TopNavMenu: React.FC = () => {
    return (
        <Menu
            theme="dark" mode="horizontal"
            defaultSelectedKeys={['tvshows']}
            items={pages}
        />
    )
}

export default TopNavMenu;