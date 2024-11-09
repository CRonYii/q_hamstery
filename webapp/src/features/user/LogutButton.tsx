import { LogoutOutlined } from '@ant-design/icons';
import { Button, ButtonProps } from 'antd';
import React from 'react';
import { useAppDispatch } from '../../app/hook';
import { userActions } from '../../features/user/userSlice';

const LogoutButton: React.FC<ButtonProps> = (props) => {
    const dispatch = useAppDispatch()

    return <Button
        danger type='primary' size='middle'
        icon={<LogoutOutlined />}
        onClick={() => dispatch(userActions.logout(undefined))}
        {...props}
    >Logout</Button>
}

export default LogoutButton;