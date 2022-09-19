import { Menu } from 'antd';
import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../app/hook';
import { navActions, navSelector } from './navSlice';

const TopNavMenu: React.FC = () => {
    const { pathname } = useLocation()
    const selected = pathname.split('/')[1]
    const dispatch = useAppDispatch()
    const pages = useAppSelector(navSelector.selectAll)
        .map((page) => {
            return { key: page.key, label: <Link to={page.to}>{page.label}</Link> }
        })
    useEffect(() => {
        dispatch(navActions.updateRoute({ id: selected, changes: { to: pathname } }))
    }, [dispatch, pathname])
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