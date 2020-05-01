const path = require('path');

const { name } = require(path.resolve('./package.json'));
process.stdout.write(name);
