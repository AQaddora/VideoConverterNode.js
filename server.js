const express = require('express');
const multer = require('multer');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const port = 3000;

// Set up Multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads');
    },
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        cb(null, `${timestamp}_${file.originalname}`);
    },
});
const upload = multer({ storage });

// Enable CORS middleware
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Set Content Security Policy headers
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', "default-src 'self' data:; img-src 'self' data:");
    next();
});

// Handle file upload request
app.post('/upload', upload.single('video'), (req, res) => {
    const inputFile = req.file.path;
    const outputFileName = `${Date.now()}_${req.file.originalname}`;
    const outputFile = path.join(__dirname, 'public', 'converted', outputFileName);
    const convertedFilePath = `/download/${outputFileName}`;

    // FFmpeg conversion command
    const width = parseInt(req.body.width);
    const height = parseInt(req.body.height);
    const maintainAspectRatio = req.body.maintainAspectRatio === 'true';

    let ffmpegCommand = `-i "${inputFile}"`;

    if (width && height && width > 0 && height > 0) {
        if (maintainAspectRatio) {
            ffmpegCommand += ` -vf "scale=w=${width}:h=${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2"`;
        } else {
            ffmpegCommand += ` -vf "scale=w=${width}:h=${height}"`;
        }
    }

    ffmpegCommand += ` -acodec copy -vcodec h264 -movflags faststart "${outputFile}"`;

    // Execute FFmpeg command using spawn
    const ffmpeg = spawn('ffmpeg', ffmpegCommand.split(' '), { shell: true });

    ffmpeg.stderr.on('data', (data) => {
        console.log(`FFmpeg output: ${data}`);
    });

    ffmpeg.on('close', (code) => {
        if (code === 0) {
            console.log('File conversion successful');
            res.json({ convertedFile: convertedFilePath });
        } else {
            console.error('File conversion failed');
            res.status(500).send('File conversion failed');
        }
    });
});
// Serve the converted video for download
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'public', 'converted', filename);
  
    res.download(filePath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).send('Error sending file');
      }
    });
  });

// Start the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
