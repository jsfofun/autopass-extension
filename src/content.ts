import browser from "webextension-polyfill";
import { v3 as hash } from "murmurhash";

async function handleFormSubmit(event: Event) {
    console.log(event);
    // Skip if the event target isn't a form
    if (!(event.target instanceof HTMLFormElement)) return;

    const form = event.target;
    const formData = new FormData(form);
    const formValues: Record<string, any> = {};
    let login = String(hash(JSON.stringify(formData)));

    // Process form data
    formData.forEach((value, key) => {
        if (formValues[key]) {
            formValues[key] = Array.isArray(formValues[key]) ? [...formValues[key], value] : [formValues[key], value];
        } else {
            formValues[key] = value;
        }
    });

    // Send data to background script
    await browser.runtime
        .sendMessage({
            type: "FORM_SUBMIT",
            data: {
                url: window.location.href,
                formId: form.id || null,
                formClass: form.className || null,
                values: formValues,
                login,
            },
        })
        .catch((error) => console.error("Message send failed:", error));
}

// Single event listener at the document level (capturing phase)
document.addEventListener("submit", handleFormSubmit, true);
