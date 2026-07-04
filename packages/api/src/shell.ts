/** Root redirect: first-run wizard vs returning studio. */
export const SHELL_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>ditto by ION</title>
<script>location.replace(localStorage.getItem("ditto_onboarded")?"/studio":"/wizard");</script>
</head><body></body></html>`;
