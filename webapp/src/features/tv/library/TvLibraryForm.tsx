import { Form } from 'antd';
import React from 'react';
import { hamsterySlice } from '../../api/hamsterySlice';
import DjangoRestframeworkForm from '../../general/DjangoRestframeworkForm';

const TvLibraryForm: React.FC<{
    id: string,
    editId?: string,
    onFinish?: (task: Promise<void>) => void,
}> = ({ id, editId, onFinish }) => {
    const [form] = Form.useForm()
    return <DjangoRestframeworkForm
        form={form}
        id={id} editId={editId}
        onFinish={onFinish}
        get={hamsterySlice.useGetTvLibraryQuery}
        addMutation={hamsterySlice.useAddTvLibraryMutation}
        editMutation={hamsterySlice.useEditTvLibraryMutation}
        getOptions={hamsterySlice.useGetTvLibraryOptionsQuery}
        extras={{}}
        displays={[
            { key: 'id', displayName: 'ID', hidden: true },
            { key: 'name', displayName: 'Library name', },
            { key: 'lang', displayName: 'Language', },
        ]} />
}

export default TvLibraryForm