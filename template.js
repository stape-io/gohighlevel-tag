const sendHttpRequest = require('sendHttpRequest');
const JSON = require('JSON');
const getRequestHeader = require('getRequestHeader');
const getAllEventData = require('getAllEventData');
const getTimestampMillis = require('getTimestampMillis');
const getType = require('getType');
const logToConsole = require('logToConsole');
const getContainerVersion = require('getContainerVersion');
const makeTableMap = require('makeTableMap');
const BigQuery = require('BigQuery');

/**********************************************************************************************/

const traceId = getRequestHeader('trace-id');

const eventData = getAllEventData();

if (!isConsentGivenOrNotRequired()) {
  return data.gtmOnSuccess();
}

const url = eventData.page_location || getRequestHeader('referer');
if (url && url.lastIndexOf('https://gtm-msr.appspot.com/', 0) === 0) {
  return data.gtmOnSuccess();
}

createContact();

if (data.useOptimisticScenario) {
  return data.gtmOnSuccess();
}

/**********************************************************************************************/
// Helpers

function createContact() {
  const requestUrl = 'https://rest.gohighlevel.com/v1/contacts/';
  const postBody = makeTableMap(data.contact || [], 'field', 'value') || {};

  if (data.email) postBody.email = data.email;
  if (data.phone) postBody.phone = data.phone;

  log({
    Name: 'GoHighLevel',
    Type: 'Request',
    TraceId: traceId,
    EventName: 'Contact',
    RequestMethod: 'POST',
    RequestUrl: requestUrl,
    RequestBody: postBody
  });

  return sendHttpRequest(
    requestUrl,
    (statusCode, headers, body) => {
      log({
        Name: 'GoHighLevel',
        Type: 'Response',
        TraceId: traceId,
        EventName: 'Contact',
        ResponseStatusCode: statusCode,
        ResponseHeaders: headers,
        ResponseBody: body
      });

      if (!data.useOptimisticScenario) {
        if (statusCode >= 200 && statusCode < 303) {
          data.gtmOnSuccess();
        } else {
          data.gtmOnFailure();
        }
      }
    },
    {
      headers: {
        Authorization: 'Bearer ' + data.apiKey,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST'
    },
    JSON.stringify(postBody)
  );
}

/**********************************************************************************************/
// Helpers

function isConsentGivenOrNotRequired() {
  if (data.adStorageConsent !== 'required') return true;
  if (eventData.consent_state) return !!eventData.consent_state.ad_storage;
  const xGaGcs = eventData['x-ga-gcs'] || ''; // x-ga-gcs is a string like "G110"
  return xGaGcs[2] === '1';
}

function log(rawDataToLog) {
  const logDestinationsHandlers = {};
  if (determinateIsLoggingEnabled()) logDestinationsHandlers.console = logConsole;
  if (determinateIsLoggingEnabledForBigQuery()) logDestinationsHandlers.bigQuery = logToBigQuery;

  // Key mappings for each log destination
  const keyMappings = {
    // No transformation for Console is needed.
    bigQuery: {
      Name: 'tag_name',
      Type: 'type',
      TraceId: 'trace_id',
      EventName: 'event_name',
      RequestMethod: 'request_method',
      RequestUrl: 'request_url',
      RequestBody: 'request_body',
      ResponseStatusCode: 'response_status_code',
      ResponseHeaders: 'response_headers',
      ResponseBody: 'response_body'
    }
  };

  for (const logDestination in logDestinationsHandlers) {
    const handler = logDestinationsHandlers[logDestination];
    if (!handler) continue;

    const mapping = keyMappings[logDestination];
    const dataToLog = mapping ? {} : rawDataToLog;
    // Map keys based on the log destination
    if (mapping) {
      for (const key in rawDataToLog) {
        const mappedKey = mapping[key] || key; // Fallback to original key if no mapping exists
        dataToLog[mappedKey] = rawDataToLog[key];
      }
    }

    handler(dataToLog);
  }
}

function logConsole(dataToLog) {
  logToConsole(JSON.stringify(dataToLog));
}

function logToBigQuery(dataToLog) {
  const connectionInfo = {
    projectId: data.logBigQueryProjectId,
    datasetId: data.logBigQueryDatasetId,
    tableId: data.logBigQueryTableId
  };

  // timestamp is required.
  dataToLog.timestamp = getTimestampMillis();

  // Columns with type JSON need to be stringified.
  ['request_body', 'response_headers', 'response_body'].forEach((p) => {
    // GTM Sandboxed JSON.parse returns undefined for malformed JSON but throws post-execution, causing execution failure.
    // If fixed, could use: dataToLog[p] = JSON.stringify(JSON.parse(dataToLog[p]) || dataToLog[p]);
    dataToLog[p] = JSON.stringify(dataToLog[p]);
  });

  // assertApi doesn't work for 'BigQuery.insert()'. It's needed to convert BigQuery into a function when testing.
  // Ref: https://gtm-gear.com/posts/gtm-templates-testing/
  const bigquery = getType(BigQuery) === 'function' ? BigQuery() /* Only during Unit Tests */ : BigQuery;
  bigquery.insert(connectionInfo, [dataToLog], { ignoreUnknownValues: true });
}

function determinateIsLoggingEnabled() {
  const containerVersion = getContainerVersion();
  const isDebug = !!(containerVersion && (containerVersion.debugMode || containerVersion.previewMode));

  if (!data.logType) {
    return isDebug;
  }

  if (data.logType === 'no') {
    return false;
  }

  if (data.logType === 'debug') {
    return isDebug;
  }

  return data.logType === 'always';
}

function determinateIsLoggingEnabledForBigQuery() {
  if (data.bigQueryLogType === 'no') return false;
  return data.bigQueryLogType === 'always';
}
