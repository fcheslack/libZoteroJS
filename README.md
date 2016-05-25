Overview
--------
This is a Zotero API client for the browser and node.

Getting The Library
-------------------

The easiest way to obtain the latest version is to use npm:

    npm i libzotero

Alternatively you can download the latest release directly from Github:

    https://github.com/fcheslack/libZoteroJS

Whichever option you choose, for the browser you will need to include `libzotero.js` from the `dist` on your page. When included API will be accessbile via a global object `Zotero`. Additionaly this file follows an [Universal Module Definition](https://github.com/umdjs/umd) which means you can also use this library in systems that use AMD (e.g. [RequireJS](http://requirejs.org/)) or CommonJS module loader mechanism.

Alternatively, in node environemnt and within Browserify-based builds you can just do:

	var Zotero = require('libzotero');


Usage
-----

For instructions and examples see [api documentation](https://www.zotero.org/support/dev/client_coding/javascript_api)
