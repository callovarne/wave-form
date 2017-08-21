'use latest';

import express from 'express';
import { fromExpress } from 'webtask-tools';
import bodyParser from 'body-parser';

const app = express();
const sendSeekable = require('send-seekable');
const tone = require('tonegenerator');
const waveHeader = require('waveheader');

const SAMPLE_LENGTH = 3;

app.use(bodyParser.json());
app.use(sendSeekable);

app.get('/', (req, res) => {
  const HTML = renderView({
    title: 'Wave Form',
    body: `
      <div class="ui inverted vertical masthead center aligned segment">
        <div class="ui text container">
          <h1 class="ui inverted header">Wave Form</h1>
        </div>
        <audio autoplay controls>
          <source src="https://wt-patrick-craftycorvid_com-0.run.webtask.io/wave-form/60" type="audio/wav">
        </audio>
        <form class="ui form">
        
        </form>
      </div>
    `
  });

  res.set('Content-Type', 'text/html');
  res.status(200).send(HTML);
});

app.get('/:frequency', (req, res, next) => {
  const frequency = parseInt(req.params.frequency);
  const samples = tone(frequency, SAMPLE_LENGTH);
  const header = waveHeader(samples.length, { bitDepth: 8 });
  // Convert -128 -> 127 range into 0 -> 255
  const sampleData = Uint8Array.from(samples, sample => sample + 128);
  const waveData = Buffer.concat([ header, Buffer.from(sampleData) ]);

  res.type('audio/x-wav');
  // Send the requested resource range; thanks tidy middleware!
  res.sendSeekable(waveData);
});

module.exports = fromExpress(app);

function renderView(locals) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.13/semantic.min.css" />
      <title>${locals.title}</title>
    </head>
    <body>
      ${locals.body}
    </body>
    <script>
      document.addEventListener("DOMContentLoaded", function(event) { 
        
      });
    </script>
    </html>
  `;
}
