import React, { useState } from 'react';
import Downloader from './Downloader.jsx';
import { TypeAnimation } from 'react-type-animation';
import { Crisp } from "crisp-sdk-web";


const App = () => {
  //set crisp chat
  Crisp.configure("84022d7a-2592-4ce2-9a0d-37a8ba4f01ac");

  return (
    <div>
      <TypeAnimation
      sequence={[
        // Same substring at the start will only be typed out once, initially
        '⚡️ Fast HLS Downloaders ⚡️ ',
        1000,
        '⚡️ Fast Dump m3u8 from link ⚡️ ',
        1000, // wait 1s before replacing "Mice" with "Hamsters"
        '⚡️ Fast Convert to mp4 ⚡️ ',
        1000,
        '⚡️ Fast dumping m3u8 ⚡️',
        1000,
        '✅ open source ✅',
        1000
      ]}
      wrapper="span"
      speed={50}
      style={{ fontSize: '2em', display: 'inline-block' }}
      repeat={Infinity}
    />
      <Downloader />
      <div className='container'>
        <div className='Sub-text'>
          <div>
            <a href="https://github.com/moszer/hls-node-downloader">
              <img className='contact-con' src="src/assets/25231.png" alt="Example Image"/>
            </a>
          </div>
          Best Support on: Macos, Windows, Linux
        </div>
      </div>
    </div>
    
  );
};

export default App;
