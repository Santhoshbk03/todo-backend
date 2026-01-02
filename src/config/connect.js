import {Pool } from "pg"



const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD), 
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  ssl: {
    require: true,
    rejectUnauthorized: false, // REQUIRED for Neon
  },
});



// pool.on("connect",()=>{
//     console.log("pg connected")
// })


pool.on("error",()=>{
    console.log("pg error");
})


export default pool;