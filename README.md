# Welcome to StuCo repo!

## Backend
### Getting Started
The following dependencies have already been installed. 
However, if this does not work on your machine due to missing dependencies, follow the steps below.

In order to ensure that you are able to run the backend API, you need to install the following dependencies.
```
npm install express mongoose jsonwebtoken bcryptjs dotenv cors cookie-parser cloudinary 
```
The above will install all the necessary dependencies the project uses.

Install the following dev dependency
```
npm install -D nodemon
```

In your `package.json` file, change the `"scripts` to the following:
```
"scripts": {
  "dev": "nodemon server.js"
}
```
and also add the following below the author tag:
```
...
"author": "",
"type": "module",
```
You should be ready to run the backend server.
### Environment
You will need to make an account with the following services:
- MongoDB
- Cloudinary

create a JWT token by following this in git bash:
```
openssl rand -base64 32
```

After you have done so, locate and fill out the following and put them inside of your .env file
```
MONGO_URI=[INSERT YOUR MONGO URI FROM MONGODB HERE]
PORT=5000
JWT_SECRET=[GENERATE AND USE A 32 char long token]
NODE_ENV=development
CLOUDINARY_CLOUD_NAME=[INSERT CLOUDINARY CLOUD NAME]
CLOUDINARY_API_KEY=[INSERT API KEY]
CLOUDINARY_API_SECRET=[INSERT API SECRET]
```

You will need to build your own Postman collections and requests if you want to test just the backend.