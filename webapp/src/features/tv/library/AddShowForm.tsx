import { Form, Select } from 'antd';
import debounce from 'lodash/debounce';
import React, { useState } from 'react';
import { IAddShowResponse, ITvLibrary, ITvStorage } from '../../../app/entities';
import { hamsterySlice } from '../../api/hamsterySlice';
import TMDB from '../../api/TMDB';
import ApiLoading from '../../general/ApiLoading';

interface TMDBTVShowSearchResult {
    name: string, id: number, first_air_date: string, poster_path: string
}

const AddShowForm: React.FC<{
    library: ITvLibrary,
    onFinish?: (task: Promise<IAddShowResponse>) => void,
}> = ({ library, onFinish }) => {
    const [form] = Form.useForm()
    const [searchResults, setSearchResults] = useState<TMDBTVShowSearchResult[]>([])
    const [addTvShowToStorage] = hamsterySlice.useAddTvShowToStorageMutation()
    const [poster, setPoster] = useState('');
    const handleSearch = async (keyword: string) => {
        if (keyword.trim() === '') {
            setSearchResults([])
            return
        }
        const { results: data } = await TMDB.searchTVShowsByPage(keyword, 1, library.lang)
        setSearchResults(data.map((show: TMDBTVShowSearchResult) => ({
            name: show.name,
            id: show.id,
            first_air_date: show.first_air_date,
            poster_path: TMDB.toPosterURL(show.poster_path),
        })))
    }

    return <ApiLoading getters={{ 'storages': () => hamsterySlice.useGetTvStoragesQuery({ lib: library.id }), }}>
        {
            ({ values }) => {
                const storages: ITvStorage[] = values.storages.data
                return (<div>
                    <Form
                        form={form}
                        id="tvshows-add"
                        name="tvshows-add"
                        labelCol={{ span: 4 }}
                        onFinish={(data) => {
                            const { storage, tmdb_id } = data;

                            const task = addTvShowToStorage({ id: storage, tmdb_id }).unwrap()
                            if (onFinish)
                                onFinish(task)
                        }}
                        autoComplete="off"
                    >
                        <Form.Item
                            label="Storage"
                            name="storage"
                            rules={[{ required: true, message: 'Please select a storage!' }]}
                        >
                            <Select>
                                {
                                    storages
                                        .map((s) =>
                                            <Select.Option key={s.id} value={s.id}>{s.path}</Select.Option>)
                                }
                            </Select>
                        </Form.Item>
                        <Form.Item
                            label="TV Show"
                            name="tmdb_id"
                            rules={[{ required: true, message: 'Please select a TV Show!' }]}
                        >
                            <Select
                                showSearch
                                defaultActiveFirstOption={false}
                                showArrow={false}
                                filterOption={false}
                                notFoundContent={null}
                                onSearch={debounce(handleSearch, 250)}
                                onSelect={(value: any, option: any) =>
                                    setPoster(searchResults[Number(option.key)].poster_path)}
                            >
                                {
                                    searchResults.map((show, idx) =>
                                        <Select.Option key={idx} value={show.id}>
                                            {show.name} - {show.first_air_date}
                                        </Select.Option>)
                                }
                            </Select>
                        </Form.Item>
                    </Form>
                    {
                        poster.length !== 0
                            ? <img src={poster} style={{ marginLeft: 'auto', marginRight: 'auto', display: 'block', maxHeight: '40vw' }} alt='Poster' />
                            : null
                    }

                </div>)
            }
        }
    </ApiLoading>

}

export default AddShowForm