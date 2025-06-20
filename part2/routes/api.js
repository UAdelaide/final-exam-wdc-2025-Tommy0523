const express = require('express');
const router = express.Router();
const db = require('../models/db');

// Route for /api/dogs
router.get('/dogs', async (req, res) => {
  try {
    // 修复：查询中增加了 WHERE u.role = 'owner' 子句，
    // 以确保我们只获取"主人"用户的狗，而不是其他角色（如遛狗师）的狗。
    const [dogs] = await db.execute(`
      SELECT d.name as dog_name, d.size, u.username as owner_username
      FROM Dogs d
      JOIN Users u ON d.owner_id = u.user_id
      WHERE u.role = 'owner'
    `);
    res.json(dogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dogs' });
  }
});

// Route for /api/walkrequests/open
router.get('/walkrequests/open', async (req, res) => {
  try {
    const [requests] = await db.execute(`
      SELECT wr.request_id, d.name as dog_name, wr.requested_time, wr.duration_minutes, wr.location, u.username as owner_username
      FROM WalkRequests wr
      JOIN Dogs d ON wr.dog_id = d.dog_id
      JOIN Users u ON d.owner_id = u.user_id
      WHERE wr.status = 'open'
    `);
    res.json(requests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch open walk requests' });
  }
});

// Route for /api/walkers/summary
router.get('/walkers/summary', async (req, res) => {
  try {
    const [walkers] = await db.execute(`
      SELECT
          u.username AS walker_username,
          COALESCE(walkers_ratings.total_ratings, 0) as total_ratings,
          walkers_ratings.average_rating,
          COALESCE(completed_walks.completed_walks, 0) as completed_walks
      FROM
          Users u
      LEFT JOIN
          (SELECT walker_id, COUNT(rating_id) as total_ratings, AVG(rating) as average_rating FROM WalkRatings GROUP BY walker_id) AS walkers_ratings
          ON u.user_id = walkers_ratings.walker_id
      LEFT JOIN
          (SELECT wa.walker_id, COUNT(wa.application_id) as completed_walks FROM WalkApplications wa JOIN WalkRequests wr ON wa.request_id = wr.request_id WHERE wa.status = 'accepted' AND wr.status = 'completed' GROUP BY wa.walker_id) AS completed_walks
          ON u.user_id = completed_walks.walker_id
      WHERE u.role = 'walker'
    `);
    res.json(walkers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch walkers summary' });
  }
});

module.exports = router; 