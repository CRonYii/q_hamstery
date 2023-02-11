import { FileFilled, FolderOpenFilled, RollbackOutlined } from '@ant-design/icons';
import { Button, Col, Input, Menu, Modal, notification, Row, Spin } from 'antd';
import { MenuInfo } from 'rc-menu/lib/interface';
import React, { useEffect, useState } from 'react';
import hamstery, { IMediaResources } from '../api/hamstery';

interface IMediaResourceOption {
    key: string,
    label: string,
    is_directory: boolean,
    is_back: boolean,
}

const listToPathOptions = (list: IMediaResources): IMediaResourceOption[] => list.path.map((p) => {
    return {
        key: p.key,
        label: p.title,
        is_directory: true,
        is_back: false,
    }
})

const listToFileOptions = (list: IMediaResources): IMediaResourceOption[] => list.file.map((p) => {
    return {
        key: p.key,
        label: p.title,
        is_directory: false,
        is_back: false,
    }
})

const listToAllOptions = (list: any) => [...listToPathOptions(list), ...listToFileOptions(list)];

const listToOptions = (type: 'path' | 'file', list: IMediaResources) => {
    switch (type) {
        case 'file': return listToAllOptions(list)
        case 'path': return listToPathOptions(list)
    }
}

const PathSelectorBase: React.FC<{
    type: 'path' | 'file',
    onChange?: (opt: IMediaResourceOption) => void,
}> = ({ type, onChange }) => {
    const [loading, setLoading] = useState<boolean>(false)
    const [target, setTarget] = useState<IMediaResourceOption>({ key: '', label: '/', is_back: false, is_directory: true, })
    const [keyword, setKeyword] = useState<string>('')
    const [options, setOptions] = useState<IMediaResourceOption[]>([])
    const [history, setHistory] = useState<{ key: string, label: string }[]>([{ key: '', label: '/' }])
    useEffect(() => {
        (async function () {
            const { data: list } = await hamstery.listMedia()
            setOptions(listToOptions(type, list));
        })()
    }, []);

    const loadData = async (opt: MenuInfo) => {
        const current_directory = options.find(({ key }) => opt.key === key)

        if (!current_directory)
            return
        setTarget(current_directory)
        if (onChange) {
            if (type === 'file' && !current_directory.is_directory) {
                onChange(current_directory);
            } else if (type === 'path') {
                onChange(current_directory);
            }
        }

        // navigate to next directory level, but only do it if it's really a directory...
        if (!current_directory.is_directory)
            return

        setLoading(true)
        try {
            const { data } = await hamstery.listMedia(current_directory.key)
            const list = listToOptions(type, data)

            const h = [...history]
            if (current_directory.is_back) {
                h.pop()
            } else {
                h.push({ key: current_directory.key, label: current_directory.label })
            }
            setHistory(h)
            if (h.length <= 1) {
                setOptions(list)
            } else {
                const last = h[h.length - 2]
                setOptions([{
                    key: last.key,
                    label: last.label,
                    is_directory: true,
                    is_back: true,
                }, ...list])
            }
            setKeyword('')
        } catch {
            notification.error({ message: 'Failed to retrieve directory info from server' })
        } finally {
            setLoading(false)
        }
    }

    return <>
        <Row>
            <Input placeholder={target?.label} value={keyword} onChange={(evt) => setKeyword(evt.target.value.toLowerCase())} />
        </Row>
        <Row>
            <Col span={24}>
                <Spin spinning={loading}>
                    <Menu
                        style={{
                            height: '100%',
                            overflowX: 'hidden',
                            overflowY: 'auto',
                            maxHeight: '40vh',
                        }}
                        mode='vertical'
                        selectedKeys={[]}
                        items={options
                            .filter(({ label, is_back }) => {
                                return is_back || keyword === '' || label.toLowerCase().includes(keyword)
                            })
                            .map(({ key, label, is_directory, is_back }) => {
                                return {
                                    key,
                                    label: is_back ? '.. [Back]' : label,
                                    icon: is_back ? <RollbackOutlined /> : is_directory ? <FolderOpenFilled /> : <FileFilled />,
                                }
                            })}
                        defaultChecked={false}
                        onClick={loadData}
                    />
                </Spin>
            </Col>
        </Row>
    </>
}

export const PathSelectorV2Modal: React.FC<{
    type: 'path' | 'file',
    onChange?: (key: IMediaResourceOption) => void,
}> = ({ type, onChange }) => {
    const [open, setOpen] = useState<boolean>(false)
    const [result, setResult] = useState<IMediaResourceOption | undefined>()
    return <>
        <Row>
            <Col flex='auto'>
                <Input placeholder='File directory' value={result?.label} disabled />
            </Col>
            <Col>
                <Button onClick={() => setOpen(true)}>Browse</Button>
            </Col>
        </Row>
        <Modal
            open={open}
            closable={false}
            onCancel={() => setOpen(false)}
            onOk={() => {
                if (onChange && result)
                    onChange(result)
                setOpen(false)
            }}
        >
            <PathSelectorBase type={type} onChange={(res) => setResult(res)} />
        </Modal>
    </>
}

export default PathSelectorBase