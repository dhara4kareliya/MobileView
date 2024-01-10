import { getMoneyText, getMoneyValue } from "./money-display";

const sliderClass = ".slider";
const thumbClass = ".thumb";
const displayClass = ".valueDisplay";
const sliders = $(sliderClass);
const displays = $(displayClass);
const betInput = $("#betDivWrapper input")[0];

let mouseDown = false;
window.addEventListener('mousedown', () => mouseDown = true);
window.addEventListener('mouseup', () => mouseDown = false);
window.addEventListener('touchstart', () => mouseDown = true);
window.addEventListener('touchend', () => mouseDown = false);

for (const slider of sliders) {
    slider.max = 100;
    slider.min = 0;
    slider.value = 0;
    slider.addEventListener('mousemove', event => slide(slider, event));
    slider.addEventListener('touchmove', event => slide(slider, event));
    slider.addEventListener('mousedown', event => {
        mouseDown = true;
        slide(slider, event);
    });
    slider.addEventListener('change', () => {
        updateDisplay(slider);
    });
}

function offsetofElement(elem) {
    if (!elem) elem = this;

    var x = elem.offsetLeft;
    var y = elem.offsetTop;

    while (elem = elem.offsetParent) {
        x += elem.offsetLeft;
        y += elem.offsetTop;
    }

    return { left: x, top: y };
}

function slide(slider, event) {
    if (event.changedTouches) {
        const offset = offsetofElement(slider);
        const touch = event.changedTouches[0];
        event.offsetX = touch.clientX - offset.left + window.scrollX;
        event.offsetY = touch.clientY - offset.top + window.screenY;
    }
    if (!mouseDown)
        return;
    const vertical = slider.offsetHeight > slider.offsetWidth;
    const thumb = $(slider).find(thumbClass)[0];
    let precent = 100 *
        (vertical ? (event.offsetY / slider.offsetHeight) : (event.offsetX / slider.offsetWidth));
    if (precent < 0)
        precent = 0;
    else if (precent > 100)
        precent = 100;
    thumb.style[vertical ? "top" : "left"] = `${precent - (vertical ? 5 : 0)}%`;
    let part = precent / 100;
    if (vertical)
        part = 1 - part;
    const range = slider.max - slider.min;
    slider.value = slider.min + range * part;
    slider.dispatchEvent(new Event('change', { value: slider.value }));
}

function updateDisplay(slider) {
    for (const display of displays) {
        if ($(display).hasClass(slider.id)){
        const amountText = getMoneyText(slider.value);
            display.innerHTML = $(display).hasClass("moneyDisplay") ?
            amountText.outerHTML :
            getMoneyValue(slider.value);
        }
    }

    betInput.value = getMoneyValue(slider.value);
}

export function setSliderValue(slider, value) {
    if (value < slider.min)
        value = slider.min;
    else if (value > slider.max)
        value = slider.max;
    const vertical = slider.offsetHeight > slider.offsetWidth;
    const thumb = $(slider).find(thumbClass)[0];
    const range = slider.max - slider.min;
    let part = value - slider.min;
    part /= range;
    if (vertical)
        part = 1 - part;
    const precent = 100 * part;
    thumb.style[vertical ? "top" : "left"] = `${precent}%`;
    slider.value = value;
    slider.dispatchEvent(new Event('change', { value: value }));
}

export function setSliderMin(slider, min) {
    slider.min = min;
    if (slider.value < min)
        setSliderValue(slider, min);
    else
        setSliderValue(slider, slider.value);
}

export function setSliderMax(slider, max) {
    slider.max = max;
    if (slider.value > max)
        setSliderValue(slider, max);
    else
        setSliderValue(slider, slider.value);
}