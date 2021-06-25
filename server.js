const express = require('express');
const app = express();
const db = require('./datasource.js');
const bodyParser = require('body-parser');
const alert = require('alert');

app.use(express.static('./client'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('views', __dirname);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.listen(3000, () => {
  console.log('App Server Started at port 3000. Browse your api on http://localhost:3000');
});
var checkInDate, checkedOutDate;

app.post('/enquireAboutVillas', (req, res) => {
  checkInDate = req.body.checkedInDate;
  checkedOutDate = req.body.checkedOutDate;
  if (checkInDate && checkedOutDate && checkDateFormat(checkInDate) && checkDateFormat(checkedOutDate)) {
    return new Promise((resolve, reject) => {
      fetchAllVillasForAGivenDateRange(checkInDate, checkedOutDate)
        .then((data) => {
          return resolve(res.render(__dirname + "/client/main.html", { data: JSON.parse(JSON.stringify(data)) }));
        })
        .catch((err) => {
          console.log('err:', err);
          return reject(res.send('Not Perfect'));
        });
    })
  } else {
    console.log('The Dates Selected Are Not In YYYY-MM-DD format');
    alert("Either of checkin or checkout date is not in YYYY-MM-DD format. Automatically redirecting you to the home page Please enter correct date");
    res.redirect('http://localhost:3000');
  }
  res.end();
});

app.get('/bookAVilla/:uniqueId', (req, res) => {
  return new Promise((resolve, reject) => {
    fetchVillaDetailsForUniqueId(req.params.uniqueId)
      .then((data) => {
        let calculatedRate = calculateRateOfStay(data[0]['average_price_per_night'], checkInDate, checkedOutDate);
        data.forEach((result) => {
          result.calculatedRate = calculatedRate;
        });
        console.log('data[0]:', data[0]);
        return resolve(res.render(__dirname + "/client/booking.html", { data: JSON.parse(JSON.stringify(data[0])) }));
      })
      .catch((err) => {
        console.log('err:', err);
        return reject(res.send('Not Perfect'));
      })
  })
});

function checkDateFormat(dateString) {
  var regEx = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateString.match(regEx)) return false;  // Invalid format
  var d = new Date(dateString);
  var dNum = d.getTime();
  if (!dNum && dNum !== 0) return false; // NaN value, Invalid date
  return d.toISOString().slice(0, 10) === dateString;
}

function fetchAllVillasForAGivenDateRange(startDate, endDate) {
  return new Promise((resolve, reject) => {
    let fetchingQuery = `SELECT vm.name as villaName,vd.average_price_per_night,s.name as stateName,c.name as cityName,vm.unique_id as uniqueVillaId from lohono_stays.villa_master vm
    inner join lohono_stays.villa_details vd on vd.fk_id_villa_master = vm.id 
    inner join lohono_stays.state s on s.id = vd.fk_id_state
    inner join lohono_stays.city c on c.id = vd.fk_id_city
      WHERE  ((check_in_date <= (?) AND check_out_date >= (?))
             OR (check_in_date < (?) AND check_out_date >= (?) )
             OR ((?) <= check_in_date AND (?) >= check_out_date))`;
    db.query(fetchingQuery, [startDate, startDate, endDate, endDate, startDate, endDate], function (err, data) {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    })
  })
}

function fetchVillaDetailsForUniqueId(uniqueId) {
  return new Promise((resolve, reject) => {
    let fetchingQuery = `SELECT vm.name as villaName,vd.average_price_per_night,s.name as stateName,c.name as cityName from lohono_stays.villa_master vm
    inner join lohono_stays.villa_details vd on vd.fk_id_villa_master = vm.id 
    inner join lohono_stays.state s on s.id = vd.fk_id_state
    inner join lohono_stays.city c on c.id = vd.fk_id_city
      WHERE  vm.unique_id = (?)`;
    db.query(fetchingQuery, [uniqueId], function (err, data) {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    })
  })
}

function calculateRateOfStay(pricePerNight, checkInDate, checkedOutDate) {
  let diffDays = Math.ceil(Math.abs(new Date(checkedOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24));
  console.log('diffDays:', diffDays);
  let totalPriceForStay = pricePerNight * diffDays + ((18 * pricePerNight * diffDays) / 100);
  return totalPriceForStay;
}
