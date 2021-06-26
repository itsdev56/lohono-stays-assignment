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

app.get('/enquireAboutVillas', (req, res) => {
  checkInDate = req.query.checkInDate;
  checkedOutDate = req.query.checkOutDate;
  if (checkInDate && checkedOutDate && (checkInDate < checkedOutDate)) {
    return new Promise((resolve, reject) => {
      fetchAllVillasForAGivenDateRange(checkInDate, checkedOutDate)
        .then((data) => {
          return resolve(res.render(__dirname + "/client/main.html", { data: JSON.parse(JSON.stringify(data)) }));
        })
        .catch((err) => {
          return reject(res.send('Error In Booking the villa. Please contact Support Team'));
        });
    })
  } else {
    console.log('The Check In Date cannot be same or after Check Out Date');
    alert("The Check In Date cannot be same or after Check Out Date. Automatically redirecting you to the home page Please enter correct date");
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
          result.checkInDate = checkInDate;
          result.checkedOutDate = checkedOutDate;
          result.uniqueId = req.params.uniqueId;
        });
        return resolve(res.render(__dirname + "/client/booking.html", { data: JSON.parse(JSON.stringify(data[0])) }));
      })
      .catch((err) => {
        return reject(res.send('Error In Booking the villa. Please contact Support Team'));
      })
  })
});

app.get('/createBooking/:uniqueId', (req, res) => {
  return new Promise((resolve, reject) => {
    updateBookingRecord(req.params.uniqueId)
      .then(() => {
        return resolve(res.render(__dirname + "/client/finalBooking.html"));
      })
      .catch((err) => {
        return reject(res.send('Error In Booking the villa. Please contact Support Team'));
      })
  })
});

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

function updateBookingRecord(uniqueId, checkInDate, checkOutDate) {
  return new Promise((resolve, reject) => {
    let updateQuery = `Update lohono_stays.villa_details set check_in_date=(?),check_out_date=(?),fk_id_booked_by_user=(?)
    where fk_id_villa_master = (select id from lohono_stays.villa_master where unique_id=(?))`;
    //here i am passing 1 because its assumed the booking is done for first user this can be changed once authentication/login is enabled
    db.query(updateQuery, [checkInDate, checkOutDate, uniqueId, 1], function (err, data) {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    })
  })
}

function calculateRateOfStay(pricePerNight, checkInDate, checkedOutDate) {
  let diffDays = Math.ceil(Math.abs(new Date(checkedOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24));
  let totalPriceForStay = pricePerNight * diffDays + ((18 * pricePerNight * diffDays) / 100);
  return totalPriceForStay;
}
