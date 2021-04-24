var express = require('express');
var router = express.Router();


router.get('/', function (req, res) {
    req.client.query("SELECT employees.id, employees.fullname, to_char(employees.birth_date, 'DD.MM.YYYY') as birth_date, proffessions.name FROM employees INNER JOIN proffessions on employees.proffession_id = proffessions.id")
        .then(result => res.render('employees/index', { employees: result.rows }));
});

router.get('/deleted', function (req, res) {
    res.set({
        'Location': '/employees'
    });
    res.download('./deletedEmployees.zip');
});

router.get('/create', function (req, res) {
    req.client.query('SELECT * FROM proffessions')
        .then(result => res.render('employees/create', { proffessions: result.rows }));
});

router.post('/create', function (req, res) {
    req.client.query('SELECT department FROM proffessions_departments WHERE proffession_id=$1', [req.body.proffession])
        .then(result => req.client.query(`INSERT INTO employees_${result.rows[0].department}(fullname, birth_date, proffession_id) VALUES($1, $2, $3) RETURNING id`, [req.body.fullname, req.body.birth_date, req.body.proffession]))
        .then(result => {
            res.redirect('/employees/' + result.rows[0].id)
        });
});


router.get('/:employeeId', function (req, res) {
    req.client.query("SELECT employees.id, employees.fullname, to_char(employees.birth_date, 'DD.MM.YYYY') as birth_date, proffessions.name, payment_per_hour FROM employees INNER JOIN proffessions on employees.proffession_id = proffessions.id  INNER JOIN tariffes ON employees.proffession_id=tariffes.proffession_id WHERE employees.id=$1", [req.params.employeeId])
        .then(result => res.render('employees/employee', { employee: result.rows[0] }));
});

router.get('/:employeeId/accounting', function (req, res) {
    req.client.query('SELECT department FROM proffessions_departments WHERE proffession_id=(SELECT proffession_id FROM employees WHERE id=$1)', [req.params.employeeId])
        .then(result => req.client.query(`SELECT * FROM accounting_${result.rows[0].department} WHERE employee_id=$1 ORDER BY year DESC, month DESC`,[req.params.employeeId]))
        .then(result => {
            res.render('employees/accounting', { accounting: result.rows, employee_id: req.params.employeeId })
        });
});

router.post('/:employeeId/accounting', function (req, res) {
    req.client.query('SELECT department FROM proffessions_departments WHERE proffession_id=(SELECT proffession_id FROM employees WHERE id=$1)', [req.params.employeeId])
        .then(result => req.client.query(`INSERT INTO accounting_${result.rows[0].department} (year, month, hours, employee_id) SELECT $1, $2, $3, $4 WHERE NOT EXISTS(SELECT FROM accounting_${result.rows[0].department} WHERE employee_id=$4 AND year=$1 AND month=$2)`, [req.body.year, req.body.month, req.body.hours, req.params.employeeId]))
        .then(() => res.redirect('back'))
});

router.get('/:employeeId/delete', function (req, res) {
    var archiver = require('../helpers/archiver');
    req.client.query("SELECT employees.id, employees.fullname, proffessions.name as proffession, to_char(employees.birth_date, 'DD.MM.YYYY') as birth_date FROM employees INNER JOIN proffessions on employees.proffession_id = proffessions.id WHERE employees.id=$1", [req.params.employeeId])
        .then(result => {
            var deletingEmployee = result.rows[0];
            archiver.addFileToZip(JSON.stringify(deletingEmployee, null, 1), `deleted_employee_${deletingEmployee.id}.json`, 'deletedEmployees.zip');
        })
        .then(() => req.client.query('DELETE FROM employees WHERE id=$1', [req.params.employeeId]))
        .then(() => res.redirect('/employees'));
});

module.exports = router;
