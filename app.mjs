import express from 'express';
const app = express();
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import cors from 'cors';
import dotenv from 'dotenv'
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { MongoMemoryServer } from 'mongodb-memory-server';
//securtiy
import helmet from 'helmet'
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize'
import xss from 'xss-clean';
import hpp from 'hpp';

dotenv.config();

import authorRoutes from './routes/authorRoutes.mjs';
import bookRoutes from './routes/bookRoutes.mjs';
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(morgan('dev'));

// Set security HTTP headers
app.use(helmet());
// Limit requests from same API
const limiter = rateLimit({
    max: 300,
    windowMs: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);


const db = process.env.mongoURI;
async function run() {
    if (process.env.NODE_ENV == "test") {
        const mongod = await MongoMemoryServer.create();
        const db = mongod.getUri();
        mongoose.connect(db).then(() => console.log('MongoMemoryServer connected')).catch((err) => console.log(err));

    } else {
        await mongoose.connect(db,
        ).then(() => console.log('  MongoDB connected ')).catch((err) => console.log(err));
    }
}
run()

const swaggerOptions = {
    swaggerDefinition: {
        info: {
            version: "1.0.0",
            title: "Qusai's Gallary API",
            contact: {
                name: "Qusai Tamer"
            }
        }
    },
    apis: ["./routes/*.mjs"]
};
const swaggerDocs = swaggerJsDoc(swaggerOptions);
// import swaggerPlugins from "./swagger/swaggerPlugins.mjs";
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
    // swaggerOptions: {
    //     plugins: [
    //         swaggerPlugins.DisableTryItOutPlugin
    //     ]
    // }
}))
// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());
//  for white list query parametars ...
app.use(hpp({
    whitelist: ['month', 'year', 'toExcel']
}));
const V = process.env.API_Virsion;

app.get('/', (req, res) => {
    return res.status(200).json({
        message: `welcome to Gallary *`
    });
});



app.use(`/api/${V}/author`, authorRoutes);
app.use(`/api/${V}/book`, bookRoutes);



app.all('*', (req, res, next) => {
    res.status(400).json({
        status: 'fail',
        message: `can't find ${req.originalUrl} in the server `
    });
});




export default app;