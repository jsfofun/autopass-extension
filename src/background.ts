import browser from "webextension-polyfill";

console.log("Background script started");

browser.runtime.onMessage.addListener((message: any, sender: browser.Runtime.MessageSender) => {
  if (message.type === "FORM_SUBMIT") {
    const { url, formId, formClass, values } = message.data;

    // TODO SAVE THIS DATA IN SERVER
    console.log("Form data:", {
      url,
      formIdentifier: formId || formClass || "unknown",
      values,
    });

    return Promise.resolve();
  }
  if (message.action === "getUrl") {
    return Promise.resolve(sender.tab?.url);
  }
});
