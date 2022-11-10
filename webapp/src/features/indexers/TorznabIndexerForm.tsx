import React from 'react';
import { hamsterySlice } from '../api/hamsterySlice';
import DjangoRestframeworkForm from '../general/DjangoRestframeworkForm';

const TorznabIndexerForm: React.FC<{
    id: string,
    editId?: string,
    onFinish?: (task: Promise<void>) => void,
}> = ({ id, editId, onFinish }) => {
    return <DjangoRestframeworkForm
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
        ]} />
}

export default TorznabIndexerForm