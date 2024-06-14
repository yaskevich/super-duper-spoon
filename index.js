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
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const __package = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

// environment variables
const port = process.env.PORT || 8080;
const secret = process.env.SECRET;
const appName = __package?.name || String(port);

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
app.use(history());
app.use(express.static('public'));

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


app.get('/api/places/:id', auth, async (req, res) => {
  const data = await db.getFromPlaces(req.user, req.params.id, req.query);
  if (req.query.id) {
    const osmId = data['places']?.[0]?.['osm_node_id'];
    if (osmId) {
      data['places'][0]['osm'] = await db.getOSMdata(osmId);
    }
  } else {
    data["stats"] = await db.getStats()
  }
  res.json(data);
});

app.listen(port);
console.log(`Backend is at port ${port}`);
