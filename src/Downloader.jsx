import React, { useState } from 'react';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import parseHls from './parseHls';
import './App.css';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const Downloader = () => {
  const [additionalMessage, setAdditionalMessage] = useState('');
  const [downloadBlobUrl, setDownloadBlobUrl] = useState('');
  const [url, setUrl] = useState('');


  const notify = (text) => 
    toast(text, {
      position: "top-center",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
    });
  const startDownload = async () => {
    try {
      if (!url) {
        setAdditionalMessage('Please enter an HLS video URL.');
        notify('Please enter an HLS video URL.')
        return;
      }

      setAdditionalMessage('STARTING_DOWNLOAD');

      // Fetch HLS video segments
      setAdditionalMessage('[INFO] Fetching segments');
      const getSegments = await parseHls({ hlsUrl: url, headers: '' });

      if (getSegments.type !== 'SEGMENT') {
        setAdditionalMessage('Invalid segment URL. Please refresh the page.');
        return;
      }

      const segments = getSegments.data.map((s, i) => ({ ...s, index: i }));

      // Initialize ffmpeg
      setAdditionalMessage('[INFO] Initializing ffmpeg');
      notify('Initializing ffmpeg')
      const ffmpeg = createFFmpeg({
        mainName: 'main',
        corePath: 'https://unpkg.com/@ffmpeg/core-st@0.11.1/dist/ffmpeg-core.js',
        log: false,
      });

      await ffmpeg.load();
      notify('fmpeg loaded')
      setAdditionalMessage('[SUCCESS] ffmpeg loaded');

      // Download segments
      notify('Start donwloading...')
      setAdditionalMessage('SEGMENT_STARTING_DOWNLOAD');
      const segmentChunks = [];
      for (let i = 0; i < segments.length; i += 10) {
        segmentChunks.push(segments.slice(i, i + 10));
      }

      const successSegments = [];

      for (let i = 0; i < segmentChunks.length; i++) {
        setAdditionalMessage(`[INFO] Downloading segment chunks ${i + 1}/${segmentChunks.length}`);
        console.log(`[INFO] Downloading segment chunks ${i + 1}/${segmentChunks.length}`);
        const segmentChunk = segmentChunks[i];

        await Promise.all(
          segmentChunk.map(async (segment) => {
            try {
              const fileId = `${segment.index}.ts`;
              const getFile = await fetch(segment.uri);

              if (!getFile.ok) {
                throw new Error('File failed to fetch');
              }

              ffmpeg.FS('writeFile', fileId, await fetchFile(await getFile.arrayBuffer()));
              successSegments.push(fileId);
              setAdditionalMessage(`[SUCCESS] Segment downloaded ${segment.index}`);
            } catch (error) {
              setAdditionalMessage(`[ERROR] Segment download error ${segment.index}`);
            }
          })
        ); 
      }

      // Sort and stitch segments
      successSegments.sort((a, b) => parseInt(a.split('.')[0]) - parseInt(b.split('.')[0]));
      setAdditionalMessage('[INFO] Stitching segments started');
      setAdditionalMessage('SEGMENT_STITCHING');

      await ffmpeg.run(
        '-i',
        `concat:${successSegments.join('|')}`,
        '-c',
        'copy',
        'output.mp4' // Change output file extension to mp4
      );

      setAdditionalMessage('[INFO] Stitching segments finished');

      // Clean up
      successSegments.forEach((segment) => {
        try {
          ffmpeg.FS('unlink', segment);
        } catch (_) {}
      });

      // Read and create download URL
      const data = ffmpeg.FS('readFile', 'output.mp4'); // Change the file name to mp4
      setAdditionalMessage('');
      setAdditionalMessage('JOB_FINISHED');
      setDownloadBlobUrl(
        URL.createObjectURL(new Blob([data.buffer], { type: 'video/mp4' })) // Change MIME type to video/mp4
      );

      // Exit FFmpeg instance
      if (ffmpeg.isLoaded()) {
        ffmpeg.exit();
      }
    } catch (error) {
      setAdditionalMessage('');
      setAdditionalMessage('DOWNLOAD_ERROR');
      console.error(error.message);
    }

  };
  return (
    <div>
      <div>
        <ToastContainer />
      </div>
      <input
        className="text-box"
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter HLS video URL"
      />
      <div className="button-start-download">
        <button onClick={startDownload}>Download HLS Video</button>
        {additionalMessage && <p className="text-log-download">{additionalMessage}</p>}
      </div>

      {downloadBlobUrl && (
        <div className="Download-con">
          <a
            href={downloadBlobUrl}
            download={`hls-downloader-${new Date().toLocaleDateString().replace(/\//g, '-')}.mp4`}
            className="Button-download"
          >
            Download now
          </a>

          <button onClick={() => window.location.reload()} className="">
            Create new
          </button>
        </div>
      )}
    </div>
  );
};

export default Downloader;