# GoHighLevel Tag for Google Tag Manager Server-Side

The **GoHighLevel Tag** for Google Tag Manager Server-Side allows you to send data to the GoHighLevel API.

## You can use this tag to

- Create new contacts
- Track events _(coming soon)_

## How to Use

1. Add the GoHighLevel tag to the server GTM from the [GTM Template Gallery](https://tagmanager.google.com/gallery/#/owners/stape-io/templates/gohighlevel-tag).
2. Create a **Private Integration Token** with `contacts.write` or `Edit Contacts` scope and add it to the tag.
    - You can find instructions on how to create a token in the [GoHighLevel documentation](https://marketplace.gohighlevel.com/docs/Authorization/PrivateIntegrationsToken/index.html#how-do-i-manage-private-integrations).
    - [A helpful video walkthrough is also available](https://youtu.be/ssDO6tz6b1w).
    > ⚠️ **Important**: The token must be created at the **Sub-Account** level, not the Agency level.
3. Find the **Location ID (also known as the Sub-Account ID)** and add it to the tag. [Here's how to find it](https://help.gohighlevel.com/support/solutions/articles/48001204848-how-do-i-find-my-client-s-location-id-).
4. Add the contact's email and/or phone number.
5. (Optional) Add any other standard or custom [Contact Fields](https://highlevel.stoplight.io/docs/integrations/4c8362223c17b-create-contact#request-body).
6.  Set up a trigger for the tag.

## Useful Resources
- [How to set up GoHighLevel tag using server GTM](https://stape.io/blog/gohighlevel-gtm-tag-setup)

## Open Source

The **GoHighLevel Tag for GTM Server Side** is developed and maintained by the [Stape Team](https://stape.io/) under the Apache 2.0 license.
