# Unclosed-markup 
[![Build Status](https://travis-ci.org/sveisvei/unclosed-markup.svg?branch=master)](https://travis-ci.org/sveisvei/unclosed-markup)

`parse5` backed unclosed markup checker **that works offline**.

_Requires node version 6._

## Usage api

```javascript


const check = require('unclosed-markup');

check('<div><a></div>')
    .then(() => {})
    .catch(e => console.error(e));

```


## Usage cli


```bash
$ unclosed-markup ./path/to/file

$ unclosed-markup --content="<div>asd</div>"
```
