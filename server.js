const express = require('express');
const multer = require('multer');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Multer
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// ✅ EMAIL TRANSPORTER
const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Form handler
app.post('/api/intake', upload.single('file'), async (req, res) => {
    try {
        const { name, email, phone, service, message } = req.body;
        const fileInfo = req.file ? req.file.filename : null;

        // 1️⃣ ADMIN EMAIL (You receive this)
        const adminEmail = {
            from: `"ProDocs" <${process.env.EMAIL_USER}>`,
            to: process.env.ADMIN_EMAIL,
            replyTo: email,
            subject: `🆕 New ${service} Request - ${name}`,
            html: `
                <div style="font-family: Arial; max-width: 600px;">
                    <h2>📥 New Client Request</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr><td><strong>Name:</strong></td><td>${name}</td></tr>
                        <tr><td><strong>Email:</strong></td><td>${email}</td></tr>
                        <tr><td><strong>Phone:</strong></td><td>${phone}</td></tr>
                        <tr><td><strong>Service:</strong></td><td>${service}</td></tr>
                        ${message ? `<tr><td><strong>Message:</strong></td><td>${message}</td></tr>` : ''}
                        ${fileInfo ? `<tr><td><strong>File:</strong></td><td>${fileInfo}</td></tr>` : ''}
                    </table>
                    <hr>
                    <p><em>Reply to this email to contact client directly</em></p>
                </div>
            `
        };

        // 2️⃣ CLIENT CONFIRMATION
        const clientEmail = {
            from: `"ProDocs Compliance" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '✅ Quote Request Received - ProDocs',
            html: `
                <div style="font-family: Arial; max-width: 500px;">
                    <h2>🎉 Thank You ${name}!</h2>
                    <p>Your <strong>${service}</strong> request has been received.</p>
                    <p><strong>⏰ Next Steps:</strong></p>
                    <ul>
                        <li>📞 We'll call you within <strong>24 hours</strong></li>
                        <li>💰 Free quote prepared</li>
                        <li>🚀 Fast processing guaranteed</li>
                    </ul>
                    <p>Best,<br><strong>ProDocs Team</strong></p>
                </div>
            `
        };

        // Send emails
        await Promise.all([
            transporter.sendMail(adminEmail),
            transporter.sendMail(clientEmail)
        ]);

        console.log(`✅ EMAILS SENT: ${name} (${service})`);

        res.json({ success: true, message: '✅ Request sent! Check your email.' });
    } catch (error) {
        console.error('❌ Email Error:', error.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));
app.get('/health', (req, res) => res.json({ status: 'OK' }));

app.listen(PORT, () => {
    console.log(`🚀 ProDocs running: http://localhost:${PORT}`);
});
