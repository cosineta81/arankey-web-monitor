# ARANKEY independent availability monitor

Monitors only the public website at https://web-arankey.vercel.app from GitHub Actions, independently of Vercel. No CRM key, spreadsheet ID, property rows, Google token or email password is required or stored.

Checks every 15 minutes (UTC minutes 7, 22, 37 and 52): homepage HTML, `/healthz` and the semantic success of `/api/public/properties`. Each failing check is retried once after five seconds. An empty public selection is valid; an unavailable source, login page, malformed JSON, unexpected private fields, HTTP failure or TLS/network failure fails the run.

The scheduled workflow creator is the recipient of GitHub Actions notifications. In https://github.com/settings/notifications enable **Actions → Email**, optionally **Only notify for failed workflows**, and select the desired verified email account. The workflow records no email address. GitHub controls delivery; email receipt must be confirmed by the user.

Use the manual `test_alert` input for an explicitly labelled notification test. It deliberately fails the monitor run after checking the real site, without taking the site offline or changing its data. Run normally afterwards to verify recovery.

A daily sample at 03:43 UTC is committed under `history/`. It is a real daily observation, not an uptime percentage. This history also provides repository activity: GitHub can disable public schedules after 60 days of inactivity. No third-party actions are executed; the monitor code is downloaded from the exact workflow commit SHA. Only the daily history job has repository write permission, and it can write only to this monitoring repository through its scoped temporary GitHub token.

GitHub schedules are best effort: runs can be delayed or missed during load, so this is periodic external monitoring, not a real-time SLA or proof against a GitHub-wide outage. Check the Actions page and the dated history periodically. The repository is public so the lightweight scheduled checks can use standard public-repository Actions without introducing a paid uptime subscription. It contains public monitoring code and public URL health only.
