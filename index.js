const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');
const fileService = require('./FileService');
const tokenService = require('./TokenService');
const app = express();
const port = 3000;
var https = require('https')
var fs = require('fs')
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

app.listen(port, () => {
    console.log(`App running on port ${port}.`)
});

// https.createServer({
//     key: fs.readFileSync('server.key'),
//     cert: fs.readFileSync('server.cert')
// }, app)
//     .listen(3000, function () {
//         console.log('Example app listening on port 3000! Go to https://localhost:3000/')
//     })

app.get('/', (request, response) => {
    response.json({info: 'BACKEND API Node.js, Express, and Postgres API'})
});

app.post('/file_details', (request, response) => {
    console.log("Inside POST file_details API request ");
    if (!request.headers || !request.headers.authorization) {
        return response.status(401).json({message: 'Missing Authorization Header'});
    }

    tokenService.validateToken(request.headers.authorization).then((token_info) => {
        console.log("POST file_details tokenInfo ", token_info);
        return fileService.createFileDetails(request, response, token_info);
    });

});

app.put('/file_details', (request, response) => {
    console.log("Inside UPDATE PUT file_details API request ");
    if (!request.headers || !request.headers.authorization) {
        return response.status(401).json({message: 'Missing Authorization Header'});
    }

    tokenService.validateToken(request.headers.authorization).then((token_info) => {
        console.log("UPDATE PUT file_details tokenInfo ", token_info);
        return fileService.updateFileDetails(request, response, token_info);
    });

});

app.post('/signed_url', (request, response) => {
    console.log("Inside POST create signed_url API request ");
    if (!request.headers || !request.headers.authorization) {
        return response.status(401).json({message: 'Missing Authorization Header'});
    }

    tokenService.validateToken(request.headers.authorization).then((token_info) => {
        console.log("POST create signed_url tokenInfo ", token_info);

        return fileService.getSignedUrl(request, response, token_info);

    });
});

app.get('/file_details', (request, response) => {
    console.log("************** Inside GET file_details API request ");
    if (!request.headers || !request.headers.authorization) {
        return response.status(401).json({message: 'Missing Authorization Header'});
    }
    console.log("************* request.headers.authorization = ", request.headers.authorization);

    tokenService.validateToken(request.headers.authorization).then((token_info) => {
        console.log("******************* GET file_details tokenInfo ", token_info);
        return fileService.getFileDetails(request, response, token_info);
    });

});

app.delete('/file_details/:id', (request, response) => {
    console.log("************** Inside DELETE file_details API request ");
    if (!request.headers || !request.headers.authorization) {
        return response.status(401).json({message: 'Missing Authorization Header'});
    }
    console.log("************* request.headers.authorization = ", request.headers.authorization);

    tokenService.validateToken(request.headers.authorization).then((token_info) => {
        console.log("******************* DELETE file_details tokenInfo ", token_info);
        return fileService.deleteFile(request, response, token_info);
    });

});

