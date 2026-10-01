# Permissions rationale

| Permission                         | Purpose                                                                                                      | User control                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `storage`                          | Store settings and private completion choices locally.                                                       | Export, import, or delete in settings.                                               |
| `activeTab`                        | Inspect the active page after the toolbar button is clicked.                                                 | Granted only by the user's toolbar action.                                           |
| `scripting`                        | Register and inject the content script on approved custom domains.                                           | Custom-domain host access is requested separately and can be revoked.                |
| `https://*/*` optional host access | Allow the user to approve their school's custom HTTPS domain without granting all-sites access persistently. | Chrome prompts for the exact active domain; approved domains are listed in settings. |

The extension does not request persistent broad `host_permissions`, `tabs`, cookies, downloads,
notifications, clipboard, web request, or background alarms.

Native Schoology customization uses the existing content-script access and does not add a
permission. Styles are generated locally from validated settings and scoped beneath the
extension-owned `sc-native-customized` root class.
