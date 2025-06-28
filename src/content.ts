import browser from "webextension-polyfill";

function handleFormSubmit(event: Event) {
  const form = event.target as HTMLFormElement;
  const formData = new FormData(form);
  const formValues: Record<string, any> = {};
  let some_key_has_password = false;

  formData.forEach((value, key) => {
    if (key.includes("password")) some_key_has_password = true;
    if (formValues[key]) {
      formValues[key] = [...formValues[key], value];
    } else {
      formValues[key] = value;
    }
  });

  if (!some_key_has_password) return;

  browser.runtime
    .sendMessage({
      type: "FORM_SUBMIT",
      data: {
        url: window.location.href,
        formId: form.id || null,
        formClass: form.className || null,
        values: formValues,
      },
    })
    .catch((error) => console.error("Unable to send message:", error));
}

document.querySelectorAll("form").forEach((form) => {
  form.addEventListener("submit", handleFormSubmit);
});

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((node) => {
      if (node.nodeName === "FORM") {
        (node as HTMLFormElement).addEventListener("submit", handleFormSubmit);
      }
      if (node instanceof HTMLElement) {
        node.querySelectorAll("form").forEach((form) => {
          form.addEventListener("submit", handleFormSubmit);
        });
      }
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});
