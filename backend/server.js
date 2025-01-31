const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

const pool = new Pool({
  user: process.env.DB_USER,
  host: 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: 5432,
});

app.use(cors());
app.use(express.json());

// Set up multer storage configuration for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Specify the folder to save the images
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Use current timestamp as filename
  },
});

const upload = multer({ storage: storage });

// API endpoint to create a new thread with image upload
app.post('/api/threads', upload.single('image'), async (req, res) => {
  const { title, content } = req.body;
  const image = req.file ? req.file.filename : null; // Get the filename of the uploaded image (if any)

  try {
    // Insert thread data into the database, including the image filename if available
    const result = await pool.query(
      'INSERT INTO threads (title, content, image) VALUES ($1, $2, $3) RETURNING *',
      [title, content, image]
    );
    
    res.status(201).json(result.rows[0]); // Return the created thread details
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating thread' });
  }
});

// Serve static files (images) from the "uploads" folder
app.use('/uploads', express.static('uploads'));

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

