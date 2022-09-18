import { Layout, Menu, Tooltip } from 'antd';
import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppSelector } from '../../app/hook';
import { selectAllSeasonsByShow, selectAllShowsByLibrary, tvLibrariesSelectors, tvSeasonsSelectors, tvShowsSelectors } from '../tv-libraries/tvshowsSlice';

const { Sider } = Layout;

const SideNavMenuBase: React.FC<{ id: string, items: any[] }> = ({ id, items }) => {
    return (<Sider className="site-layout-background" width={200}>
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
    </Sider>)
}

export const TvLibrarySideNavMenu: React.FC = () => {
    const { library_id } = useParams()
    const libs = useAppSelector(tvLibrariesSelectors.selectAll)
    const items = libs.map((lib) => {
        return {
            key: String(lib.id),
            label: <Link to={`/tvshows/${lib.id}`}>{lib.name}</Link>
        }
    })

    return (<SideNavMenuBase items={items} id={library_id as string} />)
}

export const TvShowSideNavMenu: React.FC = () => {
    const { library_id, show_id } = useParams()
    const shows = useAppSelector(selectAllShowsByLibrary(library_id as string)) || []
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
    const seasons = useAppSelector(selectAllSeasonsByShow(show_id as string)) || []
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