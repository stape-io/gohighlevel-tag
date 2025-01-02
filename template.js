const sendHttpRequest = require('sendHttpRequest');
const JSON = require('JSON');
const getRequestHeader = require('getRequestHeader');
const logToConsole = require('logToConsole');
const getContainerVersion = require('getContainerVersion');
const makeTableMap = require('makeTableMap');

const containerVersion = getContainerVersion();
const isDebug = containerVersion.debugMode;
const isLoggingEnabled = determinateIsLoggingEnabled();
const traceId = getRequestHeader('trace-id');

createContact();

function createContact() {
  const requestUrl = 'https://rest.gohighlevel.com/v1/contacts/';
  const postBody = makeTableMap(data.person || [], 'field', 'value') || {};

  if (data.email) postBody.email = data.email;
  if (data.phone) postBody.phone = data.phone;

  if (isLoggingEnabled) {
    logToConsole(
      JSON.stringify({
        Name: 'GoHighLevel',
        Type: 'Request',
        TraceId: traceId,
        EventName: 'Person',
        RequestMethod: 'POST',
        RequestUrl: requestUrl,
        RequestBody: postBody
      })
    );
  }

  return sendHttpRequest(
    requestUrl,
    (statusCode, headers, body) => {
      if (isLoggingEnabled) {
        logToConsole(
          JSON.stringify({
            Name: 'GoHighLevel',
            Type: 'Response',
            TraceId: traceId,
            EventName: 'Person',
            ResponseStatusCode: statusCode,
            ResponseHeaders: headers,
            ResponseBody: body
          })
        );
      }

      if (statusCode >= 200 && statusCode < 303) {
        data.gtmOnSuccess();
      } else {
        data.gtmOnFailure();
      }
    },
    {
      headers: {
        'Authorization': 'Bearer '+ data.apiKey,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST'
    },
    JSON.stringify(postBody)
  );
}

function determinateIsLoggingEnabled() {
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
