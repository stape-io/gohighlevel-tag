const sendHttpRequest = require('sendHttpRequest');
const JSON = require('JSON');
const getRequestHeader = require('getRequestHeader');
const getAllEventData = require('getAllEventData');
const makeTableMap = require('makeTableMap');

/*==============================================================================
==============================================================================*/

const eventData = getAllEventData();

if (!isConsentGivenOrNotRequired(data, eventData)) {
  return data.gtmOnSuccess();
}

const url = eventData.page_location || getRequestHeader('referer');
if (url && url.lastIndexOf('https://gtm-msr.appspot.com/', 0) === 0) {
  return data.gtmOnSuccess();
}

createContact(data);

if (data.useOptimisticScenario) {
  return data.gtmOnSuccess();
}

/*==============================================================================
  Vendor related functions
==============================================================================*/

function generateRequestUrl() {
  return 'https://services.leadconnectorhq.com/contacts/';
}

function generateRequestOptions(data) {
  const version = '2021-07-28';
  const options = {
    headers: {
      Authorization: 'Bearer ' + data.privateIntegrationToken,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Version: version
    },
    method: 'POST'
  };

  return options;
}

function createContact(data) {
  const requestUrl = generateRequestUrl();
  const requestOptions = generateRequestOptions(data);
  const postBody = makeTableMap(data.contact || [], 'field', 'value') || {};

  postBody.locationId = data.locationId;

  if (data.email) postBody.email = data.email;
  if (data.phone) postBody.phone = data.phone;

  return sendHttpRequest(
    requestUrl,
    (statusCode, headers, body) => {
      if (!data.useOptimisticScenario) {
        if (statusCode >= 200 && statusCode < 303) data.gtmOnSuccess();
        else data.gtmOnFailure();
      }
    },
    requestOptions,
    JSON.stringify(postBody)
  );
}

/*==============================================================================
  Helpers
==============================================================================*/

function isConsentGivenOrNotRequired(data, eventData) {
  if (data.adStorageConsent !== 'required') return true;
  if (eventData.consent_state) return !!eventData.consent_state.ad_storage;
  const xGaGcs = eventData['x-ga-gcs'] || ''; // x-ga-gcs is a string like "G110"
  return xGaGcs[2] === '1';
}
