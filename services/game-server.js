import { Get, Post } from "../http-client";
import { connectSocket, joinToTs, subscribe, joinToTsWithMtData } from "../socket-client";

export let userToken = getParamToken();

let tsData = undefined;
let mtData = undefined;

export const userMode = getParamUserMode();
// export const userMode = 1;

connect().catch(err => {
    console.error(err);
});
subscribe("onConnect", join);
subscribe("onDisconnect", reconnect);

async function reconnect () {
    $('.error-message')[0].innerHTML = "Socket disconnected, reconnecting"
    $('#msgModal').modal('show');

    await getTs(userToken);
    if (!tsData.status)
        throw tsData.message;
    connectSocket(tsData.server);
}

async function connect () {
    if (userToken) {
        await getTs(userToken);
        if (!tsData.status)
            throw tsData.message;
        connectSocket(tsData.server);
    } else {
        login("test_player", "123");
    }
}

export function getParamGameId () {
    return getParam("gameId");
}

/**
 * @returns {String} the token that was passed through the url.
 */
function getParamToken () {
    return getParam("t");
}

function getParamUserMode () {
    return getParam("Observer");
}

function getParam (paramName) {
    const matches = window.location.href.match(`${paramName}=([^&]+)`);
    if (matches)
        return matches[1];
}

export async function login (userId, password) {
    if (!userId)
        throw "No user ID";
    if (!password)
        throw "No password";
    let response = await Post("api/users/authenticate", {
        username: userId,
        password: password
    });
    
    response = JSON.parse(response);
    userToken = response.token;
    await getTs(userToken);

    const server = addProtocol(tsData.server); 
    connectSocket(server);
    return response;
}

export async function getTs (token) {
    let response = await Get(`api.php?api=get_ts&t=${token}`);
    response = JSON.parse(response);
    tsData = response;
    console.log(tsData);
    return response;
}

export function join () {
    if (!userToken) {
        joinToTsWithMtData(mtData.user, mtData.table_token);
        return;
    }

    joinToTs(userToken, tsData.token, userMode === 1 ? 'Observer' : 'Player');
}

export function setServer (server, token) {
    tsData.server = addProtocol(server);
    tsData.token = token;
}

function addProtocol (url) {
    const searchString = String(url);
    if (searchString.indexOf('http://') == -1 && searchString.indexOf('https://') == -1) {
        return 'https://' + searchString;
    }

    if (searchString.indexOf('http://') != -1) {
        return 'http://' + searchString.slice(7, searchString.length)
    }

    return searchString;
}

export function connectWithMtData (mtTsData) {
    tsData = {
        server: addProtocol(mtTsData.server),
        token: mtTsData.table_token
    }
    mtData = mtTsData;

    connectSocket(tsData.server);
    joinToTsWithMtData(mtTsData.user, mtTsData.table_token);
}

window.getParamToken = getParamToken;