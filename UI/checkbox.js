const checkedClass = "checked";
const checkboxClass = ".checkbox";
const checkboxes = $(checkboxClass);

export function toggleCheckbox (checkbox, value) {
    let qcheckbox = $(checkbox);
    if (qcheckbox.hasClass(checkedClass) && value != true)
        qcheckbox.removeClass(checkedClass);
    else if (value != false)
        qcheckbox.addClass(checkedClass);
    checkbox.checked = qcheckbox.hasClass(checkedClass);
    // checkbox.dispatchEvent(new Event('change'));
}

for (const checkbox of checkboxes) {
    let parentButton = $(checkbox).parent('button')[0];
    if (!parentButton)
        parentButton = $(checkbox).parent('#settingsMenu > div > div')[0];
    if (parentButton)
        parentButton.addEventListener('click', () => toggleCheckbox(checkbox));
    else
        checkbox.addEventListener('click', () => toggleCheckbox(checkbox));
    checkbox.checked = false;
}