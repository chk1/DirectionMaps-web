## Web interface to Direction Maps Rendering

To run this, clone these three projects and move them into a file structure like this:

- [/home/c/code/DirectionMaps-Rendering](https://github.com/chk1/DirectionMaps-Rendering)
- [/home/c/code/dirmaps-web](https://github.com/chk1/dirmaps-web)
- [/home/c/code/DirectionMaps-Backend](https://github.com/mrunde/DirectionMaps-Backend)

Then run `node index.js` in the dirmaps-web folder.

If done correctly, you should be able to open `http://localhost:3000/map?lon=7.64519&lat=51.92906` (there must be OSM & routing data for these coordinates in your database). You will see some output on the command line and eventually a rendered image in the browser.
