# Test log index

The current visual follow-up patch is `1.0.3-transfer.3`.

| Current-build evidence | Scope |
|---|---|
| `qa-javascript.log` | Complete JavaScript suite: 777 passed |
| `qa-python.log` | Complete Python suite: 36 passed |
| `qa-cpp.log` | Complete C++ suite: 34 passed |
| `transfer-review-regressions.log` | Eleven focused interface cases: all passed |
| `transfer-full-router.log` | Full app entry/router and 15-question session: passed |
| `transfer-original-dom.log` | Earlier Transfer smoke check rerun: passed |
| `previous-fixes-dom.log` | Previous Kickstarter fix checks rerun: passed |
| `qa-diversity.log` | Generator sweep, branch diagnostics and unchanged ordinary mocks |
| `qa-independent-transfer.log` | Independent Python verification of 1,300 exported additions |

Files beginning `expected-failures-original-` deliberately retain failing checks against the earlier release. They demonstrate the defects before the fixes; they are not failures of this patched build. Other logs retain the initial Transfer release evidence.

These scripts use a DOM harness. A separate desktop Chrome visual pass subsequently succeeded; observations are recorded in `../visual-browser-results.json` and the root `TRANSFER_TEST_REPORT.md`. Mobile and other browsers remain untested.
