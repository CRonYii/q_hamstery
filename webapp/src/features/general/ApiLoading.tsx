import { Alert, Skeleton } from 'antd';
import React from 'react';

const ApiLoading: React.FC<{
    getters: Record<string, any>,
    children: React.FC<{ values: Record<string, any> }>,
}> = ({ getters, children }) => {
    let isLoadingGlobal = false
    let isErrorGlobal = false
    let values: Record<string, any> = {}
    for (const key of Object.keys(getters)) {
        const getter = getters[key]
        const all = getter()
        if (all.isLoading)
            isLoadingGlobal = true
        if (all.isError)
            isErrorGlobal = true
        values[key] = all
    }
    if (isLoadingGlobal) {
        return <Skeleton active />
    } else if (isErrorGlobal) {
        return <Alert
            message="Error"
            description='Loading failed'
            type="error"
            showIcon
        />
    } else {
        return children({ values })
    }
}

export default ApiLoading