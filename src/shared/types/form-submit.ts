/** Payload sent from content script to background when an auth form is submitted. */
export type FormSubmitPayload = {
    type: "FORM_SUBMIT";
    data: {
        url: string;
        formAction: string;
        formId: string;
        formClass: string;
        values: Record<string, string>;
        login: string;
    };
};
