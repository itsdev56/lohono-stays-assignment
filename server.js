const express = require('express');
const app = express();
const db = require('./datasource.js');
const bodyParser = require('body-parser');
const alert = require('alert');
const moment = require('moment-timezone');

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
  let finalRenderingData = [];
  if (checkInDate && checkedOutDate && (checkInDate < checkedOutDate)) {
    return new Promise((resolve, reject) => {
      fetchAllVillasForAGivenDateRange(checkInDate, checkedOutDate)
        .then((allInformations) => {
          let groupedByMap = allInformations.reduce((r, a) => {
            r[a.uniqueVillaId] = [...r[a.uniqueVillaId] || [], a];
            a['check_in_date'] = moment(a['check_in_date']).format('YYYY-MM-DD');
            a['check_out_date'] = moment(a['check_out_date']).format('YYYY-MM-DD');
            return r;
          }, {});
          for (let key in groupedByMap) {
            groupedByMap[key][0].isAvailable = isVillaAvailble(checkInDate, checkedOutDate, groupedByMap[key]);
            finalRenderingData.push(groupedByMap[key][0]);
          }
          return resolve(res.render(__dirname + "/client/main.html", { data: JSON.parse(JSON.stringify(finalRenderingData)) }));
        })
        .catch((err) => {
          console.log('err:', err);
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
          result.address = result.address;
          result.duration = moment(checkedOutDate).diff(moment(checkInDate), 'days');
        });
        return resolve(res.render(__dirname + "/client/booking.html", { data: JSON.parse(JSON.stringify(data[0])) }));
      })
      .catch((err) => {
        console.log('err:', err);
        return reject(res.send('Error In Booking the villa. Please contact Support Team'));
      })
  })
});

app.get('/createBooking/:uniqueId', (req, res) => {
  return new Promise((resolve, reject) => {
    let uniqueIdForVilla = req.params.uniqueId;
    fetchVillaDetails(uniqueIdForVilla)
      .then((data) => {
        let villaDetailsId = data[0].id;
        return createBookingRecord(villaDetailsId);
      })
      .then(() => {
        return resolve(res.render(__dirname + "/client/finalBooking.html"));
      })
      .catch((err) => {
        console.log('err:', err);
        return reject(res.send('Error In Creating Booking for the villa. Please contact Support Team'));
      })
  })
});

function fetchAllVillasForAGivenDateRange(startDate, endDate) {
  return new Promise((resolve, reject) => {
    let fetchingQuery = `select vm.name as villaName,vd.address,vd.average_price_per_night,vm.unique_id as uniqueVillaId,
    c.name as cityName,s.name as stateName,vbd.check_in_date,vbd.check_out_date
    from lohono_stays.villa_master vm 
    left join lohono_stays.villa_details vd on vd.fk_id_villa_master = vm.id
    inner join lohono_stays.city c on vd.fk_id_city = c.id
    inner join lohono_stays.state s on vd.fk_id_state = s.id
    left join lohono_stays.villa_booking_details vbd on vbd.fk_id_villa_details = vd.id
    order by vbd.check_in_date ASC`;
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
    let fetchingQuery = `SELECT vm.name as villaName,vd.average_price_per_night,s.name as stateName,c.name as cityName,vd.address from lohono_stays.villa_master vm
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

function fetchVillaDetails(uniqueId) {
  return new Promise((resolve, reject) => {
    let fetchingQuery = `SELECT vd.id from lohono_stays.villa_master vm
    inner join lohono_stays.villa_details vd on vd.fk_id_villa_master = vm.id 
    WHERE  vm.unique_id = (?)`;
    db.query(fetchingQuery, [uniqueId], function (err, data) {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    })
  })
}

function createBookingRecord(villaDetailsId) {
  return new Promise((resolve, reject) => {
    let newDate = new Date();
    let createQuery = `INSERT INTO lohono_stays.villa_booking_details (created_date, last_modified_date, check_in_date,check_out_date,fk_id_booked_by_user,fk_id_villa_details,is_active)
    VALUES
      ((?),(?),(?),(?),(?),(?),(?))`;
    //here i am passing 1 in fk_id_booked_by_user because its assumed the booking is done for first user this can be changed once authentication/login is enabled
    db.query(createQuery, [newDate, newDate, checkInDate, checkedOutDate, 1, villaDetailsId, 1], function (err, data) {
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

function isVillaAvailble(requestedStart, requestedEnd, arrayOfDates) {
  return (arrayOfDates.reduce((prev, result) => {
    return prev && !isOverlaping(requestedStart, requestedEnd, result.check_in_date, result.check_out_date);
  }, true));
};
function isOverlaping(requestedStart, requestedEnd, bookedStart, bookedEnd) {
  if (bookedStart == null && bookedEnd == null) {
    return false;
  }
  if (requestedStart <= bookedStart && bookedStart < requestedEnd) {
    return true;
  }
  if (requestedStart < bookedEnd && bookedEnd <= requestedEnd) {
    return true;
  }
  if (bookedStart < requestedStart && requestedEnd < bookedEnd) {
    return true;
  }
  return false;
}
