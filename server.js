const express = require('express');
const app = express();
const db = require('./datasource.js');
const bodyParser = require('body-parser');
const moment = require('moment-timezone');
const alert = require('alert');

app.use(express.static('./client'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.listen(3000, () => {
  console.log('App Server Started at port 3000. Browse your api on http://localhost:3000');
});

app.post('/enquireAboutVillas', (req, res) => {
  if (checkDateFormat(req.body.checkedInDate) && checkDateFormat(req.body.checkedOutDate)) {
    res.send('PERFECT');
  } else {
    console.log('The Dates Selected Are Not In DD/MM/YYYY format');
    alert("Either of checkin or checkout date is not in DD/MM/YYYY format. Automatically redirecting you to the home page Please enter correct date");
    res.redirect('http://localhost:3000');
  }
  res.end();
});
app.get('/getVillaList', (req, res) => {
  let hotelList = [];
  let fetchingQuery = `select vd.average_price_per_night from lohono_stays.villa_master v
    inner join lohono_stays.villa_details vd on vd.fk_id_villa_master = v.id
    where vd.is_available = 1`;
  db.query(fetchingQuery, function (err, data) {
    if (err) {
      console.log('Internal Server Error. Please contact Support for resolution');
      res.status(500).send("Internal Server Error. Please contact Support for resolution");
      return;
    }
    hotelList = data;
    res.send(hotelList);
  })
});

function checkDateFormat(testDate) {
  let date_regex = /^(0[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2])\/(19|20)\d{2}$/;
  if (!(date_regex.test(testDate))) {
    return false;
  } else {
    return true;
  }
}
