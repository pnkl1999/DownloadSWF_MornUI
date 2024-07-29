const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function downloadFile(url, outputPath) {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });

    if (response.status === 200) {
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    } else {
      console.error(`Failed to download ${url}: Status code ${response.status}`);
      logError(url);
    }
  } catch (error) {
    console.error(`Error downloading file from ${url}:`, error.message);
    logError(url);
  }
}

async function fileExists(url) {
  try {
    const response = await axios.head(url);
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

async function downloadFilesFromList(listFilePath, baseURL, extension, outputDir) {
  try {
    const data = fs.readFileSync(listFilePath, 'utf8');
    const files = data.split('\n').map(line => line.trim().toLowerCase()).filter(Boolean);

    for (const file of files) {
      const fileName = `${file}${extension}`;
      const url = `${baseURL}${fileName}`;
      const outputPath = path.join(outputDir, fileName);

      if (await fileExists(url)) {
        await downloadFile(url, outputPath);
        console.log(`Downloaded ${url} to ${outputPath}`);
      } else {
        console.log(`File not found: ${url}`);
        logError(url);
      }
    }
  } catch (error) {
    console.error('Error reading list file:', error.message);
  }
}

function logError(url) {
  const logFilePath = 'error.log';
  fs.appendFileSync(logFilePath, `${url}\n`, 'utf8');
}

const listFilePath = 'ListDownload.txt';

const baseURLSWF = 'https://gunny.vcdn.vn/flash/ui/vietnam/swf/';
const outputDirSWF = 'downloads/swf';
const baseURLUI = 'https://gunny.vcdn.vn/flash/ui/vietnam/morn/ui/';
const outputDirUI = 'downloads/ui';

downloadFilesFromList(listFilePath, baseURLSWF, '.swf', outputDirSWF);

downloadFilesFromList(listFilePath, baseURLUI, '.ui', outputDirUI);
