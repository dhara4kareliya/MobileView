let colorValue = 'fullcolor';
export function setDeckCardValue(value){
    colorValue = value
    setFourColors();
} 

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
        if (colorValue == '4color' && (suit == "c" || suit == "d")) 
                name += "1";

        var src = `./images/png/102x142/${name}.png`;

        if (colorValue == 'fullcolor') 
            src = `./images/png/4-card/${name}.png`;

        image.src = src;
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
    if ((name.includes('c') || name.includes('d')) && colorValue == '4color')
        name = name + '1';

     var src = `./images/png/102x142/${name}.png`;
    if (colorValue == 'fullcolor')
        src =  `./images/png/4-card/${name}.png`;

    return src;
}

function setFourColors(value) {
    setupCardImages();

    const cards = $(".front");
    for (const card of cards) {
        const filePath = card.src;
       const fileName = filePath.split("/").pop();
        let baseName = fileName.replace(".png", "").replace(/1$/, "");
        let suit = baseName[baseName.length - 1]; 
        let newFileName;

        if (colorValue === '4color') {
            if (suit === 'c' || suit === 'd') {
                newFileName = `${baseName}1.png`;
            } else {
                newFileName = `${baseName}.png`;  
            }
        } else if (colorValue === '2color') {
            newFileName = `${baseName}.png`;      
        }

        card.src = `./images/png/102x142/${newFileName}`;
        if(colorValue == 'fullcolor') {
            card.src = `./images/png/4-card/${baseName}.png`;
        } 
    }
}

export function initializeDeck() {
    return [
        'AS', 'KS', 'QS', 'JS', 'TS', '9S', '8S', '7S', '6S', '5S', '4S', '3S', '2S',
        'AH', 'KH', 'QH', 'JH', 'TH', '9H', '8H', '7H', '6H', '5H', '4H', '3H', '2H',
        'AD', 'KD', 'QD', 'JD', 'TD', '9D', '8D', '7D', '6D', '5D', '4D', '3D', '2D',
        'AC', 'KC', 'QC', 'JC', 'TC', '9C', '8C', '7C', '6C', '5C', '4C', '3C', '2C'
    ];
}

// Encrypted Shuffle

export class CardShuffler {
    // XOR two buffers
    static xorBuffers(a, b) {
        if (a.length !== b.length) {
            throw new Error('Buffers must be of the same length to XOR.');
        }
        const xorResult = Buffer.alloc(a.length);
        for (let i = 0; i < a.length; i++) {
            xorResult[i] = a[i] ^ b[i];
        }
        return xorResult;
    }

    // Generate a deterministic shuffle using a seed
    static shuffleArray(array, seed) {
        const random = this.mulberry32(seed);
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Create a random number generator based on a seed
    static mulberry32(seed) {
        return function() {
            let t = (seed += 0x6d2b79f5);
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    // Perform the shuffle
    shuffle(cards, shuffleKey) {
        if (!Array.isArray(cards)) {
            throw new Error('Cards must be an array.');
        }
        if (typeof shuffleKey !== 'string') {
            throw new Error('Shuffle key must be a string.');
        }

        // Convert shuffleKey to a numeric seed
        const seed = parseInt(shuffleKey.substring(0, 16), 16);

        // Shuffle the array using the seed
        return CardShuffler.shuffleArray(cards.slice(), seed); // Use slice to avoid mutating original
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