// Define the NetSense class
class NetSense {
  url: string;
  method: string;
  reqHeaders: Record<string, string>;
  reqBody: object | string;
  resHeaders: Record<string, string>;
  resBody: object | string;
  status: number;
  duration: number;

  constructor() {
    this.url = "";
    this.method = "";
    this.reqHeaders = {};
    this.reqBody = {};
    this.resHeaders = {};
    this.resBody = {};
    this.status = 0;
    this.duration = 0;
  }
}

// Utility function to log network requests
function logNetworkRequest(
  netSense: NetSense,
  startTime: number,
  response: Response | XMLHttpRequest
) {
  netSense.duration = new Date().getTime() - startTime;

  let reqType: string;

  if (response instanceof XMLHttpRequest) {
    // Process XHR response
    reqType = "XHR";
    netSense.status = response.status;
    netSense.resHeaders = parseHeaders(response.getAllResponseHeaders());
    netSense.resBody = parseResponseBody(response.response);
  } else {
    // Process fetch response
    reqType = "FETCH";
    netSense.status = response.status;
    netSense.resHeaders = {};
    response.headers.forEach((value, key) => {
      netSense.resHeaders[key] = value;
    });
    netSense.resBody = parseResponseBody(response.clone());
  }

  console.log(`${reqType} REQ: `, netSense);
}

// Parse headers
function parseHeaders(headers: string): Record<string, string> {
  const result: Record<string, string> = {};
  headers.split("\n").forEach((header) => {
    const [key, value] = header.split(": ");
    if (key) result[key] = value;
  });
  return result;
}

// Parse response body (handle JSON and text)
function parseResponseBody(response: any): object | string {
  if (typeof response === "string") {
    try {
      return JSON.parse(response);
    } catch {
      return response;
    }
  }
  return response;
}

// Refactor XHR logging
(function () {
  const XHR = XMLHttpRequest.prototype;
  const netSense: NetSense = new NetSense();
  let startTime: number;

  // Save references to the original methods
  const open = XHR.open;
  const send = XHR.send;
  const setRequestHeader = XHR.setRequestHeader;

  // Override the open method
  XHR.open = function (method, url) {
    netSense.method = method;
    netSense.url = (
      typeof url === "string" ? url : url.toString()
    ).toLowerCase();
    startTime = new Date().getTime();
    return open.apply(this, arguments as any);
  };

  // Override the setRequestHeader method
  XHR.setRequestHeader = function (header, value) {
    netSense.reqHeaders[header] = value;
    return setRequestHeader.apply(this, arguments as any);
  };

  // Override the send method
  XHR.send = function (postData) {
    // Add an event listener for the load event
    this.addEventListener("load", function () {
      if (netSense.url) {
        if (postData) {
          netSense.reqBody = parseResponseBody(postData);
        }
        logNetworkRequest(netSense, startTime, this);
      }
    });

    return send.apply(this, arguments as any);
  };
})();

// Refactor fetch logging
(function () {
  const originalFetch = window.fetch;
  const netSense: NetSense = new NetSense();

  window.fetch = async function (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const startTime = new Date().getTime();
    netSense.method = init?.method || "GET";
    netSense.url =
      typeof input === "string"
        ? input.toLowerCase()
        : input instanceof URL
        ? input.toString().toLowerCase()
        : input.url.toLowerCase();

    // Set request headers
    if (init?.headers) {
      netSense.reqHeaders =
        init.headers instanceof Headers
          ? Object.fromEntries(init.headers.entries())
          : (init.headers as Record<string, string>);
    }

    // Set request body
    if (init?.body) {
      netSense.reqBody = parseResponseBody(init.body);
    }

    // Make the original fetch call
    const response = await originalFetch(input, init);

    logNetworkRequest(netSense, startTime, response);

    return response; // Return the original response
  };
})();
