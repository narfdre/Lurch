# Lurch

### You Rang?

##### Deploy and manage any app that supports/works with foreman

###### Steps to run

* npm install -g foreman
* npm install
* create .env file
* create github developer application and add the following
```
    NODE_ENV=development
    GITHUB_CLIENT_ID={{Client_Id}}
    GITHUB_CLIENT_SECRET={{Client_Secret}}
    GITHUB_CALLBACK_URL=http://localhost:3000/github/auth
```
* run with command
```
    nf start
```