import { tableSubscribe } from "../services/table-server";
import { defaultCurrency } from "../services/game-server";

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
        container.innerText = `${roundWithFormatAmount(Math.floor(round2(amount / bigBlind * 100)) / 100)} BB`;
    } else if (showcurrency == "USD") {
        var img = document.createElement("img");
        img.src = "images/mobile/coins 3 (2) (1).png";
        container.classList.add("imageFeatures");

        container.appendChild(img);

        const amountText = document.createElement("span");
        amountText.innerText = ` ${roundWithFormatAmount(Math.floor(amount * usdRate * 100) / 100)}`;
        container.appendChild(amountText);
        // container.innerText = `$ ${Math.floor(amount * usdRate * 100) /100}`;
    } else if(showcurrency == "USDC"){
        // var img = document.createElement("img");
        // img.src = "./images/mobile/usdc_icon2.png";
        // container.classList.add("imageFeatures2");
        // container.appendChild(img);
        const amountText = document.createElement("span");
        amountText.innerText = ` ${roundWithFormatAmount(amount)}`;
        container.appendChild(amountText);
    } else {
        var img = document.createElement("img");
        img.src = "images/mobile/coins 3 (1).png";
        container.classList.add("imageFeatures");

        container.appendChild(img);

        const amountText = document.createElement("span");
        amountText.innerText = ` ${roundWithFormatAmount(amount)}`;
        container.appendChild(amountText);
    }

    return container;
}

export function getMoneyValue(amount) {
    if (amount == undefined)
        amount = 0;

    if (showcurrency == "BB") {
        return Math.floor(round2(amount / bigBlind * 100)) / 100;
    } else if (showcurrency == "USD") {
        return Math.floor(round2(amount * usdRate * 100)) / 100;
    }
    return round2(amount);
}

export function getRoundValue(amount) {
    if (amount == undefined)
        amount = 0;

    return Math.floor(amount * 100) / 100;
}

export function getMoneyOriginalValue(amount) {
    if (amount == undefined)
        amount = 0;

    if (showcurrency == "BB") {
        return Math.floor(round2(amount * bigBlind * 100)) / 100;
    } else if (showcurrency == "USD") {
        return Math.floor(round2(amount / usdRate * 100)) / 100;
    }
    return round2(amount);
}

export function round2(n) {
    return Math.round(n * 100) / 100;
}

export function updatCurrency() {
    if (showAsBBCheckbox.checked) {
        showcurrency = "BB";
    } else if (showAsSUDCheckbox.checked) {
        showcurrency = "USD";
    } else {
        showcurrency = defaultCurrency;
    }
}
export function roundWithFormatAmount(n) {
    var amount = Math.round(n * 100) / 100
    if (amount >= 10000 && amount % 1000 === 0) {
        return (amount / 1000) + 'K';
    }
    return amount.toLocaleString('en-US');
}

function onTableSettings(settings) {
    bigBlind = settings.bigBlind;
    usdRate = parseFloat(settings.usdRate).toFixed(2);
}

tableSubscribe("onTableSettings", onTableSettings);