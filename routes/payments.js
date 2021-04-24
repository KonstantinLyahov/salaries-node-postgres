var express = require('express');
var router = express.Router();

router.get('/logs', function(req, res) {
    req.client.query("SELECT payments_logs.*, to_char(paid_date, 'DD.MM.YYYY HH24:MI') as paid_date, employees.fullname FROM payments_logs INNER JOIN employees ON employees.id=payments_logs.employee_id")
        .then(result => res.render('payments/logs', { logs: result.rows }));
});

router.get('/monthly-statements', async function(req, res) {
    var viewData = {};
    if(Object.keys(req.query).length !== 0) {
        var result = await req.client.query("SELECT *,  to_char(paid_date, 'DD.MM.YYYY') as paid_date, fullname FROM payments INNER JOIN employees ON employees.id=payments.employee_id WHERE year=$1 AND month=$2", [req.query.year, req.query.month]);
        viewData.monthlyStatement = result.rows;
        viewData.year = req.query.year;
        viewData.month = req.query.month;
    }
    return res.render('payments/monthlyStatement', viewData);
});

router.get('/:employeeId', function(req, res) {
    var viewData = {};
    req.client.query('SELECT fullname FROM employees WHERE id=$1', [req.params.employeeId])
        .then(result => {
            viewData.fullname = result.rows[0].fullname;
            return req.client.query("SELECT *,  to_char(paid_date, 'DD.MM.YYYY') as paid_date FROM payments WHERE employee_id=$1 ORDER BY year DESC, month DESC", [req.params.employeeId])
        })
        .then(result => {
            viewData.payments = result.rows;
            res.render('payments/employee', viewData);
        });
});

router.post('/:employeeId', function(req, res) {
    req.client.query('SELECT id FROM payments WHERE employee_id=$1 AND year=$2 AND month=$3', [req.params.employeeId, req.body.year, req.body.month])
        .then(result => {
            if(result.rows.length === 0) {
                return req.client.query('INSERT INTO payments(employee_id, year, month, paid) VALUES($1, $2, $3, $4)', [req.params.employeeId, req.body.year, req.body.month, req.body.paid]);
            }
            return req.client.query('UPDATE payments SET paid=$1, paid_date=NOW() WHERE id=$2', [req.body.paid, result.rows[0].id]);
        })    
        .then(() => res.redirect('back'));
});


module.exports = router;
