const replace = require('replace-in-file');
const fs = require('fs-extra');
const documentation = require('documentation');

fs.emptyDir('./docs/md/')
    .then(() => { return documentation.build(['./src/lmn.js'],{}); })
    .then(comments => documentation.formats.md(comments,{"markdownToc":true}))
    .then(output => {fs.writeFile('./docs/md/Api.md', output); return output})
    .then(output=>{ return replace( {files: './README.md', from: /# Documentation[\s\S]*/m,  to: "# Documentation\n"+output })})
    .catch(console.error);