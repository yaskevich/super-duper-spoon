import express from 'express';
import path, { dirname } from 'path';
import compression from 'compression';
import bodyParser from 'body-parser';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import passportJWT from 'passport-jwt';
import history from 'connect-history-api-fallback';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const __package = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

// environment variables
const port = process.env.PORT || 8080;
const secret = process.env.SECRET;
const appName = __package?.name || String(port);
const pathToDb = path.join(__dirname, process.env.DBPATH);

const db = await open({ filename: pathToDb, driver: sqlite3.cached.Database })

const strategy = new passportJWT.Strategy(
  {
    // jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
    jwtFromRequest: passportJWT.ExtractJwt.fromExtractors([
      passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
      passportJWT.ExtractJwt.fromUrlQueryParameter('jwt'),
    ]),
    secretOrKey: secret,
  },
  (jwtPayload, done) => db
    .getUserDataByID(jwtPayload.sub)
    .then((user) => done(null, user))
    .catch((err) => done(err))
);

const issueToken = (user) => jwt.sign(
  {
    iss: appName,
    sub: user.id,
    iat: new Date().getTime(),
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 1,
    // iat: Math.floor(Date.now() / 1000),
    // exp: new Date().setDate(new Date().getDate() + 1),
  },
  secret
);

passport.use(strategy);
const auth = passport.authenticate('jwt', { session: false });
const app = express();

app.use(compression());
app.set('trust proxy', 1);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(history());
app.use(express.static('public'));

app.get('/user', async (req, res) => {
  res.send("🤵🏻");
});

app.post('/api/user/login', async (req, res) => {
  // const userData = await db.getUserData(req.body.email, req.body.password);
  // if (userData && Object.keys(userData).length && !userData?.error) {
  //   console.log(req.body.email, '<SUCCESS>');
  //   res.json({
  //     ...userData,
  //     ...info,
  //     token: issueToken(userData),
  //   });
  // } else {
  //   console.log(`login attempt as [${req.body.email}]•[${req.body.password}]►${userData.error}◄`);
  //   res.json(userData);
  // }
});

app.get('/def.json', async (req, res) => {
  const data = await db.all("SELECT id, title FROM triple ORDER BY RANDOM() LIMIT 10");
  res.json(data);
});

app.get('/datum.json', async (req, res) => {
  const id = Object.keys(req.query).filter(x => Number(x))?.shift();
  const data = await db.all("select * from triple where id = " + id);
  res.json(data);
});

app.get('/data.json', async (req, res) => {
  
  const term = Object.keys(req.query)?.shift();
  // const id = Object.keys(req.query).filter(x => Number(x))?.shift();

  const data = await db.all("select id, title, lid from triple where inform like '" + term + "' LIMIT 3");

  const data2 = await db.all("select id, title, lid from triple where inform like '" + term + "%' LIMIT 2");

  const data3 = await db.all("select id, title, lid from triple where insimple like '" + term + "' LIMIT 3");

  const data4 = await db.all("select id, title, lid from triple where insimple like '" + term + "%' LIMIT 2");

  const result = [].concat.apply([], [data, data2, data3, data4]).filter((obj1, i, arr) =>
    arr.findIndex(obj2 => (obj2.id === obj1.id)) === i
  );

  // console.log(result);

  res.json(result);
});


app.listen(port);
console.log(`Backend is at port ${port}`);
