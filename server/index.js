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

const keyboard = {
  'q': 'й',
  'w': 'ц',
  'e': 'у',
  'r': 'к',
  't': 'е',
  'y': 'н',
  'u': 'г',
  'i': 'ш',
  'o': 'щ',
  'p': 'з',
  '[': 'х',
  ']': 'ъ',
  'a': 'ф',
  's': 'ы',
  'd': 'в',
  'f': 'а',
  'g': 'п',
  'h': 'р',
  'j': 'о',
  'k': 'л',
  'l': 'д',
  ';': 'ж',
  '\'': 'э',
  'z': 'я',
  'x': 'ч',
  'c': 'с',
  'v': 'м',
  'b': 'и',
  'n': 'т',
  'm': 'ь',
  ',': 'б',
  '.': 'ю',
  '/': '.',
};

const getUserDataByID = async (id) => {
  return { id }
};

const strategy = new passportJWT.Strategy(
  {
    // jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
    jwtFromRequest: passportJWT.ExtractJwt.fromExtractors([
      passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
      passportJWT.ExtractJwt.fromUrlQueryParameter('jwt'),
    ]),
    secretOrKey: secret,
  },
  (jwtPayload, done) => getUserDataByID(jwtPayload.sub)
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
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/user', async (req, res) => {
  res.send("🤵🏻");
});

app.get('/api/user/info', auth, async (req, res) => {
  res.json({
    ...req.user,
    // ...info,
    token: issueToken(req.user),
  });
});


app.post('/api/user/login', async (req, res) => {
  const userData = (req.body.email === process.env.APPUSER && req.body.password === process.env.APPPWD) ? { id: 1 } : null;
  console.log("userData", userData, req.body.email, process.env.APPUSER, req.body.password, process.env.APPPWD);
  if (userData && Object.keys(userData).length && !userData?.error) {
    console.log(req.body.email, '<SUCCESS>');
    res.json({
      ...userData,
      token: issueToken(userData),
    });
  } else {
    console.log(`login attempt as [${req.body.email}]•[${req.body.password}]►${userData.error}◄`);
    res.json(userData);
  }
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


app.get('/api/suggestions', auth, async (req, res) => {

  const term = req.query.id;

  const data = await db.all("select id, title, lid from triple where inform like '" + term + "' LIMIT 3");

  const ids = data.map(x => x.id);
  const data2 = await db.all(`select id, title, lid from triple where inform like '${term}%' AND id not in (${ids.join(',')}) LIMIT 2`);

  const ids2 = data2.map(x => x.id);

  const data3 = await db.all(`select id, title, lid from triple where insimple like '${term}%' and id not in (${[...ids, ...ids2].join(',')}) LIMIT 3`);

  const ids3 = data3.map(x => x.id);

  const data4 = await db.all(`select id, title, lid from triple where insimple like '${term}%' and id not in (${[...ids, ...ids2, ...ids3].join(',')})  LIMIT 2`);

  const ids4 = data4.map(x => x.id);

  const mapped = [...term].map(x => keyboard?.[x] || x).join('');
  console.log('mapped', mapped);

  const data5 = await db.all(`select id, title, lid from triple where insimple like '${mapped}%' and id not in (${[...ids, ...ids2, ...ids3, ...ids4].join(',')})  LIMIT 2`);

  const result = [].concat.apply([], [data, data2, data3, data4, data5]).filter((obj1, i, arr) =>
    arr.findIndex(obj2 => (obj2.id === obj1.id)) === i
  );
  // console.log(result);
  res.json(result);
});

app.get('/api/item', auth, async (req, res) => {
  const id = req.query.id;
  const data = await db.all("select * from triple where id = " + id);
  res.json(data);
});

app.get('/api/items', auth, async (req, res) => {
  const ids = req.query.ids;
  console.log('ids', ids);
  const data = await db.all(`select * from triple where id IN (${ids.join(',')})`);
  res.json(data);
});

app.listen(port);
console.log(`Backend is at port ${port}`);
