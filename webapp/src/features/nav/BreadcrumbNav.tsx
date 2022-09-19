import { HomeOutlined } from '@ant-design/icons';
import { Breadcrumb } from 'antd';
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { hamsterySlice } from '../api/hamsterySlice';

const BreadcrumbNav: React.FC<{
    items: {
        label: JSX.Element | JSX.Element[] | string,
        to?: string
    }[]
}> = ({ items }) => {
    return (<Breadcrumb style={{ margin: '16px 0' }}>
        {items.map(({ label, to }) => {
            const item = to ? <Link to={to}>
                {label}
            </Link> : label
            return <Breadcrumb.Item>
                {item}
            </Breadcrumb.Item>
        })}
    </Breadcrumb>)
}

export default BreadcrumbNav

export const TvLibraryBreadcrumbNav: React.FC = () => {
    const params = useParams()
    const library_id = params.library_id as string
    const { data: library } = hamsterySlice.useGetTvLibraryQuery(library_id)
    const items = [
        {
            label: [<HomeOutlined />, <span>{library?.name}</span>],
        }
    ]
    return <BreadcrumbNav items={items} />
}

export const TvShowBreadcrumbNav: React.FC = () => {
    const params = useParams()
    const library_id = params.library_id as string
    const show_id = params.show_id as string
    const { data: library } = hamsterySlice.useGetTvLibraryQuery(library_id)
    const { data: show } = hamsterySlice.useGetTvShowQuery(show_id)
    const items = [
        {
            label: [<HomeOutlined />, <span> {library?.name}</span>],
            to: '/tvshows/' + library_id,
        },
        {
            label: show?.name || '',
        },
    ]
    return <BreadcrumbNav items={items} />
}

export const TvSeasonBreadcrumbNav: React.FC = () => {
    const params = useParams()
    const library_id = params.library_id as string
    const show_id = params.show_id as string
    const season_id = params.season_id as string
    const { data: library } = hamsterySlice.useGetTvLibraryQuery(library_id)
    const { data: show } = hamsterySlice.useGetTvShowQuery(show_id)
    const { data: season } = hamsterySlice.useGetTvSeasonQuery(season_id)
    const items = [
        {
            label: [<HomeOutlined />, <span> {library?.name}</span>],
            to: '/tvshows/' + library_id,
        },
        {
            label: show?.name || '',
            to: `/tvshows/${library_id}/${show_id}`,
        },
        {
            label: season?.name || '',
        },
    ]
    return <BreadcrumbNav items={items} />
}