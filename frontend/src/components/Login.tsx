import React, {useState} from 'react';
import axios from 'axios';
import {buildPath} from './Path';
import {storeToken} from '../tokenStorage';
import {jwtDecode} from 'jwt-decode';


function Login()
{
    const [message, setMessage] = useState('');
    const [loginName, setLoginName] = React.useState('');
    const [loginPassword, setPassword] = React.useState('');


    async function doLogin(event: any) : Promise<void>
    {
        event.preventDefault();

        let obj = {login:loginName,password:loginPassword};

        try
        {
            const response = await axios.post(buildPath('api/login'), obj)
            let res = response.data;

            if(res.error)
            {
                setMessage(res.error);
                return;
            }

            const{accessToken} = res;
            storeToken(res);

            const decoded = jwtDecode<{userId:number, firstName:string, lastName:string, role:string}> (accessToken);
            const { userId, firstName, lastName, role } = decoded;

            let user = {firstName, lastName, id:userId, role};
            localStorage.setItem('user_data', JSON.stringify(user));

            setMessage('');
            window.location.href = role === 'coach' ? '/coach' : '/athlete';
        }
        catch(error:any)
        {
            alert(error.toString());
        }
    };
    

    function handleSetLoginName(e: any) : void
    {
        setLoginName(e.target.value);
    }

    function handleSetPassword(e: any) : void
    {
        setPassword(e.target.value);
    }

    return(
        <div id="loginDiv">
            <span id="inner-title">PLEASE LOG IN</span><br />
            <input type="text" id="loginName" placeholder="Username" onChange={handleSetLoginName} /><br />
            <input type="password" id="loginPassword" placeholder="Password" onChange={handleSetPassword}/><br />
            <input type="submit" id="loginButton" className="buttons" value = "Do It" onClick={doLogin} />
            <span id="loginResult">{message}</span>
        </div>
    );
};

export default Login;