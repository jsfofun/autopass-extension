import { default as browser } from "webextension-polyfill";
import api from "./api";
import { AES } from "./utils/aes";

console.log("Background script started");
const data = {
    password: "password",
    username: "example",
};

browser.runtime.onMessage.addListener((message: any, sender: browser.Runtime.MessageSender) => {
    console.log(message);
    if (message.type === "FORM_SUBMIT") {
        const { url, formId, formClass, values, login } = message.data;
        const jsonData = JSON.stringify({
            hash_data: login,
            fields: values,
            form_classname: formClass,
            form_id: formId,
            website: url,
        });

        api.UpsertSave({
            hash_data: login,
            fields: values,
            form_classname: formClass,
            form_id: formId,
            website: url,
        });
        return Promise.resolve();
    }
    if (message.action === "getUrl") {
        return Promise.resolve(sender.tab?.url);
    }
});
