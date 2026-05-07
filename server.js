const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- CORS: Allow your Vercel frontend ---
app.use(cors({
    origin: [
        'https://retouchify-frontend.vercel.app',
        'https://retouchify.vercel.app',
        'http://localhost:5173',
        'http://localhost:3000'
    ],
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json());

// --- FILE UPLOAD STORAGE ---
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// --- HEALTH CHECK ---
app.get('/', (req, res) => {
    res.send('Retouchify Backend is officially live and running!');
});

// --- ROUTE: CONTACT FORM & AUTO-REPLY ---
app.post('/send-message', async (req, res) => {
    const { name, email, service, budget, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
        return res.status(400).json({ success: false, error: 'Missing required fields.' });
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const adminMail = {
        from: process.env.EMAIL_USER,
        replyTo: email,
        to: process.env.EMAIL_USER,
        subject: `New Project: ${service} from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nBudget: ${budget}\n\nMessage:\n${message}`
    };

    const clientMail = {
        from: `"Retouchify" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'We Received Your Request! - Retouchify',
        html: `<h3>Hi ${name},</h3><p>Thanks for reaching out! We've received your request for <b>${service}</b> and will get back to you within 24 hours.</p>`
    };

    try {
        await Promise.all([
            transporter.sendMail(adminMail),
            transporter.sendMail(clientMail)
        ]);
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Email error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- ROUTE: QUICK PHOTO UPLOAD (with email notification + attachments) ---
app.post('/upload', upload.array('photos', 10), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: 'No files uploaded.' });
    }

    const uploadTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const fileCount = req.files.length;

    // Build attachments array for nodemailer
    const attachments = req.files.map(file => ({
        filename: file.originalname,
        path: file.path
    }));

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const uploadMail = {
        from: `"Retouchify" <${process.env.EMAIL_USER}>`,
        to: process.env.EMAIL_USER,
        subject: `📸 New Photo Upload — ${fileCount} file${fileCount > 1 ? 's' : ''} received`,
        html: `
            <h2>New Quick Project Upload</h2>
            <p><b>Files received:</b> ${fileCount}</p>
            <p><b>Upload time:</b> ${uploadTime} (IST)</p>
            <p><b>File names:</b></p>
            <ul>
                ${req.files.map(f => `<li>${f.originalname} (${(f.size / 1024).toFixed(1)} KB)</li>`).join('')}
            </ul>
            <p>The uploaded photos are attached to this email.</p>
        `,
        attachments: attachments
    };

    try {
        await transporter.sendMail(uploadMail);
        console.log(`Upload email sent with ${fileCount} attachment(s)`);

        // Delete files from server after emailing to save disk space
        req.files.forEach(file => {
            fs.unlink(file.path, (err) => {
                if (err) console.error('Could not delete file:', file.path);
            });
        });

        res.status(200).json({ success: true, count: fileCount });
    } catch (error) {
        console.error('Upload email error:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
