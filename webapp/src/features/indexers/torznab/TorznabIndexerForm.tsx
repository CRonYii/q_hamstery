import { Form, Select } from 'antd';
import React, { useEffect, useState } from 'react';
import hamstery from '../../api/hamstery';
import { hamsterySlice } from '../../api/hamsterySlice';
import DjangoRestframeworkForm from '../../general/DjangoRestframeworkForm';

const TorznabIndexerForm: React.FC<{
    id: string,
    editId?: string,
    onFinish?: (task: Promise<void>) => void,
}> = ({ id, editId, onFinish }) => {
    const [form] = Form.useForm()
    const [options, setOptions] = useState<{ label: string, value: string }[]>([])
    useEffect(() => {
        if (!editId)
            return
        hamstery.torznabCaps(editId)
            .then((res) => {
                const raw = res.data.categories
                const cats: { label: string, value: string }[] = []
                const idSet = new Set()
                const add = (cat: any) => {
                    if (idSet.has(cat.id))
                        return
                    idSet.add(cat.id)
                    cats.push({ label: `${cat.id} (${cat.name})`, value: cat.id })
                }
                raw.forEach((cat) => {
                    add(cat)
                    cat.subcat.forEach(add)
                })
                cats.sort((a, b) => Number(a.value) - Number(b.value))

                setOptions(cats)
            })
            .catch(() => {
                setOptions([])
                console.warn('Failed to fetch caps from torznab.')
            })
    }, [editId])
    return <DjangoRestframeworkForm
        form={form}
        id={id} editId={editId}
        onFinish={onFinish}
        get={hamsterySlice.useGetTorznabIndexerQuery}
        addMutation={hamsterySlice.useAddTorznabIndexerMutation}
        editMutation={hamsterySlice.useEditTorznabIndexerMutation}
        getOptions={hamsterySlice.useGetTorznabIndexerOptionsQuery}
        extras={{}}
        displays={[
            { key: 'id', displayName: 'ID', hidden: true },
            { key: 'name', displayName: 'Indexer name', },
            { key: 'url', displayName: 'URL', },
            { key: 'apikey', displayName: 'API Key', },
            {
                key: 'cat', displayName: 'Categories', hidden: !editId,
                defaultValue: [],
                convertValueTo: (cat) => cat.join(','),
                convertValueFrom: (cat) => cat.length === 0 ? [] : cat.split(','),
                customRender: () => {
                    return <Select
                        mode='multiple'
                        options={options}
                    />
                }
            },
        ]} />
}

export default TorznabIndexerForm