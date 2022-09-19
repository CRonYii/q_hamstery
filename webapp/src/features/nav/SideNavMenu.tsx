import { Affix, Layout, Menu, Tooltip } from 'antd';
import React, { useMemo } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { getShowsOfLibrary } from '../../app/utils';
import { hamsterySlice } from '../api/hamsterySlice';

const { Sider } = Layout;

const SideNavMenuBase: React.FC<{ id?: string, items: any[] }> = ({ id, items }) => {
    return (<Affix>
            <Sider className="site-layout-background" width={200}>
                <Menu
                    mode="inline"
                    style={{
                        height: '100%',
                        overflowX: 'hidden',
                        overflowY: 'auto',
                        maxHeight: '80vh',
                    }}
                    items={items}
                    selectedKeys={id ? [id] : []}
                />
            </Sider>
        </Affix>)
}

export const TvLibrarySideNavMenu: React.FC = () => {
    const { library_id } = useParams()
    const { data = [] } = hamsterySlice.useGetTvLibrariesQuery()
    const items = data.map((lib) => {
        return {
            key: String(lib.id),
            label: <Link to={`/tvshows/${lib.id}`}>{lib.name}</Link>
        }
    })

    return (<SideNavMenuBase items={items} id={library_id as string} />)
}

export const TvShowSideNavMenu: React.FC = () => {
    const { library_id, show_id } = useParams()
    const { data: library } = hamsterySlice.useGetTvLibraryQuery(library_id as string)
    const shows = useMemo(() => getShowsOfLibrary(library), [library])
    const items = shows.map((show) => {
        const title = `${show.name} (${show.air_date})`
        return {
            key: String(show.id),
            label: <Tooltip title={title} placement="right">
                <Link to={`/tvshows/${library_id}/${show.id}`}>
                    {title}
                </Link>
            </Tooltip>
        }
    })

    return (<SideNavMenuBase items={items} id={show_id as string} />)
}

export const TvSeasonSideNavMenu: React.FC = () => {
    const { library_id, show_id, season_id } = useParams()
    const show = hamsterySlice.useGetTvShowQuery(show_id as string).data
    const seasons = show ? show.seasons : []
    const items = seasons.map((season) => {
        const title = `${season.name} - ${season.number_of_episodes} episodes (${season.air_date})`
        return {
            key: String(season.id),
            label: <Tooltip title={title} placement="right">
                <Link to={`/tvshows/${library_id}/${show_id}/${season.id}`}>
                    {title}
                </Link>
            </Tooltip>
        }
    })

    return (<SideNavMenuBase items={items} id={season_id as string} />)
}

export const IndexerSideNavMenu: React.FC = () => {
    const locaiton = useLocation()
    const selected = locaiton.pathname.split('/')[2]
    const items = [{
        key: 'torznab',
        label: <Link to={`/indexers/torznab`}>Torznab</Link>
    }]

    return (<SideNavMenuBase items={items} id={selected} />)
}