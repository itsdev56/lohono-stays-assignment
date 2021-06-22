const db = require('../datasource.js');

db.connect(function (err) {
  if (err) {
    return process.exit(1);
  }
  console.log("Connected!");
  createDatabase()
    .then(() => {
      console.log("Creating Villa Master");
      return createVillaMaster();
    })
    .then(() => {
      console.log("Creating State Master");
      return createStateMaster();
    })
    .then(() => {
      console.log("Creating Villa Details");
      return createVillaDetails();
    })
    .then(() => {
      console.log("Done creating all the tables");
      console.log("Syncing State Data");
      return createStateData();
    })
    .then(() => {
      return process.exit(0);
    })
    .catch(() => {
      return process.exit(1);
    });
});

function createDatabase() {
  return new Promise((resolve, reject) => {
    let createDatabaseSql = `CREATE DATABASE IF NOT EXISTS lohono_stays`;
    db.query(createDatabaseSql, function (err) {
      if (err) {
        return reject(err);
      }
      console.log("Database created");
      return resolve();
    })
  })
}

function createVillaMaster() {
  return new Promise((resolve, reject) => {
    let createTableSql = `CREATE TABLE IF NOT EXISTS lohono_stays.villa_master (
      id int(11) NOT NULL AUTO_INCREMENT,
      name varchar(255) NOT NULL,
      unique_id varchar(30) NOT NULL,
      created_date datetime NOT NULL,
      last_modified_date datetime NOT NULL,
      PRIMARY KEY(id))`;
    db.query(createTableSql, function (err) {
      if (err) {
        return reject(err);
      }
      console.log("Table Villa Master created successfully");
      return resolve();
    })
  })
}

function createStateMaster() {
  return new Promise((resolve, reject) => {
    let createTableSql = `CREATE TABLE IF NOT EXISTS lohono_stays.state (
      id int(11) NOT NULL AUTO_INCREMENT,
      name varchar(255) NOT NULL,
      state_code varchar(30) NOT NULL,
      created_date datetime NOT NULL,
      last_modified_date datetime NOT NULL,
      PRIMARY KEY(id))`;
    db.query(createTableSql, function (err) {
      if (err) {
        return reject(err);
      }
      console.log("State Master created successfully");
      return resolve();
    })
  })
}

function createVillaDetails() {
  return new Promise((resolve, reject) => {
    let createTableSql = `CREATE TABLE IF NOT EXISTS lohono_stays.villa_details (
      id int(11) NOT NULL AUTO_INCREMENT,
      address varchar(1024) NOT NULL,
      calendar_start_date datetime NOT NULL,
      calendar_end_date datetime NOT NULL,
      check_in_date datetime DEFAULT NULL,
      check_out_date datetime DEFAULT NULL,
      is_available tinyint(1) NOT NULL,
      created_date datetime NOT NULL,
      last_modified_date datetime NOT NULL,
      average_price_per_night decimal(25,10) NOT NULL,
      fk_id_state int(11) DEFAULT NULL,
      fk_id_villa_master int(11) DEFAULT NULL,
      PRIMARY KEY(id),
      KEY fkidx_villa_details_state_fk_id_state(fk_id_state),
      KEY fkidx_villa_details_villa_master_fk_id_villa_master(fk_id_villa_master),
      CONSTRAINT fkidx_villa_details_state_fk_id_state FOREIGN KEY(fk_id_state) REFERENCES state(id),
      CONSTRAINT fkidx_villa_details_villa_master_fk_id_villa_master FOREIGN KEY(fk_id_villa_master) REFERENCES villa_master(id)
      )`;
    db.query(createTableSql, function (err) {
      if (err) {
        return reject(err);
      }
      console.log("Villa Details created successfully");
      return resolve();
    })
  })
}

function createStateData() {
  return new Promise((resolve, reject) => {
    let createDataSql = `INSERT INTO lohono_stays.state (id, name, state_code, created_date, last_modified_date)
    VALUES
      (1, 'Andaman & Nicobar','AN', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (2, 'Andhra Pradesh','AP', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (3, 'Arunachal Pradesh', 'AR', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (4, 'Assam', 'AS', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (5, 'Bihar', 'BH', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (6, 'Chandigarh', 'CH', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (7, 'Chattisgarh', 'CG', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (8, 'Dadra and Nagar Haveli', 'DN', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (9, 'Daman & Diu', 'DD', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (10, 'Delhi', 'DL', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (11, 'Goa', 'GO', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (12, 'Gujarat', 'GU', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (13, 'Haryana','HR', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (14, 'Himachal Pradesh', 'HP', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (15, 'Jammu & Kashmir', 'JK', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (16, 'Jharkhand', 'JH', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (17, 'Karnataka', 'KA', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (18, 'Kerala', 'KL', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (19, 'Lakshadweep', 'LD', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (20, 'Madhya Pradesh', 'MP', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (21, 'Maharashtra', 'MH', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (22, 'Manipur', 'MN', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (23, 'Meghalaya', 'ME', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (24, 'Mizoram', 'MZ', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (25, 'Nagaland', 'NA', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (26, 'Orissa', 'OR', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (27, 'Pondicherry', 'PO', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (28, 'Punjab', 'PB', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (29, 'Rajasthan', 'RJ', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (30, 'Sikkim', 'SK',  '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (31, 'Tamil Nadu', 'TN', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (32, 'Tripura', 'TR','2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (33, 'Uttar Pradesh', 'UP', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (34, 'Uttarakhand', 'UC', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (35, 'West Bengal', 'WB', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (36, 'Others', 'XX', '2021-04-05 08:24:30', '2021-04-05 08:24:30'),
      (37, 'Telangana', 'TG', '2021-04-05 08:24:30', '2021-04-05 08:24:30');
    `;
    db.query(createDataSql, function (err) {
      if (err) {
        console.log('err:', err);
        return reject(err);
      }
      console.log("State Master Data Synced successfully");
      return resolve();
    })
  })
}
