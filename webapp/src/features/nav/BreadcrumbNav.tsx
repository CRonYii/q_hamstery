import { HomeOutlined } from '@ant-design/icons';
import { Breadcrumb } from 'antd';
import React from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { capitalizeFirstLetter } from '../../app/utils';
import { hamsterySlice } from '../api/hamsterySlice';

interface BreadcrumbNavItem {
    key: string,
    label: JSX.Element | string,
    to?: string
}

const BreadcrumbNav: React.FC<{
    items: BreadcrumbNavItem[]
}> = ({ items }) => {
    return (<Breadcrumb style={{ margin: '16px 0' }}>
        {items.map(({ key, label, to }) => {
            const item = to
                ?
                <Link to={to}>
                    {label}
                </Link>
                :
                label
            return <Breadcrumb.Item key={key}>
                {item}
            </Breadcrumb.Item>
        })}
    </Breadcrumb>)
}

export default BreadcrumbNav

export const TvShowsBreadcrumbNav: React.FC = () => {
    const params = useParams()
    const location = useLocation()
    const library_id = params.library_id as string
    const show_id = params.show_id as string
    const season_id = params.season_id as string

    const { data: library, isUninitialized: libraryIsUninitialized } = hamsterySlice.useGetTvLibraryQuery(library_id, {
        skip: !library_id
    })
    const { data: show, isUninitialized: showIsUninitialized } = hamsterySlice.useGetTvShowQuery(show_id, {
        skip: !show_id
    })
    const { data: season, isUninitialized: seasonIsUninitialized } = hamsterySlice.useGetTvSeasonQuery(season_id, {
        skip: !season_id
    })

    const items: BreadcrumbNavItem[] = [
        {
            key: 'tvshows',
            label: <span><HomeOutlined /> TV Shows</span>,
            to: '/tvshows',
        }
    ]
    if (library && !libraryIsUninitialized)
        items.push({
            key: `library-${library_id}`,
            label: library.name,
            to: '/tvshows/' + library_id + '?page=1',
        })
    if (show && !showIsUninitialized)
        items.push({
            key: `show-${show_id}`,
            label: show.name || '',
            to: `/tvshows/${library_id}/${show_id}`,
        })
    if (season && !seasonIsUninitialized)
        items.push({
            key: `season-${season_id}`,
            label: season.name || '',
            to: `/tvshows/${library_id}/${show_id}/${season_id}`,
        })
    if (location.pathname.endsWith('subscription'))
        items.push({
            key: `subscription`,
            label: 'Subscriptions',
        })
    return <BreadcrumbNav items={items} />
}

export const IndexerBreadcrumbNav: React.FC = () => {
    const location = useLocation()
    const path = location.pathname.split('/')[2]
    const items: BreadcrumbNavItem[] = [
        {
            key: 'indexers',
            label: <span><HomeOutlined /> Indexers</span>,
        }
    ]
    if (path)
        items.push({
            key: `indexer-${path}`,
            label: capitalizeFirstLetter(path),
        })
    return <BreadcrumbNav items={items} />
}