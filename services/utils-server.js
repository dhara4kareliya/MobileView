import { SHA256, lib } from 'crypto-js';
import { getMessage } from "../UI/language-ui";

export function generateHashAndRandomString() {
    const randomString = lib.WordArray.random(64).toString();
    const hash = SHA256(randomString).toString();
    return { randomString, hash };
}

export function verifyJSONFromServer(data) {
    var players = [];
    for (const [userId, randomStr] of Object.entries(data.randomStrings)) {
        const computedHash = SHA256(randomStr).toString();
        if (computedHash !== data.hashes[userId])
            players.push(userId);
    }

    if (players.length > 1)
        return { "status": false, "message": `Hash mismatch for`, players };

    return { "status": true, "message": getMessage('playerHashMatch'), players };
}

export class customTimer {
    constructor() {
        this.timerId = undefined;
    }

    stopTimer() {
        if (this.timerId !== undefined) {
            cancelAnimationFrame(this.timerId); 
            this.timerId = undefined; // Reset the timer ID
        }
    }

    clockTimer(date, callBack) {
        var startTimes = performance.now();

        const update = () => {
            date.setTime(date.getTime() + (performance.now() - startTimes));
            startTimes = performance.now();
            callBack(date);
            this.timerId = requestAnimationFrame(update);
        }

        this.timerId = requestAnimationFrame(update);
    }

    descendingTimer(duration, callBack) {
        const totalMs = Number(duration) * 1000;
        const endTime = performance.now() + totalMs;
        const update = () => {
            const remainingMs = endTime - performance.now();
            callBack(this.formatTime(remainingMs));

            if (remainingMs <= 0) {
                callBack({
                    days: "0",
                    hours: "0",
                    minutes: "0",
                    seconds: "0"
                });
                return; // Timer done
            }

            this.timerId = requestAnimationFrame(update);
        }

        this.timerId = requestAnimationFrame(update);
    }

    formatTime(ms) {
        const totalSeconds = Math.max(Math.ceil(ms / 1000), 0);
        const days = String(Math.floor(totalSeconds / 86400)).padStart(2, '0');
        const hours = String(Math.floor((totalSeconds % 86400) / 3600)).padStart(2, '0');
        const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        return {
            days,
            hours,
            minutes,
            seconds
        };
    }
}


export function verifySeed(seed, jsonString) {
    const shuffleKey = SHA256(jsonString).toString();
    return shuffleKey === seed;
}