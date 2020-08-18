const express = require('express');
const router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('Respond with a resource');
});

router.get('/axe', (req, res, next) => {
  res.send('There is no team in Axe!!!');
});

module.exports = router;