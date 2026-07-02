const app_name = 'cop4331-9.com';

export function buildPath(route: string): string
{
    if(process.env.NODE_ENV != 'development')
    {
        return 'http://' + app_name + ':5000/' + route;
    }
    else
    {
        return 'http://localhost:5000/' + route;
    }
}