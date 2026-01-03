const express = require('express');
const router = express.Router();
const Hostel = require('../models/Hostel'); // Adjust the path to your Hostel model
const { protect } = require('../middleware/authMiddleware'); // Correctly import the 'protect' middleware

/**
 * @route   GET /api/hostels/:id
 * @desc    Get hostel details by ID
 * @access  Private (requires a valid token)
 */
router.get('/:id', protect, async (req, res) => {
  try {
    // Find the hostel in the database by the ID from the URL
    const hostel = await Hostel.findById(req.params.id).select('hostelName');

    if (!hostel) {
      // If no hostel is found, send a proper JSON 404 error
      return res.status(404).json({ msg: 'Hostel not found' });
    }

    // If found, send the hostel data back as JSON
    res.json(hostel);

  } catch (err) {
    console.error('Error fetching hostel by ID:', err.message);
    // Handle cases where the ID format is invalid
    if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Hostel not found' });
    }
    // General server error
    res.status(500).send('Server Error');
  }
});

// Make sure to export the router so it can be used in server.js
module.exports = router;
