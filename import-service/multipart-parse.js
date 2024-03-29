function parse(multipartBodyBuffer, boundary) {
  var process = function (part) {

    var obj = function (str) {
      var k = str.split('=');
      var a = k[0].trim();
      var b = JSON.parse(k[1].trim());
      var o = {};
      Object.defineProperty(o, a,
        { value: b, writable: true, enumerable: true, configurable: true })
      return o;
    }
    var header = part.header.split(';');
    var file = obj(header[2]);
    var contentType = part.info.split(':')[1].trim();
    Object.defineProperty(file, 'type',
      { value: contentType, writable: true, enumerable: true, configurable: true })
    Object.defineProperty(file, 'data',
      { value: Buffer.from(part.part), writable: true, enumerable: true, configurable: true })
    return file;
  }
  var prev = null;
  var lastline = '';
  var header = '';
  var info = ''; var state = 0; var buffer = [];
  var allParts = [];

  for (i = 0; i < multipartBodyBuffer.length; i++) {
    var oneByte = multipartBodyBuffer[i];
    var prevByte = i > 0 ? multipartBodyBuffer[i - 1] : null;
    var newLineDetected = ((oneByte == 0x0a) && (prevByte == 0x0d)) ? true : false;
    var newLineChar = ((oneByte == 0x0a) || (oneByte == 0x0d)) ? true : false;

    if (!newLineChar)
      lastline += String.fromCharCode(oneByte);

    if ((0 == state) && newLineDetected) {
      if (("--" + boundary) == lastline) {
        state = 1;
      }
      lastline = '';
    } else
      if ((1 == state) && newLineDetected) {
        header = lastline;
        state = 2;
        lastline = '';
      } else
        if ((2 == state) && newLineDetected) {
          info = lastline;
          state = 3;
          lastline = '';
        } else
          if ((3 == state) && newLineDetected) {
            state = 4;
            buffer = [];
            lastline = '';
          } else
            if (4 == state) {
              if (lastline.length > (boundary.length + 4)) lastline = ''; // mem save
              if (((("--" + boundary) == lastline))) {
                var j = buffer.length - lastline.length;
                var part = buffer.slice(0, j - 1);
                var p = { header: header, info: info, part: part };
                allParts.push(process(p));
                buffer = []; lastline = ''; state = 5; header = ''; info = '';
              } else {
                buffer.push(oneByte);
              }
              if (newLineDetected) lastline = '';
            } else
              if (5 == state) {
                if (newLineDetected)
                  state = 1;
              }
  }
  return allParts;
};

function getBoundary(header) {
  return header.split('boundary=')[1]
}

module.exports = {
  parse,
  getBoundary
}