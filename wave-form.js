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
/**
 * Respond with the form
 */
app.get('/', (req, res) => {
  const HTML = renderView({
    title: 'Wave Form',
    styles: `
      .masthead { min-height: 350px; }
      .masthead .ui.header {
        font-size: 4em;
        margin-top: 1.5em;
      }
      .masthead h2 {
        font-size: 1.7em;
        font-weight: normal;
      }
      .ui.input input[name=frequency] {
        text-align: right;
        width: 3em;
      }
      code { display: block; }
      audio { margin: 1em 0; }
      
      @media only screen and (min-width: 700px) {
        .masthead { min-height: 600px; }
      }
    `,
    body: `
      <div class="ui inverted vertical masthead center aligned segment">
        <div class="ui text container">
          <h1 class="ui inverted header">Wave Form</h1>
          <h2>Quick & simple tone generation</h2>
        </div>
        <form class="">
          <div class="ui massive right labeled inverted transparent input">
            <input type="text" placeholder="600" name="frequency" autocomplete="off" autofocus>
            <div class="ui black inverted label">Hz</div>
          </div>
        </form>
        <div class="ui text container">
          <code class="ui inverted grey segment">
            &lt;audio src="https://wt-patrick-craftycorvid_com-0.run.webtask.io/wave-form/600"&gt;&lt;/audio&gt;
          </code>
        </div>
        <audio controls>
          <source src="https://wt-patrick-craftycorvid_com-0.run.webtask.io/wave-form/600" type="audio/wav">
        </audio>
      </div>
      <div class="ui grid container">
        <div class="ui hidden divider"></div>
        <div class="row">
          <div class="eight wide column">
            <h2 class="ui header">No media for your project? No problem!</h2>
            <p>
              Just key in a frequencey and copy the code.
            </p>
            <div class="ui bulleted list">
              <div class="item">Supports seeking</div>
              <div class="item">Serverless</div>
              <div class="item">Swap in real source later</div>
            </div>
          </div>
          <div class="eight wide right aligned column">
            <h2 class="ui header">High Quality</h2>
            <div class="ui compact warning message">
              <div class="header">
                Uncompressed PCM audio!
              </div>
              Recommended for prototypes only.
            </div>
          </div>
        </div>
      </div>
    `,
    scripts: `
      document.addEventListener("DOMContentLoaded", function(event) {
        var frequencyInput = document.querySelector('input[name=frequency]');
        frequencyInput.addEventListener('input', _.debounce(handleFrequencyInput, 750));
      });
      
      function handleFrequencyInput(e) {
        var audioSrc = \`https://wt-patrick-craftycorvid_com-0.run.webtask.io/wave-form/\${e.target.value}\`;
        var audioCode = \`&lt;audio src="\${audioSrc}"&gt;&lt;/audio&gt;\`;
        var audioElement = document.querySelector('audio');
        var codeElement = document.querySelector('code');
        // Update code
        codeElement.innerHTML = audioCode;
        // Update audio src
        audioElement.src = audioSrc;
      }
    `
  });

  res.set('Content-Type', 'text/html');
  res.status(200).send(HTML);
});
/**
 * Respond with bytes for the given frequency and range
 */
app.get('/:frequency', (req, res, next) => {
  const frequency = parseInt(req.params.frequency);
  let header, sampleData, samples, waveData;
  // Generate a tone of the given frequency;
  // See: https://www.npmjs.com/package/tonegenerator
  samples = tone(frequency, SAMPLE_LENGTH);
  // Generate wave header
  header = waveHeader(samples.length, { bitDepth: 8 });
  // Prepare bytes for transport:
  // convert -128 -> 127 range into 0 -> 255; attach header
  sampleData = Uint8Array.from(samples, sample => sample + 128);
  waveData = Buffer.concat([ header, Buffer.from(sampleData) ]);
  // Send the requested resource range; thanks, tidy middleware!
  res.sendSeekable(waveData, { type: 'audio/x-wav' });
});

module.exports = fromExpress(app);

function renderView(locals) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.2.13/semantic.min.css" />
      <style>
        ${locals.styles}
      </style>
      <title>${locals.title}</title>
    </head>
    <body>
      ${locals.body}
    </body>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3/underscore-min.js"></script>
    <script>
      ${locals.scripts}
    </script>
    </html>
  `;
}
