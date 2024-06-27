import { tableSubscribe } from "../services/table-server";

const showAsBBCheckbox = $("#showAsBBCheckbox")[0];
const showAsSUDCheckbox = $("#showAsSUDCheckbox")[0];
let bigBlind = 20;
let usdRate = 0;
var showcurrency = "XRP";
/**
 * Gets the text that is to be displayed for the given amount.
 * If "Show values as BB ratio" is checked, gives ratio text.
 * @param {Number} amount 
 */
export function getMoneyText(amount) {
    if (amount == undefined)
        amount = 0;

    const container = document.createElement("div");

    if (showcurrency == "BB") {
        container.innerText = `${Math.floor(amount / bigBlind * 100) / 100} BB`;
    } else if (showcurrency == "USD") {
        console.log(amount);
        console.log(usdRate);
        console.log(Math.floor(amount * usdRate * 100) / 100);
        var img = document.createElement("img");
        img.src = "images/mobile/coins 3 (2) (1).png";
        container.classList.add("imageFeatures1");

        container.appendChild(img);

        const amountText = document.createElement("span");
        amountText.innerText = ` ${Math.floor(amount * usdRate * 100) / 100}`;
        container.appendChild(amountText);
        // container.innerText = `$ ${Math.floor(amount * usdRate * 100) /100}`;
    } else {
        var img = document.createElement("img");
        img.src = "images/mobile/coins 3 (1).png";
        container.classList.add("imageFeatures");

        container.appendChild(img);

        const amountText = document.createElement("span");
        amountText.innerText = ` ${Math.floor(amount * 100) / 100}`;
        container.appendChild(amountText);
    }

    return container;
}

export function getMoneyValue(amount) {
    if (amount == undefined)
        amount = 0;

    if (showcurrency == "BB") {
        return Math.floor(amount / bigBlind * 100) / 100;
    } else if (showcurrency == "USD") {
        return Math.floor(amount * usdRate * 100) / 100;
    }
    return Math.floor(amount * 100) / 100;
}

export function getRoundValue(amount) {
    if (amount == undefined)
        amount = 0;

    return Math.floor(amount * 100) / 100;
}

export function getMoneyOriginalValue(amount) {
    if (amount == undefined)
        amount = 0;

    // console.error(`usdRate : ${usdRate},bigBlind : ${bigBlind},amount : ${amount},showAsBBCheckbox : ${showAsBBCheckbox.checked},showAsSUDCheckbox : ${showAsSUDCheckbox.checked}`);
    if (showcurrency == "BB") {
        return Math.floor(amount * bigBlind * 100) / 100;
    } else if (showcurrency == "USD") {
        return Math.floor(amount / usdRate * 100) / 100;
    }
    return Math.floor(amount * 100) / 100;
}

export function updatCurrency() {
    if (showAsBBCheckbox.checked) {
        showcurrency = "BB";
    } else if (showAsSUDCheckbox.checked) {
        showcurrency = "USD";
    } else {
        showcurrency = "XRP";
    }
}


function onTableSettings(settings) {
    bigBlind = settings.bigBlind;
    usdRate = parseFloat(settings.usdRate).toFixed(2);
}

tableSubscribe("onTableSettings", onTableSettings);