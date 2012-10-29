# A simple QR code reader

Install with `git submodule update --recursive --init` to fetch the QRCode library.

Some QR Code images are in `tests`. It currently supports URLs, mails and phone numbers. On a Mac, with B2G Destkop, you can put the images in your `~/Pictures` folder to find them in the galery app.

## Known issues
- When running in the browser, you'll have to quit the galery app yourself for two types of QR codes
- The Browser will open QR code links twice and not switch to the right tab
- Throbber does not turn, should move the QR decoding to a web worker maybe.

## Ideas for the future
- Use getUserMedia
- Add "export" sharing options for unrecognized data format
- Add "import" options from galery
