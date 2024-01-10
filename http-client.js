const hostAddress = "https://dev.nrpoker.net";
// const hostAddress = "http://localhost:3002";
// const hostAddress = "http://server149.xite.io:3000";

/**
 * Sends a GET request
 * @param {String} path 
 */
export async function Get(path) {
    return new Promise((resolve, reject) => {
        const xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4) {
                if (this.status == 200)
                    resolve(this.response);
                else
                    reject(this.response);
            }
        };
        xhttp.open("GET", `${hostAddress}/${path}`, true);
        xhttp.send();
    });
}

/**
 * Sends a POST request
 * @param {String} path 
 */
export async function Post(path, params) {
    return new Promise((resolve, reject) => {
        const xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4) {
                if (this.status == 200)
                    resolve(this.response);
                else
                    reject(this.response);
            }
        };
        xhttp.open("POST", `${hostAddress}/${path}`, true);
        // xhttp.setRequestHeader("Content-type", "application/json");
        xhttp.send(JSON.stringify(params));
    });
}

/**
 * Sends a PUT request
 * @param {String} path 
 */
export async function Put(path, params) {
    return new Promise((resolve, reject) => {
        const xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4) {
                if (this.status == 200)
                    resolve(this.response);
                else
                    reject(this.response);
            }
        };
        xhttp.open("PUT", `${hostAddress}/${path}`, true);
        xhttp.setRequestHeader("Content-type", "application/json");
        xhttp.send(JSON.stringify(params));
    });
}

/**
 * Sends a DELETE request
 * @param {String} path 
 */
export async function Delete(path) {
    return new Promise((resolve, reject) => {
        const xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4) {
                if (this.status == 200)
                    resolve(this.response);
                else
                    reject(this.response);
            }
        };
        xhttp.open("DELETE", `${hostAddress}/${path}`, true);
        xhttp.send();
    });
}