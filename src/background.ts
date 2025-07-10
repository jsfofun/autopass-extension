import browser from "webextension-polyfill";
import api from "./api";
console.log("Background script started");
api.getRequest(
    "/user/login",
    {
        password: "password",
        username: "example",
    },
    "POST",
).catch(console.error);
browser.runtime.onMessage.addListener((message: any, sender: browser.Runtime.MessageSender) => {
    console.log(message);
    if (message.type === "FORM_SUBMIT") {
        const { url, formId, formClass, values, login } = message.data;

        // TODO SAVE THIS DATA IN SERVER
        console.log("Form data:", {
            url,
            formIdentifier: formId || formClass || "unknown",
            values,
        });
        api.UpsertSave({
            hash_data: login,
            fields: values,
            website: url,
        });
        return Promise.resolve();
    }
    if (message.action === "getUrl") {
        return Promise.resolve(sender.tab?.url);
    }
});
