const fourColorsCheckbox = $("#fourColorsCheckbox")[0];
fourColorsCheckbox.addEventListener('click', () => {
    setFourColors(!fourColorsCheckbox.checked);
});
let fourColors = false;

const cardImages = [];

const cardsImageProperties = {
    cardWidth: 102,
    cardHeight: 142
}

function setup() {
    setupCardImages();
}

function setupCardImages() {
    const suites = ["s", "c", "d", "h"];
    const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    const addImage = (suit, value) => {
        const image = new Image();
        let name = value + suit;
        cardImages[name.toLowerCase()] = image;
        if (fourColors && (suit == "c" || suit == "d"))
            name += "1";
        image.src = `./images/png/102x142/${name.toString().toLowerCase()}.png`;
    };
    for (const suit of suites) {
        for (const value of values) {
            addImage(suit, value);
        }
    }
    const image = new Image();
    cardImages["back"] = image;
    image.src = `./images/png/102x142/back.png`;

    const image_1 = new Image();
    cardImages["mask"] = image_1;
    image_1.src = `./images/png/102x142/mask.png`;

}

function getCardImage(cardName) {

    let name = cardName.toString().toLowerCase();
    name = name.replace("t", "10");
    if (name == "?") name = "back";
    return cardImages[name];
}

export function getPlayerCardHandGroup(cards) {
    var values = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
    cards = cards.map(card => {
        card = card.split("");
        return { card: card[0], suites: card[1] };
    });

    cards.sort((a, b) => {
        return values.indexOf(a.card) > values.indexOf(b.card) ? 1 : -1;
    });

    var group = cards[0].card + cards[1].card;
    if (cards[0].card == cards[1].card) {
        return group;
    } else if (cards[0].suites == cards[1].suites) {
        return group + 's';
    } else {
        return group + 'o';
    }
}

export function getCardImageFilePath(cardName) {

    let name = cardName.toString().toLowerCase();
    name = name.replace("t", "10");
    if (name == "?") name = "back";
    if ((name.includes('c') || name.includes('d')) && fourColors)
        name = name + '1';

    return `./images/png/102x142/${name}.png`;
}

function setFourColors(value) {
    fourColors = value;
    setupCardImages();

    const cards = $(".front");
    for (const card of cards) {
        const filePath = card.src;
        if (value && (filePath.at(-5) == 'c' || filePath.at(-5) == 'd')) {
            card.src = filePath.slice(0, filePath.length - 4) + "1.png";
        } else if (!value && (filePath.at(-6) == 'c' || filePath.at(-6) == 'd')) {
            card.src = filePath.slice(0, filePath.length - 5) + ".png";
        }
    }
}

setup();
export class Card {
    constructor(canvas) {
        this.canvas = canvas;
        this.cardName = "?";
        this.position = 0;
        this.ratio = 1;
    }

    setCardName(cardName) {
        this.cardName = cardName;
    }

    setRatio(value) {
        this.ratio = value;
    }

    setPosition(position) {
        this.position = position;
    }

    drawCard() {
        const context = this.canvas.getContext("2d");
        const dx = this.position * cardsImageProperties.cardWidth * this.ratio;
        context.drawImage(getCardImage(this.cardName),
            dx, 0, cardsImageProperties.cardWidth * this.ratio, cardsImageProperties.cardHeight * this.ratio);
    }

    setMask() {
        const context = this.canvas.getContext("2d");
        const dx = this.position * cardsImageProperties.cardWidth * this.ratio;
        context.drawImage(getCardImage("mask"),
            dx, 0, cardsImageProperties.cardWidth * this.ratio, cardsImageProperties.cardHeight * this.ratio);
    }
}

export default {
    setup,
    setFourColors
}