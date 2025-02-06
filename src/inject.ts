export class NetSense {
  url: string;
  method: string;
  reqHeaders: Record<string, string>;
  reqBody: object | string;
  resHeaders: Record<string, string>;
  resBody: object | string;
  status: number;
  duration: number;
  type: "XHR" | "FETCH";

  constructor() {
    this.url = "";
    this.method = "";
    this.reqHeaders = {};
    this.reqBody = {};
    this.resHeaders = {};
    this.resBody = {};
    this.status = 0;
    this.duration = 0;
    this.type = "XHR";
  }
}

// Utility function to log network requests
async function logNetworkRequest(netSense: NetSense) {
  document.dispatchEvent(
    new CustomEvent("netSense", {
      detail: netSense,
    })
  );
}

interface CustomXMLHttpRequest extends XMLHttpRequest {
  netSense: NetSense;
}

// Parse headers from string format (XHR)
function parseHeaders(headers: string): Record<string, string> {
  const result: Record<string, string> = {};
  headers.split("\n").forEach((header) => {
    const [key, value] = header.split(": ");
    if (key) result[key] = value;
  });
  return result;
}

// Parse body safely
function parseBody(body: any): object | string {
  if (body === null || body === undefined) {
    return {};
  }
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  return body;
}

// Refactor XHR logging
(function () {
  const XHR = XMLHttpRequest.prototype as CustomXMLHttpRequest;

  // Save references to the original methods
  const originalOpen = XHR.open;
  const originalSend = XHR.send;
  const originalSetRequestHeader = XHR.setRequestHeader;

  // Override the open method to store method and URL details
  XHR.open = function (method, url) {
    // Create a request object
    this.netSense = new NetSense();
    this.netSense.url = typeof url === "string" ? url : url.toString();
    this.netSense.method = method;
    return originalOpen.apply(this, arguments as any);
  };

  // Override the setRequestHeader method to capture headers
  XHR.setRequestHeader = function (header, value) {
    // Store the request headers in the request object
    this.netSense.reqHeaders[header] = value;
    return originalSetRequestHeader.apply(this, arguments as any);
  };

  // Override the send method to capture request body and track the request
  XHR.send = function (body) {
    // Capture the request body
    this.netSense.reqBody = parseBody(body);

    // Add event listener for load to capture the response
    this.addEventListener("load", function () {
      const responseBody =
        this.responseType === "text" || this.responseType === ""
          ? this.responseText
          : this.response;

      const netSense = (this as CustomXMLHttpRequest).netSense;

      netSense.resHeaders = parseHeaders(this.getAllResponseHeaders());
      netSense.resBody = parseBody(responseBody);
      netSense.status = this.status;
      netSense.duration = new Date().getTime() - netSense.duration;

      logNetworkRequest(netSense);
    });

    // Capture the start time
    this.netSense.duration = new Date().getTime();
    return originalSend.apply(this, arguments as any);
  };
})();

// Refactor fetch logging
(function () {
  const originalFetch = window.fetch;
  window.fetch = async function (input, init) {
    // Converting the input to request object so it also resolves the relative URLs
    const request = new Request(input, init);
    const startTime = new Date();
    const resp = await originalFetch(request);
    const netSense = new NetSense();
    netSense.url = request.url;
    netSense.method = request.method;
    netSense.reqHeaders = Object.fromEntries(request.headers.entries());
    netSense.reqBody = parseBody(init?.body);
    netSense.resHeaders = Object.fromEntries(resp.headers.entries());
    netSense.resBody = await resp.clone().text();
    netSense.status = resp.status;
    netSense.duration = new Date().getTime() - startTime.getTime();
    netSense.type = "FETCH";
    logNetworkRequest(netSense);
    return resp;
  };
})();
