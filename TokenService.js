const jwt = require('jsonwebtoken');
const jwkToPem = require('jwk-to-pem');
const appConfig = require('./config/config.json');
const jwks = {
    "keys": [
        {
            "alg": "RS256",
            "e": "AQAB",
            "kid": "BazlPeGqASNlZvt58/VFKBavliC2RQI/x1AyUa3Jbuw=",
            "kty": "RSA",
            "n": "mMuOdxqNCjk1qlMSU1CK4Rmu3C3ln32SVcS67cWRDePKK8fTMPQujFzRIeC1zG1BiLLOHMiIs1h7k8184oFR_2uWrS_aI5dASXZCX8n65X06tuCnDnNEFBkA8PIWXwezxqtZTAuFEXf4kA2q1zhEhVe_k0-4whHnc7ng7HG25aO3nYZu-RHCoRXjD2yHgTK6CYl_TGPAkulIRuCsCdCQwXHXGHirr4Md0vuXZhMEs7Ist7Wzj8E3Gx9DfjOTJb_XISfHCq_PfaW4WhxLWxXbpH77W4LPb6Ds-LUqyVUt1ubpapoLz8cZEX0tJN_4lzvXesnynA-EyOvp1cnyOvMA0w",
            "use": "sig"
        },
        {
            "alg": "RS256",
            "e": "AQAB",
            "kid": "D4Mxpm+rtxP7tMOLrfJkTQpGzxMtfFh3i3QGywT4ZDc=",
            "kty": "RSA",
            "n": "nKJ-DXw0BSo9wrCUon1m08XXbQ4oTCutkqyyjDdzsqFe80KPv9UWHuGi4dtHg3Sz-GwMdo4IHbEMfCOoo6Z6xHB1Jd0DqiSnkYACRonB6kSqYf8TLEVwTa0UWm7920OD22dy25cioqoYNtkflnH48SdD73Jl_wmYkOfo6Vh3LgEciGJPfkg9qIe92cCJrTsiT2mL-FP_dMGEyhxECKYi9P_9lTihbTqSVqZS2nsJKJKZXUQM_XQVL2fGBpoDQwBWk_CfzIy7zBSa2CMjSwCdiEQXuVGvADJ28IfRh5Nszob-yeEKy4EtQov9JchrEvp-6JK46gSbtVgX6PR7wJHpiw",
            "use": "sig"
        }
    ]
};

async function validateToken(authorizationHeaderValue) {
    // Check the format of the authorizationHeaderValue header string and break out the JWT token part
    if (!authorizationHeaderValue || authorizationHeaderValue.length < 10) {
        return new Error('Invalid or missing Authorization header. Expected to be in the format \'Bearer <your_JWT_token>\'.');
    }
    const authPrefix = authorizationHeaderValue.substring(0, 7).toLowerCase();
    if (authPrefix !== 'bearer ') {
        return new Error('Authorization header is expected to be in the format \'Bearer <your_JWT_token>\'.');
    }
    const token = authorizationHeaderValue.substring(7);

    // Decode the JWT token so we can match it to a key to verify it against
    const decodedNotVerified = jwt.decode(token, {complete: true});
    console.log('decodedNotVerified', JSON.stringify(decodedNotVerified));
    if (!decodedNotVerified) {
        console.debug(`Invalid JWT token. jwt.decode() failure.`);
        return new Error('Authorization header contains an invalid JWT token.'); // don't return detailed info to the caller
    }

    const pems = {};
    for (let i = 0; i < jwks.keys.length; i++) {
        pems[jwks.keys[i].kid] = jwkToPem(jwks.keys[i]);
    }
    if (!decodedNotVerified.header.kid || !pems[decodedNotVerified.header.kid]) {
        console.debug(`Invalid JWT token. Expected a known KID ${JSON.stringify(Object.keys(jwks))} but found ${decodedNotVerified.header.kid}.`);
        return new Error('Authorization header contains an invalid JWT token.'); // don't return detailed info to the caller
    }
    console.log("VERIFYING TOKEN");
    // Now verify the JWT signature matches the relevant key
    let decodedAndVerified = jwt.verify(token, pems[decodedNotVerified.header.kid], {algorithms: ['RS256']});
    const clientId = (decodedAndVerified.aud);
    if (clientId !== appConfig.client_id) {
        console.debug(`Invalid JWT token. Expected client id to be ${appConfig.client_id} but found ${clientId}.`);
        return new Error('Authorization header contains an invalid JWT token.'); // don't return detailed info to the caller
    }

    // Done - all JWT token claims can now be trusted
    console.log("RETURNING decodedAndVerified ", decodedAndVerified);
    return decodedAndVerified;
}

module.exports = {
    validateToken: validateToken
};
