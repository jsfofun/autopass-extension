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
// Reading manifest: Warning processing permissions: Error processing permissions.4: Value "http://localhost:1212/api/save" must either: must either [must either [be one of ["idle"], be one of ["menus.overrideContext"], be one of ["search"], be one of ["tabGroups"], be one of ["activeTab"], be one of ["cookies"], be one of ["scripting"], or be one of ["webRequest", "webRequestAuthProvider", "webRequestBlocking", "webRequestFilterResponse", "webRequestFilterResponse.serviceWorkerScript"]], must either [be one of ["mozillaAddons"], be one of ["normandyAddonStudy"], be one of ["activityLog"], be one of ["networkStatus"], or be one of ["telemetry"]], be one of ["alarms", "storage", "unlimitedStorage"], be one of ["captivePortal"], be one of ["contextualIdentities"], be one of ["identity"], be one of ["menus", "contextMenus"], be one of ["geckoProfiler"], be one of ["declarativeNetRequestWithHostAccess"], be one of ["dns"], or be one of ["theme"]], must either [must either [be one of ["idle"], be one of ["menus.overrideContext"], be one of ["search"], be one of ["tabGroups"], be one of ["activeTab"], be one of ["cookies"], be one of ["scripting"], or be one of ["webRequest", "webRequestAuthProvider", "webRequestBlocking", "webRequestFilterResponse", "webRequestFilterResponse.serviceWorkerScript"]], be one of ["clipboardRead", "clipboardWrite", "geolocation", "notifications"], be one of ["bookmarks"], be one of ["browsingData"], be one of ["devtools"], be one of ["find"], be one of ["history"], be one of ["pkcs11"], be one of ["sessions"], be one of ["tabs", "tabHide"], be one of ["topSites"], be one of ["browserSettings"], be one of ["declarativeNetRequestFeedback"], be one of ["downloads", "downloads.open"], be one of ["management"], be one of ["privacy"], be one of ["proxy"], be one of ["nativeMessaging"], or be one of ["webNavigation"]], be one of ["declarativeNetRequest"], or match the pattern /^experiments(\.\w+)+$/
