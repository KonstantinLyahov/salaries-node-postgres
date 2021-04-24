var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', async function (req, res, next) {
	var date = new Date();
	var month = date.getMonth();
	var year = date.getFullYear();
	if (month == 0) {
		month = 12;
		year--;
	}
	req.client.query('select fullname from accounting inner join employees on employees.id = accounting.employee_id where year=$1 and month=$2 and hours<(select avg(hours) from accounting)', [year, month])
		.then(result => res.render('index', { employees: result.rows }));
});

module.exports = router;
