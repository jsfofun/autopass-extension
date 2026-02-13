export type Save = {
    website: string;
    hash_data: string;
    form_id: string;
    form_classname: string;
    fields: {
        [x: string]: string;
        password: string;
    };
    id: bigint;
    user_id: bigint;
};
