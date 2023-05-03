b'<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"  xmlns:tns="http://tempuri.org/" xmlns:tm="http://microsoft.com/wsdl/mime/textMatching/"><soap:Body><LoginResponse xmlns="http://tempuri.org/"><success>true</success><result>const express = require(&quot;express&quot;)\r\nconst Router = express.Router()\r\n\r\nRouter.get(&quot;/&quot;, (req, res) =&gt; {\r\n    return res.json({\r\n        status:&quot;UP&quot;\r\n    })\r\n})\r\n\r\n// /userinfo API DOCS\r\n// This one is for SSRF\r\n// This endpoint takes a paramter called id with a base64 encoded value \r\n// then it is decoding the value and sending a http request \r\n// finally responds with the response of the http request\r\nRouter.get(&quot;/userinfo&quot;, async (req, res) =&gt; {\r\n    \r\n    // Checking if the URL is specified or not\r\n    if(req.query[&apos;id&apos;] === undefined){\r\n        return res.status(400).json({\r\n            success: false,\r\n            error: &quot;&apos;id&apos; parameter is not given.&quot;\r\n        })\r\n    }\r\n\r\n    // Decoding the id\r\n    let url\r\n    try {\r\n        url = Buffer.from(req.query[&apos;id&apos;], &apos;base64&apos;).toString(&apos;ascii&apos;)\r\n    } catch (error) {\r\n        return res.status(400).json({\r\n            success: false,\r\n            error: &quot;&apos;id&apos; parameter is invalid.&quot;\r\n        })\r\n    }\r\n\r\n\r\n    // Checking if the string/url starts with http://\r\n    if(!/^http(s)?:\\/\\/.+(.).+$/.test(url)){\r\n        return res.status(400).json({\r\n            success: false,\r\n            error: &quot;&apos;id&apos; parameter is invalid.&quot;\r\n        })\r\n    }\r\n\r\n    // Loading Axios\r\n    const axios =  require(&quot;axios&quot;)\r\n    \r\n    let response\r\n    try {\r\n        response = await axios.get(url)\r\n    } catch (err) {\r\n        if(err.response !== undefined){\r\n            if(err.response.data !== undefined){\r\n                response = err.response\r\n            }\r\n        } else {\r\n            console.log(err)\r\n            return res.status(500).json({\r\n                success: false,\r\n                error: &quot;Cannot reach to the resource&quot;\r\n            })\r\n        }\r\n    }\r\n\r\n    // if it content binary it is not gonna work\r\n    if (response.headers[&apos;content-type&apos;].includes(&quot;image&quot;)){\r\n        return res.status(500).json({\r\n            success: false,\r\n            error: &quot;Unsupported Content Type detected!&quot;\r\n        })\r\n    }\r\n\r\n\r\n    res.status(response.status)\r\n    res.contentType(response.headers[&apos;content-type&apos;])\r\n    \r\n    // if it is a JSON response then we are converting it to a string before sending\r\n    if (typeof response.data === &quot;object&quot;){\r\n        res.write(JSON.stringify(response.data))\r\n    } else {\r\n        res.write(response.data)\r\n    }\r\n    res.end()\r\n})\r\n\r\n\r\n// This is the LFI endpoint\r\n// This cannot be exploited from the browser because of the path normalization thing\r\n// We have to use CURL or Burp\r\n// In Curl, use the --path-as-is flag\r\n// EX:- curl http://127.0.0.1:3000/api/download/..%2f..%2f..%2f..%2fetc%2fhosts --path-as-is\r\n// Also, there is a xss vuln when a wrong file name is given\r\nRouter.get(&quot;/download/:file&quot;, (req, res) =&gt; {\r\n    let filename = `/opt/userdocs/${req.params[&apos;file&apos;]}`\r\n    const path = require(&quot;path&quot;)\r\n    filename = path.resolve(filename)\r\n\r\n    try {\r\n        const fs = require(&quot;fs&quot;)\r\n        let data = fs.readFileSync(filename)\r\n        res.contentType(&quot;octet-stream&quot;)\r\n        res.setHeader(&apos;Content-Disposition&apos;, `attachment; filename=&apos;${filename}&apos;`)\r\n        res.write(data)\r\n        \r\n    } catch (err) {\r\n        // Checking if a browser visits the endpoint\r\n        let isABrowser = ( (req.headers[&apos;user-agent&apos;].includes(&quot;Mozilla&quot;)) || (req.headers[&apos;user-agent&apos;].includes(&quot;Chrome&quot;)) || (req.headers[&apos;user-agent&apos;].includes(&quot;Apple&quot;)) )\r\n        if (isABrowser){\r\n            res.write(`&lt;b&gt;${req.params[&apos;file&apos;]}&lt;/b&gt; not found!`)\r\n        } else {\r\n            return res.status(500).json({\r\n                success: false,\r\n                error: &quot;File not found!&quot;\r\n            })\r\n        }\r\n    }\r\n    return res.end()\r\n})\r\n\r\n// Giving a hint for LFI for those FFUF guys\r\nRouter.get(&quot;/download&quot;, (req, res) =&gt; {\r\n    res.json({\r\n        success: false,\r\n        error: &quot;Input the filename via /download/&lt;filename&gt;&quot;\r\n    })\r\n})\r\n\r\n\r\n// This is bad regex endpoint\r\nRouter.get(&quot;/check-email&quot;, (req, res) =&gt; {\r\n    let isGood = false\r\n\r\n    if (req.query[&apos;email&apos;] === undefined){\r\n        return res.json({\r\n            success: false,\r\n            error: &quot;Missing &apos;email&apos; parameter&quot;\r\n        })\r\n    }\r\n\r\n    isGood = /^([a-zA-Z0-9_\\.\\-])+\\@(([a-zA-Z0-9\\-])+\\.)+([a-zA-Z0-9]{2,4})+$/.test(req.query[&apos;email&apos;])\r\n\r\n    return res.json({\r\n        regex: &quot;/^([a-zA-Z0-9_\\.\\-])+\\@(([a-zA-Z0-9\\-])+\\.)+([a-zA-Z0-9]{2,4})+$/&quot;,\r\n        success: isGood\r\n    })\r\n})\r\n\r\nmodule.exports = Router</result></LoginResponse></soap:Body></soap:Envelope>'