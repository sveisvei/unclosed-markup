# Unclosed markup

`parse5` backed unclosed markup checker.

# Usage api

```javascript


const check = require('unclosed-markup');

check('<div><a></div>')
    .then(() => {})
    .catch(e => console.error(e));

```


# Usage cli


```bash
$ unclosed-markup ./path/to/file

$ unclosed-markup --content="<div>asd</div>"
```
