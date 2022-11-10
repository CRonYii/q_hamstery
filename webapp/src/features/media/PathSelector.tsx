import { Cascader } from 'antd';
import React, { useEffect, useState } from 'react';
import hamstery, { IMediaResources } from '../api/hamstery';

interface IMediaResourceOption {
    value: string,
    label: string,
    isLeaf: boolean,
}

const listToPathOptions = (list: IMediaResources) => list.path.map((p) => {
    return {
        value: p.key,
        label: p.title,
        isLeaf: false
    }
})

const listToFileOptions = (list: IMediaResources) => list.file.map((p) => {
    return {
        value: p.key,
        label: p.title,
        isLeaf: true
    }
})

const listToAllOptions = (list: any) => [...listToPathOptions(list), ...listToFileOptions(list)];

const listToOptions = (type: 'path' | 'file', list: IMediaResources) => {
    switch (type) {
        case 'file': return listToAllOptions(list)
        case 'path': return listToPathOptions(list)
    }
}

const PathSelector: React.FC<{
    type: 'path' | 'file',
    onChange?: (key: string) => void,
}> = ({ type, onChange }) => {
    const [options, setOptions] = useState<IMediaResourceOption[]>([]);
    useEffect(() => {
        (async function () {
            const { data: list } = await hamstery.listMedia()
            setOptions(listToOptions('path', list));
        })()
    }, []);

    const onCascaderChange = (value: any, selectedOptions: any) => {
        const targetOption = selectedOptions[selectedOptions.length - 1];
        if (onChange)
            onChange(targetOption.value);
    }

    const loadData = async (selectedOptions: any) => {
        const targetOption = selectedOptions[selectedOptions.length - 1];
        targetOption.loading = true;

        const { data: path } = await hamstery.listMedia(targetOption.value)
        targetOption.loading = false;
        targetOption.children = listToOptions(type, path);

        setOptions([...options]);
    }

    return <Cascader
        placeholder='Select'
        changeOnSelect={type === 'path'}
        style={{ minWidth: 200, width: '100%' }}
        displayRender={(label) => label[label.length - 1]}
        onChange={onCascaderChange}
        loadData={loadData}
        options={options}
    />
}

export default PathSelector