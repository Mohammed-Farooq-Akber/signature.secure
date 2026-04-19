const express = require('express');
const multer = require('multer');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Multer file upload config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/') || 
            file.mimetype === 'application/pdf' || 
            file.mimetype.includes('document')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }
});

// Email transporter (Render environment vars)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/intake', upload.single('file'), async (req, res) => {
    try {
        const { name, email, phone, service, message } = req.body;
        const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;

        // Email data
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL || 'admin@prodocs.com',
            replyTo: email,
            subject: `New Intake Form: ${service}`,
            html: `
                <h2>New Client Request</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                <p><strong>Service:</strong> ${service}</p>
                ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
                ${fileUrl ? `<p><strong>File:</strong> <a href="${fileUrl}">Download</a></p>` : ''}
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        // Client confirmation
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Thank You! ProDocs Quote Request Received',
            html: `
                <h2>? Request Received!</h2>
                <p>Hi ${name},</p>
                <p>Thank you for contacting ProDocs. We've received your request for <strong>${service}</strong>.</p>
                <p>Our team will contact you within <strong>24 hours</strong> with your free quote.</p>
                <p>Best regards,<br>ProDocs Team</p>
            `
        });

        res.json({ success: true, message: 'Request processed successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`?? Server running on port ${PORT}`);
    console.log(`?? Frontend: http://localhost:${PORT}`);
    console.log(`?? Health: http://localhost:${PORT}/health`);
});