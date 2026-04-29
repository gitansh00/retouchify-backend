const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// --- 1. SETUP: FILE UPLOAD STORAGE ---
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

// --- 2. ROUTE: CONTACT FORM & AUTO-REPLY ---
app.post('/send-message', async (req, res) => {
    const { name, email, service, budget, message } = req.body;

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
        console.error(error);
        res.status(500).json({ success: false });
    }
});

// --- 3. ROUTE: QUICK PHOTO UPLOAD ---
app.post('/upload', upload.array('photos', 10), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: 'No files uploaded.' });
    }
    res.status(200).json({ success: true, count: req.files.length });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
// Add this simple test route
app.get('/', (req, res) => {
    res.send('Retouchify Backend is officially live and running!');
});