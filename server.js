require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: 'https://master.d2y7qdqxb791h5.amplifyapp.com/',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://Jo:jovalentine@cluster0.h3rzjti.mongodb.net/py?retryWrites=true&w=majority&appName=Cluster0";
const COLLECTION_NAME = process.env.COLLECTION_NAME || "py1";

// Contact Schema
const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  age: {
    type: Number,
    min: [0, 'Age must be at least 0'],
    max: [120, 'Age cannot exceed 120']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, 'Please enter a valid phone number']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  }
}, { timestamps: true });

const Contact = mongoose.model('Contact', contactSchema, COLLECTION_NAME);

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Routes
app.get('/items', async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json({
      status: 'success',
      results: contacts.length,
      data: contacts
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch contacts',
      error: err.message
    });
  }
});

app.post('/items', async (req, res) => {
  try {
    const { name, email, age, phone, address } = req.body;
    
    // Basic validation
    if (!name || !email) {
      return res.status(400).json({
        status: 'fail',
        message: 'Name and email are required'
      });
    }

    const newContact = await Contact.create({
      name,
      email,
      age: age || null,
      phone: phone || null,
      address: address || null
    });

    res.status(201).json({
      status: 'success',
      data: newContact
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        status: 'fail',
        message: 'Email already exists'
      });
    }
    res.status(400).json({
      status: 'error',
      message: 'Failed to create contact',
      error: err.message
    });
  }
});

app.put('/items/:id', async (req, res) => {
  try {
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({
        status: 'fail',
        message: 'Contact not found'
      });
    }

    res.json({
      status: 'success',
      data: contact
    });
  } catch (err) {
    res.status(400).json({
      status: 'error',
      message: 'Failed to update contact',
      error: err.message
    });
  }
});

app.delete('/items/:id', async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({
        status: 'fail',
        message: 'Contact not found'
      });
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete contact',
      error: err.message
    });
  }
});

// Health Check
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Contacts API is running',
    timestamp: new Date()
  });
});

// Error Handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
});

// Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📁 Collection: ${COLLECTION_NAME}`);
});
