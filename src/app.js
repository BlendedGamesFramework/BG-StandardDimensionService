import logger from 'morgan';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors'

//Routes
import standard_attributes from './routes/standard_attributes';

const app = express();

//Middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors())

//Routes
app.use(standard_attributes);

export default app;