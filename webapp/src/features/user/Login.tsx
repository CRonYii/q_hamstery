import React from 'react';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input, Spin } from 'antd';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '../../app/hook';
import { loginHamstery, userSelector } from './userSlice';

function Login() {
    const dispatch = useAppDispatch()
    const user = useSelector(userSelector)

    const onLogin = (credentials: { username: string, password: string }) => {
        dispatch(loginHamstery(credentials))
    }

    return (
        <div>
            <div className='login-form'>
                <h3 style={{ textAlign: 'center' }}>Hamstery Login</h3>
                <Spin spinning={user.loading} size='large'>
                    <Form
                        name="login"
                        labelCol={{ span: 8 }}
                        wrapperCol={{ span: 16 }}
                        onFinish={onLogin}
                    >
                        <Form.Item
                            label="Username"
                            name="username"
                            rules={[{ required: true, message: 'Please input your username!' }]}
                        >
                            <Input prefix={<UserOutlined />} />
                        </Form.Item>

                        <Form.Item
                            label="Password"
                            name="password"
                            rules={[{ required: true, message: 'Please input your password!' }]}
                        >
                            <Input.Password prefix={<LockOutlined />} />
                        </Form.Item>

                        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                            <Button type="primary" htmlType="submit">
                                Login
                            </Button>
                        </Form.Item>
                    </Form>
                </Spin>
            </div>
        </div>
    );
}

export default Login;